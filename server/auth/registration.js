// server/auth/registration.js
// ユーザー登録処理

const { supabase } = require('../supabaseClient');
const { getNextPlayerId } = require('../utils/playerIdManager');

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
      transferCode: data.transfer_code,
      playerId: data.player_id
    }
  };
}

module.exports = {
  registerUser,
  checkUsernameExists,
  generateTransferCode
};