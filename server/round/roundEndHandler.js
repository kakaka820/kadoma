// server/round/roundEndHandler.js
// ラウンド終了処理

const { processRound } = require('../../shared/core/gameFlow');
const { ROUND_RESULT_DISPLAY_MS } = require('../../shared/config');
const { prepareNextTurnState, startNextTurn } = require('./turnPreparer');
const { handleGameOver } = require('./gameOverHandler');

/**
 * 次のターンを準備・実行
 */
async function performNextTurn(io, games, roomId, state, rooms, handleRoundEnd) {
  const { nextState, allHandsEmpty } = prepareNextTurnState(io, roomId, state);
  
  // ゲーム状態を保存
  games.set(roomId, nextState);

  // ゲーム終了判定
  if (nextState.isGameOver) {
    await handleGameOver(io, games, rooms, roomId, nextState);
  } else {
    startNextTurn(io, games, roomId, nextState, allHandsEmpty, handleRoundEnd, rooms);
  }
}

/**
 * ラウンド終了処理
 */
function handleRoundEnd(io, games, roomId, gameState, rooms) {
  if (!gameState) {
    console.error('[roundHandler] gameState is undefined for room:', roomId);
    return;
  }

  if (gameState.turnTimer) {
    clearTimeout(gameState.turnTimer);
    gameState.turnTimer = null;
  }
  
  const playerNames = gameState.players.map(player => {
    if (player.isBot) {
      return player.name || 'Bot';
    }
    return player.username || player.name || 'Player';
  });
  
  console.log('[handleRoundEnd] playerNames:', playerNames);

  const updatedState = processRound(gameState, playerNames);
  games.set(roomId, updatedState);
  
  io.to(roomId).emit('round_result', {
    ...updatedState.roundResult,
    scores: updatedState.scores,
    wins: updatedState.wins
  });

  // 全員選択済みなら即座に次のラウンド開始
  if (updatedState.playerSelections.every(Boolean)) {
    console.log('[roundHandler] All players selected, starting next turn immediately');
    performNextTurn(io, games, roomId, updatedState, rooms, handleRoundEnd);
  } else {
    setTimeout(() => {
      performNextTurn(io, games, roomId, updatedState, rooms, handleRoundEnd);
    }, ROUND_RESULT_DISPLAY_MS);
  }
}

module.exports = {
  handleRoundEnd,
  performNextTurn
};