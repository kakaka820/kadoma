//server/server.js
//WebSocketサーバーの立ち上げ、イベントハンドラーの登録、サーバー起動


const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { startGame, handleRoundEnd } = require('./gameManager');
const { handleJoinRoom, handleDisconnect } = require('./roomManager');
const { handlePlayCard } = require('./cardHandler');
const { handlePlayerReconnect } = require('./disconnectHandler');
const { TURN_TIME_LIMIT, MULTI_ROOMS } = require('../shared/config');
const { createBotPlayer, BOT_STRATEGIES } = require('./botPlayer');
const { BOT_WAIT_TIME_MS } = require('../shared/config');

console.log('[server.js] authHandler を読み込み中...');
const { registerUser, loginWithTransferCode, loginWithUserId, checkSufficientChips, updateUserChips} = require('./authHandler');
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

 // ルーム作成または参加（部屋参加処理）
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

  // マルチのルーム作成または参加
socket.on('join_multi_room', async (data, callback) => {
  const { roomId, userId, username } = data;
  
  console.log(`[MultiRoom] Join request: ${username} → ${roomId}`);
  
  // 部屋情報取得
  const room = MULTI_ROOMS.find(r => r.id === roomId);
  if (!room) {
    callback({ success: false, error: '部屋が見つかりません' });
    return;
  }
  
  // チップ残高チェック
  const chipCheck = await checkSufficientChips(userId, room.requiredChips);
  
  if (!chipCheck.sufficient) {
    console.log(`[MultiRoom] Insufficient chips: ${chipCheck.current}/${chipCheck.required}`);
    callback({ 
      success: false, 
      error: 'チップが不足しています',
      current: chipCheck.current,
      required: chipCheck.required,
      shortage: chipCheck.shortage
    });
    return;
  }
  

// ★ 特定の部屋に参加させる処理を追加
  let targetRoom = rooms.get(roomId);
  
  if (!targetRoom) {
    // 部屋が存在しなければ作成
    rooms.set(roomId, { players: [], roomConfig: room });
    targetRoom = rooms.get(roomId);
  }
  
  // 既に3人いたら拒否
  if (targetRoom.players.length >= 3) {
    callback({ success: false, error: '部屋が満員です' });
    return;
  }

  // プレイヤー追加
  targetRoom.players.push({
    id: socket.id,
    name: username,
    userId: userId,
    isBot: false
  });
  
  socket.join(roomId);
  socket.roomId = roomId;
  
  // 全員に通知
  io.to(roomId).emit('room_update', {
    roomId,
    players: targetRoom.players,
    isFull: targetRoom.players.length === 3
  });

  // 3人未満ならBot投入タイマー
  if (targetRoom.players.length < 3) {
    if (targetRoom.botTimer) {
      clearTimeout(targetRoom.botTimer);
    }
    
    targetRoom.botTimer = setTimeout(() => {
      const currentRoom = rooms.get(roomId);
      if (!currentRoom) return;
      
      // Bot追加
      while (currentRoom.players.length < 3) {
        const botNumber = currentRoom.players.length + 1;
        const bot = createBotPlayer(`bot_${roomId}_${botNumber}`, botNumber, BOT_STRATEGIES.RANDOM, false);
        currentRoom.players.push(bot);
      }

     io.to(roomId).emit('room_update', {
        roomId,
        players: currentRoom.players,
        isFull: true
      });
      
      io.to(roomId).emit('game_ready', { roomId });
      
      setTimeout(() => {
        startGame(io, games, roomId, currentRoom);
      }, 1000);
    }, BOT_WAIT_TIME_MS);
  }

// 3人揃ったら即開始
  if (targetRoom.players.length === 3) {
    if (targetRoom.botTimer) {
      clearTimeout(targetRoom.botTimer);
    }
    
    io.to(roomId).emit('game_ready', { roomId });
    
    setTimeout(() => {
      startGame(io, games, roomId, targetRoom);
    }, 1000);
  }
  
  callback({ success: true });
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
