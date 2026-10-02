import React, { useState, useEffect } from 'react';
import { Sparkles, Check, ChevronDown, ChevronUp, Dumbbell, Zap, Target, Bolt } from 'lucide-react';
import { WorkoutProgram, User } from '../../types';
import { programsApi } from '../../services/api';
import { triggerHaptic } from '../../utils/telegram';

interface ProgramsViewProps {
  user: User | null;
  activeProgram: WorkoutProgram | null;
  onProgramActivated: (program: WorkoutProgram) => void;
  onNavigateToWorkout: () => void;
}

export const ProgramsView: React.FC<ProgramsViewProps> = ({
  user,
  activeProgram,
  onProgramActivated,
  onNavigateToWorkout,
}) => {
  const [programs, setPrograms] = useState<WorkoutProgram[]>([]);
  const [activeTab, setActiveTab] = useState<'generator' | 'catalog'>('generator');
  const [expandedProgramId, setExpandedProgramId] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const [weight, setWeight] = useState<number>(user?.weight_kg || 75);
  const [experience, setExperience] = useState<string>(user?.experience_level || 'beginner');
  const [goal, setGoal] = useState<string>(user?.goal || 'hypertrophy');
  const [splitType, setSplitType] = useState<string>('full_body');
  const [daysCount, setDaysCount] = useState<number>(3);

  const loadPrograms = async () => {
    try {
      const list = await programsApi.list();
      setPrograms(list);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadPrograms();
  }, []);

  const handleGenerate = async () => {
    triggerHaptic('impact');
    setIsGenerating(true);
    try {
      const generated = await programsApi.generate({
        weight_kg: weight,
        gender: user?.gender || 'male',
        experience_level: experience,
        goal: goal,
        split_type: splitType,
        days_per_week: daysCount,
      });

      triggerHaptic('success');
      onProgramActivated(generated);
      await loadPrograms();
      setExpandedProgramId(generated.id);
      setActiveTab('catalog');
    } catch (err) {
      console.error(err);
      alert('Ошибка при генерации программы');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleActivate = async (p: WorkoutProgram) => {
    triggerHaptic('success');
    try {
      await programsApi.activate(p.id);
      onProgramActivated(p);
      await loadPrograms();
    } catch (err) {
      console.error(err);
    }
  };

  const selectedCard = 'bg-sky-500/10 border-sky-500/50 text-sky-400';
  const defaultCard = 'bg-white/[0.04] border-white/[0.07] text-gray-400 hover:border-white/[0.15] hover:text-gray-200';

  return (
    <div className="p-4 pb-24 max-w-md mx-auto">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-white">Программы тренировок</h1>
        <p className="text-xs text-slate-400">
          Сгенерируй персональный сплит или выбери проверенные шаблоны
        </p>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-2 gap-1.5 p-1 bg-white/[0.04] rounded-2xl border border-white/[0.06] mb-5">
        <button
          onClick={() => setActiveTab('generator')}
          className={`py-2.5 text-xs font-semibold rounded-xl transition flex items-center justify-center gap-1.5 ${
            activeTab === 'generator'
              ? 'bg-[#0A84FF] text-white shadow-md shadow-[#0A84FF]/25'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Bolt size={13} />
          Генератор
        </button>
        <button
          onClick={() => setActiveTab('catalog')}
          className={`py-2.5 text-xs font-semibold rounded-xl transition flex items-center justify-center gap-1.5 ${
            activeTab === 'catalog'
              ? 'bg-[#0A84FF] text-white shadow-md shadow-[#0A84FF]/25'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Dumbbell size={13} />
          Мои ({programs.length})
        </button>
      </div>

      {/* Generator Wizard */}
      {activeTab === 'generator' ? (
        <div className="bg-[#0F172A]/80 backdrop-blur-md border border-white/[0.07] rounded-2xl p-5 space-y-5">
          {/* Step 1: Weight */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              1. Твой вес тела (кг)
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(parseFloat(e.target.value) || 70)}
                className="w-32 px-4 py-2.5 bg-white/[0.05] border border-white/[0.08] rounded-xl text-white font-mono font-semibold text-base focus:outline-none focus:border-[#0A84FF]"
              />
              <span className="text-xs text-slate-500">
                Используется для расчёта объёма нагрузок
              </span>
            </div>
          </div>

          {/* Step 2: Experience */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              2. Опыт тренировок
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'beginner', label: 'Новичок', sub: '< 1 года' },
                { id: 'intermediate', label: 'Средний', sub: '1–3 года' },
                { id: 'advanced', label: 'Опытный', sub: '3+ года' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setExperience(item.id)}
                  className={`p-2.5 rounded-xl border text-center transition ${
                    experience === item.id ? selectedCard : defaultCard
                  }`}
                >
                  <div className="text-xs font-bold">{item.label}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{item.sub}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Step 3: Goal */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              3. Главная цель
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'hypertrophy', label: 'Масса', icon: Target },
                { id: 'strength', label: 'Сила', icon: Zap },
                { id: 'fat_loss', label: 'Рельеф', icon: Sparkles },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setGoal(item.id)}
                    className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center ${
                      goal === item.id ? selectedCard : defaultCard
                    }`}
                  >
                    <Icon size={16} className="mb-1" />
                    <span className="text-xs font-bold">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 4: Split Type */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              4. Тип сплита
            </label>
            <div className="space-y-2">
              {[
                {
                  id: 'full_body',
                  label: 'Full Body (Все тело)',
                  desc: 'Проработка всех мышечных групп за тренировку. Отлично для новичков.',
                  defDays: 3,
                },
                {
                  id: 'upper_lower',
                  label: 'Верх / Низ',
                  desc: 'Чередование дней верха и низа. Идеальный баланс (4 дня).',
                  defDays: 4,
                },
                {
                  id: 'ppl',
                  label: 'Push / Pull / Legs',
                  desc: 'Классическое разделение: жимовые, тяговые и день ног (3 дня).',
                  defDays: 3,
                },
              ].map((split) => (
                <button
                  key={split.id}
                  onClick={() => {
                    setSplitType(split.id);
                    setDaysCount(split.defDays);
                  }}
                  className={`w-full p-3 rounded-2xl border text-left transition ${
                    splitType === split.id
                      ? 'bg-sky-500/10 border-sky-500/50'
                      : 'bg-white/[0.04] border-white/[0.07] hover:border-white/[0.15]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-sm font-semibold ${
                        splitType === split.id ? 'text-sky-400' : 'text-white'
                      }`}
                    >
                      {split.label}
                    </span>
                    {splitType === split.id && <Check size={16} className="text-sky-400" />}
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug">{split.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Step 5: Days count */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                5. Тренировок в неделю
              </label>
              <span className="font-mono text-sm font-bold text-sky-400">
                {daysCount} {daysCount === 2 || daysCount === 3 || daysCount === 4 ? 'дня' : 'дней'}
              </span>
            </div>
            <div className="flex space-x-2">
              {[2, 3, 4, 5].map((d) => (
                <button
                  key={d}
                  onClick={() => setDaysCount(d)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold border transition ${
                    daysCount === d
                      ? 'bg-[#0A84FF] text-white border-[#0A84FF]'
                      : 'bg-white/[0.04] border-white/[0.07] text-slate-400 hover:text-white'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full py-3.5 px-4 bg-[#0A84FF] hover:bg-[#0070E0] active:scale-95 text-white font-semibold text-sm rounded-2xl shadow-lg shadow-[#0A84FF]/25 flex items-center justify-center space-x-2 transition disabled:opacity-50"
          >
            <Sparkles size={18} />
            <span>{isGenerating ? 'Составление программы...' : 'Сгенерировать программу'}</span>
          </button>
        </div>
      ) : (
        /* Program Catalog */
        <div className="space-y-3">
          {programs.map((program) => {
            const isCurrent = activeProgram?.id === program.id;
            const isExpanded = expandedProgramId === program.id;

            return (
              <div
                key={program.id}
                className={`bg-[#0F172A]/80 backdrop-blur-md border rounded-2xl overflow-hidden transition ${
                  isCurrent ? 'border-sky-500/40' : 'border-white/[0.07]'
                }`}
              >
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      {isCurrent && (
                        <span className="inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-[#0A84FF] text-white mb-1.5">
                          Активная
                        </span>
                      )}
                      <h3 className="text-base font-semibold text-white tracking-tight">
                        {program.title}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {program.days_per_week} дн./нед · {program.difficulty}
                      </p>
                    </div>

                    <button
                      onClick={() => setExpandedProgramId(isExpanded ? null : program.id)}
                      className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/5 transition"
                    >
                      {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>
                  </div>

                  {program.description && (
                    <p className="text-xs text-slate-500 mb-4">{program.description}</p>
                  )}

                  <div className="flex items-center space-x-2">
                    {!isCurrent ? (
                      <button
                        onClick={() => handleActivate(program)}
                        className="flex-1 py-2 px-3 bg-white/[0.06] hover:bg-white/[0.1] active:scale-95 text-xs font-semibold text-sky-400 rounded-xl transition"
                      >
                        Сделать активной
                      </button>
                    ) : (
                      <button
                        onClick={onNavigateToWorkout}
                        className="flex-1 py-2 px-3 bg-[#0A84FF] hover:bg-[#0070E0] active:scale-95 text-xs font-semibold text-white rounded-xl transition"
                      >
                        Начать тренировку
                      </button>
                    )}

                    <button
                      onClick={() => setExpandedProgramId(isExpanded ? null : program.id)}
                      className="py-2 px-3 text-xs text-slate-400 hover:text-white rounded-xl bg-white/[0.04] border border-white/[0.06] transition"
                    >
                      {isExpanded ? 'Скрыть' : `Дни (${program.days.length})`}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="bg-white/[0.02] border-t border-white/[0.06] p-4 space-y-3">
                    {program.days.map((day) => (
                      <div
                        key={day.id}
                        className="bg-[#0F172A]/60 p-3 rounded-xl border border-white/[0.06]"
                      >
                        <div className="font-semibold text-sm text-sky-400 mb-2">
                          {day.name}
                        </div>
                        <div className="space-y-1.5">
                          {day.exercises.map((pe) => (
                            <div
                              key={pe.id}
                              className="flex items-center justify-between text-xs py-1 border-b border-white/[0.04] last:border-0"
                            >
                              <span className="text-slate-200">
                                {pe.exercise?.name || `Упражнение #${pe.exercise_id}`}
                              </span>
                              <span className="font-mono text-slate-500">
                                {pe.target_sets}×{pe.target_reps} ({pe.rest_seconds}с)
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
