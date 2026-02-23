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

  // Получаем реальное имя для подписи
  const signatoryName = character?.username || `ID_${character?.telegram_id?.slice(-5) || 'Unknown'}`;
  const todayDate = new Date().toLocaleDateString('ru-RU');

  return (
    <div 
      className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-300"
      onClick={handleOverlayClick}
    >
      <div className="relative w-full max-w-sm bg-[#0d0d0d] border border-[#daa520]/40 p-1 shadow-[0_0_50px_rgba(0,0,0,1)] transition-all">
        
        <div className="border border-[#daa520]/20 p-6 flex flex-col gap-6 relative overflow-hidden">
          
          {/* Декоративный фон "SIGNED" */}
          <div className="absolute -right-6 -bottom-6 text-[80px] text-[#daa520]/5 font-black rotate-12 pointer-events-none select-none uppercase">
            Подписано
          </div>

          {/* Шапка контракта */}
          <div className="text-center border-b border-[#daa520]/20 pb-4">
            <h2 className="text-[#daa520] font-black text-[10px] uppercase tracking-[0.5em] mb-2">Контракт на выполнение</h2>
            <div className="h-[1px] w-12 bg-[#daa520]/40 mx-auto mb-4" />
            <p className="text-white font-black text-xl uppercase tracking-tighter leading-none px-2">
              {task.title}
            </p>
          </div>

          {/* Параметры */}
          <div className="space-y-5 font-mono text-[10px]">
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
              <span className="text-white/30 uppercase tracking-widest text-[8px]">Уровень угрозы:</span>
              <span className={`px-2 py-0.5 font-bold border rounded-sm uppercase tracking-widest text-[8px] ${currentDiff.color}`}>
                {currentDiff.label}
              </span>
            </div>

            <div className="flex justify-between items-center border-b border-white/5 pb-2">
              <span className="text-white/30 uppercase tracking-widest text-[8px]">Срок завершения:</span>
              <span className="text-white font-bold tracking-tighter uppercase">ДО {task.deadline}</span>
            </div>

            <div className="space-y-3">
              <span className="text-white/30 uppercase block text-center tracking-[0.2em] text-[8px]">Вознаграждение за успех</span>
              <div className="flex justify-center gap-6 py-2 bg-white/5 border-y border-white/10">
                <span className="text-[#daa520] font-black text-xs">+{task.gold_reward || task.gold} GOLD</span>
                <span className="text-[#a855f7] font-black text-xs">+{task.xp_reward || task.xp} XP</span>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-red-500/40 uppercase block text-center tracking-[0.2em] text-[8px]">Штрафные санкции (валидация ИИ)</span>
              <div className="text-center bg-red-500/5 py-3 border border-red-500/20 shadow-[inset_0_0_15px_rgba(239,68,68,0.05)]">
                <span className="text-red-600 font-black text-2xl tracking-tighter">-{task.hp_penalty} HP</span>
              </div>
            </div>
          </div>

          {/* Блок подписи с РЕАЛЬНЫМ ИМЕНЕМ */}
          <div className="mt-4 pt-6 border-t border-[#daa520]/20 flex justify-between items-end">
            <div className="flex flex-col">
              <span className="text-[#daa520]/40 text-[8px] uppercase tracking-widest mb-1">Исполнитель (герой):</span>
              <span className="text-white font-serif italic text-xl tracking-widest opacity-95 lowercase">
                @{signatoryName}
              </span>
              <div className="h-[1px] w-36 bg-[#daa520]/30 mt-1 shadow-[0_1px_5px_rgba(218,165,32,0.2)]" />
              <span className="text-white/20 text-[7px] mt-1 uppercase tracking-tighter">Дата подписания: {todayDate}</span>
            </div>
            
            <div className="text-right">
              <span className="text-white/10 text-[7px] uppercase block mb-1 tracking-widest">REG_ID: #{task.id?.toString().slice(-6)}</span>
              <span className="text-[#daa520]/60 text-[8px] uppercase font-black tracking-tighter shadow-sm">Verified Agent</span>
            </div>
          </div>

          {/* Кнопка закрытия */}
          <button 
            onClick={onClose}
            className="absolute top-1 right-1 p-2 text-[#daa520]/40 hover:text-[#daa520] transition-colors focus:outline-none"
          >
            <span className="font-mono text-xl">×</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuestDetailsModal;