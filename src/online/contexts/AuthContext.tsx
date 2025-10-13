// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { useSocket } from './SocketContext';

interface User {
  id: string;
  username: string;
  currency: number;
  transferCode: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (user: User) => void;
  logout: () => void;
  register: (username: string) => Promise<{ success: boolean; error?: string }>;
  loginWithCode: (code: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) { // ✅ socket props 削除
  const { socket } = useSocket();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 起動時: 自動ログイン
  useEffect(() => {
    if (!socket) return;

    const userId = localStorage.getItem('kadoma_user_id');
    
    if (userId) {
      console.log('[認証] 自動ログイン試行:', userId);
      
      socket.emit('auto_login', { userId }, (response: any) => {
        if (response.success) {
          console.log('[認証] 自動ログイン成功:', response.user);
          setUser(response.user);
        } else {
          console.log('[認証] 自動ログイン失敗、ローカルデータ削除');
          localStorage.removeItem('kadoma_user_id');
        }
        setIsLoading(false);
      });
    } else {
      console.log('[認証] ローカルデータなし');
      setIsLoading(false);
    }
  }, [socket]);

  // ログイン（ローカルストレージに保存）
  const login = (userData: User) => {
    console.log('[認証] ログイン:', userData);
    setUser(userData);
    localStorage.setItem('kadoma_user_id', userData.id);
  };

  // ログアウト
  const logout = () => {
    console.log('[認証] ログアウト');
    setUser(null);
    localStorage.removeItem('kadoma_user_id');
  };

  // 新規登録
  const register = async (username: string): Promise<{ success: boolean; error?: string }> => {
    if (!socket) {
      return { success: false, error: 'サーバーに接続できません' };
    }

    return new Promise((resolve) => {
      socket.emit('register', { username }, (response: any) => {
        if (response.success) {
          login(response.user);
          resolve({ success: true });
        } else {
          resolve({ success: false, error: response.error });
        }
      });
    });
  };

  // 引継ぎコードでログイン
  const loginWithCode = async (code: string): Promise<{ success: boolean; error?: string }> => {
    if (!socket) {
      return { success: false, error: 'サーバーに接続できません' };
    }

    return new Promise((resolve) => {
      socket.emit('login_with_code', { transferCode: code }, (response: any) => {
        if (response.success) {
          login(response.user);
          resolve({ success: true });
        } else {
          resolve({ success: false, error: response.error });
        }
      });
    });
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, register, loginWithCode }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}