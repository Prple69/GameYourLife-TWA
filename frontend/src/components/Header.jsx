import React from 'react';

const Header = ({ title, subtitle, gold, smt = "mt-1" }) => {
  return (
    <div className="relative flex items-center justify-between mb-6 border-b-2 border-[#daa520]/30 pb-8 pt-[68px]">
      
      {/* ЛЕВЫЙ БЛОК */}
      <div className="w-16 z-0" /> 

      {/* ЦЕНТРАЛЬНЫЙ БЛОК */}
      {/* Убрали лишние флекс-выравнивания, оставили только позиционирование */}
      <div className="absolute left-1/2 -translate-x-1/2 text-center w-full pointer-events-none">
        
        {/* Тайтл теперь "якорь", он никуда не двигается */}
        <h2 className="text-[#daa520] text-2xl font-black uppercase tracking-tighter drop-shadow-[0_2px_2px_rgba(0,0,0,1)] leading-none">
          {title}
        </h2>
        
        {/* Сабтайтл теперь просто имеет блок, чтобы margin работал корректно */}
        <div className="flex justify-center">
           <p className={`text-white/40 text-[8px] uppercase tracking-widest leading-none mt-[50px]`}>
             {subtitle}
           </p>
        </div>

      </div>
      
      {/* ПРАВЫЙ БЛОК */}
      <div className="w-16 flex justify-end"> 
        {gold !== undefined && gold !== null && (
          <div className="relative z-10 flex items-center gap-2 bg-[#111] px-3 py-1 border border-[#f7d51d]/40 shadow-[4px_4px_0_#000]">
            <span className="text-[#f7d51d] font-bold text-sm tracking-tighter">{gold}</span>
            <div className="w-2.5 h-2.5 bg-[#f7d51d] rounded-full shadow-[0_0_8px_#f7d51d] animate-pulse" />
          </div>
        )}
      </div>

    </div>
  );
};

export default Header;