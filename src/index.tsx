// src/index.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app';
import './index.css'; // CSSを使ってる場合

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
