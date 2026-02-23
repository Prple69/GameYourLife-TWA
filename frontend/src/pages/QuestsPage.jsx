import React, { useState } from 'react';
import Header from '../components/Header';
import ConfirmModal from '../components/ConfirmModal';
import AddTaskModal from '../components/AddTaskModal';

const QuestsPage = ({ character, setCharacter, videos, triggerHaptic }) => {
  const [tasks, setTasks] = useState([
    { id: 1, title: 'Английский 20 мин', difficulty: 'easy', deadline: '2024-05-20', xp: 20, gold: 10 },
  ]);

  const [confirmTask, setConfirmTask] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const getDifficultyStyles = (difficulty) => {
    const styles = {
      easy: { label: 'Легкий', color: 'text-[#4ade80] border-[#4ade80]/30 bg-[#4ade80]/10' },
      medium: { label: 'Средний', color: 'text-[#facc15] border-[#facc15]/30 bg-[#facc15]/10' },
      hard: { label: 'Тяжелый', color: 'text-[#ef4444] border-[#ef4444]/30 bg-[#ef4444]/10' },
      epic: { label: 'Эпический', color: 'text-[#a855f7] border-[#a855f7]/30 bg-[#a855f7]/10' }
    };
    return styles[difficulty] || styles.easy;
  };

  // ИСПРАВЛЕННАЯ ФУНКЦИЯ: Теперь берем данные из ИИ (data)
  const onAddTask = (data) => {
    triggerHaptic?.('medium');
    
    const newTask = {
      id: Date.now(),
      title: data.title,
      deadline: data.deadline,
      difficulty: data.difficulty, // БЕРЕМ ИЗ ИИ
      xp: data.xp,                 // БЕРЕМ ИЗ ИИ
      gold: data.gold              // БЕРЕМ ИЗ ИИ
    };

    setTasks(prev => [...prev, newTask]);
    setIsAddModalOpen(false);
  };

  const finalizeTask = () => {
    // Используем награду, которую определил ИИ (она уже сохранена в таске)
    const xpGain = confirmTask.xp || 50;
    const goldGain = confirmTask.gold || 25;
    
    setTasks(prev => prev.filter(t => t.id !== confirmTask.id));
    if (setCharacter) {
      setCharacter(prev => ({
        ...prev,
        xp: (prev.xp || 0) + xpGain,
        gold: (prev.gold || 0) + goldGain,
      }));
    }
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
            const diff = getDifficultyStyles(task.difficulty);
            return (
              <div key={task.id} className="group relative w-full bg-black/70 border border-white/10 p-4 flex items-center justify-between shadow-[6px_6px_0px_rgba(0,0,0,0.9)] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all gap-3">
                <div className="flex flex-col gap-2 min-w-0 flex-1">
                  <span className="text-white text-[14px] uppercase font-black tracking-tight leading-tight break-words">{task.title}</span>
                  
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className={`text-[9px] px-2 py-0.5 font-bold border rounded-sm uppercase tracking-widest ${diff.color}`}>
                      {diff.label}
                    </span>
                    
                    {/* ОТОБРАЖЕНИЕ НАГРАДЫ */}
                    <div className="flex items-center gap-2 border-l border-white/10 pl-2">
                      <span className="text-[#daa520] text-[9px] font-black uppercase">
                        +{task.gold} Gold
                      </span>
                      <span className="text-[#a855f7] text-[9px] font-black uppercase">
                        +{task.xp} XP
                      </span>
                    </div>

                    <span className="text-white/30 text-[9px] font-bold uppercase ml-auto">
                      {task.deadline}
                    </span>
                  </div>
                </div>

                <button 
                  onClick={() => { triggerHaptic?.('medium'); setConfirmTask(task); }}
                  className="shrink-0 bg-[#daa520] active:bg-[#f7d51d] text-black px-3 py-2.5 font-black text-[10px] uppercase shadow-[2px_2px_0_#000] active:shadow-none transition-all"
                >
                  ВЫПОЛНЕНО
                </button>
              </div>
            );
          })}

          <div onClick={() => { setIsAddModalOpen(true); triggerHaptic?.('light'); }} className="w-full border-2 border-dashed border-[#daa520]/20 p-6 mt-4 text-center bg-black/30 active:bg-black/50 cursor-pointer group">
            <span className="text-[11px] text-[#daa520]/60 group-active:text-[#daa520] tracking-[0.3em] uppercase font-black">+ ДОБАВИТЬ КОНТРАКТ</span>
          </div>
        </div>
      </div>

      <ConfirmModal 
        task={confirmTask} 
        onConfirm={finalizeTask} 
        onCancel={() => setConfirmTask(null)} 
      />

      {isAddModalOpen && (
        <AddTaskModal 
          onAdd={onAddTask} 
          onClose={() => setIsAddModalOpen(false)} 
          triggerHaptic={triggerHaptic}
        />
      )}
    </div>
  );
};

export default QuestsPage;