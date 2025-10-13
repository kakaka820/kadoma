// server/supabaseClient.js
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 環境変数が設定されていません');
  console.log('SUPABASE_URL:', supabaseUrl);
  console.log('SUPABASE_ANON_KEY:', supabaseKey ? '設定済み' : '未設定');
  process.exit(1);
}

console.log('✅ Supabase 接続準備完了');
console.log('URL:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = { supabase };