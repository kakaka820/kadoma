// server/gameManager.js
// ゲーム管理の統括（エントリーポイント）

const { startGame } = require('./gameStarter');
const { handleRoundEnd } = require('./roundHandler');

module.exports = {
  startGame,
  handleRoundEnd
};