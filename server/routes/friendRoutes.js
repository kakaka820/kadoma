// server/routes/friendRoutes.js
const express = require('express');
const router = express.Router();
const {
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  getFriendList,
  getPendingRequests
} = require('../friendship');

/**
 * POST /api/friend/request
 * フレンド申請を送信
 */
router.post('/friend/request', async (req, res) => {
  const { userId, targetPlayerId } = req.body;

  if (!userId || !targetPlayerId) {
    return res.status(400).json({ 
      success: false, 
      error: 'ユーザーIDとプレイヤーIDが必要です' 
    });
  }

  const result = await sendFriendRequest(userId, parseInt(targetPlayerId));
  
  if (result.success) {
    return res.json({ 
      success: true, 
      message: 'フレンド申請を送信しました',
      targetUsername: result.targetUser.username
    });
  } else {
    return res.status(400).json({ success: false, error: result.error });
  }
});

/**
 * POST /api/friend/accept
 * フレンド申請を承認
 */
router.post('/friend/accept', async (req, res) => {
  const { userId, friendshipId } = req.body;

  if (!userId || !friendshipId) {
    return res.status(400).json({ 
      success: false, 
      error: 'ユーザーIDと申請IDが必要です' 
    });
  }

  const result = await acceptFriendRequest(userId, friendshipId);
  
  if (result.success) {
    return res.json({ success: true, message: 'フレンド申請を承認しました' });
  } else {
    return res.status(400).json({ success: false, error: result.error });
  }
});

/**
 * POST /api/friend/reject
 * フレンド申請を拒否
 */
router.post('/friend/reject', async (req, res) => {
  const { userId, friendshipId } = req.body;

  if (!userId || !friendshipId) {
    return res.status(400).json({ 
      success: false, 
      error: 'ユーザーIDと申請IDが必要です' 
    });
  }

  const result = await rejectFriendRequest(userId, friendshipId);
  
  if (result.success) {
    return res.json({ success: true, message: 'フレンド申請を拒否しました' });
  } else {
    return res.status(400).json({ success: false, error: result.error });
  }
});

/**
 * GET /api/friend/list/:userId
 * フレンドリストを取得
 */
router.get('/friend/list/:userId', async (req, res) => {
  const { userId } = req.params;
  const result = await getFriendList(userId);
  
  res.json({ 
    success: result.success, 
    friends: result.friends 
  });
});

/**
 * GET /api/friend/requests/:userId
 * 受信したフレンド申請一覧を取得
 */
router.get('/friend/requests/:userId', async (req, res) => {
  const { userId } = req.params;
  const result = await getPendingRequests(userId);
  
  res.json({ 
    success: result.success, 
    requests: result.requests 
  });
});

module.exports = router;