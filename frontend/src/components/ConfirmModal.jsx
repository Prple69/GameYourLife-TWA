import React from 'react';

const ConfirmModal = ({ task, onConfirm, onCancel }) => {
  if (!task) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-md bg-black/80">
      <div className="w-full max-w-sm bg-[#111] border-2 border-[#daa520] p-6 shadow-[10px_10px_0px_#000]">
        <h2 className="text-[#daa520] text-xl font-black uppercase mb-4 tracking-tighter text-center">
          Подтверждение
        </h2>
        <p className="text-white/80 text-center mb-8 uppercase text-[10px] font-bold leading-relaxed font-mono">
          Ты клянешься своей честью, что контракт <br/>
          <span className="text-white text-xs">"{task.title}"</span> <br/>
          действительно выполнен?
        </p>
        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={onCancel}
            className="py-3 border border-white/20 text-white/40 font-black uppercase text-[10px] active:bg-white/5"
          >
            ОТМЕНА
          </button>
          <button 
            onClick={onConfirm}
            className="py-3 bg-[#daa520] text-black font-black uppercase text-[10px] shadow-[3px_3px_0px_#000] active:translate-y-0.5 active:shadow-none"
          >
            КЛЯНУСЬ
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;