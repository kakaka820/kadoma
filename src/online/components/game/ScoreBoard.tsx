// src/online/components/game/ScoreBoard.tsx
// スコアボード表示

import { OpponentCard } from '../../hooks/useOnlineGameState';

interface ScoreBoardProps {
  players: string[];
  scores: number[];
  wins: number[];
  playerIndex: number | null;
  playerSelections: boolean[];
  opponentHands: OpponentCard[][];
}

export function ScoreBoard({
  players,
  scores,
  wins,
  playerIndex,
  playerSelections,
  opponentHands,
}: ScoreBoardProps) {
  return (
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
            
            {/* 他プレイヤーの手札表示 */}
            {idx !== playerIndex && opponentHands[idx] && (
              <div className="mt-2">
                <div className="text-xs mb-1">手札:</div>
                <div className="flex gap-1 flex-wrap">
                  {opponentHands[idx].map((card, cardIdx) => (
                    <div
                      key={cardIdx}
                      className="px-2 py-1 text-xs border border-gray-500 rounded"
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
              </div>
            )}
            
            {playerSelections[idx] && (
              <div className="text-sm mt-1">（選択済み）</div>
            )}
            <div>スコア: {scores[idx]}</div>
            <div>勝利数: {wins[idx]}</div>
            {idx === playerIndex && (
              <div className="text-sm mt-1">（あなた）</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}