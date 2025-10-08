//WebSocketサーバーの立ち上げに使う


const express = require('express');
const http = require('http');
const socketIo = require('socket.io');


//Expressアプリーケーションのセットアップ
const app = express();

//httpサーバーの作成
const server = http.createServer(app);

//WebSocket(socket.io)のセットアップ
const io = socketIo(server, {
  cors: {
    origin: "*", // GitHub Pagesからの接続許可
    methods: ["GET", "POST"]
  }
});

// ルーム管理用データ
const rooms = {};

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // ルーム作成または参加
  socket.on('join_room', (playerName) => {
    let roomId = null;

    // 空きのあるルームを探す
    for (const [id, room] of Object.entries(rooms)) {
      if (room.players.length < 3) {
        roomId = id;
        break;
      }
    }

    // なければ新規ルーム作成
    if (!roomId) {
      roomId = `room_${Date.now()}`;
      rooms[roomId] = { players: [] };
    }

    // プレイヤー情報追加
    const player = {
      id: socket.id,
      name: playerName,
      position: rooms[roomId].players.length // 0, 1, 2
    };

    rooms[roomId].players.push(player);
    socket.join(roomId);
    socket.roomId = roomId;

    console.log(`${playerName} joined ${roomId} (${rooms[roomId].players.length}/3)`);

    // ルーム情報を全員に送信
    io.to(roomId).emit('room_update', {
      roomId,
      players: rooms[roomId].players,
      isFull: rooms[roomId].players.length === 3
    });

    // 3人揃ったら開始通知
    if (rooms[roomId].players.length === 3) {
      io.to(roomId).emit('game_ready', {
        message: '3人揃いました！ゲーム開始準備完了',
        players: rooms[roomId].players
      });
    }
  });

  // 切断時の処理
  socket.on('disconnect', () => {
    const roomId = socket.roomId;
    if (roomId && rooms[roomId]) {
      // プレイヤーを削除
      rooms[roomId].players = rooms[roomId].players.filter(p => p.id !== socket.id);
      
      console.log(`User disconnected from ${roomId} (${rooms[roomId].players.length}/3)`);

      // 空になったら部屋削除
      if (rooms[roomId].players.length === 0) {
        delete rooms[roomId];
      } else {
        // 残りのプレイヤーに通知
        io.to(roomId).emit('room_update', {
          roomId,
          players: rooms[roomId].players,
          isFull: false
        });
      }
    }
  });
});

server.listen(4000, () => {
  console.log('Server is running on http://localhost:4000');
});
