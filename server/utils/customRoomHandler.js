// server/utils/customRoomHandler.js
const { supabase } = require('../supabaseClient');
const { checkSufficientCurrency } = require('../auth');
const { deductRoomFee } = require('./currencyHelper');
const { startGame } = require('../gameManager');

// 部屋ID生成
function generateRoomId(ante, maxJokerCount, timeLimit) {
  return `custom_${ante}_${maxJokerCount}_${timeLimit}_${Date.now()}`;
}

// カスタム部屋作成
async function handleCreateCustomRoom(socket, io, rooms, data, callback) {
  const { userId, username, ante, maxJokerCount, timeLimit, anteMultiplier } = data;
  
  const requiredChips = ante * anteMultiplier;
  
  console.log(`[CustomRoom] Create request: ${username}, ante=${ante}, joker=${maxJokerCount}, time=${timeLimit}`);
  
  // チップチェック
  const chipCheck = await checkSufficientCurrency(userId, requiredChips);
  if (!chipCheck.sufficient) {
    callback({
      success: false,
      error: 'チップが不足しています',
      shortage: chipCheck.shortage
    });
    return;
  }
  
  // 既にマッチング中かチェック
  for (const [id, room] of rooms.entries()) {
    const alreadyJoined = room.players.some(p => p.userId === userId);
    if (alreadyJoined) {
      callback({
        success: false,
        error: '既にマッチング中です'
      });
      return;
    }
  }
  
  // 新しい部屋を作成
  const roomId = generateRoomId(ante, maxJokerCount, timeLimit);
  
  rooms.set(roomId, {
    players: [{
      id: socket.id,
      name: username,
      userId,
      isBot: false,
      deducted: true,
      buyIn: requiredChips
    }],
    roomConfig: {
      id: roomId,
      ante,
      anteMultiplier,
      maxJokerCount,
      timeLimit,
      requiredChips,
      isCustom: true
    },
    createdAt: Date.now()
  });
  
  // チップ差し引き
  await deductRoomFee(userId, roomId, requiredChips);
  
  socket.join(roomId);
  socket.roomId = roomId;
  
  console.log(`[CustomRoom] Room created: ${roomId} (1/3)`);
  
  callback({
    success: true,
    roomId,
    playerCount: 1
  });
}

// カスタム部屋一覧取得
function handleGetCustomRooms(rooms, callback) {
  const customRooms = [];
  
  for (const [roomId, room] of rooms.entries()) {
    // カスタム部屋かつ待機中（3人未満）
    if (room.roomConfig?.isCustom && room.players.length < 3) {
      customRooms.push({
        roomId,
        ante: room.roomConfig.ante,
        maxJokerCount: room.roomConfig.maxJokerCount,
        timeLimit: room.roomConfig.timeLimit,
        requiredChips: room.roomConfig.requiredChips,
        playerCount: room.players.length,
        createdAt: room.createdAt
      });
    }
  }
  
  // 作成日時でソート（新しい順）
  customRooms.sort((a, b) => b.createdAt - a.createdAt);
  
  console.log(`[CustomRoom] Active rooms: ${customRooms.length}`);
  
  callback({
    success: true,
    rooms: customRooms
  });
}

// カスタム部屋参加
async function handleJoinCustomRoom(socket, io, rooms, games, data, callback) {
  const { roomId, userId, username } = data;
  
  console.log(`[CustomRoom] Join request: ${username} → ${roomId}`);
  
  const room = rooms.get(roomId);
  
  if (!room) {
    callback({ success: false, error: '部屋が見つかりません' });
    return;
  }
  
  if (room.players.length >= 3) {
    callback({ success: false, error: '部屋が満員です' });
    return;
  }
  
  // チップチェック
  const chipCheck = await checkSufficientCurrency(userId, room.roomConfig.requiredChips);
  if (!chipCheck.sufficient) {
    callback({
      success: false,
      error: 'チップが不足しています',
      shortage: chipCheck.shortage
    });
    return;
  }
  
  // 既にマッチング中かチェック
  for (const [id, r] of rooms.entries()) {
    const alreadyJoined = r.players.some(p => p.userId === userId);
    if (alreadyJoined) {
      callback({
        success: false,
        error: '既にマッチング中です'
      });
      return;
    }
  }
  
  // プレイヤー追加
  room.players.push({
    id: socket.id,
    name: username,
    userId,
    isBot: false,
    deducted: true,
    buyIn: room.roomConfig.requiredChips
  });
  
  // チップ差し引き
  await deductRoomFee(userId, roomId, room.roomConfig.requiredChips);
  
  socket.join(roomId);
  socket.roomId = roomId;
  
  // 全員に通知
  io.to(roomId).emit('room_update', {
    roomId,
    players: room.players,
    isFull: room.players.length === 3
  });
  
  console.log(`[CustomRoom] Player joined: ${room.players.length}/3`);
  
  // 3人揃ったら即開始
  if (room.players.length === 3) {
    io.to(roomId).emit('game_ready', { roomId });
    
    setTimeout(() => {
      startGame(io, games, roomId, room, rooms);
    }, 1000);
  }
  
  callback({
    success: true,
    roomId,
    playerCount: room.players.length
  });
}

module.exports = {
  handleCreateCustomRoom,
  handleGetCustomRooms,
  handleJoinCustomRoom
};