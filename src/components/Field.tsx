//場に出されたカード


import React from 'react';

// 型定義（必要に応じて共通化可能）
type Card = {
  suit: string | null;
  rank: string;
  playerIndex?: number;
};

type FieldProps = {
  fieldCards:(Card | null)[];  // null を許容
};

export default function Field({ fieldCards }: FieldProps) {
  return (
    <div>
      {/* ↓ エラーの原因だった部分を削除 */}
      {/* <h2>場のカード（{fieldCards.length}枚）</h2> */}
      
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
            {card.suit ? `${card.rank}${card.suit}` : card.rank} (P{idx +1 })
          </div>
        ) : null
        ))}
      </div>
    </div>
  );
}
