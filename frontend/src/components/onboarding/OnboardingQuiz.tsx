import React, { useState } from 'react';
import {
  Sparkles, ArrowRight, ArrowLeft, Check, Dumbbell, Zap, Flame, Target, Activity, Ruler,
  User, Baby, Weight, RulerIcon, ArmMuscle, Shield, Footprints, Trophy, TrendingUp, Calendar, Bolt,
} from 'lucide-react';
import { User as UserType, WorkoutProgram } from '../../types';
import { programsApi, authApi } from '../../services/api';
import { triggerHaptic } from '../../utils/telegram';
import { analyzeBody } from '../../utils/bodyAnalysis';
import { BodyAnalysisCard } from '../common/BodyAnalysisCard';

interface OnboardingQuizProps {
  user: UserType | null;
  onComplete: (user: UserType, program: WorkoutProgram) => void;
}

export const OnboardingQuiz: React.FC<OnboardingQuizProps> = ({ user, onComplete }) => {
  const [step, setStep] = useState<number>(1);
  const totalSteps = 7;

  const [gender, setGender] = useState<'male' | 'female'>(
    user?.gender === 'female' ? 'female' : 'male'
  );
  const [age, setAge] = useState<number>(user?.age || 25);
  const [weight, setWeight] = useState<number>(user?.weight_kg || 75);
  const [height, setHeight] = useState<number>(user?.height_cm || 178);

  const [biceps, setBiceps] = useState<number>(user?.biceps_cm || 36);
  const [chest, setChest] = useState<number>(user?.chest_cm || 102);
  const [waist, setWaist] = useState<number>(user?.waist_cm || 82);
  const [hips, setHips] = useState<number>(user?.hips_cm || 98);

  const [experience, setExperience] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [goal, setGoal] = useState<'hypertrophy' | 'strength' | 'fat_loss'>('hypertrophy');
  const [daysPerWeek, setDaysPerWeek] = useState<number>(3);
  const [splitPreference, setSplitPreference] = useState<'full_body' | 'upper_lower' | 'ppl'>('full_body');

  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  const bodyAnalysis = analyzeBody({
    gender, weight, height, biceps, chest, waist, hips,
  });

  const handleNextStep = () => {
    triggerHaptic('impact');
    if (step < totalSteps) {
      setStep((prev) => prev + 1);
    } else {
      handleFinishQuiz();
    }
  };

  const handlePrevStep = () => {
    triggerHaptic('selection');
    if (step > 1) setStep((prev) => prev - 1);
  };

  const handleFinishQuiz = async () => {
    triggerHaptic('success');
    setIsGenerating(true);

    let selectedSplit = splitPreference;
    if (daysPerWeek === 4) selectedSplit = 'upper_lower';
    else if (daysPerWeek === 3 && experience === 'intermediate') selectedSplit = 'ppl';
    else if (daysPerWeek === 2) selectedSplit = 'full_body';

    try {
      const program = await programsApi.generate({
        weight_kg: weight, height_cm: height, age, gender,
        biceps_cm: biceps, chest_cm: chest, waist_cm: waist, hips_cm: hips,
        experience_level: experience, goal, split_type: selectedSplit, days_per_week: daysPerWeek,
      });

      const updatedUser = await authApi.updateProfile({
        gender, age, weight_kg: weight, height_cm: height,
        biceps_cm: biceps, chest_cm: chest, waist_cm: waist, hips_cm: hips,
        experience_level: experience, goal, is_onboarded: true,
      });

      setIsGenerating(false);
      onComplete(updatedUser, program);
    } catch (err) {
      console.error('Quiz generation error:', err);
      setIsGenerating(false);
      alert('Ошибка при составлении программы. Попробуйте ещё раз.');
    }
  };

  const selectedCard = 'bg-sky-500/10 border-sky-500/50 shadow-lg shadow-sky-950/30';
  const defaultCard = 'bg-white/[0.04] border-white/[0.07] hover:border-white/[0.15]';
  const inputClass = 'bg-white/[0.05] border border-white/[0.08] rounded-xl text-white font-mono font-bold text-center focus:outline-none focus:border-[#0A84FF]';
  const badgeClass = 'inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-sky-500/10 text-sky-400 text-xs font-semibold mb-2 border border-sky-500/20';

  return (
    <div className="min-h-screen bg-[#07090E] text-white flex flex-col justify-between p-4 max-w-md mx-auto selection:bg-[#0A84FF]/30">
      {/* Header & Progress */}
      <div>
        <div className="flex items-center justify-between py-2 mb-1">
          {step > 1 ? (
            <button onClick={handlePrevStep} className="p-2 -ml-2 text-slate-400 hover:text-white rounded-xl active:scale-95">
              <ArrowLeft size={20} />
            </button>
          ) : (
            <div className="w-8" />
          )}

          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-[#0A84FF] animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Шаг {step} из {totalSteps}
            </span>
          </div>

          <div className="w-8 text-right font-mono text-xs text-slate-500">
            {Math.round((step / totalSteps) * 100)}%
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-5">
          {[1, 2, 3, 4, 5, 6, 7].map((s) => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                s <= step ? 'bg-[#0A84FF]' : 'bg-white/[0.08]'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Main Body */}
      <div className="flex-1 flex flex-col justify-center py-2 overflow-y-auto">
        {/* STEP 1: Gender + Age */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <div className={badgeClass}>
                <User size={14} />
                <span>Персональный профиль</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight">Укажи свой пол и возраст</h1>
              <p className="text-xs text-slate-400 mt-1">
                Необходимо для подбора безопасных весов и скорости восстановления
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'male', label: 'Мужской', icon: User },
                { id: 'female', label: 'Женский', icon: Baby },
              ].map((g) => {
                const Icon = g.icon;
                return (
                  <button
                    key={g.id}
                    onClick={() => { triggerHaptic('selection'); setGender(g.id as 'male' | 'female'); }}
                    className={`p-4 rounded-2xl border flex flex-col items-center space-y-2 transition ${
                      gender === g.id ? selectedCard : defaultCard
                    }`}
                  >
                    <Icon size={32} className={gender === g.id ? 'text-sky-400' : 'text-slate-400'} />
                    <span className="font-bold text-sm text-white">{g.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="bg-[#0F172A]/80 backdrop-blur-md border border-white/[0.07] rounded-2xl p-4">
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Возраст (полных лет)
              </label>
              <div className="flex items-center space-x-3">
                <input
                  type="number" min="14" max="90" value={age}
                  onChange={(e) => setAge(parseInt(e.target.value) || 20)}
                  className={`w-24 px-4 py-2.5 ${inputClass} text-lg`}
                />
                <div className="flex flex-wrap gap-1.5 flex-1">
                  {[18, 22, 28, 35, 45].map((preset) => (
                    <button
                      key={preset}
                      onClick={() => { triggerHaptic('selection'); setAge(preset); }}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                        age === preset
                          ? 'bg-[#0A84FF] text-white font-bold'
                          : 'bg-white/5 text-slate-400 hover:text-white'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Height + Weight */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <div className={badgeClass}>
                <Target size={14} />
                <span>Базовые параметры</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight">Твой рост и вес</h1>
              <p className="text-xs text-slate-400 mt-1">
                Определяет базовый метаболизм и исходный силовой тоннаж
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#0F172A]/80 backdrop-blur-md border border-white/[0.07] rounded-2xl p-4">
                <span className="text-[11px] font-semibold text-slate-500 uppercase">Вес (кг)</span>
                <input
                  type="number" step="0.5" min="35" max="220" value={weight}
                  onChange={(e) => setWeight(parseFloat(e.target.value) || 70)}
                  className={`w-full mt-2 py-2.5 ${inputClass} text-xl`}
                />
              </div>
              <div className="bg-[#0F172A]/80 backdrop-blur-md border border-white/[0.07] rounded-2xl p-4">
                <span className="text-[11px] font-semibold text-slate-500 uppercase">Рост (см)</span>
                <input
                  type="number" min="120" max="230" value={height}
                  onChange={(e) => setHeight(parseInt(e.target.value) || 175)}
                  className={`w-full mt-2 py-2.5 ${inputClass} text-xl`}
                />
              </div>
            </div>

            <div className="bg-[#0F172A]/80 backdrop-blur-md border border-white/[0.07] rounded-2xl p-4 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Индекс массы тела</div>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-2xl font-bold text-white font-mono">{bodyAnalysis.bmi}</span>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${bodyAnalysis.bmiColor}`}>
                    {bodyAnalysis.bmiCategory}
                  </span>
                </div>
              </div>
              <div className="text-xs text-slate-500 text-right">
                Ориентир сухой массы:<br />
                <strong className="text-sky-400 font-mono text-sm">~{bodyAnalysis.idealWeightKg} кг</strong>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Body Measurements */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <div className={badgeClass}>
                <Ruler size={14} />
                <span>Замеры обхватов</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight">Замеры тела (в см)</h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Для точного расчёта V-образного силуэта и баланса мышц
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Бицепс', sub: 'напряжённый', hint: 'по пику руки', value: biceps, set: setBiceps, min: 20, max: 65, icon: ArmMuscle },
                { label: 'Грудь', sub: 'на вдохе', hint: 'по соскам / лопаткам', value: chest, set: setChest, min: 60, max: 160, icon: Shield },
                { label: 'Талия', sub: 'на выдохе', hint: 'по уровню пупка', value: waist, set: setWaist, min: 50, max: 160, icon: RulerIcon },
                { label: 'Бёдра', sub: 'ягодицы', hint: 'по максимуму', value: hips, set: setHips, min: 60, max: 160, icon: Footprints },
              ].map((m) => {
                const Icon = m.icon;
                return (
                  <div key={m.label} className="bg-[#0F172A]/80 backdrop-blur-md border border-white/[0.07] rounded-2xl p-3.5">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                        <Icon size={13} className="text-sky-400" />
                        {m.label}
                      </span>
                      <span className="text-[10px] text-slate-600">{m.sub}</span>
                    </div>
                    <input
                      type="number" step="0.5" min={m.min} max={m.max} value={m.value}
                      onChange={(e) => m.set(parseFloat(e.target.value) || 30)}
                      className={`w-full py-2 ${inputClass} text-lg`}
                    />
                    <span className="text-[10px] text-slate-600 block text-center mt-1">{m.hint}</span>
                  </div>
                );
              })}
            </div>

            <div className="p-3 bg-sky-500/5 border border-sky-500/15 rounded-xl text-[11px] text-sky-300">
              Если точных замеров нет — оставьте ориентировочные значения. Их можно скорректировать в профиле.
            </div>
          </div>
        )}

        {/* STEP 4: Body Analysis */}
        {step === 4 && (
          <div className="space-y-4">
            <div>
              <div className={badgeClass}>
                <Activity size={14} />
                <span>Биомеханический анализ</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight">Анализ твоего тела</h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Распределение мышечных пропорций и тип сложения
              </p>
            </div>
            <BodyAnalysisCard analysis={bodyAnalysis} showRecommendation={true} />
          </div>
        )}

        {/* STEP 5: Experience */}
        {step === 5 && (
          <div className="space-y-5">
            <div>
              <div className={badgeClass}>
                <Dumbbell size={14} />
                <span>Тренировочный стаж</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight">Твой опыт в зале</h1>
              <p className="text-xs text-slate-400 mt-1">
                Подберём упражнения с нужной сложностью и временем отдыха
              </p>
            </div>

            <div className="space-y-3">
              {[
                {
                  id: 'beginner', title: 'Новичок', icon: TrendingUp,
                  sub: 'Менее 1 года или начинаю с нуля',
                  desc: 'Упор на базовые многосуставные движения и отработку техники.',
                },
                {
                  id: 'intermediate', title: 'Средний уровень', icon: Dumbbell,
                  sub: '1–3 года регулярных тренировок',
                  desc: 'Хорошее понимание техники. Готов к умеренным и объёмным сплитам.',
                },
                {
                  id: 'advanced', title: 'Опытный атлет', icon: Trophy,
                  sub: 'Более 3 лет стажа',
                  desc: 'Высокая интенсивность, работа близко к отказу, специализированные сплиты.',
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => { triggerHaptic('selection'); setExperience(item.id as typeof experience); }}
                    className={`w-full p-4 rounded-2xl border text-left transition ${
                      experience === item.id ? selectedCard : defaultCard
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-sm text-white flex items-center gap-2">
                        <Icon size={16} className={experience === item.id ? 'text-sky-400' : 'text-slate-500'} />
                        {item.title}
                      </span>
                      {experience === item.id && <Check size={18} className="text-sky-400" />}
                    </div>
                    <div className="text-xs text-sky-400/80 font-medium mb-1">{item.sub}</div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">{item.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 6: Goal */}
        {step === 6 && (
          <div className="space-y-5">
            <div>
              <div className={badgeClass}>
                <Target size={14} />
                <span>Приоритет тренировок</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight">Главная цель</h1>
              <p className="text-xs text-slate-400 mt-1">
                Алгоритм задаст целевые диапазоны повторений и время отдыха
              </p>
            </div>

            <div className="space-y-3">
              {[
                {
                  id: 'hypertrophy', icon: Dumbbell, title: 'Набор массы (Гипертрофия)',
                  reps: '8–12 повторений · Отдых 60–90 сек',
                  desc: 'Увеличение объёмов мышц, красивый рельеф и плотность.',
                },
                {
                  id: 'strength', icon: Zap, title: 'Максимальная сила',
                  reps: '4–6 повторений · Отдых 2–2.5 мин',
                  desc: 'Рост силовых показателей в жиме, тяге и приседе.',
                },
                {
                  id: 'fat_loss', icon: Flame, title: 'Рельеф и жиросжигание',
                  reps: '10–15 повторений · Отдых 45–60 сек',
                  desc: 'Высокая плотность подходов для расхода калорий и тонуса.',
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => { triggerHaptic('selection'); setGoal(item.id as typeof goal); }}
                    className={`w-full p-4 rounded-2xl border text-left transition ${
                      goal === item.id ? selectedCard : defaultCard
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-2">
                        <Icon size={18} className={goal === item.id ? 'text-sky-400' : 'text-slate-500'} />
                        <span className="font-bold text-sm text-white">{item.title}</span>
                      </div>
                      {goal === item.id && <Check size={18} className="text-sky-400" />}
                    </div>
                    <div className="text-[11px] font-mono text-sky-400/70 mb-1">{item.reps}</div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">{item.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 7: Days + Split */}
        {step === 7 && (
          <div className="space-y-6">
            <div>
              <div className={badgeClass}>
                <Calendar size={14} />
                <span>График и сплит</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight">Сколько дней в неделю?</h1>
              <p className="text-xs text-slate-400 mt-1">
                Подберём гармоничный сплит для полного восстановления
              </p>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {[2, 3, 4, 5].map((d) => (
                <button
                  key={d}
                  onClick={() => {
                    triggerHaptic('selection');
                    setDaysPerWeek(d);
                    if (d === 4) setSplitPreference('upper_lower');
                    else if (d === 3) setSplitPreference(experience === 'intermediate' ? 'ppl' : 'full_body');
                    else if (d === 2) setSplitPreference('full_body');
                  }}
                  className={`py-3 rounded-2xl border text-center transition ${
                    daysPerWeek === d
                      ? 'bg-[#0A84FF] text-white font-bold border-[#0A84FF] shadow-lg shadow-[#0A84FF]/20'
                      : 'bg-white/[0.04] border-white/[0.07] text-white hover:border-white/[0.15]'
                  }`}
                >
                  <div className="text-xl font-mono">{d}</div>
                  <div className="text-[10px] uppercase font-semibold">дня</div>
                </button>
              ))}
            </div>

            <div className="bg-[#0F172A]/80 backdrop-blur-md border border-white/[0.07] rounded-2xl p-4">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                Рекомендуемый тип программы:
              </span>

              {daysPerWeek <= 3 ? (
                <div className="space-y-2">
                  <div className="font-bold text-white text-base flex items-center space-x-2">
                    <Bolt size={16} className="text-sky-400" />
                    <span>Full Body или Push/Pull/Legs</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Идеальная частота для качественного прогресса без переутомления ЦНС.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="font-bold text-white text-base flex items-center space-x-2">
                    <Bolt size={16} className="text-sky-400" />
                    <span>Верх / Низ (Upper / Lower)</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Разделение на верх и низ обеспечивает 48–72 часа отдыха на каждую группу.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom CTA */}
      <div className="pt-4 border-t border-white/[0.06]">
        <button
          onClick={handleNextStep}
          disabled={isGenerating}
          className="w-full py-4 px-6 bg-[#0A84FF] hover:bg-[#0070E0] active:scale-95 text-white font-bold text-sm rounded-2xl shadow-xl shadow-[#0A84FF]/25 flex items-center justify-center space-x-2 transition disabled:opacity-50"
        >
          {isGenerating ? (
            <span>Генерируем программу...</span>
          ) : step === totalSteps ? (
            <>
              <Sparkles size={18} />
              <span>Сгенерировать программу и начать!</span>
            </>
          ) : (
            <>
              <span>Продолжить</span>
              <ArrowRight size={18} />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
