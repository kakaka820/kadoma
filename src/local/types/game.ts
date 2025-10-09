//src/local/types/game.ts
//ゲーム全体でつかう方定義を集約（型の共通化）
// ゲーム全体で使う型定義を集約（ゲームロジック用の型に特化）

import { Card, Player } from '../utils/deck';

/**
 * プレイヤーのインデックス情報を持つカード
 */
export interface CardWithIndex extends Card {
  playerIndex: number;
}

/**
 * ラウンドの勝敗判定結果
 */
export interface JudgeResult {
  winnerIndexes: number[];
  isDraw: boolean;
  isReverse: boolean;
  originalWinnerIndex?: number;
}
/**
 * Field コンポーネントの Props
 */
export interface FieldProps {
  fieldCards: (Card | null)[];
}
/**
 * Hand コンポーネントの Props
 */
export interface HandProps {
  playerName: string;
  cards: Card[];
  onCardClick: (index: number) => void;
  disabled: boolean;
  wins: number;
  playerScore: number;
  setTurnIndex: number;
}

/**
 * バトル（勝者・敗者特定）の結果
 */
export interface BattleResult {
  winnerIndex: number;
  loserIndex: number;
  winnerCard: Card;
  loserCard: Card;
  isReverse: boolean;
}
/**
 * 前ターンの結果（場代計算用）
 */
export interface PreviousTurnResult {
  winnerIndex: number | null;
  loserIndex: number | null;
  isDraw: boolean;
}
