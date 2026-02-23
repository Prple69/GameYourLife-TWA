import React from 'react';

const HistoryModal = ({ isOpen, onClose, history, triggerHaptic }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex flex-col p-6 animate-in fade-in zoom-in duration-300">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 border-b border-[#daa520]/30 pb-4">
        <div className="flex flex-col">
          <h2 className="text-[#daa520] font-black italic text-xl tracking-tighter uppercase leading-none">
            Архив контрактов
          </h2>
          <span className="text-white/30 text-[8px] uppercase tracking-[0.2em] mt-1">
            Реестр завершенных операций
          </span>
        </div>
        <button 
          onClick={() => {
            triggerHaptic?.('light');
            onClose();
          }}
          className="text-white/40 hover:text-white font-black text-[10px] border border-white/10 px-3 py-1 uppercase tracking-widest active:bg-white/5 transition-all"
        >
          [ Закрыть ]
        </button>
      </div>
      
      {/* Список квестов */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 border border-dashed border-white/5 opacity-20">
            <p className="uppercase text-[10px] font-black tracking-[0.3em]">История пуста</p>
          </div>
        ) : (
          history.map((item, index) => (
            <div 
              key={item.id || index} 
              className="group relative bg-white/5 border border-white/5 p-4 flex justify-between items-center overflow-hidden"
            >
              {/* Декоративная полоса сбоку */}
              <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-[#4ade80]/50" />
              
              <div className="flex flex-col gap-1 min-w-0 pr-4">
                <span className="text-white/80 text-[13px] uppercase font-bold truncate leading-none">
                  {item.title}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[#4ade80] text-[8px] font-black uppercase tracking-tighter">
                    Status: Succeded
                  </span>
                  <span className="text-white/20 text-[14px]">/</span>
                  <span className="text-white/40 text-[8px] font-mono">
                    {item.deadline}
                  </span>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="text-[#daa520] text-[11px] font-black leading-none">
                  +{item.gold_reward} G
                </div>
                <div className="text-[#a855f7] text-[9px] font-bold mt-1 uppercase">
                  +{item.xp_reward} XP
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer Info */}
      <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center opacity-30">
        <span className="text-[8px] uppercase font-bold tracking-widest text-white">
          Total contracts: {history.length}
        </span>
        <span className="text-[8px] font-mono text-white">
          SYSTEM_VER: 2.2.0_MSK
        </span>
      </div>
    </div>
  );
};

export default HistoryModal;