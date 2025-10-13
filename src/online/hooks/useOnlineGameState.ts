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
}

export function useOnlineGameState({ socket }: UseOnlineGameStateProps): UseOnlineGameStateReturn {
  const [roomId, setRoomId] = useState<string>('');
  const [playerIndex, setPlayerIndex] = useState<number | null>(null);
  const [myHand, setMyHand] = useState<Card[]>([]);
  const [players, setPlayers] = useState<string[]>([]);
  const [gameStatus, setGameStatus] = useState<'waiting' | 'playing' | 'finished'>('waiting');
  const [opponentHands, setOpponentHands] = useState<OpponentCard[][]>([]);



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
      setGameStatus('playing');
      console.log('[useOnlineGameState] gameStatus set to playing');
    });


    //再接続成功イベント追加
  socket.on('reconnect_success', (data) => {
    console.log('[useOnlineGameState] reconnect_success received:', data);
    setPlayerIndex(data.playerIndex);
    setMyHand(data.gameState.hand);
    setGameStatus('playing');
  });


  // 場札公開時に手札を更新
socket.on('cards_revealed', (data) => {
  console.log('[useOnlineGameState] cards_revealed received:', data);  // ✅ data全体を表示
  
  //data.hand が存在する場合のみ更新
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


    // ゲーム終了
    socket.on('game_over', (data) => {
      console.log('[useOnlineGameState] game_over received:', data);
      setGameStatus('finished');
      alert(`ゲーム終了！\n理由: ${data.reason}\n勝者: Player ${data.winner + 1}`);
    });


    // クリーンアップ
    return () => {
      console.log('[useOnlineGameState] Cleaning up event listeners');
      socket.off('game_start');
      socket.off('reconnect_success');
      socket.off('cards_revealed');
      socket.off('hand_update');
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
  };
}
