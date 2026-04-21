import React, { useState } from 'react';
import { X, Briefcase, Dumbbell, BookOpen, Users } from 'lucide-react';

const CATEGORIES = [
  { key: 'work',     label: 'РАБОТА',     Icon: Briefcase },
  { key: 'fitness',  label: 'ТРЕНИРОВКА', Icon: Dumbbell },
  { key: 'learning', label: 'УЧЁБА',      Icon: BookOpen },
  { key: 'social',   label: 'ОБЩЕНИЕ',    Icon: Users },
];

const AddTaskModal = ({ onAdd, onClose, triggerHaptic }) => {
  const [title, setTitle] = useState('');
  const [deadline, setDeadline] = useState('');
  const [category, setCategory] = useState(null);

  const now = new Date();
  const offset = now.getTimezoneOffset();
  const localDate = new Date(now.getTime() - (offset * 60 * 1000));
  const today = localDate.toISOString().split('T')[0];

  const handleCreate = () => {
    if (!title.trim() || !deadline || !category) return;
    if (deadline < today) {
      if (triggerHaptic) triggerHaptic('error');
      return;
    }
    onAdd({ title: title.trim(), deadline, today, category });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-md bg-black/80">
      <div className="w-full max-w-sm bg-[#111] border-2 border-white/10 p-6 shadow-[10px_10px_0px_#000] relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-white/20 hover:text-white transition-colors"
        >
          <X size={20} strokeWidth={3} />
        </button>

        <div className="flex items-center mb-8">
          <h2 className="text-white text-xl font-black uppercase tracking-tighter">
            Новый контракт
          </h2>
        </div>
        
        <div className="space-y-6">
          <div>
            <label className="text-white/40 text-[9px] uppercase font-black mb-2 block tracking-[0.2em]">
              Суть задания
            </label>
            <input 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-white/5 border border-white/10 p-3 text-white font-mono text-sm focus:border-[#daa520] outline-none transition-colors placeholder:text-white/10"
              placeholder="Напр: Тренировка в зале..."
            />
          </div>

          <div>
            <label className="text-white/40 text-[9px] uppercase font-black mb-2 block tracking-[0.2em]">
              Категория
            </label>
            <div className="grid grid-cols-4 gap-2">
              {CATEGORIES.map(({ key, label, Icon }) => {
                const selected = category === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setCategory(key)}
                    className={`flex flex-col items-center justify-center gap-1 py-2 border text-[9px] font-black uppercase tracking-widest transition-colors ${
                      selected
                        ? 'bg-[#daa520]/10 border-[#daa520] text-[#daa520]'
                        : 'bg-white/5 border-white/10 text-white/50 active:text-white/80'
                    }`}
                  >
                    <Icon size={18} strokeWidth={2.5} />
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-white/40 text-[9px] uppercase font-black mb-2 block tracking-[0.2em]">
              Дедлайн
            </label>
            <input 
              type="date"
              value={deadline}
              min={today}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full bg-white/5 border border-white/10 p-3 text-white font-mono text-sm outline-none focus:border-[#daa520] appearance-none"
              style={{ colorScheme: 'dark' }}
            />
          </div>
        </div>

        <div className="mt-10">
          <button 
            onClick={handleCreate}
            disabled={!title.trim() || !deadline || !category}
            className="w-full py-4 font-black uppercase text-[11px] tracking-[0.1em] transition-all duration-200 bg-white text-black shadow-[4px_4px_0px_#daa520] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-20 disabled:shadow-none"
          >
            Оценить контракт
          </button>
        </div>

        <div className="mt-6 text-center">
          <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-white/10">
            Сложность оценивается нейросетью
          </p>
        </div>
      </div>
    </div>
  );
};

export default AddTaskModal;