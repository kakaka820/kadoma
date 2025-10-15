// server/roomManager.js
// ルーム管理（参加・切断処理）、ルーム管理ロジックを担当

const { handlePlayerDisconnect } = require('./disconnectHandler');
const { BOT_WAIT_TIME_MS } = require('../shared/config');
const { createBotPlayer, BOT_STRATEGIES } = require('./botPlayer');

/**
 * プレイヤーのルーム参加処理
 */
function handleJoinRoom(io, rooms, games, socket, data, startGameCallback) {
  console.log('[Server] join_room received:', data);
  const playerName = typeof data === 'string' ? data : data.playerName;
  const userId = data.userId;
  const difficulty = data.difficulty || 'normal';
   const roomConfig = data.roomConfig || null;

  console.log('[RoomManager] Extracted data:', {
    playerName,
    userId,
    difficulty,
    roomConfig
  });
  
  if (!playerName) {
    console.error('[Server] playerName is missing!');
    return;
  }
  
  let targetRoom = null;

  // 空きのあるルームを探す
  for (const [id, room] of rooms.entries()) {
    if (room.players.length < 3) {
      targetRoom = { roomId: id, room };
      break;
    }
  }

  // なければ新規ルーム作成
  if (!targetRoom) {
    const newRoomId = `room_${Date.now()}`;
    rooms.set(newRoomId, { players: [], roomConfig: roomConfig });
    targetRoom = { roomId: newRoomId, room: rooms.get(newRoomId) };
  }

  const { roomId, room } = targetRoom;

  // プレイヤー情報追加
  room.players.push({
    id: socket.id,
    name: playerName,
    userId: userId,
    isBot: false
  });

  console.log('[RoomManager] Added player:', room.players[room.players.length - 1]);

  
  
  socket.join(roomId);
  socket.roomId = roomId;
  
  console.log(`[Server] ${playerName} joined ${roomId} (${room.players.length}/3)`);

  // ルーム情報を全員に送信
  io.to(roomId).emit('room_update', {
    roomId,
    players: room.players,
    isFull: room.players.length === 3
  });

  //3人未満なら10秒待ってBot補充
  if (room.players.length < 3) {
    if (room.botTimer) {
      clearTimeout(room.botTimer);
    }


    room.botTimer = setTimeout(() => {
      const currentRoom = rooms.get(roomId);
      if (!currentRoom) return;
     
    
    // 難易度に応じてBot戦略を決定
    let botStrategies = [];
    switch (difficulty) {
      case 'easy':
        // かんたん：強気と弱気のみ
        botStrategies = [BOT_STRATEGIES.AGGRESSIVE, BOT_STRATEGIES.PASSIVE];
        break;
      case 'hard':
        // むずかしい：適応型のみ
        botStrategies = [BOT_STRATEGIES.ADAPTIVE];
        break;
      case 'normal':
      default:
        // ふつう：ランダムのみ
        botStrategies = [BOT_STRATEGIES.RANDOM];
        break;
    }





      // まだ3人未満ならBotを追加
      while (currentRoom.players.length < 3) {
        const botNumber = currentRoom.players.length + 1;
        const strategy = botStrategies[Math.floor(Math.random() * botStrategies.length)];
        const bot = createBotPlayer(`bot_${roomId}_${botNumber}`, botNumber, strategy, false);
        currentRoom.players.push(bot);
        console.log(`[Bot] Added ${bot.name} to ${roomId}`);
      }


      // 更新通知
      io.to(roomId).emit('room_update', {
        roomId,
        players: currentRoom.players,
        isFull: true
      });
      // ゲーム開始
      console.log('[Server] Room full with bots! Starting game...');
      io.to(roomId).emit('game_ready', { roomId });
      
      setTimeout(() => {
        startGameCallback(roomId, currentRoom);
      }, 1000);
    }, BOT_WAIT_TIME_MS); // 10秒待機
  }

  // 3人揃ったら開始通知
  if (room.players.length === 3) {
    // Botタイマーをクリア
    if (room.botTimer) {
      clearTimeout(room.botTimer);
      room.botTimer = null;
    }
    console.log('[Server] Room full! Sending game_ready...'); 
    io.to(roomId).emit('game_ready', { roomId });
    
    // 1秒後にゲーム開始
    setTimeout(() => {
      console.log('[Server] Starting game...');
      startGameCallback(roomId, room);
    }, 1000);
  }
}

/**
 * プレイヤー切断時の処理
 */
function handleDisconnect(io, rooms, games, socket) {
  handlePlayerDisconnect(io, rooms, games, socket);
}

module.exports = {
  handleJoinRoom,
  handleDisconnect
};
