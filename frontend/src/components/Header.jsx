import React from 'react';

const Header = ({ title, subtitle, gold }) => {
  return (
    <header 
      className="w-full shrink-0 z-50"
      style={{ 
        // 1. Динамический отступ: берет либо 16px (на Android), 
        // либо высоту челки + 4px (на iOS), выбирая большее.
        paddingTop: 'max(16px, calc(env(safe-area-inset-top, 0px) + 4px))',
        // 2. Небольшой отступ снизу до контента страницы
        paddingBottom: '1vh',
        transform: 'translateZ(0)' // Фикс для четкости рендеринга
      }}
    >
      <div className="flex items-center justify-between px-4 h-14 sm:h-16 relative">
        
        {/* ЛЕВЫЙ БЛОК (Резерв под кнопку "Назад" в будущем) */}
        <div className="w-16 shrink-0" />

        {/* ЦЕНТРАЛЬНЫЙ БЛОК (Заголовок) */}
        {/* Используем absolute для идеальной центровки вне зависимости от размера золота */}
        <div className="absolute left-1/2 -translate-x-1/2 text-center w-[60%] pointer-events-none flex flex-col items-center">
          <h2 className="text-[#daa520] text-[5.2vw] sm:text-2xl font-black uppercase tracking-tighter drop-shadow-[0_2px_2px_rgba(0,0,0,1)] leading-none truncate w-full">
            {title}
          </h2>
          {subtitle && (
            <p className="text-white/60 text-[2.8vw] sm:text-[12px] uppercase tracking-[0.15em] mt-1 leading-none opacity-80 truncate w-full">
              {subtitle}
            </p>
          )}
        </div>
        
        {/* ПРАВЫЙ БЛОК (Золото) */}
        <div className="w-16 flex justify-end shrink-0 z-20"> 
          {gold !== undefined && gold !== null && (
            <div className="relative flex items-center gap-1.5 bg-[#111]/80 backdrop-blur-md px-2 py-1 border border-[#f7d51d]/40 shadow-[2px_2px_0_#000]">
              <span className="text-[#f7d51d] font-bold text-[3.2vw] sm:text-sm tracking-tighter leading-none">
                {gold}
              </span>
              {/* Магический кристалл */}
              <div className="w-2 h-2 bg-[#f7d51d] shadow-[0_0_8px_#f7d51d] animate-pulse rotate-45 shrink-0" />
            </div>
          )}
        </div>

      </div>
    </header>
  );
};

export default Header;