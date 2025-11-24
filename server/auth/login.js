// server/auth/login.js
// ログイン処理

const { supabase } = require('../supabaseClient');

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
      transferCode: data.transfer_code,
      playerId: data.player_id
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
      transferCode: data.transfer_code,
      playerId: data.player_id
    }
  };
}

module.exports = {
  loginWithTransferCode,
  loginWithUserId
};