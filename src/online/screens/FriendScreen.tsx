// src/online/screens/FriendScreen.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface Friend {
  id: string;
  friendId: string;
  username: string;
  playerId: number;
  lastLoginAt: string;
  createdAt: string;
}

interface FriendRequest {
  id: string;
  senderId: string;
  senderUsername: string;
  senderPlayerId: number;
  createdAt: string;
}

interface FriendScreenProps {
  onBack: () => void;
}

export function FriendScreen({ onBack }: FriendScreenProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'friends' | 'requests'>('friends');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [playerIdInput, setPlayerIdInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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
      console.error('[Friend] Failed to fetch friends:', error);
    }
  };

  // 申請一覧取得
  const fetchRequests = async () => {
    if (!user) return;

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/friend/requests/${user.id}`
      );
      const data = await response.json();

      if (data.success) {
        setRequests(data.requests);
      }
    } catch (error) {
      console.error('[Friend] Failed to fetch requests:', error);
    }
  };

  // 初回ロード
  useEffect(() => {
    fetchFriends();
    fetchRequests();
  }, [user]);

  // フレンド申請送信
  const handleSendRequest = async () => {
    if (!user || !playerIdInput.trim()) {
      showMessage('error', 'プレイヤーIDを入力してください');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/friend/request`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            targetPlayerId: parseInt(playerIdInput)
          })
        }
      );

      const data = await response.json();

      if (data.success) {
        showMessage('success', `${data.targetUsername} さんに申請を送信しました`);
        setPlayerIdInput('');
      } else {
        showMessage('error', data.error || '申請に失敗しました');
      }
    } catch (error) {
      showMessage('error', 'ネットワークエラーが発生しました');
      console.error('[Friend] Request error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 申請承認
  const handleAcceptRequest = async (friendshipId: string) => {
    if (!user) return;

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/friend/accept`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, friendshipId })
        }
      );

      const data = await response.json();

      if (data.success) {
        showMessage('success', 'フレンド申請を承認しました');
        fetchFriends();
        fetchRequests();
      } else {
        showMessage('error', data.error || '承認に失敗しました');
      }
    } catch (error) {
      showMessage('error', 'ネットワークエラーが発生しました');
      console.error('[Friend] Accept error:', error);
    }
  };

  // 申請拒否
  const handleRejectRequest = async (friendshipId: string) => {
    if (!user) return;

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/friend/reject`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, friendshipId })
        }
      );

      const data = await response.json();

      if (data.success) {
        showMessage('success', 'フレンド申請を拒否しました');
        fetchRequests();
      } else {
        showMessage('error', data.error || '拒否に失敗しました');
      }
    } catch (error) {
      showMessage('error', 'ネットワークエラーが発生しました');
      console.error('[Friend] Reject error:', error);
    }
  };

  // メッセージ表示
  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  // 最終ログイン時間をフォーマット
  const formatLastLogin = (lastLoginAt: string) => {
    const now = new Date();
    const loginTime = new Date(lastLoginAt);
    const diffMs = now.getTime() - loginTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 5) return 'オンライン';
    if (diffMins < 60) return `${diffMins}分前`;
    if (diffHours < 24) return `${diffHours}時間前`;
    return `${diffDays}日前`;
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
          <h1 className="text-2xl font-bold text-white">フレンド</h1>
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

        {/* プレイヤーID表示 */}
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <p className="text-gray-400 text-sm mb-1">あなたのプレイヤーID</p>
          <p className="text-white text-2xl font-bold">{user?.playerId || '---'}</p>
        </div>

        {/* フレンド申請入力 */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-white font-bold mb-4">フレンド申請を送る</h2>
          <div className="flex gap-2">
            <input
              type="number"
              value={playerIdInput}
              onChange={(e) => setPlayerIdInput(e.target.value)}
              placeholder="プレイヤーIDを入力"
              className="flex-1 px-4 py-3 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              disabled={isLoading}
            />
            <button
              onClick={handleSendRequest}
              disabled={isLoading || !playerIdInput.trim()}
              className="px-6 py-3 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 text-white font-bold rounded-lg transition"
            >
              {isLoading ? '送信中...' : '送信'}
            </button>
          </div>
        </div>

        {/* タブ切り替え */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setActiveTab('friends')}
            className={`flex-1 py-3 font-bold rounded-lg transition ${
              activeTab === 'friends'
                ? 'bg-orange-600 text-white'
                : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
            }`}
          >
            フレンドリスト ({friends.length})
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`flex-1 py-3 font-bold rounded-lg transition relative ${
              activeTab === 'requests'
                ? 'bg-orange-600 text-white'
                : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
            }`}
          >
            申請 ({requests.length})
            {requests.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {requests.length}
              </span>
            )}
          </button>
        </div>

        {/* フレンドリスト */}
        {activeTab === 'friends' && (
          <div className="space-y-3">
            {friends.length === 0 ? (
              <div className="bg-gray-800 rounded-lg p-8 text-center text-gray-400">
                フレンドがいません
              </div>
            ) : (
              friends.map((friend) => (
                <div
                  key={friend.id}
                  className="bg-gray-800 rounded-lg p-4 flex items-center justify-between"
                >
                  <div>
                    <p className="text-white font-bold text-lg">{friend.username}</p>
                    <p className="text-gray-400 text-sm">ID: {friend.playerId}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-400 text-sm">
                      {formatLastLogin(friend.lastLoginAt)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* 申請一覧 */}
        {activeTab === 'requests' && (
          <div className="space-y-3">
            {requests.length === 0 ? (
              <div className="bg-gray-800 rounded-lg p-8 text-center text-gray-400">
                申請はありません
              </div>
            ) : (
              requests.map((request) => (
                <div
                  key={request.id}
                  className="bg-gray-800 rounded-lg p-4"
                >
                  <div className="mb-3">
                    <p className="text-white font-bold text-lg">
                      {request.senderUsername}
                    </p>
                    <p className="text-gray-400 text-sm">ID: {request.senderPlayerId}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAcceptRequest(request.id)}
                      className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition"
                    >
                      承認
                    </button>
                    <button
                      onClick={() => handleRejectRequest(request.id)}
                      className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition"
                    >
                      拒否
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}