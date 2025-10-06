// src/components/Hand.tsx
//プレイヤーの手札表示


import React from 'react';
import {isJoker} from '../utils/joker';

type HandProps = {
  playerName: string;
  cards: { suit: string | null; rank: string }[];
  onCardClick: (index: number) => void;
  disabled: boolean;
  wins: number;
  playerScore:number;
  setTurnIndex: number;
};

export default function Hand({ playerName, cards, onCardClick, disabled, wins, playerScore }: HandProps) {
  return (
    <div>
      <h3>{playerName}（勝利数: {wins}）（得点: {playerScore}）</h3>
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
