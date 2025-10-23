const fs = require('fs');
const path = require('path');

const manifestPath = path.join(__dirname, 'build', 'manifest.json');

console.log('[fix-manifest] manifest.json を修正中...');

// build/manifest.json の存在確認
if (!fs.existsSync(manifestPath)) {
  console.error('❌ build/manifest.json が見つかりません');
  process.exit(1);
}

// manifest.json を読み込み
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

// 必要な設定を追加・上書き
manifest.orientation = 'landscape';
manifest.short_name = 'kadoma';
manifest.name = 'kadoma β';

// 保存
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

console.log('✅ manifest.json を修正しました');
console.log('  - orientation: landscape');
console.log('  - short_name: kadoma');
console.log('  - name: kadoma  β');