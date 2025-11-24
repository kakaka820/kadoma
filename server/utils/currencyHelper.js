// server//utils/currencyManager.js

const { updateUserCurrency } = require('../auth');

/**
 * チップ更新の種類
 */
const TRANSACTION_TYPES = {
  ROOM_JOIN: 'room_join',       // 部屋参加（差し引き）
  ROOM_CANCEL: 'room_cancel',   // キャンセル（返金）
  GAME_REWARD: 'game_reward',   // ゲーム報酬（配分）
};

/**
 * チップ更新処理（一元化）
 * @param {string} userId - ユーザーID
 * @param {number} amount - 変動額（+/-）
 * @param {string} type - トランザクション種類
 * @param {object} metadata - 追加情報（ログ用）
 */
async function updateCurrency(userId, amount, type, metadata = {}) {
  console.log(`[CurrencyManager] ${type}:`, {
    userId,
    amount,
    metadata
  });

  // 実際の更新処理
  const result = await updateUserCurrency(userId, amount);

  if (result.success) {
    console.log(`[CurrencyManager] ✅ Success: ${userId} → ${result.currency} (${amount > 0 ? '+' : ''}${amount})`);
    
    // TODO: 将来的にトランザクション履歴をDBに保存(不正対策などをしたくなったらやる)
    // await saveTransactionHistory(userId, amount, type, metadata);
  } else {
    console.error(`[CurrencyManager] ❌ Failed:`, result.error);
  }

  return result;
}

/**
 * 部屋参加時の差し引き
 */
async function deductRoomFee(userId, roomId, amount) {
  return updateCurrency(userId, -amount, TRANSACTION_TYPES.ROOM_JOIN, {
    roomId,
    fee: amount
  });
}

/**
 * キャンセル時の返金
 */
async function refundRoomFee(userId, roomId, amount) {
  return updateCurrency(userId, amount, TRANSACTION_TYPES.ROOM_CANCEL, {
    roomId,
    refund: amount
  });
}

/**
 * ゲーム報酬の配分
 */
async function distributeGameReward(userId, roomId, amount) {
  if (amount <= 0) {
    console.log(`[CurrencyManager] No reward for ${userId} (amount: ${amount})`);
    return { success: true, currency: 0 };
  }
  
  return updateCurrency(userId, amount, TRANSACTION_TYPES.GAME_REWARD, {
    roomId,
    reward: amount
  });
}

module.exports = {
  TRANSACTION_TYPES,
  updateCurrency,
  deductRoomFee,
  refundRoomFee,
  distributeGameReward
};