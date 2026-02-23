import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Header from '../components/Header';
import ConfirmModal from '../components/ConfirmModal';
import AddTaskModal from '../components/AddTaskModal';

// Компонент для рулетки Gold и XP (дизайн не меняем, только логику цифр)
const RollingValue = ({ isAnalyzing, value, colorClass, label }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let interval;
    if (isAnalyzing) {
      interval = setInterval(() => {
        setDisplayValue(Math.floor(Math.random() * 150));
      }, 150);
    } else {
      setDisplayValue(value);
    }
    return () => clearInterval(interval);
  }, [isAnalyzing, value]);

  return (
    <span className={`${colorClass} text-[9px] font-black uppercase`}>
      +{displayValue} {label}
    </span>
  );
};

const QuestsPage = ({ character, setCharacter, videos, triggerHaptic }) => {
  const [tasks, setTasks] = useState([
    { id: 1, title: 'Английский 20 мин', difficulty: 'easy', deadline: '2024-05-20', xp: 20, gold: 10, isAnalyzing: false },
  ]);

  // Этот стейт нужен только для того, чтобы React перерисовывал страницу и рулетка крутилась
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 300);
    return () => clearInterval(timer);
  }, []);

  const [confirmTask, setConfirmTask] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const getDifficultyStyles = (task) => {
    const styles = {
      easy: { label: 'Легкий', color: 'text-[#4ade80] border-[#4ade80]/30 bg-[#4ade80]/10' },
      medium: { label: 'Средний', color: 'text-[#facc15] border-[#facc15]/30 bg-[#facc15]/10' },
      hard: { label: 'Тяжелый', color: 'text-[#ef4444] border-[#ef4444]/30 bg-[#ef4444]/10' },
      epic: { label: 'Эпический', color: 'text-[#a855f7] border-[#a855f7]/30 bg-[#a855f7]/10' }
    };

    if (task.isAnalyzing) {
      // ВОТ ТУТ МАГИЯ: берем массив ключей и выбираем один на основе времени
      const keys = ['easy', 'medium', 'hard', 'epic'];
      const currentKey = keys[Math.floor((Date.now() / 300) % keys.length)];
      return styles[currentKey]; // Возвращаем ПОЛНЫЙ стиль (цвет + текст)
    }

    return styles[task.difficulty] || styles.easy;
  };

  const onAddTask = async (basicData) => {
    const tempId = Date.now();
    const newTask = {
      id: tempId,
      title: basicData.title,
      deadline: basicData.deadline,
      difficulty: 'easy',
      xp: 0,
      gold: 0,
      isAnalyzing: true
    };

    setTasks(prev => [...prev, newTask]);
    setIsAddModalOpen(false); 
    triggerHaptic?.('medium');

    try {
      const response = await axios.post('/api/analyze', basicData);
      
      // Имитируем "обдумывание" 2 секунды, пока крутится рулетка
      setTimeout(() => {
        setTasks(prev => prev.map(t => t.id === tempId ? {
          ...t,
          ...response.data,
          isAnalyzing: false,
          isNew: true 
        } : t));
        triggerHaptic?.('success');
      }, 2000);
    } catch (error) {
      setTasks(prev => prev.filter(t => t.id !== tempId));
    }
  };

  const finalizeTask = () => {
    const xpGain = confirmTask.xp || 0;
    const goldGain = confirmTask.gold || 0;
    setTasks(prev => prev.filter(t => t.id !== confirmTask.id));
    setCharacter?.(prev => ({ ...prev, xp: (prev.xp || 0) + xpGain, gold: (prev.gold || 0) + goldGain }));
    setConfirmTask(null);
    triggerHaptic?.('success');
  };

  return (
    <div className="fixed inset-0 w-full h-full bg-black overflow-hidden flex flex-col font-mono items-center">
      <div className="absolute inset-0 z-0">
        <video src={videos?.quests || ""} autoPlay loop muted playsInline className="w-full h-full object-cover opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black" />
      </div>

      <div className="relative z-10 flex flex-col items-center w-full h-full px-[4%]">
        <Header title="Задания" subtitle="Активные контракты"/>

        <div className="flex-1 w-full max-w-2xl overflow-y-auto space-y-4 pt-4 mb-[130px] custom-scrollbar">
          {tasks.map(task => {
            const diff = getDifficultyStyles(task);
            return (
              <div key={task.id} className={`group relative w-full bg-black/70 border border-white/10 p-4 flex items-center justify-between shadow-[6px_6px_0px_rgba(0,0,0,0.9)] transition-all gap-3 
                ${task.isNew ? 'animate-bounce border-[#daa520]/50' : ''}`}>
                
                <div className="flex flex-col gap-2 min-w-0 flex-1">
                  <span className="text-white text-[14px] uppercase font-black tracking-tight leading-tight break-words">{task.title}</span>
                  
                  <div className="flex flex-wrap gap-2 items-center">
                    {/* ТЕПЕРЬ ЯЧЕЙКА МЕНЯЕТСЯ ЦЕЛИКОМ: И ТЕКСТ И ЦВЕТ */}
                    <span className={`text-[9px] px-2 py-0.5 font-bold border rounded-sm uppercase tracking-widest transition-all duration-300 ${diff.color}`}>
                      {diff.label}
                    </span>
                    
                    <div className="flex items-center gap-2 border-l border-white/10 pl-2">
                      <RollingValue isAnalyzing={task.isAnalyzing} value={task.gold} colorClass="text-[#daa520]" label="Gold" />
                      <RollingValue isAnalyzing={task.isAnalyzing} value={task.xp} colorClass="text-[#a855f7]" label="XP" />
                    </div>
                    <span className="text-white/30 text-[9px] font-bold uppercase ml-auto">{task.deadline}</span>
                  </div>
                </div>

                <button 
                  disabled={task.isAnalyzing}
                  onClick={() => { triggerHaptic?.('medium'); setConfirmTask(task); }}
                  className={`shrink-0 px-3 py-2.5 font-black text-[10px] uppercase shadow-[2px_2px_0_#000] transition-all 
                    ${task.isAnalyzing ? 'bg-white/5 text-white/10' : 'bg-[#daa520] text-black'}`}
                >
                  {task.isAnalyzing ? '...' : 'ВЫПОЛНЕНО'}
                </button>
              </div>
            );
          })}

          <div onClick={() => { setIsAddModalOpen(true); triggerHaptic?.('light'); }} className="w-full border-2 border-dashed border-[#daa520]/20 p-6 mt-4 text-center bg-black/30 active:bg-black/50 cursor-pointer group">
            <span className="text-[11px] text-[#daa520]/60 group-active:text-[#daa520] tracking-[0.3em] uppercase font-black">+ ДОБАВИТЬ КОНТРАКТ</span>
          </div>
        </div>
      </div>

      <ConfirmModal task={confirmTask} onConfirm={finalizeTask} onCancel={() => setConfirmTask(null)} />
      {isAddModalOpen && <AddTaskModal onAdd={onAddTask} onClose={() => setIsAddModalOpen(false)} triggerHaptic={triggerHaptic} />}
    </div>
  );
};

export default QuestsPage;