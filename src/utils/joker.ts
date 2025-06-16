// utils/joker.ts

import { Card, Player } from './deck';

/**
 * ジョーカーかどうかを判定するユーティリティ関数
 */
export function isJoker(card: Card): boolean {
  return card.rank === 'JOKER1' || card.rank === 'JOKER2';
}

/**
 * 初期配布時にジョーカーが含まれているかを判定
 */
export function checkJokerDealt(players: Player[]): boolean {
  const allCards = players.flatMap(p => p.hand);
  return allCards.some(isJoker);
}

/**
 * 任意のカード配列の中にあるジョーカーの数をカウント
 */
export function countJokers(cards: Card[]): number {
  return cards.filter(isJoker).length;
}



/**
 * セット終了時にジョーカーが出ていたかどうかに応じて、山札リセットが必要か判定
 */
export function shouldReshuffleAfterSet(jokerThisSet: boolean): boolean {
  return jokerThisSet;
}

/**
 * ゲーム終了条件（全員の手札が空かつジョーカー10枚以上）を判定
 */
export function shouldEndGame(allHandsEmpty: boolean, jokerCount: number): boolean {
  return allHandsEmpty && jokerCount >= 10;
}
