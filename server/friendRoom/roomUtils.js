// server/friendRoom/roomUtils.js
// フレンド部屋のユーティリティ関数

/**
 * フレンド部屋用のルームコード生成（6文字）
 */
function generateRoomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

module.exports = {
  generateRoomCode
};