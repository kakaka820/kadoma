// src/online/components/OnlineGame.tsx
//UIの分岐処理のみ！

import { useState, useEffect } from 'react'; 
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../contexts/AuthContext'; 
import { useOnlineGameState } from '../hooks/useOnlineGameState';
import { useRoundJudge } from '../hooks/useRoundJudge';
import { useTurnFlow } from '../hooks/useTurnFlow';
import { useCardPlay } from '../hooks/useCardPlay';
import { useWarnings } from '../hooks/useWarnings';
import { useDisconnectNotification } from '../hooks/useDisconnectNotification';
import { useRejoinGame } from '../hooks/useRejoinGame';
import { ConnectionStatus } from './ui/ConnectionStatus';
import { WaitingRoom } from './ui/WaitingRoom';
import { GameBoard } from './game/GameBoard';
import { HomeScreen } from '../screens/HomeScreen';
import { ResultScreen } from '../screens/ResultScreen';


export function OnlineGame() {
  const { socket, isConnected } = useSocket();
  const { user } = useAuth();
  const [isInRoom, setIsInRoom] = useState(false);



   useRejoinGame({ 
    socket, 
    isConnected, 
    userId: user?.id 
  });

  
  // 状態管理フック
  const {
    roomId,
    playerIndex,
    myHand,
    players,
    gameStatus,
    opponentHands,
    gameOverData,
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

     //userId がない場合は待つ
  const userId = user?.id || localStorage.getItem('kadoma_user_id');
  const playerName = localStorage.getItem('kadoma_username') || 'Player';
  
  console.log('[OnlineGame] handleStartMatch - userId:', userId);
  
  socket.emit('join_room', { playerName, userId });
  setIsInRoom(true);
};


// ✅ rejoin_success を受信したら isInRoom を true に
useEffect(() => {
  if (!socket) return;

  socket.on('rejoin_success', () => {
    console.log('[OnlineGame] rejoin_success - setting isInRoom to true');
    setIsInRoom(true);
  });

  return () => {
    socket.off('rejoin_success');
  };
}, [socket]);



  //ホームへ戻る
  const handleReturnHome = () => {
    setIsInRoom(false);
  };
  //再戦する
  const handleRematch = () => {
    if (!socket) return;
   const userId = user?.id || localStorage.getItem('kadoma_user_id');
  const playerName = localStorage.getItem('kadoma_username') || 'Player';
  
  socket.emit('join_room', { playerName, userId });
    // gameStatus は自動的に 'waiting' に変わる
  };

  // UI分岐
  if (!isConnected) {
    return <ConnectionStatus />;
  }
  
  //ルームに入ってない → ホーム画面
  if (!isInRoom) {
    return <HomeScreen onStartMatch={handleStartMatch} />;
  }

  // ✅ ゲーム終了 → 結果画面
  if (gameStatus === 'finished' && gameOverData) {
    return (
      <ResultScreen
        playerIndex={playerIndex}
        finalScores={gameOverData.finalScores}
        winner={gameOverData.winner}
        players={players}
        reason={gameOverData.reason}
        onReturnHome={handleReturnHome}
        onRematch={handleRematch}
      />
    );
  }

 if (gameStatus === 'playing') {

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

if (gameStatus === 'waiting') {
  return <WaitingRoom />;
}
return <WaitingRoom />;
}