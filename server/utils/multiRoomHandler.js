// server/utils/multiRoomHandler.js
// マルチルーム参加処理

const { MULTI_ROOMS, BOT_WAIT_TIME_MS } = require('../../shared/config');
const { checkSufficientCurrency } = require('../authHandler');
const { deductRoomFee } = require('./currencyHelper');
const { createBotPlayer, BOT_STRATEGIES } = require('../bot/botPlayer');
const { startGame } = require('../gameManager');
const { findAvailableRoom, createRoom } = require('../../shared/utils/roomUtils');


console.log('[MultiRoom] Module loaded, checkSufficientCurrency:', typeof checkSufficientCurrency);

async function handleMultiRoomJoin(socket, io, rooms, games, data, callback) {
  console.log('[MultiRoom] handleMultiRoomJoin called with data:', data);
  const { roomId, userId, username } = data;
  
  console.log(`[MultiRoom] Join request: ${username} → ${roomId}`);
  console.log(`[MultiRoom] userId:`, userId);
  console.log(`[MultiRoom] userId: ${userId}, type: ${typeof userId}`);
  
  // 部屋情報取得
  const room = MULTI_ROOMS.find(r => r.id === roomId);
  if (!room) {
    console.log('[MultiRoom] Room not found:', roomId);
    callback({ success: false, error: '部屋が見つかりません' });
    return;
  }
   console.log(`[MultiRoom] Room found:`, room);
  console.log(`[MultiRoom] Required chips: ${room.requiredChips}`);
  
  // チップ残高チェック
  const chipCheck = await checkSufficientCurrency(userId, room.requiredChips);
  console.log(`[MultiRoom] chipCheck result:`, chipCheck);
  
  if (!chipCheck.sufficient) {
    console.log(`[MultiRoom] Insufficient chips - current: ${chipCheck.current}, required: ${chipCheck.required}`); 
    callback({ 
      success: false, 
      error: 'チップが不足しています',
      current: chipCheck.current,
      required: chipCheck.required,
      shortage: chipCheck.shortage
    });
    return;
  }
  console.log(`[MultiRoom] Chip check passed!`);

  // 既に参加済みかチェック
  for (const [id, room_] of rooms.entries()) {
    const alreadyJoined = room_.players.some(p => p.userId === userId);
    if (alreadyJoined) {
      callback({ 
        success: false, 
        error: '既にこの部屋タイプのマッチングに参加しています。' 
      });
      return;
    }
  }

  // 空き部屋を探す or 新規作成
  let targetRoom = findAvailableRoom(rooms, roomId);
  let actualRoomId;
  
  if (!targetRoom) {
    actualRoomId = `${roomId}_${Date.now()}`;
    rooms.set(actualRoomId, { players: [], roomConfig: room });
    targetRoom = { roomId: actualRoomId, room: rooms.get(actualRoomId) };
  } else {
    actualRoomId = targetRoom.roomId;
  }
  
  const roomData = targetRoom.room || targetRoom;
  
  // 満員チェック
  if (roomData.players.length >= 3) {
    callback({ success: false, error: '部屋が満員です' });
    return;
  }

  // プレイヤー追加
  roomData.players.push({
    id: socket.id,
    name: username,
    userId: userId,
    isBot: false,
    deducted: true,
    buyIn: room.requiredChips
  });

  // 通貨を差し引く
  await deductRoomFee(userId, actualRoomId, room.requiredChips);  
  socket.join(actualRoomId);
  socket.roomId = actualRoomId;
  
  // 全員に通知
  io.to(actualRoomId).emit('room_update', {
    roomId: actualRoomId,
    players: roomData.players,
    isFull: roomData.players.length === 3
  });

  // 3人未満ならBot投入タイマー
  if (roomData.players.length < 3) {
    if (roomData.botTimer) {
      clearTimeout(roomData.botTimer);
    }
    
    roomData.botTimer = setTimeout(() => {
      const currentRoom = rooms.get(actualRoomId);
      if (!currentRoom) return;

      // Bot追加
      while (currentRoom.players.length < 3) {
        const botNumber = currentRoom.players.length + 1;
        const bot = createBotPlayer(`bot_${roomId}_${botNumber}`, botNumber, BOT_STRATEGIES.RANDOM, false);
        currentRoom.players.push(bot);
      }

      io.to(actualRoomId).emit('room_update', {
        roomId: actualRoomId,
        players: currentRoom.players,
        isFull: true
      });
      
      io.to(actualRoomId).emit('game_ready', { roomId: actualRoomId });
      
      setTimeout(() => {
        startGame(io, games, actualRoomId, currentRoom, rooms);
      }, 1000);
    }, BOT_WAIT_TIME_MS);
  }

  // 3人揃ったら即開始
  if (roomData.players.length === 3) {
    if (roomData.botTimer) {
      clearTimeout(roomData.botTimer);
    }
    
    io.to(actualRoomId).emit('game_ready', { roomId: actualRoomId });
    
    setTimeout(() => {
      startGame(io, games, actualRoomId, roomData, rooms);
    }, 1000);
  }
  
  callback({ success: true });
}

module.exports = { handleMultiRoomJoin };