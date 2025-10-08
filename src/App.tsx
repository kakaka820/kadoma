// src/App.tsx
import React, { useState } from 'react';
import Game from './components/Game';
import OnlineRoom from './components/OnlineRoom';

export default function App() {
  const [gameStarted, setGameStarted] = useState(false);
  const [roomId, setRoomId] = useState<string>('');

  const handleGameStart = (roomId: string) => {
    setRoomId(roomId);
    setGameStarted(true);
  };

  return (
    <div className="App">
      <div className="min-h-screen bg-gray-50 p-4">
        {!gameStarted ? (
          <>
            <OnlineRoom onGameStart={handleGameStart} />
            <hr style={{ margin: '30px 0' }} />
            <h3>↓ ローカル対戦（デバッグ用）</h3>
            <Game />
          </>
        ) : (
          <div>
            <h2>オンライン対戦中 (Room: {roomId})</h2>
            <Game />
          </div>
        )}
      </div>
    </div>
  );
}
