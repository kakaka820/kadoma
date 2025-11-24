// server/roundHandler.js
// ラウンド終了処理
//server/round\に全部移植したのでもう削除してもいいはず（2025/11/24）

const { saveGameHistory } = require('./gameHistory');
const { processRound, prepareNextTurn } = require('../shared/core/gameFlow');
const { calculateAllTableFees } = require('../shared/utils/feeCalculator');
const { ROUND_RESULT_DISPLAY_MS } = require('../shared/config');
const { createAllHandsInfo } = require('../shared/utils/handUtils');
const { checkAndSendWarnings } = require('./warningSystem');
const { startTurnTimer } = require('./turnTimer');
const { botAutoPlay } = require('./bot/botPlayer');
const { distributeGameReward } = require('./utils/currencyHelper');
const { supabase } = require('./supabaseClient');
const { updateQuestProgress } = require('./utils/questManager');
const { checkAndGrantDailyBonus } = require('./utils/dailyBonus');



async function distributeChips(gameState) {
  // マルチ部屋でない場合はスキップ
  if (!gameState.roomConfig) {
    return null;
  }
  
  const results = [];
  
  for (let i = 0; i < gameState.players.length; i++) {
    const player = gameState.players[i];
    const score = gameState.scores[i];
    // Botはスキップ
    if (player.isBot || !player.userId) {
      continue;
    }
    
    // 得点が+の場合のみチップ配分
     //profit = max(0, finalScore)
    const profit = Math.max(0, score);
    
    //profit だけをユーザーに配分
    if (profit > 0) {
      await distributeGameReward(player.userId, gameState.roomId, profit);
    }
    
    results.push({
      userId: player.userId,
      profit: profit
    });
  }
  
  return results;
}

/**
 * 次のターンを準備・実行する共通処理
 */
async function performNextTurn(io, games, roomId, state, rooms) {
  // ★ Step 1: previousTurnResult を作成
  let previousTurnResult = null;
  if (state.roundResult) {
    const { winnerIndex, loserIndex, isDraw } = state.roundResult;
    previousTurnResult = {
      winnerIndex: winnerIndex !== undefined ? winnerIndex : -1,
      loserIndex: loserIndex !== undefined ? loserIndex : -1,
      isDraw: isDraw || false
    };
  }

// ★ Step 2: 手札が空か判定
  const allHandsEmpty = state.hands.every(h => h.length === 0);
  const isSetEnd = allHandsEmpty && state.setTurnIndex === 4;
  
  // ★ Step 3: セット終了時は警告クリア
  if (isSetEnd) {
    console.log('[警告] セット終了、警告クリア');
    io.to(roomId).emit('clear_warnings');
  }
  // ★ Step 4: 次のターン状態を作成
  const nextState = prepareNextTurn(state, previousTurnResult);

// ★ Step 5: 場代を計算・徴収
  if (previousTurnResult) {
    console.log('[DEBUG] state.roomConfig:', state.roomConfig);
    const ante = state.roomConfig?.ante || ANTE;
    console.log('[DEBUG] ante:', ante);
    const fees = calculateAllTableFees(previousTurnResult, nextState.hands.length, ante);
    nextState.scores = nextState.scores.map((score, idx) => score - fees[idx]);
    console.log('[場代] 新ターン開始時徴収:', fees, 'ante:', ante, '結果:', nextState.scores);
  }
  
  // ★ Step 6: 選択状態をリセット
  nextState.playerSelections = [false, false, false];
  
  // ★ Step 7: ゲーム状態を保存
  games.set(roomId, nextState);

  //切断情報をクリア（新しいラウンド開始時）
  nextState.disconnectedPlayers = state.disconnectedPlayers || {};



// ★ Step 8: ゲーム終了か判定
  if (nextState.isGameOver) {
    console.log('[GameOver] nextState.roomConfig:', nextState.roomConfig);
    console.log('[GameOver] Full nextState:', JSON.stringify({
    roomConfig: nextState.roomConfig,
    isGameOver: nextState.isGameOver,
    gameOverReason: nextState.gameOverReason
  }));

   // フレンド戦フラグをチェック
  const isFriendBattle = nextState.config?.isFriendBattle || false;
  console.log('[GameOver] isFriendBattle:', isFriendBattle);

    // ゲーム終了処理

    // ランキングを計算
  const rankings = nextState.players
    .map((player, index) => ({
      playerIndex: index,
      userId: player.userId,
      buyIn: player.buyIn || nextState.roomConfig?.requiredChips || 1000,
      finalScore: nextState.scores[index],
      profit: nextState.scores[index] - (player.buyIn || nextState.roomConfig?.requiredChips || 1000),
      isDisconnected: player.isBot && player.isProxy  // 代理Botかチェック
    }))
    .sort((a, b) => b.finalScore - a.finalScore)  // スコア順にソート
    .map((player, index) => ({
      ...player,
      rank: player.isDisconnected ? null : index + 1  // 切断なら null、それ以外は順位
    }));

    console.log('[GameOver] rankings:', rankings);

    // フレンド戦の場合は通貨処理をスキップ
  let chipResults = null;
  let dailyBonusResults = null;
  let updatedCurrencies = {};



  // processDailyBonuses 関数を先に定義
  async function processDailyBonuses(gameState) {
  const bonusResults = {};
  
  for (let i = 0; i < gameState.players.length; i++) {
    const player = gameState.players[i];
    
    // Botまたは切断済みプレイヤーはスキップ
    if (player.isBot || !player.userId) {
      continue;
    }
    
    // デイリーボーナスをチェック・付与
    const bonusResult = await checkAndGrantDailyBonus(player.userId);
    bonusResults[player.userId] = bonusResult;
    
    console.log(`[DailyBonus] User ${player.userId}:`, bonusResult);
  }
  
  return bonusResults;
}

    if (!isFriendBattle) {
    // 通常戦のみチップ配分
    chipResults = await distributeChips(nextState);
    dailyBonusResults = await processDailyBonuses(nextState);

if (chipResults) {
  for (const result of chipResults) {
    if (result.userId) {
      // DBから最新の currency を取得
      const { data, error } = await supabase
        .from('users')
        .select('currency')
        .eq('id', result.userId)
        .single();
      
      if (data && !error) {
        updatedCurrencies[result.userId] = data.currency;
        console.log(`[GameOver] Updated currency for ${result.userId}: ${data.currency}`);
      } else {
        console.error(`[GameOver] Failed to get currency for ${result.userId}:`, error);
      }
    }
  }
}

console.log('[GameOver] updatedCurrencies:', updatedCurrencies);

console.log('[GameOver] updatedCurrencies:', updatedCurrencies);
    saveGameHistory(roomId, nextState, rankings).catch(err => {
      console.error('[game_over] 履歴保存失敗:', err);
    });


    // クエスト進捗を更新
    for (const ranking of rankings) {
      const player = nextState.players[ranking.playerIndex];
      
      // Bot または切断済みプレイヤーはスキップ
      if (player.isBot || !player.userId) {
        continue;
      }
      
      const userId = player.userId;
      
      // 1. プレイ回数更新
      await updateQuestProgress(userId, 'play_games', 1);
      console.log(`[Quest] User ${userId}: play_games +1`);
      
      // 2. 勝利判定（profit >= 0）
      if (ranking.profit >= 0) {
        await updateQuestProgress(userId, 'win_games', 1);
        console.log(`[Quest] User ${userId}: win_games +1`);
      }
      
      // 3. チップ獲得量更新（累計）
      if (ranking.profit > 0) {
        await updateQuestProgress(userId, 'earn_chips', ranking.profit);
        // 4. 1戦でのチップ獲得（単発）
        await updateQuestProgress(userId, 'earn_chips_single', ranking.profit);
        console.log(`[Quest] User ${userId}: earn_chips +${ranking.profit}`);
      }
    }

    } else {
    // フレンド戦の場合
    console.log('[GameOver] Friend battle - skipping currency, daily bonus, and quest updates');
    
    // フレンド戦用の履歴を保存（isFriendBattle フラグ付き）
    saveGameHistory(roomId, nextState, rankings, true).catch(err => { // ← 第4引数に true
      console.error('[game_over] Friend battle history save failed:', err);
    });
  }










  
    //ゲーム終了通知
    io.to(roomId).emit('game_over', {
      reason: nextState.gameOverReason,
      finalScores: nextState.scores,
      winner: nextState.scores.indexOf(Math.max(...nextState.scores)),
      chipResults: chipResults,
      roomConfig: nextState.roomConfig,
      updatedCurrencies: updatedCurrencies,
      dailyBonusResults: dailyBonusResults,
      isFriendBattle: isFriendBattle
    });
     games.delete(roomId);
     rooms.delete(roomId);
     console.log(`[GameOver] Room ${roomId} deleted from rooms and games`);
  } else {

// ★ Step 9: 手札を送信
    const allHandsInfo = createAllHandsInfo(nextState.hands);
    nextState.players.forEach((player, idx) => {
      io.to(player.id).emit('hand_update', {
        hand: nextState.hands[idx],
        opponentHands: allHandsInfo
      });
    });
    
    // ★ Step 10: 警告を送信
    if (allHandsEmpty) {
      checkAndSendWarnings(io, nextState, nextState.players);
    }

// ★ Step 11: ターン情報を送信
    io.to(roomId).emit('turn_update', {
      currentMultiplier: nextState.currentMultiplier,
      fieldCards: nextState.fieldCards,
      scores: nextState.scores, 
      playerSelections: nextState.playerSelections,
      setTurnIndex: nextState.setTurnIndex,
    });
    
    // ★ Step 12: タイマー開始
    startTurnTimer(io, games, roomId, (io, games, roomId, gameState) => {
    handleRoundEnd(io, games, roomId, gameState, rooms);
    });
    // ★ Step 13: Botの自動選択
    nextState.players.forEach((player, idx) => {
  if (player.isBot) {
    botAutoPlay(io, games, roomId, idx, (io, games, roomId, gameState) => {
      handleRoundEnd(io, games, roomId, gameState, rooms);
     });
   }
  });
 }
}




/**
 * ラウンド終了処理
 */
function handleRoundEnd(io, games, roomId, gameState, rooms) {
  
//gameStateチェック
   if (!gameState) {
    console.error('[roundHandler] gameState is undefined for room:', roomId);
    return;
  }



  if (gameState.turnTimer) {
    clearTimeout(gameState.turnTimer);
    gameState.turnTimer = null;
  }
  
const playerNames = gameState.players.map(player => {
    if (player.isBot) {
      return player.name || 'Bot';
    }
    return player.username || player.name || 'Player';
  });
  
  console.log('[handleRoundEnd] playerNames:', playerNames);


  const updatedState = processRound(gameState, playerNames);
  games.set(roomId, updatedState);
  
  io.to(roomId).emit('round_result', {
    ...updatedState.roundResult,
    scores: updatedState.scores,
    wins: updatedState.wins
  });

  //全員選択済みなら即座に次のラウンド開始
if (updatedState.playerSelections.every(Boolean)) {
    console.log('[roundHandler] All players selected, starting next turn immediately');
    performNextTurn(io, games, roomId, updatedState, rooms);
  } else {
    //通常：結果表示後に実行
    setTimeout(() => {
      performNextTurn(io, games, roomId, updatedState, rooms);
    }, ROUND_RESULT_DISPLAY_MS);
  }
}

module.exports = {
  handleRoundEnd
};