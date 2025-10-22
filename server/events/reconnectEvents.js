//server/events/reconnectEvents.js
//復帰処理担当


const { handlePlayerReconnect } = require('../disconnectHandler');
const { handleRoundEnd } = require('../gameManager');
const { TURN_TIME_LIMIT } = require('../../shared/config');

function setupReconnectEvents(socket, io, rooms, games) {
  // 復帰処理（切断→再接続）
  socket.on('reconnect_to_game', (data) => {
    handlePlayerReconnect(io, rooms, games, socket, data.roomId);
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