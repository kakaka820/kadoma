// src/online/components/GameBoard.tsx
// メインゲーム画面、スコアボード、場、手札の表示管理、デバッグ情報の表示担当

import Hand from './Hand';
import Field from './Field';
import { Warning } from '../hooks/useWarnings';


interface GameBoardProps {
  isConnected: boolean;
  playerIndex: number | null;
  currentMultiplier: number;
  setTurnIndex: number;
  playerSelections: boolean[];
  players: string[];
  scores: number[];
  wins: number[];
  fieldCards: (any | null)[];
  roundResult: string | null;
  myHand: any[];
  playCard: (cardIndex: number) => void;
  warnings: Warning[];
  removeWarning: (id: string) => void; 
}

export function GameBoard({
  isConnected,
  playerIndex,
  currentMultiplier,
  setTurnIndex,
  playerSelections,
  players,
  scores,
  wins,
  fieldCards,
  roundResult,
  myHand,
  playCard,
  warnings,
  removeWarning
}: GameBoardProps) {
  return (
    <>
    {/* 警告表示（右上固定） */}
<div className="fixed top-4 right-4 z-50 space-y-2">
  {warnings.map((warning) => (
    <div
      key={warning.id}
      onClick={() => removeWarning(warning.id)}
      className={`p-4 rounded-lg shadow-lg cursor-pointer transition-all hover:opacity-80 ${
        warning.type === 'joker_dealt' ? 'bg-purple-600' : 'bg-orange-600'
      }`}
    >
      <div className="font-bold text-lg">{warning.message}</div>
      <div className="text-xs mt-1 opacity-75">クリックで閉じる</div>
    </div>
  ))}
</div>
    <div className="min-h-screen bg-gray-900 text-white p-8">
      {/* デバッグ情報 */}
      <div className="mb-4 p-4 bg-gray-800 rounded">
        <div className="text-sm">
          <div>接続状態: {isConnected ? '✅ 接続中' : '❌ 切断'}</div>
          <div>あなた: Player {playerIndex !== null ? playerIndex + 1 : '?'}</div>
          <div>倍率: ×{currentMultiplier}</div>
          <div>セットターン: {setTurnIndex + 1}/5</div>
          <div>選択状況: {playerSelections.filter(Boolean).length}/3 人選択済み</div>
        </div>
      </div>

      {/* スコア表示 */}
      <div className="mb-8">
        <h2 className="text-2xl mb-4">スコアボード</h2>
        <div className="grid grid-cols-3 gap-4">
          {players.map((name, idx) => (
            <div
              key={idx}
              className={`p-4 rounded ${
                idx === playerIndex
                  ? 'bg-blue-600'
                  : playerSelections[idx]
                  ? 'bg-green-600'
                  : 'bg-gray-700'
              }`}
            >
              <div className="font-bold">{name}</div>
              <div>スコア: {scores[idx]}</div>
              <div>勝利数: {wins[idx]}</div>
              {idx === playerIndex && <div className="text-sm mt-1">（あなた）</div>}
              {playerSelections[idx] && <div className="text-sm mt-1">（選択済み）</div>}
            </div>
          ))}
        </div>
      </div>

      {/* 場札表示 */}
      <div className="mb-8">
        <h2 className="text-2xl mb-4">場札</h2>
        <Field fieldCards={fieldCards}/>
      </div>

      {/* ラウンド結果 */}
      {roundResult && (
        <div className="mb-8 p-4 bg-yellow-600 rounded text-center text-xl">
          {roundResult}
        </div>
      )}

      {/* 手札表示 */}
      <div>
        <h2 className="text-2xl mb-4">あなたの手札</h2>
        <Hand
          cards={myHand}
          onCardClick={playCard}
          disabled={playerIndex === null || playerSelections[playerIndex || 0]}
        />
        {playerIndex !== null && playerSelections[playerIndex] ? (
          <div className="text-center mt-4 text-green-400">
            選択済み - 他のプレイヤーを待っています
          </div>
        ) : (
          <div className="text-center mt-4 text-yellow-400">
            カードを選択してください
          </div>
        )}
      </div>
    </div>
    </>
  );
}
