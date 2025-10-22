// server/gameStarter.js
// ゲーム開始処理

const { initializeGame } = require('../shared/core/gameFlow');
const { ANTE,ANTE_MULTIPLIER, MAX_JOKER_COUNT } = require('../shared/config');
const { createAllHandsInfo } = require('../shared/utils/handUtils');
const { checkAndSendWarnings } = require('./warningSystem');
const { startTurnTimer } = require('./turnTimer');
const { botAutoPlay } = require('./bot/botPlayer');

/**
 * ゲーム開始処理
 */
function startGame(io, games, roomId, room, handleRoundEndCallback) {
  console.log(`[Game] Starting game in room ${roomId}`);
  console.log(`[Game] Players:`, room.players);

  //部屋設定から値を取得（デフォルト値も設定）
  const anteMultiplier = room.roomConfig?.anteMultiplier || ANTE_MULTIPLIER;
  const maxJokerCount = room.roomConfig?.maxJokerCount || MAX_JOKER_COUNT;
  const ante = room.roomConfig?.ante || ANTE;
  
  console.log(`[Game] Room config:`, {
    id: room.roomConfig?.id, 
    ante,
    anteMultiplier,
    maxJokerCount,
    requiredChips: room.roomConfig?.requiredChips
  });

  //ゲーム初期化
  const gameState = initializeGame(3, anteMultiplier);
  gameState.roomId = roomId;
  gameState.players = room.players;
  gameState.playerSelections = [false, false, false];

  //部屋設定を gameState に保存
  gameState.roomConfig = {
    id: room.roomConfig?.id || 'normal',
    ante,
    anteMultiplier,
    maxJokerCount,
    requiredChips: room.roomConfig?.requiredChips || (ante * anteMultiplier)
  };


//プレイヤー情報
  room.players.forEach((player, idx) => {
    if (!player.isBot && player.userId) {
       gameState.players[idx].userId = player.userId;
        console.log(`[Game] Player ${idx} userId:`, player.userId);
      gameState.players[idx].buyIn = player.buyIn;
      console.log(`[Game] Player ${idx} buyIn:`, player.buyIn);
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