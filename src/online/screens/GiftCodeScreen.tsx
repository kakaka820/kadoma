// src/online/screens/GiftCodeScreen.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';



interface GiftCodeHistory {
  id: string;
  chip_amount: number;
  used_at: string;
  gift_codes: {
    code: string;
    created_by: string | null;
  };
}

interface GiftCodeScreenProps {
  onBack: () => void;
}

export function GiftCodeScreen({ onBack }: GiftCodeScreenProps) {
  const { user, updateUserCurrency } = useAuth();
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [history, setHistory] = useState<GiftCodeHistory[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // 使用履歴を取得
  const fetchHistory = async () => {
    if (!user) return;
    
    setIsLoadingHistory(true);
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/gift-code-history/${user.id}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        }
      );
      
      const data = await response.json();
      if (data.success) {
        setHistory(data.history);
      }
    } catch (error) {
      console.error('[GiftCode] History fetch error:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [user]);

  // ギフトコード使用
  const handleUseCode = async () => {
    if (!user || !code.trim()) {
      setMessage({ type: 'error', text: 'ギフトコードを入力してください' });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/use-gift-code`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            code: code.trim().toUpperCase()
          })
        }
      );

      const data = await response.json();

      if (data.success) {
        setMessage({
          type: 'success',
          text: `🎉 ${data.chipAmount.toLocaleString()} G を獲得しました！`
        });
        setCode('');
        
        // ユーザーの所持金を更新
        if (updateUserCurrency) {
          updateUserCurrency(data.chipAmount);
        }
        
        // 履歴を再取得
        fetchHistory();
      } else {
        setMessage({ type: 'error', text: data.error });
      }
    } catch (error) {
      console.error('[GiftCode] Use error:', error);
      setMessage({ type: 'error', text: 'ギフトコードの使用中にエラーが発生しました' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 overflow-y-auto flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">ギフトコード</h1>
          <p className="text-gray-400">
            所持金: <span className="text-yellow-400 font-bold">{user?.currency?.toLocaleString()} G</span>
          </p>
        </div>

        {/* ギフトコード入力フォーム */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <label className="block text-white font-bold mb-3">ギフトコードを入力</label>
          
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="WELCOME2025"
            className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 mb-4 text-center text-lg font-mono"
            disabled={isLoading}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleUseCode();
              }
            }}
          />

          {/* メッセージ表示 */}
          {message && (
            <div className={`p-4 rounded-lg mb-4 ${
              message.type === 'success' 
                ? 'bg-green-900/50 border border-green-500' 
                : 'bg-red-900/50 border border-red-500'
            }`}>
              <p className={`text-center ${
                message.type === 'success' ? 'text-green-200' : 'text-red-200'
              }`}>
                {message.text}
              </p>
            </div>
          )}

          <button
            onClick={handleUseCode}
            disabled={isLoading || !code.trim()}
            className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? '確認中...' : '使用する'}
          </button>
        </div>

        {/* 使用履歴 */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-4">使用履歴</h2>

          {isLoadingHistory ? (
            <p className="text-gray-400 text-center py-4">読み込み中...</p>
          ) : history.length === 0 ? (
            <p className="text-gray-400 text-center py-4">まだギフトコードを使用していません</p>
          ) : (
            <div className="space-y-3">
              {history.map((item) => (
                <div key={item.id} className="bg-gray-700 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-white font-mono font-bold">{item.gift_codes.code}</span>
                    <span className="text-green-400 font-semibold">
                      +{item.chip_amount.toLocaleString()} G
                    </span>
                  </div>
                  
                  <div className="text-xs text-gray-400">
                    <div>{new Date(item.used_at).toLocaleString('ja-JP')}</div>
                  </div>
                </div>
              ))}
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