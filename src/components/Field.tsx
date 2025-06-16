import React from 'react';

// 型定義（必要に応じて共通化可能）
type Card = {
  suit: string | null;
  rank: string;
  playerIndex?: number;
};

type FieldProps = {
  fieldCards?: Card[];  // undefined を許容
};

export default function Field({ fieldCards }: FieldProps) {
  return (
    <div>
      {/* ↓ エラーの原因だった部分を削除 */}
      {/* <h2>場のカード（{fieldCards.length}枚）</h2> */}
      
      <div style={{ display: 'flex', gap: '8px' }}>
        {(fieldCards ?? []).map((card, idx) => (
          <div
            key={idx}
            style={{
              padding: '8px',
              border: '1px solid gray',
              minWidth: '40px',
              textAlign: 'center',
            }}
          >
            {card.suit ? `${card.rank}${card.suit}` : card.rank} (P{card.playerIndex! + 1})
          </div>
        ))}
      </div>
    </div>
  );
}
