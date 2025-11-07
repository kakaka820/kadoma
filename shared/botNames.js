// shared/botNames.js
// Bot の名前リスト

const BOT_NAMES = [
  'さくら',
  'かえで',
  'すみれ',
  'ゆず',
  'もみじ',
  'うめ',
  'ききょう',
  'ふじ',
  'あやめ',
  'なでしこ',
  'つばき',
  'はぎ',
];

/**
 * ランダムにBot名を取得
 * @param {Array<string>} usedNames - すでに使われている名前のリスト
 * @returns {string} Bot名
 */
function getRandomBotName(usedNames = []) {
  // まだ使われていない名前をフィルター
  const availableNames = BOT_NAMES.filter(name => !usedNames.includes(name));
  
  // 全部使われてたら重複を許可
  const namePool = availableNames.length > 0 ? availableNames : BOT_NAMES;
  
  // ランダムに選択
  const randomIndex = Math.floor(Math.random() * namePool.length);
  return namePool[randomIndex];
}

// CommonJS (Node.js用)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    BOT_NAMES,
    getRandomBotName,
  };
}

// ES Module (ブラウザ用)
if (typeof window !== 'undefined') {
  window.BotNames = {
    BOT_NAMES,
    getRandomBotName,
  };

}
