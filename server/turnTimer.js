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
    gameState.turnTimer = null;
  }
  
  console.log(`[Timer] Starting ${TURN_TIME_LIMIT}s timer for ${roomId}`);

  //タイマー終了時刻を記録
  gameState.turnTimerStartTime = Date.now();
  gameState.turnTimerEndTime = Date.now() + (TURN_TIME_LIMIT * 1000);
  
  // タイマー開始をクライアントに通知
  io.to(roomId).emit('timer_start', {
    timeLimit: TURN_TIME_LIMIT
  });

  // タイマー設定
  gameState.turnTimer = setTimeout(() => {
    //最新の gameState を取得
    const currentGameState = games.get(roomId);
    if (!currentGameState) return;
    
    console.log('[Timer] Time up!');

    //タイマー終了時刻をクリア
    currentGameState.turnTimerStartTime = null;
    currentGameState.turnTimerEndTime = null;
    
    //まだ選択していないプレイヤーを取得（最新状態から）
    const unselectedPlayers = currentGameState.playerSelections
      .map((selected, idx) => selected ? null : idx)
      .filter(idx => idx !== null);

      //全員選択済みならスキップ
    if (unselectedPlayers.length === 0) {
      console.log('[Timer] All players already selected, skipping auto-select');
      return;
    }

    // 各未選択プレイヤーにランダムカードを選択
    unselectedPlayers.forEach(playerIndex => {
      const hand = currentGameState.hands[playerIndex];
      if (hand.length === 0) return;

      //セットの1ターン目ならJOKERを除外
  let availableCards = hand;
  if (currentGameState.setTurnIndex === 0) {
    availableCards = hand.filter(card => !card.rank?.startsWith('JOKER'));
  }

  //理論上ありえないが念のためのエラーハンドリング
     if (availableCards.length === 0) {
    console.error(`[Timer] Player ${playerIndex} has no valid cards!`);
    return;
  }    


      // ランダムにカードを選択
      const randomIndex = Math.floor(Math.random() * availableCards.length);
      const selectedCard = availableCards[randomIndex];
      const handIndex = hand.findIndex(c => 
    c.suit === selectedCard.suit && c.rank === selectedCard.rank
  );

      // カードを場に出す
      hand.splice(handIndex, 1);
      currentGameState.fieldCards[playerIndex] = selectedCard;
      currentGameState.playerSelections[playerIndex] = true;
      console.log(`[Timer] Auto-selected card for Player ${playerIndex}:`, selectedCard);
    });
    



    //カードを一斉開示（各プレイヤーに手札も送信）
    currentGameState.players.forEach((player, idx) => {
      io.to(player.id).emit('cards_revealed', {
        fieldCards: currentGameState.fieldCards,
        hand: currentGameState.hands[idx]
      });
    });

    //ラウンド終了処理
     handleRoundEndCallback(io, games, roomId, currentGameState);
  }, TURN_TIME_LIMIT * 1000);
  
  games.set(roomId, gameState);
}

module.exports = {
  startTurnTimer
};