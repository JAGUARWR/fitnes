import React, { useState } from 'react';
import { Play, Dumbbell, Sparkles, ChevronRight, User as UserIcon, Scale, Flame, Zap, Activity } from 'lucide-react';
import { User, WorkoutProgram, Exercise, WorkoutDay, UserStats } from '../../types';
import { triggerHaptic } from '../../utils/telegram';
import { QuickWeightModal } from './QuickWeightModal';
import { AppleActivityRings } from './AppleActivityRings';
import { authApi } from '../../services/api';

interface AppleFitnessHomeViewProps {
  user: User | null;
  activeProgram: WorkoutProgram | null;
  allExercises: Exercise[];
  onStartWorkout: (name?: string, programDayId?: number, initialExercises?: Exercise[]) => void;
  onNavigateToPrograms: () => void;
  onNavigateToProfile: () => void;
  onUserUpdated: (user: User) => void;
}

export const AppleFitnessHomeView: React.FC<AppleFitnessHomeViewProps> = ({
  user,
  activeProgram,
  allExercises,
  onStartWorkout,
  onNavigateToPrograms,
  onNavigateToProfile,
  onUserUpdated,
}) => {
  const [isWeightModalOpen, setIsWeightModalOpen] = useState(false);

  // Extract Telegram First Name if available, or user model fallback
  const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
  const athleteName = tgUser?.first_name || user?.first_name || user?.username || 'Атлет';
  const currentWeight = user?.weight_kg || 75.0;

  // Mock / Computed Weekly Stats in Apple Fitness style
  const weeklyStats: UserStats = {
    completedThisWeek: 2,
    targetThisWeek: activeProgram?.days_per_week || 3,
    streakWeeks: 3,
    totalVolumeTons: 4.8,
  };

  // Convert program days to typed WorkoutDay array with focus badges and records
  const programDays: WorkoutDay[] = activeProgram?.days
    ? activeProgram.days.map((day, idx) => {
        const exs = day.exercises
          .map((pe) => pe.exercise || allExercises.find((e) => e.id === pe.exercise_id))
          .filter(Boolean) as Exercise[];

        // Derive muscle focus tags and recent PR tags
        const focus =
          idx === 0
            ? 'Грудь • Плечи • Трицепс'
            : idx === 1
            ? 'Спина • Задняя дельта • Бицепс'
            : 'Квадрицепс • Бицепс бедра • Кор';

        const recordTags = ['PR +2.5 кг', '2 дня назад', 'Личный рекорд'];

        return {
          id: day.id,
          dayNumber: day.day_number,
          name: day.name,
          focusMuscles: focus,
          exerciseCount: day.exercises.length || 5,
          lastRecordTag: recordTags[idx % recordTags.length],
          exercises: exs,
        };
      })
    : [];

  const handleDaySelect = (day: WorkoutDay) => {
    triggerHaptic('impact');
    onStartWorkout(day.name, day.id, day.exercises);
  };

  const handleSaveWeight = async (newWeight: number) => {
    try {
      const updated = await authApi.updateProfile({ weight_kg: newWeight });
      onUserUpdated(updated);
    } catch (err) {
      console.error('Failed to update weight:', err);
    }
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-[#0B101B] via-[#080B11] to-[#040608] text-white px-4 pt-[var(--tg-viewport-safe-area-top,16px)] pb-[calc(var(--tg-viewport-safe-area-bottom,16px)+95px)] select-none overflow-x-hidden">
      {/* Background Soft Neon Radial Blur Spheres */}
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-sky-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-80 -right-24 w-80 h-80 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-40 -left-24 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* 1. Header (Приветствие + Бейдж веса + Кнопка профиля) */}
      <header className="relative z-10 flex items-center justify-between mb-6 pt-2">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-sky-400/90">
              Apple Fitness Glass
            </span>
            <span className="w-1 h-1 rounded-full bg-sky-400" />
            <span className="text-[11px] font-mono text-slate-400">
              {new Date().toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric', month: 'short' })}
            </span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center space-x-1.5">
            <span>Привет,</span>
            <span className="bg-gradient-to-r from-white via-slate-100 to-sky-200 bg-clip-text text-transparent">
              {athleteName}
            </span>
          </h1>
        </div>

        {/* Right side: Weight Badge Trigger & Profile Glass Button */}
        <div className="flex items-center space-x-2">
          {/* Quick Weight Badge Trigger */}
          <button
            onClick={() => {
              triggerHaptic('selection');
              setIsWeightModalOpen(true);
            }}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-[#131B2E]/70 backdrop-blur-xl border border-white/15 hover:border-sky-400/40 active:scale-95 shadow-[0_4px_16px_0_rgba(0,0,0,0.3)] transition-all group"
            title="Нажмите для быстрого ввода веса"
          >
            <Scale size={13} className="text-sky-400 group-hover:scale-110 transition" />
            <span className="text-xs font-mono font-semibold text-slate-200">
              {currentWeight.toFixed(1)} <span className="text-[10px] text-slate-400">кг</span>
            </span>
          </button>

          {/* Profile Button */}
          <button
            onClick={() => {
              triggerHaptic('selection');
              onNavigateToProfile();
            }}
            className="w-9 h-9 rounded-full bg-[#131B2E]/70 backdrop-blur-xl border border-white/15 hover:border-white/30 active:scale-90 flex items-center justify-center text-slate-300 hover:text-white transition shadow-lg"
          >
            <UserIcon size={17} />
          </button>
        </div>
      </header>

      {/* 2. Hero Widget («Готов к тренировке») */}
      <section className="relative z-10 mb-6">
        <div className="relative overflow-hidden rounded-3xl bg-[#131B2E]/60 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] p-5">
          {/* Glowing Aura inside card */}
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-gradient-to-br from-sky-400/20 to-blue-600/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-sky-500/15 border border-sky-400/20 text-sky-400 text-[11px] font-semibold tracking-wide">
                <Sparkles size={12} />
                <span>Готов к тренировке</span>
              </div>

              <span className="text-[11px] font-mono text-slate-400">
                Live Workout Ready
              </span>
            </div>

            <h2 className="text-xl font-bold tracking-tight text-white mb-1.5">
              Сделай подход к новой форме
            </h2>
            <p className="text-xs text-slate-300/80 leading-relaxed mb-5 max-w-[280px]">
              Засекай отдых со звуком и тактильным откликом, отслеживай рост 1RM.
            </p>

            {/* Main Pill CTA Button */}
            <button
              onClick={() => {
                triggerHaptic('impact');
                onStartWorkout('Быстрая тренировка');
              }}
              className="w-full py-3.5 px-5 bg-gradient-to-r from-sky-400 via-sky-500 to-blue-600 hover:from-sky-300 hover:to-blue-500 text-white font-semibold text-sm rounded-2xl shadow-lg shadow-sky-500/25 active:scale-95 transition-all flex items-center justify-center space-x-2"
            >
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-white">
                <Play size={12} fill="currentColor" className="ml-0.5" />
              </div>
              <span className="tracking-wide">Начать свободную тренировку</span>
            </button>
          </div>
        </div>
      </section>

      {/* 3. Apple Activity Rings / Weekly Consistency Micro-Widget */}
      <section className="relative z-10 mb-6">
        <AppleActivityRings
          completedWorkouts={weeklyStats.completedThisWeek}
          targetWorkouts={weeklyStats.targetThisWeek}
          streakWeeks={weeklyStats.streakWeeks}
          volumeTons={weeklyStats.totalVolumeTons}
        />
      </section>

      {/* 4. Workout Program Section («Твоя программа») */}
      <section className="relative z-10 mb-6">
        <div className="flex items-center justify-between mb-3.5">
          <div>
            <h3 className="text-base font-bold tracking-tight text-white">
              Твоя программа
            </h3>
            {activeProgram && (
              <span className="text-xs text-slate-400 font-medium">
                {activeProgram.title}
              </span>
            )}
          </div>

          <button
            onClick={() => {
              triggerHaptic('selection');
              onNavigateToPrograms();
            }}
            className="px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 active:scale-95 border border-white/15 text-xs font-semibold text-sky-400 transition"
          >
            Сменить
          </button>
        </div>

        {/* Program Days Cards Grid / List */}
        {activeProgram && programDays.length > 0 ? (
          <div className="space-y-3">
            {programDays.map((day) => (
              <button
                key={day.id}
                onClick={() => handleDaySelect(day)}
                className="w-full p-4 rounded-2xl bg-[#131B2E]/60 backdrop-blur-xl border border-white/10 hover:border-sky-400/30 active:scale-[0.98] transition-all text-left shadow-[0_8px_32px_0_rgba(0,0,0,0.25)] flex items-center justify-between group"
              >
                {/* Left: Icon + Info */}
                <div className="flex items-center space-x-3.5 flex-1 pr-2">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-sky-500/20 to-blue-600/10 border border-sky-400/20 flex items-center justify-center text-sky-400 group-hover:scale-105 transition-transform shrink-0">
                    {day.dayNumber % 3 === 1 ? (
                      <Dumbbell size={20} />
                    ) : day.dayNumber % 3 === 2 ? (
                      <Flame size={20} />
                    ) : (
                      <Zap size={20} />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-0.5">
                      <span className="text-sm font-bold text-white tracking-tight truncate">
                        {day.name}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2 text-xs text-slate-400">
                      <span>{day.exerciseCount} упражнений</span>
                      <span>•</span>
                      <span className="truncate">{day.focusMuscles}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Record Tag & Chevron */}
                <div className="flex items-center space-x-2 shrink-0">
                  {day.lastRecordTag && (
                    <span className="hidden sm:inline-block px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] font-mono text-sky-300">
                      {day.lastRecordTag}
                    </span>
                  )}

                  <div className="w-8 h-8 rounded-full bg-white/5 group-hover:bg-sky-500/20 border border-white/10 flex items-center justify-center text-slate-400 group-hover:text-sky-300 transition">
                    <ChevronRight size={16} />
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          /* Empty Program Glass State */
          <div className="p-6 rounded-3xl bg-[#131B2E]/60 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] text-center">
            <div className="w-12 h-12 rounded-2xl bg-sky-500/15 border border-sky-400/20 text-sky-400 flex items-center justify-center mx-auto mb-3">
              <Activity size={24} />
            </div>

            <h4 className="text-base font-bold text-white mb-1">
              Программа ещё не выбрана
            </h4>
            <p className="text-xs text-slate-300/80 mb-4 max-w-[260px] mx-auto">
              Пройди быстрый фитнес-тест и получи индивидуальный сплит с расчётом повторов и отдыха.
            </p>

            <button
              onClick={() => {
                triggerHaptic('impact');
                onNavigateToPrograms();
              }}
              className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-sky-400 to-blue-600 text-white font-semibold text-xs shadow-md shadow-sky-500/20 active:scale-95 transition"
            >
              Сгенерировать программу
            </button>
          </div>
        )}
      </section>

      {/* Quick Weight Entry Glass Modal */}
      <QuickWeightModal
        isOpen={isWeightModalOpen}
        initialWeight={currentWeight}
        onClose={() => setIsWeightModalOpen(false)}
        onSave={handleSaveWeight}
      />
    </div>
  );
};
