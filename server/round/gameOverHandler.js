// server/round/gameOverHandler.js
// ゲーム終了処理

const { saveGameHistory } = require('../gameHistory');
const {
  distributeChips,
  processDailyBonuses,
  getUpdatedCurrencies,
  processQuestProgress
} = require('./rewardDistributor');

/**
 * ランキングを計算
 */
function calculateRankings(nextState) {
  return nextState.players
    .map((player, index) => ({
      playerIndex: index,
      userId: player.userId,
      buyIn: player.buyIn || nextState.roomConfig?.requiredChips || 1000,
      finalScore: nextState.scores[index],
      profit: nextState.scores[index] - (player.buyIn || nextState.roomConfig?.requiredChips || 1000),
      isDisconnected: player.isBot && player.isProxy
    }))
    .sort((a, b) => b.finalScore - a.finalScore)
    .map((player, index) => ({
      ...player,
      rank: player.isDisconnected ? null : index + 1
    }));
}

/**
 * ゲーム終了処理
 */
async function handleGameOver(io, games, rooms, roomId, nextState) {
  console.log('[GameOver] nextState.roomConfig:', nextState.roomConfig);
  
  const isFriendBattle = nextState.config?.isFriendBattle || false;
  console.log('[GameOver] isFriendBattle:', isFriendBattle);

  const rankings = calculateRankings(nextState);
  console.log('[GameOver] rankings:', rankings);

  let chipResults = null;
  let dailyBonusResults = null;
  let updatedCurrencies = {};

  if (!isFriendBattle) {
    // 通常戦のみ報酬処理
    chipResults = await distributeChips(nextState);
    dailyBonusResults = await processDailyBonuses(nextState);
    updatedCurrencies = await getUpdatedCurrencies(chipResults);
    
    // クエスト進捗を更新
    await processQuestProgress(nextState, rankings);
    
    // 履歴保存
    saveGameHistory(roomId, nextState, rankings).catch(err => {
      console.error('[game_over] 履歴保存失敗:', err);
    });
  } else {
    // フレンド戦
    console.log('[GameOver] Friend battle - skipping currency, daily bonus, and quest updates');
    
    saveGameHistory(roomId, nextState, rankings, true).catch(err => {
      console.error('[game_over] Friend battle history save failed:', err);
    });
  }

  // ゲーム終了通知
  io.to(roomId).emit('game_over', {
    reason: nextState.gameOverReason,
    finalScores: nextState.scores,
    winner: nextState.scores.indexOf(Math.max(...nextState.scores)),
    chipResults: chipResults,
    roomConfig: nextState.roomConfig,
    updatedCurrencies: updatedCurrencies,
    dailyBonusResults: dailyBonusResults,
    isFriendBattle: isFriendBattle
  });

  games.delete(roomId);
  rooms.delete(roomId);
  console.log(`[GameOver] Room ${roomId} deleted from rooms and games`);
}

module.exports = {
  handleGameOver,
  calculateRankings
};