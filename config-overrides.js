const path = require('path');
const fs = require('fs');

module.exports = function override(config, env) {
  // ビルド開始時にsharedをsrc/sharedにコピー
  const srcShared = path.resolve(__dirname, 'src/shared');
  const shared = path.resolve(__dirname, 'shared');
  
  // src/sharedが存在しない、またはシンボリックリンクの場合はコピー
  if (!fs.existsSync(srcShared)) {
    fs.cpSync(shared, srcShared, { recursive: true });
    console.log('✅ shared/ を src/shared/ にコピーしました');
  }

  return config;
};