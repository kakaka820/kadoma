// src/online/components/WaitingRoom.tsx
// マッチング待機画面

import { useSocket } from '../../contexts/SocketContext';
import { useAuth } from '../../contexts/AuthContext';


interface WaitingRoomProps {
  onCancel?: () => void; 
}

export function WaitingRoom({ onCancel }: WaitingRoomProps) {
  const { socket } = useSocket();
  const { user } = useAuth();


  // マッチングキャンセル処理
  const handleCancelMatching = () => {
    if (!socket || !user) return;
    console.log('[WaitingRoom] Cancelling matching...');
    
    socket.emit('cancel_matching', { userId: user.id }, (response: any) => {
      console.log('[WaitingRoom] cancel_matching response:', response);


if (response.success) {
        console.log('[WaitingRoom] マッチングキャンセル成功');
        // onCancel コールバックがあれば実行
        if (onCancel) {
          onCancel();
        }
      } else {
        console.error('[WaitingRoom] キャンセル失敗:', response.error);
        alert(response.error || 'キャンセルに失敗しました');
      }
    });
  };



  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <div className="text-center max-w-md w-full px-4">
        <div className="text-2xl mb-4">マッチング中...</div>
        <div className="text-lg mb-8">プレイヤーを待っています</div>

        <button
          onClick={handleCancelMatching}
          className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition font-semibold"
        >
          マッチングをキャンセル
        </button>
      </div>
    </div>
  );
}
