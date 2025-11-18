// server/utils/dailyBonus.js
const { supabase } = require('../supabaseClient');

/**
 * デイリーボーナスをチェック・付与
 * @param {string} userId - ユーザーID
 * @returns {Promise<{bonusGranted: boolean, bonusAmount: number, remainingPlays: number}>}
 */
async function checkAndGrantDailyBonus(userId) {
  const BONUS_AMOUNT = 3000;
  const MAX_DAILY_PLAYS = 3;
  
  try {
    // 今日の日付を取得（YYYY-MM-DD形式）
    const today = new Date().toISOString().split('T')[0];
    
    console.log(`[DailyBonus] Checking for user ${userId}, date: ${today}`);
    
    // 今日のレコードを取得
    const { data: dailyRecord, error: fetchError } = await supabase
      .from('daily_free_plays')
      .select('*')
      .eq('user_id', userId)
      .eq('play_date', today)
      .single();
    
    // レコードが存在しない場合は新規作成
    if (fetchError && fetchError.code === 'PGRST116') {
      console.log('[DailyBonus] No record found, creating new one');
      
      const { data: newRecord, error: insertError } = await supabase
        .from('daily_free_plays')
        .insert({
          user_id: userId,
          play_date: today,
          plays_used: 1,
          max_plays: MAX_DAILY_PLAYS
        })
        .select()
        .single();
      
      if (insertError) {
        console.error('[DailyBonus] Failed to create record:', insertError);
        return { bonusGranted: false, bonusAmount: 0, remainingPlays: 0 };
      }
      
      // ボーナス付与
      await grantBonus(userId, BONUS_AMOUNT);
      
      console.log(`[DailyBonus] First play of the day! Bonus granted: ${BONUS_AMOUNT}G`);
      return { 
        bonusGranted: true, 
        bonusAmount: BONUS_AMOUNT, 
        remainingPlays: MAX_DAILY_PLAYS - 1 
      };
    }
    
    // レコード取得失敗
    if (fetchError) {
      console.error('[DailyBonus] Failed to fetch record:', fetchError);
      return { bonusGranted: false, bonusAmount: 0, remainingPlays: 0 };
    }
    
    // すでに3回プレイ済み
    if (dailyRecord.plays_used >= MAX_DAILY_PLAYS) {
      console.log('[DailyBonus] Max plays reached for today');
      return { bonusGranted: false, bonusAmount: 0, remainingPlays: 0 };
    }
    
    // plays_usedを+1
    const { error: updateError } = await supabase
      .from('daily_free_plays')
      .update({ plays_used: dailyRecord.plays_used + 1 })
      .eq('user_id', userId)
      .eq('play_date', today);
    
    if (updateError) {
      console.error('[DailyBonus] Failed to update plays_used:', updateError);
      return { bonusGranted: false, bonusAmount: 0, remainingPlays: 0 };
    }
    
    // ボーナス付与
    await grantBonus(userId, BONUS_AMOUNT);
    
    const remainingPlays = MAX_DAILY_PLAYS - (dailyRecord.plays_used + 1);
    console.log(`[DailyBonus] Bonus granted! Remaining plays: ${remainingPlays}`);
    
    return { 
      bonusGranted: true, 
      bonusAmount: BONUS_AMOUNT, 
      remainingPlays 
    };
    
  } catch (error) {
    console.error('[DailyBonus] Unexpected error:', error);
    return { bonusGranted: false, bonusAmount: 0, remainingPlays: 0 };
  }
}

/**
 * ボーナスを付与
 */
async function grantBonus(userId, amount) {
  const { error } = await supabase.rpc('increment_currency', {
    user_id: userId,
    amount: amount
  });
  
  if (error) {
    console.error('[DailyBonus] Failed to grant bonus:', error);
    throw error;
  }
  
  console.log(`[DailyBonus] Granted ${amount}G to user ${userId}`);
}

module.exports = {
  checkAndGrantDailyBonus
};