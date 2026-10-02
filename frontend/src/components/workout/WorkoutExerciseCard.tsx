import React, { useState, useRef, useEffect } from 'react';
import { Check, Plus, Trash2, MoreVertical } from 'lucide-react';
import { Exercise, WorkoutSet } from '../../types';
import { triggerHaptic } from '../../utils/telegram';

interface WorkoutExerciseCardProps {
  exercise: Exercise;
  sets: WorkoutSet[];
  lastPerformance?: WorkoutSet[];
  onAddSet: (exerciseId: number, setNumber: number, weight: number, reps: number) => void;
  onUpdateSet: (setId: number, weight: number, reps: number, isCompleted: boolean) => void;
  onDeleteSet: (setId: number) => void;
  onRemoveExercise?: () => void;
  onStartRestTimer: (seconds: number) => void;
}

export const WorkoutExerciseCard: React.FC<WorkoutExerciseCardProps> = ({
  exercise,
  sets,
  lastPerformance = [],
  onAddSet,
  onUpdateSet,
  onDeleteSet,
  onRemoveExercise,
  onStartRestTimer,
}) => {
  const [showOptions, setShowOptions] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showOptions) return;
    const handler = (e: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowOptions(false);
      }
    };
    document.addEventListener('pointerdown', handler);
    return () => document.removeEventListener('pointerdown', handler);
  }, [showOptions]);

  const handleToggleComplete = (set: WorkoutSet) => {
    const nextCompleted = !set.is_completed;
    triggerHaptic(nextCompleted ? 'success' : 'impact');
    onUpdateSet(set.id, set.weight_kg, set.reps, nextCompleted);

    if (nextCompleted) {
      onStartRestTimer(90);
    }
  };

  const handleAddNewSet = () => {
    triggerHaptic('impact');
    const nextSetNumber = sets.length + 1;
    const lastCurrentSet = sets[sets.length - 1];
    const prevWeight = lastCurrentSet ? lastCurrentSet.weight_kg : lastPerformance[0]?.weight_kg || 40;
    const prevReps = lastCurrentSet ? lastCurrentSet.reps : lastPerformance[0]?.reps || 10;

    onAddSet(exercise.id, nextSetNumber, prevWeight, prevReps);
  };

  const categoryLabels: Record<string, string> = {
    chest: 'Грудь',
    back: 'Спина',
    legs: 'Ноги',
    shoulders: 'Плечи',
    biceps: 'Бицепс',
    triceps: 'Трицепс',
    core: 'Пресс',
  };

  return (
    <div className="bg-[#0F172A]/80 backdrop-blur-md border border-white/[0.07] rounded-2xl p-4 mb-4">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 pr-2">
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-[11px] font-semibold uppercase px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20">
              {categoryLabels[exercise.category] || exercise.category}
            </span>
            {exercise.target_muscle && (
              <span className="text-xs text-slate-500 truncate">
                · {exercise.target_muscle}
              </span>
            )}
          </div>
          <h3 className="text-base font-semibold text-white tracking-tight">
            {exercise.name}
          </h3>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowOptions(!showOptions)}
            className="p-1.5 text-slate-500 hover:text-white rounded-lg hover:bg-white/5"
          >
            <MoreVertical size={18} />
          </button>

          {showOptions && (
            <div ref={menuRef} className="absolute right-0 top-8 z-20 w-44 bg-[#1E293B] border border-white/[0.1] rounded-xl shadow-xl py-1 text-sm">
              {onRemoveExercise && (
                <button
                  onClick={() => {
                    setShowOptions(false);
                    onRemoveExercise();
                  }}
                  className="w-full text-left px-3 py-2 text-red-400 hover:bg-white/5 flex items-center space-x-2"
                >
                  <Trash2 size={16} />
                  <span>Убрать упражнение</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Sets Table */}
      <div className="space-y-2">
        <div className="grid grid-cols-12 gap-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-1 text-center">
          <div className="col-span-2 text-left">Сет</div>
          <div className="col-span-3">Прошлый</div>
          <div className="col-span-3">Кг</div>
          <div className="col-span-2">Повт</div>
          <div className="col-span-2 text-right">Статус</div>
        </div>

        {sets.map((set, idx) => {
          const lastSetHint = lastPerformance[idx];

          return (
            <div
              key={set.id}
              className={`grid grid-cols-12 gap-2 items-center p-2 rounded-xl border transition-all ${
                set.is_completed
                  ? 'bg-[#30D158]/10 border-[#30D158]/30'
                  : 'bg-white/[0.03] border-white/[0.06]'
              }`}
            >
              <div className="col-span-2 flex items-center space-x-1">
                <span className="font-bold text-sm text-slate-300 font-mono">#{idx + 1}</span>
              </div>

              <div className="col-span-3 text-center">
                {lastSetHint ? (
                  <span className="text-xs text-slate-500 font-mono">
                    {lastSetHint.weight_kg}k × {lastSetHint.reps}
                  </span>
                ) : (
                  <span className="text-xs text-slate-600">—</span>
                )}
              </div>

              <div className="col-span-3">
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.5"
                  value={set.weight_kg === 0 ? '' : set.weight_kg}
                  placeholder="0"
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    onUpdateSet(set.id, val, set.reps, set.is_completed);
                  }}
                  className="w-full text-center bg-white/[0.05] text-white font-mono font-semibold text-sm py-1.5 rounded-lg border border-white/[0.08] focus:outline-none focus:border-[#0A84FF]"
                />
              </div>

              <div className="col-span-2">
                <input
                  type="number"
                  inputMode="numeric"
                  value={set.reps === 0 ? '' : set.reps}
                  placeholder="0"
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0;
                    onUpdateSet(set.id, set.weight_kg, val, set.is_completed);
                  }}
                  className="w-full text-center bg-white/[0.05] text-white font-mono font-semibold text-sm py-1.5 rounded-lg border border-white/[0.08] focus:outline-none focus:border-[#0A84FF]"
                />
              </div>

              <div className="col-span-2 flex items-center justify-end space-x-1">
                <button
                  onClick={() => handleToggleComplete(set)}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                    set.is_completed
                      ? 'bg-[#30D158] text-white shadow-md shadow-[#30D158]/30'
                      : 'bg-white/[0.06] text-slate-500 hover:text-white'
                  }`}
                >
                  <Check size={16} strokeWidth={set.is_completed ? 3 : 2} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Set */}
      <div className="mt-3 flex items-center justify-between pt-2 border-t border-white/[0.06]">
        <button
          onClick={handleAddNewSet}
          className="flex items-center space-x-1.5 text-xs font-semibold text-sky-400 hover:text-sky-300 py-1.5 px-3 rounded-lg bg-sky-500/10 hover:bg-sky-500/15 active:scale-95 transition"
        >
          <Plus size={15} />
          <span>Добавить подход</span>
        </button>

        {sets.length > 0 && (
          <button
            onClick={() => onDeleteSet(sets[sets.length - 1].id)}
            className="text-xs text-slate-600 hover:text-red-400 py-1.5 px-2 rounded transition"
            title="Удалить последний подход"
          >
            Удалить последний
          </button>
        )}
      </div>
    </div>
  );
};
