import React from 'react';

const AvatarSelector = ({ isOpen, onClose, avatars, currentAvatar, onSelect }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      {/* Overlay — просто темный фон без блюра и анимаций */}
      <div 
        className="absolute inset-0 bg-black/90" 
        onClick={onClose} 
      />
      
      {/* Modal Container */}
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
              onClick={() => onSelect(av.id)} 
              className={`aspect-square border-2 cursor-pointer transition-all active:scale-95 relative overflow-hidden ${
                currentAvatar === av.id 
                  ? 'border-[#daa520] shadow-[0_0_15px_rgba(218,165,32,0.4)] z-10' 
                  : 'border-white/10 grayscale hover:grayscale-0'
              }`}
            >
              <img 
                src={av.img} 
                alt={av.label} 
                className="w-full h-full object-cover" 
              />
              
              {/* Индикатор выбранного */}
              {currentAvatar === av.id && (
                <div className="absolute inset-0 border-2 border-[#daa520] pointer-events-none" />
              )}
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