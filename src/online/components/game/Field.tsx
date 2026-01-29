// src/online/components/Field.tsx
import React from 'react';
import { Card } from '../../types/game';
import { RoundResultData } from '../../hooks/useRoundJudge';

interface FieldProps {
  fieldCards: (Card | null)[];
  playerNames: string[];
  playerIndex: number;
  playerSelections: boolean[]; //選択状態を受け取る
  roundResult: RoundResultData | null;
}

export default function Field({ fieldCards, playerNames, playerIndex, playerSelections, roundResult }: FieldProps) {
  const opponentIndices = [0, 1, 2].filter(idx => idx !== playerIndex);
  const displayOrder = [opponentIndices[0], playerIndex, opponentIndices[1]];

  return (
    <div className="flex justify-center gap-4">
      {displayOrder.map((pIdx) => {
        const card = fieldCards[pIdx];
        const playerName = playerNames[pIdx];
        const isSelected = playerSelections[pIdx];
        // 勝敗判定
        const isWinner = roundResult && roundResult.winnerIndex === pIdx;
        const isLoser = roundResult && roundResult.loserIndex === pIdx;
        
        return (
          <div key={pIdx} className="flex flex-col items-center">
            <p className="text-white text-sm mb-2 font-bold">
              {playerName}
            </p>
            {card ? (
              <div className={`w-24 h-32 bg-white rounded-lg shadow-2xl flex items-center justify-center text-gray-900 font-bold text-3xl border-2 border-gray-300 relative ${isWinner ? 'winner-card' : ''} ${isLoser ? 'loser-card' : ''}`}>
                {isWinner && <div className="absolute -top-6 text-4xl animate-bounce">👑</div>}             
                {card.suit ? `${card.rank}${card.suit}` : card.rank}
              </div>
              ) : isSelected ? (
              <div className="w-24 h-32 bg-blue-900 rounded-lg shadow-2xl flex items-center justify-center text-5xl text-white border-2 border-blue-400">
                <span>🂠</span>
              </div>
            ) : (
              <div className="w-24 h-32 bg-gray-700/50 rounded-lg border-2 border-dashed border-gray-500" />
            )}
          </div>
        );
      })}
    </div>
  );
}