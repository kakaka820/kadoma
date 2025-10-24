// server/gameHistory.js
const { supabase } = require('./supabaseClient');


/**
 * user_stats を更新
 */
async function updateUserStats(userId, buyIn, finalScore, rank, profit) {
  try {
    // 現在の統計を取得
    const { data: stats, error: selectError } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .single();

      if (selectError && selectError.code === 'PGRST116') {
      // user_stats が存在しない場合は作成
      console.log('[統計更新] 新規作成:', userId);
      const { data, error: insertError } = await supabase
        .from('user_stats')
        .insert({
        user_id: userId,
        total_games: 1,
        total_buy_in: buyIn,
        total_final_score: finalScore,
        first_place_count: rank === 1 ? 1 : 0,
        total_wins: rank === 1 ? 1 : 0,
        total_profit: profit
      });


      if (insertError) {
        console.error('[統計更新] 新規作成エラー:', insertError);
      } else {
        console.log('[統計更新] 新規作成成功:', userId);
      }
    } else if (stats) {



      // 既存の統計を更新
      console.log('[統計更新] 更新:', userId);
      const { data, error: updateError } = await supabase
        .from('user_stats')
        .update({
        total_games: stats.total_games + 1,
        total_buy_in: stats.total_buy_in + buyIn,
        total_final_score: stats.total_final_score + finalScore,
        first_place_count: stats.first_place_count + (rank === 1 ? 1 : 0),
        total_wins: stats.total_wins + (rank === 1 ? 1 : 0),
        total_profit: stats.total_profit + profit
      }).eq('user_id', userId);
    if (updateError) {
        console.error('[統計更新] 更新エラー:', updateError);
      } else {
        console.log('[統計更新] 更新成功:', userId);
      }
    } else if (selectError) {
      console.error('[統計更新] 取得エラー:', selectError);
    }
  } catch (err) {
    console.error('[統計更新] 予期しないエラー:', err);
  }
}




/**
 * ゲーム履歴を保存
 */
async function saveGameHistory(roomId, gameState, rankings) {
  
  console.log('[履歴保存] 開始:', roomId);
  
  // 各プレイヤーの履歴を保存
  for (const ranking of rankings) {
    const player = gameState.players[ranking.playerIndex];
    
    // Botはスキップ
    if (player.isBot) {
      console.log('[履歴保存] Botをスキップ:', player.name);
      continue;
    }
    
    
    try {
      const { data, error } = await supabase
        .from('game_history')
        .insert({
          user_id: player.userId,
          room_id: roomId,
          buy_in: ranking.buyIn,
          final_score: ranking.finalScore,
          profit: ranking.profit,
          rank: ranking.rank
        });
      
      if (error) {
        console.error('[履歴保存] エラー:', error);
      } else {
        console.log('[履歴保存] 成功:', player.name, {
          finalScore: ranking.finalScore,
          rank: ranking.rank
        });
       // user_stats を更新
        await updateUserStats(
          player.userId,
          ranking.buyIn,
          ranking.finalScore,
          ranking.rank,
          ranking.profit
        );


      }
    } catch (err) {
      console.error('[履歴保存] 予期しないエラー:', err);
    }
  }
}

module.exports = { saveGameHistory };