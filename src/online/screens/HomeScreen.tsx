// src/online/screens/HomeScreen.tsx
import React from 'react';
import { useAuth } from '../contexts/AuthContext';

interface HomeScreenProps {
  onStartMatch: () => void;
}

export function HomeScreen({ onStartMatch }: HomeScreenProps) {
  const { user, logout } = useAuth();
  const [showTransferCode, setShowTransferCode] = React.useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">KADOMA</h1>
          <p className="text-gray-400">ようこそ、{user?.username} さん</p>
        </div>

        {/* ユーザー情報 */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-400">所持金</span>
            <span className="text-2xl font-bold text-yellow-400">
              {user?.currency?.toLocaleString()} G
            </span>
          </div>

          <div className="border-t border-gray-700 pt-4">
            <button
              onClick={() => setShowTransferCode(!showTransferCode)}
              className="w-full text-left text-gray-400 hover:text-white transition"
            >
              引継ぎコード {showTransferCode ? '▼' : '▶'}
            </button>
            {showTransferCode && (
              <div className="mt-2 p-3 bg-gray-700 rounded">
                <p className="text-white text-xl font-mono text-center">
                  {user?.transferCode}
                </p>
                <p className="text-gray-500 text-xs mt-1 text-center">
                  別端末でログインする際に使用
                </p>
              </div>
            )}
          </div>
        </div>

        {/* オンライン対戦ボタン */}
        <button
          onClick={onStartMatch}
          className="w-full py-4 bg-blue-500 hover:bg-blue-600 text-white font-bold text-xl rounded-lg transition mb-4"
        >
          オンライン対戦
        </button>

        {/* ログアウトボタン */}
        <button
          onClick={logout}
          className="w-full py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
        >
          ログアウト
        </button>
      </div>
    </div>
  );
}