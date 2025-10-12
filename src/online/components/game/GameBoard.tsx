// src/online/components/game/GameBoard.tsx
// メインゲーム画面（レイアウトのみ）

import Hand from './Hand';
import Field from './Field';
import { ScoreBoard } from './ScoreBoard';
import { DebugInfo } from './DebugInfo';
import { NotificationPanel } from '../ui/NotificationPanel';
import { Warning } from '../../hooks/useWarnings';
import { OpponentCard } from '../../hooks/useOnlineGameState';

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
  opponentHands: OpponentCard[][];
  timeRemaining: number;
  timeLimit: number;
  disconnectNotification: {
    playerIndex: number;
    playerName: string;
    type: 'disconnected' | 'reconnected';
  } | null;
}

export function GameBoard(props: GameBoardProps) {
  const {
    playerIndex,
    fieldCards,
    roundResult,
    myHand,
    playCard,
    playerSelections,
    warnings,
    removeWarning,
    disconnectNotification,
  } = props;

  return (
    <>
      {/* 通知パネル */}
      <NotificationPanel
        warnings={warnings}
        removeWarning={removeWarning}
        disconnectNotification={disconnectNotification}
      />

      <div className="min-h-screen bg-gray-900 text-white p-8">
        {/* デバッグ情報 */}
        <DebugInfo {...props} />

        {/* スコアボード */}
        <ScoreBoard
          players={props.players}
          scores={props.scores}
          wins={props.wins}
          playerIndex={playerIndex}
          playerSelections={playerSelections}
          opponentHands={props.opponentHands}
        />

        {/* 場札 */}
        <div className="mb-8">
          <h2 className="text-2xl mb-4">場札</h2>
          <Field fieldCards={fieldCards} />
        </div>

        {/* ラウンド結果 */}
        {roundResult && (
          <div className="mb-8 p-4 bg-yellow-600 rounded text-center text-xl">
            {roundResult}
          </div>
        )}

        {/* 手札 */}
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