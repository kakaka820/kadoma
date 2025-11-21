// server/friendSystem.js
const { supabase } = require('./supabaseClient');

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

/**
 * フレンドリストを取得
 */
async function getFriendList(userId) {
  const { data, error } = await supabase
    .from('friendships')
    .select(`
      id,
      created_at,
      user:users!friendships_user_id_fkey(id, username, player_id, last_login_at),
      friend:users!friendships_friend_id_fkey(id, username, player_id, last_login_at)
    `)
    .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
    .eq('status', 'accepted');

  if (error) {
    console.error('[Friend] List error:', error);
    return { success: false, friends: [] };
  }

  // 自分以外の情報を抽出
  const friends = data.map(f => {
    const isSender = f.user.id === userId;
    const friendData = isSender ? f.friend : f.user;
    return {
      id: f.id,
      friendId: friendData.id,
      username: friendData.username,
      playerId: friendData.player_id,
      lastLoginAt: friendData.last_login_at,
      createdAt: f.created_at
    };
  });

  return { success: true, friends };
}

/**
 * 受信したフレンド申請一覧を取得
 */
async function getPendingRequests(userId) {
  const { data, error } = await supabase
    .from('friendships')
    .select(`
      id,
      created_at,
      sender:users!friendships_user_id_fkey(id, username, player_id)
    `)
    .eq('friend_id', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[Friend] Pending requests error:', error);
    return { success: false, requests: [] };
  }

  const requests = data.map(r => ({
    id: r.id,
    senderId: r.sender.id,
    senderUsername: r.sender.username,
    senderPlayerId: r.sender.player_id,
    createdAt: r.created_at
  }));

  return { success: true, requests };
}

module.exports = {
  findUserByPlayerId,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  getFriendList,
  getPendingRequests
};