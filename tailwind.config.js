// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // カードゲーム用カラーパレット
        kadoma: {
          primary: '#8B5CF6',      // 紫（メイン）
          secondary: '#10B981',    // 緑（セカンダリ）
          accent: '#F59E0B',       // オレンジ（アクセント）
          danger: '#EF4444',       // 赤（危険）
          success: '#10B981',      // 緑（成功）
          warning: '#F59E0B',      // 黄色（警告）
          info: '#3B82F6',         // 青（情報）
          
          // カード関連
          card: {
            back: '#1F2937',       // カード背面
            face: '#FFFFFF',       // カード表面
            selected: '#8B5CF6',   // 選択時
            hover: '#6D28D9',      // ホバー時
          },
          
          // ゲームボード関連
          board: {
            bg: '#111827',         // ボード背景
            field: '#1F2937',      // フィールド
            player: '#374151',     // プレイヤーエリア
          },
        },
      },
      spacing: {
        'safe': 'env(safe-area-inset-bottom)', // モバイル対応
      },
      animation: {
        'card-flip': 'cardFlip 0.6s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        cardFlip: {
          '0%': { transform: 'rotateY(0deg)' },
          '50%': { transform: 'rotateY(90deg)' },
          '100%': { transform: 'rotateY(180deg)' },
        },
        slideIn: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};