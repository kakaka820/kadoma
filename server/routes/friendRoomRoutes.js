// server/routes/friendRoomRoutes.js
const express = require('express');
const router = express.Router();
const {
  createFriendRoom,
  getInvitedRooms,
  getMyCreatedRooms,
  deleteFriendRoom,
  getFriendRoom
} = require('../friendRoomHandler');

/**
 * POST /api/friend-room/create
 * フレンド部屋を作成
 */
router.post('/friend-room/create', async (req, res) => {
  const { userId, config } = req.body;

  if (!userId || !config) {
    return res.status(400).json({ 
      success: false, 
      error: 'ユーザーIDと設定が必要です' 
    });
  }

  const result = await createFriendRoom(userId, config);
  
  if (result.success) {
    return res.json({ success: true, room: result.room });
  } else {
    return res.status(400).json({ success: false, error: result.error });
  }
});

/**
 * GET /api/friend-room/invited/:userId
 * 招待されているフレンド部屋一覧を取得
 */
router.get('/friend-room/invited/:userId', async (req, res) => {
  const { userId } = req.params;
  const result = await getInvitedRooms(userId);
  
  res.json({ 
    success: result.success, 
    rooms: result.rooms 
  });
});

/**
 * GET /api/friend-room/created/:userId
 * 自分が作成したフレンド部屋一覧を取得
 */
router.get('/friend-room/created/:userId', async (req, res) => {
  const { userId } = req.params;
  const result = await getMyCreatedRooms(userId);
  
  res.json({ 
    success: result.success, 
    rooms: result.rooms 
  });
});

/**
 * DELETE /api/friend-room/:roomId
 * フレンド部屋を削除
 */
router.delete('/friend-room/:roomId', async (req, res) => {
  const { roomId } = req.params;
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ 
      success: false, 
      error: 'ユーザーIDが必要です' 
    });
  }

  const result = await deleteFriendRoom(userId, roomId);
  
  if (result.success) {
    return res.json({ success: true });
  } else {
    return res.status(400).json({ success: false, error: result.error });
  }
});

/**
 * GET /api/friend-room/:roomId
 * フレンド部屋情報を取得
 */
router.get('/friend-room/:roomId', async (req, res) => {
  const { roomId } = req.params;
  const result = await getFriendRoom(roomId);
  
  if (result.success) {
    return res.json({ success: true, room: result.room });
  } else {
    return res.status(400).json({ success: false, error: result.error });
  }
});

module.exports = router;