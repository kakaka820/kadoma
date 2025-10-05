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
  const [fieldCards, setFieldCards] = useState<(Card & { playerIndex: number })[]>([]);
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

    if (fieldCards.some(fc => fc.playerIndex === playerIndex)) return;

    const card = players[playerIndex].hand[cardIndex];
    if (!card) return;

    setFieldCards([...fieldCards, { ...card, playerIndex }]);

    const newHand = [...players[playerIndex].hand];
    newHand.splice(cardIndex, 1);

    const newPlayers = [...players];
    newPlayers[playerIndex] = { ...players[playerIndex], hand: newHand };
    setPlayers(newPlayers);
  }


// useEffect①：勝者判定
useEffect(() => {
  if (fieldCards.length === 3 && roundResult === null) {
    // ✅ judgeWinner を使って勝者を判定
    const result = judgeWinner(fieldCards);
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
const newMultiplier = calculateNextMultiplier(fieldCards);
if (newMultiplier > 0) {
  setNextMultiplier(prev => prev + newMultiplier); // 加算する
} else {
  setNextMultiplier(1); // 加算なし → リセット
}


    // ★ ジョーカーカウント更新
    const jokersThisRound = fieldCards.filter(card => card.rank === 'JOKER1' || card.rank === 'JOKER2').length;
    if (jokersThisRound > 0) {
      setJokerCount(prev => prev + jokersThisRound);
    }
  }
}, [fieldCards, roundResult]);


// useEffect②：roundResult が表示されたら WAIT_TIME_MS 後にターンを進める
useEffect(() => {

  if (roundResult !== null) {
    const timer = setTimeout(() => {
  setCurrentMultiplier(nextMultiplier);
  if (setTurnIndex === 4) {
  setCurrentMultiplier(1);
  setNextMultiplier(1);
  setSetTurnIndex(0);
  setJokerDealtThisSet(false);
} else {setCurrentMultiplier(nextMultiplier);
  setSetTurnIndex(i => i + 1);
        }
  
      console.log('[setTimeout] ターン切り替え処理開始');
      const allHandsEmpty = players.every(p => p.hand.length === 0);

      // 💡 ゲーム終了判定は「セット終了（全手札が空）かつジョーカー10枚以上」のときのみ
      if (allHandsEmpty && jokerCount >= 10) {
        setGameOver(true);
        return;
      }

      setFieldCards([]);
      setTurnCount(c => c + 1);
      setRoundResult(null);

      // 得点計算をここで行う
      const card1 = fieldCards[0];  // 1人目のカード
const card2 = fieldCards[1];  // 2人目のカード
const card3 = fieldCards[2];  // 3人目のカード
      // calculateScore 関数の引数に渡すには、カードとプレイヤーのインデックスを渡す
const newScores = fieldCards.map((card, idx) => {
  // 逆転処理が必要な場合もあるので、カード同士とプレイヤーを指定してスコアを計算
  const opponentCard = fieldCards[(idx + 1)% 3];
  return calculateScore(card, opponentCard, currentMultiplier, false); // ここで正しいカードを渡す
});

setPlayerScores(newScores);  // 計算した得点をステートにセット

      setPlayers(prevPlayers => {
        const { updatedPlayers, updatedDeck, drawStatus } = drawCardsForNextTurn(
          deck,
          prevPlayers,
          createDeck,
          shuffleDeck,
          jokerDealtThisSet
        );

        // ✅ 実際に配られた手札を見てジョーカー判定
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
}, [roundResult, players, currentMultiplier, ANTE]);




  const playersWhoCanPlay = players.map((_, i) => !fieldCards.some(fc => fc.playerIndex === i));

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
            playerScore={playerScores[i]}
          />
        ))}
      </div>

      <Field fieldCards={fieldCards} />
    </div>
  );
}
