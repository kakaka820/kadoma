// server/utils/playerIdManager.js
const { supabase } = require('../supabaseClient');

/**
 * 次のプレイヤーIDを取得（7桁の連番）
 */
async function getNextPlayerId() {
  // 最大のplayer_idを取得
  const { data, error } = await supabase
    .from('users')
    .select('player_id')
    .order('player_id', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = データが見つからない（初回）
    console.error('[PlayerID] Error fetching max player_id:', error);
    return 1000000; // デフォルトは1000000から開始
  }

  // データがない場合は1000000から開始、ある場合は+1
  const nextId = data ? (data.player_id || 0) + 1 : 1000000;
  
  // 7桁を超えないようにチェック
  if (nextId > 9999999) {
    throw new Error('Player ID limit exceeded');
  }

  return nextId;
}

/**
 * 既存ユーザーにプレイヤーIDを割り当て（マイグレーション用）
 */
async function assignPlayerIdsToExistingUsers() {
  // player_idがnullのユーザーを取得
  const { data: users, error } = await supabase
    .from('users')
    .select('id')
    .is('player_id', null);

  if (error) {
    console.error('[PlayerID] Migration error:', error);
    return;
  }

  if (!users || users.length === 0) {
    console.log('[PlayerID] No users need player_id assignment');
    return;
  }

  console.log(`[PlayerID] Assigning player_id to ${users.length} users...`);

  let nextId = await getNextPlayerId();

  for (const user of users) {
    const { error: updateError } = await supabase
      .from('users')
      .update({ player_id: nextId })
      .eq('id', user.id);

    if (updateError) {
      console.error(`[PlayerID] Failed to assign ${nextId} to user ${user.id}:`, updateError);
    } else {
      console.log(`[PlayerID] Assigned ${nextId} to user ${user.id}`);
    }

    nextId++;
  }

  console.log('[PlayerID] Migration complete!');
}

module.exports = {
  getNextPlayerId,
  assignPlayerIdsToExistingUsers
};