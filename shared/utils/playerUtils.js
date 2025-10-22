// utils/playerUtils.js
//プレイヤー検索（まだ参照まではしてない）


/**
 * プレイヤーのインデックスを検索
 */
function findPlayerIndex(players, socketId) {
  return players.findIndex(p => p.id === socketId);
}

/**
 * プレイヤーのユーザーIDで検索
 */
function findPlayerByUserId(players, userId) {
  return players.find(p => p.userId === userId);
}

/**
 * Botプレイヤーのみを抽出
 */
function getBotPlayers(players) {
  return players.filter(p => p.isBot);
}

/**
 * 人間プレイヤーのみを抽出
 */
function getHumanPlayers(players) {
  return players.filter(p => !p.isBot);
}

module.exports = {
  findPlayerIndex,
  findPlayerByUserId,
  getBotPlayers,
  getHumanPlayers
};