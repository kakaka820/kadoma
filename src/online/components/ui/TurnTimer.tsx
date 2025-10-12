// src/online/components/ui/TurnTimer.tsx
// タイマー表示コンポーネント

interface TurnTimerProps {
  timeRemaining: number;
  timeLimit: number;
}

export function TurnTimer({ timeRemaining, timeLimit }: TurnTimerProps) {
  const isUrgent = timeRemaining <= 3;
  
  return (
    <div 
      className={`font-bold ${
        isUrgent ? 'text-red-400 animate-pulse' : 'text-yellow-400'
      }`}
    >
      ⏱️ 残り時間: {timeRemaining}秒
    </div>
  );
}