// server/round/turnPreparer.js
// 次ターン準備処理

const { prepareNextTurn } = require('../../shared/core/gameFlow');
const { calculateAllTableFees } = require('../../shared/utils/feeCalculator');
const { createAllHandsInfo } = require('../../shared/utils/handUtils');
const { checkAndSendWarnings } = require('../warningSystem');
const { startTurnTimer } = require('../turnTimer');
const { botAutoPlay } = require('../bot/botPlayer');

/**
 * 次のターン状態を準備
 */
function prepareNextTurnState(io, roomId, state) {
  // previousTurnResult を作成
  let previousTurnResult = null;
  if (state.roundResult) {
    const { winnerIndex, loserIndex, isDraw } = state.roundResult;
    previousTurnResult = {
      winnerIndex: winnerIndex !== undefined ? winnerIndex : -1,
      loserIndex: loserIndex !== undefined ? loserIndex : -1,
      isDraw: isDraw || false
    };
  }

  // 手札が空か判定
  const allHandsEmpty = state.hands.every(h => h.length === 0);
  const isSetEnd = allHandsEmpty && state.setTurnIndex === 4;
  
  // セット終了時は警告クリア
  if (isSetEnd) {
    console.log('[警告] セット終了、警告クリア');
    io.to(roomId).emit('clear_warnings');
  }

  // 次のターン状態を作成
  const nextState = prepareNextTurn(state, previousTurnResult);

  // 場代を計算・徴収
  if (previousTurnResult) {
    const ante = state.roomConfig?.ante || 1000;
    const fees = calculateAllTableFees(previousTurnResult, nextState.hands.length, ante);
    nextState.scores = nextState.scores.map((score, idx) => score - fees[idx]);
    console.log('[場代] 新ターン開始時徴収:', fees, 'ante:', ante, '結果:', nextState.scores);
  }
  
  // 選択状態をリセット
  nextState.playerSelections = [false, false, false];
  
  // 切断情報を保持
  nextState.disconnectedPlayers = state.disconnectedPlayers || {};

  return { nextState, allHandsEmpty };
}

/**
 * 次のターンを開始
 */
function startNextTurn(io, games, roomId, nextState, allHandsEmpty, handleRoundEnd, rooms) {
  // 手札を送信
  const allHandsInfo = createAllHandsInfo(nextState.hands);
  nextState.players.forEach((player, idx) => {
    io.to(player.id).emit('hand_update', {
      hand: nextState.hands[idx],
      opponentHands: allHandsInfo
    });
  });
  
  // 警告を送信
  if (allHandsEmpty) {
    checkAndSendWarnings(io, nextState, nextState.players);
  }

  // ターン情報を送信
  io.to(roomId).emit('turn_update', {
    currentMultiplier: nextState.currentMultiplier,
    fieldCards: nextState.fieldCards,
    scores: nextState.scores, 
    playerSelections: nextState.playerSelections,
    setTurnIndex: nextState.setTurnIndex,
  });
  
  // タイマー開始
  startTurnTimer(io, games, roomId, (io, games, roomId, gameState) => {
    handleRoundEnd(io, games, roomId, gameState, rooms);
  });

  // Botの自動選択
  nextState.players.forEach((player, idx) => {
    if (player.isBot) {
      botAutoPlay(io, games, roomId, idx, (io, games, roomId, gameState) => {
        handleRoundEnd(io, games, roomId, gameState, rooms);
      });
    }
  });
}

module.exports = {
  prepareNextTurnState,
  startNextTurn
};