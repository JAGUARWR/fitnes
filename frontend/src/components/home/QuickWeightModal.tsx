import React, { useState } from 'react';
import { X, Scale, Check, Plus, Minus } from 'lucide-react';
import { triggerHaptic } from '../../utils/telegram';

interface QuickWeightModalProps {
  isOpen: boolean;
  initialWeight: number;
  onClose: () => void;
  onSave: (newWeight: number) => Promise<void>;
}

export const QuickWeightModal: React.FC<QuickWeightModalProps> = ({
  isOpen,
  initialWeight,
  onClose,
  onSave,
}) => {
  const [weight, setWeight] = useState<number>(initialWeight || 75);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleAdjust = (delta: number) => {
    triggerHaptic('selection');
    setWeight((prev) => parseFloat(Math.max(30, Math.min(250, prev + delta)).toFixed(1)));
  };

  const handleSave = async () => {
    triggerHaptic('success');
    setIsSubmitting(true);
    try {
      await onSave(weight);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xl p-4 animate-in fade-in duration-200 select-none">
      <div className="w-full max-w-sm bg-[#131B2E]/90 backdrop-blur-2xl border border-white/15 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] rounded-3xl p-6 text-center">
        {/* Modal Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-sky-500/15 border border-sky-400/25 flex items-center justify-center text-sky-400">
              <Scale size={16} />
            </div>
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-300">
              Быстрый ввод веса
            </span>
          </div>

          <button
            onClick={() => {
              triggerHaptic('selection');
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 active:scale-90 flex items-center justify-center text-slate-400 hover:text-white transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* Big Weight Display */}
        <div className="my-6">
          <div className="flex items-baseline justify-center space-x-1 font-mono">
            <span className="text-5xl font-black text-white tracking-tight drop-shadow-[0_0_24px_rgba(56,189,248,0.2)]">
              {weight.toFixed(1)}
            </span>
            <span className="text-xl font-medium text-sky-400">кг</span>
          </div>
          <p className="text-xs text-slate-400 mt-1.5 font-medium">
            Регулярный замер повышает точность силового анализа
          </p>
        </div>

        {/* Stepper Buttons */}
        <div className="flex items-center justify-center space-x-3 mb-6">
          <button
            onClick={() => handleAdjust(-1)}
            className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 active:scale-95 text-xs font-semibold text-slate-200 transition"
          >
            -1.0
          </button>
          <button
            onClick={() => handleAdjust(-0.1)}
            className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 active:scale-95 flex items-center justify-center text-slate-300 transition"
          >
            <Minus size={16} />
          </button>
          <button
            onClick={() => handleAdjust(0.1)}
            className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 active:scale-95 flex items-center justify-center text-slate-300 transition"
          >
            <Plus size={16} />
          </button>
          <button
            onClick={() => handleAdjust(1)}
            className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 active:scale-95 text-xs font-semibold text-slate-200 transition"
          >
            +1.0
          </button>
        </div>

        {/* CTA Buttons */}
        <button
          onClick={handleSave}
          disabled={isSubmitting}
          className="w-full py-3.5 px-4 bg-gradient-to-r from-sky-400 via-sky-500 to-blue-600 hover:from-sky-300 hover:to-blue-500 text-white font-semibold rounded-2xl shadow-lg shadow-sky-500/25 active:scale-95 transition-all flex items-center justify-center space-x-2 text-sm disabled:opacity-50"
        >
          <Check size={18} strokeWidth={2.5} />
          <span>{isSubmitting ? 'Сохранение...' : 'Зафиксировать вес'}</span>
        </button>
      </div>
    </div>
  );
};
