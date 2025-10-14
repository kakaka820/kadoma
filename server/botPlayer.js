// server/botPlayer.js
// Bot プレイヤーのAI処理

const { TURN_TIME_LIMIT, BOT_MIN_DELAY_MS, BOT_MAX_DELAY_MS } = require('../shared/config');
const { rankToValue } = require('../shared/core/cardValue');


// Bot戦略の定義
const BOT_STRATEGIES = {
  RANDOM: 'random',      // ランダム選択
  AGGRESSIVE: 'aggressive', // 強気（大きい順）
  PASSIVE: 'passive',    // 弱気（小さい順）
  ADAPTIVE: 'adaptive'   // 適応型（毎セット変更）
};




/**
 * 戦略に基づいてカードを選択
 * @param {Array} hand - 手札
 * @param {number} setTurnIndex - セット内ターン（0-4）
 * @param {string} strategy - Bot戦略
 * @param {number} setNumber - セット番号（0-4）
 * @returns {number} 選択したカードのインデックス
 */
function selectCardByStrategy(hand, setTurnIndex, strategy, setNumber = 0) {
  if (hand.length === 0) return -1;
  // セットの1ターン目はJOKER除外
  let validCards = hand.map((card, idx) => ({ card, idx }));
  
  if (setTurnIndex === 0) {
    validCards = validCards.filter(item => !item.card.rank?.startsWith('JOKER'));
    if (validCards.length === 0) validCards = hand.map((card, idx) => ({ card, idx }));
  }

  // 適応型の場合、セットごとに戦略を変更
  let activeStrategy = strategy;
  if (strategy === BOT_STRATEGIES.ADAPTIVE) {
    const strategies = [BOT_STRATEGIES.RANDOM, BOT_STRATEGIES.AGGRESSIVE, BOT_STRATEGIES.PASSIVE];
    activeStrategy = strategies[setNumber % 3];
    console.log(`[Bot] Adaptive strategy for set ${setNumber}: ${activeStrategy}`);
  }
  switch (activeStrategy) {
    case BOT_STRATEGIES.AGGRESSIVE:
      // 強気：大きいカードから出す
      validCards.sort((a, b) => rankToValue(b.card) - rankToValue(a.card));
      return validCards[0].idx;
    case BOT_STRATEGIES.PASSIVE:
      // 弱気：小さいカードから出す
      validCards.sort((a, b) => rankToValue(a.card) - rankToValue(b.card));
      return validCards[0].idx;
    case BOT_STRATEGIES.RANDOM:
    default:
      // ランダム選択
      const randomIdx = Math.floor(Math.random() * validCards.length);
      return validCards[randomIdx].idx;
  }
}

/**
 * Bot が自動でカードを選択（遅延あり）
 *  @param {boolean} isProxy - 代理Botかどうか（切断時の代理）
 * @param {Object} io - Socket.IO インスタンス
 * @param {Map} games - ゲーム状態Map
 * @param {string} roomId - 部屋ID
 * @param {number} botIndex - BotのプレイヤーIndex
 * @param {Function} handleRoundEndCallback - ラウンド終了時のコールバック
 */
function botAutoPlay(io, games, roomId, botIndex, handleRoundEndCallback, isProxy = false) {
  const gameState = games.get(roomId);
  if (!gameState) return;

  // すでに選択済みなら無視
  if (gameState.playerSelections[botIndex]) return;

  const player = gameState.players[botIndex];
  const strategy = player.botStrategy || BOT_STRATEGIES.RANDOM;

   
  //player.isProxy も確認（引数より優先）
  const isProxyBot = isProxy || player.isProxy || false;
  

  //セット番号を遅延前に計算
  const setNumber = Math.floor(gameState.turnIndex / 5);

  //人間らしさ演出
  // 代理Botは即座に選択（遅延なし）
  const delay = isProxyBot ? 0 : BOT_MIN_DELAY_MS + Math.floor(Math.random() * (BOT_MAX_DELAY_MS - BOT_MIN_DELAY_MS));

  setTimeout(() => {
    const currentGameState = games.get(roomId);
    if (!currentGameState) return;

    // 再度選択済みチェック
    if (currentGameState.playerSelections[botIndex]) return;

    const hand = currentGameState.hands[botIndex];

    //戦略に基づいて選択
    const cardIndex = selectCardByStrategy(hand, currentGameState.setTurnIndex, strategy, setNumber);
    if (cardIndex === -1) return;
    const card = hand[cardIndex];

    // カードを場に出す
    hand.splice(cardIndex, 1);
    currentGameState.fieldCards[botIndex] = card;
    currentGameState.playerSelections[botIndex] = true;



    console.log(`[Bot] Player ${botIndex} (${strategy}, proxy: ${isProxyBot}) played:`, card);

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

      //代理Bot の場合は即公開・即処理
      if (isProxyBot) {
        console.log('[Bot] Proxy bot triggered instant reveal');
        
        currentGameState.players.forEach((player, idx) => {
          io.to(player.id).emit('cards_revealed', {
            fieldCards: currentGameState.fieldCards,
            hand: currentGameState.hands[idx]
          });
        });

        // 即座に handleRoundEnd（遅延なし）
        handleRoundEndCallback(io, games, roomId, currentGameState);
        return;
      }
      setTimeout(() => {
        handleRoundEndCallback(io, games, roomId, currentGameState);
      }, 1500);
    }
  }, delay);
}

/**
 * Bot プレイヤー情報を生成
 * @param {string} socketId - 仮のSocket ID
 * @param {number} botNumber - Bot番号
 * @returns {Object} Botプレイヤー情報
 *  @param {boolean} isProxy - 代理Botかどうか
 */
function createBotPlayer(socketId, botNumber, strategy = BOT_STRATEGIES.RANDOM, isProxy = false) {
  const strategyNames = {
    [BOT_STRATEGIES.RANDOM]: 'ランダム',
    [BOT_STRATEGIES.AGGRESSIVE]: '強気',
    [BOT_STRATEGIES.PASSIVE]: '弱気',
    [BOT_STRATEGIES.ADAPTIVE]: '適応型'
  };

  return {
    id: socketId,
    name: isProxy ? `代理Bot ${botNumber}` : `Bot ${botNumber} (${strategyNames[strategy]})`,
    isBot: true,
    isProxy: isProxy,
    botStrategy: strategy
  };
}

module.exports = {
  selectCardByStrategy,
  botAutoPlay,
  createBotPlayer,
  BOT_STRATEGIES
};