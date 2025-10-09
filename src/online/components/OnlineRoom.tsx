//src/components/OnlineRoom.tsx
//フロントエンド　ホーム画面とかつくるならそれもここになるのかな？

// src/components/OnlineRoom.tsx
import React, { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface Player {
  id: string;
  name: string;
  position: number;
}

interface RoomUpdate {
  roomId: string;
  players: Player[];
  isFull: boolean;
}

interface OnlineRoomProps {
  onGameStart: (roomId: string) => void;  // 追加
}

const OnlineRoom: React.FC<OnlineRoomProps> = ({ onGameStart }) => {  // 修正
  const [socket, setSocket] = useState<Socket | null>(null);
  const [playerName, setPlayerName] = useState('');
  const [isJoined, setIsJoined] = useState(false);
  const [roomInfo, setRoomInfo] = useState<RoomUpdate | null>(null);
  const [gameReady, setGameReady] = useState(false);

  useEffect(() => {
    const newSocket = io('https://kadoma.onrender.com');
    setSocket(newSocket);

    newSocket.on('room_update', (data: RoomUpdate) => {
      console.log('Room update:', data);
      setRoomInfo(data);
    });

    newSocket.on('game_ready', (data) => {
      console.log('Game ready:', data);
      setGameReady(true);
    });

    return () => {
      newSocket.close();
    };
  }, []);

  const [matchingStatus, setMatchingStatus] = useState<'idle' | 'waiting' | 'ready'>('idle');

// マッチング開始
const handleStartMatching = () => {
  if (socket && playerName.trim()) {
    socket.emit('join_room', playerName);
    setMatchingStatus('waiting');  // 待機中
  }
};

// 3人揃ったら自動遷移
useEffect(() => {
  if (socket) {
    socket.on('game_ready', (data) => {
      setMatchingStatus('ready');
      // 3秒後に自動遷移（カウントダウン表示）
      setTimeout(() => {
        onGameStart(data.roomId);
      }, 3000);
    });
  }
}, [socket]);

return (
  <div>
    {matchingStatus === 'idle' && (
      <div>
        <input value={playerName} onChange={(e) => setPlayerName(e.target.value)} />
        <button onClick={handleStartMatching}>
          マッチング開始
        </button>
      </div>
    )}
    
    {matchingStatus === 'waiting' && (
      <div className="matching-animation">
        <h2>マッチング中...</h2>
        <p>{roomInfo?.players.length || 0} / 3 人</p>
        <div className="spinner">🔄</div>
      </div>
    )}
    
    {matchingStatus === 'ready' && (
      <div className="ready-screen">
        <h2>🎮 3人揃いました！</h2>
        <p>まもなく開始...</p>
      </div>
    )}
  </div>
);
}
export default OnlineRoom;
