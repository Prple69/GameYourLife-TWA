import React from 'react';

const Header = ({ title, subtitle, gold }) => {
  return (
    <header 
      className="w-full shrink-0 z-50 transition-all duration-300"
      style={{ 
        // Используем constant для iOS 11.0 и env для 11.2+
        // Добавляем фиксированный отступ 12px (0.75rem), чтобы текст не прилипал к челке
        paddingTop: 'max(12px, env(safe-area-inset-top))',
        transform: 'translateZ(0)' 
      }}
    >
      <div className="flex items-center justify-between px-4 h-16 sm:h-20">
        
        {/* ЛЕВЫЙ БЛОК: Оставляем место или под кнопку Назад */}
        <div className="w-12 sm:w-16 flex-shrink-0" />

        {/* ЦЕНТРАЛЬНЫЙ БЛОК: Используем flex-1 вместо absolute для надежности */}
        <div className="flex-1 flex flex-col items-center justify-center text-center px-2">
          <h2 className="text-[#daa520] text-[5vw] sm:text-2xl font-black uppercase tracking-tighter drop-shadow-[0_2px_2px_rgba(0,0,0,1)] leading-tight line-clamp-1">
            {title}
          </h2>
          {subtitle && (
            <p className="text-white/60 text-[2.8vw] sm:text-[12px] uppercase tracking-widest leading-none opacity-80 truncate">
              {subtitle}
            </p>
          )}
        </div>

        {/* ПРАВЫЙ БЛОК: Золото */}
        <div className="w-12 sm:w-16 flex justify-end flex-shrink-0">
          {gold !== undefined && gold !== null && (
            <div className="flex items-center gap-1.5 bg-[#111]/90 backdrop-blur-md px-2 py-1 border border-[#f7d51d]/30 shadow-md">
              <span className="text-[#f7d51d] font-bold text-[3.2vw] sm:text-sm">
                {gold}
              </span>
              <div className="w-2 h-2 bg-[#f7d51d] shadow-[0_0_5px_#f7d51d] animate-pulse rotate-45" />
            </div>
          )}
        </div>

      </div>
    </header>
  );
};

export default Header;