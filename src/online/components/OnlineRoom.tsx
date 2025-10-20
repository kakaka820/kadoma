//src/online/components/OnlineRoom.tsx
//フロントエンド　ホーム画面とかつくるならそれもここになるのかな？
//それはsrc/online/components/layoutっていうフォルダを作ってその中にファイル書いてこう


import React, { useEffect, useState } from 'react';
import { useSocket } from '../contexts/SocketContext';  

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
  onGameStart: (roomId: string) => void;
}

const OnlineRoom: React.FC<OnlineRoomProps> = ({ onGameStart }) => {
  const { socket, isConnected } = useSocket();
  const [playerName, setPlayerName] = useState('');
  const [roomInfo, setRoomInfo] = useState<RoomUpdate | null>(null);
  const [matchingStatus, setMatchingStatus] = useState<'idle' | 'waiting' | 'ready'>('idle');

  useEffect(() => {
    if(!socket){
    console.log('[OnlineRoom] socket not ready yet');
      return;
    }
    console.log('[OnlineRoom] socket ready:', socket.id);

    socket.on('room_update', (data: RoomUpdate) => {
      console.log('Room update:', data);
      setRoomInfo(data);
    });

    socket.on('game_ready', (data) => {
      console.log('[OnlineRoom]Game ready:', data);
      setMatchingStatus('ready');
    // 3秒後に自動遷移
      setTimeout(() => {
        onGameStart(data.roomId);
      }, 0);
    });

// クリーンアップ（イベントリスナー削除のみ）
    return () => {
      socket.off('room_update');
      socket.off('game_ready');
    };
  }, [socket, onGameStart]);


  

// マッチング開始
const handleStartMatching = () => {
    if (socket && playerName.trim()) {
      console.log('[OnlineRoom] join_room emit:', playerName);
      socket.emit('join_room', { playerName });
      setMatchingStatus('waiting');
    } else {
      console.warn('[OnlineRoom] socket not ready or name empty');
    }
  };



return (
    <div>
      {matchingStatus === 'idle' && (
        <div>
          <h2>オンライン対戦</h2>
          <input 
            value={playerName} 
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="プレイヤー名を入力"
            style={{ padding: '8px', marginRight: '10px' }}
          />
          <button 
            onClick={handleStartMatching}
            style={{ padding: '8px 16px', cursor: 'pointer' }}
            disabled={!socket || !playerName.trim()}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white p-3 rounded disabled:bg-gray-400"
          >
            マッチング開始
          </button>
          {!isConnected && (  //isConnected 使用
            <p className="text-orange-500 mt-4">サーバー接続中...</p>)}
        </div>
      )}
      
      {matchingStatus === 'waiting' && (
        <div className="matching-animation">
          <h2>マッチング中...</h2>
          <p>{roomInfo?.players.length || 0} / 3 人</p>
    {(!roomInfo || roomInfo.players.length === 0) && (
      <p style={{ color: 'orange', fontSize: '12px' }}>
        サーバー接続中...（あなたの回線の問題ではありません）
      </p>
    )}
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
};
export default OnlineRoom;