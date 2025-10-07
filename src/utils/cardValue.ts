//rankToValue関数を配置＝カードのランクを数値に変換する関数
// src/utils/cardValue.ts
import { Card } from './deck';


export function rankToValue(card: Card): number {
  if (!card.rank) return 0;
  if (card.rank === 'JOKER1' || card.rank === 'JOKER2') return 15;
  const order = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  return order.indexOf(card.rank) + 1;
}
