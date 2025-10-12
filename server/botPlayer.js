// server/botPlayer.js
// Bot プレイヤーのAI処理

const { TURN_TIME_LIMIT } = require('../shared/config');

/**
 * Bot用のランダムカード選択
 * @param {Array} hand - Botの手札
 * @param {number} setTurnIndex - 現在のセットターン（0-4）
 * @returns {number} 選択したカードのインデックス
 */
function selectRandomCard(hand, setTurnIndex) {
  if (hand.length === 0) return -1;

  // セットの1ターン目はJOKER除外
  if (setTurnIndex === 0) {
    const nonJokerIndices = hand
      .map((card, idx) => card.rank?.startsWith('JOKER') ? null : idx)
      .filter(idx => idx !== null);
    
    if (nonJokerIndices.length > 0) {
      const randomIdx = Math.floor(Math.random() * nonJokerIndices.length);
      return nonJokerIndices[randomIdx];
    }
  }

  // ランダム選択
  return Math.floor(Math.random() * hand.length);
}

/**
 * Bot が自動でカードを選択（遅延あり）
 * @param {Object} io - Socket.IO インスタンス
 * @param {Map} games - ゲーム状態Map
 * @param {string} roomId - 部屋ID
 * @param {number} botIndex - BotのプレイヤーIndex
 * @param {Function} handleRoundEndCallback - ラウンド終了時のコールバック
 */
function botAutoPlay(io, games, roomId, botIndex, handleRoundEndCallback) {
  const gameState = games.get(roomId);
  if (!gameState) return;

  // すでに選択済みなら無視
  if (gameState.playerSelections[botIndex]) return;

  // 1-3秒のランダムな遅延（人間らしさ演出）
  const delay = 1000 + Math.floor(Math.random() * 6500);

  setTimeout(() => {
    const currentGameState = games.get(roomId);
    if (!currentGameState) return;

    // 再度選択済みチェック
    if (currentGameState.playerSelections[botIndex]) return;

    const hand = currentGameState.hands[botIndex];
    const cardIndex = selectRandomCard(hand, currentGameState.setTurnIndex);

    if (cardIndex === -1) return;

    const card = hand[cardIndex];

    // カードを場に出す
    hand.splice(cardIndex, 1);
    currentGameState.fieldCards[botIndex] = card;
    currentGameState.playerSelections[botIndex] = true;

    console.log(`[Bot] Player ${botIndex} (Bot) played:`, card);

    // 全員に通知
    io.to(roomId).emit('card_played', {
      playerIndex: botIndex,
      card,
      fieldCards: currentGameState.fieldCards
    });

    io.to(roomId).emit('turn_update', {
      currentMultiplier: currentGameState.currentMultiplier,
      fieldCards: currentGameState.fieldCards,
      scores: currentGameState.scores,
      playerSelections: currentGameState.playerSelections
    });

    // 全員選択したか確認
    if (currentGameState.playerSelections.every(Boolean)) {
      setTimeout(() => {
        handleRoundEndCallback(roomId, currentGameState);
      }, 1500);
    }
  }, delay);
}

/**
 * Bot プレイヤー情報を生成
 * @param {string} socketId - 仮のSocket ID
 * @param {number} botNumber - Bot番号
 * @returns {Object} Botプレイヤー情報
 */
function createBotPlayer(socketId, botNumber) {
  return {
    id: socketId,
    name: `Bot ${botNumber}`,
    isBot: true
  };
}

module.exports = {
  selectRandomCard,
  botAutoPlay,
  createBotPlayer
};