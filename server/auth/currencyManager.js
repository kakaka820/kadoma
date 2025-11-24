// server/auth/currencyManager.js
// 通貨管理処理

const { supabase } = require('../supabaseClient');

/**
 * 通貨残高チェック
 */
async function checkSufficientCurrency(userId, requiredAmount) {
  console.log(`[checkSufficientCurrency] userId: ${userId}, requiredAmount: ${requiredAmount}`);
  const { data, error } = await supabase
    .from('users')
    .select('currency')
    .eq('id', userId)
    .single();

  if (error || !data) {
    console.log(`[checkSufficientCurrency] Error or no data found`);
    return { sufficient: false, current: 0, required: requiredAmount };
  }
  
  const current = data.currency || 0;
  console.log(`[checkSufficientCurrency] Current currency: ${current}`);
  console.log(`[checkSufficientCurrency] Sufficient: ${current >= requiredAmount}`);
  
  return {
    sufficient: current >= requiredAmount,
    current: current,
    required: requiredAmount,
    shortage: Math.max(0, requiredAmount - current)
  };
}

/**
 * ユーザーの通貨（currency）を更新
 */
async function updateUserCurrency(userId, currencyChange) {
  // 現在の通貨を取得
  const { data: current } = await supabase
    .from('users')
    .select('currency')
    .eq('id', userId)
    .single();
  
  if (!current) {
    return { success: false, error: 'ユーザーが見つかりません' };
  }
  
  const newCurrency = (current.currency || 0) + currencyChange;
  
  // 更新
  const { data, error } = await supabase
    .from('users')
    .update({ currency: newCurrency })
    .eq('id', userId)
    .select()
    .single();
  
  if (error) {
    return { success: false, error: '更新に失敗しました' };
  }
  
  console.log(`[認証] User ${userId} currency updated: ${newCurrency}`);
  return { success: true, currency: data.currency };
}

module.exports = {
  checkSufficientCurrency,
  updateUserCurrency
};