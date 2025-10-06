// src/components/Game.tsx 
import React, { useState, useEffect } from 'react';
import Hand from './Hand';
import Field from './Field';
import { createDeck, shuffleDeck, Card, Player } from '../utils/deck';
import { calculateScore } from '../utils/scoreCalculator';
import { WAIT_TIME_MS, ANTE } from '../config';
import { drawCardsForNextTurn } from '../utils/draw';
import { calculateNextMultiplier } from '../utils/multiplier';
import { judgeWinner } from '../utils/judgeWinner';
import { checkJokerInHands, shouldEndGame, shouldReshuffleAfterSet, canPlayJoker } from '../utils/joker';

export default function Game() {
  const [deck, setDeck] = useState<Card[]>([]);
  const [players, setPlayers] = useState(
    Array.from({ length: 3 }, (_, i) => ({ 
      name: `Player ${i + 1}`, 
      hand: [] as Card[], 
      points: 200 * ANTE, 
      wins: 0 
    }))
  );
  const [fieldCards, setFieldCards] = useState<(Card | null)[]>([null, null, null]);
  const [turnCount, setTurnCount] = useState(0);
  const [lastRoundWarning, setLastRoundWarning] = useState(false);
  const [roundResult, setRoundResult] = useState<string | null>(null);
  const [jokerCount, setJokerCount] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [currentMultiplier, setCurrentMultiplier] = useState(1);
  const [nextMultiplier, setNextMultiplier] = useState(1);
  const [setTurnIndex, setSetTurnIndex] = useState(0);
  const [jokerDealtThisSet, setJokerDealtThisSet] = useState(false);

  useEffect(() => {
    let newDeck = shuffleDeck(createDeck());

    const hands = [[], [], []] as Card[][];
    for (let i = 0; i < 15; i++) {
      hands[i % 3].push(newDeck[i]);
    }

    const newPlayers = Array.from({ length: 3 }, (_, i) => ({
      name: `Player ${i + 1}`,
      hand: hands[i],
      points: 200 * ANTE,
      wins: 0,
    }));

    setPlayers(newPlayers);
    setDeck(newDeck.slice(15));

    // ✅ 初期配布時のJOKER判定
    const hasJokerInInitialHands = checkJokerInHands(newPlayers);
    console.log('[初期配布] JOKER判定結果:', hasJokerInInitialHands);
setJokerDealtThisSet(hasJokerInInitialHands);
    setJokerDealtThisSet(hasJokerInInitialHands);
  }, []);

  function rankToValue(card: Card): number {
    if (!card.rank) return 0;
    if (card.rank === 'JOKER1' || card.rank === 'JOKER2') return 15;
    const order = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    return order.indexOf(card.rank) + 1;
  }

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

  // useEffect①：勝者判定
  useEffect(() => {
    const allCardsPlayed = fieldCards.every(card => card !== null);
    
    if (allCardsPlayed && roundResult === null) {
      const cardsWithIndex = fieldCards.map((card, idx) => ({
        ...card!,
        playerIndex: idx
      }));
      
      const result = judgeWinner(cardsWithIndex);
      const { winnerIndexes, isDraw } = result;

      let resultText = '';
      if (isDraw) {
        resultText = `このターンは引き分け`;
      } else {
        resultText = `このターンの勝者: Player ${winnerIndexes[0] + 1}`;
      }
      setRoundResult(resultText);

      if (!isDraw && winnerIndexes.length === 1) {
        const winnerIndex = winnerIndexes[0];
        setPlayers(prev =>
          prev.map((p, i) => i === winnerIndex ? { ...p, wins: (p.wins || 0) + 1 } : p)
        );
      }

      const newMultiplier = calculateNextMultiplier(cardsWithIndex);
      if (newMultiplier > 0) {
        setNextMultiplier(prev => prev + newMultiplier);
      } else {
        setNextMultiplier(1);
      }
    }
  }, [fieldCards, roundResult]);

  // useEffect②：roundResult が表示されたら WAIT_TIME_MS 後にターンを進める
  useEffect(() => {
    if (roundResult !== null) {
      const timer = setTimeout(() => {
        console.log('[setTimeout] ターン切り替え処理開始');
        
        const allHandsEmpty = players.every(p => p.hand.length === 0);

        // ✅ joker.tsの関数を使用
        if (shouldEndGame(allHandsEmpty, jokerCount)) {
          setGameOver(true);
          return;
        }

        const cardsWithIndex = fieldCards.map((card, idx) => ({
          ...card!,
          playerIndex: idx
        }));

        const result = judgeWinner(cardsWithIndex);
        const { winnerIndexes, isDraw, isReverse, originalWinnerIndex } = result;

        // 得点計算
        let scoreToAdd = 0;
        let winnerIdx = -1;
        let loserIdx = -1;

        if (!isDraw && winnerIndexes.length === 1) {
          const winnerIndex = winnerIndexes[0];
          const winnerCard = fieldCards[winnerIndex];
          
          if (!winnerCard) {
            console.error('winnerCard not found!');
            return;
          }
          
          let loserIndex: number;
          
          if (isReverse && originalWinnerIndex !== undefined) {
            loserIndex = originalWinnerIndex;
          } else {
            const cardValues = cardsWithIndex.map(card => ({
              value: rankToValue(card),
              playerIndex: card.playerIndex,
              rank: card.rank,
            }));
            
            const minValue = Math.min(...cardValues.map(c => c.value));
            const loserData = cardValues.find(c => c.value === minValue);
            
            if (!loserData) {
              console.error('loserData not found!');
              return;
            }
            
            loserIndex = loserData.playerIndex;
          }
          
          const loserCard = fieldCards[loserIndex];
          
          if (!loserCard) {
            console.error('loserCard not found!');
            return;
          }

          console.log('=== 得点計算デバッグ ===');
          console.log('ターン:', turnCount + 1);
          console.log('勝者カード:', winnerCard.rank, '値:', rankToValue(winnerCard));
          console.log('敗者カード:', loserCard.rank, '値:', rankToValue(loserCard));
          console.log('currentMultiplier:', currentMultiplier);
          console.log('逆転:', isReverse);

          scoreToAdd = calculateScore(winnerCard, loserCard, currentMultiplier, isReverse);
          winnerIdx = winnerIndex;
          loserIdx = loserIndex;
          
          console.log('計算された得点:', scoreToAdd);
          console.log('勝者インデックス:', winnerIdx, '敗者インデックス:', loserIdx);
        }

        // セット終了時の処理
        if (allHandsEmpty) {
          console.log('[セット管理] 手札が空 - セット終了');
          console.log('[セット管理] setTurnIndex:', setTurnIndex);
          console.log('[セット管理] jokerDealtThisSet:', jokerDealtThisSet);
          if (setTurnIndex === 4) {
            setCurrentMultiplier(1);
            setNextMultiplier(1);
            setSetTurnIndex(0);
            if (shouldReshuffleAfterSet(jokerDealtThisSet)) {
              setJokerCount(prev => prev + 1);
              console.log('[セット終了] JOKERが配られていたため、jokerCount +1');
            }
            
            setJokerDealtThisSet(false);
          } else {
            setCurrentMultiplier(nextMultiplier);
            setSetTurnIndex(i => i + 1);
          }
        } else {
          console.log('[セット管理] 手札あり - セット継続');
          console.log('[セット管理] setTurnIndex:', setTurnIndex);
          if (setTurnIndex === 4) {
            console.log('[セット管理] WARNING: setTurnIndexが4だが手札が残っている');
            setCurrentMultiplier(1);
            setNextMultiplier(1);
            setSetTurnIndex(0);
          } else {
            setCurrentMultiplier(nextMultiplier);
            setSetTurnIndex(i => i + 1);
          }
        }

        setFieldCards([null, null, null]);
        setTurnCount(c => c + 1);
        setRoundResult(null);

        setPlayers(prevPlayers => {
          let updated = [...prevPlayers];
          if (winnerIdx !== -1 && loserIdx !== -1 && scoreToAdd > 0) {
            console.log('更新前 勝者ポイント:', updated[winnerIdx].points);
            console.log('更新前 敗者ポイント:', updated[loserIdx].points);
            
            updated[winnerIdx] = {
              ...updated[winnerIdx],
              points: updated[winnerIdx].points + scoreToAdd
            };
            updated[loserIdx] = {
              ...updated[loserIdx],
              points: updated[loserIdx].points - scoreToAdd
            };
            
            console.log('更新後 勝者ポイント:', updated[winnerIdx].points);
            console.log('更新後 敗者ポイント:', updated[loserIdx].points);
          }

          const { updatedPlayers, updatedDeck, drawStatus } = drawCardsForNextTurn(
            deck,
            updated,
            createDeck,
            shuffleDeck,
            jokerDealtThisSet
          );

          // ✅ joker.tsの関数を使用
          const jokerInNewHands = checkJokerInHands(updatedPlayers);
          console.log('[カード配布後] JOKER判定結果:', jokerInNewHands);
          console.log('[カード配布後] jokerDealtThisSet更新前:', jokerDealtThisSet);
          if (jokerInNewHands) {
            setJokerDealtThisSet(true);
          console.log('[カード配布後] JOKERを検出、フラグをtrueに設定');
          }

          setDeck(updatedDeck);
          setLastRoundWarning(drawStatus === 'warn');

          return updatedPlayers;
        });
      }, WAIT_TIME_MS);

      return () => clearTimeout(timer);
    }
  }, [roundResult, currentMultiplier, nextMultiplier, ANTE, deck, jokerDealtThisSet, setTurnIndex, turnCount, fieldCards, jokerCount]);

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
          🎉 ジョーカーが10回出ました！ゲーム終了！
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
