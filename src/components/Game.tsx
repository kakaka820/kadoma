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
import { calculateAllTableFees, PreviousTurnResult} from '../utils/feeCalculator';
import { rankToValue } from '../utils/cardValue';
import { determineWinnerAndLoser } from '../utils/battleResolver';

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
  const [gameOverReason, setGameOverReason] = useState<string>('');
  const [previousTurnResult, setPreviousTurnResult] = useState<PreviousTurnResult>(null);
  const [feeCollected, setFeeCollected] = useState(false);
  useEffect(() => {
    let newDeck = shuffleDeck(createDeck());

    const hands = [[], [], []] as Card[][];
    for (let i = 0; i < 15; i++) {
      hands[i % 3].push(newDeck[i]);
    }

    let newPlayers = Array.from({ length: 3 }, (_, i) => ({
      name: `Player ${i + 1}`,
      hand: hands[i],
      points: 200 * ANTE,
      wins: 0,
    }));
    console.log('[ゲーム開始] 1ターン目の場代徴収');
  const tableFees = calculateAllTableFees(null, 3);
  
  newPlayers = newPlayers.map((player, idx) => ({
    ...player,
    points: player.points - tableFees[idx]
  }));
  console.log('[1ターン目 場代徴収後] プレイヤーポイント:', newPlayers.map(p => ({ name: p.name, points: p.points })));

    setPlayers(newPlayers);
    setDeck(newDeck.slice(15));

    // ✅ 初期配布時のJOKER判定
    const hasJokerInInitialHands = checkJokerInHands(newPlayers);
    console.log('[初期配布] JOKER判定結果:', hasJokerInInitialHands);
    setJokerDealtThisSet(hasJokerInInitialHands);
    setJokerDealtThisSet(hasJokerInInitialHands);
    setFeeCollected(true);
  }, []);


  //場代徴収
  useEffect(() => {
  // 1ターン目はスキップ（初期配布useEffectで徴収済み）
  if (turnCount === 0) return;
  
  // すでに徴収済みの場合はスキップ
  if (feeCollected) return;
  
  // roundResultが表示されている間はスキップ
  if (roundResult !== null) return;
  
  // すでにカードが出されている場合はスキップ
  if (fieldCards.some(card => card !== null)) return;
  console.log('[ターン開始] 場代徴収開始');
  console.log('[ターン開始] turnCount:', turnCount);
  console.log('[ターン開始] previousTurnResult:', previousTurnResult);
  
  const tableFees = calculateAllTableFees(previousTurnResult, players.length);
  
  setPlayers(prev => {
    const updated = prev.map((player, idx) => ({
      ...player,
      points: player.points - tableFees[idx]
    }));
    console.log('[場代徴収後] プレイヤーポイント:', updated.map(p => ({ name: p.name, points: p.points })));
    return updated;
  });
  
  setFeeCollected(true);
}, [turnCount, feeCollected, roundResult, fieldCards, previousTurnResult, players.length]);

  

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

      console.log('[デバッグ] allHandsEmpty:', allHandsEmpty);
      console.log('[デバッグ] jokerCount:', jokerCount);
      console.log('[デバッグ] players:', players.map(p => ({ name: p.name, points: p.points })));

      

      const cardsWithIndex = fieldCards.map((card, idx) => ({
        ...card!,
        playerIndex: idx
      }));

      const result = judgeWinner(cardsWithIndex);
      const { winnerIndexes, isDraw, isReverse, originalWinnerIndex } = result;

      
      let scoreToAdd = 0;
      let winnerIdx = -1;
      let loserIdx = -1;

      const battleResult = determineWinnerAndLoser(
        fieldCards,
        isDraw,
        winnerIndexes,
        isReverse,
        originalWinnerIndex
      );

      if (battleResult){
        const { winnerIndex, loserIndex, winnerCard, loserCard } = battleResult;

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

      // ✅ セット終了判定用の変数
      let isSetEnd = false;

      // セット終了時の処理
      if (allHandsEmpty) {
        console.log('[セット管理] 手札が空 - セット終了');
        console.log('[セット管理] setTurnIndex:', setTurnIndex);
        console.log('[セット管理] jokerDealtThisSet:', jokerDealtThisSet);
        
        if (setTurnIndex === 4) {
          isSetEnd = true;  // ✅ セット終了フラグを立てる
          console.log('[セット管理] セット完全終了、isSetEndをtrueに設定');
          setCurrentMultiplier(1);
          setNextMultiplier(1);
          setSetTurnIndex(0);
          
          if (shouldReshuffleAfterSet(jokerDealtThisSet)) {
            console.log('[セット終了] JOKERカウント +1 実行');
            setJokerCount(prev => {
              const newCount = prev + 1;
              console.log('[セット終了]jokerCount更新：prev=', prev, '→new = ', newCount);
              setTimeout(() => {
                const gameEndCheck = checkGameEnd(true, newCount, players);
                if (gameEndCheck.shouldEnd){
                  console.log('[セット終了後　ゲーム終了]', gameEndCheck.reason);
                  setGameOver(true);
                }
              },0);
              return newCount;
            });
          }else {
            console.log('[セット終了] JOKERカウント更新なし（jokerDealtThisSet = false）');
          }
          
          
        } else {
          console.log('[セット管理] セット途中での手札空（イレギュラー）');
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
      setFeeCollected(false);

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

          const bankruptCheck = checkGameEnd(false, jokerCount, updated);
          if (bankruptCheck.shouldEnd) {
          console.log('[得点更新後 ゲーム終了]', bankruptCheck.reason);
          setGameOver(true);
          return updated;
          }
  
        }

        const { updatedPlayers, updatedDeck, drawStatus } = drawCardsForNextTurn(
          deck,
          updated,
          createDeck,
          shuffleDeck,
          jokerDealtThisSet
        );

        // ✅ 新しい手札にJOKERがあるか確認
        const jokerInNewHands = checkJokerInHands(updatedPlayers);
        console.log('[カード配布後] JOKER判定結果:', jokerInNewHands);
        console.log('[カード配布後] jokerDealtThisSet更新前:', jokerDealtThisSet);
        console.log('[カード配布後] isSetEnd:', isSetEnd);
        
        // ✅ セット終了時は新しい値で上書き、継続中はOR条件
        if (isSetEnd) {
          // セット終了 → 新しいセットなので、新しい判定結果で上書き
          setJokerDealtThisSet(jokerInNewHands);
          console.log('[カード配布後] セット終了のため新しい値で上書き:', jokerInNewHands);
        } else {
          // セット継続中 → OR条件で累積
          setJokerDealtThisSet(prev => {
            const newValue = prev || jokerInNewHands;
            console.log('[カード配布後] セット継続中のためOR条件: prev =', prev, ', jokerInNewHands =', jokerInNewHands, '→ newValue =', newValue);
            return newValue;
          });
        }

        setDeck(updatedDeck);
        setLastRoundWarning(drawStatus === 'warn');

        return updatedPlayers;
      });
    }, WAIT_TIME_MS);

    return () => clearTimeout(timer);
  }
}, [roundResult, currentMultiplier, nextMultiplier, ANTE, deck, jokerDealtThisSet, setTurnIndex, turnCount, fieldCards, jokerCount, players]);

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
