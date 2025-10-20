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
const { registerUser, loginWithTransferCode, loginWithUserId, checkSufficientChips, updateUserChips, updateUserCurrency } = require('./authHandler');
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
      (roomId, room) => startGame(io, games, roomId, room, rooms)
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

  //既に参加済みかチェック
  for (const [id, room_] of rooms.entries()) {
    const alreadyJoined = room_.players.some(p => p.userId === userId);
    if (alreadyJoined) {
      console.log(`[MultiRoom] User ${userId} already joined in room ${id}`);
      callback({ 
        success: false, 
        error: '既にこの部屋タイプのマッチングに参加しています。' 
      });
      return;
    }
  }
  

 // ★ 空き部屋を探す or 新規作成
  let targetRoom = null;
  let actualRoomId = null;
  // 同じ設定の空き部屋を探す
  for (const [id, room_] of rooms.entries()) {
    // room_config.id で部屋タイプをチェック（room_1, room_2など）
    if (room_.roomConfig?.id === roomId && room_.players.length < 3) {
      targetRoom = room_;
      actualRoomId = id;
      console.log(`[MultiRoom] Found available room: ${id}`);
      break;
    }
  }
   // 空き部屋がなければ新規作成
  if (!targetRoom) {
    actualRoomId = `${roomId}_${Date.now()}`;
    rooms.set(actualRoomId, { players: [], roomConfig: room });
    targetRoom = rooms.get(actualRoomId);
    console.log(`[MultiRoom] Created new room: ${actualRoomId}`);
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
    isBot: false,
    deducted: true, //ほんまか？
    buyIn: room.requiredChips
  });

  await updateUserCurrency(userId, -(room.requiredChips));
console.log(`[MultiRoom] Deducted ${room.requiredChips} currency from ${userId}`);
  
  socket.join(actualRoomId);
  socket.roomId = actualRoomId;
  
  // 全員に通知
   io.to(actualRoomId).emit('room_update', {
    roomId: actualRoomId,
    players: targetRoom.players,
    isFull: targetRoom.players.length === 3
  });

  // 3人未満ならBot投入タイマー
  if (targetRoom.players.length < 3) {
    if (targetRoom.botTimer) {
      clearTimeout(targetRoom.botTimer);
    }
    
    targetRoom.botTimer = setTimeout(() => {
      const currentRoom = rooms.get(actualRoomId);
      if (!currentRoom) return;
      


      // Bot追加
      while (currentRoom.players.length < 3) {
        const botNumber = currentRoom.players.length + 1;
        const bot = createBotPlayer(`bot_${roomId}_${botNumber}`, botNumber, BOT_STRATEGIES.RANDOM, false);
        currentRoom.players.push(bot);
      }

     io.to(actualRoomId).emit('room_update', {
        roomId: actualRoomId,
        players: currentRoom.players,
        isFull: true
      });
      
      io.to(actualRoomId).emit('game_ready', { roomId: actualRoomId });
      
      setTimeout(() => {
        startGame(io, games, actualRoomId, currentRoom, rooms);
      }, 1000);
    }, BOT_WAIT_TIME_MS);
  }

// 3人揃ったら即開始
  if (targetRoom.players.length === 3) {
    if (targetRoom.botTimer) {
      clearTimeout(targetRoom.botTimer);
    }
    
    io.to(actualRoomId).emit('game_ready', { roomId: actualRoomId });
    
    setTimeout(() => {
      startGame(io, games, actualRoomId, targetRoom, rooms);
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
    
   const info = gameState.disconnectedPlayers[userId];
    console.log(`[Server] Checking disconnectInfo in ${gameRoomId}:`, { userId, info });
      if (info) {
        targetRoomId = gameRoomId;
        playerIndex = info.playerIndex;
        disconnectInfo = info;
        break;
      }
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
delete gameState.disconnectedPlayers[userId];
  
  socket.join(targetRoomId);

  //タイマー残り時間を計算
  let timeRemaining = 0;
  let timeLimit = TURN_TIME_LIMIT;

  console.log(`[Server] rejoin_game - turnTimerEndTime:`, gameState.turnTimerEndTime);
    console.log(`[Server] rejoin_game - turnTimerStartTime:`, gameState.turnTimerStartTime);
    console.log(`[Server] rejoin_game - playerSelections:`, gameState.playerSelections);
  
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

//全員選択済みなら次のターンに進む
  if (gameState.playerSelections.every(Boolean)) {
    console.log('[Server] rejoin_game: All players selected, triggering round end');
    const { handleRoundEnd } = require('./gameManager');
    handleRoundEnd(io, games, targetRoomId, gameState, rooms);
}
});
  

  // マッチングキャンセル処理
  socket.on('cancel_matching', async (data, callback) => {
    const { roomId, userId } = data;
    
    console.log(`[MultiRoom] Cancel request: ${userId} in ${roomId}`);
    
    const room = rooms.get(roomId);
    
    if (!room) {
      callback({ success: false, error: 'ルームが見つかりません' });
      return;
    }
    
    // プレイヤーを探す
    const playerIndex = room.players.findIndex(p => p.userId === userId);
    
    if (playerIndex === -1) {
      callback({ success: false, error: 'プレイヤーが見つかりません' });
      return;
    }
    
    const player = room.players[playerIndex];
    
    // ✅ 差し引かれている場合のみ返金
    if (player.deducted && player.buyIn) {
      await updateUserCurrency(userId, player.buyIn);
      console.log(`[MultiRoom] Refunded ${player.buyIn} currency to ${userId}`);
    }
    
    // プレイヤー削除
    room.players.splice(playerIndex, 1);
    socket.leave(roomId);
    
    // 全員に通知
    io.to(roomId).emit('room_update', {
      roomId: roomId,
      players: room.players,
      isFull: room.players.length === 3
    });
    
    callback({ success: true, refunded: player.buyIn || 0 });
    console.log(`[MultiRoom] Player ${userId} cancelled matching in ${roomId}`);
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
