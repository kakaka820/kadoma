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
import { RoomSelection } from '../screens/RoomSelection';
import { ResultScreen } from '../screens/ResultScreen';

type ScreenType = 'home' | 'room-selection' | 'waiting' | 'playing' | 'result';

export function OnlineGame() {
  const { socket, isConnected } = useSocket();
  const { user } = useAuth();
  const [isInRoom, setIsInRoom] = useState(false);
  const [screen, setScreen] = useState<ScreenType>('home');



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

  // 画面遷移ハンドラー
  const handleNavigate = (type: 'online' | 'multi' | 'custom' | 'friend') => {
    if (type === 'multi') {
      setScreen('room-selection');
    } else if (type === 'custom') {
      alert('カスタム戦は準備中です');
    } else if (type === 'friend') {
      alert('フレンド戦は準備中です');
    } else if (type === 'online') {
      handleStartMatch();
    }
  };



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

// マルチ対戦の部屋参加成功
  const handleRoomJoined = () => {
    setIsInRoom(true);
    setScreen('waiting');
  };

  // ホームへ戻る
  const handleBackToHome = () => {
    setScreen('home');
    setIsInRoom(false);
  };


// ✅ rejoin_success を受信したら isInRoom を true に
useEffect(() => {
  if (!socket) return;

  socket.on('rejoin_success', (data) => {
  console.log('[OnlineGame] rejoin_success - setting isInRoom to true');
  console.log('[OnlineGame] rejoin_success data:', data);
  setIsInRoom(true);
  setScreen('playing');
});

  return () => {
    socket.off('rejoin_success');
  };
}, [socket]);



  //ホームへ戻る（リザルトから）
  const handleReturnHome = () => {
    setIsInRoom(false);
    setScreen('home');
  };


  //再戦する
  const handleRematch = () => {
    if (!socket) return;
   const userId = user?.id || localStorage.getItem('kadoma_user_id');
  const playerName = localStorage.getItem('kadoma_username') || 'Player';
   console.log('[OnlineGame] handleRematch - gameOverData:', gameOverData);
  console.log('[OnlineGame] handleRematch - roomConfig:', gameOverData?.roomConfig);
  if (gameOverData?.roomConfig) {
    console.log('[OnlineGame] Sending join_multi_room with roomId:', gameOverData.roomConfig.id);
    // マルチ部屋の再戦
    socket.emit('join_multi_room', { 
      roomId: gameOverData.roomConfig.id,
      userId, 
      username: playerName 
    }, (response: any) => {
      console.log('[OnlineGame] join_multi_room response:', response);
      if (response.success) {
        setIsInRoom(true);
        setScreen('waiting');
      } else {
        alert(response.error || 'マッチング失敗');
      }
    });
  } else {
    // 通常部屋の再戦
    socket.emit('join_room', { playerName, userId });
    setIsInRoom(true);
    setScreen('waiting');
  }
      // gameStatus は自動的に 'waiting' に変わる
};
  

  // UI分岐
  if (!isConnected) {
    return <ConnectionStatus />;
  }

    // 部屋選択画面
  if (screen === 'room-selection') {
    return (
      <RoomSelection 
        onBack={handleBackToHome} 
        onRoomJoined={handleRoomJoined}
      />
    );
  }
  
  //ルームに入ってない → ホーム画面
  if (!isInRoom) {
    return <HomeScreen onNavigate={handleNavigate} />;
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