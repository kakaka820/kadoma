// src/online/screens/ResultScreen.tsx
import React, { useEffect, useState } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../contexts/AuthContext'; 

interface ResultScreenProps {
  playerIndex: number | null;
  finalScores: number[];
  winner: number;
  players: string[];
  reason: string;
  onReturnHome: () => void;
  onRematch: () => void;
}

export function ResultScreen({
  playerIndex,
  finalScores,
  winner,
  players,
  reason,
  onReturnHome,
  onRematch,
}: ResultScreenProps) {
  const [isRematchClicked, setIsRematchClicked] = useState(false);
  const { socket } = useSocket();
  const { user } = useAuth();

//マウント時に localStorage を削除
  useEffect(() => {
    localStorage.removeItem('kadoma_active_room');
    console.log('[ResultScreen] Removed roomId from localStorage');
  }, []);


  const isWinner = playerIndex === winner;
  const myScore = playerIndex !== null ? finalScores[playerIndex] : 0;

   const handleRematchClick = () => {
    if (isRematchClicked) return;
    setIsRematchClicked(true);
    onRematch();
  };

  const handleCancelMatching = () => {
    if (!socket || !user) return;
    console.log('[WaitingRoom] Cancelling matching...');
    
    socket.emit('cancel_matching', { userId: user.id }, (response: any) => {
      console.log('[WaitingRoom] cancel_matching response:', response);


if (response.success) {
        console.log('[WaitingRoom] マッチングキャンセル成功');
        setIsRematchClicked(false);  // ✅ マッチング状態を解除
      } else {
        console.error('[ResultScreen] キャンセル失敗:', response.error);
        alert(response.error || 'キャンセルに失敗しました');
      }
    });
  };


  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-xl p-8 max-w-md w-full mx-4">
        {/* 勝敗表示 */}
        <div className="text-center mb-6">
          <h2 className={`text-4xl font-bold mb-2 ${isWinner ? 'text-yellow-400' : 'text-gray-400'}`}>
            {isWinner ? '🏆 勝利！' : '😢 敗北...'}
          </h2>
          <p className="text-gray-500 text-sm">{reason}</p>
        </div>

        {/* スコア表示 */}
        <div className="bg-gray-700 rounded-lg p-4 mb-6">
          <h3 className="text-white text-lg font-bold mb-3">最終スコア</h3>
          {players.map((playerName, idx) => (
            <div
              key={idx}
              className={`flex justify-between items-center py-2 ${
                idx === playerIndex ? 'text-yellow-400 font-bold' : 'text-gray-300'
              } ${idx === winner ? 'text-yellow-400' : ''}`}
            >
              <span>
                {idx === winner && '👑 '}
                {playerName}
                {idx === playerIndex && ' (あなた)'}
              </span>
              <span className="font-mono">{finalScores[idx].toLocaleString()}</span>
            </div>
          ))}
        </div>

        {/* あなたのスコア */}
        <div className="bg-gray-700 rounded-lg p-4 mb-6 text-center">
          <p className="text-gray-400 text-sm mb-1">あなたのスコア</p>
          <p className={`text-3xl font-bold ${isWinner ? 'text-yellow-400' : 'text-white'}`}>
            {myScore.toLocaleString()}
          </p>
        </div>

        {/* ボタン */}
        <div className="space-y-3">
          <button
            onClick={handleRematchClick}
            disabled={isRematchClicked}
            className={`w-full py-3 font-bold rounded-lg transition ${
              isRematchClicked 
                ? 'bg-gray-600 cursor-not-allowed' 
                : 'bg-blue-500 hover:bg-blue-600'
            } text-white`}
          >
            {isRematchClicked ? 'マッチング中...' : '再戦する'}
            </button>
            {isRematchClicked && (
            <button
              onClick={handleCancelMatching}
              className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition font-semibold"
            >
              マッチングをキャンセル
            </button>
          )}
          {!isRematchClicked && (
          <button
            onClick={onReturnHome}
            className="w-full py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
          >
            ホームへ戻る
          </button>
          )}
        </div>
      </div>
    </div>
  );
}