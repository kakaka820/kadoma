// server/server.js
// WebSocketサーバーの立ち上げ、イベントハンドラーの登録、サーバー起動

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
    // game_history から全データを取得
    const { data: games, error: gamesError } = await supabase
      .from('game_history')
      .select('buy_in, final_score, profit, rank')
      .eq('user_id', userId);
    
    if (gamesError) {
      console.error('[API] /api/stats error:', gamesError);
      throw gamesError;
    }

// 集計
    const totalGames = games.length;
    const totalBuyIn = games.reduce((sum, g) => sum + (g.buy_in || 0), 0);
    const totalFinalScore = games.reduce((sum, g) => sum + (g.final_score || 0), 0);
    const firstPlaceCount = games.filter(g => g.rank === 1).length;
    const winCount = games.filter(g => (g.profit || 0) >= 0).length;
    
    const stats = {
      totalGames,
      totalBuyIn,
      totalFinalScore,
      firstPlaceCount,
      winCount
    };
console.log('[API] /api/stats response:', stats);
    res.json(stats);
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