// src/online/screens/StatsScreen.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const SERVER_URL = process.env.REACT_APP_SERVER_URL || 'http://localhost:3001';

interface StatsScreenProps {
  onBack: () => void;
}

interface Stats {
  totalGames: number;
  totalBuyIn: number;
  totalFinalScore: number;
  firstPlaceCount: number;
  winCount: number;
}

interface GameHistory {
  id: string;
  played_at: string;
  room_id: string;
  buy_in: number;
  final_score: number;
  profit: number;
  rank: number | null;
}

export function StatsScreen({ onBack }: StatsScreenProps) {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [history, setHistory] = useState<GameHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [user?.id]);

  const fetchData = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      // 統計情報を取得
      const statsResponse = await fetch(`${SERVER_URL}/api/stats/${user.id}`);
      if (!statsResponse.ok) throw new Error('統計情報の取得に失敗しました');
      const statsData = await statsResponse.json();
      setStats(statsData);

      // 履歴を取得
      const historyResponse = await fetch(`${SERVER_URL}/api/history/${user.id}?limit=10`);
      if (!historyResponse.ok) throw new Error('履歴の取得に失敗しました');
      const historyData = await historyResponse.json();
      setHistory(historyData);
    } catch (err) {
      console.error('[StatsScreen] Error:', err);
      setError(err instanceof Error ? err.message : '読み込みに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-white text-2xl">読み込み中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-gray-800 rounded-lg p-6">
          <p className="text-red-400 text-center mb-4">{error}</p>
          <button
            onClick={onBack}
            className="w-full py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
          >
            ホームに戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 p-4">
      <div className="max-w-2xl mx-auto">
        {/* ヘッダー */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">戦績・履歴</h1>
          <p className="text-gray-400">{user?.username} さん</p>
        </div>

        {/* 統計情報 */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center">
            <span className="mr-2">📊</span> 総合成績
          </h2>
          
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-gray-700 rounded-lg p-4 text-center">
              <div className="text-gray-400 text-sm mb-1">総プレイ</div>
              <div className="text-2xl font-bold text-white">{stats?.totalGames || 0}回</div>
            </div>
            <div className="bg-gray-700 rounded-lg p-4 text-center">
              <div className="text-gray-400 text-sm mb-1">消費チップ</div>
              <div className="text-2xl font-bold text-red-400">{stats?.totalBuyIn.toLocaleString() || 0}G</div>
            </div>
            <div className="bg-gray-700 rounded-lg p-4 text-center">
              <div className="text-gray-400 text-sm mb-1">総獲得</div>
              <div className="text-2xl font-bold text-yellow-400">{stats?.totalFinalScore.toLocaleString() || 0}G</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-700 rounded-lg p-4 text-center">
              <div className="text-gray-400 text-sm mb-1">1位回数</div>
              <div className="text-2xl font-bold text-purple-400">{stats?.firstPlaceCount || 0}回</div>
            </div>
            <div className="bg-gray-700 rounded-lg p-4 text-center">
              <div className="text-gray-400 text-sm mb-1">勝利数</div>
              <div className="text-2xl font-bold text-green-400">{stats?.winCount || 0}回</div>
            </div>
          </div>
        </div>

        {/* 履歴一覧 */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center">
            <span className="mr-2">📜</span> 最近のゲーム
          </h2>

          {history.length === 0 ? (
            <p className="text-gray-400 text-center py-8">まだゲーム履歴がありません</p>
          ) : (
            <div className="space-y-3">
              {history.map((game) => (
                <div key={game.id} className="bg-gray-700 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-400 text-sm">
                      {formatDate(game.played_at)}
                    </span>
                    {game.rank && (
                      <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                        game.rank === 1 ? 'bg-yellow-600 text-white' :
                        game.rank === 2 ? 'bg-gray-500 text-white' :
                        'bg-orange-800 text-white'
                      }`}>
                        {game.rank}位
                      </span>
                    )}
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-4">
                      <span className="text-gray-400 text-sm">
                        消費: <span className="text-red-400 font-bold">{game.buy_in.toLocaleString()}G</span>
                      </span>
                      <span className="text-gray-400 text-sm">
                        獲得: <span className="text-yellow-400 font-bold">{game.final_score.toLocaleString()}G</span>
                      </span>
                    </div>
                    <span className={`font-bold ${game.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {game.profit >= 0 ? '+' : ''}{game.profit.toLocaleString()}G
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ホームに戻るボタン */}
        <button
          onClick={onBack}
          className="w-full py-4 bg-gray-700 hover:bg-gray-600 text-white font-bold text-xl rounded-lg transition"
        >
          ホームに戻る
        </button>
      </div>
    </div>
  );
}