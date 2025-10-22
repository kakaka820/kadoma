// shared/utils/roomUtils.js

/**
 * 空き部屋を検索
 */
function findAvailableRoom(rooms, roomConfigId = null) {
  for (const [id, room] of rooms.entries()) {
    if (room.players.length < 3) {
      // roomConfigId が指定されていれば一致チェック
      if (roomConfigId && room.roomConfig?.id !== roomConfigId) {
        continue;
      }
      return { roomId: id, room };
    }
  }
  return null;
}

/**
 * 新規ルーム作成
 */
function createRoom(rooms, roomConfig = null) {
  const roomId = `room_${Date.now()}`;
  rooms.set(roomId, { players: [], roomConfig });
  return { roomId, room: rooms.get(roomId) };
}

/**
 * ルームが満員かチェック
 */
function isRoomFull(room) {
  return room.players.length >= 3;
}

module.exports = {
  findAvailableRoom,
  createRoom,
  isRoomFull
};