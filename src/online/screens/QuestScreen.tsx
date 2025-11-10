// src/online/screens/QuestScreen.tsx
import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface Quest {
  id: string;
  name: string;
  description: string;
  quest_type: string;
  target_value: number;
  reward_amount: number;
  category: string;
  progress: number;
  completed: boolean;
  claimed: boolean;
  next_reset: string | null;
}

interface QuestResponse {
  success: boolean;
  quests: Quest[];
  questsByCategory?: {
    daily: Quest[];
    weekly: Quest[];
    monthly: Quest[];
    achievement: Quest[];
  };
}

export function QuestScreen({ onClose }: { onClose: () => void }) {
  const { user, updateCurrency } = useAuth();
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);

  // クエスト一覧を取得
  const fetchQuests = async () => {
    if (!user) return;

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/quests?userId=${user.id}`
    );
      const data: QuestResponse = await response.json();

      if (data.success) {
        setQuests(data.quests);
      }
    } catch (error) {
      console.error('[QuestScreen] Error fetching quests:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuests();
  }, [user]);

  // 報酬を受け取る
  const handleClaim = async (questId: string) => {
    if (!user || claiming) return;

    setClaiming(questId);

    try {
      const response = await fetch(
         `https://kadoma.onrender.com/api/quests/claim`,
      {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, questId })
        }
      );

      const data = await response.json();

      if (data.success) {
        // 通貨を更新
        updateCurrency(data.newCurrency);
        
        // クエスト一覧を再取得
        await fetchQuests();
        
        // 成功メッセージ
        alert(`${data.reward} チップを獲得しました！`);
      } else {
        alert(data.error || '報酬の受け取りに失敗しました');
      }
    } catch (error) {
      console.error('[QuestScreen] Error claiming reward:', error);
      alert('エラーが発生しました');
    } finally {
      setClaiming(null);
    }
  };

  // 進捗バー
  const ProgressBar = ({ progress, target }: { progress: number; target: number }) => {
    const percentage = Math.min((progress / target) * 100, 100);

    return (
      <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
        <div
          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    );
  };

  // カテゴリー別に分類
  const dailyQuests = quests.filter(q => q.category === 'daily');
  const weeklyQuests = quests.filter(q => q.category === 'weekly');
  const monthlyQuests = quests.filter(q => q.category === 'monthly');
  const achievementQuests = quests.filter(q => q.category === 'achievement');

  // クエストカード
  const QuestCard = ({ quest }: { quest: Quest }) => (
    <div className="bg-gray-800 rounded-lg p-4 mb-3">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h4 className="text-white font-bold">{quest.name}</h4>
          <p className="text-gray-400 text-sm">{quest.description}</p>
        </div>
        <div className="text-right">
          <p className="text-yellow-400 font-bold">{quest.reward_amount} チップ</p>
        </div>
      </div>

      <ProgressBar progress={quest.progress} target={quest.target_value} />

      <div className="flex justify-between items-center">
        <span className="text-gray-500 text-sm">
          {quest.progress} / {quest.target_value}
        </span>

        {quest.completed && !quest.claimed && (
          <button
            onClick={() => handleClaim(quest.id)}
            disabled={claiming === quest.id}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-1 rounded font-bold transition disabled:bg-gray-600"
          >
            {claiming === quest.id ? '受取中...' : '受け取る'}
          </button>
        )}

        {quest.claimed && (
          <span className="text-gray-500 text-sm">✓ 受取済み</span>
        )}

        {!quest.completed && (
          <span className="text-gray-500 text-sm">進行中</span>
        )}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-gray-900 rounded-xl max-w-2xl w-full mx-4 my-8">
        {/* ヘッダー */}
        <div className="flex justify-between items-center p-6 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-white">クエスト</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        {/* コンテンツ */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {loading ? (
            <p className="text-gray-400 text-center">読み込み中...</p>
          ) : (
            <>
              {/* デイリークエスト */}
              {dailyQuests.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-white mb-3">📅 デイリークエスト</h3>
                  {dailyQuests.map(quest => (
                    <QuestCard key={quest.id} quest={quest} />
                  ))}
                </div>
              )}

              {/* ウィークリークエスト */}
              {weeklyQuests.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-white mb-3">📆 ウィークリークエスト</h3>
                  {weeklyQuests.map(quest => (
                    <QuestCard key={quest.id} quest={quest} />
                  ))}
                </div>
              )}

              {/* マンスリークエスト */}
              {monthlyQuests.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-white mb-3">📊 マンスリークエスト</h3>
                  {monthlyQuests.map(quest => (
                    <QuestCard key={quest.id} quest={quest} />
                  ))}
                </div>
              )}

              {/* アチーブメント */}
              {achievementQuests.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-white mb-3">🏆 アチーブメント</h3>
                  {achievementQuests.map(quest => (
                    <QuestCard key={quest.id} quest={quest} />
                  ))}
                </div>
              )}

              {quests.length === 0 && (
                <p className="text-gray-400 text-center">クエストがありません</p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}