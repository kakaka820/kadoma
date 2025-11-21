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
const { useGiftCode, getUserGiftCodeHistory } = require('./giftCode');
const {
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  getFriendList,
  getPendingRequests
} = require('./friendSystem');
const { assignPlayerIdsToExistingUsers } = require('./utils/playerIdManager');
const {
  createFriendRoom,
  getInvitedRooms,
  getMyCreatedRooms,
  deleteFriendRoom,
  getFriendRoom
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


// ========================================
// REST API エンドポイント
// ========================================


// ギフトコード使用エンドポイント
app.post('/api/use-gift-code', async (req, res) => {
  const { userId, code } = req.body;
  if (!userId || !code) {
    return res.status(400).json({ success: false, error: 'ユーザーIDとギフトコードが必要です' });
  }
  const result = await useGiftCode(userId, code);
  
  if (result.success) {
    return res.json({ success: true, chipAmount: result.chipAmount });
  } else {
    return res.status(400).json({ success: false, error: result.error });
  }
});

// ギフトコード使用履歴取得エンドポイント
app.get('/api/gift-code-history/:userId', async (req, res) => {
  const { userId } = req.params;
  const history = await getUserGiftCodeHistory(userId);
  res.json({ success: true, history });
});






// ========================================
// フレンドシステム REST API エンドポイント
// ========================================

/**
 * POST /api/friend/request
 * フレンド申請を送信
 */
app.post('/api/friend/request', async (req, res) => {
  const { userId, targetPlayerId } = req.body;

  if (!userId || !targetPlayerId) {
    return res.status(400).json({ 
      success: false, 
      error: 'ユーザーIDとプレイヤーIDが必要です' 
    });
  }

  const result = await sendFriendRequest(userId, parseInt(targetPlayerId));
  
  if (result.success) {
    // Socket.io でリアルタイム通知（後で実装）
    // io.to(result.targetUser.id).emit('friend_request_received', { ... });
    
    return res.json({ 
      success: true, 
      message: 'フレンド申請を送信しました',
      targetUsername: result.targetUser.username
    });
  } else {
    return res.status(400).json({ success: false, error: result.error });
  }
});

/**
 * POST /api/friend/accept
 * フレンド申請を承認
 */
app.post('/api/friend/accept', async (req, res) => {
  const { userId, friendshipId } = req.body;

  if (!userId || !friendshipId) {
    return res.status(400).json({ 
      success: false, 
      error: 'ユーザーIDと申請IDが必要です' 
    });
  }

  const result = await acceptFriendRequest(userId, friendshipId);
  
  if (result.success) {
    // Socket.io でリアルタイム通知（後で実装）
    // io.to(senderId).emit('friend_request_accepted', { ... });
    
    return res.json({ success: true, message: 'フレンド申請を承認しました' });
  } else {
    return res.status(400).json({ success: false, error: result.error });
  }
});

/**
 * POST /api/friend/reject
 * フレンド申請を拒否
 */
app.post('/api/friend/reject', async (req, res) => {
  const { userId, friendshipId } = req.body;

  if (!userId || !friendshipId) {
    return res.status(400).json({ 
      success: false, 
      error: 'ユーザーIDと申請IDが必要です' 
    });
  }

  const result = await rejectFriendRequest(userId, friendshipId);
  
  if (result.success) {
    return res.json({ success: true, message: 'フレンド申請を拒否しました' });
  } else {
    return res.status(400).json({ success: false, error: result.error });
  }
});

/**
 * GET /api/friend/list/:userId
 * フレンドリストを取得
 */
app.get('/api/friend/list/:userId', async (req, res) => {
  const { userId } = req.params;

  const result = await getFriendList(userId);
  
  res.json({ 
    success: result.success, 
    friends: result.friends 
  });
});

/**
 * GET /api/friend/requests/:userId
 * 受信したフレンド申請一覧を取得
 */
app.get('/api/friend/requests/:userId', async (req, res) => {
  const { userId } = req.params;

  const result = await getPendingRequests(userId);
  
  res.json({ 
    success: result.success, 
    requests: result.requests 
  });
});



// ========================================
// フレンド部屋 REST API エンドポイント
// ========================================

/**
 * POST /api/friend-room/create
 * フレンド部屋を作成
 */
app.post('/api/friend-room/create', async (req, res) => {
  const { userId, config } = req.body;

  if (!userId || !config) {
    return res.status(400).json({ 
      success: false, 
      error: 'ユーザーIDと設定が必要です' 
    });
  }

  const result = await createFriendRoom(userId, config);
  
  if (result.success) {
    return res.json({ 
      success: true, 
      room: result.room 
    });
  } else {
    return res.status(400).json({ success: false, error: result.error });
  }
});

/**
 * GET /api/friend-room/invited/:userId
 * 招待されているフレンド部屋一覧を取得
 */
app.get('/api/friend-room/invited/:userId', async (req, res) => {
  const { userId } = req.params;

  const result = await getInvitedRooms(userId);
  
  res.json({ 
    success: result.success, 
    rooms: result.rooms 
  });
});

/**
 * GET /api/friend-room/created/:userId
 * 自分が作成したフレンド部屋一覧を取得
 */
app.get('/api/friend-room/created/:userId', async (req, res) => {
  const { userId } = req.params;

  const result = await getMyCreatedRooms(userId);
  
  res.json({ 
    success: result.success, 
    rooms: result.rooms 
  });
});

/**
 * DELETE /api/friend-room/:roomId
 * フレンド部屋を削除
 */
app.delete('/api/friend-room/:roomId', async (req, res) => {
  const { roomId } = req.params;
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ 
      success: false, 
      error: 'ユーザーIDが必要です' 
    });
  }

  const result = await deleteFriendRoom(userId, roomId);
  
  if (result.success) {
    return res.json({ success: true });
  } else {
    return res.status(400).json({ success: false, error: result.error });
  }
});

/**
 * GET /api/friend-room/:roomId
 * フレンド部屋情報を取得
 */
app.get('/api/friend-room/:roomId', async (req, res) => {
  const { roomId } = req.params;

  const result = await getFriendRoom(roomId);
  
  if (result.success) {
    return res.json({ success: true, room: result.room });
  } else {
    return res.status(400).json({ success: false, error: result.error });
  }
});








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