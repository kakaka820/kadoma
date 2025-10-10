// src/online/components/Field.tsx
import React from 'react';
import { Card } from '../types/game';

interface FieldProps {
  fieldCards: (Card | null)[];
}

export default function Field({ fieldCards }: FieldProps) {
  return (
    <div>
      <div style={{ display: 'flex', gap: '8px' }}>
        {(fieldCards ?? []).map((card, idx) => (
          card ? (
            <div
              key={idx}
              style={{
                padding: '8px',
                border: '1px solid gray',
                minWidth: '40px',
                textAlign: 'center',
              }}
            >
              {card.suit ? `${card.rank}${card.suit}` : card.rank} (P{idx + 1})
            </div>
          ) : null
        ))}
      </div>
    </div>
  );
}