// server/gameManager.js
// ゲーム管理の統括（エントリーポイント）

const { startGame: startGameCore } = require('./gameStarter');
const { handleRoundEnd } = require('./roundHandler');

/**
 * ゲーム開始（handleRoundEndを自動注入）
 */
function startGame(io, games, roomId, room) {
  startGameCore(io, games, roomId, room, handleRoundEnd);
}

module.exports = {
  startGame,
  handleRoundEnd
};