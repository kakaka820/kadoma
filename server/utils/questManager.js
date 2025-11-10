// server/utils/questManager.js
// クエスト管理ロジック

const { supabase } = require('../supabaseClient');

const RESET_HOUR = 12; // 毎日12時にリセット

/**
 * クエストがリセットされるべきかチェック
 * @param {string} resetPeriod - 'daily', 'weekly', 'monthly', null
 * @param {Date} lastResetAt - 最後にリセットした時刻
 * @returns {boolean} リセットすべきか
 */
function shouldResetQuest(resetPeriod, lastResetAt) {
  if (!resetPeriod) return false; // アチーブメントはリセットなし
  
  const now = new Date();
  const lastReset = new Date(lastResetAt);
  
  // 日本時間で計算（UTC+9）
  const nowJST = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }));
  const lastResetJST = new Date(lastReset.toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }));
  
switch (resetPeriod) {
    case 'daily':
      // 日付が異なる && 現在時刻が12時以降
      const nowDate = nowJST.toISOString().split('T')[0];  // 2025-11-09
      const lastResetDate = lastResetJST.toISOString().split('T')[0]; 

       if (nowDate !== lastResetDate) {
        // 今日の12時（日本時間）
        const todayNoon = new Date(nowJST);
        todayNoon.setHours(RESET_HOUR, 0, 0, 0);
        
        // 現在時刻が12時以降ならリセット
        if (nowJST >= todayNoon) {
          return true;
        }
      }
      break; 
      
    case 'weekly':
      // 前回リセットから7日以上経過
      const daysDiff = Math.floor((nowJST - lastResetJST) / (1000 * 60 * 60 * 24));
      
      if (daysDiff >= 7) {
        // 月曜日12時にリセット
        const dayOfWeek = nowJST.getDay();
        const hour = nowJST.getHours();
        
        if (dayOfWeek === 1 && hour >= RESET_HOUR) {
          return true;
        }
      }
      break;
      
    case 'monthly':
      // 月が異なる
      if (nowJST.getMonth() !== lastResetJST.getMonth() || 
      nowJST.getFullYear() !== lastResetJST.getFullYear()) {
        
        // 1日の12時以降ならリセット
        if (nowJST.getDate() >= 1 && nowJST.getHours() >= RESET_HOUR) {
          return true;
        }
      }
      break;
  }
  
  return false;
}

/**
 * 直近の月曜日12時を取得
 */
function getLastMonday12PM(now) {
  const monday = new Date(now);
  const dayOfWeek = monday.getDay(); // 0 = 日曜日, 1 = 月曜日
  
  // 月曜日までの差分
  const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  monday.setDate(monday.getDate() - diff);
  monday.setHours(RESET_HOUR, 0, 0, 0);
  
  // もし現在時刻が今週月曜12時より前なら、先週月曜日を返す
  if (now < monday) {
    monday.setDate(monday.getDate() - 7);
  }
  
  return monday;
}

/**
 * 次のリセット時刻を取得（UI表示用）
 */
function getNextResetTime(resetPeriod) {
  if (!resetPeriod) return null;
  
  const now = new Date();
  
  switch (resetPeriod) {
    case 'daily':
      // 現在のUTC時刻から、次の日本時間12時（UTC 3時）を計算
      const nextReset = new Date(now);
      nextReset.setUTCHours(3, 0, 0, 0); // UTC 3時 = JST 12時
      
      // もし既に今日のUTC 3時を過ぎていたら、明日にする
      if (now >= nextReset) {
        nextReset.setUTCDate(nextReset.getUTCDate() + 1);
      }
      
      return nextReset;
      
    case 'weekly':
      // 次の月曜日 UTC 3時（JST 12時）
      const nextMonday = new Date(now);
      const dayOfWeek = nextMonday.getUTCDay(); // 0=日曜, 1=月曜
      const daysUntilMonday = dayOfWeek === 0 ? 1 : (8 - dayOfWeek) % 7 || 7;
      
      nextMonday.setUTCDate(nextMonday.getUTCDate() + daysUntilMonday);
      nextMonday.setUTCHours(3, 0, 0, 0);
      
      return nextMonday;
      
    case 'monthly':
      // 来月1日 UTC 3時（JST 12時）
      const nextMonth = new Date(now);
      nextMonth.setUTCMonth(nextMonth.getUTCMonth() + 1);
      nextMonth.setUTCDate(1);
      nextMonth.setUTCHours(3, 0, 0, 0);
      
      return nextMonth;
      
    default:
      return null;
  }
}

/**
 * 次の月曜日12時を取得
 */
function getNextMonday12PM(now) {
  const monday = new Date(now);
  const dayOfWeek = monday.getDay();
  
  const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
  monday.setDate(monday.getDate() + daysUntilMonday);
  monday.setHours(RESET_HOUR, 0, 0, 0);
  
  return monday;
}

/**
 * ユーザーのクエスト進捗を取得（リセット処理込み）
 */
async function getUserQuestProgress(userId) {
  try {
    console.log('[QuestManager] getUserQuestProgress called for user:', userId);
    // 全クエスト取得
    const { data: quests, error: questsError } = await supabase
      .from('quests')
      .select('*')
      .eq('is_active', true)
      .order('category', { ascending: true })
      .order('sort_order', { ascending: true });
    console.log('[QuestManager] Quests query result:', { quests, error: questsError });
    if (questsError) throw questsError;
    console.log('[QuestManager] Found quests:', quests?.length || 0);
    
    // ユーザーの進捗取得
    const { data: progress, error: progressError } = await supabase
      .from('user_quest_progress')
      .select('*')
      .eq('user_id', userId);
    
    if (progressError) throw progressError;
    
    // 進捗をマップに変換
    const progressMap = new Map(progress.map(p => [p.quest_id, p]));
    
    // クエストと進捗を結合
    const questsWithProgress = [];
    
    for (const quest of quests) {
      let userProgress = progressMap.get(quest.id);
      
      // 進捗がなければ新規作成
      if (!userProgress) {
        const { data: newProgress, error: createError } = await supabase
          .from('user_quest_progress')
          .insert({
            user_id: userId,
            quest_id: quest.id,
            progress: 0,
            completed: false,
            claimed: false,
            last_reset_at: new Date().toISOString()
          })
          .select()
          .single();
        
        if (createError) {
          console.error('[QuestManager] Error creating progress:', createError);
          continue;
        }
        
        userProgress = newProgress;
      }
      
      // リセット判定
      if (shouldResetQuest(quest.reset_period, userProgress.last_reset_at)) {
        console.log(`[QuestManager] Resetting quest ${quest.name} for user ${userId}`);
        
        const { data: resetProgress, error: resetError } = await supabase
          .from('user_quest_progress')
          .update({
            progress: 0,
            completed: false,
            claimed: false,
            last_reset_at: new Date().toISOString(),
            reset_count: userProgress.reset_count + 1
          })
          .eq('user_id', userId)
          .eq('quest_id', quest.id)
          .select()
          .single();
        
        if (resetError) {
          console.error('[QuestManager] Error resetting progress:', resetError);
          continue;
        }
        
        userProgress = resetProgress;
      }
      
      // 次のリセット時刻を計算
      const nextReset = getNextResetTime(quest.reset_period);
      
      questsWithProgress.push({
        ...quest,
        progress: userProgress.progress,
        completed: userProgress.completed,
        claimed: userProgress.claimed,
        completed_at: userProgress.completed_at,
        claimed_at: userProgress.claimed_at,
        next_reset: nextReset
      });
    }
    
    return { success: true, quests: questsWithProgress };
    
  } catch (error) {
    console.error('[QuestManager] Error getting user quests:', error);
    return { success: false, error: error.message };
  }
}

/**
 * クエスト進捗を更新
 */
async function updateQuestProgress(userId, questType, amount = 1) {
  try {
    // 該当するクエストを取得
    const { data: quests, error: questsError } = await supabase
      .from('quests')
      .select('*')
      .eq('quest_type', questType)
      .eq('is_active', true);
    
    if (questsError) throw questsError;
    
    for (const quest of quests) {
      // 現在の進捗を取得
      const { data: currentProgress } = await supabase
        .from('user_quest_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('quest_id', quest.id)
        .single();
      
      if (!currentProgress) continue;
      
      // リセット判定
      if (shouldResetQuest(quest.reset_period, currentProgress.last_reset_at)) {
        await supabase
          .from('user_quest_progress')
          .update({
            progress: 0,
            completed: false,
            claimed: false,
            last_reset_at: new Date().toISOString()
          })
          .eq('user_id', userId)
          .eq('quest_id', quest.id);
        
        currentProgress.progress = 0;
        currentProgress.completed = false;
      }
      
      // 既に完了していればスキップ
      if (currentProgress.completed) continue;
      
      // 進捗を更新
      let newProgress;
      if (questType.endsWith('_single')) {
      // 単発系: 現在の値と比較して、大きい方を保存
        newProgress = Math.max(currentProgress.progress, amount);
         } else {
      // 累計系: 加算
        newProgress = Math.min(currentProgress.progress + amount, quest.target_value);
         }
      const isCompleted = newProgress >= quest.target_value;
      
      await supabase
        .from('user_quest_progress')
        .update({
          progress: newProgress,
          completed: isCompleted,
          completed_at: isCompleted ? new Date().toISOString() : null
        })
        .eq('user_id', userId)
        .eq('quest_id', quest.id);
      
      console.log(`[QuestManager] Updated quest ${quest.name}: ${newProgress}/${quest.target_value}`);
    }
    
    return { success: true };
    
  } catch (error) {
    console.error('[QuestManager] Error updating quest progress:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  getUserQuestProgress,
  updateQuestProgress,
  shouldResetQuest,
  getNextResetTime,
  RESET_HOUR
};