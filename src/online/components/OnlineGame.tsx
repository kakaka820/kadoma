// src/online/components/OnlineGame.tsx
//UIの分岐処理のみ！

import { useSocket } from '../context/SocketContext';
import { useOnlineGameState } from '../hooks/useOnlineGameState';
import { useRoundJudge } from '../hooks/useRoundJudge';
import { useTurnFlow } from '../hooks/useTurnFlow';
import { useCardPlay } from '../hooks/useCardPlay';
import { useWarnings } from '../hooks/useWarnings';
import { useDisconnectNotification } from '../hooks/useDisconnectNotification';
import { ConnectionStatus } from './ui/ConnectionStatus';
import { WaitingRoom } from './ui/WaitingRoom';
import { GameBoard } from './game/GameBoard';


export function OnlineGame() {
  const { socket, isConnected } = useSocket();
  
  // 状態管理フック
  const {
    roomId,
    playerIndex,
    myHand,
    players,
    gameStatus,
    opponentHands,
  } = useOnlineGameState({ socket });

  const {
    roundResult,
    scores,
    wins,
    isShowdown,
  } = useRoundJudge({ socket });

  const {
    currentMultiplier,
    fieldCards,
    playerSelections,
    setTurnIndex,
    timeRemaining,
    timeLimit,
  } = useTurnFlow({ socket });

  //カードを出す処理でついでにselectedCardIndex を取得
  const { playCard, selectedCardIndex } = useCardPlay({
    socket,
    roomId,
    playerIndex,
    myHand,
    playerSelections,
    setTurnIndex,
  });

  const { warnings, removeWarning } =useWarnings({ socket });
  const { notification } = useDisconnectNotification({ socket });

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
      isShowdown={isShowdown}
      selectedCardIndex={selectedCardIndex}
      warnings={warnings}
      removeWarning={removeWarning}
      opponentHands={opponentHands}
      timeRemaining={timeRemaining}
      timeLimit={timeLimit}
      disconnectNotification={notification}
    />
  );
}
