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
  isMaintenanceMode: boolean;
  login: (user: User) => void;
  logout: () => void;
  register: (username: string) => Promise<{ success: boolean; error?: string }>;
  loginWithCode: (code: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { socket, isConnected } = useSocket();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);


  //メンテナンスモード監視
  useEffect(() => {
    if (!socket) return;
    const handleMaintenanceMode = (data: any) => {
      console.log('[AuthContext] メンテナンスモード検出:', data.message);
      setIsMaintenanceMode(true);
      setIsLoading(false);
    };
    socket.on('maintenance_mode', handleMaintenanceMode);
    return () => {
      socket.off('maintenance_mode', handleMaintenanceMode);
    };
  }, [socket]);

  // 起動時: 自動ログイン


  //自動ログイン（メンテナンス中はスキップ）
  useEffect(() => {
    console.log('[AuthContext] useEffect 実行, socket:', socket, 'isConnected:', isConnected);
    
    if (!socket || !isConnected) {
      console.log('[AuthContext] socket or isConnected is false, waiting...');
      return;
    }
     //メンテナンス中なら自動ログインをスキップ
    if (isMaintenanceMode) {
      console.log('[AuthContext] メンテナンス中のため自動ログインをスキップ');
      setIsLoading(false);
      return;
    }



    const userId = localStorage.getItem('kadoma_user_id');
    
    if (userId) {
      console.log('[認証] 自動ログイン試行:', userId);
    
      
    
      const timeout = setTimeout(() => {
       
      console.log('[認証] 自動ログインタイムアウト（サーバー起動中の可能性）');
      setIsLoading(false);
        
    }, 90000);
      socket.emit('auto_login', { userId }, (response: any) => {
        clearTimeout(timeout);

        if (response.success) {
          console.log('[認証] 自動ログイン成功:', response.user);
          setUser(response.user);
          localStorage.setItem('kadoma_user_id', response.user.id);
          setIsLoading(false);
        } else {
          console.log('[認証] 自動ログイン失敗、ローカルデータ削除');
          localStorage.removeItem('kadoma_user_id');
          setIsLoading(false);
        }
      });

    } else {
      console.log('[認証] ローカルデータなし');
      setIsLoading(false);
    }
  }, [socket?.id, isConnected, isMaintenanceMode]);


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
    
    console.log('[AuthContext] register 開始:', username);
    console.log('[AuthContext] socket:', socket);
    
    
    if (!socket) {
      console.error('[AuthContext] socket is null!');
      return { success: false, error: 'サーバーに接続できません' };
    }

    console.log('[AuthContext] socket.emit("register") 実行');

    return new Promise((resolve) => {
      socket.emit('register', { username }, (response: any) => {
        console.log('[AuthContext] register callback 受信:', response);
        if (response.success) {
          console.log('[AuthContext] 登録成功、login 呼び出し');
          login(response.user);
          resolve({ success: true });
        } else {
          console.log('[AuthContext] 登録失敗:', response.error);
          resolve({ success: false, error: response.error });
        }
      });
    });
  };

  // 引継ぎコードでログイン
  const loginWithCode = async (code: string): Promise<{ success: boolean; error?: string }> => {
    
    console.log('[AuthContext] loginWithCode 開始:', code);

    if (!socket) {
      console.error('[AuthContext] socket is null!');
      return { success: false, error: 'サーバーに接続できません' };
    }

    console.log('[AuthContext] socket.emit("login_with_code") 実行');

    return new Promise((resolve) => {
      socket.emit('login_with_code', { transferCode: code }, (response: any) => {
        console.log('[AuthContext] loginWithCode callback 受信:', response);
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
    <AuthContext.Provider value={{ user, isLoading, isMaintenanceMode, login, logout, register, loginWithCode }}>
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