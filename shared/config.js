// shared/config.js
// ゲーム設定定数（フロント・サーバー共通）
// ⚠️ このファイルはフロント・サーバー両方で使用

// ==================== ゲームルール ====================
const ANTE = 10;                    // 基本賭け金
const MAX_JOKER_COUNT = 3;          // ゲーム終了条件（JOKER回数）
const MIN_POINTS = 0;               // 破産ライン
const ANTE_MULTIPLIER = 200;        // 初期持ち点倍率（ANTE × 200 = 2000）

// ==================== プレイヤー設定 ====================
const MAX_PLAYERS = 3;              // 最大プレイヤー数
const CARDS_PER_PLAYER = 5;         // プレイヤーごとの配布枚数

// ==================== タイミング設定 ====================
const TURN_TIME_LIMIT = 8;          // 各ターンの制限時間（秒）
const WAIT_TIME_MS = 2000;          // ターン間の待機時間（ms）
const ROUND_RESULT_DISPLAY_MS = 2000; // ラウンド結果表示時間（ms）
const CARD_REVEAL_DELAY_MS = 500;  // カード一斉開示の遅延（ms）（場札表示してから勝敗表示までの時間

// ==================== Bot設定 ====================
const BOT_WAIT_TIME_MS = 10000;     // Bot補充待機時間（10秒）
const BOT_MIN_DELAY_MS = 1000;      // Bot最小遅延時間（1秒）
const BOT_MAX_DELAY_MS = 7500;      // Bot最大遅延時間（7.5秒）

// ==================== 警告・通知設定 ====================
const LOW_DECK_THRESHOLD = 15;      // デッキ残り少ない警告閾値
const WARNING_PERSIST_TURNS = 5;    // 警告表示ターン数
const DISCONNECT_NOTIFY_DURATION_MS = 5000; // 切断通知表示時間（5秒）
const RECONNECT_NOTIFY_DURATION_MS = 3000;  // 復帰通知表示時間（3秒）

// ==================== 切断・復帰設定 ====================
const RECONNECT_WAIT_TIME = 300;    // 復帰待機時間（秒）= 5分
const DISCONNECT_PENALTY_RATE = 1.0; // 没収率（1.0 = 全額）



// ==================== マルチ部屋設定 ====================
const MULTI_ROOMS = [
  {
    id: 'room_1',
    name: '部屋1',
    ante: 10,
    anteMultiplier: 200,
    maxJokerCount: 3,
    requiredChips: 10 * 200  // 2000チップ
  },
  {
    id: 'room_2',
    name: '部屋2',
    ante: 10,
    anteMultiplier: 600,
    maxJokerCount: 5,
    requiredChips: 10 * 600  // 6000チップ
  },
  {
    id: 'room_3',
    name: '部屋3',
    ante: 10,
    anteMultiplier: 1300,
    maxJokerCount: 10,
    requiredChips: 10 * 1300  // 13000チップ
  },
  {
    id: 'room_4',
    name: '部屋4',
    ante: 10,
    anteMultiplier: 300,
    maxJokerCount: 3,
    requiredChips: 10 * 300  // 3000チップ
  },
  {
    id: 'room_5',
    name: '部屋5',
    ante: 10,
    anteMultiplier: 800,
    maxJokerCount: 5,
    requiredChips: 10 * 800  // 8000チップ
  },
  {
    id: 'room_6',
    name: '部屋6',
    ante: 10,
    anteMultiplier: 1500,
    maxJokerCount: 10,
    requiredChips: 10 * 1500  // 15000チップ
  }
];


// ==================== CommonJS Export (Node.js用) ====================
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    // ゲームルール
    ANTE,
    MAX_JOKER_COUNT,
    MIN_POINTS,
    ANTE_MULTIPLIER,
    
    // プレイヤー
    MAX_PLAYERS,
    CARDS_PER_PLAYER,
    
    // タイミング
    TURN_TIME_LIMIT,
    WAIT_TIME_MS,
    ROUND_RESULT_DISPLAY_MS,
    CARD_REVEAL_DELAY_MS,
    
    // Bot
    BOT_WAIT_TIME_MS,
    BOT_MIN_DELAY_MS,
    BOT_MAX_DELAY_MS,
    
    // 警告
    LOW_DECK_THRESHOLD,
    WARNING_PERSIST_TURNS,
    DISCONNECT_NOTIFY_DURATION_MS,
    RECONNECT_NOTIFY_DURATION_MS,
    
    // 切断・復帰
    RECONNECT_WAIT_TIME,
    DISCONNECT_PENALTY_RATE,

    // マルチ部屋
    MULTI_ROOMS,
  };
}

// ==================== ES Module Export (ブラウザ用) ====================
if (typeof window !== 'undefined') {
  window.GameConfig = {
    // ゲームルール
    ANTE,
    MAX_JOKER_COUNT,
    MIN_POINTS,
    ANTE_MULTIPLIER,
    
    // プレイヤー
    MAX_PLAYERS,
    CARDS_PER_PLAYER,
    
    // タイミング
    TURN_TIME_LIMIT,
    WAIT_TIME_MS,
    ROUND_RESULT_DISPLAY_MS,
    CARD_REVEAL_DELAY_MS,
    
    // Bot
    BOT_WAIT_TIME_MS,
    BOT_MIN_DELAY_MS,
    BOT_MAX_DELAY_MS,
    
    // 警告
    LOW_DECK_THRESHOLD,
    WARNING_PERSIST_TURNS,
    DISCONNECT_NOTIFY_DURATION_MS,
    RECONNECT_NOTIFY_DURATION_MS,
    
    // 切断・復帰
    RECONNECT_WAIT_TIME,
    DISCONNECT_PENALTY_RATE,

    // マルチ部屋
    MULTI_ROOMS,
  };
}