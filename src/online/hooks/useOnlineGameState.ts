// src/online/hooks/useOnlineGameState.ts
// ゲーム基本情報の管理（roomId, playerIndex, myHand, players, gameStatus）


import { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { Card } from '../types/game';



export interface OpponentCard {
  visible: boolean;
  rank?: string;
  suit?: string;
}

interface UseOnlineGameStateProps {
  socket: Socket | null;
}

interface UseOnlineGameStateReturn {
  roomId: string;
  playerIndex: number | null;
  myHand: Card[];
  players: string[];
  gameStatus: 'waiting' | 'playing' | 'finished';
  opponentHands: OpponentCard[][];
  gameOverData: {
    reason: string;
    finalScores: number[];
    winner: number;
    roomConfig?: {
      id: string;
      ante: number;
      anteMultiplier: number;
      maxJokerCount: number;
      requiredChips: number;
    };
  } | null;
  scores: number[];
  wins: number[];
  currentMultiplier: number;
  fieldCards: (Card | null)[];
  playerSelections: boolean[];
  resetGameState: () => void;
}

export function useOnlineGameState({ socket }: UseOnlineGameStateProps): UseOnlineGameStateReturn {
  const [roomId, setRoomId] = useState<string>('');
  const [playerIndex, setPlayerIndex] = useState<number | null>(null);
  const [myHand, setMyHand] = useState<Card[]>([]);
  const [players, setPlayers] = useState<string[]>([]);
  const [gameStatus, setGameStatus] = useState<'waiting' | 'playing' | 'finished'>('waiting');
  const [opponentHands, setOpponentHands] = useState<OpponentCard[][]>([]);
  const [gameOverData, setGameOverData] = useState<{
    reason: string;
    finalScores: number[];
    winner: number;
    roomConfig?: {
    id: string;
    ante: number;
    anteMultiplier: number;
    maxJokerCount: number;
    requiredChips: number;
  };
  } | null>(null);
  const [scores, setScores] = useState<number[]>([0, 0, 0]);
  const [wins, setWins] = useState<number[]>([0, 0, 0]);
  const [currentMultiplier, setCurrentMultiplier] = useState<number>(1);
  const [fieldCards, setFieldCards] = useState<(Card | null)[]>([null, null, null]);
  const [playerSelections, setPlayerSelections] = useState<boolean[]>([false, false, false]);



  const resetGameState = () => {
    console.log('[useOnlineGameState] Resetting game state');
    setGameStatus('waiting');
    setGameOverData(null);
    setRoomId('');
    setPlayerIndex(null);
    setMyHand([]);
    setPlayers([]);
    setOpponentHands([]);
    setScores([0, 0, 0]);
    setWins([0, 0, 0]);
    setCurrentMultiplier(1);
    setFieldCards([null, null, null]);
    setPlayerSelections([false, false, false]);
  };



  useEffect(() => {
    if (!socket) return;

    console.log('[useOnlineGameState] Setting up event listeners');

    // ゲーム開始
    socket.on('game_start', (data) => {
      console.log('[useOnlineGameState] game_start received:', data);
      setRoomId(data.roomId || '');
      setPlayerIndex(data.playerIndex);
      setMyHand(data.hand);
      setPlayers(data.players);
      setOpponentHands(data.opponentHands || []);
      setScores(data.scores || [0, 0, 0]);
      setWins(data.wins || [0, 0, 0]);
      setCurrentMultiplier(data.currentMultiplier || 1);
      setFieldCards(data.fieldCards || [null, null, null]);
      setPlayerSelections(data.playerSelections || [false, false, false]);
      setGameStatus('playing');
      setGameOverData(null);
      if (data.roomId) {
    localStorage.setItem('kadoma_active_room', data.roomId);
    localStorage.setItem('kadoma_active_room_status', 'playing');
    console.log('[useOnlineGameState] Saved roomId to localStorage:', data.roomId);
  }
      console.log('[useOnlineGameState] gameStatus set to playing');
    });


     // フレンド戦専用のゲーム開始イベント
  socket.on('friend_game_start', (data) => {
    console.log('[GameState] Friend game start:', data);
    setRoomId(data.roomId);
    setPlayerIndex(data.playerIndex);
    setMyHand(data.hand);
    setPlayers(data.players);
    setGameStatus('playing');
    
    // フレンド戦フラグを保存
    localStorage.setItem('kadoma_active_room', data.roomId);
    localStorage.setItem('kadoma_active_room_status', 'playing');
    localStorage.setItem('kadoma_is_friend_battle', 'true');
  });



    //rejoin_success
  socket.on('rejoin_success', (data) => {
    console.log('[useOnlineGameState] rejoin_success received:', data);
    setRoomId(data.roomId);
    setPlayerIndex(data.playerIndex);
    setMyHand(data.gameState.hand);
    setPlayers(data.gameState.players || []);
    setOpponentHands(data.gameState.opponentHands || []);
    setScores(data.gameState.scores || [0, 0, 0]);
      setWins(data.gameState.wins || [0, 0, 0]);
      setCurrentMultiplier(data.gameState.currentMultiplier || 1);
      setFieldCards(data.gameState.fieldCards || [null, null, null]);
      setPlayerSelections(data.gameState.playerSelections || [false, false, false]);
    setGameStatus('playing');
    if (data.roomId) {
      localStorage.setItem('kadoma_active_room', data.roomId);
    }
  });

    


  // 場札公開時に手札を更新
socket.on('cards_revealed', (data) => {
      console.log('[useOnlineGameState] cards_revealed received:', data);
      
      if (data.hand !== undefined) {
        console.log('[useOnlineGameState] Updating hand to:', data.hand);
        setMyHand(data.hand);
      } else {
        console.warn('[useOnlineGameState] cards_revealed: hand is undefined');
      }
    });


  // 手札更新
    socket.on('hand_update', (data) => {
      console.log('[useOnlineGameState] hand_update received:', data);
      setMyHand(data.hand);
      setOpponentHands(data.opponentHands || []);
    });

    //turn_update イベントで状態更新
    socket.on('turn_update', (data) => {
      console.log('[useOnlineGameState] turn_update received:', data);
      
      if (data.currentMultiplier !== undefined) {
        setCurrentMultiplier(data.currentMultiplier);
      }
      if (data.fieldCards !== undefined) {
        setFieldCards(data.fieldCards);
      }
      if (data.scores !== undefined) {
        setScores(data.scores);
      }
      if (data.playerSelections !== undefined) {
        setPlayerSelections(data.playerSelections);
      }
    });


    // ゲーム終了
    socket.on('game_over', (data) => {
      console.log('[useOnlineGameState] game_over received:', data);
      console.log('[useOnlineGameState] data.roomConfig:', data.roomConfig);
      setGameStatus('finished');
      setGameOverData({ // データ保存（alert 削除）
        reason: data.reason,
        finalScores: data.finalScores,
        winner: data.winner,
        roomConfig: data.roomConfig,
      });


      console.log('[useOnlineGameState] gameOverData set to:', {  
    reason: data.reason,
    finalScores: data.finalScores,
    winner: data.winner,
    roomConfig: data.roomConfig,
  });
      localStorage.removeItem('kadoma_active_room');
  console.log('[useOnlineGameState] Removed roomId from localStorage');
    });


    // クリーンアップ
    return () => {
      console.log('[useOnlineGameState] Cleaning up event listeners');
      socket.off('game_start');
      socket.off('friend_game_start');
      socket.off('rejoin_success');
      socket.off('cards_revealed');
      socket.off('hand_update');
      socket.off('turn_update');
      socket.off('game_over');
    };
  }, [socket]);

  return {
    roomId,
    playerIndex,
    myHand,
    players,
    gameStatus,
    opponentHands,
    gameOverData,
    scores,
    wins,
    currentMultiplier,
    fieldCards,
    playerSelections,
    resetGameState,
  };
}