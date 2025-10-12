// src/online/components/Hand.tsx
// オンライン版：自分の手札表示用コンポーネント

import React from 'react';
import { Card } from '../../types/game';

interface HandProps {
  cards: Card[];
  onCardClick: (index: number) => void;
  disabled: boolean;
}

export default function Hand({ cards, onCardClick, disabled }: HandProps) {
  return (
    <div>
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
