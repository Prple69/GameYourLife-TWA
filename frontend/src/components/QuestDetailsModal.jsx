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

  // Имя без символа @ и италика
  const signatoryName = character?.username || `ID_${character?.telegram_id?.slice(-5) || 'Unknown'}`;
  const todayDate = new Date().toLocaleDateString('ru-RU');

  return (
    <div 
      className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-300"
      onClick={handleOverlayClick}
    >
      <div className="relative w-full max-w-sm bg-[#0d0d0d] border border-[#daa520]/60 p-1 shadow-[0_0_60px_rgba(0,0,0,1)]">
        
        <div className="border border-[#daa520]/20 p-7 flex flex-col gap-8 relative">
          
          {/* Шапка контракта */}
          <div className="text-center">
            <h2 className="text-[#daa520] font-black text-[12px] uppercase tracking-[0.4em] mb-4">
              Контракт на выполнение
            </h2>
            <p className="text-white font-black text-2xl uppercase tracking-tight leading-tight px-2 break-words">
              {task.title}
            </p>
          </div>

          {/* Параметры */}
          <div className="space-y-6 font-mono">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <span className="text-white/40 uppercase tracking-widest text-[9px]">Уровень угрозы:</span>
              <span className={`px-3 py-1 font-black border rounded-sm uppercase tracking-widest text-[10px] ${currentDiff.color}`}>
                {currentDiff.label}
              </span>
            </div>

            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <span className="text-white/40 uppercase tracking-widest text-[9px]">Срок завершения:</span>
              <span className="text-white font-black text-[11px] uppercase tracking-tighter">
                ДО 23:59 (МСК)
              </span>
            </div>

            <div className="space-y-4">
              <span className="text-white/40 uppercase block text-center tracking-[0.3em] text-[9px]">Вознаграждение</span>
              <div className="flex justify-center gap-8 py-4 bg-white/5 border-y border-white/10">
                <div className="flex flex-col items-center">
                   <span className="text-[#daa520] font-black text-lg">+{task.gold_reward || task.gold}</span>
                   <span className="text-[#daa520]/50 text-[8px] font-bold">GOLD</span>
                </div>
                <div className="flex flex-col items-center">
                   <span className="text-[#a855f7] font-black text-lg">+{task.xp_reward || task.xp}</span>
                   <span className="text-[#a855f7]/50 text-[8px] font-bold">XP</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-red-500/50 uppercase block text-center tracking-[0.3em] text-[9px]">Штраф при провале</span>
              <div className="text-center bg-red-500/10 py-4 border border-red-500/30">
                <span className="text-red-500 font-black text-3xl tracking-tighter">-{task.hp_penalty} HP</span>
              </div>
            </div>
          </div>

            {/* Блок подписи - Справа внизу */}
            <div className="mt-6 flex flex-col items-end">
            <div className="flex flex-col items-end">
                <span className="text-[#daa520]/40 text-[9px] uppercase tracking-widest mb-2">Исполнитель:</span>
                <span className="text-white font-mono font-black text-xl uppercase tracking-wider">
                {signatoryName}
                </span>
                {/* Линия подписи */}
                <div className="h-[2px] w-40 bg-[#daa520]/40 mt-1 shadow-[0_1px_10px_rgba(218,165,32,0.3)]" />
                
                {/* Блок с датой вместо ID */}
                <div className="flex justify-center w-40 mt-1 text-white/20 text-[8px] uppercase tracking-[0.2em]">
                <span>Дата: {todayDate}</span>
                </div>
            </div>
            </div>

          {/* Кнопка закрытия */}
          <button 
            onClick={onClose}
            className="absolute top-2 right-2 p-2 text-white/20 hover:text-[#daa520] transition-colors"
          >
            <span className="font-mono text-2xl">×</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuestDetailsModal;