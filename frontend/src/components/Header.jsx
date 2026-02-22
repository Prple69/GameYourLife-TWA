import React from 'react';

const Header = ({ title, subtitle, gold }) => {
  return (
    <div className="flex justify-between items-end mb-6 border-b-2 border-[#daa520]/30 pb-2">
      <div>
        <h2 className="text-[#daa520] text-2xl font-black uppercase tracking-tighter drop-shadow-[0_2px_2px_rgba(0,0,0,1)]">
          {title}
        </h2>
        <p className="text-white/40 text-[8px] uppercase tracking-widest">{subtitle}</p>
      </div>
      
      {/* Баланс золота */}
      <div className="flex items-center gap-2 bg-[#111] px-3 py-1 border border-[#f7d51d]/40 shadow-[4px_4px_0_#000]">
        <span className="text-[#f7d51d] font-bold text-sm tracking-tighter">{gold}</span>
        <div className="w-2.5 h-2.5 bg-[#f7d51d] rounded-full shadow-[0_0_8px_#f7d51d] animate-pulse" />
      </div>
    </div>
  );
};

export default Header;