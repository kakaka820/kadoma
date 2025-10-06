// src/utils/joker.ts

import { Card, Player } from './deck';

/**
 * ジョーカーかどうかを判定するユーティリティ関数
 */
export function isJoker(card: Card): boolean {
  return card.rank === 'JOKER1' || card.rank === 'JOKER2';
}

/**
 * カード配列の中にジョーカーが含まれているかを判定
 */
export function hasJoker(cards: Card[]): boolean {
  return cards.some(isJoker);
}

/**
 * プレイヤーの手札にジョーカーが含まれているかを判定
 */
export function checkJokerInHands(players: Player[]): boolean {
  console.log('[checkJokerInHands] プレイヤー数:', players.length);
  
  const result = players.some(player => {
    const playerHasJoker = hasJoker(player.hand);
    console.log(`[checkJokerInHands] ${player.name} の手札:`, player.hand.map(c => c.rank));
    console.log(`[checkJokerInHands] ${player.name} にJOKER:`, playerHasJoker);
    return playerHasJoker;
  });
  
  console.log('[checkJokerInHands] 最終結果:', result);
  return result;
}

/**
 * 場のカードにジョーカーが含まれているかを判定
 */
export function checkJokerInField(fieldCards: (Card | null)[]): boolean {
  const validCards = fieldCards.filter((card): card is Card => card !== null);
  return hasJoker(validCards);
}

/**
 * 任意のカード配列の中にあるジョーカーの数をカウント
 */
export function countJokers(cards: Card[]): number {
  return cards.filter(isJoker).length;
}

/**
 * セット終了時にジョーカーが配られていた場合、山札リセットが必要か判定
 */
export function shouldReshuffleAfterSet(jokerDealtThisSet: boolean): boolean {
  console.log('[shouldReshuffleAfterSet] jokerDealtThisSet:', jokerDealtThisSet);
  return jokerDealtThisSet;
}

/**
 * ゲーム終了条件（全員の手札が空かつジョーカーカウントが10以上）を判定
 */
export function shouldEndGame(allHandsEmpty: boolean, jokerCount: number): boolean {
  return allHandsEmpty && jokerCount >= 10;
}
