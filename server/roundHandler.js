// server/roundHandler.js
// ラウンド終了処理

const { saveGameHistory } = require('./gameHistory');
const { processRound, prepareNextTurn } = require('../shared/core/gameFlow');
const { calculateAllTableFees } = require('../shared/utils/feeCalculator');
const { ROUND_RESULT_DISPLAY_MS } = require('../shared/config');
const { createAllHandsInfo } = require('../shared/utils/handUtils');
const { checkAndSendWarnings } = require('./warningSystem');
const { startTurnTimer } = require('./turnTimer');
const { botAutoPlay } = require('./botPlayer');
const { updateUserChips } = require('./authHandler');



async function distributeChips(gameState) {
  // マルチ部屋でない場合はスキップ
  if (!gameState.roomConfig) {
    return null;
  }
  
  const results = [];
  
  for (let i = 0; i < gameState.players.length; i++) {
    const player = gameState.players[i];
    const score = gameState.scores[i];
    // Botはスキップ
    if (player.isBot || !player.userId) {
      continue;
    }
    
    // 得点が+の場合のみチップ配分
    if (score > 0) {
      const chipChange = score;
      await updateUserChips(player.userId, chipChange);
      results.push({
        userId: player.userId,
        username: player.name,
        change: chipChange
      });
    }
  }
  return results;
}

/**
 * ラウンド終了処理
 */
function handleRoundEnd(io, games, roomId, gameState) {
  
//gameStateチェック
  if (!gameState) {
    console.error('[roundHandler] gameState is undefined for room:', roomId);
    return;
  }



  if (gameState.turnTimer) {
    clearTimeout(gameState.turnTimer);
    gameState.turnTimer = null;
  }
  
  const updatedState = processRound(gameState);
  games.set(roomId, updatedState);
  
  io.to(roomId).emit('round_result', {
    ...updatedState.roundResult,
    scores: updatedState.scores,
    wins: updatedState.wins
  });
  
  setTimeout(async() => {
    // previousTurnResultを保存
    let previousTurnResult = null;
    if (updatedState.roundResult) {
      const { winnerIndex, loserIndex, isDraw } = updatedState.roundResult;
      previousTurnResult = {
        winnerIndex: winnerIndex !== undefined ? winnerIndex : -1,
        loserIndex: loserIndex !== undefined ? loserIndex : -1,
        isDraw: isDraw || false
      };
    }

    const allHandsEmpty = updatedState.hands.every(h => h.length === 0);
    const isSetEnd = allHandsEmpty && updatedState.setTurnIndex === 4;
    
    // セット終了時は警告をクリア
    if (isSetEnd) {
      console.log('[警告] セット終了、警告クリア');
      io.to(roomId).emit('clear_warnings');
    }

    const nextState = prepareNextTurn(updatedState, previousTurnResult);

    // 新ターン開始時に場代徴収
    if (previousTurnResult) {
      const fees = calculateAllTableFees(
        previousTurnResult, 
        nextState.hands.length
      );
      nextState.scores = nextState.scores.map((score, idx) => score - fees[idx]);
      console.log('[場代] 新ターン開始時徴収:', fees, '結果:', nextState.scores);
    }
    
    // 選択状態をリセット
    nextState.playerSelections = [false, false, false];
    
    games.set(roomId, nextState);
    
    if (nextState.isGameOver) {
      //チップ配分処理を追加
  const chipResults = await distributeChips(nextState);

      //履歴保存（非同期だけど待たない）
  saveGameHistory(roomId, nextState).catch(err => {
    console.error('[game_over] 履歴保存失敗:', err);
  });
  
  // TODO: アカウント実装後、Bot代替中のプレイヤーにペナルティ処理
  io.to(roomId).emit('game_over', {
    reason: nextState.gameOverReason,
    finalScores: nextState.scores,
    winner: nextState.scores.indexOf(Math.max(...nextState.scores)),
    chipResults: chipResults
  });
  games.delete(roomId);
} else {

      // 全プレイヤーの手札情報を作成
      const allHandsInfo = createAllHandsInfo(nextState.hands);
      
      // 新しい手札を各プレイヤーに送信
      nextState.players.forEach((player, idx) => {
        io.to(player.id).emit('hand_update', {
          hand: nextState.hands[idx],
          opponentHands: allHandsInfo
        });
      });
      
      if (allHandsEmpty) {
        checkAndSendWarnings(io, nextState, nextState.players);
      }
      
      // 新ラウンドの情報を全員に送信
      io.to(roomId).emit('turn_update', {
        currentMultiplier: nextState.currentMultiplier,
        fieldCards: nextState.fieldCards,
        scores: nextState.scores, 
        playerSelections: nextState.playerSelections,
        setTurnIndex: nextState.setTurnIndex,
      });
      
      startTurnTimer(io, games, roomId, handleRoundEnd);

      // Botプレイヤーに自動選択させる
      nextState.players.forEach((player, idx) => {
        if (player.isBot) {
          botAutoPlay(io, games, roomId, idx, handleRoundEnd);
        }
      });
    }
  }, ROUND_RESULT_DISPLAY_MS);
}

module.exports = {
  handleRoundEnd
};