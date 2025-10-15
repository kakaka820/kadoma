//server/server.js
//WebSocketサーバーの立ち上げ、イベントハンドラーの登録、サーバー起動


const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { startGame, handleRoundEnd } = require('./gameManager');
const { handleJoinRoom, handleDisconnect } = require('./roomManager');
const { handlePlayCard } = require('./cardHandler');
const { handlePlayerReconnect } = require('./disconnectHandler');
const { TURN_TIME_LIMIT } = require('../shared/config');


console.log('[server.js] authHandler を読み込み中...');
const { registerUser, loginWithTransferCode, loginWithUserId} = require('./authHandler');
require('dotenv').config();
console.log('[server.js] authHandler 読み込み成功');

// Expressアプリケーションのセットアップ
const app = express();

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

// Socket.IOイベント処理
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  //ユーザー登録
  socket.on('register', async (data, callback) => {
    console.log('[server.js] register イベント受信:', data);
    try{
    const result = await registerUser(data.username);
    console.log('[server.js] registerUser 結果:', result);
    callback(result);
  }catch (error) {
      console.error('[server.js] register エラー:', error);
      callback({ success: false, error: 'サーバーエラー' });
    }
  }

);
  
  //引継ぎコードログイン
  socket.on('login_with_code', async (data, callback) => {
    console.log('[server.js] login_with_code イベント受信:', data);
    try{
    const result = await loginWithTransferCode(data.transferCode);
    callback(result);
  }catch (error) {
      console.error('[server.js] login_with_code エラー:', error);
      callback({ success: false, error: 'サーバーエラー' });
    }
  }


);
  
  //自動ログイン
  socket.on('auto_login', async (data, callback) => {
    console.log('[server.js] auto_login イベント受信:', data);
    try{
    const result = await loginWithUserId(data.userId);
    callback(result);
  }catch (error) {
      console.error('[server.js] auto_login エラー:', error);
      callback({ success: false, error: 'サーバーエラー' });
    }
  }
);

  // ルーム作成または参加
  socket.on('join_room', (data) => {
    handleJoinRoom(
      io, 
      rooms, 
      games, 
      socket, 
      data, 
      (roomId, room) => startGame(io, games, roomId, room)
    );
      });


  // カード出す処理（同時プレイ版）
  socket.on('play_card', (data) => {
    handlePlayCard(
      io, 
      games, 
      socket, 
      data, 
      (io, games, roomId, gameState) => handleRoundEnd(io, games, roomId, gameState)
    );
  });

  //復帰処理(切断→再接続)
socket.on('reconnect_to_game', (data) => {
  handlePlayerReconnect(io, rooms, games, socket, data.roomId);
});


//リロード後の復帰処理
socket.on('rejoin_game', ({ roomId, userId }) => {
  console.log(`[Server] rejoin_game received:`, { roomId, userId });
  console.log(`[Server] rejoin_game: ${userId} → ${roomId}`);
  
  //userId で全ゲームから検索
  let targetRoomId = null;
  let playerIndex = -1;
  let disconnectInfo = null;
  
  for (const [gameRoomId, gameState] of games.entries()) {
    if (!gameState.disconnectedPlayers) continue;
    
    for (const [oldSocketId, info] of Object.entries(gameState.disconnectedPlayers)) {
      console.log(`[Server] Checking disconnectInfo in ${gameRoomId}:`, { oldSocketId, info });
      if (info.userId === userId) {
        targetRoomId = gameRoomId;
        playerIndex = info.playerIndex;
        disconnectInfo = info;
        break;
      }
    }
    
    if (targetRoomId) break;
  }
  
  if (!targetRoomId || playerIndex === -1) {
    socket.emit('rejoin_failed', { 
      message: 'プレイヤー情報が見つかりません' 
    });
    return;
  }
  
  const gameState = games.get(targetRoomId);
  
  // 代理botを元のプレイヤーに戻す
  const restoredPlayer = {
    id: socket.id,
    name: disconnectInfo.originalName,
    userId: userId,
    isBot: false
  };

  gameState.players[playerIndex] = restoredPlayer;

  // disconnectedPlayers から削除
  const oldSocketId = Object.keys(gameState.disconnectedPlayers).find(
    key => gameState.disconnectedPlayers[key].userId === userId
  );
  if (oldSocketId) {
    delete gameState.disconnectedPlayers[oldSocketId];
  }
  
  socket.join(targetRoomId);

  // ✅ タイマー残り時間を計算
  let timeRemaining = 0;
  let timeLimit = TURN_TIME_LIMIT;
  
  if (gameState.turnTimerEndTime) {
    const now = Date.now();
    const remaining = gameState.turnTimerEndTime - now;
    timeRemaining = Math.max(0, Math.ceil(remaining / 1000));
    console.log(`[Server] Timer remaining: ${timeRemaining}s`);
  }
  
  // 成功を通知
  socket.emit('rejoin_success', {
    roomId: targetRoomId,
    playerIndex,
    gameState: {
      hand: gameState.hands[playerIndex],
      fieldCards: gameState.fieldCards,
      scores: gameState.scores,
      currentMultiplier: gameState.currentMultiplier,
      turnIndex: gameState.turnIndex,
      setTurnIndex: gameState.setTurnIndex,
      playerSelections: gameState.playerSelections,
      players: gameState.players.map(p => p.name),
      opponentHands: gameState.hands.map((hand, idx) => {
      if (idx === playerIndex) return [];
      return hand.map(() => ({ visible: false }));
    }),
    wins: gameState.wins || [0, 0, 0],
    timeRemaining: timeRemaining,
    timeLimit: timeLimit
    }
  });

  // 全員に復帰通知
  io.to(targetRoomId).emit('player_reconnected', {
    playerIndex,
    playerName: disconnectInfo.originalName
  });

  console.log(`[Server] rejoin_success: Player ${playerIndex} in ${targetRoomId}`);
});
  
  // 切断時の処理
  socket.on('disconnect', () => {
    handleDisconnect(io, rooms, games, socket);
  });
});





const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});
