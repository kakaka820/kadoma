// src/online/hooks/useCardPlay.ts
// カード出す処理とJOKER制限チェック,JokerLogic初期化担当

import { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';

interface JokerModule {
  canPlayJoker: (card: any, setTurnIndex: number) => boolean;
  isJoker: (card: any) => boolean;
}

declare global {
  interface Window {
    JokerLogic?: JokerModule;
  }
}

// JokerLogic初期化
let JokerLogic: JokerModule | null = null;

try {
  if (typeof window !== 'undefined' && window.JokerLogic) {
    JokerLogic = window.JokerLogic;
  } else {
    JokerLogic = require('../../../shared/joker');
  }
} catch (e) {
  console.warn('[useCardPlay] JokerLogic not loaded yet');
}

interface UseCardPlayProps {
  socket: Socket | null;
  roomId: string;
  playerIndex: number | null;
  myHand: any[];
  playerSelections: boolean[];
  setTurnIndex: number;
}

interface UseCardPlayReturn {
  playCard: (cardIndex: number) => void;
  selectedCardIndex: number | null;
}

export function useCardPlay({
  socket,
  roomId,
  playerIndex,
  myHand,
  playerSelections,
  setTurnIndex,
}: UseCardPlayProps) : UseCardPlayReturn {

  // ✅ 選択したカードのインデックスを保存
  const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null);

  const playCard = (cardIndex: number) => {
    if (!socket || playerIndex === null || !roomId) return;
    
    // すでに選択済みの場合は何もしない
    if (playerSelections[playerIndex]) {
      console.log('[useCardPlay] Already selected a card');
      return;
    }

    // JOKER制限チェック
    const card = myHand[cardIndex];
    const jokerModule = JokerLogic || window.JokerLogic;
    
    if (jokerModule && !jokerModule.canPlayJoker(card, setTurnIndex)) {
      console.log('[useCardPlay] JOKERはセットの1ターン目に出せません');
      alert('🃏 JOKERはセットの1ターン目には出せません！');
      return;
    }

    console.log('[useCardPlay] Playing card:', cardIndex);

    //選択したインデックスを保存
    setSelectedCardIndex(cardIndex);
    
    socket.emit('play_card', {
      roomId,
      cardIndex
    });
  };

//turn_updateでリセット（新ターン開始時）
useEffect(() => {
  if (!socket) return;
  
  socket.on('turn_update', () => {
    console.log('[useCardPlay] turn_update - resetting selectedCardIndex');
    setSelectedCardIndex(null);
  });
  
  return () => {
    socket.off('turn_update');
  };
}, [socket]);

  return { playCard, selectedCardIndex };
}
