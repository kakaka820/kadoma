// src/online/components/OnlineGame.tsx

import { useSocket } from '../context/SocketContext';
import Hand from './Hand';
import Field from './Field';
import { useOnlineGameState } from '../hooks/useOnlineGameState';
import { useRoundJudge } from '../hooks/useRoundJudge';
import { useTurnFlow } from '../hooks/useTurnFlow';


// ✅ shared/joker.jsから直接インポート
// TypeScriptの型定義用
interface JokerModule {
  canPlayJoker: (card: any, setTurnIndex: number) => boolean;
  isJoker: (card: any) => boolean;
}
// ✅ Window型を拡張
declare global {
  interface Window {
    JokerLogic?: JokerModule;
  }
}
// ✅ 動的インポートまたは require を使う
let JokerLogic: JokerModule | null = null;
// Reactコンポーネント外で初期化を試みる
try {
  // Node.js環境（ビルド時）とブラウザ環境の両方に対応
  if (typeof window !== 'undefined' && (window as any).JokerLogic) {
    JokerLogic = (window as any).JokerLogic;
  } else {
    // webpack/Viteが解決してくれる
    JokerLogic = require('../../../shared/joker');
  }
} catch (e) {
  console.warn('[OnlineGame] JokerLogic not loaded yet');
}

export function OnlineGame() {
  const { socket, isConnected } = useSocket();
  
  // カスタムフックで状態管理
  const {
    roomId,
    playerIndex,
    myHand,
    players,
    gameStatus,
  } = useOnlineGameState({ socket });

  const {
    roundResult,
    scores,
    wins,
  } = useRoundJudge({ socket });

  const {
    currentMultiplier,
    fieldCards,
    playerSelections,
    setTurnIndex,
  } = useTurnFlow({ socket });



  // カードを出す
  const playCard = (cardIndex: number) => {
    if (!socket || playerIndex === null || !roomId) return;
    
    // 同時プレイ：すでに選択済みの場合は何もしない
    if (playerSelections[playerIndex]) {
      console.log('[OnlineGame] Already selected a card');
      return;
    }

    // ✅ JOKER制限チェック
    const card = myHand[cardIndex];

    // JokerLogic変数またはwindow.JokerLogicから取得
const jokerModule = JokerLogic || window.JokerLogic;
if (jokerModule && !jokerModule.canPlayJoker(card, setTurnIndex)) {
  console.log('[OnlineGame] JOKERはセットの1ターン目に出せません');
  alert('🃏 JOKERはセットの1ターン目には出せません！');
  return;
}

    console.log('[OnlineGame] Playing card:', cardIndex);
    socket.emit('play_card', {
      roomId,
      cardIndex
    });
  };

  // UI: 接続確認
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl mb-4">サーバーに接続中...</div>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
        </div>
      </div>
    );
  }

  // UI: マッチング待機中
  if (gameStatus === 'waiting') {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl mb-4">マッチング中...</div>
          <div className="text-lg">プレイヤーを待っています</div>
        </div>
      </div>
    );
  }

  // UI: ゲーム画面
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      {/* デバッグ情報 */}
      <div className="mb-4 p-4 bg-gray-800 rounded">
        <div className="text-sm">
          <div>接続状態: {isConnected ? '✅ 接続中' : '❌ 切断'}</div>
          <div>あなた: Player {playerIndex !== null ? playerIndex + 1 : '?'}</div>
          <div>倍率: ×{currentMultiplier}</div>
          <div>セットターン: {setTurnIndex + 1}/5</div> {/* ✅ デバッグ用に追加 */}
          <div>選択状況: {playerSelections.filter(Boolean).length}/3 人選択済み</div>
        </div>
      </div>

      {/* スコア表示 */}
      <div className="mb-8">
        <h2 className="text-2xl mb-4">スコアボード</h2>
        <div className="grid grid-cols-3 gap-4">
          {players.map((name, idx) => (
            <div
              key={idx}
              className={`p-4 rounded ${
                idx === playerIndex
                  ? 'bg-blue-600'
                  : playerSelections[idx]
                  ? 'bg-green-600'
                  : 'bg-gray-700'
              }`}
            >
              <div className="font-bold">{name}</div>
              <div>スコア: {scores[idx]}</div>
              <div>勝利数: {wins[idx]}</div>
              {idx === playerIndex && <div className="text-sm mt-1">（あなた）</div>}
              {playerSelections[idx] && <div className="text-sm mt-1">（選択済み）</div>}
            </div>
          ))}
        </div>
      </div>

      {/* 場札表示 */}
      <div className="mb-8">
        <h2 className="text-2xl mb-4">場札</h2>
        <Field fieldCards={fieldCards}/>
      </div>

      {/* ラウンド結果 */}
      {roundResult && (
        <div className="mb-8 p-4 bg-yellow-600 rounded text-center text-xl">
          {roundResult}
        </div>
      )}

      {/* 手札表示 */}
      <div>
        <h2 className="text-2xl mb-4">あなたの手札</h2>
        <Hand
          cards={myHand}
          onCardClick={playCard}
          disabled={playerIndex === null || playerSelections[playerIndex || 0]}
        />
        {playerIndex !== null && playerSelections[playerIndex] ? (
          <div className="text-center mt-4 text-green-400">
            選択済み - 他のプレイヤーを待っています
          </div>
        ) : (
          <div className="text-center mt-4 text-yellow-400">
            カードを選択してください
          </div>
        )}
      </div>
    </div>
  );
}
