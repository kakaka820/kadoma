// src/online/components/OnlineGame.tsx
//UIの分岐処理のみ！

import { useSocket } from '../context/SocketContext';
import { useOnlineGameState } from '../hooks/useOnlineGameState';
import { useRoundJudge } from '../hooks/useRoundJudge';
import { useTurnFlow } from '../hooks/useTurnFlow';
import { useCardPlay } from '../hooks/useCardPlay';
import { ConnectionStatus } from './ConnectionStatus';
import { WaitingRoom } from './WaitingRoom';
import { GameBoard } from './GameBoard';
import { useWarnings } from '../hooks/useWarnings';

export function OnlineGame() {
  const { socket, isConnected } = useSocket();
  
  // 状態管理フック
  const {
    roomId,
    playerIndex,
    myHand,
    players,
    gameStatus,
    opponentHands
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

  // カード出す処理
  const { playCard } = useCardPlay({
    socket,
    roomId,
    playerIndex,
    myHand,
    playerSelections,
    setTurnIndex,
  });
  const { warnings, removeWarning } =useWarnings({ socket })

  // UI分岐
  if (!isConnected) {
    return <ConnectionStatus />;
  }

  if (gameStatus === 'waiting') {
    return <WaitingRoom />;
  }

  return (
    <GameBoard
      isConnected={isConnected}
      playerIndex={playerIndex}
      currentMultiplier={currentMultiplier}
      setTurnIndex={setTurnIndex}
      playerSelections={playerSelections}
      players={players}
      scores={scores}
      wins={wins}
      fieldCards={fieldCards}
      roundResult={roundResult}
      myHand={myHand}
      playCard={playCard}
      warnings={warnings}
      removeWarning={removeWarning}
      opponentHands={opponentHands}
    />
  );
}
