// src/online/components/ConnectionStatus.tsx
// 接続確認画面（将来的にはローディングアニメーションなどもここに格納することになる）

export function ConnectionStatus() {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <div className="text-center">
        <div className="text-2xl mb-4">サーバーに接続中...</div>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
      </div>
    </div>
  );
}
