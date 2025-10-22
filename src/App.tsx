// src/App.tsx
import React, { useState } from 'react';
import Game from './local/components/Game';
import OnlineApp from './online/OnlineApp';


export default function App() {
  const [mode, setMode] = useState<'local' | 'online'>('online');
  







  if (mode === 'online') {
   return <OnlineApp onSwitchToLocal={() => setMode('local')} />; 
  }

  return (
    <div className="App">
      <div className="min-h-screen bg-gray-50 p-4">
        <button 
          onClick={() => setMode('online')}
          className="mb-4 px-4 py-2 bg-blue-500 text-white rounded"
        >
          オンライン対戦へ
        </button>
        
        <hr style={{ margin: '30px 0' }} />
        
        <h3>↓ ローカル対戦（デバッグ用）</h3>
        <p className="text-gray-400 mb-6">
              オフラインで動作や挙動の確認ができます
            </p>
        <Game />
      </div>
    </div>
  );
}