//とりあえず枠だけ先に作った
// オンライン用エントリーらしい
// src/online/OnlineApp.tsx
import React, { useState, useEffect } from 'react';
import { OnlineGame } from './components/OnlineGame';
import { AuthProvider, useAuth } from './contexts/AuthContext'; 
import { SocketProvider } from './contexts/SocketContext';
import LoginScreen from './screens/LoginScreen';

const SERVER_URL = process.env.REACT_APP_SERVER_URL || 'http://localhost:3001';


function OnlineAppContent() {
  const { user, isLoading } = useAuth();

  // ✅ ローディング中
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-2xl">Loading...</div>
      </div>
    );
  }

  // ✅ 未ログイン → ログイン画面
  if (!user) {
    return <LoginScreen />;
  }

  // ✅ ログイン済み → ゲーム画面
    return <OnlineGame />;  
}

export default function OnlineApp() {
  

  return (
    <SocketProvider>
    <AuthProvider>    
      <OnlineAppContent />
      </AuthProvider>
      </SocketProvider>
  );
}