// server/friendRoomHandler.js
const { supabase } = require('./supabaseClient');

/**
 * フレンド部屋用のルームコード生成（6文字）
 */
function generateRoomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * フレンド部屋を作成
 */
async function createFriendRoom(userId, config) {
  const { roomName, ante, jokerCount, timeLimit, invitedFriends } = config;

  // ルームコード生成（重複チェック）
  let roomCode;
  let codeExists = true;

  while (codeExists) {
    roomCode = generateRoomCode();
    const { data } = await supabase
      .from('friend_rooms')
      .select('id')
      .eq('room_code', roomCode)
      .single();
    codeExists = data !== null;
  }

  // 有効期限（24時間後）
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24);

  // room_config を構築
  const roomConfig = {
    roomName: roomName || 'フレンド戦',
    ante: ante || 1000,
    jokerCount: jokerCount || 2,
    timeLimit: timeLimit || 30,
    maxPlayers: 3
  };

  // ルーム作成
  const { data, error } = await supabase
    .from('friend_rooms')
    .insert({
      room_code: roomCode,
      creator_id: userId,
      invited_friends: invitedFriends || [],
      room_config: roomConfig,
      status: 'waiting',
      expires_at: expiresAt.toISOString()
    })
    .select()
    .single();

  if (error) {
    console.error('[FriendRoom] Create error:', error);
    return { success: false, error: 'ルーム作成に失敗しました' };
  }

  console.log(`[FriendRoom] Created: ${data.id} (${roomCode})`);
  return { success: true, room: data };
}

/**
 * フレンド部屋一覧を取得（自分が招待されている部屋）
 */
async function getInvitedRooms(userId) {
  const { data, error } = await supabase
    .from('friend_rooms')
    .select(`
      *,
      creator:users!friend_rooms_creator_id_fkey(id, username, player_id)
    `)
    .contains('invited_friends', [userId])
    .eq('status', 'waiting')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[FriendRoom] Get invited rooms error:', error);
    return { success: false, rooms: [] };
  }

  const rooms = data.map(room => ({
    id: room.id,
    roomCode: room.room_code,
    creatorId: room.creator_id,
    creatorUsername: room.creator.username,
    creatorPlayerId: room.creator.player_id,
    config: room.room_config,
    createdAt: room.created_at
  }));

  return { success: true, rooms };
}

/**
 * 自分が作成したフレンド部屋を取得
 */
async function getMyCreatedRooms(userId) {
  const { data, error } = await supabase
    .from('friend_rooms')
    .select('*')
    .eq('creator_id', userId)
    .eq('status', 'waiting')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[FriendRoom] Get created rooms error:', error);
    return { success: false, rooms: [] };
  }

  const rooms = data.map(room => ({
    id: room.id,
    roomCode: room.room_code,
    config: room.room_config,
    invitedFriends: room.invited_friends || [],
    createdAt: room.created_at
  }));

  return { success: true, rooms };
}

/**
 * フレンド部屋を削除
 */
async function deleteFriendRoom(userId, roomId) {
  // 自分が作成した部屋か確認
  const { data: room } = await supabase
    .from('friend_rooms')
    .select('creator_id')
    .eq('id', roomId)
    .single();

  if (!room || room.creator_id !== userId) {
    return { success: false, error: '部屋が見つかりません' };
  }

  const { error } = await supabase
    .from('friend_rooms')
    .delete()
    .eq('id', roomId);

  if (error) {
    console.error('[FriendRoom] Delete error:', error);
    return { success: false, error: '削除に失敗しました' };
  }

  console.log(`[FriendRoom] Deleted: ${roomId}`);
  return { success: true };
}

/**
 * フレンド部屋情報を取得
 */
async function getFriendRoom(roomId) {
  const { data, error } = await supabase
    .from('friend_rooms')
    .select(`
      *,
      creator:users!friend_rooms_creator_id_fkey(id, username, player_id)
    `)
    .eq('id', roomId)
    .single();

  if (error || !data) {
    console.error('[FriendRoom] Get room error:', error);
    return { success: false, error: '部屋が見つかりません' };
  }

  return {
    success: true,
    room: {
      id: data.id,
      roomCode: data.room_code,
      creatorId: data.creator_id,
      creatorUsername: data.creator.username,
      config: data.room_config,
      invitedFriends: data.invited_friends || [],
      status: data.status
    }
  };
}

module.exports = {
  createFriendRoom,
  getInvitedRooms,
  getMyCreatedRooms,
  deleteFriendRoom,
  getFriendRoom,
  generateRoomCode
};