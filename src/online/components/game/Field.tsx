// src/online/components/Field.tsx
import React from 'react';
import { Card } from '../../types/game';

interface FieldProps {
  fieldCards: (Card | null)[];
  playerNames: string[];
  playerIndex: number;
}

export default function Field({ fieldCards, playerNames, playerIndex }: FieldProps) {
  const opponentIndices = [0, 1, 2].filter(idx => idx !== playerIndex);
  const displayOrder = [opponentIndices[0], playerIndex, opponentIndices[1]];

  return (
    <div className="flex justify-center gap-4">
      {displayOrder.map((pIdx) => {
        const card = fieldCards[pIdx];
        const playerName = playerNames[pIdx];
        
        return (
          <div key={pIdx} className="flex flex-col items-center">
            <p className="text-white text-sm mb-2 font-bold">
              {playerName}
            </p>
            {card ? (
              <div className="w-24 h-32 bg-white rounded-lg shadow-2xl flex items-center justify-center text-gray-900 font-bold text-3xl border-2 border-gray-300">
                {card.suit ? `${card.rank}${card.suit}` : card.rank}
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