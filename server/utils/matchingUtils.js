// server/utils/matchingUtils.js
// マッチングキャンセル処理

const { updateUserCurrency } = require('../authHandler');

async function handleCancelMatching(socket, io,rooms, data, callback) {
  const { roomId, userId } = data;
  
  console.log(`[Matching] Cancel request: ${userId} in ${roomId}`);
  
  const room = rooms.get(roomId);
  
  if (!room) {
    callback({ success: false, error: 'ルームが見つかりません' });
    return;
  }
  
  // プレイヤーを探す
  const playerIndex = room.players.findIndex(p => p.userId === userId);
  
  if (playerIndex === -1) {
    callback({ success: false, error: 'プレイヤーが見つかりません' });
    return;
  }
  
  const player = room.players[playerIndex];
  
  // 差し引かれている場合のみ返金
  if (player.deducted && player.buyIn) {
    await updateUserCurrency(userId, player.buyIn);
    console.log(`[Matching] Refunded ${player.buyIn} currency to ${userId}`);
  }
  
  // プレイヤー削除
  room.players.splice(playerIndex, 1);
  socket.leave(roomId);

  // 部屋が空なら削除（Botタイマーもクリア）
  if (room.players.length === 0) {
    if (room.botTimer) {
      clearTimeout(room.botTimer);
      room.botTimer = null;
    }
    rooms.delete(roomId);
    console.log(`[Matching] Room ${roomId} deleted`);
  } else {
    io.to(roomId).emit('room_update', {
      roomId,
      players: room.players,
      isFull: false
    });
  }
  
  callback({ success: true });
}

module.exports = { handleCancelMatching };