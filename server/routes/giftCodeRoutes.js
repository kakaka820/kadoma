// server/routes/giftCodeRoutes.js
const express = require('express');
const router = express.Router();
const { useGiftCode, getUserGiftCodeHistory } = require('../giftCode');

/**
 * POST /api/use-gift-code
 * ギフトコード使用
 */
router.post('/use-gift-code', async (req, res) => {
  const { userId, code } = req.body;
  
  if (!userId || !code) {
    return res.status(400).json({ 
      success: false, 
      error: 'ユーザーIDとギフトコードが必要です' 
    });
  }
  
  const result = await useGiftCode(userId, code);
  
  if (result.success) {
    return res.json({ success: true, chipAmount: result.chipAmount });
  } else {
    return res.status(400).json({ success: false, error: result.error });
  }
});

/**
 * GET /api/gift-code-history/:userId
 * ギフトコード使用履歴取得
 */
router.get('/gift-code-history/:userId', async (req, res) => {
  const { userId } = req.params;
  const history = await getUserGiftCodeHistory(userId);
  res.json({ success: true, history });
});

module.exports = router;