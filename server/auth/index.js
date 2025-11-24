// server/auth/index.js
// 認証関連の統合エクスポート

const { registerUser, checkUsernameExists } = require('./registration');
const { loginWithTransferCode, loginWithUserId } = require('./login');
const { checkSufficientCurrency, updateUserCurrency } = require('./currencyManager');

module.exports = {
  // 登録
  registerUser,
  checkUsernameExists,
  
  // ログイン
  loginWithTransferCode,
  loginWithUserId,
  
  // 通貨管理
  checkSufficientCurrency,
  updateUserCurrency
};