import React, { useState } from 'react';
import { Search, X, Dumbbell } from 'lucide-react';
import { Exercise } from '../../types';

interface AddExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  exercises: Exercise[];
  onSelectExercise: (exercise: Exercise) => void;
}

export const AddExerciseModal: React.FC<AddExerciseModalProps> = ({
  isOpen,
  onClose,
  exercises,
  onSelectExercise,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    { id: 'all', label: 'Все' },
    { id: 'chest', label: 'Грудь' },
    { id: 'back', label: 'Спина' },
    { id: 'legs', label: 'Ноги' },
    { id: 'shoulders', label: 'Плечи' },
    { id: 'biceps', label: 'Бицепс' },
    { id: 'triceps', label: 'Трицепс' },
    { id: 'core', label: 'Пресс' },
  ];

  const filtered = exercises.filter((ex) => {
    const matchesSearch = ex.name.toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCategory === 'all' || ex.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div
      className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4 transition-opacity duration-200 ${
        isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
    >
      <div
        className={`w-full max-w-lg bg-[#0F172A] border border-white/[0.08] rounded-t-3xl sm:rounded-3xl max-h-[85vh] flex flex-col shadow-2xl transition-transform duration-200 ${
          isOpen ? 'translate-y-0' : 'translate-y-4'
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center space-x-2">
            <Dumbbell className="text-sky-400" size={20} />
            <span>Добавить упражнение</span>
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-500 hover:text-white rounded-xl hover:bg-white/5"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search & Category Pills */}
        <div className="p-4 space-y-3 border-b border-white/[0.06]">
          <div className="relative">
            <Search className="absolute left-3.5 top-3 text-slate-500" size={18} />
            <input
              type="text"
              placeholder="Поиск упражнения..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white/[0.05] border border-white/[0.08] rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-[#0A84FF] text-sm"
            />
          </div>

          <div className="flex space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                  selectedCategory === cat.id
                    ? 'bg-[#0A84FF] text-white shadow-md shadow-[#0A84FF]/20'
                    : 'bg-white/[0.05] text-slate-400 hover:bg-white/[0.08]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Exercise List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filtered.length === 0 ? (
            <div className="text-center py-8 text-slate-600 text-sm">
              Упражнения не найдены
            </div>
          ) : (
            filtered.map((exercise) => (
              <button
                key={exercise.id}
                onClick={() => {
                  onSelectExercise(exercise);
                  onClose();
                }}
                className="w-full text-left p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-sky-500/30 transition flex items-center justify-between group"
              >
                <div>
                  <div className="font-semibold text-white text-sm group-hover:text-sky-400 transition">
                    {exercise.name}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {exercise.target_muscle || exercise.category} · {exercise.equipment}
                  </div>
                </div>
                <span className="text-xs font-semibold px-2 py-1 rounded bg-white/5 text-slate-400 group-hover:bg-[#0A84FF] group-hover:text-white transition">
                  Выбрать
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
