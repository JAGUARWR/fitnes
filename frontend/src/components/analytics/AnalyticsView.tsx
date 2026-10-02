import React, { useState, useEffect } from 'react';
import { Dumbbell, Calendar, Clock, Award, ChevronDown, ChevronUp, TrendingUp, Flame } from 'lucide-react';
import { AnalyticsStats, WorkoutSession } from '../../types';
import { analyticsApi, workoutsApi } from '../../services/api';
import { triggerHaptic } from '../../utils/telegram';

export const AnalyticsView: React.FC = () => {
  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [history, setHistory] = useState<WorkoutSession[]>([]);
  const [expandedSessionId, setExpandedSessionId] = useState<number | null>(null);

  useEffect(() => {
    analyticsApi.get().then(setStats).catch(console.error);
    workoutsApi.getHistory().then(setHistory).catch(console.error);
  }, []);

  return (
    <div className="p-4 pb-24 max-w-md mx-auto">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-white">Прогресс и аналитика</h1>
        <p className="text-xs text-slate-400">
          Динамика рабочих весов, 1RM рекорды и история тренировок
        </p>
      </div>

      {/* Top Stat Cards */}
      {stats && (
        <div className="grid grid-cols-2 gap-2.5 mb-5">
          <div className="bg-[#0F172A]/80 backdrop-blur-md border border-white/[0.07] p-4 rounded-2xl">
            <div className="flex items-center space-x-2 text-sky-400 mb-1">
              <Dumbbell size={16} />
              <span className="text-[11px] font-semibold uppercase tracking-wider">Общий тоннаж</span>
            </div>
            <div className="text-2xl font-bold text-white font-mono">
              {stats.total_volume_kg > 1000
                ? `${(stats.total_volume_kg / 1000).toFixed(1)} т`
                : `${stats.total_volume_kg} кг`}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {stats.total_sets} подходов · {stats.total_reps} повторений
            </div>
          </div>

          <div className="bg-[#0F172A]/80 backdrop-blur-md border border-white/[0.07] p-4 rounded-2xl">
            <div className="flex items-center space-x-2 text-sky-400 mb-1">
              <Calendar size={16} />
              <span className="text-[11px] font-semibold uppercase tracking-wider">Тренировок</span>
            </div>
            <div className="text-2xl font-bold text-white font-mono">
              {stats.total_workouts}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5 flex items-center space-x-1">
              <Flame size={12} className="text-orange-400" />
              <span>{stats.streak_weeks} нед. серия</span>
            </div>
          </div>
        </div>
      )}

      {/* 1RM Records */}
      <div className="mb-6">
        <h2 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center space-x-1.5">
          <Award size={14} className="text-amber-400" />
          <span>Рекорды 1RM</span>
        </h2>

        {!stats || stats.top_exercises_1rm.length === 0 ? (
          <div className="bg-[#0F172A]/80 backdrop-blur-md border border-white/[0.07] rounded-2xl p-4 text-center text-xs text-slate-500">
            Здесь появятся ваши расчётные рекорды после первой тренировки
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {stats.top_exercises_1rm.map((item) => (
              <div
                key={item.exercise_id}
                className="bg-[#0F172A]/80 backdrop-blur-md border border-white/[0.07] p-3 rounded-2xl"
              >
                <div className="text-xs font-semibold text-slate-300 truncate mb-1">
                  {item.exercise_name}
                </div>
                <div className="text-xl font-bold text-sky-400 font-mono">
                  {item.estimated_1rm} <span className="text-xs font-normal text-slate-500">кг</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  Лучший: {item.best_weight}k × {item.best_reps} ({item.last_performed_at})
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Workout History */}
      <div>
        <h2 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center space-x-1.5">
          <TrendingUp size={14} className="text-sky-400" />
          <span>История тренировок</span>
        </h2>

        {history.length === 0 ? (
          <div className="bg-[#0F172A]/80 backdrop-blur-md border border-white/[0.07] rounded-2xl p-6 text-center text-xs text-slate-500">
            История тренировок пока пуста. Начните первую тренировку!
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((session) => {
              const isExpanded = expandedSessionId === session.id;
              const dateStr = new Date(session.started_at).toLocaleDateString('ru-RU', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              });
              const durationMins = Math.floor(session.duration_seconds / 60);

              return (
                <div
                  key={session.id}
                  className="bg-[#0F172A]/80 backdrop-blur-md border border-white/[0.07] rounded-2xl overflow-hidden"
                >
                  <div
                    onClick={() => {
                      triggerHaptic('selection');
                      setExpandedSessionId(isExpanded ? null : session.id);
                    }}
                    className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-white/[0.03] transition"
                  >
                    <div>
                      <div className="font-semibold text-sm text-white">{session.name}</div>
                      <div className="text-xs text-slate-500 mt-0.5 flex items-center space-x-2">
                        <span>{dateStr}</span>
                        <span>·</span>
                        <span>{durationMins} мин</span>
                        <span>·</span>
                        <span className="text-sky-400 font-semibold">{session.total_volume_kg} кг</span>
                      </div>
                    </div>

                    <div className="p-1 text-slate-500">
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="bg-white/[0.02] p-3 border-t border-white/[0.06] space-y-2">
                      {session.notes && (
                        <div className="text-xs text-slate-300 italic mb-2">
                          «{session.notes}»
                        </div>
                      )}
                      <div className="space-y-1">
                        {session.sets.map((s) => (
                          <div
                            key={s.id}
                            className="flex items-center justify-between text-xs py-1 border-b border-white/[0.04] last:border-0"
                          >
                            <span className="text-slate-300">
                              {s.exercise?.name || `Упражнение #${s.exercise_id}`}
                            </span>
                            <span className="font-mono text-white font-semibold">
                              #{s.set_number}: {s.weight_kg} кг × {s.reps}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
