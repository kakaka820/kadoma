// server/routes/questRoutes.js
// クエスト関連のAPIエンドポイント

const express = require('express');
const router = express.Router();
const { supabase } = require('../supabaseClient'); 
const { getUserQuestProgress } = require('../utils/questManager');

/**
 * GET /api/quests
 * ユーザーのクエスト一覧を取得
 */
router.get('/quests', async (req, res) => {
  try {
    const userId = req.query.userId;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId is required'
      });
    }
    
    console.log('[QuestAPI] Getting quests for user:', userId);
    
    // クエスト進捗を取得（リセット処理込み）
    const result = await getUserQuestProgress(userId);
    
    if (!result.success) {
      return res.status(500).json(result);
    }
    
    // カテゴリ別に分類
    const questsByCategory = {
      daily: result.quests.filter(q => q.category === 'daily'),
      weekly: result.quests.filter(q => q.category === 'weekly'),
      monthly: result.quests.filter(q => q.category === 'monthly'),
      achievement: result.quests.filter(q => q.category === 'achievement')
    };
    
    res.json({
      success: true,
      quests: result.quests,
      questsByCategory
    });
    
  } catch (error) {
    console.error('[QuestAPI] Error getting quests:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/quests/claim
 * クエスト報酬を受け取る
 */
router.post('/quests/claim', async (req, res) => {
  try {
    const { userId, questId } = req.body;
    
    if (!userId || !questId) {
      return res.status(400).json({
        success: false,
        error: 'userId and questId are required'
      });
    }
    
    console.log('[QuestAPI] Claiming reward:', { userId, questId });
    
    // クエスト情報を取得
    const { data: quest, error: questError } = await supabase
      .from('quests')
      .select('*')
      .eq('id', questId)
      .single();
    
    if (questError || !quest) {
      return res.status(404).json({
        success: false,
        error: 'Quest not found'
      });
    }
    
    // 進捗を取得
    const { data: progress, error: progressError } = await supabase
      .from('user_quest_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('quest_id', questId)
      .single();
    
    if (progressError || !progress) {
      return res.status(404).json({
        success: false,
        error: 'Quest progress not found'
      });
    }
    
    // 完了チェック
    if (!progress.completed) {
      return res.status(400).json({
        success: false,
        error: 'Quest not completed yet'
      });
    }
    
    // 既に受け取り済みチェック
    if (progress.claimed) {
      return res.status(400).json({
        success: false,
        error: 'Reward already claimed'
      });
    }
    
    // 報酬を付与
    const { data: currentUser, error: getUserError } = await supabase
  .from('users')
  .select('currency')
  .eq('id', userId)
  .single();
if (getUserError || !currentUser) {
  console.error('[QuestAPI] Error getting user:', getUserError);
  return res.status(500).json({
    success: false,
    error: 'User not found'
  });
}

const newCurrency = currentUser.currency + quest.reward_amount;

const { error: rewardError } = await supabase
  .from('users')
  .update({ currency: newCurrency })
  .eq('id', userId);
if (rewardError) {
  console.error('[QuestAPI] Error adding reward:', rewardError);
  return res.status(500).json({
    success: false,
    error: 'Failed to add reward'
  });
}
    
    // 受け取りフラグを更新
    const { error: updateError } = await supabase
      .from('user_quest_progress')
      .update({
        claimed: true,
        claimed_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('quest_id', questId);
    
    if (updateError) {
      console.error('[QuestAPI] Error updating claim status:', updateError);
      return res.status(500).json({
        success: false,
        error: 'Failed to update claim status'
      });
    }
    
    console.log(`[QuestAPI] Rewarded ${quest.reward_amount} chips to user ${userId}`);
    
    // 更新後のユーザー情報を取得
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('chips')
      .eq('id', userId)
      .single();
    
    res.json({
      success: true,
      reward: quest.reward_amount,
      newChipBalance: user?.chips || 0,
      quest: {
        id: quest.id,
        name: quest.name,
        description: quest.description
      }
    });
    
  } catch (error) {
    console.error('[QuestAPI] Error claiming reward:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/quests/summary
 * クエスト進捗サマリー取得（UI用）
 */
router.get('/quests/summary', async (req, res) => {
  try {
    const userId = req.query.userId;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId is required'
      });
    }
    
    const result = await getUserQuestProgress(userId);
    
    if (!result.success) {
      return res.status(500).json(result);
    }
    
    // サマリー情報を計算
    const summary = {
      total: result.quests.length,
      completed: result.quests.filter(q => q.completed).length,
      claimed: result.quests.filter(q => q.claimed).length,
      unclaimed: result.quests.filter(q => q.completed && !q.claimed).length,
      totalRewardAvailable: result.quests
        .filter(q => q.completed && !q.claimed)
        .reduce((sum, q) => sum + q.reward_amount, 0),
      byCategory: {
        daily: {
          total: result.quests.filter(q => q.category === 'daily').length,
          completed: result.quests.filter(q => q.category === 'daily' && q.completed).length
        },
        weekly: {
          total: result.quests.filter(q => q.category === 'weekly').length,
          completed: result.quests.filter(q => q.category === 'weekly' && q.completed).length
        },
        monthly: {
          total: result.quests.filter(q => q.category === 'monthly').length,
          completed: result.quests.filter(q => q.category === 'monthly' && q.completed).length
        },
        achievement: {
          total: result.quests.filter(q => q.category === 'achievement').length,
          completed: result.quests.filter(q => q.category === 'achievement' && q.completed).length
        }
      }
    };
    
    res.json({
      success: true,
      summary
    });
    
  } catch (error) {
    console.error('[QuestAPI] Error getting summary:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;