import React, { useEffect } from 'react';
import { Play, Pause, X, Plus, Minus, Bell } from 'lucide-react';
import { triggerHaptic } from '../../utils/telegram';
import { playCountdownTick, playRestFinishedChime } from '../../utils/audio';

interface RestTimerProps {
  remainingSeconds: number;
  totalSeconds: number;
  isActive: boolean;
  onToggle: () => void;
  onAdjust: (delta: number) => void;
  onDismiss: () => void;
}

export const RestTimer: React.FC<RestTimerProps> = ({
  remainingSeconds,
  totalSeconds,
  isActive,
  onToggle,
  onAdjust,
  onDismiss,
}) => {
  useEffect(() => {
    if (!isActive) return;

    if (remainingSeconds === 3 || remainingSeconds === 2 || remainingSeconds === 1) {
      playCountdownTick();
      triggerHaptic('impact');
    } else if (remainingSeconds === 0) {
      playRestFinishedChime();
      triggerHaptic('success');
    }
  }, [remainingSeconds, isActive]);

  if (remainingSeconds <= 0 && !isActive) return null;

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const progressPercent = totalSeconds > 0 ? (remainingSeconds / totalSeconds) * 100 : 0;

  return (
    <div className="fixed bottom-16 left-4 right-4 z-30 max-w-md mx-auto">
      <div className="bg-[#0F172A]/95 backdrop-blur-md border border-sky-500/30 shadow-2xl shadow-sky-950/40 rounded-2xl p-3 flex items-center justify-between">
        {/* Left: Icon & Progress */}
        <div className="flex items-center space-x-3">
          <div className="relative flex items-center justify-center w-11 h-11 rounded-full bg-sky-500/10 border border-sky-500/30">
            <Bell size={20} className={isActive ? 'text-sky-400 animate-pulse' : 'text-slate-500'} />
            <svg className="absolute inset-0 w-full h-full -rotate-90">
              <circle
                cx="22" cy="22" r="18"
                stroke="currentColor" strokeWidth="2.5" fill="transparent"
                className="text-white/[0.06]"
              />
              <circle
                cx="22" cy="22" r="18"
                stroke="currentColor" strokeWidth="2.5" fill="transparent"
                strokeDasharray="113"
                strokeDashoffset={113 - (113 * progressPercent) / 100}
                className="text-sky-500 transition-all duration-300"
              />
            </svg>
          </div>

          <div>
            <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Отдых</div>
            <div className="text-xl font-bold font-mono text-white tracking-tight">
              {minutes}:{seconds < 10 ? `0${seconds}` : seconds}
            </div>
          </div>
        </div>

        {/* Center: Adjust */}
        <div className="flex items-center space-x-1.5">
          <button
            onClick={() => onAdjust(-15)}
            className="px-2 py-1 bg-white/5 hover:bg-white/10 active:scale-95 text-slate-300 rounded-lg text-xs font-semibold"
          >
            -15с
          </button>
          <button
            onClick={() => onAdjust(30)}
            className="px-2 py-1 bg-white/5 hover:bg-white/10 active:scale-95 text-slate-300 rounded-lg text-xs font-semibold"
          >
            +30с
          </button>
        </div>

        {/* Right: Controls */}
        <div className="flex items-center space-x-1">
          <button
            onClick={onToggle}
            className="p-2 bg-[#0A84FF] hover:bg-[#0070E0] active:scale-95 text-white rounded-xl"
            title={isActive ? 'Пауза' : 'Продолжить'}
          >
            {isActive ? <Pause size={16} /> : <Play size={16} />}
          </button>
          <button
            onClick={onDismiss}
            className="p-2 text-slate-500 hover:text-white active:scale-95 rounded-xl"
            title="Закрыть таймер"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};
