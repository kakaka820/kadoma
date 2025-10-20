// server/disconnectHandler.js
// 切断・復帰処理の管理

const { createBotPlayer, BOT_STRATEGIES, botAutoPlay } = require('./botPlayer');
const { RECONNECT_WAIT_TIME } = require('../shared/config');

/**
 * プレイヤー切断時の処理（ゲーム中）
 * @param {Object} io - Socket.IO インスタンス
 * @param {Map} rooms - ルーム管理Map
 * @param {Map} games - ゲーム状態Map
 * @param {Object} socket - 切断したSocket
 */
function handlePlayerDisconnect(io, rooms, games, socket) {
  console.log('[Disconnect] Player disconnected:', socket.id);

  if (!socket.roomId) return;

  const room = rooms.get(socket.roomId);
  const gameState = games.get(socket.roomId);

  if (!room) return;

  const playerIndex = room.players.findIndex(p => p.id === socket.id);
  if (playerIndex === -1) return;

  // ゲーム中の場合
  if (gameState && !gameState.isGameOver) {
    console.log(`[Disconnect] Player ${playerIndex} disconnected during game`);

    const disconnectedPlayer = room.players[playerIndex];
    
    //代理Botに切り替え
    const botReplacement = createBotPlayer(
      `bot_replacement_${socket.id}`,
      playerIndex + 1,
      BOT_STRATEGIES.RANDOM,
      true
    );

    //追加情報
    botReplacement.isReplacement = true; // ← 代替Bot フラグ
    botReplacement.originalPlayerId = socket.id; // ← 元のプレイヤーID
    botReplacement.originalPlayerName = disconnectedPlayer.name; // ← 元の名前
    botReplacement.disconnectedAt = Date.now(); // ← 切断時刻

    room.players[playerIndex] = botReplacement;
    gameState.players[playerIndex] = botReplacement;

    console.log(`[Disconnect] Replaced Player ${playerIndex} with Bot`);

    // 全員に通知
    io.to(socket.roomId).emit('player_disconnected', {
      playerIndex,
      playerName: disconnectedPlayer.name,
      botName: botReplacement.name
    });

    //まだカード選択してなければ即座に選択
    if (!gameState.playerSelections[playerIndex]) {
      console.log(`[Disconnect] Triggering proxy bot for player ${playerIndex}`);
      // handleRoundEnd を取得
      //handleRoundEnd を wrapper 関数でラップ
      const handleRoundEndWrapper = (io, games, roomId, gameState) => {
        const { handleRoundEnd } = require('./roundHandler');
        handleRoundEnd(io, games, roomId, gameState);
      };
      
      botAutoPlay(
        io, 
        games, 
        socket.roomId, 
        playerIndex, 
        handleRoundEndWrapper, 
        true
      );
    }

    // 復帰待機タイマー（ゲーム終了まで）
    gameState.disconnectedPlayers = gameState.disconnectedPlayers || {};
    console.log(`[Disconnect] Saving disconnectInfo:`, {
  playerIndex,
  originalName: disconnectedPlayer.name,
  userId: disconnectedPlayer.userId,
  disconnectedAt: Date.now()
});
    gameState.disconnectedPlayers[disconnectedPlayer.userId] = {
      playerIndex,
      originalName: disconnectedPlayer.name,
      userId: disconnectedPlayer.userId,
      disconnectedAt: Date.now(),
      socketId: socket.id
    };

  } else {
    // ゲーム前の切断
    room.players = room.players.filter(p => p.id !== socket.id);
    console.log(`[Disconnect] Player removed from waiting room (${room.players.length}/3)`);

    if (room.players.length === 0) {
      rooms.delete(socket.roomId);
      games.delete(socket.roomId);
      console.log(`[Disconnect] Room ${socket.roomId} deleted`);
    }
  }
}

/**
 * プレイヤー復帰処理
 * @param {Object} io - Socket.IO インスタンス
 * @param {Map} rooms - ルーム管理Map
 * @param {Map} games - ゲーム状態Map
 * @param {Object} socket - 復帰したSocket
 * @param {string} roomId - 部屋ID
 */
function handlePlayerReconnect(io, rooms, games, socket, roomId) {
  const room = rooms.get(roomId);
  const gameState = games.get(roomId);

  if (!room || !gameState) {
    socket.emit('reconnect_failed', { reason: 'ゲームが終了しました' });
    return;
  }

  //socket.id ではなく、全エントリを見て original を探す
  let disconnectInfo = null;
  let userIdKey = null;
  
  for (const [key, info] of Object.entries(gameState.disconnectedPlayers || {})) {
    if (info.socketId === socket.id || key === socket.id) {
      disconnectInfo = info;
      userIdKey = key;
      break;
    }
  }

  if (!disconnectInfo) {
    socket.emit('reconnect_failed', { reason: '切断情報が見つかりません' });
    return;
  }

  const playerIndex = disconnectInfo.playerIndex;
  const currentPlayer = room.players[playerIndex];

  // Bot代替中か確認
  if (currentPlayer.isReplacement && currentPlayer.originalPlayerId === socket.id) {
    console.log(`[Reconnect] Player ${playerIndex} reconnected!`);

    // 元のプレイヤーに戻す
    const restoredPlayer = {
      id: socket.id,
      name: disconnectInfo.originalName,
      isBot: false,
      userId: disconnectInfo.userId
    };

    room.players[playerIndex] = restoredPlayer;
    gameState.players[playerIndex] = restoredPlayer;

    //disconnectedPlayers から削除（userIdKey を使う）
    if (userIdKey) {
      delete gameState.disconnectedPlayers[userIdKey];
    }

    // ルームに再参加
    socket.join(roomId);
    socket.roomId = roomId;

    //タイマー残り時間を計算
    const { TURN_TIME_LIMIT } = require('../shared/config');
    let timeRemaining = 0;
    let timeLimit = TURN_TIME_LIMIT;

    if (gameState.turnTimerEndTime) {
      const now = Date.now();
      const remaining = gameState.turnTimerEndTime - now;
      timeRemaining = Math.max(0, Math.ceil(remaining / 1000));
      console.log(`[Reconnect] Timer remaining: ${timeRemaining}s`);
    }

    // 復帰成功通知
    socket.emit('reconnect_success', {
      playerIndex,
      gameState: {
        hand: gameState.hands[playerIndex],
        scores: gameState.scores,
        wins: gameState.wins,
        currentMultiplier: gameState.currentMultiplier,
        fieldCards: gameState.fieldCards,
        playerSelections: gameState.playerSelections,
        setTurnIndex: gameState.setTurnIndex,
        timeRemaining: timeRemaining,
        timeLimit: timeLimit
      }
    });

    // 全員に通知
    io.to(roomId).emit('player_reconnected', {
      playerIndex,
      playerName: disconnectInfo.originalName
    });

    console.log(`[Reconnect] Player ${playerIndex} successfully reconnected`);
  } else {
    socket.emit('reconnect_failed', { reason: 'すでに他のプレイヤーが参加しています' });
  }
}

module.exports = {
  handlePlayerDisconnect,
  handlePlayerReconnect
};