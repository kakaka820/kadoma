// server/cardHandler.js
// カード出す処理、JOKER制限チェック、カード選択の管理担当

const { botAutoPlay } = require('./botPlayer');
const { CARD_REVEAL_DELAY_MS } = require('../shared/config');

/**
 * カード出す処理（同時プレイ版）
 */
function handlePlayCard(io, games, socket, data, handleRoundEndCallback) {
  const { roomId, cardIndex } = data;
  const gameState = games.get(roomId);
  
  if (!gameState) {
    console.error('[Game] Game not found:', roomId);
    return;
  }
  
  const playerIndex = gameState.players.findIndex(p => p.id === socket.id);
  
  if (playerIndex === -1) {
    console.error('[Game] Player not found');
    return;
  }
  
  // すでに選択済みの場合は無視
  if (gameState.playerSelections[playerIndex]) {
    console.error('[Game] Player already selected');
    return;
  }

  // 手札からカードを取り出す
  const card = gameState.hands[playerIndex][cardIndex];

  // サーバー側でJOKER制限チェック
  if (card.rank && card.rank.startsWith('JOKER') && gameState.setTurnIndex === 0) {
    console.error('[Game] JOKER cannot be played in first turn of set');
    socket.emit('error', { message: 'JOKERはセットの1ターン目に出せません' });
    return;
  }

  gameState.hands[playerIndex].splice(cardIndex, 1);
  gameState.fieldCards[playerIndex] = card;
  gameState.playerSelections[playerIndex] = true;
  
  console.log(`[Game] Player ${playerIndex} played:`, card);


  

  // 選択状態を送信
  io.to(roomId).emit('turn_update', {
    currentMultiplier: gameState.currentMultiplier,
    scores: gameState.scores,
    playerSelections: gameState.playerSelections
  });
  
  // 全員選択したか確認
  if (gameState.playerSelections.every(Boolean)) {
    console.log('[Game] All players selected, revealing cards');
    //場札と一緒にプレイヤーの手札も送信
    gameState.players.forEach((player, idx) => {
    console.log(`[Game] Sending to ${player.id}:`, {
      fieldCards: gameState.fieldCards,
      hand: gameState.hands[idx]
    });
    
    io.to(player.id).emit('cards_revealed', {
      fieldCards: gameState.fieldCards,
      hand: gameState.hands[idx]
    });
  });
    setTimeout(() => {
      handleRoundEndCallback(roomId, gameState);
    }, CARD_REVEAL_DELAY_MS);
  }
}

module.exports = {
  handlePlayCard
};
