// src/components/Game.tsx 
import React, { useState, useEffect } from 'react';
import Hand from './Hand';
import Field from './Field';
import { createDeck, shuffleDeck, Card, Player } from '../utils/deck';
import { calculateScore } from '../utils/scoreCalculator';
import { WAIT_TIME_MS, ANTE, MAX_JOKER_COUNT } from '../config';
import { drawCardsForNextTurn } from '../utils/draw';
import { calculateNextMultiplier } from '../utils/multiplier';
import { judgeWinner } from '../utils/judgeWinner';
import { checkJokerInHands, checkGameEnd, shouldReshuffleAfterSet, canPlayJoker } from '../utils/joker';
import { calculateAllTableFees} from '../utils/feeCalculator';
import { PreviousTurnResult } from '../types/game';
import { rankToValue } from '../utils/cardValue';
import { determineWinnerAndLoser } from '../utils/battleResolver';
import { useGameState } from '../hooks/useGameState';
import { useTableFees } from '../hooks/useTableFees';
import { useRoundJudge } from '../hooks/useRoundJudge';
import { useTurnFlow } from '../hooks/useTurnFlow';




export default function Game() {

    const { deck, setDeck, players,
    setPlayers,
    turnCount,
    setTurnCount,
    gameOver,
    setGameOver,
    gameOverReason,
    setGameOverReason,
    jokerCount,
    setJokerCount,
    setTurnIndex,
    setSetTurnIndex,
    jokerDealtThisSet,
    setJokerDealtThisSet,
    lastRoundWarning,
    setLastRoundWarning,
    fieldCards,
    setFieldCards,
    isInitialized,
  } = useGameState({
    createDeck,
    shuffleDeck,
    calculateAllTableFees,
    checkJokerInHands,
    ANTE,
  });



const { 
  roundResult, 
  setRoundResult, 
  nextMultiplier, 
  setNextMultiplier 
} = useRoundJudge({
  fieldCards,
  players,
  setPlayers,
  judgeWinner,
  calculateNextMultiplier,
});
  const { 
  previousTurnResult, 
  setPreviousTurnResult, 
  feeCollected, 
  setFeeCollected 
} = useTableFees({
  turnCount,
  roundResult,
  fieldCards,
  players,
  setPlayers,
  calculateAllTableFees,
  isInitialized,
  gameOver,
});
  const { currentMultiplier } = useTurnFlow({
    roundResult,
    setRoundResult,
    nextMultiplier,
    setNextMultiplier,
    fieldCards,
    setFieldCards,
    players,
    setPlayers,
    deck,
    setDeck,
    turnCount,
    setTurnCount,
    jokerCount,
    setJokerCount,
    setTurnIndex,
    setSetTurnIndex,
    jokerDealtThisSet,
    setJokerDealtThisSet,
    setLastRoundWarning,
    setGameOver,
    setGameOverReason,
    setFeeCollected,
    setPreviousTurnResult,
    judgeWinner,
    determineWinnerAndLoser,
    calculateScore,
    rankToValue,
    drawCardsForNextTurn,
    checkJokerInHands,
    checkGameEnd,
    shouldReshuffleAfterSet,
    createDeck,
    shuffleDeck,
    WAIT_TIME_MS,
  });

    


  
  

  

  function handleCardPlay(playerIndex: number, cardIndex: number) {
    if (gameOver) return;
    if (fieldCards[playerIndex] !== null) return;

    const card = players[playerIndex].hand[cardIndex];
    if (!card) return;
    if (!canPlayJoker(card, setTurnIndex)) {
    console.log('[handleCardPlay] JOKERはセットの1ターン目に出せません');
    return;  // 何もしない
  }
    const newFieldCards = [...fieldCards];
    newFieldCards[playerIndex] = card;
    setFieldCards(newFieldCards);

    const newHand = [...players[playerIndex].hand];
    newHand.splice(cardIndex, 1);

    const newPlayers = [...players];
    newPlayers[playerIndex] = { ...players[playerIndex], hand: newHand };
    setPlayers(newPlayers);
  }


  const playersWhoCanPlay = fieldCards.map(card => card === null);

  return (
    <div>
      <h1>トランプ</h1>
      <p>残り山札: {deck.length}</p>
      <p>ターン数: {turnCount}</p>
      <p>現在の倍率: x{currentMultiplier}</p>
      {jokerDealtThisSet && (
        <p style={{ color: 'orange', fontWeight: 'bold' }}>
          ⚠ ジョーカーが配られました！このセット終了後に山札がリセットされます
        </p>
      )}

      {gameOver && (
        <div style={{ color: 'red', fontWeight: 'bold' }}>
          🎉{gameOverReason} ！ゲーム終了！
        </div>
      )}
      {roundResult && <p style={{ fontWeight: 'bold', color: 'green' }}>{roundResult}</p>}
      {lastRoundWarning && (
        <p style={{ color: 'red', fontWeight: 'bold' }}>※ 残り山札が15枚未満。次の補充が最後です！</p>
      )}

      <div>
        {players.map((player, i) => (
          <Hand
            key={i}
            playerName={player.name}
            cards={player.hand}
            onCardClick={(cardIdx) => handleCardPlay(i, cardIdx)}
            disabled={!playersWhoCanPlay[i]}
            wins={player.wins}
            playerScore={player.points}
            setTurnIndex={setTurnIndex}
          />
        ))}
      </div>

      <Field fieldCards={fieldCards} />
    </div>
  );
}
