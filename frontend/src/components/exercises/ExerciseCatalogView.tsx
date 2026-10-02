import React, { useState, useEffect } from 'react';
import { Search, Plus, BookOpen, X, Info, Dumbbell } from 'lucide-react';
import { Exercise } from '../../types';
import { exercisesApi } from '../../services/api';
import { triggerHaptic } from '../../utils/telegram';

export const ExerciseCatalogView: React.FC = () => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('chest');
  const [newEquipment, setNewEquipment] = useState('barbell');
  const [newTargetMuscle, setNewTargetMuscle] = useState('');
  const [newInstructions, setNewInstructions] = useState('');

  const loadExercises = async () => {
    try {
      const data = await exercisesApi.list({
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        search: search || undefined,
      });
      setExercises(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadExercises();
  }, [selectedCategory, search]);

  const handleCreateExercise = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    triggerHaptic('success');
    try {
      await exercisesApi.create({
        name: newName,
        category: newCategory as Exercise['category'],
        equipment: newEquipment,
        target_muscle: newTargetMuscle,
        instructions: newInstructions,
      });
      setIsCreateModalOpen(false);
      setNewName('');
      setNewInstructions('');
      setNewTargetMuscle('');
      await loadExercises();
    } catch (err) {
      console.error(err);
    }
  };

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

  const categoryNames: Record<string, string> = {
    chest: 'Грудь', back: 'Спина', legs: 'Ноги', shoulders: 'Плечи',
    biceps: 'Бицепс', triceps: 'Трицепс', core: 'Пресс',
  };

  return (
    <div className="p-4 pb-24 max-w-md mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-white">База упражнений</h1>
          <p className="text-xs text-slate-400">
            Анатомия, техника и библиотека движений
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="p-2.5 bg-sky-500/10 hover:bg-sky-500/15 active:scale-95 text-sky-400 rounded-2xl border border-sky-500/20 flex items-center space-x-1 text-xs font-bold transition"
        >
          <Plus size={16} />
          <span>Своё</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-3">
        <Search className="absolute left-3.5 top-3 text-slate-500" size={18} />
        <input
          type="text"
          placeholder="Поиск по названию..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white/[0.05] border border-white/[0.08] rounded-2xl text-white placeholder-slate-600 text-sm focus:outline-none focus:border-[#0A84FF]"
        />
      </div>

      {/* Category Pills */}
      <div className="flex space-x-1.5 overflow-x-auto pb-3 scrollbar-none mb-3">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => {
              triggerHaptic('selection');
              setSelectedCategory(cat.id);
            }}
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

      {/* Exercise Cards */}
      <div className="space-y-2">
        {exercises.map((ex) => (
          <div
            key={ex.id}
            onClick={() => {
              triggerHaptic('impact');
              setSelectedExercise(ex);
            }}
            className="p-3.5 rounded-2xl bg-[#0F172A]/80 backdrop-blur-md hover:bg-white/[0.06] border border-white/[0.06] hover:border-sky-500/30 transition cursor-pointer flex items-center justify-between"
          >
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-white/5 text-slate-500">
                  {categoryNames[ex.category] || ex.category}
                </span>
                {ex.is_custom && (
                  <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-400">
                    Своё
                  </span>
                )}
              </div>
              <div className="font-semibold text-white text-sm">{ex.name}</div>
              <div className="text-xs text-slate-500 mt-0.5">
                {ex.target_muscle || 'Все тело'} · {ex.equipment}
              </div>
            </div>

            <div className="p-2 text-slate-600 hover:text-white rounded-xl">
              <Info size={18} />
            </div>
          </div>
        ))}
      </div>

      {/* Exercise Detail Modal */}
      {selectedExercise && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-[#0F172A] border border-white/[0.08] rounded-3xl shadow-2xl overflow-hidden">
            <div className="flex items-start justify-between px-4 pt-4 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  {categoryNames[selectedExercise.category] || selectedExercise.category}
                </span>
                <h2 className="text-[17px] font-semibold text-white mt-1 leading-tight">
                  {selectedExercise.name}
                </h2>
              </div>
              <button
                onClick={() => setSelectedExercise(null)}
                className="p-1.5 text-slate-500 hover:text-white rounded-xl hover:bg-white/5 transition mt-0.5 shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 px-4 mb-3">
              {([
                { url: selectedExercise.image_start_url, label: 'Старт' },
                { url: selectedExercise.image_end_url, label: 'Пик' },
              ] as const).map(({ url, label }) => (
                <div
                  key={label}
                  className="relative rounded-xl border border-white/[0.08] bg-white/[0.03] overflow-hidden"
                  style={{ aspectRatio: '4/3' }}
                >
                  {url ? (
                    <img
                      src={url} alt={label}
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; (e.currentTarget.nextSibling as HTMLElement).style.display = 'flex'; }}
                    />
                  ) : null}
                  <div
                    className="absolute inset-0 flex flex-col items-center justify-center gap-1.5"
                    style={{ display: url ? 'none' : 'flex' }}
                  >
                    <Dumbbell size={22} className="text-slate-700" />
                    <span className="text-[10px] text-slate-700 font-medium">{label}</span>
                  </div>
                  <span className="absolute top-1.5 left-1.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-black/50 text-white/80 backdrop-blur-sm">
                    {label}
                  </span>
                </div>
              ))}
            </div>

            <div className="px-4 space-y-2 mb-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white/[0.04] p-2.5 rounded-xl border border-white/[0.06]">
                  <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide mb-0.5">Мышца</div>
                  <div className="text-[13px] font-semibold text-white leading-tight">
                    {selectedExercise.target_muscle || 'Все тело'}
                  </div>
                </div>
                <div className="bg-white/[0.04] p-2.5 rounded-xl border border-white/[0.06]">
                  <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide mb-0.5">Инвентарь</div>
                  <div className="text-[13px] font-semibold text-white capitalize leading-tight">
                    {selectedExercise.equipment}
                  </div>
                </div>
              </div>

              {selectedExercise.instructions && (
                <div className="bg-white/[0.04] p-2.5 rounded-xl border border-white/[0.06]">
                  <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide mb-1">Техника</div>
                  <p className="text-[12px] text-slate-300 leading-relaxed line-clamp-4">
                    {selectedExercise.instructions}
                  </p>
                </div>
              )}
            </div>

            <div className="px-4 pb-4">
              <button
                onClick={() => setSelectedExercise(null)}
                className="w-full py-2.5 bg-white/[0.06] hover:bg-white/10 active:scale-95 text-slate-300 font-semibold rounded-xl text-sm transition"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Exercise Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <form
            onSubmit={handleCreateExercise}
            className="w-full max-w-sm bg-[#0F172A] border border-white/[0.08] rounded-3xl p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <Dumbbell className="text-sky-400" size={18} />
                <span>Новое упражнение</span>
              </h2>
              <button type="button" onClick={() => setIsCreateModalOpen(false)} className="p-1.5 text-slate-500 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Название *</label>
              <input
                type="text" required value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Например: Жим Арнольда"
                className="w-full px-3 py-2 bg-white/[0.05] border border-white/[0.08] rounded-xl text-white text-xs focus:outline-none focus:border-[#0A84FF]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Категория</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-2 py-2 bg-white/[0.05] border border-white/[0.08] rounded-xl text-white text-xs focus:outline-none focus:border-[#0A84FF]"
                >
                  <option value="chest">Грудь</option>
                  <option value="back">Спина</option>
                  <option value="legs">Ноги</option>
                  <option value="shoulders">Плечи</option>
                  <option value="biceps">Бицепс</option>
                  <option value="triceps">Трицепс</option>
                  <option value="core">Пресс</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Инвентарь</label>
                <select
                  value={newEquipment}
                  onChange={(e) => setNewEquipment(e.target.value)}
                  className="w-full px-2 py-2 bg-white/[0.05] border border-white/[0.08] rounded-xl text-white text-xs focus:outline-none focus:border-[#0A84FF]"
                >
                  <option value="barbell">Штанга</option>
                  <option value="dumbbell">Гантели</option>
                  <option value="machine">Тренажер</option>
                  <option value="cable">Блоки</option>
                  <option value="bodyweight">Свой вес</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Целевая мышца</label>
              <input
                type="text" value={newTargetMuscle}
                onChange={(e) => setNewTargetMuscle(e.target.value)}
                placeholder="Передняя дельта, квадрицепс..."
                className="w-full px-3 py-2 bg-white/[0.05] border border-white/[0.08] rounded-xl text-white text-xs focus:outline-none focus:border-[#0A84FF]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Инструкция (по желанию)</label>
              <textarea
                value={newInstructions}
                onChange={(e) => setNewInstructions(e.target.value)}
                rows={2}
                placeholder="Особенности хвата, угол..."
                className="w-full px-3 py-2 bg-white/[0.05] border border-white/[0.08] rounded-xl text-white text-xs focus:outline-none focus:border-[#0A84FF]"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-[#0A84FF] hover:bg-[#0070E0] text-white font-semibold text-xs rounded-xl transition shadow-lg shadow-[#0A84FF]/20"
            >
              Добавить в базу
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
