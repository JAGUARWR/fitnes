import React from 'react';
import { Flame, Zap, Trophy } from 'lucide-react';

interface AppleActivityRingsProps {
  completedWorkouts: number;
  targetWorkouts: number;
  streakWeeks: number;
  volumeTons?: number;
}

export const AppleActivityRings: React.FC<AppleActivityRingsProps> = ({
  completedWorkouts,
  targetWorkouts,
  streakWeeks,
  volumeTons = 1.2,
}) => {
  const percent = targetWorkouts > 0 ? Math.min(100, (completedWorkouts / targetWorkouts) * 100) : 0;
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * percent) / 100;

  return (
    <div className="bg-[#131B2E]/60 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] rounded-3xl p-4 flex items-center justify-between">
      {/* Left: Apple Fitness Ring */}
      <div className="flex items-center space-x-3.5">
        <div className="relative w-16 h-16 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90">
            {/* Background Track */}
            <circle
              cx="32"
              cy="32"
              r={radius}
              stroke="currentColor"
              strokeWidth="5"
              fill="transparent"
              className="text-white/10"
            />
            {/* Active Glow Ring */}
            <circle
              cx="32"
              cy="32"
              r={radius}
              stroke="url(#ringGradient)"
              strokeWidth="5.5"
              strokeLinecap="round"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-700 ease-out"
            />
            <defs>
              <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38BDF8" />
                <stop offset="100%" stopColor="#2563EB" />
              </linearGradient>
            </defs>
          </svg>

          {/* Center Activity Icon */}
          <div className="absolute inset-0 flex items-center justify-center text-sky-400 drop-shadow-[0_0_8px_rgba(56,189,248,0.5)]">
            <Zap size={18} strokeWidth={2.5} />
          </div>
        </div>

        {/* Ring Labels */}
        <div>
          <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 block">
            Цель недели
          </span>
          <div className="text-lg font-bold text-white tracking-tight flex items-baseline space-x-1">
            <span>{completedWorkouts}</span>
            <span className="text-slate-400 font-normal text-xs">из</span>
            <span>{targetWorkouts}</span>
            <span className="text-xs text-sky-400 font-medium ml-1">тренировок</span>
          </div>
        </div>
      </div>

      {/* Right: Badges (Streak & Volume) */}
      <div className="flex flex-col items-end space-y-1.5">
        <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-semibold">
          <Flame size={13} className="text-orange-400" />
          <span>{streakWeeks} нед. серия</span>
        </div>

        <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-300 text-[11px] font-mono">
          <Trophy size={11} className="text-sky-400" />
          <span>{volumeTons.toFixed(1)} т объём</span>
        </div>
      </div>
    </div>
  );
};
