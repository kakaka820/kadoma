// server/friendship/friendList.js
// フレンドリスト取得処理

const { supabase } = require('../supabaseClient');

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
  getFriendList,
  getPendingRequests
};