// src/online/screens/FriendBattleScreen.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface Friend {
  id: string;
  friendId: string;
  username: string;
  playerId: number;
}

interface FriendRoom {
  id: string;
  roomCode: string;
  creatorId?: string;
  creatorUsername?: string;
  creatorPlayerId?: number;
  config: {
    roomName: string;
    ante: number;
    jokerCount: number;
    timeLimit: number;
    maxPlayers: number;
  };
  invitedFriends?: string[];
  createdAt: string;
}

interface FriendBattleScreenProps {
  onBack: () => void;
  onRoomJoined: () => void;
}

export function FriendBattleScreen({ onBack, onRoomJoined }: FriendBattleScreenProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'create' | 'invited'>('create');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [invitedRooms, setInvitedRooms] = useState<FriendRoom[]>([]);
  const [myRooms, setMyRooms] = useState<FriendRoom[]>([]);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 部屋設定
  const [roomName, setRoomName] = useState('');
  const [ante, setAnte] = useState(1000);
  const [jokerCount, setJokerCount] = useState(2);
  const [timeLimit, setTimeLimit] = useState(30);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);

  // フレンドリスト取得
  const fetchFriends = async () => {
    if (!user) return;

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/friend/list/${user.id}`
      );
      const data = await response.json();

      if (data.success) {
        setFriends(data.friends);
      }
    } catch (error) {
      console.error('[FriendBattle] Failed to fetch friends:', error);
    }
  };

  // 招待されている部屋を取得
  const fetchInvitedRooms = async () => {
    if (!user) return;

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/friend-room/invited/${user.id}`
      );
      const data = await response.json();

      if (data.success) {
        setInvitedRooms(data.rooms);
      }
    } catch (error) {
      console.error('[FriendBattle] Failed to fetch invited rooms:', error);
    }
  };

  // 自分が作成した部屋を取得
  const fetchMyRooms = async () => {
    if (!user) return;

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/friend-room/created/${user.id}`
      );
      const data = await response.json();

      if (data.success) {
        setMyRooms(data.rooms);
      }
    } catch (error) {
      console.error('[FriendBattle] Failed to fetch my rooms:', error);
    }
  };

  // 初回ロード
  useEffect(() => {
    fetchFriends();
    fetchInvitedRooms();
    fetchMyRooms();
  }, [user]);

  // フレンド選択トグル
  const toggleFriendSelection = (friendId: string) => {
    setSelectedFriends(prev =>
      prev.includes(friendId)
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    );
  };

  // 部屋作成
  const handleCreateRoom = async () => {
    if (!user) return;

    if (selectedFriends.length === 0) {
      showMessage('error', '最低1人のフレンドを選択してください');
      return;
    }

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/friend-room/create`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            config: {
              roomName: roomName || `${user.username}の部屋`,
              ante,
              jokerCount,
              timeLimit,
              invitedFriends: selectedFriends
            }
          })
        }
      );

      const data = await response.json();

      if (data.success) {
        showMessage('success', '部屋を作成しました！');
        
        // リセット
        setRoomName('');
        setSelectedFriends([]);
        
        // 部屋一覧を更新
        fetchMyRooms();
        
        // TODO: Socket.io で部屋に参加
        // この後、Socket.io のイベントを実装します
      } else {
        showMessage('error', data.error || '部屋作成に失敗しました');
      }
    } catch (error) {
      showMessage('error', 'ネットワークエラーが発生しました');
      console.error('[FriendBattle] Create room error:', error);
    }
  };

  // 部屋削除
  const handleDeleteRoom = async (roomId: string) => {
    if (!user) return;

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/friend-room/${roomId}`,
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id })
        }
      );

      const data = await response.json();

      if (data.success) {
        showMessage('success', '部屋を削除しました');
        fetchMyRooms();
      } else {
        showMessage('error', data.error || '削除に失敗しました');
      }
    } catch (error) {
      showMessage('error', 'ネットワークエラーが発生しました');
      console.error('[FriendBattle] Delete room error:', error);
    }
  };

  // メッセージ表示
  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 p-4">
      <div className="max-w-2xl mx-auto">
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBack}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
          >
            ← 戻る
          </button>
          <h1 className="text-2xl font-bold text-white">フレンド戦</h1>
          <div className="w-20"></div>
        </div>

        {/* メッセージ表示 */}
        {message && (
          <div
            className={`mb-4 p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-600 text-white'
                : 'bg-red-600 text-white'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* タブ切り替え */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('create')}
            className={`flex-1 py-3 font-bold rounded-lg transition ${
              activeTab === 'create'
                ? 'bg-orange-600 text-white'
                : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
            }`}
          >
            部屋を作成
          </button>
          <button
            onClick={() => setActiveTab('invited')}
            className={`flex-1 py-3 font-bold rounded-lg transition relative ${
              activeTab === 'invited'
                ? 'bg-orange-600 text-white'
                : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
            }`}
          >
            招待された部屋 ({invitedRooms.length})
            {invitedRooms.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {invitedRooms.length}
              </span>
            )}
          </button>
        </div>

        {/* 部屋作成タブ */}
        {activeTab === 'create' && (
          <div className="space-y-6">
            {/* 部屋設定 */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-white font-bold mb-4">部屋設定</h2>
              
              <div className="space-y-4">
                {/* 部屋名 */}
                <div>
                  <label className="block text-gray-400 text-sm mb-2">部屋名</label>
                  <input
                    type="text"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    placeholder={`${user?.username}の部屋`}
                    className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                {/* アンティ */}
                <div>
                  <label className="block text-gray-400 text-sm mb-2">
                    アンティ: {ante.toLocaleString()} G
                  </label>
                  <input
                    type="range"
                    min="100"
                    max="10000"
                    step="100"
                    value={ante}
                    onChange={(e) => setAnte(parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>

                {/* JOKER枚数 */}
                <div>
                  <label className="block text-gray-400 text-sm mb-2">
                    JOKER枚数: {jokerCount}枚
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="4"
                    step="1"
                    value={jokerCount}
                    onChange={(e) => setJokerCount(parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>

                {/* 制限時間 */}
                <div>
                  <label className="block text-gray-400 text-sm mb-2">
                    制限時間: {timeLimit}秒
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="60"
                    step="5"
                    value={timeLimit}
                    onChange={(e) => setTimeLimit(parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            {/* フレンド選択 */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-white font-bold mb-4">
                招待するフレンド ({selectedFriends.length}人選択中)
              </h2>
              
              {friends.length === 0 ? (
                <p className="text-gray-400 text-center py-8">
                  フレンドがいません
                </p>
              ) : (
                <div className="space-y-2">
                  {friends.map((friend) => (
                    <button
                      key={friend.friendId}
                      onClick={() => toggleFriendSelection(friend.friendId)}
                      className={`w-full p-4 rounded-lg transition ${
                        selectedFriends.includes(friend.friendId)
                          ? 'bg-orange-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold">{friend.username}</p>
                          <p className="text-sm opacity-75">ID: {friend.playerId}</p>
                        </div>
                        {selectedFriends.includes(friend.friendId) && (
                          <span className="text-2xl">✓</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 作成ボタン */}
            <button
              onClick={handleCreateRoom}
              disabled={selectedFriends.length === 0}
              className="w-full py-4 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 text-white font-bold text-xl rounded-lg transition"
            >
              部屋を作成
            </button>

            {/* 作成済みの部屋 */}
            {myRooms.length > 0 && (
              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-white font-bold mb-4">作成した部屋</h2>
                <div className="space-y-3">
                  {myRooms.map((room) => (
                    <div
                      key={room.id}
                      className="bg-gray-700 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-white font-bold">{room.config.roomName}</p>
                        <p className="text-gray-400 text-sm">コード: {room.roomCode}</p>
                      </div>
                      <div className="flex items-center justify-between text-sm text-gray-400 mb-3">
                        <span>アンティ: {room.config.ante.toLocaleString()} G</span>
                        <span>JOKER: {room.config.jokerCount}枚</span>
                        <span>制限: {room.config.timeLimit}秒</span>
                      </div>
                      <button
                        onClick={() => handleDeleteRoom(room.id)}
                        className="w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
                      >
                        削除
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 招待された部屋タブ */}
        {activeTab === 'invited' && (
          <div className="space-y-3">
            {invitedRooms.length === 0 ? (
              <div className="bg-gray-800 rounded-lg p-8 text-center text-gray-400">
                招待された部屋はありません
              </div>
            ) : (
              invitedRooms.map((room) => (
                <div
                  key={room.id}
                  className="bg-gray-800 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-white font-bold">{room.config.roomName}</p>
                    <p className="text-gray-400 text-sm">
                      作成者: {room.creatorUsername}
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-400 mb-3">
                    <span>アンティ: {room.config.ante.toLocaleString()} G</span>
                    <span>JOKER: {room.config.jokerCount}枚</span>
                    <span>制限: {room.config.timeLimit}秒</span>
                  </div>
                  <button
                    onClick={() => {
                      // TODO: Socket.io で部屋に参加
                      showMessage('success', '部屋に参加しました');
                    }}
                    className="w-full py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition"
                  >
                    参加する
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}