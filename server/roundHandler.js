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
const { updateUserCurrency } = require('./authHandler');



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
     //profit = max(0, finalScore)
    const profit = Math.max(0, score);
    
    //profit だけをユーザーに配分
    if (profit > 0) {
      await updateUserCurrency(player.userId, profit);
    }
    
    results.push({
      userId: player.userId,
      profit: profit
    });
  }
  
  return results;
}

/**
 * 次のターンを準備・実行する共通処理
 */
async function performNextTurn(io, games, roomId, state, rooms) {
  // ★ Step 1: previousTurnResult を作成
  let previousTurnResult = null;
  if (state.roundResult) {
    const { winnerIndex, loserIndex, isDraw } = state.roundResult;
    previousTurnResult = {
      winnerIndex: winnerIndex !== undefined ? winnerIndex : -1,
      loserIndex: loserIndex !== undefined ? loserIndex : -1,
      isDraw: isDraw || false
    };
  }

// ★ Step 2: 手札が空か判定
  const allHandsEmpty = state.hands.every(h => h.length === 0);
  const isSetEnd = allHandsEmpty && state.setTurnIndex === 4;
  
  // ★ Step 3: セット終了時は警告クリア
  if (isSetEnd) {
    console.log('[警告] セット終了、警告クリア');
    io.to(roomId).emit('clear_warnings');
  }
  // ★ Step 4: 次のターン状態を作成
  const nextState = prepareNextTurn(state, previousTurnResult);

// ★ Step 5: 場代を計算・徴収
  if (previousTurnResult) {
    const fees = calculateAllTableFees(previousTurnResult, nextState.hands.length);
    nextState.scores = nextState.scores.map((score, idx) => score - fees[idx]);
    console.log('[場代] 新ターン開始時徴収:', fees, '結果:', nextState.scores);
  }
  
  // ★ Step 6: 選択状態をリセット
  nextState.playerSelections = [false, false, false];
  
  // ★ Step 7: ゲーム状態を保存
  games.set(roomId, nextState);

  //切断情報をクリア（新しいラウンド開始時）
  nextState.disconnectedPlayers = {};



// ★ Step 8: ゲーム終了か判定
  if (nextState.isGameOver) {
    // ゲーム終了処理
    const chipResults = await distributeChips(nextState);
    saveGameHistory(roomId, nextState).catch(err => {
      console.error('[game_over] 履歴保存失敗:', err);
    });
    
    io.to(roomId).emit('game_over', {
      reason: nextState.gameOverReason,
      finalScores: nextState.scores,
      winner: nextState.scores.indexOf(Math.max(...nextState.scores)),
      chipResults: chipResults,
      roomConfig: nextState.roomConfig,
    });
     games.delete(roomId);
     rooms.delete(roomId);
     console.log(`[GameOver] Room ${roomId} deleted from rooms and games`);
  } else {

// ★ Step 9: 手札を送信
    const allHandsInfo = createAllHandsInfo(nextState.hands);
    nextState.players.forEach((player, idx) => {
      io.to(player.id).emit('hand_update', {
        hand: nextState.hands[idx],
        opponentHands: allHandsInfo
      });
    });
    
    // ★ Step 10: 警告を送信
    if (allHandsEmpty) {
      checkAndSendWarnings(io, nextState, nextState.players);
    }

// ★ Step 11: ターン情報を送信
    io.to(roomId).emit('turn_update', {
      currentMultiplier: nextState.currentMultiplier,
      fieldCards: nextState.fieldCards,
      scores: nextState.scores, 
      playerSelections: nextState.playerSelections,
      setTurnIndex: nextState.setTurnIndex,
    });
    
    // ★ Step 12: タイマー開始
    startTurnTimer(io, games, roomId, handleRoundEnd);
    // ★ Step 13: Botの自動選択
    nextState.players.forEach((player, idx) => {
      if (player.isBot) {
        botAutoPlay(io, games, roomId, idx, handleRoundEnd);
      }
    });
  }
}




/**
 * ラウンド終了処理
 */
function handleRoundEnd(io, games, roomId, gameState, rooms) {
  
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

  //全員選択済みなら即座に次のラウンド開始
if (updatedState.playerSelections.every(Boolean)) {
    console.log('[roundHandler] All players selected, starting next turn immediately');
    performNextTurn(io, games, roomId, updatedState, rooms);
  } else {
    // ✅ 通常：結果表示後に実行
    setTimeout(() => {
      performNextTurn(io, games, roomId, updatedState, rooms);
    }, ROUND_RESULT_DISPLAY_MS);
  }
}

module.exports = {
  handleRoundEnd
};