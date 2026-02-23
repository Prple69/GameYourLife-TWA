import React from 'react';

const QuestDetailsModal = ({ task, onClose, onStart }) => {
  if (!task) return null;

  // Рассчитываем урон (например, от 5% до 20% в зависимости от сложности)
  const penaltyMap = { easy: 5, medium: 10, hard: 15, epic: 25 };
  const penaltyPercent = penaltyMap[task.difficulty] || 5;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/90 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-sm bg-[#1a1a1a] border-2 border-[#daa520]/50 p-6 shadow-[0_0_30px_rgba(218,165,32,0.2)]">
        <h2 className="text-[#daa520] font-black italic text-xl uppercase tracking-tighter mb-2">Условия контракта</h2>
        
        <div className="space-y-4 text-[11px] font-mono leading-relaxed text-white/80">
          <p>
            Вы принимаете задачу: <span className="text-white font-bold uppercase">"{task.title}"</span>.
          </p>
          
          <div className="bg-white/5 p-3 border-l-2 border-[#daa520]">
            <p className="mb-1 text-[10px] uppercase text-[#daa520]/60">Срок исполнения:</p>
            <p className="text-[12px] font-bold">ДО {task.deadline} (23:59 МСК)</p>
          </div>

          <div className="bg-red-500/10 p-3 border-l-2 border-red-500">
            <p className="mb-1 text-[10px] uppercase text-red-500/60">Риск провала:</p>
            <p className="text-[12px] font-bold">-{penaltyPercent}% ОТ MAX HP</p>
          </div>

          <p className="italic opacity-60">
            * Если контракт не будет закрыт вовремя, он переместится в архив как "Проваленный", а персонаж получит урон.
          </p>
        </div>

        <div className="mt-8 flex flex-col gap-2">
          <button 
            onClick={onClose}
            className="w-full bg-[#daa520] text-black font-black py-3 uppercase text-[12px] active:scale-95 transition-transform"
          >
            ПРИНЯТЬ КОНТРАКТ
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuestDetailsModal;