// src/components/Hand.tsx
import React from 'react';

type HandProps = {
  playerName: string;
  cards: { suit: string | null; rank: string }[];
  onCardClick: (index: number) => void;
  disabled: boolean;
  wins: number;
};

export default function Hand({ playerName, cards, onCardClick, disabled, wins }: HandProps) {
  return (
    <div>
      <h3>{playerName}（勝利数: {wins}）</h3>
      <div style={{ display: 'flex', gap: '8px' }}>
        {cards.map((card, idx) => (
          <div
            key={idx}
            onClick={() => !disabled && onCardClick(idx)}
            style={{
              padding: '8px',
              border: '1px solid black',
              minWidth: '40px',
              textAlign: 'center',
              cursor: disabled ? 'not-allowed' : 'pointer',
              userSelect: 'none',
              opacity: disabled ? 0.5 : 1,
            }}
          >
            {card.suit ? `${card.rank}${card.suit}` : card.rank}
          </div>
        ))}
      </div>
    </div>
  );
}
