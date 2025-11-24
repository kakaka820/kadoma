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
const questRoutes = require('./routes/questRoutes');
const giftCodeRoutes = require('./routes/giftCodeRoutes');
const friendRoutes = require('./routes/friendRoutes');
const friendRoomRoutes = require('./routes/friendRoomRoutes');
const statsRoutes = require('./routes/statsRoutes');
const { assignPlayerIdsToExistingUsers } = require('./utils/playerIdManager');
const {
  handleJoinFriendRoom,
  handleLeaveFriendRoom,
  activeFriendRooms
} = require('./friendRoomHandler');


// ========================================
// 既存ユーザーへのプレイヤーID割り当て（初回起動時のみ）
// ========================================
// サーバー起動時に実行（一度だけ）
assignPlayerIdsToExistingUsers().catch(err => {
  console.error('[Server] Player ID migration failed:', err);
});



// Expressアプリケーションのセットアップ
const app = express();

// JSONパース用ミドルウェア
app.use(express.json());
// CORS設定
app.use((req, res, next) => {
  const allowedOrigins = [
    process.env.CLIENT_URL,
    'https://kakaka820.github.io',
    'http://localhost:3000'
  ].filter(Boolean);
  
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // OPTIONS リクエスト（プリフライト）への対応
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

// ルート登録
app.use('/api', questRoutes);
app.use('/api', giftCodeRoutes);
app.use('/api', friendRoutes);
app.use('/api', friendRoomRoutes);
app.use('/api', statsRoutes);

// サーバー時刻取得エンドポイント（デバッグ用）
app.get('/api/server-time', (req, res) => {
  const now = new Date();
  const nowUTC = now.toISOString();
  const nowJST = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Tokyo' })).toISOString();
  
  res.json({
    utc: nowUTC,
    jst: nowJST,
    timestamp: now.getTime()
  });
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

  // フレンド部屋イベント
  socket.on('join_friend_room', (data, callback) => {
    handleJoinFriendRoom(io, socket, data, callback, games);
  });
  socket.on('leave_friend_room', (roomId) => {
    handleLeaveFriendRoom(io, socket, roomId);
  });
  
  // 切断処理
  socket.on('disconnect', () => {
    // フレンド部屋から自動退出
    for (const [roomId, room] of activeFriendRooms.entries()) {
      const player = room.players.find(p => p.socketId === socket.id);
      if (player) {
        handleLeaveFriendRoom(io, socket, roomId);
      }
    }
    
    handleDisconnect(io, rooms, games, socket);
  });
});

// サーバー起動
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});