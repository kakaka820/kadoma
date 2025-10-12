// src/online/components/ui/NotificationPanel.tsx
// 警告・通知パネル（右上固定）

import { Warning } from '../../hooks/useWarnings';

interface NotificationPanelProps {
  warnings: Warning[];
  removeWarning: (id: string) => void;
  disconnectNotification: {
    playerIndex: number;
    playerName: string;
    type: 'disconnected' | 'reconnected';
  } | null;
}

export function NotificationPanel({
  warnings,
  removeWarning,
  disconnectNotification,
}: NotificationPanelProps) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {/* 警告メッセージ */}
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

      {/* 切断・復帰通知 */}
      {disconnectNotification && (
        <div
          className={`p-4 rounded-lg shadow-lg transition-all ${
            disconnectNotification.type === 'disconnected'
              ? 'bg-red-600'
              : 'bg-green-600'
          }`}
        >
          <div className="font-bold text-lg">
            {disconnectNotification.type === 'disconnected'
              ? `⚠️ ${disconnectNotification.playerName} が切断しました`
              : `✅ ${disconnectNotification.playerName} が復帰しました`}
          </div>
          <div className="text-xs mt-1 opacity-75">
            {disconnectNotification.type === 'disconnected'
              ? 'Botが代わりにプレイします'
              : 'ゲームに復帰しました'}
          </div>
        </div>
      )}
    </div>
  );
}