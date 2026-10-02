import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Clock, Dumbbell, CheckCircle2 } from 'lucide-react';
import { triggerHaptic } from '../../utils/telegram';

interface FinishWorkoutModalProps {
  isOpen: boolean;
  durationSeconds: number;
  totalVolumeKg: number;
  totalSets: number;
  onConfirm: (notes: string) => void;
  onCancel: () => void;
}

export const FinishWorkoutModal: React.FC<FinishWorkoutModalProps> = ({
  isOpen,
  durationSeconds,
  totalVolumeKg,
  totalSets,
  onConfirm,
  onCancel,
}) => {
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (isOpen) {
      triggerHaptic('success');
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#0A84FF', '#38BDF8', '#FF9F0A', '#FFFFFF'],
        });
      } catch {
        // Ignored
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const minutes = Math.floor(durationSeconds / 60);

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 transition-opacity duration-200 ${
      isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
    }`}>
      <div className={`w-full max-w-sm bg-[#0F172A] border border-sky-500/30 rounded-3xl p-6 shadow-2xl text-center transition-transform duration-200 ${
        isOpen ? 'translate-y-0 scale-100' : 'translate-y-2 scale-95'
      }`}>
        {/* Trophy Icon */}
        <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-[#0A84FF]/15 border border-[#0A84FF]/30 flex items-center justify-center text-sky-400">
          <Trophy size={32} />
        </div>

        <h2 className="text-xl font-bold text-white mb-1">
          Тренировка завершена!
        </h2>
        <p className="text-xs text-slate-400 mb-5">
          Отличная работа! Все подходы зафиксированы в истории.
        </p>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          <div className="bg-white/[0.04] p-2.5 rounded-2xl border border-white/[0.06]">
            <Clock size={16} className="text-sky-400 mx-auto mb-1" />
            <div className="text-base font-bold text-white font-mono">{minutes}м</div>
            <div className="text-[10px] text-slate-500 uppercase">Время</div>
          </div>

          <div className="bg-white/[0.04] p-2.5 rounded-2xl border border-white/[0.06]">
            <Dumbbell size={16} className="text-sky-400 mx-auto mb-1" />
            <div className="text-base font-bold text-white font-mono">
              {totalVolumeKg > 1000 ? `${(totalVolumeKg / 1000).toFixed(1)}т` : `${totalVolumeKg}k`}
            </div>
            <div className="text-[10px] text-slate-500 uppercase">Тоннаж</div>
          </div>

          <div className="bg-white/[0.04] p-2.5 rounded-2xl border border-white/[0.06]">
            <CheckCircle2 size={16} className="text-amber-400 mx-auto mb-1" />
            <div className="text-base font-bold text-white font-mono">{totalSets}</div>
            <div className="text-[10px] text-slate-500 uppercase">Сетов</div>
          </div>
        </div>

        {/* Notes */}
        <div className="mb-5 text-left">
          <label className="block text-[11px] font-semibold text-slate-500 mb-1.5">
            Заметка к тренировке (по желанию):
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Самочувствие, памп, рекорды..."
            className="w-full px-3 py-2 bg-white/[0.05] border border-white/[0.08] rounded-xl text-white text-xs placeholder-slate-600 focus:outline-none focus:border-[#0A84FF]"
          />
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <button
            onClick={() => onConfirm(notes)}
            className="w-full py-3 px-4 bg-[#0A84FF] hover:bg-[#0070E0] active:scale-95 text-white font-semibold rounded-xl text-sm transition shadow-lg shadow-[#0A84FF]/20"
          >
            Сохранить в дневник
          </button>
          <button
            onClick={onCancel}
            className="w-full py-2.5 px-4 text-slate-500 hover:text-white text-xs font-semibold"
          >
            Вернуться к тренировке
          </button>
        </div>
      </div>
    </div>
  );
};
