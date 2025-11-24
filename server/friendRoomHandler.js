// server/friendRoomHandler.js
const { supabase } = require('./supabaseClient');

/**
 * フレンド部屋用のルームコード生成（6文字）
 */
function generateRoomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * フレンド部屋を作成
 */
async function createFriendRoom(userId, config) {
   const { data: existingRooms } = await supabase
    .from('friend_rooms')
    .select('id')
    .eq('creator_id', userId)
    .eq('status', 'waiting');
  if (existingRooms && existingRooms.length > 0) {
    return { 
      success: false, 
      error: '既に待機中の部屋があります。先に削除してください。' 
    };
  }
  const { roomName, ante, jokerCount, timeLimit, invitedFriends } = config;

  // ルームコード生成（重複チェック）
  let roomCode;
  let codeExists = true;

  while (codeExists) {
    roomCode = generateRoomCode();
    const { data } = await supabase
      .from('friend_rooms')
      .select('id')
      .eq('room_code', roomCode)
      .single();
    codeExists = data !== null;
  }

  // 有効期限（24時間後）
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24);

  // room_config を構築
  const roomConfig = {
    roomName: roomName || 'フレンド戦',
    ante: ante || 1000,
    jokerCount: jokerCount || 2,
    timeLimit: timeLimit || 30,
    maxPlayers: 3
  };

  // ルーム作成
  const { data, error } = await supabase
    .from('friend_rooms')
    .insert({
      room_code: roomCode,
      creator_id: userId,
      invited_friends: invitedFriends || [],
      room_config: roomConfig,
      status: 'waiting',
      expires_at: expiresAt.toISOString()
    })
    .select()
    .single();

  if (error) {
    console.error('[FriendRoom] Create error:', error);
    return { success: false, error: 'ルーム作成に失敗しました' };
  }

  console.log(`[FriendRoom] Created: ${data.id} (${roomCode})`);
  return { success: true, room: data };
}

/**
 * フレンド部屋一覧を取得（自分が招待されている部屋）
 */
async function getInvitedRooms(userId) {
  const { data, error } = await supabase
    .from('friend_rooms')
    .select(`
      *,
      creator:users!friend_rooms_creator_id_fkey(id, username, player_id)
    `)
    .contains('invited_friends', [userId])
    .eq('status', 'waiting')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[FriendRoom] Get invited rooms error:', error);
    return { success: false, rooms: [] };
  }

  const rooms = data.map(room => ({
    id: room.id,
    roomCode: room.room_code,
    creatorId: room.creator_id,
    creatorUsername: room.creator.username,
    creatorPlayerId: room.creator.player_id,
    config: room.room_config,
    createdAt: room.created_at
  }));

  return { success: true, rooms };
}

/**
 * 自分が作成したフレンド部屋を取得
 */
async function getMyCreatedRooms(userId) {
  const { data, error } = await supabase
    .from('friend_rooms')
    .select('*')
    .eq('creator_id', userId)
    .eq('status', 'waiting')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[FriendRoom] Get created rooms error:', error);
    return { success: false, rooms: [] };
  }

  const rooms = data.map(room => ({
    id: room.id,
    roomCode: room.room_code,
    config: room.room_config,
    invitedFriends: room.invited_friends || [],
    createdAt: room.created_at
  }));

  return { success: true, rooms };
}

/**
 * フレンド部屋を削除
 */
async function deleteFriendRoom(userId, roomId) {
  // 自分が作成した部屋か確認
  const { data: room } = await supabase
    .from('friend_rooms')
    .select('creator_id')
    .eq('id', roomId)
    .single();

  if (!room || room.creator_id !== userId) {
    return { success: false, error: '部屋が見つかりません' };
  }

  const { error } = await supabase
    .from('friend_rooms')
    .delete()
    .eq('id', roomId);

  if (error) {
    console.error('[FriendRoom] Delete error:', error);
    return { success: false, error: '削除に失敗しました' };
  }

  console.log(`[FriendRoom] Deleted: ${roomId}`);
  return { success: true };
}

/**
 * フレンド部屋情報を取得
 */
async function getFriendRoom(roomId) {
  const { data, error } = await supabase
    .from('friend_rooms')
    .select(`
      *,
      creator:users!friend_rooms_creator_id_fkey(id, username, player_id)
    `)
    .eq('id', roomId)
    .single();

  if (error || !data) {
    console.error('[FriendRoom] Get room error:', error);
    return { success: false, error: '部屋が見つかりません' };
  }

  return {
    success: true,
    room: {
      id: data.id,
      roomCode: data.room_code,
      creatorId: data.creator_id,
      creatorUsername: data.creator.username,
      config: data.room_config,
      invitedFriends: data.invited_friends || [],
      status: data.status
    }
  };
}




// ========================================
// Socket.io 用のフレンド部屋管理
// ========================================

// フレンド部屋の状態管理（メモリ上）
const activeFriendRooms = new Map(); // roomId -> { players: [], config: {}, status: 'waiting' }

/**
 * フレンド部屋に参加（Socket.io）
 */
async function handleJoinFriendRoom(io, socket, data, callback) {
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
        startFriendGame(io, roomId);
      }, 2000); // 2秒後に開始
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

  // プレイヤーを削除
  const playerIndex = friendRoom.players.findIndex(p => p.socketId === socket.id);
  if (playerIndex === -1) return;

  const player = friendRoom.players[playerIndex];
  friendRoom.players.splice(playerIndex, 1);

  console.log(`[FriendRoom] ${player.username} left room ${roomId}`);

  // Socket.ioのroomから退出
  socket.leave(roomId);

  // 部屋が空になったら削除
  if (friendRoom.players.length === 0) {
    activeFriendRooms.delete(roomId);
    console.log(`[FriendRoom] Room ${roomId} deleted (empty)`);
  } else {
    // 残りのプレイヤーに通知
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
function startFriendGame(io, roomId) {
  const friendRoom = activeFriendRooms.get(roomId);
  if (!friendRoom || friendRoom.players.length !== 3) {
    console.log('[FriendRoom] Cannot start game: not enough players');
    return;
  }

  console.log('[FriendRoom] Starting game for room:', roomId);

  const { config } = friendRoom;
  const { jokerCount, anteMultiplier, timeLimit, ante } = config;

  // ← ゲーム初期化（既存のゲームロジックを再利用）
  const { initializeGame } = require('../shared/core/gameFlow');
  
  const gameState = initializeGame(3, anteMultiplier, ante || 1000);
  
  // フレンド戦フラグを設定
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

  // roomConfig を設定（buy_in なし）
  gameState.roomConfig = {
    id: 'friend_battle',
    ante: ante || 1000,
    anteMultiplier,
    maxJokerCount: jokerCount,
    requiredChips: 0 // ← フレンド戦は buy_in なし
  };


  // ゲーム状態を保存（既存の games Map を利用）
  const { games } = require('../roomManager');
  games.set(roomId, gameState);
  // ゲーム開始通知（プレイヤーごとに手札を送信）
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
  createFriendRoom,
  getInvitedRooms,
  getMyCreatedRooms,
  deleteFriendRoom,
  getFriendRoom,
  generateRoomCode,
  handleJoinFriendRoom,
  handleLeaveFriendRoom,
  activeFriendRooms
};