// src/online/components/game/Hand.tsx
// オンライン版：自分の手札表示用コンポーネント

import React from 'react';
import { Card } from '../../types/game';


interface HandProps {
  cards: Card[];
  onCardClick: (index: number) => void;
  disabled: boolean;
  selectedCardIndex?: number | null;
  isShowdown?: boolean;
  isDealing?: boolean;
}

export default function Hand({ cards, onCardClick, disabled, selectedCardIndex, isShowdown = false, isDealing = false }: HandProps) {
  return (
    <div>
      <div className="flex gap-3 justify-center">
        {cards.map((card, idx) => (
          <div
            key={idx}
            onClick={() => !disabled && onCardClick(idx)}
          className={`
            relative rounded-lg border-2 transition-all select-none
            w-[12vw] h-[14vh]
            max-w-[90px] max-h-[120px]
            min-w-[65px] min-h-[90px]
            flex items-center justify-center
            ${disabled 
              ? 'border-gray-600 bg-gray-700 opacity-50 cursor-not-allowed' 
              : 'border-gray-400 bg-white cursor-pointer hover:border-yellow-400 hover:-translate-y-2 hover:shadow-lg'
            }
            ${(isShowdown && selectedCardIndex === idx) ? 'invisible' : 'visible'}


            ${isDealing ? 'card-deal-animation' : ''}


          `}
          style={{
              animationDelay: isDealing ? `${idx * 0.1}s` : '0s'}}

          >
            <span className="text-2xl font-bold text-gray-900">
            {card.suit ? (
              <>
                {card.rank}
                <span className="ml-0.5">{card.suit}</span>
              </>
            ) : (
              card.rank
            )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
