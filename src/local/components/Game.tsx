// src/components/Game.tsx 
import React from 'react';
import Hand from './Hand';
import Field from './Field';
import { createDeck, shuffleDeck } from '../utils/deck';
import { calculateScore } from '../utils/scoreCalculator';
import { WAIT_TIME_MS, ANTE } from '../config';
import { drawCardsForNextTurn } from '../utils/draw';
import { calculateNextMultiplier } from '../utils/multiplier';
import { judgeWinner } from '../utils/judgeWinner';
import { checkJokerInHands, checkGameEnd, shouldReshuffleAfterSet, canPlayJoker } from '../utils/joker';
import { calculateAllTableFees} from '../utils/feeCalculator';
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
  setPreviousTurnResult, 
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
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 p-4">
        <h1 className="text-4xl font-bold text-white mb-4">ローカル対戦</h1>
       <div className="grid grid-cols-3 gap-4 mb-6">
       <div className="bg-gray-800 rounded-lg p-4 text-center">
       <p className="text-gray-400 text-xs mb-1">残り山札</p>
       <p className="text-white text-xl font-bold">{deck.length}枚</p>
        </div>
       <div className="bg-gray-800 rounded-lg p-4 text-center">
       <p className="text-gray-400 text-xs mb-1">ターン数</p>
       <p className="text-white text-xl font-bold">{turnCount}</p>
        </div>
       <div className="bg-gray-800 rounded-lg p-4 text-center">
       <p className="text-gray-400 text-xs mb-1">現在の倍率</p>
       <p className="text-yellow-400 text-xl font-bold">x{currentMultiplier}</p>
       </div>
       </div>
      {jokerDealtThisSet && (
        <div className="bg-orange-900 border-2 border-orange-500 rounded-lg p-4 mb-4">
            <p className="text-orange-200 font-bold">
              ⚠ ジョーカーが配られました！このセット終了後に山札がリセットされます
            </p>
          </div>
        )}

      {gameOver && (
        <div className="bg-red-900 border-2 border-red-500 rounded-lg p-4 mb-4">
        <p className="text-red-200 text-xl font-bold">
              🎉{gameOverReason} ！ゲーム終了！
            </p>
          </div>
        )}
      {roundResult && (
      <div className="bg-green-900 border-2 border-green-500 rounded-lg p-4 mb-4">
            <p className="text-green-200 font-bold">{roundResult}</p>
          </div>
        )}
      {lastRoundWarning && (
        <div className="bg-red-900 border-2 border-red-500 rounded-lg p-4 mb-4">
            <p className="text-red-200 font-bold">
              ※ 残り山札が15枚未満。次の補充が最後です！
            </p>
          </div>
        )}

      <div className="mb-8">
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