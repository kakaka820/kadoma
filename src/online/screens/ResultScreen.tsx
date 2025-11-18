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
  buyIn?: number;
  onReturnHome: () => void;
  onRematch: () => void;
  dailyBonusResult?: {
    bonusGranted: boolean;
    bonusAmount: number;
    remainingPlays: number;
  };
}

export function ResultScreen({
  playerIndex,
  finalScores,
  winner,
  players,
  reason,
  buyIn,
  onReturnHome,
  onRematch,
  dailyBonusResult,
}: ResultScreenProps) {
  const [isRematchClicked, setIsRematchClicked] = useState(false);
  const { socket } = useSocket();
  const { user } = useAuth();

//マウント時に localStorage を削除
  useEffect(() => {
    localStorage.removeItem('kadoma_active_room');
    console.log('[ResultScreen] Removed roomId from localStorage');
  }, []);


  
  const myScore = playerIndex !== null ? finalScores[playerIndex] : 0;
  const actualBuyIn = buyIn || 1000;
  const isWinner = myScore >= actualBuyIn;

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
        setIsRematchClicked(false);  // マッチング状態を解除
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

      {dailyBonusResult && dailyBonusResult.bonusGranted && (
          <div className="bg-gradient-to-r from-yellow-600 to-orange-600 rounded-lg p-4 mb-6 animate-pulse">
            <p className="text-white text-center font-bold text-lg">
              🎁 デイリーボーナス！
            </p>
            <p className="text-yellow-200 text-center text-2xl font-bold mt-1">
              +{dailyBonusResult.bonusAmount.toLocaleString()} G
            </p>
            <p className="text-yellow-100 text-center text-sm mt-2">
              残り {dailyBonusResult.remainingPlays} 回
            </p>
          </div>
        )}





        {/* スコア表示 */}
        <div className="bg-gray-700 rounded-lg p-4 mb-6">
          <h3 className="text-white text-lg font-bold mb-3">最終スコア</h3>
          {players.map((playerName, idx) => {
          
          const isMe = idx === playerIndex;
          const playerScore = finalScores[idx];
          const playerWon = playerScore >= actualBuyIn;
          
          return (
            <div
              key={idx}
              className={`flex justify-between items-center py-2 ${
               playerWon ? 'text-yellow-400' : 'text-gray-300'
               } ${isMe ? 'font-bold' : ''}`}
              >
              <span>
                {idx === winner && '👑 '}
                {playerName}
                {idx === playerIndex && ' (あなた)'}
              </span>
              <span className="font-mono">{finalScores[idx].toLocaleString()}</span>
            </div>
          );
         })}
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