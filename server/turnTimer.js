// server/turnTimer.js
// ターンタイマー機能

const { TURN_TIME_LIMIT } = require('../shared/config');

/**
 * ターンタイマー開始
 */
function startTurnTimer(io, games, roomId, handleRoundEndCallback) {
  const gameState = games.get(roomId);
  if (!gameState) return;
  
  // 既存のタイマーをクリア
  if (gameState.turnTimer) {
    clearTimeout(gameState.turnTimer);
  }
  
  console.log(`[Timer] Starting ${TURN_TIME_LIMIT}s timer for ${roomId}`);
  
  // タイマー開始をクライアントに通知
  io.to(roomId).emit('timer_start', {
    timeLimit: TURN_TIME_LIMIT
  });

  // タイマー設定
  gameState.turnTimer = setTimeout(() => {
    console.log('[Timer] Time up!');
    
    // まだ選択していないプレイヤーを取得
    const unselectedPlayers = gameState.playerSelections
      .map((selected, idx) => selected ? null : idx)
      .filter(idx => idx !== null);
    
    // 各未選択プレイヤーにランダムカードを選択
    unselectedPlayers.forEach(playerIndex => {
      const hand = gameState.hands[playerIndex];
      if (hand.length === 0) return;
      
      // ランダムにカードを選択
      const randomIndex = Math.floor(Math.random() * hand.length);
      const card = hand[randomIndex];

      // カードを場に出す
      hand.splice(randomIndex, 1);
      gameState.fieldCards[playerIndex] = card;
      gameState.playerSelections[playerIndex] = true;
      console.log(`[Timer] Auto-selected card for Player ${playerIndex}:`, card);
    });
    
    // 更新を全員に通知
    io.to(roomId).emit('turn_update', {
      currentMultiplier: gameState.currentMultiplier,
      fieldCards: [null, null, null],
      scores: gameState.scores,
      playerSelections: gameState.playerSelections
    });

    // カードを一斉開示
    io.to(roomId).emit('cards_revealed', {
      fieldCards: gameState.fieldCards
    });

    // ラウンド終了処理
    handleRoundEndCallback(io, games, roomId, gameState);
  }, TURN_TIME_LIMIT * 1000);
  
  games.set(roomId, gameState);
}

module.exports = {
  startTurnTimer
};