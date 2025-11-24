// server/events/authEvents.js
//　認証関連

const { 
  registerUser, 
  loginWithTransferCode, 
  loginWithUserId 
} = require('../auth');

function setupAuthEvents(socket) {
  // ユーザー登録
  socket.on('register', async (data, callback) => {
    console.log('[Auth] register:', data);
    try {
      const result = await registerUser(data.username);
      callback(result);
    } catch (error) {
      console.error('[Auth] register error:', error);
      callback({ success: false, error: 'サーバーエラー' });
    }
  });
  
  // 引継ぎコードログイン
  socket.on('login_with_code', async (data, callback) => {
    console.log('[Auth] login_with_code:', data);
    try {
      const result = await loginWithTransferCode(data.transferCode);
      callback(result);
    } catch (error) {
      console.error('[Auth] login_with_code error:', error);
      callback({ success: false, error: 'サーバーエラー' });
    }
  });
  
  // 自動ログイン
  socket.on('auto_login', async (data, callback) => {
    console.log('[Auth] auto_login:', data);
    try {
      const result = await loginWithUserId(data.userId);
      callback(result);
    } catch (error) {
      console.error('[Auth] auto_login error:', error);
      callback({ success: false, error: 'サーバーエラー' });
    }
  });
}

module.exports = { setupAuthEvents };