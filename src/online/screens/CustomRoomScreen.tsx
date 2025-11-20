// src/online/screens/CustomRoomScreen.tsx
import React, { useState, useEffect } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../contexts/AuthContext';

interface CustomRoom {
  roomId: string;
  ante: number;
  maxJokerCount: number;
  timeLimit: number;
  requiredChips: number;
  playerCount: number;
  createdAt: number;
}

interface CustomRoomScreenProps {
  onBack: () => void;
  onRoomJoined: () => void;
}




  const JOKER_MULTIPLIER_MAP: Record<number, number> = {
  3: 300,
  5: 700,
  8: 1000,
  10: 1300,
};

export function CustomRoomScreen({ onBack, onRoomJoined }: CustomRoomScreenProps) {
  const { socket } = useSocket();
  const { user } = useAuth();
  const [screen, setScreen] = useState<'list' | 'create'>('list');
  const [rooms, setRooms] = useState<CustomRoom[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  
  // 部屋作成フォーム
  const [ante, setAnte] = useState(10);
  const [maxJokerCount, setMaxJokerCount] = useState(3);
  const [timeLimit, setTimeLimit] = useState(8);

  const anteMultiplier = JOKER_MULTIPLIER_MAP[maxJokerCount] || 300;

  // 必要チップを計算
  const requiredChips = ante * anteMultiplier;

  // 部屋一覧を取得
  const fetchRooms = () => {
    if (!socket) return;
    
    socket.emit('get_custom_rooms', (response: any) => {
      if (response.success) {
        setRooms(response.rooms);
      }
    });
  };

  // 定期的に部屋一覧を更新
  useEffect(() => {
    if (screen === 'list') {
      fetchRooms();
      const interval = setInterval(fetchRooms, 3000); // 3秒ごと
      return () => clearInterval(interval);
    }
  }, [screen, socket]);

  // 部屋作成
  const handleCreateRoom = () => {
    if (!socket || !user) return;
    
    setIsLoading(true);
    setError('');
    
    socket.emit('create_custom_room', {
      userId: user.id,
      username: user.username,
      ante,
      maxJokerCount,
      timeLimit,
      anteMultiplier
    }, (response: any) => {
      setIsLoading(false);
      
      if (response.success) {
        console.log('[CustomRoom] Room created successfully');
        localStorage.setItem('kadoma_active_room', response.roomId);
        localStorage.setItem('kadoma_active_room_status', 'waiting');
        onRoomJoined();
      } else {
        if (response.shortage) {
          setError(
            `チップが不足しています！\n` +
            `不足: ${response.shortage?.toLocaleString()} G`
          );
        } else {
          setError(response.error || '部屋作成に失敗しました');
        }
      }
    });
  };

  // 部屋参加
  const handleJoinRoom = (room: CustomRoom) => {
    if (!socket || !user) return;
    
    setIsLoading(true);
    setError('');
    
    socket.emit('join_custom_room', {
      roomId: room.roomId,
      userId: user.id,
      username: user.username
    }, (response: any) => {
      setIsLoading(false);
      
      if (response.success) {
        console.log('[CustomRoom] Joined room successfully');
        localStorage.setItem('kadoma_active_room', response.roomId);
        localStorage.setItem('kadoma_active_room_status', 'waiting');
        onRoomJoined();
      } else {
        if (response.shortage) {
          setError(
            `チップが不足しています！\n` +
            `不足: ${response.shortage?.toLocaleString()} G`
          );
        } else {
          setError(response.error || '部屋参加に失敗しました');
        }
      }
    });
  };

  // 部屋一覧画面
  if (screen === 'list') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 overflow-y-auto flex items-center justify-center p-4">
        <div className="max-w-4xl w-full">
          {/* ヘッダー */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">カスタム戦</h1>
            <p className="text-gray-400">
              所持金: <span className="text-yellow-400 font-bold">{user?.currency?.toLocaleString()} G</span>
            </p>
          </div>

          {/* エラー表示 */}
          {error && (
            <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 mb-6">
              <p className="text-red-200 whitespace-pre-line text-center">{error}</p>
            </div>
          )}

          {/* 部屋作成ボタン */}
          <button
            onClick={() => setScreen('create')}
            className="w-full py-4 bg-green-600 hover:bg-green-700 text-white font-bold text-xl rounded-lg transition mb-6"
          >
            ＋ 新しい部屋を作る
          </button>

          {/* 部屋一覧 */}
          <div className="bg-gray-800 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-white mb-4">待機中の部屋</h2>

            {rooms.length === 0 ? (
              <p className="text-gray-400 text-center py-8">
                待機中の部屋がありません。<br />
                新しい部屋を作成してください。
              </p>
            ) : (
              <div className="space-y-3">
                {rooms.map((room) => {
                  const canAfford = (user?.currency || 0) >= room.requiredChips;
                  
                  return (
                    <button
                      key={room.roomId}
                      onClick={() => handleJoinRoom(room)}
                      disabled={isLoading || !canAfford}
                      className={`
                        w-full p-4 rounded-lg border-2 transition-all text-left
                        ${canAfford
                          ? 'bg-gray-700 border-gray-600 hover:border-purple-500 hover:bg-gray-650'
                          : 'bg-gray-900 border-gray-700 opacity-50 cursor-not-allowed'
                        }
                      `}
                    >
                      <div className="flex justify-between items-center">
                        <div className="space-y-1">
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-gray-400">
                              場代: <span className="text-white font-semibold">{room.ante} G</span>
                            </span>
                            <span className="text-gray-400">
                              JOKER: <span className="text-white font-semibold">{room.maxJokerCount}回</span>
                            </span>
                            <span className="text-gray-400">
                              制限: <span className="text-white font-semibold">{room.timeLimit}秒</span>
                            </span>
                          </div>
                          <div className="text-sm">
                            <span className="text-gray-400">必要チップ: </span>
                            <span className={canAfford ? 'text-green-400 font-semibold' : 'text-red-400 font-semibold'}>
                              {room.requiredChips.toLocaleString()} G
                            </span>
                          </div>
                        </div>
                        
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-400">
                            {room.playerCount}/3
                          </div>
                          <div className="text-xs text-gray-500">待機中</div>
                        </div>
                      </div>
                      
                      {!canAfford && (
                        <p className="text-red-400 text-xs mt-2">チップ不足</p>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 戻るボタン */}
          <button
            onClick={onBack}
            disabled={isLoading}
            className="w-full py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
          >
            戻る
          </button>
        </div>
      </div>
    );
  }

  // 部屋作成画面
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 overflow-y-auto flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">部屋を作成</h1>
          <p className="text-gray-400">
            所持金: <span className="text-yellow-400 font-bold">{user?.currency?.toLocaleString()} G</span>
          </p>
        </div>

        {/* エラー表示 */}
        {error && (
          <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 mb-6">
            <p className="text-red-200 whitespace-pre-line text-center">{error}</p>
          </div>
        )}

        {/* 設定フォーム */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6 space-y-6">
          {/* アンティ選択 */}
          <div>
            <label className="block text-white font-bold mb-2">場代（アンティ）</label>
            <select
              value={ante}
              onChange={(e) => setAnte(Number(e.target.value))}
              className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value={1}>1 G</option>
              <option value={5}>5 G</option>
              <option value={10}>10 G</option>
              <option value={20}>20 G</option>
            </select>
          </div>

          {/* JOKER回数選択 */}
          <div>
            <label className="block text-white font-bold mb-2">JOKER回数</label>
            <select
              value={maxJokerCount}
              onChange={(e) => setMaxJokerCount(Number(e.target.value))}
              className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value={3}>3回</option>
              <option value={5}>5回</option>
              <option value={8}>8回</option>
              <option value={10}>10回</option>
            </select>
          </div>

          {/* 倍率選択 */}
          <div>
            <label className="block text-white font-bold mb-2">初期持ち点倍率</label>
            <div className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border-2 border-gray-600">
              ×{anteMultiplier}
            </div>
            <p className="text-gray-500 text-xs mt-1">※ JOKER回数によって自動設定されます</p>
          </div>


          {/* 時間制限選択 */}
          <div>
            <label className="block text-white font-bold mb-2">時間制限</label>
            <select
              value={timeLimit}
              onChange={(e) => setTimeLimit(Number(e.target.value))}
              className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value={5}>5秒</option>
              <option value={8}>8秒</option>
              <option value={15}>15秒</option>
              <option value={30}>30秒</option>
              <option value={60}>60秒</option>
            </select>
          </div>

          {/* 必要チップ表示 */}
          <div className="bg-gray-700 rounded-lg p-4">
            <div className="text-gray-400 text-sm mb-1">必要チップ</div>
            <div className={`text-3xl font-bold ${
              (user?.currency || 0) >= requiredChips ? 'text-green-400' : 'text-red-400'
            }`}>
              {requiredChips.toLocaleString()} G
            </div>
            {(user?.currency || 0) < requiredChips && (
              <p className="text-red-400 text-sm mt-2">チップが不足しています</p>
            )}
          </div>
        </div>

        {/* ボタン */}
        <div className="space-y-3">
          <button
            onClick={handleCreateRoom}
            disabled={isLoading || (user?.currency || 0) < requiredChips}
            className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xl rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? '作成中...' : '部屋を作成してマッチング開始'}
          </button>

          <button
            onClick={() => {
              setScreen('list');
              setError('');
            }}
            disabled={isLoading}
            className="w-full py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
          >
            戻る
          </button>
        </div>
      </div>
    </div>
  );
}