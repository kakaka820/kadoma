// src/online/screens/MaintenanceScreen.tsx
export default function MaintenanceScreen() {
  return (
    <div className="fixed inset-0 bg-gray-900 flex items-center justify-center">
      <div className="bg-gray-800 p-8 rounded-xl max-w-md text-center">
        <h1 className="text-3xl font-bold text-yellow-400 mb-4">
          🔧 メンテナンス中
        </h1>
        <p className="text-gray-300 mb-4">
          現在、サーバーメンテナンス中です。
        </p>
        <p className="text-gray-400 text-sm">
          しばらくお待ちください。
        </p>
      </div>
    </div>
  );
}