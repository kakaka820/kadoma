// server/friendRoom/index.js
// フレンド部屋機能のまとめ

const {
  createFriendRoom,
  getInvitedRooms,
  getMyCreatedRooms,
  deleteFriendRoom,
  getFriendRoom
} = require('./roomDatabase');

const {
  handleJoinFriendRoom,
  handleLeaveFriendRoom,
  activeFriendRooms,
  startFriendGame
} = require('./roomSocket');

const { generateRoomCode } = require('./roomUtils');

module.exports = {
  // Database
  createFriendRoom,
  getInvitedRooms,
  getMyCreatedRooms,
  deleteFriendRoom,
  getFriendRoom,
  
  // Socket
  handleJoinFriendRoom,
  handleLeaveFriendRoom,
  activeFriendRooms,
  startFriendGame,
  
  // Utils
  generateRoomCode
};