import React, { useState } from 'react';

const QuestsPage = ({ 
  character = { name: "Sir Pixelot", hp: 85, lvl: 14, xp: 1200, maxXp: 2000, gold: 450, stats: {} }, 
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
        stats: { ...prev.stats, [type]: (prev.stats[type] || 0) + 1 }
      }));
    }
  };

  return (
    <div className="fixed inset-0 w-full h-full bg-black overflow-hidden flex flex-col font-mono">
      
      {/* --- ВЕРХНЯЯ ПАНЕЛЬ --- */}
      <div className="relative z-20 w-full bg-[#111] border-b-4 border-[#2a1a10] shadow-[0_4px_10px_rgba(0,0,0,0.9)] px-5 py-4">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#222] border-2 border-[#daa520] flex items-center justify-center shadow-[2px_2px_0_#000]">
              <span className="text-[#daa520] text-xs font-bold">Q</span>
            </div>
            <div>
              <h1 className="text-[#daa520] text-[16px] font-bold uppercase tracking-tighter leading-none">{character.name}</h1>
              <p className="text-white/30 text-[8px] uppercase tracking-widest mt-1">Active Missions</p>
            </div>
          </div>
          <div className="bg-black/60 px-3 py-1 border border-[#daa520]/20 flex items-center gap-2">
            <span className="text-[#f7d51d] text-xs font-bold">{character.gold}</span>
            <div className="w-2 h-2 bg-[#f7d51d] rounded-full shadow-[0_0_5px_#f7d51d]"></div>
          </div>
        </div>

        <div className="grid grid-cols-[1fr_50px] gap-4 items-center">
          <div className="space-y-2">
            <div className="relative w-full h-4 bg-[#1a1a1a] border border-white/10 overflow-hidden">
              <div className="h-full bg-[#cc0000] shadow-[0_0_10px_#cc0000]" style={{ width: `${character.hp}%` }} />
              <span className="absolute inset-0 flex items-center justify-center text-[7px] text-white font-bold uppercase">Health {character.hp}%</span>
            </div>
            <div className="relative w-full h-1.5 bg-[#1a1a1a] border border-white/5 overflow-hidden">
              <div className="h-full bg-[#0070dd]" style={{ width: `${(character.xp / character.maxXp) * 100}%` }} />
            </div>
          </div>
          <div className="flex flex-col items-center justify-center border-l border-white/10 h-full">
            <span className="text-white/30 text-[7px] uppercase tracking-tighter">Lvl</span>
            <span className="text-white text-lg font-black leading-none">{character.lvl}</span>
          </div>
        </div>
      </div>

      {/* --- ЦЕНТРАЛЬНАЯ ОБЛАСТЬ --- */}
      <div className="flex-1 relative overflow-hidden">
        {/* ФОНОВОЕ ВИДЕО (Через Blob) */}
        <div className="absolute inset-0 bg-black">
          <video
            src={videos?.quests || ""}
            autoPlay loop muted playsInline
            className="w-full h-full object-cover opacity-40"
            style={{ imageRendering: 'pixelated', willChange: 'transform' }}
          />
        </div>
        
        {/* КОНТЕНТ КВЕСТОВ */}
        <div className="absolute inset-0 z-10 overflow-y-auto p-5 bg-gradient-to-b from-black/80 via-transparent to-black">
          <div className="space-y-4 pt-4">
            {tasks.map(task => (
              <div 
                key={task.id}
                className="bg-[#1a1a1a] border-l-4 border-[#daa520] p-4 flex justify-between items-center shadow-[4px_4px_0px_rgba(0,0,0,1)]"
              >
                <div className="flex flex-col gap-2">
                  <span className="text-white text-[12px] uppercase font-black tracking-tight">{task.title}</span>
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
                  className="bg-[#2a1a10] active:bg-[#daa520] active:text-black text-[#daa520] text-[10px] font-black px-4 py-2 border-2 border-[#daa520] shadow-[2px_2px_0_#000] active:translate-y-1 active:shadow-none transition-all outline-none"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  CLAIM
                </button>
              </div>
            ))}

            {/* Кнопка нового квеста */}
            <div className="mt-6 border-2 border-dashed border-white/10 p-4 text-center bg-black/40 active:bg-black/60 cursor-pointer transition-colors group">
              <span className="text-[9px] text-white/20 group-active:text-[#daa520] tracking-[0.3em] uppercase">+ Propose New Contract</span>
            </div>
          </div>
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