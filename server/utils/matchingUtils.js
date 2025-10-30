// server/utils/matchingUtils.js
// マッチングキャンセル処理

const { refundRoomFee } = require('./currencyHelper');

async function handleCancelMatching(socket, io,rooms, data, callback) {
  const { userId } = data;
  
  console.log(`[Matching] Cancel request: ${userId}`);
  
 let targetRoom = null;
  let targetRoomId = null;
  let playerIndex = -1;
  
  
  for (const [roomId, room] of rooms.entries()) {
    const idx = room.players.findIndex(p => p.userId === userId);
    if (idx !== -1) {
      targetRoom = room;
      targetRoomId = roomId;
      playerIndex = idx;
      break;
    }
  }
  // 部屋が見つからない場合（すでにキャンセル済みの可能性）
  if (!targetRoom) {
    console.log(`[Matching] No room found for user ${userId} (already cancelled?)`);
    callback({ success: true }); // ← 成功扱い
    return;
  }
  
  const player = targetRoom.players[playerIndex];
  
  // 差し引かれている場合のみ返金
  if (player.deducted && player.buyIn) {
    await refundRoomFee(userId, targetRoomId, player.buyIn);
  }
  
  // プレイヤー削除
  targetRoom.players.splice(playerIndex, 1);
  socket.leave(targetRoomId);

  // 部屋が空なら削除（Botタイマーもクリア）
  if (targetRoom.players.length === 0) {
  if (targetRoom.botTimer) {
    clearTimeout(targetRoom.botTimer);
    targetRoom.botTimer = null;
  }
  rooms.delete(targetRoomId);
  console.log(`[Matching] Room ${targetRoomId} deleted`);
} else {
  io.to(targetRoomId).emit('room_update', {
    roomId: targetRoomId,
    players: targetRoom.players,
    isFull: false
  });
}
  
  callback({ success: true });
}

module.exports = { handleCancelMatching };