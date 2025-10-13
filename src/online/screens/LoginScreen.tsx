// src/online/components/LoginScreen.tsx
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function LoginScreen() {
  const { register, loginWithCode } = useAuth();
  const [mode, setMode] = useState<'register' | 'transfer'>('register');
  const [username, setUsername] = useState('');
  const [transferCode, setTransferCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 新規登録
  const handleRegister = async () => {

    console.log('[LoginScreen] handleRegister 開始');
    console.log('[LoginScreen] username:', username);

    if (!username.trim()) {
      console.log('[LoginScreen] バリデーションエラー: 空欄');
      setError('ユーザー名を入力してください');
      return;
    }

    if (username.length < 2 || username.length > 12) {
      console.log('[LoginScreen] バリデーションエラー: 文字数');
      setError('ユーザー名は2〜12文字で入力してください');
      return;
    }

    console.log('[LoginScreen] バリデーション通過');
    setIsLoading(true);
    setError('');
    
    console.log('[LoginScreen] register 呼び出し:', username.trim());
    const result = await register(username.trim());
    console.log('[LoginScreen] register 結果:', result);

    if (!result.success) {
      console.log('[LoginScreen] 登録失敗:', result.error);
      setError(result.error || '登録に失敗しました');
      setIsLoading(false);
      } else {
      console.log('[LoginScreen] 登録成功！');
    }
    // 成功時は自動でログイン画面に遷移
  };

  // 引継ぎコードログイン
  const handleTransferLogin = async () => {
    console.log('[LoginScreen] handleTransferLogin 開始');
    if (!transferCode.trim()) {
      setError('引継ぎコードを入力してください');
      return;
    }

    setIsLoading(true);
    setError('');
    
    console.log('[LoginScreen] loginWithCode 呼び出し:', transferCode.trim());
    const result = await loginWithCode(transferCode.trim().toUpperCase());
    console.log('[LoginScreen] loginWithCode 結果:', result);

    
    if (!result.success) {
      setError(result.error || 'ログインに失敗しました');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold text-white text-center mb-8">KADOMA</h1>

        {/* タブ切り替え */}
        <div className="flex mb-6 bg-gray-700 rounded-lg p-1">
          <button
            onClick={() => setMode('register')}
            className={`flex-1 py-2 rounded-md transition ${
              mode === 'register'
                ? 'bg-blue-500 text-white'
                : 'text-gray-300 hover:text-white'
            }`}
          >
            新規登録
          </button>
          <button
            onClick={() => setMode('transfer')}
            className={`flex-1 py-2 rounded-md transition ${
              mode === 'transfer'
                ? 'bg-blue-500 text-white'
                : 'text-gray-300 hover:text-white'
            }`}
          >
            引継ぎ
          </button>
        </div>

        {/* 新規登録フォーム */}
        {mode === 'register' && (
          <div>
            <label className="block text-gray-300 mb-2">ユーザー名</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="2〜12文字"
              maxLength={12}
              className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              disabled={isLoading}
            />
            <button
              onClick={handleRegister}
              disabled={isLoading}
              className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '登録中...' : '登録'}
            </button>
          </div>
        )}

        {/* 引継ぎフォーム */}
        {mode === 'transfer' && (
          <div>
            <label className="block text-gray-300 mb-2">引継ぎコード</label>
            <input
              type="text"
              value={transferCode}
              onChange={(e) => setTransferCode(e.target.value.toUpperCase())}
              placeholder="ABCD1234"
              maxLength={8}
              className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4 uppercase"
              disabled={isLoading}
            />
            <button
              onClick={handleTransferLogin}
              disabled={isLoading}
              className="w-full py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'ログイン中...' : 'ログイン'}
            </button>
          </div>
        )}

        {/* エラー表示 */}
        {error && (
          <div className="mt-4 p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-300 text-sm">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
