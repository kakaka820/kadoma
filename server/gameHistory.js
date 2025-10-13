// server/gameHistory.js
const { supabase } = require('./supabaseClient');
const { v4: uuidv4 } = require('uuid');

/**
 * ゲーム履歴を保存
 */
async function saveGameHistory(roomId, gameState) {
  const { players, scores } = gameState;
  
  console.log('[履歴保存] 開始:', roomId);
  
  // 各プレイヤーの履歴を保存
  for (let i = 0; i < players.length; i++) {
    const player = players[i];
    
    // Botはスキップ（後でアカウント実装時に対応）
    if (player.isBot) {
      console.log('[履歴保存] Botをスキップ:', player.name);
      continue;
    }
    
    const finalScore = scores[i];
    const buyIn = 1000; // 今は固定（後で可変に）
    const profit = finalScore; // 簡易計算（後で改善）

    // ✅ 仮UUID生成（アカウント実装まで）
    const tempUserId = uuidv4();
    
    try {
      const { data, error } = await supabase
        .from('game_history')
        .insert({
          user_id: tempUserId,
          room_id: roomId,
          buy_in: buyIn,
          final_score: finalScore,
          profit: profit
        });
      
      if (error) {
        console.error('[履歴保存] エラー:', error);
      } else {
        console.log('[履歴保存] 成功:', player.name, finalScore);
      }
    } catch (err) {
      console.error('[履歴保存] 予期しないエラー:', err);
    }
  }
}

module.exports = { saveGameHistory };