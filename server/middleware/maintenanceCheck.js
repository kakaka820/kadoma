//メンテナンスチェック
//server/middleware/maintenaceCheck.js


const MAINTENANCE_MODE = process.env.MAINTENANCE_MODE === 'true';

function checkMaintenance(socket) {
  if (MAINTENANCE_MODE) {
    socket.emit('maintenance_mode', { 
      message: 'メンテナンス中です。しばらくお待ちください。' 
    });
    socket.disconnect();
    return true;
  }
  return false;
}

module.exports = { checkMaintenance };