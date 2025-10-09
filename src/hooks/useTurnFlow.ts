//進行統合管理フック
//ターン進行とフロー制御。セット管理、倍率更新、得点計算、カード補充、ゲームの終了判定担当

import { useState, useEffect } from 'react';
import { Player, Card } from '../utils/deck';
import { CardWithIndex, JudgeResult, PreviousTurnResult, BattleResult } from '../types/game';




interface DrawResult {
  updatedPlayers: Player[];
  updatedDeck: Card[];
  drawStatus: string;
}

interface UseTurnFlowProps {
  roundResult: string | null;
  setRoundResult: React.Dispatch<React.SetStateAction<string | null>>;
  nextMultiplier: number;
  setNextMultiplier: React.Dispatch<React.SetStateAction<number>>;
  fieldCards: (Card | null)[];
  setFieldCards: React.Dispatch<React.SetStateAction<(Card | null)[]>>;
  players: Player[];
  setPlayers: React.Dispatch<React.SetStateAction<Player[]>>;
  deck: Card[];
  setDeck: React.Dispatch<React.SetStateAction<Card[]>>;
  turnCount: number;
  setTurnCount: React.Dispatch<React.SetStateAction<number>>;
  jokerCount: number;
  setJokerCount: React.Dispatch<React.SetStateAction<number>>;
  setTurnIndex: number;
  setSetTurnIndex: React.Dispatch<React.SetStateAction<number>>;
  jokerDealtThisSet: boolean;
  setJokerDealtThisSet: React.Dispatch<React.SetStateAction<boolean>>;
  setLastRoundWarning: React.Dispatch<React.SetStateAction<boolean>>;
  setGameOver: React.Dispatch<React.SetStateAction<boolean>>;
  setGameOverReason: React.Dispatch<React.SetStateAction<string>>;
  setFeeCollected: React.Dispatch<React.SetStateAction<boolean>>;
  setPreviousTurnResult: React.Dispatch<React.SetStateAction<PreviousTurnResult | null>>;
  judgeWinner: (cards: CardWithIndex[]) => JudgeResult;
  determineWinnerAndLoser: (
    fieldCards: (Card | null)[],
    isDraw: boolean,
    winnerIndexes: number[],
    isReverse: boolean,
    originalWinnerIndex?: number
  ) => BattleResult | null;
  calculateScore: (
    winnerCard: Card,
    loserCard: Card,
    multiplier: number,
    isReverse: boolean
  ) => number;
  rankToValue: (card: Card) => number;
  drawCardsForNextTurn: (
    deck: Card[],
    players: Player[],
    createDeck: () => Card[],
    shuffleDeck: (deck: Card[]) => Card[],
    jokerDealtThisSet: boolean
  ) => DrawResult;
  checkJokerInHands: (players: Player[]) => boolean;
  checkGameEnd: (
    isSetEnd: boolean,
    jokerCount: number,
    players: Player[]
  ) => { shouldEnd: boolean; reason?: string };
  shouldReshuffleAfterSet: (jokerDealtThisSet: boolean) => boolean;
  createDeck: () => Card[];
  shuffleDeck: (deck: Card[]) => Card[];
  WAIT_TIME_MS: number;
}

interface UseTurnFlowReturn {
  currentMultiplier: number;
  setCurrentMultiplier: React.Dispatch<React.SetStateAction<number>>;
}

/**
 * ターン進行とフロー制御を管理するフック
 * セット管理、倍率更新、得点計算、カード補充、ゲーム終了判定を担当
 */
export function useTurnFlow({
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
}: UseTurnFlowProps): UseTurnFlowReturn {
  const [currentMultiplier, setCurrentMultiplier] = useState(1);

  // ターン進行処理
  useEffect(() => {
    if (roundResult !== null) {
      const timer = setTimeout(() => {
        console.log('[useTurnFlow] ターン切り替え処理開始');

        const allHandsEmpty = players.every((p) => p.hand.length === 0);

        console.log('[useTurnFlow] allHandsEmpty:', allHandsEmpty);
        console.log('[useTurnFlow] jokerCount:', jokerCount);
        console.log('[useTurnFlow] players:', players.map((p) => ({ name: p.name, points: p.points })));

        const cardsWithIndex: CardWithIndex[] = fieldCards.map((card, idx) => ({
          ...card!,
          playerIndex: idx,
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
          isReverse ?? false,
          originalWinnerIndex ?? undefined
        );

        if (battleResult) {
          const { winnerIndex, loserIndex, winnerCard, loserCard } = battleResult;

          console.log('[useTurnFlow] === 得点計算デバッグ ===');
          console.log('[useTurnFlow] ターン:', turnCount + 1);
          console.log('[useTurnFlow] 勝者カード:', winnerCard.rank, '値:', rankToValue(winnerCard));
          console.log('[useTurnFlow] 敗者カード:', loserCard.rank, '値:', rankToValue(loserCard));
          console.log('[useTurnFlow] currentMultiplier:', currentMultiplier);
          console.log('[useTurnFlow] (judgeWinnerから)逆転:', isReverse);
          console.log('[useTurnFlow] (battleResultから)逆転:', battleResult.isReverse);

          scoreToAdd = calculateScore(winnerCard, loserCard, currentMultiplier, isReverse || false);
          winnerIdx = winnerIndex;
          loserIdx = loserIndex;

          console.log('[useTurnFlow] 計算された得点:', scoreToAdd);
          console.log('[useTurnFlow] 勝者インデックス:', winnerIdx, '敗者インデックス:', loserIdx);
        }

        // セット終了判定用の変数
        let isSetEnd = false;

        // セット終了時の処理
        if (allHandsEmpty) {
          console.log('[useTurnFlow] 手札が空 - セット終了');
          console.log('[useTurnFlow] setTurnIndex:', setTurnIndex);
          console.log('[useTurnFlow] jokerDealtThisSet:', jokerDealtThisSet);

          if (setTurnIndex === 4) {
            isSetEnd = true;
            console.log('[useTurnFlow] セット完全終了、isSetEndをtrueに設定');
            setCurrentMultiplier(1);
            setNextMultiplier(1);
            setSetTurnIndex(0);

            if (shouldReshuffleAfterSet(jokerDealtThisSet)) {
              console.log('[useTurnFlow] JOKERカウント +1 実行');
              setJokerCount((prev) => {
                const newCount = prev + 1;
                console.log('[useTurnFlow] jokerCount更新：prev=', prev, '→new =', newCount);
                setTimeout(() => {
                  const gameEndCheck = checkGameEnd(true, newCount, players);
                  if (gameEndCheck.shouldEnd) {
                    console.log('[useTurnFlow] セット終了後ゲーム終了:', gameEndCheck.reason);
                    setGameOverReason( gameEndCheck.reason || 'JOKERが規定枚数に到達しました');
                    setGameOver(true);
                  }
                }, 0);
                return newCount;
              });
            } else {
              console.log('[useTurnFlow] JOKERカウント更新なし（jokerDealtThisSet = false）');
            }
          } else {
            console.log('[useTurnFlow] セット途中での手札空（イレギュラー）');
            setCurrentMultiplier(nextMultiplier);
            setSetTurnIndex((i) => i + 1);
          }
        } else {
          console.log('[useTurnFlow] 手札あり - セット継続');
          console.log('[useTurnFlow] setTurnIndex:', setTurnIndex);

          if (setTurnIndex === 4) {
            console.log('[useTurnFlow] WARNING: setTurnIndexが4だが手札が残っている');
            setCurrentMultiplier(1);
            setNextMultiplier(1);
            setSetTurnIndex(0);
          } else {
            setCurrentMultiplier(nextMultiplier);
            setSetTurnIndex((i) => i + 1);
          }
        }

        // 次のターンへの準備
        setFieldCards([null, null, null]);
        setTurnCount((c) => c + 1);
        setRoundResult(null);
        setFeeCollected(false);

        // プレイヤーの更新とカード配布
        setPlayers((prevPlayers) => {
          let updated = [...prevPlayers];
          
          // 得点の更新
          if (winnerIdx !== -1 && loserIdx !== -1 && scoreToAdd > 0) {
            console.log('[useTurnFlow] 更新前 勝者ポイント:', updated[winnerIdx].points);
            console.log('[useTurnFlow] 更新前 敗者ポイント:', updated[loserIdx].points);

            updated[winnerIdx] = {
              ...updated[winnerIdx],
              points: updated[winnerIdx].points + scoreToAdd,
            };
            updated[loserIdx] = {
              ...updated[loserIdx],
              points: updated[loserIdx].points - scoreToAdd,
            };

            console.log('[useTurnFlow] 更新後 勝者ポイント:', updated[winnerIdx].points);
            console.log('[useTurnFlow] 更新後 敗者ポイント:', updated[loserIdx].points);

            // 前回のターン結果を保存
            if (battleResult) {
            if (winnerIdx !== -1 && loserIdx !== -1) {
            setPreviousTurnResult({
            winnerIndex: winnerIdx,
            loserIndex: loserIdx,
            isDraw: false,
             });
            }
        } else {
            setPreviousTurnResult({
                winnerIndex: -1,
                loserIndex: -1,
                isDraw: true,
            });
        }


            // 破産チェック
            const bankruptCheck = checkGameEnd(false, jokerCount, updated);
            if (bankruptCheck.shouldEnd) {
              console.log('[useTurnFlow] 得点更新後ゲーム終了:', bankruptCheck.reason);
              setGameOverReason( bankruptCheck.reason || '');
              setGameOver(true);
              return updated;
            }
          }

          // カード配布
          const { updatedPlayers, updatedDeck, drawStatus } = drawCardsForNextTurn(
            deck,
            updated,
            createDeck,
            shuffleDeck,
            jokerDealtThisSet
          );

          // 新しい手札にJOKERがあるか確認
          const jokerInNewHands = checkJokerInHands(updatedPlayers);
          console.log('[useTurnFlow] カード配布後JOKER判定結果:', jokerInNewHands);
          console.log('[useTurnFlow] カード配布後jokerDealtThisSet更新前:', jokerDealtThisSet);
          console.log('[useTurnFlow] カード配布後isSetEnd:', isSetEnd);

          // セット終了時は新しい値で上書き、継続中はOR条件
          if (isSetEnd) {
            setJokerDealtThisSet(jokerInNewHands);
            console.log('[useTurnFlow] セット終了のため新しい値で上書き:', jokerInNewHands);
          } else {
            setJokerDealtThisSet((prev) => {
              const newValue = prev || jokerInNewHands;
              console.log(
                '[useTurnFlow] セット継続中のためOR条件: prev =',
                prev,
                ', jokerInNewHands =',
                jokerInNewHands,
                '→ newValue =',
                newValue
              );
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
  }, [
    roundResult,
    currentMultiplier,
    nextMultiplier,
    deck,
    jokerDealtThisSet,
    setTurnIndex,
    turnCount,
    fieldCards,
    jokerCount,
    players,
    setRoundResult,
    setNextMultiplier,
    setFieldCards,
    setPlayers,
    setDeck,
    setTurnCount,
    setJokerCount,
    setSetTurnIndex,
    setJokerDealtThisSet,
    setLastRoundWarning,
    setGameOver,
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
  ]);

  return {
    currentMultiplier,
    setCurrentMultiplier,
  };
}
