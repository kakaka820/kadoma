// server/warningSystem.js
// 警告システム（JOKER配布・デッキ残量警告）

const { checkJokerInHands } = require('../shared/game/joker');
const { LOW_DECK_THRESHOLD } = require('../shared/config/config');

/**
 * JOKER・デッキ残量の警告チェック＆送信
 */
function checkAndSendWarnings(io, gameState, players) {
  const { hands, deck } = gameState;
  
  // JOKER配布チェック
  const playersData = hands.map((hand, idx) => ({
    name: players[idx].name,
    hand,
    points: gameState.scores[idx],
    wins: gameState.wins[idx]
  }));
  
  const hasJoker = checkJokerInHands(playersData);
  
  // JOKER警告を全員に送信（誰か1人でも持ってたら）
  if (hasJoker) {
    io.to(gameState.roomId).emit('warning', {
      type: 'joker_dealt',
      message: '🃏 JOKERが配られました！'
    });
  }
  
  // デッキ残り少ないチェック
  if (deck.length <= LOW_DECK_THRESHOLD && deck.length > 0) {
    io.to(gameState.roomId).emit('warning', {
      type: 'low_deck',
      message: `⚠️ デッキ残り${deck.length}枚！`
    });
  }
}

module.exports = {
  checkAndSendWarnings
};