// src/online/screens/RoomSelection.tsx
import React, { useState } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../contexts/AuthContext';
const config = require('../../shared/config');

let MULTI_ROOMS: RoomConfig[] = [];


  MULTI_ROOMS = config.MULTI_ROOMS;


interface RoomConfig {
  id: string;
  name: string;
  ante: number;
  anteMultiplier: number;
  maxJokerCount: number;
  requiredChips: number;
}

interface RoomSelectionProps {
  onBack: () => void;
  onRoomJoined: () => void;
}

export function RoomSelection({ onBack, onRoomJoined }: RoomSelectionProps) {
  const { socket } = useSocket();
  const { user } = useAuth();
  const [error, setError] = useState<string>('');
  const [selectedRoom, setSelectedRoom] = useState<string>('');
  const [isJoining, setIsJoining] = useState(false);

  const handleRoomSelect = async (room: RoomConfig) => {
    if (!socket || !user) return;
    
    setSelectedRoom(room.id);
    setIsJoining(true);
    setError('');

    // join_multi_roomイベントを送信
    socket.emit('join_multi_room', {
      roomId: room.id,
      userId: user.id,
      username: user.username
    }, (response: any) => {
      setIsJoining(false);
      
      if (response.success) {
        console.log('[RoomSelection] 部屋参加成功:', room.name);
        localStorage.setItem('kadoma_active_room', response.roomId);
        localStorage.setItem('kadoma_active_room_status', 'waiting');
        console.log('[RoomSelection] Saved roomId to localStorage:', response.roomId);
        onRoomJoined();
      } else {
        console.error('[RoomSelection] 部屋参加失敗:', response.error);
        setSelectedRoom('');
        
        // エラーメッセージを設定
        if (response.shortage) {
          setError(
            `チップが不足しています！\n` +
            `必要: ${response.required?.toLocaleString()} G\n` +
            `現在: ${response.current?.toLocaleString()} G\n` +
            `不足: ${response.shortage?.toLocaleString()} G`
          );
        } else {
          setError(response.error || '部屋に参加できませんでした');
        }
      }
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 overflow-y-auto flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">マルチ対戦 - 部屋選択</h1>
          <p className="text-gray-400">
            所持金: <span className="text-yellow-400 font-bold">{user?.currency?.toLocaleString()} G</span>
          </p>
        </div>

        {/* エラー表示 */}
        {error && (
          <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 mb-6" data-testid="error-insufficient-chips">
            <p className="text-red-200 whitespace-pre-line text-center">{error}</p>
          </div>
        )}

        {/* 部屋一覧 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {MULTI_ROOMS.map((room) => {
            const isSelected = selectedRoom === room.id;
            const canAfford = (user?.currency || 0) >= room.requiredChips;
            
            return (
              <button
                key={room.id}
                onClick={() => handleRoomSelect(room)}
                disabled={isJoining || !canAfford}
                className={`
                  p-6 rounded-lg border-2 transition-all
                  ${isSelected 
                    ? 'bg-purple-700 border-purple-500' 
                    : canAfford
                      ? 'bg-gray-800 border-gray-600 hover:border-purple-500 hover:bg-gray-750'
                      : 'bg-gray-900 border-gray-700 opacity-50 cursor-not-allowed'
                  }
                `}
                data-testid={`button-room-${room.id}`}
              >
                <div className="text-left">
                  <h3 className="text-xl font-bold text-white mb-3">{room.name}</h3>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">場代:</span>
                      <span className="text-white font-semibold">
                        {room.ante} G
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-400">JOKER回数:</span>
                      <span className="text-white font-semibold">{room.maxJokerCount}回</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-400">必要チップ:</span>
                      <span className={canAfford ? 'text-green-400 font-semibold' : 'text-red-400 font-semibold'}>
                        {room.requiredChips.toLocaleString()} G
                      </span>
                    </div>
                  </div>

                  {!canAfford && (
                    <p className="text-red-400 text-xs mt-3">チップ不足</p>
                  )}
                  
                  {isSelected && isJoining && (
                    <p className="text-purple-300 text-sm mt-3">参加中...</p>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* 戻るボタン */}
        <button
          onClick={onBack}
          disabled={isJoining}
          className="w-full py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition disabled:opacity-50"
          data-testid="button-back"
        >
          戻る
        </button>
      </div>
    </div>
  );
}
