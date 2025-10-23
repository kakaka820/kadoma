// server/bot/strategies/adaptiveStrategy.js
// 適応型戦略：セットごとに戦略を変更

const randomStrategy = require('./randomStrategy');
const aggressiveStrategy = require('./aggressiveStrategy');
const passiveStrategy = require('./passiveStrategy');


const setStrategyCache = new Map();

/**
 * 適応型戦略でカードを選択（セットごとに変化）
 * @param {Array} hand - 手札
 * @param {number} setTurnIndex - セット内ターン（0-4）
 * @param {Object} gameState - ゲーム状態（turnIndex が必要）
 * @returns {number} 選択したカードのインデックス
 */
function selectCard(hand, setTurnIndex, gameState = {}) {
  if (hand.length === 0) return -1;

  // セット番号を計算（0-4）
  const setNumber = Math.floor((gameState.turnIndex || 0) / 5);
  
  // セットごとに戦略を切り替え

  let strategy;

  if (setStrategyCache.has(setNumber)) {
    strategy = setStrategyCache.get(setNumber);
  } else {
    // ランダムに戦略を選択
    const strategies = [randomStrategy, aggressiveStrategy, passiveStrategy];
    const randomIndex = Math.floor(Math.random() * strategies.length);
    strategy = strategies[randomIndex];
    
    // キャッシュに保存
    setStrategyCache.set(setNumber, strategy);
    
    // 古いキャッシュを削除（メモリ節約）
    if (setStrategyCache.size > 10) {
      const oldestKey = setStrategyCache.keys().next().value;
      setStrategyCache.delete(oldestKey);
    }
  }
   // 選択した戦略名を表示
  const strategyName = 
    strategy === randomStrategy ? 'Random' : 
    strategy === aggressiveStrategy ? 'Aggressive' : 
    'Passive';
  
  console.log(`[Adaptive] Set ${setNumber}: Using ${strategyName}`);
  
  return strategy.selectCard(hand, setTurnIndex, gameState);
}

module.exports = { selectCard };