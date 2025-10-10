// shared/gameFlow.js
// ゲームフロー制御（フロント・サーバー共通）
// ⚠️ このファイルはフロント・サーバー両方で使用

const { judgeWinner } = require('./judgeWinner');
const { determineWinnerAndLoser } = require('./battleResolver');
const { calculateScore } = require('./scoreCalculator');
const { calculateNextMultiplier } = require('./multiplier');
const { calculateAllTableFees } = require('./feeCalculator');
const { drawCardsForNextTurn } = require('./draw');
const { checkJokerInHands, checkGameEnd, shouldReshuffleAfterSet } = require('./joker');
const { rankToValue } = require('./cardValue');
const { createDeck, shuffleDeck } = require('./deckLogic');
const { ANTE } = require('./config');

/**
 * ゲーム初期化
 */
function initializeGame(playerCount = 3, initialPoints = 200) {
  const deck = shuffleDeck(createDeck());
  
  // 各プレイヤーに5枚配布
  const hands = [];
  for (let i = 0; i < playerCount; i++) {
    hands.push(deck.slice(i * 5, (i + 1) * 5));
  }
  
  const remainingDeck = deck.slice(playerCount * 5);
  
  // 初期場代徴収
  const tableFees = calculateAllTableFees(null, playerCount);
  const scores = Array(playerCount).fill(initialPoints * ANTE).map((score, idx) => score - tableFees[idx]);
  
  // 初期JOKER判定
  const players = hands.map((hand, idx) => ({
    name: `Player ${idx + 1}`,
    hand,
    points: scores[idx],
    wins: 0
  }));
  
  const jokerDealtThisSet = checkJokerInHands(players);
  
  return {
    deck: remainingDeck,
    hands,
    scores,
    wins: Array(playerCount).fill(0),
    fieldCards: Array(playerCount).fill(null),
    turnIndex: 0,
    currentMultiplier: 1,
    nextMultiplier: 1,
    setTurnIndex: 0,
    jokerCount: 0,
    jokerDealtThisSet,
    previousTurnResult: null,
    isGameOver: false
  };
}

/**
 * ラウンド処理（勝敗判定 + 得点計算）
 */
function processRound(gameState) {
  const { fieldCards, scores, wins, currentMultiplier, previousTurnResult } = gameState;
  
  // 1. 場代徴収
  const fees = calculateAllTableFees(previousTurnResult);
  const newScores = scores.map((score, idx) => score - fees[idx]);
  
  // 2. 勝敗判定
  const cardsWithIndex = fieldCards.map((card, idx) => ({
    ...card,
    playerIndex: idx
  }));
  
  const judgeResult = judgeWinner(cardsWithIndex);
  const { winnerIndexes, isDraw, isReverse, originalWinnerIndex } = judgeResult;
  
  let resultMessage = '';
  let winnerIdx = -1;
  let loserIdx = -1;
  let scoreChange = 0;
  const newWins = [...wins];
  
  if (isDraw) {
    resultMessage = '引き分け！';
  } else {
    const battleResult = determineWinnerAndLoser(
      fieldCards,
      isDraw,
      winnerIndexes,
      isReverse,
      originalWinnerIndex
    );
    
    if (battleResult) {
      const { winnerIndex, loserIndex, winnerCard, loserCard } = battleResult;
      winnerIdx = winnerIndex;
      loserIdx = loserIndex;
      
      scoreChange = calculateScore(winnerCard, loserCard, currentMultiplier, isReverse);
      
      newScores[winnerIdx] += scoreChange;
      newScores[loserIdx] -= scoreChange;
      newWins[winnerIdx]++;
      
      resultMessage = `Player ${winnerIdx + 1} の勝利！${scoreChange}点獲得`;
    }
  }
  
  // 3. 次の倍率計算
  const nextMultiplier = 1 + calculateNextMultiplier(fieldCards.filter(c => c));
  
  // 4. 前回結果保存
  const newPreviousTurnResult = isDraw 
    ? { winnerIndex: -1, loserIndex: -1, isDraw: true }
    : { winnerIndex: winnerIdx, loserIndex: loserIdx, isDraw: false };
  
  return {
    ...gameState,
    scores: newScores,
    wins: newWins,
    nextMultiplier,
    previousTurnResult: newPreviousTurnResult,
    roundResult: {
      message: resultMessage,
      winnerIndex: winnerIdx,
      loserIndex: loserIdx,
      scoreChange,
      isReverse
    }
  };
}

/**
 * 次のターン準備（カード配布 + ゲーム終了判定）
 */
function prepareNextTurn(gameState) {
  const {
    hands,
    deck,
    scores,
    wins,
    nextMultiplier,
    setTurnIndex,
    jokerCount,
    jokerDealtThisSet,
    previousTurnResult
  } = gameState;
  
  const allHandsEmpty = hands.every(h => h.length === 0);
  let newSetTurnIndex = setTurnIndex;
  let newCurrentMultiplier = nextMultiplier;
  let newJokerCount = jokerCount;
  let newJokerDealtThisSet = jokerDealtThisSet;
  let newDeck = deck;
  let newHands = hands;
  
  // セット終了判定
  if (allHandsEmpty) {
    if (setTurnIndex === 4) {
      // セット完全終了
      newSetTurnIndex = 0;
      newCurrentMultiplier = 1;
      
      if (shouldReshuffleAfterSet(jokerDealtThisSet)) {
        newJokerCount++;
      }
      newJokerDealtThisSet = false;
    } else {
      newSetTurnIndex++;
    }
  } else {
    if (setTurnIndex === 4) {
      newSetTurnIndex = 0;
      newCurrentMultiplier = 1;
    } else {
      newSetTurnIndex++;
    }
  }
  
  // カード配布
  if (allHandsEmpty) {
    const players = hands.map((hand, idx) => ({
      name: `Player ${idx + 1}`,
      hand,
      points: scores[idx],
      wins: wins[idx]
    }));
    
    const { updatedPlayers, updatedDeck, drawStatus } = drawCardsForNextTurn(
      deck,
      players,
      createDeck,
      shuffleDeck,
      jokerDealtThisSet
    );
    
    newHands = updatedPlayers.map(p => p.hand);
    newDeck = updatedDeck;
    
    const jokerInNewHands = checkJokerInHands(updatedPlayers);
    newJokerDealtThisSet = setTurnIndex === 4 ? jokerInNewHands : (jokerDealtThisSet || jokerInNewHands);
  }
  
  // ゲーム終了判定
  const players = newHands.map((hand, idx) => ({
    name: `Player ${idx + 1}`,
    hand,
    points: scores[idx],
    wins: wins[idx]
  }));
  
  const gameEndCheck = checkGameEnd(allHandsEmpty, newJokerCount, players);
  
  return {
    ...gameState,
    deck: newDeck,
    hands: newHands,
    fieldCards: Array(hands.length).fill(null),
    currentMultiplier: newCurrentMultiplier,
    setTurnIndex: newSetTurnIndex,
    jokerCount: newJokerCount,
    jokerDealtThisSet: newJokerDealtThisSet,
    isGameOver: gameEndCheck.shouldEnd,
    gameOverReason: gameEndCheck.reason
  };
}

// CommonJS (Node.js用)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    initializeGame,
    processRound,
    prepareNextTurn
  };
}

// ES Module (ブラウザ用)
if (typeof window !== 'undefined') {
  window.GameFlow = {
    initializeGame,
    processRound,
    prepareNextTurn
  };
}