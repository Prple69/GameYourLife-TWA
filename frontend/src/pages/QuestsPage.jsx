import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Header from '../components/Header';
import ConfirmModal from '../components/ConfirmModal';
import AddTaskModal from '../components/AddTaskModal';

// Вспомогательный компонент для "бегающих" цифр
const RollingValue = ({ value, isAnalyzing, colorClass }) => {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    let interval;
    if (isAnalyzing) {
      interval = setInterval(() => {
        // Генерируем случайные числа для эффекта подбора
        setDisplayValue(Math.floor(Math.random() * 200));
      }, 80); // Скорость перебора
    } else {
      setDisplayValue(value);
    }
    return () => clearInterval(interval);
  }, [isAnalyzing, value]);

  return (
    <span className={`${colorClass} text-[9px] font-black uppercase transition-all duration-300 ${!isAnalyzing ? 'scale-110' : ''}`}>
      +{displayValue}
    </span>
  );
};

const QuestsPage = ({ setCharacter, videos, triggerHaptic }) => {
  const [tasks, setTasks] = useState([]);
  const [confirmTask, setConfirmTask] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const requestAnalysis = async (tempId, taskData) => {
    try {
      const { data } = await axios.post('/api/analyze', taskData);
      // Добавляем небольшую задержку, чтобы юзер успел насладиться анимацией
      setTimeout(() => {
        setTasks(prev => prev.map(t => t.id === tempId ? { 
          ...t, 
          ...data, 
          isAnalyzing: false,
          isNew: true // Флаг для финального "прыжка"
        } : t));
        triggerHaptic?.('light');
      }, 1000);
    } catch (err) {
      setTasks(prev => prev.map(t => t.id === tempId ? { ...t, error: true, isAnalyzing: false } : t));
    }
  };

  const onAddTask = (basicData) => {
    const tempId = Date.now();
    const newTask = {
      id: tempId,
      ...basicData,
      difficulty: 'analyzing',
      xp: 0,
      gold: 0,
      isAnalyzing: true,
      error: false
    };
    setTasks(prev => [newTask, ...prev]);
    triggerHaptic?.('success');
    requestAnalysis(tempId, basicData);
  };

  const finalizeTask = () => {
    setCharacter(prev => ({
      ...prev,
      xp: (prev.xp || 0) + (parseInt(confirmTask.xp) || 0),
      gold: (prev.gold || 0) + (parseInt(confirmTask.gold) || 0),
    }));
    setTasks(prev => prev.filter(t => t.id !== confirmTask.id));
    setConfirmTask(null);
    triggerHaptic?.('success');
  };

  const getDifficultyStyles = (task) => {
    if (task.error) return { label: 'Ошибка', color: 'text-red-500 border-red-500/30 bg-red-500/10' };
    
    // Эффект перебора текста сложности
    if (task.isAnalyzing) {
      const labels = ['EASY?', 'MED?', 'HARD?', 'EPIC?'];
      const randomLabel = labels[Math.floor((Date.now() / 100) % labels.length)];
      return { label: randomLabel, color: 'text-white/20 border-white/5 bg-white/5' };
    }

    const styles = {
      easy: { label: 'Легкий', color: 'text-[#4ade80] border-[#4ade80]/30 bg-[#4ade80]/10' },
      medium: { label: 'Средний', color: 'text-[#facc15] border-[#facc15]/30 bg-[#facc15]/10' },
      hard: { label: 'Тяжелый', color: 'text-[#ef4444] border-[#ef4444]/30 bg-[#ef4444]/10' },
      epic: { label: 'Эпический', color: 'text-[#a855f7] border-[#a855f7]/30 bg-[#a855f7]/10' }
    };
    return styles[task.difficulty] || styles.easy;
  };

  return (
    <div className="fixed inset-0 w-full h-full bg-black flex flex-col font-mono items-center overflow-hidden">
      <div className="absolute inset-0 z-0">
        <video src={videos?.quests || ""} autoPlay loop muted playsInline className="w-full h-full object-cover opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black" />
      </div>

      <div className="relative z-10 flex flex-col items-center w-full h-full px-[4%]">
        <Header title="Задания" subtitle="Активные контракты"/>

        <div className="flex-1 w-full max-w-2xl overflow-y-auto space-y-4 pt-4 mb-[130px] custom-scrollbar">
          {tasks.length === 0 && (
            <div className="text-center py-20 opacity-20 uppercase text-[10px] tracking-[0.4em] font-black">Нет активных контрактов</div>
          )}

          {tasks.map(task => {
            const diff = getDifficultyStyles(task);
            return (
              <div 
                key={task.id} 
                className={`w-full bg-black/70 border ${task.error ? 'border-red-500/50' : 'border-white/10'} p-4 flex items-center justify-between shadow-[6px_6px_0px_rgba(0,0,0,0.9)] transition-all gap-3
                ${task.isNew ? 'animate-[bounce_0.5s_ease-in-out]' : ''}`} // Финальный прыжок всей карточки
              >
                <div className="flex flex-col gap-2 min-w-0 flex-1">
                  <span className="text-white text-[14px] uppercase font-black tracking-tight leading-tight break-words">{task.title}</span>
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className={`text-[9px] px-2 py-0.5 font-bold border rounded-sm uppercase tracking-widest transition-all duration-100 ${diff.color}`}>
                      {diff.label}
                    </span>
                    
                    <div className="flex items-center gap-2 border-l border-white/10 pl-2">
                      <RollingValue 
                        value={task.gold} 
                        isAnalyzing={task.isAnalyzing} 
                        colorClass="text-[#daa520]" 
                      />
                      <span className="text-white/20 text-[8px]">GOLD</span>
                      
                      <RollingValue 
                        value={task.xp} 
                        isAnalyzing={task.isAnalyzing} 
                        colorClass="text-[#a855f7]" 
                      />
                      <span className="text-white/20 text-[8px]">XP</span>
                    </div>
                    
                    <span className="text-white/30 text-[9px] font-bold uppercase ml-auto">{task.deadline}</span>
                  </div>
                </div>

                {task.error ? (
                  <button onClick={() => onAddTask(task)} className="bg-red-500 text-white px-3 py-2 text-[9px] font-black uppercase shadow-[2px_2px_0_#000]">Повтор</button>
                ) : (
                  <button 
                    disabled={task.isAnalyzing}
                    onClick={() => { triggerHaptic?.('medium'); setConfirmTask(task); }}
                    className={`shrink-0 ${task.isAnalyzing ? 'bg-white/5 text-white/20' : 'bg-[#daa520] text-black'} px-3 py-2.5 font-black text-[10px] uppercase shadow-[2px_2px_0_#000] active:shadow-none transition-all`}
                  >
                    {task.isAnalyzing ? '???' : 'Выполнить'}
                  </button>
                )}
              </div>
            );
          })}

          <div onClick={() => { setIsAddModalOpen(true); triggerHaptic?.('light'); }} className="w-full border-2 border-dashed border-[#daa520]/20 p-6 mt-4 text-center bg-black/30 active:bg-black/50 cursor-pointer group transition-all">
            <span className="text-[11px] text-[#daa520]/60 group-active:text-[#daa520] tracking-[0.3em] uppercase font-black">+ Добавить контракт</span>
          </div>
        </div>
      </div>

      <ConfirmModal task={confirmTask} onConfirm={finalizeTask} onCancel={() => setConfirmTask(null)} />
      {isAddModalOpen && <AddTaskModal onAdd={onAddTask} onClose={() => setIsAddModalOpen(false)} triggerHaptic={triggerHaptic} />}
    </div>
  );
};

export default QuestsPage;