// src/App.tsx
import React, { useState } from 'react';
import Game from './local/components/Game';
import OnlineApp from './online/OnlineApp';
import { SocketProvider } from './online/contexts/SocketContext';
import { AuthProvider } from './online/contexts/AuthContext';

export default function App() {
  const [mode, setMode] = useState<'local' | 'online'>('online');
  






  return (
    <SocketProvider>
      <AuthProvider>
        {mode === 'online' ? (
          <OnlineApp onSwitchToLocal={() => setMode('local')} />
        ) : (
          <div className="App">
            <div className="fixed inset-0 overflow-y-auto bg-gradient-to-b from-gray-900 to-gray-800 px-1 py-4">
              <button 
                onClick={() => setMode('online')}
                className="mb-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded transition"
              >
                ホームに戻る
              </button>
              
               <hr className="border-gray-700 my-6" />
              
              <h3 className="text-xl font-bold text-white mb-2">↓ ローカル対戦 ↓</h3>

              <p className="text-gray-400 mb-6">
                オフラインで動作や挙動の確認ができます
              </p>
              <Game />
            </div>
          </div>
        )}
      </AuthProvider>
    </SocketProvider>
  );
}