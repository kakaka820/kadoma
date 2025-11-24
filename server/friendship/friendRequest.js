// server/friendship/friendRequest.js
// フレンド申請の送信・承認・拒否

const { supabase } = require('../supabaseClient');
const { findUserByPlayerId } = require('./friendSearch');

/**
 * フレンド申請を送信
 */
async function sendFriendRequest(userId, targetPlayerId) {
  // 自分自身には申請できない
  const { data: selfUser } = await supabase
    .from('users')
    .select('player_id')
    .eq('id', userId)
    .single();

  if (selfUser && selfUser.player_id === targetPlayerId) {
    return { success: false, error: '自分自身にフレンド申請はできません' };
  }

  // 対象ユーザーを検索
  const targetResult = await findUserByPlayerId(targetPlayerId);
  if (!targetResult.success) {
    return targetResult;
  }

  const friendId = targetResult.user.id;

  // 既存の申請をチェック
  const { data: existing } = await supabase
    .from('friendships')
    .select('*')
    .or(`and(user_id.eq.${userId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${userId})`)
    .single();

  if (existing) {
    if (existing.status === 'accepted') {
      return { success: false, error: '既にフレンドです' };
    } else if (existing.status === 'pending') {
      return { success: false, error: '既に申請済みです' };
    } else if (existing.status === 'blocked') {
      return { success: false, error: 'この操作は実行できません' };
    }
  }

  // 新規申請を作成
  const { data, error } = await supabase
    .from('friendships')
    .insert({
      user_id: userId,
      friend_id: friendId,
      status: 'pending'
    })
    .select()
    .single();

  if (error) {
    console.error('[Friend] Request error:', error);
    return { success: false, error: '申請の送信に失敗しました' };
  }

  console.log(`[Friend] Request sent: ${userId} -> ${friendId}`);
  return { 
    success: true, 
    friendship: data,
    targetUser: targetResult.user
  };
}

/**
 * フレンド申請を承認
 */
async function acceptFriendRequest(userId, friendshipId) {
  // 申請を取得（自分宛の申請か確認）
  const { data: friendship, error: fetchError } = await supabase
    .from('friendships')
    .select('*')
    .eq('id', friendshipId)
    .eq('friend_id', userId)
    .eq('status', 'pending')
    .single();

  if (fetchError || !friendship) {
    return { success: false, error: '申請が見つかりません' };
  }

  // ステータスを更新
  const { error: updateError } = await supabase
    .from('friendships')
    .update({ 
      status: 'accepted',
      updated_at: new Date().toISOString()
    })
    .eq('id', friendshipId);

  if (updateError) {
    console.error('[Friend] Accept error:', updateError);
    return { success: false, error: '承認に失敗しました' };
  }

  console.log(`[Friend] Request accepted: ${friendshipId}`);
  return { success: true };
}

/**
 * フレンド申請を拒否
 */
async function rejectFriendRequest(userId, friendshipId) {
  // 申請を取得（自分宛の申請か確認）
  const { data: friendship, error: fetchError } = await supabase
    .from('friendships')
    .select('*')
    .eq('id', friendshipId)
    .eq('friend_id', userId)
    .eq('status', 'pending')
    .single();

  if (fetchError || !friendship) {
    return { success: false, error: '申請が見つかりません' };
  }

  // ステータスを更新
  const { error: updateError } = await supabase
    .from('friendships')
    .update({ 
      status: 'rejected',
      updated_at: new Date().toISOString()
    })
    .eq('id', friendshipId);

  if (updateError) {
    console.error('[Friend] Reject error:', updateError);
    return { success: false, error: '拒否に失敗しました' };
  }

  console.log(`[Friend] Request rejected: ${friendshipId}`);
  return { success: true };
}

module.exports = {
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest
};