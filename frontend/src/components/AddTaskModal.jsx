import React, { useState } from 'react';
import axios from 'axios';
import { X } from 'lucide-react'; // Не забудь импортировать иконку

const AddTaskModal = ({ onAdd, onClose, triggerHaptic }) => {
  const [title, setTitle] = useState('');
  const [deadline, setDeadline] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    if (!title.trim() || !deadline || isLoading) return;

    setIsLoading(true);
    setError(null);
    if (triggerHaptic) triggerHaptic('medium');

    try {
      const response = await axios.post('/api/analyze', { 
        title: title.trim() 
      });

      const aiResult = response.data;

      onAdd({
        title: title.trim(),
        deadline: deadline,
        difficulty: aiResult.difficulty || 'medium',
        xp: aiResult.xp || 50,
        gold: aiResult.gold || 25
      });

      if (triggerHaptic) triggerHaptic('success');
      
    } catch (err) {
      console.error("Analysis failed:", err);
      setError("Не удалось оценить контракт. Попробуйте еще раз.");
      if (triggerHaptic) triggerHaptic('error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-md bg-black/80">
      <div className="w-full max-w-sm bg-[#111] border-2 border-white/10 p-6 shadow-[10px_10px_0px_#000] relative">
        
        {/* КНОПКА ЗАКРЫТИЯ (КРЕСТИК) */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-white/20 hover:text-white transition-colors"
          disabled={isLoading}
        >
          <X size={20} strokeWidth={3} />
        </button>

        <div className="flex items-center mb-8">
          <h2 className="text-white text-xl font-black uppercase tracking-tighter">
            Новый контракт
          </h2>
          {isLoading && (
            <div className="ml-3 animate-spin h-3 w-3 border-2 border-[#daa520] border-t-transparent rounded-full" />
          )}
        </div>
        
        <div className="space-y-6">
          <div className={isLoading ? "opacity-50 pointer-events-none" : ""}>
            <label className="text-white/40 text-[9px] uppercase font-black mb-2 block tracking-[0.2em]">
              Суть задания
            </label>
            <input 
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if(error) setError(null);
              }}
              className="w-full bg-white/5 border border-white/10 p-3 text-white font-mono text-sm focus:border-[#daa520] outline-none transition-colors placeholder:text-white/10"
              placeholder="Напр: Тренировка в зале..."
              disabled={isLoading}
            />
          </div>

          <div className={isLoading ? "opacity-50 pointer-events-none" : ""}>
            <label className="text-white/40 text-[9px] uppercase font-black mb-2 block tracking-[0.2em]">
              Дедлайн
            </label>
            <input 
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full bg-white/5 border border-white/10 p-3 text-white font-mono text-sm outline-none focus:border-[#daa520] appearance-none"
              style={{ colorScheme: 'dark' }}
              disabled={isLoading}
            />
          </div>
        </div>

        {/* ОШИБКА */}
        {error && (
          <div className="mt-6 p-3 border border-red-500/50 bg-red-500/10 text-red-500 text-[10px] font-black uppercase">
            ⚠ {error}
          </div>
        )}

        {/* КНОПКА ДЕЙСТВИЯ */}
        <div className="mt-10">
          <button 
            onClick={handleSubmit}
            disabled={!title.trim() || !deadline || isLoading}
            className={`
              w-full py-4 font-black uppercase text-[11px] tracking-[0.1em] transition-all duration-200
              ${isLoading 
                ? "bg-white/10 text-white/20 cursor-wait" 
                : "bg-white text-black shadow-[4px_4px_0px_#daa520] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
              }
              disabled:opacity-20 disabled:shadow-none
            `}
          >
            {isLoading ? 'Анализ...' : 'Оценить контракт'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddTaskModal;