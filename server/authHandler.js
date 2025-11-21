// server/authHandler.js
const { supabase } = require('./supabaseClient');
const { v4: uuidv4 } = require('uuid');
const { getNextPlayerId } = require('./utils/playerIdManager');

/**
 * 引継ぎコード生成（8文字: ABCD1234）
 */
function generateTransferCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * ユーザー名の重複チェック
 */
async function checkUsernameExists(username) {
  const { data, error } = await supabase
    .from('users')
    .select('id')
    .eq('username', username)
    .single();
  
  return data !== null;
}

/**
 * 新規ユーザー登録
 */
async function registerUser(username) {
  console.log('[認証] ユーザー登録開始:', username);
  
  // 重複チェック
  const exists = await checkUsernameExists(username);
  if (exists) {
    console.log('[認証] ユーザー名重複:', username);
    return { success: false, error: 'ユーザー名が既に使用されています' };
  }
  
  // 引継ぎコード生成（重複しないまで試行）
  let transferCode;
  let codeExists = true;
  
  while (codeExists) {
    transferCode = generateTransferCode();
    const { data } = await supabase
      .from('users')
      .select('id')
      .eq('transfer_code', transferCode)
      .single();
    codeExists = data !== null;
  }

  // プレイヤーID生成
  const playerId = await getNextPlayerId();
  
  // ユーザー作成
  const { data, error } = await supabase
    .from('users')
    .insert({
      username: username,
      currency: 10000,
      transfer_code: transferCode,
      player_id: playerId,
      last_login_at: new Date().toISOString()
    })
    .select()
    .single();
  
  if (error) {
    console.error('[認証] 登録エラー:', error);
    return { success: false, error: 'ユーザー登録に失敗しました' };
  }
  
  console.log('[認証] 登録成功:', data.id, username);
  return {
    success: true,
    user: {
      id: data.id,
      username: data.username,
      currency: data.currency,
      chips: data.chips || 10000,
      transferCode: data.transfer_code,
      playerId: data.player_id
    }
  };
}

/**
 * 引継ぎコードでログイン
 */
async function loginWithTransferCode(transferCode) {
  console.log('[認証] 引継ぎコードログイン:', transferCode);
  
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('transfer_code', transferCode)
    .single();
  
  if (error || !data) {
    console.log('[認証] 引継ぎコード無効:', transferCode);
    return { success: false, error: '引継ぎコードが無効です' };
  }
  
  // 最終ログイン時刻更新
  await supabase
    .from('users')
    .update({ last_login_at: new Date().toISOString() })
    .eq('id', data.id);
  
  console.log('[認証] ログイン成功:', data.username);
  return {
    success: true,
    user: {
      id: data.id,
      username: data.username,
      currency: data.currency,
      transferCode: data.transfer_code
    }
  };
}

/**
 * ユーザーIDでログイン（自動ログイン用）
 */
async function loginWithUserId(userId) {
  console.log('[認証] 自動ログイン:', userId);
  
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error || !data) {
    console.log('[認証] ユーザーID無効:', userId);
    return { success: false, error: 'ユーザーが見つかりません' };
  }
  
  // 最終ログイン時刻更新
  await supabase
    .from('users')
    .update({ last_login_at: new Date().toISOString() })
    .eq('id', data.id);
  
  console.log('[認証] 自動ログイン成功:', data.username);
  return {
    success: true,
    user: {
      id: data.id,
      username: data.username,
      currency: data.currency,
      transferCode: data.transfer_code
    }
  };
}
// チップ残高取得
async function getUserChips(userId) {
  const { data, error } = await supabase
    .from('users')
    .select('chips')
    .eq('id', userId)
    .single();
  
  if (error || !data) {
    return { success: false, chips: 0 };
  }
  
  return { success: true, chips: data.chips || 0 };
}

// チップ更新（増減）
async function updateUserChips(userId, chipChange) {
  // 現在のチップを取得
  const { data: current } = await supabase
    .from('users')
    .select('chips')
    .eq('id', userId)
    .single();
  
  if (!current) {
    return { success: false, error: 'ユーザーが見つかりません' };
  }
  
  const newChips = (current.chips || 0) + chipChange;
  
  // 更新
  const { data, error } = await supabase
    .from('users')
    .update({ chips: newChips })
    .eq('id', userId)
    .select()
    .single();
  
  if (error) {
    return { success: false, error: '更新に失敗しました' };
  }
  
  return { success: true, chips: data.chips };
}

// チップ残高チェック
// server/authHandler.js に新しい関数を追加

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
  registerUser,
  loginWithTransferCode,
  loginWithUserId,
  checkUsernameExists,
  getUserChips,
  updateUserChips,
  checkSufficientCurrency,
  updateUserCurrency
};