//serverフォルダはサーバー専用
//server/server.js
//WebSocketサーバーの立ち上げに使う


const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { Server } = require('socket.io');
const { initializeGame, processRound, prepareNextTurn } = require('../shared/gameFlow');

//Expressアプリーケーションのセットアップ
const app = express();

//httpサーバーの作成
const server = http.createServer(app);

//WebSocket(socket.io)のセットアップ
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

//独立した関数として定義
//ゲーム開始処理
  function startGame(roomId, room) {
  console.log(`[Game] Starting game in room ${roomId}`);
  console.log(`[Game] Players:`, room.players);
  
  const gameState = initializeGame(3, 200);
  gameState.roomId = roomId;
  gameState.players = room.players;
  
  games.set(roomId, gameState);
  console.log(`[Game] GameState created:`, {
    roomId: gameState.roomId,
    hands: gameState.hands.length,
    players: gameState.players.length,
    scores: gameState.scores
    });
  
  // 各プレイヤーに手札送信
  room.players.forEach((player, idx) => {
    console.log(`[Game] Sending game_start to ${player.name} (${player.id})`);
    io.to(player.id).emit('game_start', {
      roomId,
      playerIndex: idx,
      hand: gameState.hands[idx],
      players: room.players.map(p => p.name),
      turnIndex: 0,
      scores: gameState.scores
    });
  });
}

// ラウンド処理も独立関数


function handleRoundEnd(roomId, gameState) {
  const updatedState = processRound(gameState);
  games.set(roomId, updatedState);
  
  io.to(roomId).emit('round_result', {
    ...updatedState.roundResult,
    scores: updatedState.scores,
    wins: updatedState.wins
  });
  
  setTimeout(() => {
    //previousTurnResultを保存
    let previousTurnResult = null;
    if (updatedState.roundResult) {
      const { winnerIndex, loserIndex, isDraw } = updatedState.roundResult;
      previousTurnResult = {
        winnerIndex: winnerIndex !== undefined ? winnerIndex : -1,
        loserIndex: loserIndex !== undefined ? loserIndex : -1,
        isDraw: isDraw || false
      };
    }

    const nextState = prepareNextTurn(updatedState, previousTurnResult);
    games.set(roomId, nextState);
    
    if (nextState.isGameOver) {
      io.to(roomId).emit('game_over', {
        reason: nextState.gameOverReason,
        finalScores: nextState.scores,
        winner: nextState.scores.indexOf(Math.max(...nextState.scores))
      });
      games.delete(roomId);
    } else {
      // ✅ 新しい手札を各プレイヤーに送信
      nextState.players.forEach((player, idx) => {
        io.to(player.id).emit('hand_update', {
          hand: nextState.hands[idx]
        });
      });
      
      // ✅ ターン情報を全員に送信
      io.to(roomId).emit('turn_update', {
        turnIndex: nextState.turnIndex,
        currentMultiplier: nextState.currentMultiplier,
        fieldCards: nextState.fieldCards,
        scores: nextState.scores
      });
    }
  }, 2000);
}

//Socket.IOイベント処理
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // ルーム作成または参加
  socket.on('join_room', (data) => {
    console.log('[Server] join_room received:', data);
    const playerName = typeof data === 'string' ? data : data.playerName;
    if (!playerName) {
    console.error('[Server] playerName is missing!');
    return;
  }
    let targetRoom = null;

    // 空きのあるルームを探す
    for (const [id, room] of rooms.entries()) {
      if (room.players.length < 3) {
        targetRoom = { roomId: id, room };
        break;
      }
    }

    // なければ新規ルーム作成
    if (!targetRoom) {
      const newRoomId = `room_${Date.now()}`;
      rooms.set(newRoomId, { players: [] });
      targetRoom = { roomId: newRoomId, room: rooms.get(newRoomId) };
    }

    const { roomId, room }= targetRoom;

    // プレイヤー情報追加
    room.players.push({
      id: socket.id,
      name: playerName
    });
    
    socket.join(roomId);
    socket.roomId = roomId;
    
    console.log(`[Server]${playerName} joined ${roomId} (${room.players.length}/3)`);

    // ルーム情報を全員に送信
    io.to(roomId).emit('room_update', {
      roomId,
      players: room.players,
      isFull: room.players.length === 3
    });

    // 3人揃ったら開始通知
    if (room.players.length === 3) {
      console.log('[Server] Room full! Sending game_ready...'); 
      io.to(roomId).emit('game_ready', { roomId });
      
      // ✅ 1秒後にゲーム開始
      setTimeout(() => {
        console.log('[Server] Starting game...');
        startGame(roomId, room);
      }, 1000);
    }
  });


    // カード出す処理
  socket.on('play_card', (data) => {
    const { roomId, cardIndex } = data;
    const gameState = games.get(roomId);
    
    if (!gameState) {
      console.error('[Game] Game not found:', roomId);
      return;
    }
    
    const playerIndex = gameState.players.findIndex(p => p.id === socket.id);
    
    if (playerIndex === -1 || playerIndex !== gameState.turnIndex) {
      console.error('[Game] Invalid turn');
      return;
    }

    // 手札からカードを取り出す
    const card = gameState.hands[playerIndex][cardIndex];
    gameState.hands[playerIndex].splice(cardIndex, 1);
    gameState.fieldCards[playerIndex] = card;
    
    console.log(`[Game] Player ${playerIndex} played:`, card);

    if (playerIndex === 0 && gameState.previousTurnResult) {
  const fees = require('../shared/feeCalculator').calculateAllTableFees(
    gameState.previousTurnResult, 
    gameState.hands.length
  );
  gameState.scores = gameState.scores.map((score, idx) => score - fees[idx]);
  
  // 場代徴収をログ出力
  console.log('[場代] 徴収:', fees, '結果:', gameState.scores);
}


    // 全員に通知
    io.to(roomId).emit('card_played', {
      playerIndex,
      card,
      fieldCards: gameState.fieldCards
    });

    // 次のターンへ
    gameState.turnIndex = (gameState.turnIndex + 1) % 3;
    
    // 3人全員出したか確認
    if (gameState.fieldCards.every(c => c !== null)) {
      setTimeout(() => {
        handleRoundEnd(roomId, gameState);  // ✅ 関数呼び出し
      }, 1500);
    } else {
      io.to(roomId).emit('turn_update', {
        turnIndex: gameState.turnIndex,
        currentMultiplier: gameState.currentMultiplier,
        fieldCards: gameState.fieldCards
      });
    }
  });



  // 切断時の処理
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    if (socket.roomId) {
      const room = rooms.get(socket.roomId);
      if (room) {
        room.players = room.players.filter(p => p.id !== socket.id);
        console.log(`User disconnected from ${socket.roomId} (${room.players.length}/3)`);
        
        if (room.players.length === 0) {
          rooms.delete(socket.roomId);
          games.delete(socket.roomId);
          console.log(`Room ${socket.roomId} deleted`);
        }
      }
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});