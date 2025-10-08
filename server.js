//WebSocketサーバーの立ち上げにつかう！！！！

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

// Expressアプリケーションのセットアップ
const app = express();

// httpサーバーの作成
const server = http.createServer(app);

// WebSocket（socket.io）のセットアップ
const io = socketIo(server);

// クライアントからの接続を待機
io.on('connection', (socket) => {
  console.log('a user connected');

  // メッセージの受信
  socket.on('send_message', (message) => {
    console.log('Received message:', message);
    // 受け取ったメッセージを全クライアントに送信
    io.emit('receive_message', message);
  });

  // 切断時の処理
  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

// サーバーを指定したポート（3000）で起動
server.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
