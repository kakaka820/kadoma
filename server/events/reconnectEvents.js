//server/events/reconnectEvents.js
//復帰処理担当


const { handleRoundEnd } = require('../gameManager');
const { TURN_TIME_LIMIT } = require('../../shared/config');

function setupReconnectEvents(socket, io, rooms, games) {

    //待機室復帰処理
  socket.on('rejoin_waiting_room', ({ roomId, userId }) => {
    console.log(`[Reconnect] rejoin_waiting_room: ${userId} → ${roomId}`);
    
    const room = rooms.get(roomId);
    
    if (!room) {
      socket.emit('rejoin_failed', { 
        message: 'ルームが見つかりません（既にゲームが開始された可能性があります）' 
      });
      return;
    }
    
    // プレイヤーを検索
    const playerIndex = room.players.findIndex(p => p.userId === userId);
    
    if (playerIndex === -1) {
      socket.emit('rejoin_failed', { 
        message: 'プレイヤー情報が見つかりません' 
      });
      return;
    }
    
    // socket.id を更新（リロード後の新しい socket）
    room.players[playerIndex].id = socket.id;
    socket.join(roomId);
    socket.roomId = roomId;
    
    // 成功通知
    socket.emit('rejoin_waiting_success', {
      roomId,
      players: room.players.map(p => p.name),
      isFull: room.players.length === 3
    });
    
    // 全員に更新通知
    io.to(roomId).emit('room_update', {
      roomId,
      players: room.players,
      isFull: room.players.length === 3
    });
    
    console.log(`[Reconnect] Player ${userId} rejoined waiting room`);
  });

  

  // リロード後の復帰処理
  socket.on('rejoin_game', ({ roomId, userId }) => {
    console.log(`[Reconnect] rejoin_game: ${userId} → ${roomId}`);
    
    // userId で全ゲームから検索
    let targetRoomId = null;
    let playerIndex = -1;
    let disconnectInfo = null;
    
    for (const [gameRoomId, gameState] of games.entries()) {
      if (!gameState.disconnectedPlayers) continue;
      
      const info = gameState.disconnectedPlayers[userId];
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
    delete gameState.disconnectedPlayers[userId];
    
    socket.join(targetRoomId);

    // タイマー残り時間を計算
    let timeRemaining = 0;
    let timeLimit = TURN_TIME_LIMIT;
    
    if (gameState.turnTimerEndTime) {
      const now = Date.now();
      const remaining = gameState.turnTimerEndTime - now;
      timeRemaining = Math.max(0, Math.ceil(remaining / 1000));
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

    // 全員選択済みなら次のターンに進む
    if (gameState.playerSelections.every(Boolean)) {
      handleRoundEnd(io, games, targetRoomId, gameState, rooms);
    }
  });
}

module.exports = { setupReconnectEvents };