import React, { useState } from 'react';
import axios from 'axios';
import { X } from 'lucide-react';

const AddTaskModal = ({ onAdd, onClose, triggerHaptic }) => {
  const [title, setTitle] = useState('');
  const [deadline, setDeadline] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Получаем локальную дату корректно (без UTC-сдвига)
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const localDate = new Date(now.getTime() - (offset * 60 * 1000));
  const today = localDate.toISOString().split('T')[0];

  const handleSubmit = async () => {
    if (!title.trim() || !deadline || isLoading) return;

    if (deadline < today) {
      setError("Нельзя заключить контракт в прошлом!");
      if (triggerHaptic) triggerHaptic('error');
      return;
    }

    setIsLoading(true);
    setError(null);
    if (triggerHaptic) triggerHaptic('medium');

    try {
      // Отправляем title, deadline и today для точного анализа
      const response = await axios.post('/api/analyze', { 
        title: title.trim(),
        deadline: deadline,
        today: today 
      });

      const aiResult = response.data;

      onAdd({
        title: title.trim(),
        deadline: deadline,
        difficulty: aiResult.difficulty || 'medium',
        xp: aiResult.xp || 20,
        gold: aiResult.gold || 10
      });

      if (triggerHaptic) triggerHaptic('success');
      onClose();
      
    } catch (err) {
      console.error("AI Analysis failed:", err);
      setError("Мастер контрактов недоступен. Попробуй позже.");
      if (triggerHaptic) triggerHaptic('error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-md bg-black/80">
      <div className="w-full max-w-sm bg-[#111] border-2 border-white/10 p-6 shadow-[10px_10px_0px_#000] relative">
        
        {/* КРЕСТИК ЗАКРЫТИЯ */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-white/20 hover:text-white transition-colors p-1"
          disabled={isLoading}
        >
          <X size={20} strokeWidth={3} />
        </button>

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-white text-xl font-black uppercase tracking-tighter">
            Новый контракт
          </h2>
          {isLoading && (
            <div className="animate-spin h-4 w-4 border-2 border-[#daa520] border-t-transparent rounded-full" />
          )}
        </div>
        
        <div className="space-y-6">
          <div className={isLoading ? "opacity-50 pointer-events-none" : ""}>
            <label className="text-white/40 text-[9px] uppercase font-black mb-2 block tracking-widest">
              Суть задания
            </label>
            <input 
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if(error) setError(null);
              }}
              className="w-full bg-white/5 border border-white/10 p-3 text-white font-mono text-sm focus:border-[#daa520] outline-none transition-colors"
              placeholder="Напр: Прочитать 20 страниц..."
              disabled={isLoading}
            />
          </div>

          <div className={isLoading ? "opacity-50 pointer-events-none" : ""}>
            <label className="text-white/40 text-[9px] uppercase font-black mb-2 block tracking-widest">
              Выполнить до
            </label>
            <input 
              type="date"
              value={deadline}
              min={today}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full bg-white/5 border border-white/10 p-3 text-white font-mono text-sm outline-none focus:border-[#daa520] appearance-none"
              style={{ colorScheme: 'dark' }}
              disabled={isLoading}
            />
          </div>
        </div>

        {error && (
          <div className="mt-6 p-3 border border-red-500/50 bg-red-500/10 text-red-500 text-[10px] font-bold uppercase tracking-tight">
            ⚠ {error}
          </div>
        )}

        <div className="mt-10">
          <button 
            onClick={handleSubmit}
            disabled={!title.trim() || !deadline || isLoading}
            className={`
              w-full py-4 font-black uppercase text-[11px] tracking-[0.1em] transition-all duration-200
              ${isLoading 
                ? "bg-gray-800 text-gray-500 cursor-wait" 
                : "bg-white text-black shadow-[4px_4px_0px_#daa520] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
              }
              disabled:opacity-20 disabled:shadow-none
            `}
          >
            {isLoading ? 'Анализ сложности...' : 'Принять контракт'}
          </button>
        </div>

        {/* СТРОКА ПРО ИИ */}
        <div className="mt-6 text-center">
          <p className={`text-[8px] font-bold uppercase tracking-[0.2em] transition-opacity duration-500 ${isLoading ? 'text-[#daa520] animate-pulse' : 'text-white/10'}`}>
            {isLoading ? 'ИИ оценивает риски и награду...' : 'Сложность оценивается нейросетью'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AddTaskModal;