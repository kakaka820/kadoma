//server/server.js
//WebSocketサーバーの立ち上げ、イベントハンドラーの登録、サーバー起動


const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { startGame, handleRoundEnd } = require('./gameManager');
const { handleJoinRoom, handleDisconnect } = require('./roomManager');
const { handlePlayCard } = require('./cardHandler');
const { handlePlayerReconnect } = require('./disconnectHandler');


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
  
  const gameState = games.get(roomId);
  
  if (!gameState) {
    socket.emit('rejoin_failed', { 
      message: 'ゲームが終了しました' 
    });
    return;
  }
  
  //disconnectedPlayersからプレイヤーを探す
  let playerIndex = -1;
  let disconnectInfo = null;
  
  for (const [oldSocketId, info] of Object.entries(gameState.disconnectedPlayers || {})) {
     console.log(`[Server] Checking disconnectInfo:`, { oldSocketId, info });
    if (info.userId === userId) {
      playerIndex = info.playerIndex;
      disconnectInfo = info;
      break;
    }
  }
  
  if (playerIndex === -1) {
    socket.emit('rejoin_failed', { 
      message: 'プレイヤー情報が見つかりません' 
    });
    return;
  }
//代理botを元のプレイヤーに戻す
  const restoredPlayer = {
    id: socket.id,
    name: disconnectInfo.originalName,
    userId: userId,
    isBot: false
  };

  gameState.players[playerIndex] = restoredPlayer;

  //disconnectedPlayers から削除
  const oldSocketId = Object.keys(gameState.disconnectedPlayers).find(
    key => gameState.disconnectedPlayers[key].userId === userId
  );
  if (oldSocketId) {
    delete gameState.disconnectedPlayers[oldSocketId];
  }
  
  // Socket idを更新（roomIdに参加）
   gameState.players[playerIndex].id = socket.id;
  socket.join(roomId);
  
  // 成功を通知
  socket.emit('rejoin_success', {
    roomId,
    playerIndex,
    gameState: {
      hand: gameState.hands[playerIndex],
      fieldCards: gameState.fieldCards,
      scores: gameState.scores,
      currentMultiplier: gameState.currentMultiplier,
      turnIndex: gameState.turnIndex,
      setTurnIndex: gameState.setTurnIndex,
      playerSelections: gameState.playerSelections
    }
  });

  //全員に復帰通知
io.to(roomId).emit('player_reconnected', {
    playerIndex,
    playerName: disconnectInfo.originalName
  });

  console.log(`[Server] rejoin_success: Player ${playerIndex}`);
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
