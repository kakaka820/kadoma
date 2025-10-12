// src/online/components/WaitingRoom.tsx
// マッチング待機画面

export function WaitingRoom() {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <div className="text-center">
        <div className="text-2xl mb-4">マッチング中...</div>
        <div className="text-lg">プレイヤーを待っています</div>
      </div>
    </div>
  );
}
