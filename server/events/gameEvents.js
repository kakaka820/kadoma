// server/events/gameEvents.js
//ゲームプレイ担当


const { handlePlayCard } = require('../cardHandler');
const { handleRoundEnd } = require('../gameManager');

function setupGameEvents(socket, io, rooms, games) {
  // カード出す処理
  socket.on('play_card', (data) => {
    handlePlayCard(
      io, 
      games, 
      socket, 
      data, 
      (io, games, roomId, gameState) => handleRoundEnd(io, games, roomId, gameState, rooms)
    );
  });
}

module.exports = { setupGameEvents };