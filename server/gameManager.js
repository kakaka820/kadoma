// server/gameManager.js
// ゲーム開始とラウンド処理、場代徴収ロジックを担当

const { initializeGame, processRound, prepareNextTurn } = require('../shared/gameFlow');
const { calculateAllTableFees } = require('../shared/feeCalculator');
const { checkJokerInHands } = require('../shared/joker');
const LOW_DECK_THRESHOLD = 15;


/**
 * 絵札・JOKERかどうかを判定
 */
function isFaceCardOrJoker(card) {
  return ['J', 'Q', 'K', 'JOKER1', 'JOKER2'].includes(card.rank);
}
/**
 * 他プレイヤー用の手札情報を作成（絵札/JOKERのみ表示、他は裏向き）
 */
function createOpponentHandInfo(hand) {
  return hand.map(card => {
    if (isFaceCardOrJoker(card)) {
      return { rank: card.rank, suit: card.suit, visible: true };
    }
    return { visible: false }; // 裏向き
  });
}

/**
 * ゲーム開始処理
 */
function startGame(io, games, roomId, room) {
  console.log(`[Game] Starting game in room ${roomId}`);
  console.log(`[Game] Players:`, room.players);
  
  const gameState = initializeGame(3, 200);
  gameState.roomId = roomId;
  gameState.players = room.players;
  gameState.playerSelections = [false, false, false];
  
  games.set(roomId, gameState);
  console.log(`[Game] GameState created:`, {
    roomId: gameState.roomId,
    hands: gameState.hands.length,
    players: gameState.players.length,
    scores: gameState.scores
  });
  
//全プレイヤーの手札情報を作成
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
}

/**
 * ラウンド終了処理
 */
function handleRoundEnd(io, games, roomId, gameState) {
  const updatedState = processRound(gameState);
  games.set(roomId, updatedState);
  
  io.to(roomId).emit('round_result', {
    ...updatedState.roundResult,
    scores: updatedState.scores,
    wins: updatedState.wins
  });
  
  setTimeout(() => {
    // previousTurnResultを保存
    let previousTurnResult = null;
    if (updatedState.roundResult) {
      const { winnerIndex, loserIndex, isDraw } = updatedState.roundResult;
      previousTurnResult = {
        winnerIndex: winnerIndex !== undefined ? winnerIndex : -1,
        loserIndex: loserIndex !== undefined ? loserIndex : -1,
        isDraw: isDraw || false
      };
    }


    const allHandsEmpty = updatedState.hands.every(h => h.length === 0);
    const isSetEnd = allHandsEmpty && updatedState.setTurnIndex === 4;
    // セット終了時は警告をクリア
    if (isSetEnd) {
      console.log('[警告] セット終了、警告クリア');
      io.to(roomId).emit('clear_warnings');
    }


    const nextState = prepareNextTurn(updatedState, previousTurnResult);

    // 新ターン開始時に場代徴収
    if (previousTurnResult) {
      const fees = calculateAllTableFees(
        previousTurnResult, 
        nextState.hands.length
      );
      nextState.scores = nextState.scores.map((score, idx) => score - fees[idx]);
      console.log('[場代] 新ターン開始時徴収:', fees, '結果:', nextState.scores);
    }
    
    // 選択状態をリセット
    nextState.playerSelections = [false, false, false];
    
    games.set(roomId, nextState);
    
    if (nextState.isGameOver) {
      io.to(roomId).emit('game_over', {
        reason: nextState.gameOverReason,
        finalScores: nextState.scores,
        winner: nextState.scores.indexOf(Math.max(...nextState.scores))
      });
      games.delete(roomId);
    } else {

      //全プレイヤーの手札情報を作成
      const allHandsInfo = createAllHandsInfo(nextState.hands);
      // 新しい手札を各プレイヤーに送信
      nextState.players.forEach((player, idx) => {
        io.to(player.id).emit('hand_update', {
          hand: nextState.hands[idx],
          opponentHands: allHandsInfo
        });
      });
     if (allHandsEmpty) {
        checkAndSendWarnings(io, nextState, nextState.players);
      }
      
      // 新ラウンドの情報を全員に送信
      io.to(roomId).emit('turn_update', {
        currentMultiplier: nextState.currentMultiplier,
        fieldCards: nextState.fieldCards,
        scores: nextState.scores, 
        playerSelections: nextState.playerSelections,
        setTurnIndex: nextState.setTurnIndex,
      });
    }
  }, 2000);
}
function checkAndSendWarnings(io, gameState, players) {
  const { hands, deck } = gameState;
  
  // JOKER配布チェック
  const playersData = hands.map((hand, idx) => ({
    name: players[idx].name,
    hand,
    points: gameState.scores[idx],
    wins: gameState.wins[idx]
  }));
  
  const hasJoker = checkJokerInHands(playersData);
  
  
  // ← JOKER警告を全員に送信（誰か1人でも持ってたら）
  if (hasJoker) {
    io.to(gameState.roomId).emit('warning', {
      type: 'joker_dealt',
      message: '🃏 JOKERが配られました！'
    });
  }
  
  // デッキ残り少ないチェック
  if (deck.length <= LOW_DECK_THRESHOLD && deck.length > 0) {
    io.to(gameState.roomId).emit('warning', {
      type: 'low_deck',
      message: `⚠️ デッキ残り${deck.length}枚！`
    });
  }
}

module.exports = {
  startGame,
  handleRoundEnd,
  checkAndSendWarnings
};
