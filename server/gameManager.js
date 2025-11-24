// server/gameManager.js
// ゲーム管理の統括（エントリーポイント）

const { startGame: startGameCore } = require('./gameStarter');
const { handleRoundEnd } = require('./round');

/**
 * ゲーム開始（handleRoundEndを自動注入）
 */
function startGame(io, games, roomId, room, rooms) {
   startGameCore(io, games, roomId, room, (io, games, roomId, gameState) => {
    handleRoundEnd(io, games, roomId, gameState, rooms);
  });
}

module.exports = {
  startGame,
  handleRoundEnd
};