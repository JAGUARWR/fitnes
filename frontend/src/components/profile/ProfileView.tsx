import React, { useState } from 'react';
import { User as UserIcon, Bot, Smartphone, Save, Sparkles, HelpCircle, Ruler, Activity } from 'lucide-react';
import { User } from '../../types';
import { authApi } from '../../services/api';
import { isInsideTelegram, triggerHaptic } from '../../utils/telegram';
import { analyzeBody } from '../../utils/bodyAnalysis';
import { BodyAnalysisCard } from '../common/BodyAnalysisCard';

interface ProfileViewProps {
  user: User | null;
  onUserUpdated: (user: User) => void;
  onRetakeQuiz?: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ user, onUserUpdated, onRetakeQuiz }) => {
  const [weight, setWeight] = useState<number>(user?.weight_kg || 75);
  const [height, setHeight] = useState<number>(user?.height_cm || 178);
  const [age, setAge] = useState<number>(user?.age || 25);
  const [gender, setGender] = useState<string>(user?.gender || 'male');

  const [biceps, setBiceps] = useState<number>(user?.biceps_cm || 36);
  const [chest, setChest] = useState<number>(user?.chest_cm || 102);
  const [waist, setWaist] = useState<number>(user?.waist_cm || 82);
  const [hips, setHips] = useState<number>(user?.hips_cm || 98);

  const [experience, setExperience] = useState<string>(user?.experience_level || 'beginner');
  const [goal, setGoal] = useState<string>(user?.goal || 'hypertrophy');
  const [isSaved, setIsSaved] = useState(false);

  const insideTelegram = isInsideTelegram();

  const bodyAnalysis = analyzeBody({
    gender: gender as 'male' | 'female',
    weight,
    height,
    biceps,
    chest,
    waist,
    hips,
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic('success');
    try {
      const updated = await authApi.updateProfile({
        weight_kg: weight,
        height_cm: height,
        age: age,
        gender: gender,
        biceps_cm: biceps,
        chest_cm: chest,
        waist_cm: waist,
        hips_cm: hips,
        experience_level: experience as User['experience_level'],
        goal: goal as User['goal'],
      });
      onUserUpdated(updated);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2500);
    } catch (err) {
      console.error(err);
    }
  };

  const inputClass = 'w-full px-2 py-2 bg-white/[0.05] border border-white/[0.08] rounded-xl text-white font-mono font-semibold text-sm focus:outline-none focus:border-[#0A84FF] text-center';

  return (
    <div className="p-4 pb-24 max-w-md mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-bold text-white">Профиль атлета</h1>
        <p className="text-xs text-slate-400">
          Параметры тела, биомеханический анализ и замеры
        </p>
      </div>

      {/* Retake Quiz Banner */}
      {onRetakeQuiz && (
        <div className="bg-gradient-to-r from-sky-500/15 to-blue-500/15 border border-sky-500/30 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="font-bold text-sm text-white flex items-center space-x-1.5">
              <Sparkles size={16} className="text-sky-400" />
              <span>Фитнес-тестирование</span>
            </div>
            <p className="text-[11px] text-slate-300 mt-0.5">
              Пройди опрос заново, чтобы пересчитать программу
            </p>
          </div>
          <button
            onClick={() => {
              triggerHaptic('impact');
              onRetakeQuiz();
            }}
            className="px-3 py-2 bg-[#0A84FF] hover:bg-[#0070E0] active:scale-95 text-white font-semibold text-xs rounded-xl shadow-md shadow-[#0A84FF]/20 whitespace-nowrap transition"
          >
            Пройти тест
          </button>
        </div>
      )}

      {/* Environment Status */}
      <div className="bg-[#0F172A]/80 backdrop-blur-md border border-white/[0.07] rounded-2xl p-3.5 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              insideTelegram ? 'bg-sky-500/15 text-sky-400' : 'bg-slate-500/15 text-slate-400'
            }`}
          >
            {insideTelegram ? <Smartphone size={20} /> : <Bot size={20} />}
          </div>
          <div>
            <div className="text-xs font-semibold text-white">
              {insideTelegram ? 'Telegram Mini App' : 'Режим тестирования'}
            </div>
            <div className="text-[11px] text-slate-500">
              {insideTelegram
                ? `ID: ${user?.telegram_id || 'Авторизован'}`
                : 'Dev Mode'}
            </div>
          </div>
        </div>

        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
          insideTelegram ? 'bg-sky-500/15 text-sky-400' : 'bg-white/5 text-slate-400'
        }`}>
          {insideTelegram ? 'Online' : 'Dev'}
        </span>
      </div>

      {/* Body Analysis */}
      <div>
        <h2 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5 mb-2.5">
          <Activity size={14} className="text-sky-400" />
          <span>Анализ тела и пропорций</span>
        </h2>
        <BodyAnalysisCard analysis={bodyAnalysis} showRecommendation={true} />
      </div>

      {/* Profile Form */}
      <form onSubmit={handleSave} className="bg-[#0F172A]/80 backdrop-blur-md border border-white/[0.07] rounded-2xl p-5 space-y-4">
        <h2 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
          <UserIcon size={14} className="text-sky-400" />
          <span>Базовые параметры</span>
        </h2>

        <div className="grid grid-cols-3 gap-2.5">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1 text-center">Возраст</label>
            <input
              type="number" min="14" max="99"
              value={age}
              onChange={(e) => setAge(parseInt(e.target.value) || 20)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1 text-center">Вес (кг)</label>
            <input
              type="number" step="0.1"
              value={weight}
              onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1 text-center">Рост (см)</label>
            <input
              type="number"
              value={height}
              onChange={(e) => setHeight(parseFloat(e.target.value) || 0)}
              className={inputClass}
            />
          </div>
        </div>

        {/* Measurements */}
        <div className="pt-2 border-t border-white/[0.06]">
          <h3 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5 mb-2.5">
            <Ruler size={13} className="text-sky-400" />
            <span>Замеры обхватов (см)</span>
          </h3>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Бицепс</label>
              <input type="number" step="0.5" value={biceps}
                onChange={(e) => setBiceps(parseFloat(e.target.value) || 0)}
                className={inputClass} />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Грудь</label>
              <input type="number" step="0.5" value={chest}
                onChange={(e) => setChest(parseFloat(e.target.value) || 0)}
                className={inputClass} />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Талия</label>
              <input type="number" step="0.5" value={waist}
                onChange={(e) => setWaist(parseFloat(e.target.value) || 0)}
                className={inputClass} />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Бёдра</label>
              <input type="number" step="0.5" value={hips}
                onChange={(e) => setHips(parseFloat(e.target.value) || 0)}
                className={inputClass} />
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-white/[0.06]">
          <label className="block text-[11px] font-semibold text-slate-500 mb-1">Опыт тренировок</label>
          <select
            value={experience}
            onChange={(e) => setExperience(e.target.value)}
            className="w-full px-3 py-2 bg-white/[0.05] border border-white/[0.08] rounded-xl text-white text-xs focus:outline-none focus:border-[#0A84FF]"
          >
            <option value="beginner">Новичок (до 1 года)</option>
            <option value="intermediate">Средний уровень (1–3 года)</option>
            <option value="advanced">Опытный атлет (более 3 лет)</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-500 mb-1">Текущая цель</label>
          <select
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            className="w-full px-3 py-2 bg-white/[0.05] border border-white/[0.08] rounded-xl text-white text-xs focus:outline-none focus:border-[#0A84FF]"
          >
            <option value="hypertrophy">Набор мышечной массы (Гипертрофия)</option>
            <option value="strength">Развитие силы и мощности</option>
            <option value="fat_loss">Рельеф и сжигание жира</option>
          </select>
        </div>

        <button
          type="submit"
          className="w-full py-3 bg-[#0A84FF] hover:bg-[#0070E0] active:scale-95 text-white font-semibold text-xs rounded-xl shadow-lg shadow-[#0A84FF]/20 flex items-center justify-center space-x-1.5 transition"
        >
          <Save size={16} />
          <span>{isSaved ? 'Сохранено!' : 'Сохранить изменения'}</span>
        </button>
      </form>

      {/* Telegram Guide */}
      <div className="bg-[#0F172A]/80 backdrop-blur-md border border-white/[0.07] rounded-2xl p-5">
        <h2 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5 mb-3">
          <HelpCircle size={14} className="text-sky-400" />
          <span>Как подключить Telegram-бота</span>
        </h2>

        <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
          <div className="flex items-start space-x-2">
            <span className="w-5 h-5 rounded-full bg-sky-500/15 flex items-center justify-center text-[10px] font-bold text-sky-400 shrink-0">1</span>
            <span>Откройте <strong>@BotFather</strong> в Telegram и отправьте <code>/newbot</code></span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="w-5 h-5 rounded-full bg-sky-500/15 flex items-center justify-center text-[10px] font-bold text-sky-400 shrink-0">2</span>
            <span>Скопируйте токен в <code>backend/.env</code> → <code>BOT_TOKEN=...</code></span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="w-5 h-5 rounded-full bg-sky-500/15 flex items-center justify-center text-[10px] font-bold text-sky-400 shrink-0">3</span>
            <span>В BotFather: <code>/setmenubutton</code> → выберите бота → укажите URL Web App</span>
          </div>
        </div>
      </div>
    </div>
  );
};
