//ゲームの基本状態の管理
import { useState, useEffect } from 'react';
import { createDeck, shuffleDeck, Card, Player } from '../utils/deck';
import { calculateAllTableFees } from '../utils/feeCalculator';
import { PreviousTurnResult } from '../types/game';
import { checkJokerInHands } from '../utils/joker';

interface UseGameStateProps{
    createDeck: () =>Card[];
    shuffleDeck:(deck: Card[]) => Card[];
        calculateAllTableFees:(prevResult: PreviousTurnResult | null, playerCount: number) => number[];
  checkJokerInHands: (players: Player[]) => boolean;
  ANTE: number;
}

interface UseGameStateReturn {
  deck: Card[];
  setDeck: React.Dispatch<React.SetStateAction<Card[]>>;
  players: Player[];
  setPlayers: React.Dispatch<React.SetStateAction<Player[]>>;
  turnCount: number;
  setTurnCount: React.Dispatch<React.SetStateAction<number>>;
  gameOver: boolean;
  setGameOver: React.Dispatch<React.SetStateAction<boolean>>;
  gameOverReason: string;
  setGameOverReason: React.Dispatch<React.SetStateAction<string>>;
  jokerCount: number;
  setJokerCount: React.Dispatch<React.SetStateAction<number>>;
  setTurnIndex: number;
  setSetTurnIndex: React.Dispatch<React.SetStateAction<number>>;
  jokerDealtThisSet: boolean;
  setJokerDealtThisSet: React.Dispatch<React.SetStateAction<boolean>>;
  lastRoundWarning: boolean;
  setLastRoundWarning: React.Dispatch<React.SetStateAction<boolean>>;
  fieldCards: (Card | null)[];
  setFieldCards: React.Dispatch<React.SetStateAction<(Card | null)[]>>;
  isInitialized: boolean;
}

export function useGameState({
  createDeck,
  shuffleDeck,
  calculateAllTableFees,
  checkJokerInHands,
  ANTE,
}: UseGameStateProps): UseGameStateReturn {
  // 基本状態
  const [deck, setDeck] = useState<Card[]>([]);
  const [players, setPlayers] = useState<Player[]>(
    Array.from({ length: 3 }, (_, i) => ({
      name: `Player ${i + 1}`,
      hand: [] as Card[],
      points: 200 * ANTE,
      wins: 0,
    }))
  );
  const [fieldCards, setFieldCards] = useState<(Card | null)[]>([null, null, null]);
  const [turnCount, setTurnCount] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameOverReason, setGameOverReason] = useState<string>('');
  const [jokerCount, setJokerCount] = useState(0);
  const [setTurnIndex, setSetTurnIndex] = useState(0);
  const [jokerDealtThisSet, setJokerDealtThisSet] = useState(false);
  const [lastRoundWarning, setLastRoundWarning] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // ゲーム初期化処理
  useEffect(() => {
    console.log('[useGameState] ゲーム初期化開始');
    
    let newDeck = shuffleDeck(createDeck());

    // 3人のプレイヤーに各5枚配布
    const hands: Card[][] = [[], [], []];
    for (let i = 0; i < 15; i++) {
      hands[i % 3].push(newDeck[i]);
    }

    let newPlayers = Array.from({ length: 3 }, (_, i) => ({
      name: `Player ${i + 1}`,
      hand: hands[i],
      points: 200 * ANTE,
      wins: 0,
    }));

    // 1ターン目の場代徴収
    console.log('[useGameState] 1ターン目の場代徴収');
    const tableFees = calculateAllTableFees(null, 3);

    newPlayers = newPlayers.map((player, idx) => ({
      ...player,
      points: player.points - tableFees[idx],
    }));
    console.log(
      '[useGameState] 場代徴収後のプレイヤーポイント:',
      newPlayers.map((p) => ({ name: p.name, points: p.points }))
    );

    setPlayers(newPlayers);
    setDeck(newDeck.slice(15));

    // 初期配布時のJOKER判定
    const hasJokerInInitialHands = checkJokerInHands(newPlayers);
    console.log('[useGameState] 初期配布JOKER判定結果:', hasJokerInInitialHands);
    setJokerDealtThisSet(hasJokerInInitialHands);
    
    setIsInitialized(true);
    console.log('[useGameState] ゲーム初期化完了');
  }, [createDeck, shuffleDeck, calculateAllTableFees, checkJokerInHands, ANTE]);

  return {
    deck,
    setDeck,
    players,
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
  };
}

