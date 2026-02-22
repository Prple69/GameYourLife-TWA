import React, { useState } from 'react';
import Header from '../components/Header'; // Импортируем твой новый Header

const QuestsPage = ({ 
  character = { name: "Sir Pixelot", hp: 85, lvl: 14, xp: 1200, max_xp: 2000, gold: 450, stats: {} }, 
  setCharacter, 
  videos 
}) => {
  const [tasks, setTasks] = useState([
    { id: 1, title: 'Английский 20 мин', type: 'int', difficulty: 'easy' },
    { id: 2, title: 'Тренировка ног', type: 'str', difficulty: 'hard' },
  ]);

  const completeTask = (id, difficulty, type) => {
    const rewards = { easy: 20, medium: 50, hard: 100 };
    const xpGain = rewards[difficulty];

    setTasks(prev => prev.filter(task => task.id !== id));

    if (setCharacter) {
      setCharacter(prev => ({
        ...prev,
        xp: prev.xp + xpGain,
        gold: prev.gold + (xpGain / 2), // Пример: золото за квест
        stats: { ...prev.stats, [type]: (prev.stats[type] || 0) + 1 }
      }));
    }
  };

  return (
    <div className="fixed inset-0 w-full h-full bg-black overflow-hidden flex flex-col font-mono">
      
      {/* --- ЗАДНИЙ ФОН (ВИДЕО) --- */}
      <div className="absolute inset-0 z-0 bg-black">
        <video
          src={videos?.quests || ""}
          autoPlay loop muted playsInline
          className="w-full h-full object-cover opacity-60"
          style={{ imageRendering: 'pixelated' }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-black/80" />
      </div>

      {/* --- КОНТЕНТ КВЕСТОВ --- */}
      <div className="relative z-10 flex flex-col h-full p-5 pb-32">
        
        {/* НОВЫЙ УНИФИЦИРОВАННЫЙ HEADER */}
        <Header 
          title="Задания" 
          subtitle="Доска активных контрактов" 
          pt="pt-18"
        />

        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {tasks.map(task => (
            <div 
              key={task.id}
              className="relative bg-[#1a1a1a] border-2 border-white/5 p-4 flex justify-between items-center shadow-[4px_4px_0px_rgba(0,0,0,1)] active:translate-y-1 transition-all"
            >
              <div className="flex flex-col gap-2">
                <span className="text-white text-[13px] uppercase font-black tracking-tight drop-shadow-md">
                  {task.title}
                </span>
                <div className="flex gap-2">
                  <span className={`text-[7px] px-2 py-0.5 font-bold border ${getTypeColor(task.type)}`}>
                    {task.type.toUpperCase()}
                  </span>
                  <span className="text-[7px] px-2 py-0.5 bg-black text-white/40 border border-white/10 uppercase">
                    {task.difficulty}
                  </span>
                </div>
              </div>

              <button 
                onClick={() => completeTask(task.id, task.difficulty, task.type)}
                className="bg-[#daa520] active:bg-[#f7d51d] text-black px-4 py-3 font-black text-[10px] uppercase shadow-[2px_2px_0_#000] active:shadow-none transition-all outline-none"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                CLAIM
              </button>
            </div>
          ))}

          {/* Кнопка нового квеста в стиле Shop карточки */}
          <div className="mt-6 border-2 border-dashed border-[#daa520]/20 p-4 text-center bg-black/40 active:bg-black/60 cursor-pointer transition-colors group shadow-[4px_4px_0px_rgba(0,0,0,0.5)]">
            <span className="text-[9px] text-[#daa520]/40 group-active:text-[#daa520] tracking-[0.3em] uppercase font-bold">
              + Propose New Contract
            </span>
          </div>
        </div>

        {/* Декоративная подпись как в Лавке */}
        <div className="mt-4 opacity-20 text-[7px] text-center uppercase tracking-[0.3em]">
          Guild notice board v.2.4
        </div>
      </div>
    </div>
  );
};

const getTypeColor = (type) => {
  const colors = {
    int: 'text-[#00D1FF] border-[#00D1FF]/30 bg-[#00D1FF]/5',
    str: 'text-[#FF4500] border-[#FF4500]/30 bg-[#FF4500]/5',
    cha: 'text-[#FF00FF] border-[#FF00FF]/30 bg-[#FF00FF]/5',
    will: 'text-[#f7d51d] border-[#f7d51d]/30 bg-[#f7d51d]/5'
  };
  return colors[type] || 'text-white border-white/10 bg-white/5';
};

export default QuestsPage;