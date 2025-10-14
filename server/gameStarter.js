// server/gameStarter.js
// ゲーム開始処理

const { initializeGame } = require('../shared/core/gameFlow');
const { ANTE_MULTIPLIER } = require('../shared/config');
const { createAllHandsInfo } = require('../shared/utils/handUtils');
const { checkAndSendWarnings } = require('./warningSystem');
const { startTurnTimer } = require('./turnTimer');
const { botAutoPlay } = require('./botPlayer');

/**
 * ゲーム開始処理
 */
function startGame(io, games, roomId, room, handleRoundEndCallback) {
  console.log(`[Game] Starting game in room ${roomId}`);
  console.log(`[Game] Players:`, room.players);
  
  const gameState = initializeGame(3, ANTE_MULTIPLIER);
  gameState.roomId = roomId;
  gameState.players = room.players;
  gameState.playerSelections = [false, false, false];


//プレイヤー情報に userId を追加
  room.players.forEach((player, idx) => {
    if (!player.isBot && player.userId) {
       gameState.players[idx].userId = player.userId;
        console.log(`[Game] Player ${idx} userId:`, socket.userId);
      }
    }
  );
  
  games.set(roomId, gameState);
  console.log(`[Game] GameState created:`, {
    roomId: gameState.roomId,
    hands: gameState.hands.length,
    players: gameState.players.length,
    scores: gameState.scores
  });



  
  games.set(roomId, gameState);
  console.log(`[Game] GameState created:`, {
    roomId: gameState.roomId,
    hands: gameState.hands.length,
    players: gameState.players.length,
    scores: gameState.scores
  });
  
  // 全プレイヤーの手札情報を作成
  const allHandsInfo = createAllHandsInfo(gameState.hands);

  // 各プレイヤーに手札送信
  room.players.forEach((player, idx) => {
    console.log(`[Game] Sending game_start to ${player.name} (${player.id})`);
    io.to(player.id).emit('game_start', {
      roomId,
      playerIndex: idx,
      hand: gameState.hands[idx],
      players: room.players.map(p => p.name),
      scores: gameState.scores,
      opponentHands: allHandsInfo
    });
  });
  
  checkAndSendWarnings(io, gameState, room.players);
  
  // 全員にゲーム状態を送信
  io.to(roomId).emit('turn_update', {
    currentMultiplier: gameState.currentMultiplier,
    fieldCards: gameState.fieldCards,
    scores: gameState.scores,
    playerSelections: gameState.playerSelections,
    setTurnIndex: gameState.setTurnIndex,
  });

  // タイマー開始
  startTurnTimer(io, games, roomId, handleRoundEndCallback);

  // Botプレイヤーに自動選択させる
  gameState.players.forEach((player, idx) => {
    if (player.isBot) {
      botAutoPlay(io, games, roomId, idx, handleRoundEndCallback);
    }
  });
}

module.exports = {
  startGame
};