// server/gameHistory.js
const { supabase } = require('./supabaseClient');

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
      }
    } catch (err) {
      console.error('[履歴保存] 予期しないエラー:', err);
    }
  }
}

module.exports = { saveGameHistory };