// src/online/components/ui/FriendWaitingRoom.tsx
import React, { useEffect, useState } from 'react';
import { useSocket } from '../../contexts/SocketContext';

interface Player {
  username: string;
  playerIndex: number;
  ready: boolean;
}

interface RoomConfig {
  roomName: string;
  ante: number;
  jokerCount: number;
  anteMultiplier?: number;
  timeLimit: number;
}

interface FriendWaitingRoomProps {
  onCancel: () => void;
}

export function FriendWaitingRoom({ onCancel }: FriendWaitingRoomProps) {
  const { socket } = useSocket();
  const [players, setPlayers] = useState<Player[]>([]);
  const [config, setConfig] = useState<RoomConfig | null>(null);
  const [playerCount, setPlayerCount] = useState(0);

  useEffect(() => {
    if (!socket) return;

    // 部屋更新イベントを受信
    const handleRoomUpdated = (data: any) => {
      console.log('[FriendWaiting] Room updated:', data);
      setPlayers(data.players || []);
      setPlayerCount(data.playerCount || 0);
      setConfig(data.config || null);
    };

    socket.on('friend_room_updated', handleRoomUpdated);

    return () => {
      socket.off('friend_room_updated', handleRoomUpdated);
    };
  }, [socket]);

  // キャンセルボタン
  const handleCancel = () => {
    if (socket) {
      // TODO: leave_friend_room イベントを送信
      // socket.emit('leave_friend_room', roomId);
    }
    onCancel();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            {config?.roomName || 'フレンド戦'}
          </h1>
          <p className="text-gray-400">フレンド待機中...</p>
        </div>

        {/* 部屋設定 */}
        {config && (
          <div className="bg-gray-800 rounded-lg p-6 mb-6">
            <h2 className="text-white font-bold mb-4">部屋設定</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-gray-400 text-sm">アンティ</p>
                <p className="text-white font-bold text-lg">
                  {config.ante?.toLocaleString()} G
                </p>
              </div>
              <div className="text-center">
                <p className="text-gray-400 text-sm">JOKER枚数</p>
                <p className="text-white font-bold text-lg">
                  {config.jokerCount}枚
                </p>
              </div>
              <div className="text-center">
                <p className="text-gray-400 text-sm">倍率</p>
                <p className="text-white font-bold text-lg">
                  ×{config.anteMultiplier || 100}
                </p>
              </div>
              <div className="text-center">
                <p className="text-gray-400 text-sm">制限時間</p>
                <p className="text-white font-bold text-lg">
                  {config.timeLimit}秒
                </p>
              </div>
            </div>
          </div>
        )}

        {/* プレイヤー一覧 */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-bold">プレイヤー</h2>
            <p className="text-orange-400 font-bold text-lg">
              {playerCount}/3
            </p>
          </div>

          <div className="space-y-3">
            {[0, 1, 2].map((index) => {
              const player = players.find(p => p.playerIndex === index);
              
              return (
                <div
                  key={index}
                  className={`p-4 rounded-lg border-2 ${
                    player
                      ? 'bg-gray-700 border-orange-500'
                      : 'bg-gray-900 border-gray-700'
                  }`}
                >
                  {player ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold">
                            {player.username.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-white font-bold">{player.username}</p>
                          <p className="text-gray-400 text-sm">プレイヤー {index + 1}</p>
                        </div>
                      </div>
                      <div className="text-green-400 font-bold">参加中</div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
                        <span className="text-gray-500 text-xl">?</span>
                      </div>
                      <p className="text-gray-500">待機中...</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 開始カウントダウン（3人揃った時） */}
        {playerCount === 3 && (
          <div className="bg-green-600 rounded-lg p-6 mb-6 text-center animate-pulse">
            <p className="text-white font-bold text-xl">
              まもなくゲーム開始！
            </p>
          </div>
        )}

        {/* キャンセルボタン */}
        <button
          onClick={handleCancel}
          className="w-full py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-lg transition"
        >
          キャンセル
        </button>
      </div>
    </div>
  );
}