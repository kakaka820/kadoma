// server/friendship/friendSearch.js
// ユーザー検索処理

const { supabase } = require('../supabaseClient');

/**
 * プレイヤーIDでユーザー検索
 */
async function findUserByPlayerId(playerId) {
  const { data, error } = await supabase
    .from('users')
    .select('id, username, player_id, last_login_at')
    .eq('player_id', playerId)
    .single();

  if (error) {
    return { success: false, error: 'ユーザーが見つかりません' };
  }

  return { success: true, user: data };
}

module.exports = {
  findUserByPlayerId
};