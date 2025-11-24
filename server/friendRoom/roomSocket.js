// server/friendRoom/roomSocket.js
// フレンド部屋のSocket.io処理

const { supabase } = require('../supabaseClient');

// フレンド部屋の状態管理（メモリ上）
const activeFriendRooms = new Map();

/**
 * フレンド部屋に参加（Socket.io）
 */
async function handleJoinFriendRoom(io, socket, data, callback, games) {
  const { roomId, userId, username } = data;

  console.log('[FriendRoom] Join request:', { roomId, userId, username });

  try {
    // Supabaseから部屋情報を取得
    const { data: room, error } = await supabase
      .from('friend_rooms')
      .select('*')
      .eq('id', roomId)
      .single();

    if (error || !room) {
      console.error('[FriendRoom] Room not found:', error);
      return callback({ success: false, error: '部屋が見つかりません' });
    }

    // 招待されているか確認
    const invitedFriends = room.invited_friends || [];
    const isCreator = room.creator_id === userId;
    const isInvited = invitedFriends.includes(userId);

    if (!isCreator && !isInvited) {
      return callback({ success: false, error: 'この部屋に参加する権限がありません' });
    }

    // 部屋の状態を初期化（初回のみ）
    if (!activeFriendRooms.has(roomId)) {
      activeFriendRooms.set(roomId, {
        roomId,
        config: room.room_config,
        players: [],
        status: 'waiting',
        createdAt: Date.now()
      });
    }

    const friendRoom = activeFriendRooms.get(roomId);

    // 既に参加済みか確認
    const alreadyJoined = friendRoom.players.find(p => p.userId === userId);
    if (alreadyJoined) {
      return callback({ success: false, error: '既に参加しています' });
    }

    // 部屋が満員か確認
    if (friendRoom.players.length >= 3) {
      return callback({ success: false, error: '部屋が満員です' });
    }

    // プレイヤーを追加
    const playerIndex = friendRoom.players.length;
    friendRoom.players.push({
      socketId: socket.id,
      userId,
      username,
      playerIndex,
      ready: false
    });

    // Socket.ioのroomに参加
    socket.join(roomId);

    console.log(`[FriendRoom] ${username} joined room ${roomId} (${friendRoom.players.length}/3)`);

    // 部屋の全員に通知
    io.to(roomId).emit('friend_room_updated', {
      roomId,
      players: friendRoom.players.map(p => ({
        username: p.username,
        playerIndex: p.playerIndex,
        ready: p.ready
      })),
      playerCount: friendRoom.players.length,
      config: friendRoom.config
    });

    // 参加成功を返す
    callback({
      success: true,
      roomId,
      playerIndex,
      config: friendRoom.config
    });

    // 3人揃ったらゲーム開始
    if (friendRoom.players.length === 3) {
      setTimeout(() => {
        startFriendGame(io, roomId, games);
      }, 2000);
    }

  } catch (error) {
    console.error('[FriendRoom] Join error:', error);
    callback({ success: false, error: 'サーバーエラーが発生しました' });
  }
}

/**
 * フレンド部屋から退出（Socket.io）
 */
function handleLeaveFriendRoom(io, socket, roomId) {
  const friendRoom = activeFriendRooms.get(roomId);
  if (!friendRoom) return;

  const playerIndex = friendRoom.players.findIndex(p => p.socketId === socket.id);
  if (playerIndex === -1) return;

  const player = friendRoom.players[playerIndex];
  friendRoom.players.splice(playerIndex, 1);

  console.log(`[FriendRoom] ${player.username} left room ${roomId}`);

  socket.leave(roomId);

  if (friendRoom.players.length === 0) {
    activeFriendRooms.delete(roomId);
    console.log(`[FriendRoom] Room ${roomId} deleted (empty)`);
  } else {
    io.to(roomId).emit('friend_room_updated', {
      roomId,
      players: friendRoom.players.map(p => ({
        username: p.username,
        playerIndex: p.playerIndex,
        ready: p.ready
      })),
      playerCount: friendRoom.players.length,
      config: friendRoom.config
    });
  }
}

/**
 * フレンド部屋のゲームを開始
 */
function startFriendGame(io, roomId, games) {
  const friendRoom = activeFriendRooms.get(roomId);
  if (!friendRoom || friendRoom.players.length !== 3) {
    console.log('[FriendRoom] Cannot start game: not enough players');
    return;
  }

  console.log('[FriendRoom] Starting game for room:', roomId);

  const { config } = friendRoom;
  const { jokerCount, anteMultiplier, timeLimit, ante } = config;

  const { initializeGame } = require('../../shared/core/gameFlow');
  
  const gameState = initializeGame(3, anteMultiplier, ante || 1000);
  
  gameState.config = {
    isFriendBattle: true,
    maxJokerCount: jokerCount,
    timeLimit
  };
  
  gameState.roomId = roomId;
  gameState.players = friendRoom.players.map((p, idx) => ({
    id: p.socketId,
    name: p.username,
    userId: p.userId,
    isBot: false,
    buyIn: 0 
  }));

  gameState.roomConfig = {
    id: 'friend_battle',
    ante: ante || 1000,
    anteMultiplier,
    maxJokerCount: jokerCount,
    requiredChips: 0
  };
  
  gameState.playerSelections = [false, false, false];

  games.set(roomId, gameState);
  
  friendRoom.players.forEach((player, index) => {
    io.to(player.socketId).emit('friend_game_start', {
      roomId,
      playerIndex: index,
      players: friendRoom.players.map(p => p.username),
      hand: gameState.hands[index],
      scores: gameState.scores,
      config: {
        maxJokerCount: jokerCount,
        anteMultiplier,
        timeLimit,
        isFriendBattle: true
      }
    });
  });
  
  friendRoom.status = 'playing';
  
  console.log('[FriendRoom] Game started for room:', roomId);
}

module.exports = {
  handleJoinFriendRoom,
  handleLeaveFriendRoom,
  activeFriendRooms,
  startFriendGame
};