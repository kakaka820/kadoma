// server/events/friendRoomEvents.js
// フレンド部屋関連のイベント

const {
  handleJoinFriendRoom,
  handleLeaveFriendRoom,
  activeFriendRooms
} = require('../friendRoom');
const { handleDisconnect } = require('../roomManager');

function setupFriendRoomEvents(socket, io, rooms, games) {
  // フレンド部屋参加
  socket.on('join_friend_room', (data, callback) => {
    handleJoinFriendRoom(io, socket, data, callback, games);
  });

  // フレンド部屋退出
  socket.on('leave_friend_room', (roomId) => {
    handleLeaveFriendRoom(io, socket, roomId);
  });

  // 切断時の処理（フレンド部屋関連のみ）
  socket.on('disconnect', () => {
    // フレンド部屋から自動退出
    for (const [roomId, room] of activeFriendRooms.entries()) {
      const player = room.players.find(p => p.socketId === socket.id);
      if (player) {
        handleLeaveFriendRoom(io, socket, roomId);
      }
    }
    
    // 通常の切断処理
    handleDisconnect(io, rooms, games, socket);
  });
}

module.exports = { setupFriendRoomEvents };