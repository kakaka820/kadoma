// src/online/components/OnlineGame.tsx

import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { Card } from '../../local/utils/deck';

interface Player {
  id: string;
  name: string;
}

export function OnlineGame() {
  const { socket, isConnected } = useSocket();
  
  // ゲーム状態
  const [roomId, setRoomId] = useState<string>('');
  const [playerIndex, setPlayerIndex] = useState<number | null>(null);
  const [myHand, setMyHand] = useState<Card[]>([]);
  const [fieldCards, setFieldCards] = useState<(Card | null)[]>([null, null, null]);
  const [players, setPlayers] = useState<string[]>([]);
  const [scores, setScores] = useState<number[]>([0, 0, 0]);
  const [wins, setWins] = useState<number[]>([0, 0, 0]);
  const [turnIndex, setTurnIndex] = useState<number>(0);
  const [currentMultiplier, setCurrentMultiplier] = useState<number>(1);
  const [roundResult, setRoundResult] = useState<string | null>(null);
  const [gameStatus, setGameStatus] = useState<'waiting' | 'playing' | 'finished'>('waiting');

  // イベントリスナー設定
  useEffect(() => {
    if (!socket) return;

    console.log('[OnlineGame] Setting up event listeners');

    // ゲーム開始
    socket.on('game_start', (data) => {
      console.log('[OnlineGame] game_start received:', data);
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
      console.log('[OnlineGame] card_played received:', data);
      setFieldCards(data.fieldCards);
    });

    // ラウンド結果
    socket.on('round_result', (data) => {
      console.log('[OnlineGame] round_result received:', data);
      setRoundResult(data.message);
      setScores(data.scores);
      setWins(data.wins);
      
      // 2秒後に結果クリア
      setTimeout(() => {
        setRoundResult(null);
      }, 2000);
    });

    // 手札更新
    socket.on('hand_update', (data) => {
      console.log('[OnlineGame] hand_update received:', data);
      setMyHand(data.hand);
    });

    // ターン更新
    socket.on('turn_update', (data) => {
      console.log('[OnlineGame] turn_update received:', data);
      setTurnIndex(data.turnIndex);
      setCurrentMultiplier(data.currentMultiplier);
      setFieldCards(data.fieldCards);
    });

    // ゲーム終了
    socket.on('game_over', (data) => {
      console.log('[OnlineGame] game_over received:', data);
      setGameStatus('finished');
      alert(`ゲーム終了！\n理由: ${data.reason}\n勝者: Player ${data.winner + 1}`);
    });

    // クリーンアップ
    return () => {
      console.log('[OnlineGame] Cleaning up event listeners');
      socket.off('game_start');
      socket.off('card_played');
      socket.off('round_result');
      socket.off('hand_update');
      socket.off('turn_update');
      socket.off('game_over');
    };
  }, [socket]);

  // カードを出す
  const playCard = (cardIndex: number) => {
    if (!socket || playerIndex === null || !roomId) return;
    
    if (playerIndex !== turnIndex) {
      console.log('[OnlineGame] Not your turn!');
      return;
    }

    console.log('[OnlineGame] Playing card:', cardIndex);
    socket.emit('play_card', {
      roomId,
      cardIndex
    });
  };

  // UI: 接続確認
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl mb-4">サーバーに接続中...</div>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
        </div>
      </div>
    );
  }

  // UI: マッチング待機中
  if (gameStatus === 'waiting') {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl mb-4">マッチング中...</div>
          <div className="text-lg">プレイヤーを待っています</div>
        </div>
      </div>
    );
  }

  // UI: ゲーム画面
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      {/* デバッグ情報 */}
      <div className="mb-4 p-4 bg-gray-800 rounded">
        <div className="text-sm">
          <div>接続状態: {isConnected ? '✅ 接続中' : '❌ 切断'}</div>
          <div>あなた: Player {playerIndex !== null ? playerIndex + 1 : '?'}</div>
          <div>現在のターン: Player {turnIndex + 1}</div>
          <div>倍率: ×{currentMultiplier}</div>
        </div>
      </div>

      {/* スコア表示 */}
      <div className="mb-8">
        <h2 className="text-2xl mb-4">スコアボード</h2>
        <div className="grid grid-cols-3 gap-4">
          {players.map((name, idx) => (
            <div
              key={idx}
              className={`p-4 rounded ${
                idx === playerIndex
                  ? 'bg-blue-600'
                  : idx === turnIndex
                  ? 'bg-green-600'
                  : 'bg-gray-700'
              }`}
            >
              <div className="font-bold">{name}</div>
              <div>スコア: {scores[idx]}</div>
              <div>勝利数: {wins[idx]}</div>
              {idx === playerIndex && <div className="text-sm mt-1">（あなた）</div>}
              {idx === turnIndex && <div className="text-sm mt-1">（ターン中）</div>}
            </div>
          ))}
        </div>
      </div>

      {/* 場札表示 */}
      <div className="mb-8">
        <h2 className="text-2xl mb-4">場札</h2>
        <div className="grid grid-cols-3 gap-4">
          {fieldCards.map((card, idx) => (
            <div
              key={idx}
              className="h-32 bg-gray-700 rounded flex items-center justify-center"
            >
              {card ? (
                <div className="text-center">
                  <div className="text-3xl">{card.suit}</div>
                  <div className="text-xl">{card.rank}</div>
                </div>
              ) : (
                <div className="text-gray-500">-</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ラウンド結果 */}
      {roundResult && (
        <div className="mb-8 p-4 bg-yellow-600 rounded text-center text-xl">
          {roundResult}
        </div>
      )}

      {/* 手札表示 */}
      <div>
        <h2 className="text-2xl mb-4">あなたの手札</h2>
        <div className="flex gap-4 justify-center">
          {myHand.map((card, idx) => (
            <button
              key={idx}
              onClick={() => playCard(idx)}
              disabled={playerIndex !== turnIndex}
              className={`
                w-24 h-32 rounded flex flex-col items-center justify-center
                transition-all
                ${
                  playerIndex === turnIndex
                    ? 'bg-blue-500 hover:bg-blue-400 cursor-pointer'
                    : 'bg-gray-600 cursor-not-allowed opacity-50'
                }
              `}
            >
              <div className="text-3xl">{card.suit}</div>
              <div className="text-xl">{card.rank}</div>
            </button>
          ))}
        </div>
        {playerIndex !== turnIndex && (
          <div className="text-center mt-4 text-yellow-400">
            他のプレイヤーが選択中です
          </div>
        )}
      </div>
    </div>
  );
}