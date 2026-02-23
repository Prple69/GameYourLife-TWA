import React from 'react';

const AvatarSelector = ({ isOpen, onClose, avatars, currentAvatar, onSelect }) => {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in zoom-in duration-200">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative w-full max-w-sm bg-[#0a0a0a] border-2 border-white/20 p-6 shadow-[10px_10px_0_#000]">
        {/* КРЕСТИК */}
        <button 
          onClick={onClose}
          className="absolute -top-3 -right-3 w-10 h-10 bg-white text-black border-2 border-black flex items-center justify-center shadow-[4px_4px_0_#000] active:translate-y-0.5 active:shadow-none transition-all z-10"
        >
          <span className="text-2xl font-[1000]">×</span>
        </button>

        <h2 className="text-white text-xl font-[1000] uppercase tracking-tighter mb-8 text-center italic">
          СМЕНИТЬ ОБЛИК
        </h2>

        <div className="grid grid-cols-3 gap-4 mb-8">
          {avatars.map((av) => (
            <div 
              key={av.id}
              // ИСПРАВЛЕНО: Передаем av.id ("avatar1"), а не картинку
              onClick={() => onSelect(av.id)} 
              className={`aspect-square border-2 cursor-pointer transition-all active:scale-90 relative overflow-hidden ${
                // ИСПРАВЛЕНО: Сравниваем с id из базы
                currentAvatar === av.id 
                  ? 'border-[#daa520] scale-105 shadow-[0_0_15px_#daa520] z-10' 
                  : 'border-white/10 grayscale hover:grayscale-0 hover:border-white/40'
              }`}
            >
              <img src={av.img} alt={av.label} className="w-full h-full object-cover" />
              
              {/* Индикатор выбранного аватара (опционально) */}
              {currentAvatar === av.id}
            </div>
          ))}
        </div>

        <p className="text-white/30 text-[9px] uppercase font-[1000] text-center tracking-[0.2em]">
          ВЫБЕРИТЕ СВОЕГО ГЕРОЯ
        </p>
      </div>
    </div>
  );
};

export default AvatarSelector;