// server/events/roomEvents.js
//ルーム参加担当

const { handleJoinRoom } = require('../roomManager');
const { startGame } = require('../gameManager');
const { handleMultiRoomJoin } = require('../utils/multiRoomHandler');
const { 
  handleCreateCustomRoom,
  handleGetCustomRooms,
  handleJoinCustomRoom 
} = require('../utils/customRoomHandler');


function setupRoomEvents(socket, io, rooms, games) {
  // 通常ルーム参加
  socket.on('join_room', (data) => {
    handleJoinRoom(
      io, 
      rooms, 
      games, 
      socket, 
      data, 
      (roomId, room) => startGame(io, games, roomId, room, rooms)
    );
  });
  
  // マルチルーム参加
  socket.on('join_multi_room', async (data, callback) => {
    await handleMultiRoomJoin(socket, io, rooms, games, data, callback);
  });

  
 // カスタム部屋作成
  socket.on('create_custom_room', async (data, callback) => {
    await handleCreateCustomRoom(socket, io, rooms, data, callback);
  });
  
  // カスタム部屋一覧取得
  socket.on('get_custom_rooms', (callback) => {
    handleGetCustomRooms(rooms, callback);
  });

  
  // カスタム部屋参加
  socket.on('join_custom_room', async (data, callback) => {
    await handleJoinCustomRoom(socket, io, rooms, games, data, callback);
  });


  
  // マッチングキャンセル
  socket.on('cancel_matching', async (data, callback) => {
    const { handleCancelMatching } = require('../utils/matchingUtils'); // ← 新規作成
    await handleCancelMatching(socket, io, rooms, data, callback);
  });
}

module.exports = { setupRoomEvents };