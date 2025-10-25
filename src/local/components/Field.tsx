//場に出されたカード


import React from 'react';
import { FieldProps } from '../types/game';



export default function Field({ fieldCards }: FieldProps) {
  return (
    <div className="mt-8">
      {/* ↓ エラーの原因だった部分を削除 */}
      {/* <h2>場のカード（{fieldCards.length}枚）</h2> */}
      
      <div className="flex gap-2 flex-wrap">
        {(fieldCards ?? []).map((card, idx) => (
          card ? (
          <div
              key={idx}
              className="px-4 py-2 min-w-[60px] text-center rounded border-2 border-yellow-400 bg-yellow-50 text-gray-900"
          >
            {card.suit ? `${card.rank}${card.suit}` : card.rank} (P{idx +1 })
          </div>
        ) : null
        ))}
      </div>
    </div>
  );
}
