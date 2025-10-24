// src/online/components/game/GameBoard.tsx
// テーブル背景を使ったゲーム画面

import Hand from './Hand';
import Field from './Field';
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
  selectedCardIndex?: number | null;
  isShowdown?: boolean;
}

export function GameBoard(props: GameBoardProps) {
  const {
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
    removeWarning,
    opponentHands,
    timeRemaining,
    disconnectNotification,
    selectedCardIndex,
    isShowdown,
  } = props;

  // 自分以外のプレイヤー（対戦相手2人）
  const opponents = players
    .map((name, idx) => ({ name, idx }))
    .filter(p => p.idx !== playerIndex);

  return (
    <>
      {/* 通知パネル（右上固定） */}
      <NotificationPanel
        warnings={warnings}
        removeWarning={removeWarning}
        disconnectNotification={disconnectNotification}
      />

      {/* ゲームボード: 背景画像あり */}
      <div 
        className="h-screen w-screen overflow-hidden relative"
        style={{
          backgroundImage: 'https://github.com/kakaka820/kadoma/blob/main/public/assets/backgrounds/%E5%AF%BE%E6%88%A6%E7%94%BB%E9%9D%A2%E8%83%8C%E6%99%AF.png', 
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* 左上: 対戦相手1の情報 */}
        {opponents[0] && (
          <div className="absolute top-4 left-4 bg-gray-800/90 backdrop-blur-sm rounded-lg p-3 text-white text-sm">
            <div className="font-bold mb-1">{opponents[0].name}</div>
            <div className="text-xs">スコア: {scores[opponents[0].idx]}</div>
            <div className="text-xs">勝利: {wins[opponents[0].idx]}</div>
            {playerSelections[opponents[0].idx] && (
              <div className="text-xs text-green-400 mt-1">✓ 選択済み</div>
            )}
          </div>
        )}

        {/* 左上下: 対戦相手1の手札 */}
        {opponents[0] && opponentHands[opponents[0].idx] && (
          <div className="absolute top-32 left-8 flex flex-col gap-2">
            {opponentHands[opponents[0].idx].map((card, cardIdx) => (
              <div
                key={cardIdx}
                className="w-12 h-16 bg-gray-700 rounded shadow-lg flex items-center justify-center text-xs text-white border border-gray-600"
              >
                {card.visible ? (
                  <span className="text-yellow-300">
                    {card.suit ? `${card.rank}${card.suit}` : card.rank}
                  </span>
                ) : (
                  <span>🂠</span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 右上: 対戦相手2の情報 */}
        {opponents[1] && (
          <div className="absolute top-4 right-4 bg-gray-800/90 backdrop-blur-sm rounded-lg p-3 text-white text-sm">
            <div className="font-bold mb-1">{opponents[1].name}</div>
            <div className="text-xs">スコア: {scores[opponents[1].idx]}</div>
            <div className="text-xs">勝利: {wins[opponents[1].idx]}</div>
            {playerSelections[opponents[1].idx] && (
              <div className="text-xs text-green-400 mt-1">✓ 選択済み</div>
            )}
          </div>
        )}

        {/* 右上下: 対戦相手2の手札 */}
        {opponents[1] && opponentHands[opponents[1].idx] && (
          <div className="absolute top-32 right-8 flex flex-col gap-2">
            {opponentHands[opponents[1].idx].map((card, cardIdx) => (
              <div
                key={cardIdx}
                className="w-12 h-16 bg-gray-700 rounded shadow-lg flex items-center justify-center text-xs text-white border border-gray-600"
              >
                {card.visible ? (
                  <span className="text-yellow-300">
                    {card.suit ? `${card.rank}${card.suit}` : card.rank}
                  </span>
                ) : (
                  <span>🂠</span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 中央上: ゲーム情報 */}
        <div className="absolute top-8 left-1/2 transform -translate-x-1/2 bg-gray-900/80 backdrop-blur-sm rounded-lg px-6 py-3 text-white">
          <div className="flex gap-6 text-sm">
            <div>倍率: <span className="font-bold text-yellow-400">×{currentMultiplier}</span></div>
            <div>セット: <span className="font-bold">{setTurnIndex + 1}/5</span></div>
            <div className={timeRemaining <= 3 ? 'text-red-400 font-bold' : ''}>
              ⏱️ 残り: {timeRemaining}秒
            </div>
          </div>
        </div>

        {/* 中央: 場札 */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          {/* ラウンド結果（場札の上にオーバーレイ） */}
          {roundResult && (
            <div className="absolute -top-20 left-1/2 transform -translate-x-1/2 bg-yellow-600 text-white px-6 py-3 rounded-lg font-bold text-lg shadow-lg z-10 whitespace-nowrap">
              {roundResult}
            </div>
          )}

          {/* 場札 */}
          <div className="flex gap-4">
            {fieldCards.map((card, idx) =>
              card ? (
                <div
                  key={idx}
                  className="w-24 h-32 bg-white rounded-lg shadow-2xl flex items-center justify-center text-gray-900 font-bold text-3xl border-2 border-gray-300"
                >
                  {card.suit ? `${card.rank}${card.suit}` : card.rank}
                </div>
              ) : (
                <div
                  key={idx}
                  className="w-24 h-32 bg-gray-700/50 rounded-lg border-2 border-dashed border-gray-500"
                />
              )
            )}
          </div>
        </div>

        {/* 下部: 自分の手札 */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
          <Hand
            cards={myHand}
            onCardClick={playCard}
            disabled={playerIndex === null || playerSelections[playerIndex || 0]}
            selectedCardIndex={selectedCardIndex}
            isShowdown={isShowdown}
          />
          
          {/* 選択メッセージ */}
          <div className="text-center mt-3">
            {playerIndex !== null && playerSelections[playerIndex] ? (
              <div className="text-green-400 font-bold bg-gray-900/80 backdrop-blur-sm rounded-lg px-4 py-2 inline-block">
                ✓ 選択済み - 他のプレイヤーを待っています
              </div>
            ) : (
              <div className="text-yellow-400 font-bold bg-gray-900/80 backdrop-blur-sm rounded-lg px-4 py-2 inline-block">
                カードを選択してください
              </div>
            )}
          </div>
        </div>

        {/* 左下: 自分の情報 */}
        <div className="absolute bottom-8 left-8 bg-blue-700/90 backdrop-blur-sm rounded-lg p-3 text-white text-sm">
          <div className="font-bold mb-1">{players[playerIndex || 0]} (あなた)</div>
          <div className="text-xs">スコア: {scores[playerIndex || 0]}</div>
          <div className="text-xs">勝利: {wins[playerIndex || 0]}</div>
        </div>
      </div>
    </>
  );
}