// server/routes/statsRoutes.js
const express = require('express');
const router = express.Router();
const { supabase } = require('../supabaseClient');

/**
 * GET /api/stats/:userId
 * ユーザーの統計情報を取得
 */
router.get('/stats/:userId', async (req, res) => {
  const { userId } = req.params;
  
  console.log('[API] /api/stats request:', userId);
  
  try {
    const { data: stats, error } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error) {
      console.log('[API] /api/stats user_stats not found:', userId);
      return res.json({
        totalGames: 0,
        totalBuyIn: 0,
        totalFinalScore: 0,
        firstPlaceCount: 0,
        winCount: 0
      });
    }

    const { data: gameHistory } = await supabase
      .from('game_history')
      .select('profit')
      .eq('user_id', userId);
    
    const winCount = gameHistory ? gameHistory.filter(g => (g.profit || 0) >= 0).length : 0;
    
    const result = {
      totalGames: stats.total_games || 0,
      totalBuyIn: stats.total_buy_in || 0,
      totalFinalScore: stats.total_final_score || 0,
      firstPlaceCount: stats.first_place_count || 0,
      winCount: winCount
    };
    
    console.log('[API] /api/stats response:', result);
    res.json(result);
  } catch (err) {
    console.error('[API] /api/stats error:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

/**
 * GET /api/history/:userId
 * ユーザーのゲーム履歴を取得（最新10件）
 */
router.get('/history/:userId', async (req, res) => {
  const { userId } = req.params;
  const limit = parseInt(req.query.limit) || 10;
  
  console.log('[API] /api/history request:', userId, 'limit:', limit);

  try {
    const { data: history, error } = await supabase
      .from('game_history')
      .select('id, played_at, room_id, buy_in, final_score, profit, rank')
      .eq('user_id', userId)
      .order('played_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('[API] /api/history error:', error);
      throw error;
    }
    
    console.log('[API] /api/history response:', history.length, 'records');
    res.json(history);
  } catch (err) {
    console.error('[API] /api/history error:', err);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

module.exports = router;