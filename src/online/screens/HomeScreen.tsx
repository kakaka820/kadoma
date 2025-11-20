// src/online/screens/HomeScreen.tsx
import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { QuestScreen } from './QuestScreen';
import { RulesModal } from '../components/modals/RulesModal';

type NavigationType = 'local' | 'multi' | 'custom' | 'friend' | 'stats' | 'quests' |'giftcode';

interface HomeScreenProps {
  onNavigate: (type: NavigationType) => void;
}

export function HomeScreen({ onNavigate }: HomeScreenProps) {
  const { user, logout } = useAuth();
  const [showTransferCode, setShowTransferCode] = React.useState(false);
  const [showRules, setShowRules] = React.useState(false);

  return (
    <>
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center overflow-y-auto px-4">
      <div className="max-w-md w-full mx-auto">
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

        {/* 対戦モード選択ボタン */}
        <div className="space-y-3 mb-4">
          <button
            onClick={() => onNavigate('multi')}
            className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xl rounded-lg transition"
            data-testid="button-multi-match"
          >
            マルチ対戦
          </button>
          
          <button
            onClick={() => onNavigate('custom')}
            className="w-full py-4 bg-green-600 hover:bg-green-700 text-white font-bold text-xl rounded-lg transition"
            data-testid="button-custom-match"
          >
            カスタム戦
          </button>
          
          <button
            onClick={() => onNavigate('friend')}
            className="w-full py-4 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xl rounded-lg transition"
            data-testid="button-friend-match"
          >
            フレンド戦
          </button>
        </div>

        
        <button
          onClick={() => onNavigate('local')}
          className="w-full py-4 bg-blue-500 hover:bg-blue-600 text-white font-bold text-xl rounded-lg transition mb-4"
          data-testid="button-online-match"
        >
          ローカル対戦
        </button>

        <button
        onClick={() => onNavigate('quests')}
        className="w-full py-4 bg-purple-500 hover:bg-purple-600 text-white font-bold text-xl rounded-lg transition mb-4"
      >
          クエスト
      </button>

        <button 
        onClick={() => onNavigate('stats')}
        className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xl rounded-lg transition mb-4"
        >
        戦績・履歴
        </button>

        <button
            onClick={() => setShowRules(true)}
            className="w-full py-4 bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xl rounded-lg transition mb-4"
          >
          ルール説明
          </button>

           <button
          onClick={() => onNavigate('giftcode')}
          className="w-full py-4 bg-pink-600 hover:bg-pink-700 text-white font-bold text-xl rounded-lg transition mb-4"
        >
        ギフトコード
        </button>

        {/* ログアウトボタン */}
        <button
          onClick={logout}
          className="w-full py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
          data-testid="button-logout"
        >
          ログアウト
        </button>
      </div>
    </div>

    <RulesModal isOpen={showRules} onClose={() => setShowRules(false)} />
    </>

  );
}