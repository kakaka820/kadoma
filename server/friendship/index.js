// server/friendship/index.js
// フレンドシステムの統合エクスポート（申請・フレンドリストなど）

const { findUserByPlayerId } = require('./friendSearch');
const { sendFriendRequest, acceptFriendRequest, rejectFriendRequest } = require('./friendRequest');
const { getFriendList, getPendingRequests } = require('./friendList');

module.exports = {
  // 検索
  findUserByPlayerId,
  
  // 申請
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  
  // リスト
  getFriendList,
  getPendingRequests
};