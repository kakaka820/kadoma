// src/utils/joker.ts

import { Card, Player } from './deck';
import { MAX_JOKER_COUNT, MIN_POINTS } from '../config';

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
 * JOKERが出せるかどうかを判定
 * @param card - 判定するカード
 * @param setTurnIndex - 現在のセット内ターン（0~4）
 * @returns 出せる場合true
 */
export function canPlayJoker(card: Card, setTurnIndex: number): boolean {
  // JOKERでない場合は常に出せる
  if (!isJoker(card)) {
    return true;
  }
  
  // JOKERの場合、セットの1ターン目（setTurnIndex === 0）は出せない
  return setTurnIndex !== 0;
}

/**
 * プレイヤーの得点が0以下かどうかチェック
 */
export function hasPlayerBelowMinPoints(players: Player[]): boolean {
  return players.some(player => player.points <= MIN_POINTS);
}

/**
 * ゲーム終了条件を判定
 * @param allHandsEmpty - 全員の手札が空かどうか
 * @param jokerCount - JOKERカウント
 * @param players - プレイヤー配列
 * @returns 終了条件と理由
 */
export function checkGameEnd(
  allHandsEmpty: boolean,
  jokerCount: number,
  players: Player[]
): { shouldEnd: boolean; reason?: string } {
  // 条件1: 誰かの得点が0以下
  if (hasPlayerBelowMinPoints(players)) {
    const bankruptPlayer = players.find(p => p.points <= MIN_POINTS);
    return {
      shouldEnd: true,
      reason: `${bankruptPlayer?.name}の得点が${MIN_POINTS}以下になりました`
    };
  }

  // 条件2: 全員の手札が空 かつ JOKERが規定回数以上出た
  if (allHandsEmpty && jokerCount >= MAX_JOKER_COUNT) {
    return {
      shouldEnd: true,
      reason: `JOKERが${MAX_JOKER_COUNT}回出ました`
    };
  }

  return { shouldEnd: false };
}

