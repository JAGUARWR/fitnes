import React, { useState, useEffect } from 'react';
import {
  Plus, Clipboard, ChevronRight, AlertTriangle, X, Sparkles
} from 'lucide-react';
import { WorkoutSession, Exercise, WorkoutSet, WorkoutProgram, ProgramDay } from '../../types';
import { workoutsApi, exercisesApi, programsApi } from '../../services/api';
import { WorkoutExerciseCard } from './WorkoutExerciseCard';
import { AddExerciseModal } from './AddExerciseModal';
import { RestTimer } from './RestTimer';
import { FinishWorkoutModal } from './FinishWorkoutModal';
import { triggerHaptic } from '../../utils/telegram';

interface LiveWorkoutViewProps {
  activeSession: WorkoutSession | null;
  activeProgram: WorkoutProgram | null;
  onSessionUpdated: (session: WorkoutSession | null) => void;
  onNavigateToPrograms: () => void;
  onProgramImported: (program: WorkoutProgram) => void;
}

const DAY_VARIANTS: Record<number, string[]> = {
  0: ['воскресенье', 'вс'],
  1: ['понедельник', 'пн'],
  2: ['вторник', 'вт'],
  3: ['среда', 'ср'],
  4: ['четверг', 'чт'],
  5: ['пятница', 'пт'],
  6: ['суббота', 'сб'],
};

function getTodayProgramDay(program: WorkoutProgram | null): ProgramDay | null {
  if (!program) return null;
  const variants = DAY_VARIANTS[new Date().getDay()] || [];
  return program.days.find((d) => variants.some((v) => d.name.toLowerCase().includes(v))) || null;
}

function estimateMinutes(day: ProgramDay): number {
  const sets = day.exercises.reduce((a, e) => a + e.target_sets, 0);
  return Math.round((sets * 4) / 5) * 5 || 45;
}

export const LiveWorkoutView: React.FC<LiveWorkoutViewProps> = ({
  activeSession, activeProgram, onSessionUpdated, onNavigateToPrograms, onProgramImported,
}) => {
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isFinishModalOpen, setIsFinishModalOpen] = useState(false);
  const [lastPerformances, setLastPerformances] = useState<Record<number, WorkoutSet[]>>({});
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [restRemaining, setRestRemaining] = useState(0);
  const [restTotal, setRestTotal] = useState(90);
  const [isRestActive, setIsRestActive] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState('');

  useEffect(() => { exercisesApi.list().then(setAllExercises).catch(console.error); }, []);

  useEffect(() => {
    if (!activeSession) { setElapsedSeconds(0); return; }
    const start = new Date(activeSession.started_at).getTime();
    const update = () => setElapsedSeconds(Math.max(0, Math.floor((Date.now() - start) / 1000)));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [activeSession]);

  useEffect(() => {
    if (!isRestActive || restRemaining <= 0) return;
    const id = setInterval(() => setRestRemaining((p) => { if (p <= 1) { setIsRestActive(false); return 0; } return p - 1; }), 1000);
    return () => clearInterval(id);
  }, [isRestActive, restRemaining]);

  const handleStartRestTimer = (s: number) => { setRestTotal(s); setRestRemaining(s); setIsRestActive(true); };

  const handleStartWorkout = async (name?: string, dayId?: number) => {
    triggerHaptic('impact');
    try {
      const session = await workoutsApi.start(name, dayId);
      onSessionUpdated(session);
    } catch (err) {
      console.error(err);
    }
  };

  const exerciseMap: Record<number, { exercise: Exercise; sets: WorkoutSet[] }> = {};
  if (activeSession?.sets) {
    for (const set of activeSession.sets) {
      if (!exerciseMap[set.exercise_id]) {
        const found = allExercises.find((e) => e.id === set.exercise_id) || set.exercise;
        if (found) exerciseMap[set.exercise_id] = { exercise: found, sets: [] };
      }
      exerciseMap[set.exercise_id]?.sets.push(set);
    }

    // Clean up sets: remove any accidental trailing dummy set (#1, 0 kg, 10 reps, uncompleted) when multiple sets exist
    for (const id in exerciseMap) {
      const group = exerciseMap[id];
      if (group.sets.length > 1) {
        const last = group.sets[group.sets.length - 1];
        if (last.set_number === 1 && last.weight_kg === 0 && !last.is_completed && last.id !== group.sets[0].id) {
          group.sets.pop();
        }
      }
      group.sets.forEach((s, i) => {
        s.set_number = i + 1;
      });
    }
  }

  useEffect(() => {
    if (!activeSession) return;
    Object.keys(exerciseMap).map(Number).forEach((id) => {
      if (!lastPerformances[id]) workoutsApi.getLastPerformance(id).then((h) => setLastPerformances((p) => ({ ...p, [id]: h }))).catch(console.error);
    });
  }, [activeSession?.sets?.length]);

  const handleAddSet = async (exId: number, setNum: number, w: number, r: number) => {
    if (!activeSession) return;
    try {
      const s = await workoutsApi.logSet(activeSession.id, { exercise_id: exId, set_number: setNum, weight_kg: w, reps: r, is_completed: false });
      onSessionUpdated({ ...activeSession, sets: [...(activeSession.sets || []), s] });
    } catch (err) { console.error(err); }
  };

  const handleUpdateSet = async (setId: number, w: number, r: number, done: boolean) => {
    if (!activeSession) return;
    const t = activeSession.sets.find((s) => s.id === setId);
    if (!t) return;
    try {
      const upd = await workoutsApi.logSet(activeSession.id, { exercise_id: t.exercise_id, set_number: t.set_number, weight_kg: w, reps: r, is_completed: done });
      onSessionUpdated({ ...activeSession, sets: activeSession.sets.map((s) => (s.id === setId ? upd : s)) });
    } catch (err) { console.error(err); }
  };

  const handleDeleteSet = async (setId: number) => {
    if (!activeSession) return;
    triggerHaptic('impact');
    try { await workoutsApi.deleteSet(setId); onSessionUpdated({ ...activeSession, sets: activeSession.sets.filter((s) => s.id !== setId) }); }
    catch (err) { console.error(err); }
  };

  const handleFinishWorkout = async (notes: string) => {
    if (!activeSession) return;
    try {
      const vol = (activeSession.sets || []).reduce((a, s) => (s.is_completed && s.weight_kg > 0 ? a + s.weight_kg * s.reps : a), 0);
      await workoutsApi.finish(activeSession.id, elapsedSeconds, vol, notes);
      onSessionUpdated(null); setIsFinishModalOpen(false); setIsRestActive(false);
    } catch (err) { console.error(err); }
  };

  const handleCancelWorkout = async () => {
    if (!activeSession) return;
    triggerHaptic('warning');
    try { await workoutsApi.cancel(activeSession.id); onSessionUpdated(null); setIsRestActive(false); setConfirmCancel(false); }
    catch (err) { console.error(err); }
  };

  const handleImport = async () => {
    if (!importText.trim()) return;
    setIsImporting(true);
    setImportError('');
    try {
      const program = await programsApi.importFromText(importText);
      triggerHaptic('success');
      setIsImportOpen(false);
      setImportText('');
      onProgramImported(program);   // ← обновляем activeProgram в App.tsx
      onNavigateToPrograms();       // ← переходим во вкладку Программы
    } catch (err: any) {
      setImportError(err?.message || 'Ошибка при разборе текста');
    } finally {
      setIsImporting(false);
    }
  };

  const h = Math.floor(elapsedSeconds / 3600), m = Math.floor((elapsedSeconds % 3600) / 60), s = elapsedSeconds % 60;
  const timeFormatted = h > 0 ? `${h}:${m < 10 ? '0' + m : m}:${s < 10 ? '0' + s : s}` : `${m < 10 ? '0' + m : m}:${s < 10 ? '0' + s : s}`;

  // ── ACTIVE WORKOUT ──
  if (activeSession) {
    const done = (activeSession.sets || []).filter((s) => s.is_completed).length;
    const vol = (activeSession.sets || []).reduce((a, s) => (s.is_completed && s.weight_kg > 0 ? a + s.weight_kg * s.reps : a), 0);
    return (
      <div className="p-4 pb-32 max-w-md mx-auto">
        <div className="sticky top-0 z-20 -mx-4 px-4 py-3 bg-[#07090E]/90 backdrop-blur-md border-b border-white/[0.06] mb-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[#0A84FF] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0A84FF] animate-pulse" />
                Тренировка идёт
              </div>
              <h1 className="text-base font-bold text-white truncate max-w-[190px]">{activeSession.name}</h1>
            </div>
            <div className="flex items-center gap-2">
              <div className="font-mono text-sm font-bold text-white bg-white/[0.07] px-3 py-1.5 rounded-xl border border-white/[0.06]">{timeFormatted}</div>
              <button onClick={() => setIsFinishModalOpen(true)} className="px-3.5 py-1.5 bg-[#0A84FF] hover:bg-[#0A84FF]/90 active:scale-95 text-white font-bold text-xs rounded-xl transition">Завершить</button>
            </div>
          </div>
          <div className="flex justify-between text-xs text-slate-500 mt-1.5">
            <span>Подходов: <strong className="text-white">{done}</strong></span>
            <span>Объём: <strong className="text-[#0A84FF]">{vol} кг</strong></span>
          </div>
        </div>

        <div className="space-y-4">
          {Object.entries(exerciseMap).map(([idStr, data]) => {
            const exId = Number(idStr);
            return (
              <WorkoutExerciseCard key={exId} exercise={data.exercise} sets={data.sets} lastPerformance={lastPerformances[exId]}
                onAddSet={handleAddSet} onUpdateSet={handleUpdateSet} onDeleteSet={handleDeleteSet}
                onStartRestTimer={handleStartRestTimer}
                onRemoveExercise={async () => { for (const s of data.sets) await workoutsApi.deleteSet(s.id); onSessionUpdated({ ...activeSession, sets: activeSession.sets.filter((s) => s.exercise_id !== exId) }); }} />
            );
          })}
        </div>

        <div className="mt-4 space-y-2">
          <button onClick={() => setIsAddModalOpen(true)} className="w-full py-3 px-4 bg-white/[0.04] hover:bg-white/[0.07] active:scale-95 text-[#0A84FF] font-semibold rounded-2xl border border-dashed border-white/10 hover:border-[#0A84FF]/40 flex items-center justify-center gap-2 text-sm transition">
            <Plus size={16} />Добавить упражнение
          </button>
          {!confirmCancel ? (
            <button onClick={() => setConfirmCancel(true)} className="w-full py-2 text-center text-xs text-slate-500 hover:text-red-400 transition">Отменить тренировку</button>
          ) : (
            <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20">
              <div className="flex items-center gap-1.5 text-xs text-red-400"><AlertTriangle size={13} /><span>Удалить тренировку?</span></div>
              <div className="flex items-center gap-2">
                <button onClick={() => setConfirmCancel(false)} className="px-3 py-1 text-xs font-semibold text-slate-300 bg-white/5 active:scale-95 rounded-lg transition">Нет</button>
                <button onClick={handleCancelWorkout} className="px-3 py-1 text-xs font-bold text-white bg-red-500 hover:bg-red-600 active:scale-95 rounded-lg transition">Да</button>
              </div>
            </div>
          )}
        </div>

        <AddExerciseModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} exercises={allExercises} onSelectExercise={async (ex) => { triggerHaptic('impact'); await handleAddSet(ex.id, 1, 0, 10); }} />
        <RestTimer remainingSeconds={restRemaining} totalSeconds={restTotal} isActive={isRestActive} onToggle={() => setIsRestActive(!isRestActive)} onAdjust={(d) => setRestRemaining((p) => Math.max(5, p + d))} onDismiss={() => setIsRestActive(false)} />
        <FinishWorkoutModal isOpen={isFinishModalOpen} durationSeconds={elapsedSeconds} totalVolumeKg={vol} totalSets={done} onConfirm={handleFinishWorkout} onCancel={() => setIsFinishModalOpen(false)} />
      </div>
    );
  }

  // ── HOME SCREEN ──
  const todayDay = getTodayProgramDay(activeProgram);
  const todayName = new Date().toLocaleDateString('ru-RU', { weekday: 'long' });
  const todayCapital = todayName.charAt(0).toUpperCase() + todayName.slice(1);

  return (
    <div className="p-4 pb-28 max-w-md mx-auto space-y-5">

      {/* TODAY'S PLAN */}
      <section>
        <h2 className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 mb-2.5">Сегодня по плану</h2>
        {activeProgram ? (
          todayDay ? (
            <div className="bg-[#0F172A]/80 border border-white/[0.07] rounded-2xl overflow-hidden backdrop-blur-md">
              <div className="px-4 pt-4 pb-3">
                <div className="text-[11px] text-slate-400 mb-0.5">{todayCapital} · {todayDay.exercises.length} упр. · ~{estimateMinutes(todayDay)} мин</div>
                <h3 className="text-[17px] font-semibold text-white mb-1">{todayDay.name}</h3>
                <div className="text-[12px] text-slate-500 mb-4 truncate">
                  {todayDay.exercises.slice(0, 3).map((pe) => pe.exercise?.name || `Упр. #${pe.exercise_id}`).join(' · ')}
                  {todayDay.exercises.length > 3 && ` + ещё ${todayDay.exercises.length - 3}`}
                </div>
                <button
                  onClick={() => { triggerHaptic('impact'); handleStartWorkout(todayDay.name, todayDay.id); }}
                  className="w-full py-3 bg-[#0A84FF] hover:bg-[#0A84FF]/90 active:scale-[0.98] text-white font-semibold text-[15px] rounded-xl transition shadow-lg shadow-[#0A84FF]/20"
                >
                  Начать: {todayDay.name}
                </button>
              </div>
              <div className="border-t border-white/[0.05] px-4 py-2.5">
                <button onClick={() => handleStartWorkout('Свободная тренировка')} className="text-[12px] text-slate-500 hover:text-slate-300 transition w-full text-center">
                  Свободная тренировка без плана
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-[#0F172A]/80 border border-white/[0.07] rounded-2xl px-4 py-4 backdrop-blur-md flex items-center justify-between">
              <div>
                <div className="text-[13px] font-semibold text-white">День отдыха</div>
                <div className="text-[12px] text-slate-500 mt-0.5">{todayCapital} — восстановление</div>
              </div>
              <button onClick={() => handleStartWorkout('Свободная тренировка')} className="px-3.5 py-2 bg-white/[0.07] hover:bg-white/10 active:scale-95 text-slate-300 text-[13px] font-medium rounded-xl border border-white/[0.07] transition">
                Всё равно начать
              </button>
            </div>
          )
        ) : (
          <div className="bg-[#0F172A]/80 border border-white/[0.07] rounded-2xl px-4 py-4 backdrop-blur-md">
            <div className="text-[13px] font-semibold text-white mb-1">Программа не выбрана</div>
            <div className="text-[12px] text-slate-500 mb-3">Сгенерируй план или импортируй из заметок.</div>
            <div className="flex gap-2">
              <button onClick={() => handleStartWorkout('Свободная тренировка')} className="flex-1 py-2.5 bg-white/[0.06] hover:bg-white/10 active:scale-95 text-slate-300 text-[13px] font-medium rounded-xl border border-white/[0.07] transition">Без плана</button>
              <button onClick={onNavigateToPrograms} className="flex-1 py-2.5 bg-[#0A84FF] hover:bg-[#0A84FF]/90 active:scale-95 text-white text-[13px] font-semibold rounded-xl transition">Выбрать план</button>
            </div>
          </div>
        )}
      </section>

      {/* IMPORT FROM NOTES */}
      <section>
        <button onClick={() => { triggerHaptic('impact'); setIsImportOpen(true); }}
          className="w-full flex items-center gap-3 px-4 py-3 bg-[#0F172A]/60 hover:bg-[#0F172A]/90 active:scale-[0.99] border border-white/[0.07] rounded-2xl backdrop-blur-md transition">
          <div className="w-8 h-8 rounded-xl bg-white/[0.06] flex items-center justify-center shrink-0">
            <Clipboard size={15} className="text-slate-400" />
          </div>
          <div className="text-left">
            <div className="text-[13px] font-medium text-white">Вставить свою программу</div>
            <div className="text-[11px] text-slate-500">Импорт из заметок или Telegram</div>
          </div>
          <ChevronRight size={14} className="text-slate-600 ml-auto" />
        </button>
      </section>

      {/* PROGRAM DAYS */}
      {activeProgram && activeProgram.days.length > 0 && (
        <section>
          <h2 className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 mb-2.5">{activeProgram.title}</h2>
          <div className="space-y-2">
            {activeProgram.days.map((day) => {
              const preview = day.exercises.slice(0, 2).map((pe) => pe.exercise?.name || allExercises.find((e) => e.id === pe.exercise_id)?.name).filter(Boolean);
              const extra = day.exercises.length - 2;
              return (
                <button key={day.id}
                  onClick={() => { triggerHaptic('impact'); handleStartWorkout(day.name, day.id); }}
                  className="w-full flex items-center justify-between px-4 py-3.5 bg-[#0F172A]/60 hover:bg-[#0F172A]/90 active:scale-[0.99] border border-white/[0.05] rounded-2xl backdrop-blur-md transition group">
                  <div className="text-left">
                    <div className="text-[14px] font-semibold text-white group-hover:text-[#0A84FF] transition">{day.name}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5 truncate max-w-[220px]">
                      {preview.join(', ')}{extra > 0 ? ` + ${extra} упр.` : ''}{preview.length === 0 && `${day.exercises.length} упражнений`}
                    </div>
                  </div>
                  <ChevronRight size={15} className="text-slate-600 group-hover:text-[#0A84FF] transition shrink-0" />
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* IMPORT BOTTOM SHEET */}
      <div className={`fixed inset-0 z-50 flex items-end justify-center transition-opacity duration-200 ${isImportOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setIsImportOpen(false); setImportError(''); }} />
        <div className={`relative w-full max-w-lg bg-[#0F172A] border border-white/[0.08] rounded-t-3xl shadow-2xl transition-transform duration-200 ${isImportOpen ? 'translate-y-0' : 'translate-y-full'}`}>
          <div className="flex justify-center pt-3 pb-1"><div className="w-9 h-1 bg-white/20 rounded-full" /></div>
          <div className="px-5 pb-24 pt-2">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-[16px] font-semibold text-white">Вставить программу</h3>
                <p className="text-[12px] text-slate-500 mt-0.5">Текст из заметок, Telegram или любого источника</p>
              </div>
              <button onClick={() => { setIsImportOpen(false); setImportError(''); }} className="p-1.5 text-slate-500 hover:text-white rounded-xl hover:bg-white/5 transition"><X size={18} /></button>
            </div>
            <textarea value={importText} onChange={(e) => { setImportText(e.target.value); setImportError(''); }}
              placeholder="Вставь сюда текст тренировки из заметок или Telegram..."
              rows={7} className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.08] rounded-2xl text-white text-[13px] placeholder-slate-600 focus:outline-none focus:border-[#0A84FF]/50 resize-none" />
            {importError && (
              <div className="mt-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-xl text-[12px] text-red-400">
                {importError}
              </div>
            )}
            <button onClick={handleImport} disabled={!importText.trim() || isImporting}
              className="mt-3 w-full py-3 bg-[#0A84FF] hover:bg-[#0A84FF]/90 active:scale-[0.98] text-white font-semibold text-[14px] rounded-xl transition disabled:opacity-40 flex items-center justify-center gap-2">
              <Sparkles size={15} />{isImporting ? 'Распознаю...' : 'Распознать и сохранить'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
