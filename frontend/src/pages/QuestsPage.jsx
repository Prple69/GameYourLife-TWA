import React, { useState } from 'react';
import Header from '../components/Header';

const QuestsPage = ({ 
  character = { gold: 450 }, 
  setCharacter, 
  videos 
}) => {
  const [tasks, setTasks] = useState([
    { id: 1, title: 'Английский 20 мин', difficulty: 'easy' },
    { id: 2, title: 'Тренировка ног', difficulty: 'hard' },
    { id: 3, title: 'Чтение книги 10 стр', difficulty: 'medium' },
    { id: 4, title: 'Пробежка 10 км', difficulty: 'epic' },
  ]);

  const getDifficultyStyles = (difficulty) => {
    const styles = {
      easy: { label: 'Легкий', color: 'text-[#4ade80] border-[#4ade80]/30 bg-[#4ade80]/10' },
      medium: { label: 'Средний', color: 'text-[#facc15] border-[#facc15]/30 bg-[#facc15]/10' },
      hard: { label: 'Тяжелый', color: 'text-[#ef4444] border-[#ef4444]/30 bg-[#ef4444]/10' },
      epic: { label: 'Эпический', color: 'text-[#a855f7] border-[#a855f7]/30 bg-[#a855f7]/10' }
    };
    return styles[difficulty] || styles.easy;
  };

  const completeTask = (id, difficulty) => {
    const rewards = { easy: 20, medium: 50, hard: 100, epic: 250 };
    const xpGain = rewards[difficulty];
    setTasks(prev => prev.filter(task => task.id !== id));
    if (setCharacter) {
      setCharacter(prev => ({
        ...prev,
        xp: (prev.xp || 0) + xpGain,
        gold: (prev.gold || 0) + (xpGain / 2),
      }));
    }
  };

  return (
    <div className="fixed inset-0 w-full h-full bg-black overflow-hidden flex flex-col font-mono items-center">
      
      {/* --- ФОН --- */}
      <div className="absolute inset-0 z-0">
        <video
          src={videos?.quests || ""}
          autoPlay loop muted playsInline
          className="w-full h-full object-cover opacity-60"
          style={{ imageRendering: 'pixelated' }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black" />
      </div>

      {/* --- КОНТЕНТ --- */}
      {/* Увеличили общую ширину контейнера для больших экранов */}
      <div className="relative z-10 flex flex-col items-center w-full h-full px-[4%]">
        
        <div className="w-full shrink-0 flex justify-center">
          {/* Ограничиваем ширину хедера тоже, чтобы он не разъезжался слишком сильно */}
          <div className="w-full max-w-2xl">
            <Header title="Задания" subtitle="Активные контракты" gold={character.gold} />
          </div>
        </div>

        {/* --- СПИСОК КВЕСТОВ --- */}
        {/* max-w-2xl дает больше простора на планшетах */}
        <div className="flex-1 w-full max-w-2xl overflow-y-auto space-y-4 pt-4 mb-[130px] custom-scrollbar">
          {tasks.map(task => {
            const diff = getDifficultyStyles(task.difficulty);
            
            return (
              <div 
                key={task.id}
                className="group relative w-full bg-black/70 border border-white/10 p-5 md:p-6 flex items-center justify-between shadow-[6px_6px_0px_rgba(0,0,0,0.9)] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all duration-75"
              >
                <div className="flex flex-col gap-3 min-w-0 pr-4">
                  {/* Размер текста растет на больших экранах (md:text-xl) */}
                  <span className="text-white text-[16px] md:text-xl uppercase font-black tracking-tight leading-tight drop-shadow-md truncate">
                    {task.title}
                  </span>
                  <div>
                    <span className={`text-[10px] md:text-[12px] px-3 py-1 font-bold border rounded-sm uppercase tracking-widest ${diff.color}`}>
                      {diff.label}
                    </span>
                  </div>
                </div>

                <button 
                  onClick={() => completeTask(task.id, task.difficulty)}
                  className="shrink-0 bg-[#daa520] active:bg-[#f7d51d] text-black px-6 py-4 md:px-8 md:py-5 font-black text-[12px] md:text-[14px] uppercase shadow-[3px_3px_0_#000] active:shadow-none transition-all outline-none"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  ВЫПОЛНЕНО
                </button>
              </div>
            );
          })}

          {/* Адаптивная кнопка добавления */}
          <div className="w-full border-2 border-dashed border-[#daa520]/20 p-8 mt-6 text-center bg-black/30 active:bg-black/50 cursor-pointer transition-colors group">
            <span className="text-[12px] md:text-[14px] text-[#daa520]/60 group-active:text-[#daa520] tracking-[0.3em] uppercase font-black">
              + ДОБАВИТЬ ЗАДАНИЕ
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestsPage;