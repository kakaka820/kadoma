// shared/config.js
// ゲーム設定定数（フロント・サーバー共通）
// ⚠️ このファイルはフロント・サーバー両方で使用

const ANTE = 10;              // 基本賭け金
const MAX_JOKER_COUNT = 3;    // ゲーム終了条件（JOKER回数）
const MIN_POINTS = 0;         // 破産ライン
const WAIT_TIME_MS = 2000;    // ターン間の待機時間（ms）

// CommonJS (Node.js用)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    ANTE,
    MAX_JOKER_COUNT,
    MIN_POINTS,
    WAIT_TIME_MS
  };
}

// ES Module (ブラウザ用)
if (typeof window !== 'undefined') {
  window.GameConfig = {
    ANTE,
    MAX_JOKER_COUNT,
    MIN_POINTS,
    WAIT_TIME_MS
  };
}