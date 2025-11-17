// src/online/components/ui/RulesModal.tsx
import React, { useState } from 'react';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type RuleTab = 'basic' | 'card' | 'scoring' | 'joker';

export function RulesModal({ isOpen, onClose }: RulesModalProps) {
  const [activeTab, setActiveTab] = useState<RuleTab>('basic');

  if (!isOpen) return null;

  const tabs = [
    { id: 'basic' as RuleTab, label: '基本ルール' },
    { id: 'card' as RuleTab, label: 'カードの出し方' },
    { id: 'scoring' as RuleTab, label: '得点計算' },
    { id: 'joker' as RuleTab, label: 'JOKER' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-75">
      <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-white">ゲームルール</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-3xl leading-none"
          >
            ×
          </button>
        </div>

        {/* タブ */}
        <div className="flex border-b border-gray-700 bg-gray-900">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex-1 px-4 py-3 text-sm font-medium transition
                ${activeTab === tab.id
                  ? 'text-purple-400 border-b-2 border-purple-400 bg-gray-800'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* コンテンツ */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'basic' && <BasicRules />}
          {activeTab === 'card' && <CardRules />}
          {activeTab === 'scoring' && <ScoringRules />}
          {activeTab === 'joker' && <JokerRules />}
        </div>

        {/* フッター */}
        <div className="p-4 border-t border-gray-700">
          <button
            onClick={onClose}
            className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}

// 基本ルール
function BasicRules() {
  return (
    <div className="space-y-4 text-gray-300">
      <h3 className="text-xl font-bold text-white mb-4">基本ルール</h3>
      
      <section>
        <h4 className="font-bold text-white mb-2">🎯 ゲームの目的</h4>
        <p>各ラウンドで最も高い数字のカードを出して勝利し、最終的に最も多くの得点を獲得することを目指します。</p>
      </section>

      <section>
        <h4 className="font-bold text-white mb-2">👥 プレイ人数</h4>
        <p>3〜4人で遊ぶことができます。</p>
      </section>

      <section>
        <h4 className="font-bold text-white mb-2">🎴 ゲームの流れ</h4>
        <ol className="list-decimal list-inside space-y-2 ml-2">
          <li>各プレイヤーに手札が配られます</li>
          <li>ターン順に1枚ずつカードを出します</li>
          <li>全員がカードを出したら、最も高い数字を出したプレイヤーが勝利</li>
          <li>これを繰り返し、最終的な得点で勝敗が決まります</li>
        </ol>
      </section>
    </div>
  );
}

// カードの出し方
function CardRules() {
  return (
    <div className="space-y-4 text-gray-300">
      <h3 className="text-xl font-bold text-white mb-4">カードの出し方</h3>
      
      <section>
        <h4 className="font-bold text-white mb-2">📋 基本</h4>
        <p>自分のターンになったら、手札から1枚選んでカードを出します。</p>
      </section>

      <section>
        <h4 className="font-bold text-white mb-2">🔢 カードの強さ</h4>
        <p className="mb-2">数字が大きいほど強いです：</p>
        <div className="bg-gray-900 p-3 rounded">
          <p className="font-mono">A(1) &lt; 2 &lt; 3 &lt; ... &lt; 10 &lt; J(11) &lt; Q(12) &lt; K(13)</p>
        </div>
      </section>

      <section>
        <h4 className="font-bold text-white mb-2">⏱️ 制限時間</h4>
        <p>各ターンには制限時間があります。時間内にカードを選択してください。</p>
      </section>

      <section>
        <h4 className="font-bold text-white mb-2">⚠️ 注意点</h4>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>一度出したカードは取り消せません</li>
          <li>制限時間を過ぎると自動的にカードが選択されます</li>
        </ul>
      </section>
    </div>
  );
}

// 得点計算
function ScoringRules() {
  return (
    <div className="space-y-4 text-gray-300">
      <h3 className="text-xl font-bold text-white mb-4">得点計算</h3>
      
      <section>
        <h4 className="font-bold text-white mb-2">💰 場代（アンティ）</h4>
        <p>ゲーム開始時に、各プレイヤーは場代を支払います。これが賞金プールになります。</p>
      </section>

      <section>
        <h4 className="font-bold text-white mb-2">🏆 ラウンド勝利</h4>
        <p className="mb-2">各ラウンドで最も高いカードを出したプレイヤーが勝利し、得点を獲得します。</p>
        <div className="bg-gray-900 p-3 rounded">
          <p className="font-mono">基本得点 × 倍率 = 獲得得点</p>
        </div>
      </section>

      <section>
        <h4 className="font-bold text-white mb-2">📈 倍率システム</h4>
        <p>連続で勝利すると倍率が上がり、より多くの得点を獲得できます。</p>
      </section>

      <section>
        <h4 className="font-bold text-white mb-2">🎯 最終得点</h4>
        <p>すべてのラウンドが終了した時点で、最も多くの得点を持っているプレイヤーが優勝です。</p>
      </section>
    </div>
  );
}

// JOKER
function JokerRules() {
  return (
    <div className="space-y-4 text-gray-300">
      <h3 className="text-xl font-bold text-white mb-4">JOKER</h3>
      
      <section>
        <h4 className="font-bold text-white mb-2">🃏 JOKERとは</h4>
        <p>JOKERは最強のカードで、どんなカードにも勝つことができます。</p>
      </section>

      <section>
        <h4 className="font-bold text-white mb-2">✨ JOKERの効果</h4>
        <ul className="list-disc list-inside space-y-2 ml-2">
          <li>必ずそのラウンドに勝利できます</li>
          <li>相手のJOKERには勝てません（引き分け）</li>
          <li>使用回数に制限があります</li>
        </ul>
      </section>

      <section>
        <h4 className="font-bold text-white mb-2">🔢 使用回数</h4>
        <p>各ゲームでJOKERを使用できる回数は部屋の設定によって異なります。使いすぎに注意してください。</p>
      </section>

      <section>
        <h4 className="font-bold text-white mb-2">💡 戦略のヒント</h4>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>重要な場面でJOKERを使いましょう</li>
          <li>相手がJOKERを使い切ったタイミングを狙いましょう</li>
          <li>倍率が高い時に使うと効果的です</li>
        </ul>
      </section>
    </div>
  );
}