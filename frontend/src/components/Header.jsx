import React from 'react';

const Header = ({ title, subtitle, gold }) => {
  return (
    <div 
      className="relative flex items-center justify-between w-full shrink-0" 
      style={{ 
        // 1. Автоматический отступ под челку iOS/Android + 2% от высоты экрана для воздуха
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 2vh)',
        // 2. Адаптивный нижний отступ
        marginBottom: '2vh',
        transform: 'translateZ(0)' 
      }}
    >
      
      {/* ЛЕВЫЙ БЛОК (для баланса) */}
      <div className="w-[15%] shrink-0" /> 

      {/* ЦЕНТРАЛЬНЫЙ БЛОК (Заголовок) */}
      <div className="absolute left-1/2 -translate-x-1/2 text-center w-full pointer-events-none flex flex-col items-center px-4">
        <h2 className="text-[#daa520] text-[5.5vw] sm:text-2xl font-black uppercase tracking-tighter drop-shadow-[0_2px_2px_rgba(0,0,0,1)] leading-none">
          {title}
        </h2>
        {subtitle && (
          <p className="text-white/60 text-[2.8vw] sm:text-[12px] uppercase tracking-widest mt-[0.5vh] leading-none opacity-80">
            {subtitle}
          </p>
        )}
      </div>
      
      {/* ПРАВЫЙ БЛОК (Золото) */}
      <div className="w-[20%] flex justify-end shrink-0 z-20"> 
        {gold !== undefined && gold !== null && (
          <div className="relative flex items-center gap-2 bg-[#111]/80 backdrop-blur-sm px-[2.5vw] py-[0.6vh] border border-[#f7d51d]/40 shadow-[2px_2px_0_#000]">
            <span className="text-[#f7d51d] font-bold text-[3.2vw] sm:text-sm tracking-tighter">
              {gold}
            </span>
            <div className="w-[1.5vw] h-[1.5vw] max-w-[10px] max-h-[10px] bg-[#f7d51d] shadow-[0_0_8px_#f7d51d] animate-pulse" />
          </div>
        )}
      </div>

    </div>
  );
};

export default Header;