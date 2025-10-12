// src/online/components/game/DebugInfo.tsx
// デバッグ情報表示

import { TurnTimer } from '../ui/TurnTimer';

interface DebugInfoProps {
  isConnected: boolean;
  playerIndex: number | null;
  currentMultiplier: number;
  setTurnIndex: number;
  playerSelections: boolean[];
  timeRemaining: number;
  timeLimit: number;
}

export function DebugInfo({
  isConnected,
  playerIndex,
  currentMultiplier,
  setTurnIndex,
  playerSelections,
  timeRemaining,
  timeLimit,
}: DebugInfoProps) {
  return (
    <div className="mb-4 p-4 bg-gray-800 rounded">
      <div className="text-sm space-y-1">
        <div>接続状態: {isConnected ? '✅ 接続中' : '❌ 切断'}</div>
        <div>あなた: Player {playerIndex !== null ? playerIndex + 1 : '?'}</div>
        <div>倍率: ×{currentMultiplier}</div>
        <div>セットターン: {setTurnIndex + 1}/5</div>
        <div>選択状況: {playerSelections.filter(Boolean).length}/3 人選択済み</div>
        <TurnTimer timeRemaining={timeRemaining} timeLimit={timeLimit} />
      </div>
    </div>
  );
}