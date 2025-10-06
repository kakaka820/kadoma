// src/components/Game.tsx 
import React, { useState, useEffect } from 'react';
import Hand from './Hand';
import Field from './Field';
import { createDeck, shuffleDeck, Card, Player } from '../utils/deck';
import { processTurn } from '../utils/gameLogic';
import { calculateScore } from '../utils/scoreCalculator';
import { WAIT_TIME_MS, ANTE } from '../config';
import { drawCardsForNextTurn} from '../utils/draw';
import { calculateNextMultiplier } from '../utils/multiplier';
import { judgeWinner } from '../utils/judgeWinner';




export default function Game() {
  const [deck, setDeck] = useState<Card[]>([]);
  const [players, setPlayers] = useState(
    Array.from({ length: 3 }, (_, i) => ({ name: `Player ${i + 1}`, hand: [] as Card[], points: 200*ANTE, wins:0,}))
  );
  const [fieldCards, setFieldCards] = useState<(Card | null)[]>([null, null, null]);
  const [turnCount, setTurnCount] = useState(0);
  const [lastRoundWarning, setLastRoundWarning] = useState(false);
  const [roundResult, setRoundResult] = useState<string | null>(null);
  const [jokerCount, setJokerCount] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [currentMultiplier, setCurrentMultiplier] = useState(1);
  const [nextMultiplier, setNextMultiplier] = useState(1);
  const [setTurnIndex, setSetTurnIndex] = useState(0); // 0〜4でセット管理
  const [jokerDealtThisSet, setJokerDealtThisSet] = useState(false);
  const [playerScores, setPlayerScores] = useState<number[]>(players.map(player=>player.points));




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
    const newFieldCards = [...fieldCards];
    newFieldCards[playerIndex] = card;
    setFieldCards(newFieldCards);
    // 手札から削除
    const newHand = [...players[playerIndex].hand];
    newHand.splice(cardIndex, 1);
    const newPlayers = [...players];
    newPlayers[playerIndex] = { ...players[playerIndex], hand: newHand };
    setPlayers(newPlayers);
  }


// useEffect①：勝者判定
useEffect(() => {
  // ✅ 修正: 3枚すべてnullでないかチェック
  const allCardsPlayed = fieldCards.every(card => card !== null);
  
  if (allCardsPlayed && roundResult === null) {
    // ✅ 修正: Card & { playerIndex } 形式に変換
    const cardsWithIndex = fieldCards.map((card, idx) => ({
      ...card!,
      playerIndex: idx
    }));
    
    // ✅ judgeWinner を使って勝者を判定
    const result = judgeWinner(cardsWithIndex);
    const { winnerIndexes, isDraw } = result;

    let resultText = '';
    if (isDraw) {
      resultText = `このターンは引き分け`;
    } else {
      resultText = `このターンの勝者: Player ${winnerIndexes[0] + 1}`;
    }
    setRoundResult(resultText);

    // 勝者のwins更新
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

    // ★ ジョーカーカウント更新
    const jokersThisRound = cardsWithIndex.filter(card => card.rank === 'JOKER1' || card.rank === 'JOKER2').length;
    if (jokersThisRound > 0) {
      setJokerCount(prev => prev + jokersThisRound);
    }
  }
}, [fieldCards, roundResult]);


// useEffect②：roundResult が表示されたら WAIT_TIME_MS 後にターンを進める
useEffect(() => {
  if (roundResult !== null) {
    const timer = setTimeout(() => {
      console.log('[setTimeout] ターン切り替え処理開始');
      
      const allHandsEmpty = players.every(p => p.hand.length === 0);

      if (allHandsEmpty && jokerCount >= 10) {
        setGameOver(true);
        return;
      }

      // 配列に変換してからjudgeWinner
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

      if (setTurnIndex === 4) {
        setCurrentMultiplier(1);
        setNextMultiplier(1);
        setSetTurnIndex(0);
        setJokerDealtThisSet(false);
      } else {
        setCurrentMultiplier(nextMultiplier);
        setSetTurnIndex(i => i + 1);
      }

      // [null, null, null]にリセット
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

        const jokerInNewHands = updatedPlayers.some(p =>
          p.hand.some(card => card.rank === 'JOKER1' || card.rank === 'JOKER2')
        );
        setJokerDealtThisSet(jokerInNewHands);

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
          />
        ))}
      </div>

      <Field fieldCards={fieldCards} />
    </div>
  );
}
