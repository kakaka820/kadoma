// server/round/rewardDistributor.js
// チップ・ボーナス・クエスト配分処理

const { distributeGameReward } = require('../utils/currencyHelper');
const { updateQuestProgress } = require('../utils/questManager');
const { checkAndGrantDailyBonus } = require('../utils/dailyBonus');
const { supabase } = require('../supabaseClient');

/**
 * チップ配分
 */
async function distributeChips(gameState) {
  if (!gameState.roomConfig) {
    return null;
  }
  
  const results = [];
  
  for (let i = 0; i < gameState.players.length; i++) {
    const player = gameState.players[i];
    const score = gameState.scores[i];
    
    if (player.isBot || !player.userId) {
      continue;
    }
    
    const profit = Math.max(0, score);
    
    if (profit > 0) {
      await distributeGameReward(player.userId, gameState.roomId, profit);
    }
    
    results.push({
      userId: player.userId,
      profit: profit
    });
  }
  
  return results;
}

/**
 * デイリーボーナス処理
 */
async function processDailyBonuses(gameState) {
  const bonusResults = {};
  
  for (let i = 0; i < gameState.players.length; i++) {
    const player = gameState.players[i];
    
    if (player.isBot || !player.userId) {
      continue;
    }
    
    const bonusResult = await checkAndGrantDailyBonus(player.userId);
    bonusResults[player.userId] = bonusResult;
    
    console.log(`[DailyBonus] User ${player.userId}:`, bonusResult);
  }
  
  return bonusResults;
}

/**
 * 最新通貨情報を取得
 */
async function getUpdatedCurrencies(chipResults) {
  const updatedCurrencies = {};
  
  if (!chipResults) return updatedCurrencies;
  
  for (const result of chipResults) {
    if (result.userId) {
      const { data, error } = await supabase
        .from('users')
        .select('currency')
        .eq('id', result.userId)
        .single();
      
      if (data && !error) {
        updatedCurrencies[result.userId] = data.currency;
        console.log(`[GameOver] Updated currency for ${result.userId}: ${data.currency}`);
      } else {
        console.error(`[GameOver] Failed to get currency for ${result.userId}:`, error);
      }
    }
  }
  
  return updatedCurrencies;
}

/**
 * クエスト進捗を更新
 */
async function processQuestProgress(nextState, rankings) {
  for (const ranking of rankings) {
    const player = nextState.players[ranking.playerIndex];
    
    if (player.isBot || !player.userId) {
      continue;
    }
    
    const userId = player.userId;
    
    // プレイ回数
    await updateQuestProgress(userId, 'play_games', 1);
    console.log(`[Quest] User ${userId}: play_games +1`);
    
    // 勝利判定
    if (ranking.profit >= 0) {
      await updateQuestProgress(userId, 'win_games', 1);
      console.log(`[Quest] User ${userId}: win_games +1`);
    }
    
    // チップ獲得量
    if (ranking.profit > 0) {
      await updateQuestProgress(userId, 'earn_chips', ranking.profit);
      await updateQuestProgress(userId, 'earn_chips_single', ranking.profit);
      console.log(`[Quest] User ${userId}: earn_chips +${ranking.profit}`);
    }
  }
}

module.exports = {
  distributeChips,
  processDailyBonuses,
  getUpdatedCurrencies,
  processQuestProgress
};