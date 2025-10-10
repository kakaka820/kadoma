// src/index.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css'; // CSSを使ってる場合

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  //<React.StrictMode> これは開発環境でuseEffectとか二回実行しちゃうので、これを一回コメントアウトしてます
    <App />
  //</React.StrictMode>　同上
);
