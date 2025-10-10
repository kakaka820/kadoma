// src/online/types/game.ts
// オンライン版のゲーム型定義


// Card型とPlayer型の定義（local/utils/deck.tsと同じ）
export type Card = {
  suit: string | null;
  rank: string;
  playerIndex?: number;
};

export type Player = {
  name: string;
  hand: Card[];
  wins: number;
  points: number;
};

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