// server/server.js
// WebSocketサーバーの立ち上げ、イベントハンドラーの登録、サーバー起動

const currentDir = process.cwd();
console.log('Changed working directory to:', process.cwd());
// /opt/render/project/src にいる場合は親ディレクトリに移動
if (currentDir.endsWith('/src')) {
  process.chdir('..');
  console.log('Changed working directory to:', process.cwd());
} else if (__dirname.includes('/src/server')) {
  // __dirname が /opt/render/project/src/server の場合
  process.chdir(__dirname + '/../..');
  console.log('Changed working directory to:', process.cwd());
} else {
  // それ以外の場合（通常のケース）
  process.chdir(__dirname + '/..');
  console.log('Changed working directory to:', process.cwd());
}

const fs = require('fs');
const path = require('path');

console.log('Current directory:', process.cwd());
console.log('Server directory exists:', fs.existsSync(path.join(process.cwd(), 'server')));
console.log('Shared directory exists:', fs.existsSync(path.join(process.cwd(), 'shared')));
console.log('Config directory exists:', fs.existsSync(path.join(process.cwd(), 'shared/config')));
console.log('botNames.js exists:', fs.existsSync(path.join(process.cwd(), 'shared/config/botNames.js')));

// shared/config の中身を全て表示
if (fs.existsSync(path.join(process.cwd(), 'shared/config'))) {
  console.log('Files in shared/config:', fs.readdirSync(path.join(process.cwd(), 'shared/config')));
}




require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { setupAuthEvents } = require('./events/authEvents');
const { setupRoomEvents } = require('./events/roomEvents');
const { setupGameEvents } = require('./events/gameEvents');
const { setupReconnectEvents } = require('./events/reconnectEvents');
const { checkMaintenance } = require('./middleware/maintenanceCheck');
const { handleDisconnect } = require('./roomManager');
const { supabase } = require('./supabaseClient');


// Expressアプリケーションのセットアップ
const app = express();

// JSONパース用ミドルウェア
app.use(express.json());
// CORS設定
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', process.env.CLIENT_URL || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// httpサーバーの作成
const server = http.createServer(app);

// WebSocket(socket.io)のセットアップ
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "*",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// ルーム管理用データ
const rooms = new Map();
const games = new Map();


// ========================================
// REST API エンドポイント
// ========================================
/**
 * GET /api/stats/:userId
 * ユーザーの統計情報を取得
 */
app.get('/api/stats/:userId', async (req, res) => {
  const { userId } = req.params;
  
  console.log('[API] /api/stats request:', userId);
  
  try {
    // user_stats から取得（1行のみ）
    const { data: stats, error } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error) {
      // user_stats が存在しない場合は空データを返す
      console.log('[API] /api/stats user_stats not found:', userId);
      return res.json({
        totalGames: 0,
        totalBuyIn: 0,
        totalFinalScore: 0,
        firstPlaceCount: 0,
        winCount: 0
      });
    }
// winCount を計算（profit >= 0 の数）
    const { data: gameHistory } = await supabase
      .from('game_history')
      .select('profit')
      .eq('user_id', userId);
    
    const winCount = gameHistory ? gameHistory.filter(g => (g.profit || 0) >= 0).length : 0;
    
    const result = {
      totalGames: stats.total_games || 0,
      totalBuyIn: stats.total_buy_in || 0,
      totalFinalScore: stats.total_final_score || 0,
      firstPlaceCount: stats.first_place_count || 0,
      winCount: winCount
    };
    
    console.log('[API] /api/stats response:', result);
    res.json(result);
  } catch (err) {
    console.error('[API] /api/stats error:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});


/**
 * GET /api/history/:userId
 * ユーザーのゲーム履歴を取得（最新10件）
 */
app.get('/api/history/:userId', async (req, res) => {
  const { userId } = req.params;
  const limit = parseInt(req.query.limit) || 10;
  
  console.log('[API] /api/history request:', userId, 'limit:', limit);

try {
    const { data: history, error } = await supabase
      .from('game_history')
      .select('id, played_at, room_id, buy_in, final_score, profit, rank')
      .eq('user_id', userId)
      .order('played_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('[API] /api/history error:', error);
      throw error;
    }
    
    console.log('[API] /api/history response:', history.length, 'records');
    res.json(history);
  } catch (err) {
    console.error('[API] /api/history error:', err);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});



// Socket.IO接続処理
io.on('connection', (socket) => {
  // メンテナンスチェック
  if (checkMaintenance(socket)) return;
  
  console.log('User connected:', socket.id);
  
  // イベントハンドラーを登録
  setupAuthEvents(socket);
  setupRoomEvents(socket, io, rooms, games);
  setupGameEvents(socket, io, rooms, games);
  setupReconnectEvents(socket, io, rooms, games);
  
  // 切断処理
  socket.on('disconnect', () => {
    handleDisconnect(io, rooms, games, socket);
  });
});

// サーバー起動
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});