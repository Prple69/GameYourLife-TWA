import React from 'react';

const QuestDetailsModal = ({ task, character, onClose }) => {
  if (!task) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const difficultyStyles = {
    easy: { label: 'Легкий', color: 'text-[#4ade80] border-[#4ade80]/30 bg-[#4ade80]/10' },
    medium: { label: 'Средний', color: 'text-[#facc15] border-[#facc15]/30 bg-[#facc15]/10' },
    hard: { label: 'Тяжелый', color: 'text-[#ef4444] border-[#ef4444]/30 bg-[#ef4444]/10' },
    epic: { label: 'Эпический', color: 'text-[#a855f7] border-[#a855f7]/30 bg-[#a855f7]/10' }
  };

  const currentDiff = difficultyStyles[task.difficulty] || difficultyStyles.easy;
  const signatoryName = character?.username || `ID_${character?.telegram_id?.slice(-5) || 'Unknown'}`;
  
  const deadlineDate = task.deadline || new Date().toLocaleDateString('ru-RU');
  const todayDate = new Date().toLocaleDateString('ru-RU');

  return (
    <div 
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300"
      onClick={handleOverlayClick}
    >
      <div className="relative w-full max-w-sm bg-[#0a0a0a] border border-[#daa520]/60 shadow-[0_0_60px_rgba(0,0,0,1)]">
        
        <div className="border border-[#daa520]/20 p-5 flex flex-col gap-6 relative">
          
          {/* Заголовок */}
          <div className="text-center">
            <h2 className="text-[#daa520] font-black text-[10px] uppercase tracking-[0.3em] mb-2 opacity-70">
              Контракт на выполнение
            </h2>
            <p className="text-white font-black text-xl uppercase tracking-tight leading-none break-words">
              {task.title}
            </p>
          </div>

          {/* Инфо-панель */}
          <div className="space-y-3 font-mono">
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
              <span className="text-white/30 uppercase text-[8px]">Уровень сложности:</span>
              <span className={`px-2 py-0.5 font-black border rounded-sm uppercase text-[9px] ${currentDiff.color}`}>
                {currentDiff.label}
              </span>
            </div>

            <div className="flex justify-between items-center border-b border-white/5 pb-2">
              <span className="text-white/30 uppercase text-[8px]">Срок завершения:</span>
              <span className="text-white font-black text-[10px]">
                {deadlineDate} 23:59 (МСК)
              </span>
            </div>

            {/* Блок параметров (Золото, Опыт, Штраф) */}
            <div className="grid grid-cols-3 gap-2 py-4 bg-white/[0.03] border-y border-white/10">
              <div className="flex flex-col items-center border-r border-white/5">
                <span className="text-[#daa520] font-black text-2xl leading-none">
                  {task.gold_reward || task.gold || 0}
                </span>
                <span className="text-[#daa520]/60 text-[8px] font-black mt-1 uppercase">Gold</span>
              </div>

              <div className="flex flex-col items-center border-r border-white/5">
                <span className="text-[#a855f7] font-black text-2xl leading-none">
                  {task.xp_reward || task.xp || 0}
                </span>
                <span className="text-[#a855f7]/60 text-[8px] font-black mt-1 uppercase">XP</span>
              </div>

              <div className="flex flex-col items-center">
                <span className="text-red-500 font-black text-2xl leading-none">
                  -{task.hp_penalty || 0}
                </span>
                <span className="text-red-500/60 text-[8px] font-black mt-1 uppercase">HP</span>
              </div>
            </div>
          </div>

          {/* Блок подписи с адаптивной полоской */}
          <div className="flex flex-col items-end mt-2">
            <span className="text-[#daa520]/40 text-[8px] uppercase tracking-widest mb-1">Исполнитель:</span>
            
            {/* Обертка, которая подстраивается под ширину текста */}
            <div className="inline-flex flex-col items-center w-fit">
              <span className="text-white font-mono font-black text-lg uppercase tracking-widest px-1">
                {signatoryName}
              </span>
              {/* Полоска теперь всегда равна ширине ника выше */}
              <div className="h-[1.5px] w-full bg-[#daa520]/40 shadow-[0_1px_8px_rgba(218,165,32,0.2)]" />
            </div>

            <span className="text-white/20 text-[8px] mt-2 uppercase font-mono tracking-tighter">
              Дата: {todayDate}
            </span>
          </div>

          {/* Закрыть */}
          <button 
            onClick={onClose}
            className="absolute top-1 right-1 p-2 text-white/10 hover:text-white transition-colors"
          >
            <span className="font-mono text-xl">×</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuestDetailsModal;