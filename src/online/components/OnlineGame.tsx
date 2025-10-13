// src/online/components/OnlineGame.tsx
//UIの分岐処理のみ！

import { useState } from 'react'; 
import { useSocket } from '../contexts/SocketContext';
import { useOnlineGameState } from '../hooks/useOnlineGameState';
import { useRoundJudge } from '../hooks/useRoundJudge';
import { useTurnFlow } from '../hooks/useTurnFlow';
import { useCardPlay } from '../hooks/useCardPlay';
import { useWarnings } from '../hooks/useWarnings';
import { useDisconnectNotification } from '../hooks/useDisconnectNotification';
import { ConnectionStatus } from './ui/ConnectionStatus';
import { WaitingRoom } from './ui/WaitingRoom';
import { GameBoard } from './game/GameBoard';
import { HomeScreen } from '../screens/HomeScreen';


export function OnlineGame() {
  const { socket, isConnected } = useSocket();
  const [isInRoom, setIsInRoom] = useState(false);
  
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

  //オンライン対戦開始
  const handleStartMatch = () => {
    if (!socket) return;

    const playerName = localStorage.getItem('kadoma_username') || 'Player';
    socket.emit('join_room', { playerName });
    setIsInRoom(true);
  };

  // UI分岐
  if (!isConnected) {
    return <ConnectionStatus />;
  }
  
  //ルームに入ってない → ホーム画面
  if (!isInRoom) {
    return <HomeScreen onStartMatch={handleStartMatch} />;
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
