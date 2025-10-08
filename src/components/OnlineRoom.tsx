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
    const newSocket = io('http://localhost:4000');
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

  const handleJoinRoom = () => {
    if (socket && playerName.trim()) {
      socket.emit('join_room', playerName);
      setIsJoined(true);
    }
  };

  const handleStartGame = () => {  // 追加
    if (roomInfo) {
      onGameStart(roomInfo.roomId);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>オンライン対戦ルーム</h1>

      {!isJoined ? (
        <div>
          <h2>プレイヤー名を入力</h2>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="プレイヤー名"
            style={{ padding: '10px', fontSize: '16px', marginRight: '10px' }}
          />
          <button
            onClick={handleJoinRoom}
            disabled={!playerName.trim()}
            style={{
              padding: '10px 20px',
              fontSize: '16px',
              cursor: playerName.trim() ? 'pointer' : 'not-allowed'
            }}
          >
            ルームに参加
          </button>
        </div>
      ) : (
        <div>
          <h2>ルーム情報</h2>
          {roomInfo && (
            <div>
              <p><strong>ルームID:</strong> {roomInfo.roomId}</p>
              <p><strong>プレイヤー数:</strong> {roomInfo.players.length} / 3</p>
              
              <h3>参加プレイヤー:</h3>
              <ul>
                {roomInfo.players.map((player) => (
                  <li key={player.id}>
                    {player.name} (位置: {player.position + 1})
                  </li>
                ))}
              </ul>

              {!roomInfo.isFull && (
                <p style={{ color: 'orange' }}>
                  あと {3 - roomInfo.players.length} 人待っています...
                </p>
              )}

              {gameReady && (
                <div style={{ 
                  backgroundColor: '#4CAF50', 
                  color: 'white', 
                  padding: '15px', 
                  borderRadius: '5px',
                  marginTop: '20px'
                }}>
                  <h3>🎮 3人揃いました！ゲーム開始準備完了</h3>
                  <button
                    onClick={handleStartGame}
                    style={{
                      padding: '15px 30px',
                      fontSize: '20px',
                      backgroundColor: '#fff',
                      color: '#4CAF50',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      marginTop: '10px'
                    }}
                  >
                    ゲーム開始！
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OnlineRoom;
