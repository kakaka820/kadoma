// src/components/Hand.tsx
//プレイヤーの手札表示


import React from 'react';
import { isJoker } from '../utils/joker';
import { HandProps } from '../types/game';



export default function Hand({ playerName, cards, onCardClick, disabled, wins, playerScore }: HandProps) {
  return (
    <div className="mb-6">
      <h3 className="text-lg font-bold text-white mb-2">{playerName}（勝利数: {wins}）（得点: {playerScore}）</h3>
      <div className="flex gap-2 flex-wrap">
        {cards.map((card, idx) => (
          <div
            key={idx}
            onClick={() => !disabled && onCardClick(idx)}
            className={`
              px-4 py-2 min-w-[60px] text-center rounded
              border-2 select-none transition
              ${disabled 
                ? 'border-gray-600 bg-gray-700 text-gray-400 cursor-not-allowed opacity-50' 
                : 'border-gray-400 bg-white text-gray-900 cursor-pointer hover:bg-gray-100 hover:border-gray-500'
              }
            `}
          >
            {card.suit ? `${card.rank}${card.suit}` : card.rank}
          </div>
        ))}
      </div>
    </div>
  );
}
