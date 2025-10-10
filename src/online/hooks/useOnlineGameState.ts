// src/online/hooks/useOnlineGameState.ts
// WebSocketイベント（game_start, hand_update, card_played）を管理

import { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { Card } from '../types/game';

interface UseOnlineGameStateProps {
  socket: Socket | null;
}

interface UseOnlineGameStateReturn {
  roomId: string;
  setRoomId: React.Dispatch<React.SetStateAction<string>>;
  playerIndex: number | null;
  setPlayerIndex: React.Dispatch<React.SetStateAction<number | null>>;
  myHand: Card[];
  setMyHand: React.Dispatch<React.SetStateAction<Card[]>>;
  fieldCards: (Card | null)[];
  setFieldCards: React.Dispatch<React.SetStateAction<(Card | null)[]>>;
  players: string[];
  setPlayers: React.Dispatch<React.SetStateAction<string[]>>;
  scores: number[];
  setScores: React.Dispatch<React.SetStateAction<number[]>>;
  wins: number[];
  setWins: React.Dispatch<React.SetStateAction<number[]>>;
  turnIndex: number;
  setTurnIndex: React.Dispatch<React.SetStateAction<number>>;
  gameStatus: 'waiting' | 'playing' | 'finished';
  setGameStatus: React.Dispatch<React.SetStateAction<'waiting' | 'playing' | 'finished'>>;
}

export function useOnlineGameState({ socket }: UseOnlineGameStateProps): UseOnlineGameStateReturn {
  const [roomId, setRoomId] = useState<string>('');
  const [playerIndex, setPlayerIndex] = useState<number | null>(null);
  const [myHand, setMyHand] = useState<Card[]>([]);
  const [fieldCards, setFieldCards] = useState<(Card | null)[]>([null, null, null]);
  const [players, setPlayers] = useState<string[]>([]);
  const [scores, setScores] = useState<number[]>([0, 0, 0]);
  const [wins, setWins] = useState<number[]>([0, 0, 0]);
  const [turnIndex, setTurnIndex] = useState<number>(0);
  const [gameStatus, setGameStatus] = useState<'waiting' | 'playing' | 'finished'>('waiting');

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
      setScores(data.scores);
      setTurnIndex(data.turnIndex);
      setGameStatus('playing');
    });

    // カードが出された
    socket.on('card_played', (data) => {
      console.log('[useOnlineGameState] card_played received:', data);
      setFieldCards(data.fieldCards);
    });

    // 手札更新
    socket.on('hand_update', (data) => {
      console.log('[useOnlineGameState] hand_update received:', data);
      setMyHand(data.hand);
    });

    // クリーンアップ
    return () => {
      console.log('[useOnlineGameState] Cleaning up event listeners');
      socket.off('game_start');
      socket.off('card_played');
      socket.off('hand_update');
    };
  }, [socket]);

  return {
    roomId,
    setRoomId,
    playerIndex,
    setPlayerIndex,
    myHand,
    setMyHand,
    fieldCards,
    setFieldCards,
    players,
    setPlayers,
    scores,
    setScores,
    wins,
    setWins,
    turnIndex,
    setTurnIndex,
    gameStatus,
    setGameStatus,
  };
}
