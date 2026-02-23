import React, { useState } from 'react';
import axios from 'axios';

const AddTaskModal = ({ onAdd, onClose, triggerHaptic }) => {
  const [title, setTitle] = useState('');
  const [deadline, setDeadline] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    // Валидация
    if (!title.trim() || !deadline || isLoading) return;

    setIsLoading(true);
    if (triggerHaptic) triggerHaptic('medium');

    try {
      // 1. Отправляем запрос на наш серверлесс-эндпоинт Vercel
      // Мы передаем только title, ИИ сам решит сложность и награду
      const response = await axios.post('/api/analyze', { 
        title: title.trim() 
      });

      const aiResult = response.data;

      // 2. Вызываем onAdd с данными от ИИ
      onAdd({
        title: title.trim(),
        deadline: deadline,
        difficulty: aiResult.difficulty, // easy, medium, hard, epic
        xp: aiResult.xp,
        gold: aiResult.gold
      });

      if (triggerHaptic) triggerHaptic('success');
      
    } catch (error) {
      console.error("AI Analysis failed:", error);
      
      // 3. Запасной вариант (Fallback), если ИИ недоступен
      onAdd({
        title: title.trim(),
        deadline: deadline,
        difficulty: 'medium',
        xp: 50,
        gold: 25
      });
      
      if (triggerHaptic) triggerHaptic('error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-md bg-black/80">
      <div className="w-full max-w-sm bg-[#111] border-2 border-white/10 p-6 shadow-[10px_10px_0px_#000]">
        
        {/* Хедер модалки с индикатором загрузки */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-white text-xl font-black uppercase tracking-tighter">
            Новый контракт
          </h2>
          {isLoading && (
            <div className="animate-spin h-4 w-4 border-2 border-[#daa520] border-t-transparent rounded-full" />
          )}
        </div>
        
        <div className="space-y-6">
          {/* ПОЛЕ: НАЗВАНИЕ */}
          <div className={isLoading ? "opacity-50 pointer-events-none" : ""}>
            <label className="text-white/40 text-[9px] uppercase font-black mb-2 block tracking-widest">
              Суть задания
            </label>
            <input 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-white/5 border border-white/10 p-3 text-white font-mono text-sm focus:border-[#daa520] outline-none transition-colors"
              placeholder="Напр: Прочитать 20 страниц..."
              disabled={isLoading}
            />
          </div>

          {/* ПОЛЕ: ДАТА */}
          <div className={isLoading ? "opacity-50 pointer-events-none" : ""}>
            <label className="text-white/40 text-[9px] uppercase font-black mb-2 block tracking-widest">
              Выполнить до
            </label>
            <input 
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full bg-white/5 border border-white/10 p-3 text-white font-mono text-sm outline-none focus:border-[#daa520] appearance-none min-h-[48px]"
              style={{ colorScheme: 'dark' }}
              disabled={isLoading}
            />
          </div>
        </div>

        {/* КНОПКИ */}
        <div className="grid grid-cols-2 gap-4 mt-10">
          <button 
            onClick={onClose} 
            disabled={isLoading}
            className="py-3 text-white/40 font-black uppercase text-[10px] active:text-white transition-colors disabled:opacity-0"
          >
            НАЗАД
          </button>
          
          <button 
            onClick={handleSubmit}
            disabled={!title.trim() || !deadline || isLoading}
            className={`
              py-3 font-black uppercase text-[10px] transition-all duration-200
              ${isLoading 
                ? "bg-gray-600 text-gray-400 cursor-wait" 
                : "bg-white text-black shadow-[3px_3px_0px_#daa520] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
              }
              disabled:opacity-20 disabled:shadow-none
            `}
          >
            {isLoading ? 'Анализ...' : 'Принять'}
          </button>
        </div>

        {/* Подсказка для юзера */}
        {isLoading && (
          <p className="text-[8px] text-[#daa520] font-bold uppercase mt-4 text-center animate-pulse tracking-widest">
            Магический ИИ оценивает сложность контракта...
          </p>
        )}
      </div>
    </div>
  );
};

export default AddTaskModal;