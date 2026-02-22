import React from 'react';

const CharacterPage = ({ 
  character = { name: "Sir Pixelot", hp: 85, lvl: 14, xp: 1200, max_xp: 2000, gold: 450 },
  videos 
}) => {
  return (
    <div className="fixed inset-0 w-full h-full bg-black overflow-hidden flex flex-col font-mono">
      
      {/* --- МАССИВНАЯ ВЕРХНЯЯ ПАНЕЛЬ С ОТСТУПОМ --- */}
      {/* Добавил pt-10 (примерно 40px), чтобы панель ушла ниже кнопок Telegram */}
      <div className="relative z-20 w-full bg-[#111] border-b-4 border-[#2a1a10] shadow-[0_4px_10px_rgba(0,0,0,0.9)] px-5 pt-10 pb-4">
        
        {/* Первый ряд: Имя и Золото */}
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#222] border-2 border-[#daa520] flex items-center justify-center shadow-[2px_2px_0_#000]">
              <span className="text-[#daa520] text-xs font-bold">R</span>
            </div>
            <div>
              <h1 className="text-[#daa520] text-[16px] font-black uppercase tracking-tighter leading-none">
                {character.username || character.name}
              </h1>
              <p className="text-white/30 text-[8px] uppercase tracking-widest mt-1">Рыцарь ордена</p>
            </div>
          </div>

          <div className="bg-black/60 px-3 py-1 border border-[#daa520]/20 flex items-center gap-2">
            <span className="text-[#f7d51d] text-xs font-bold">{character.gold}</span>
            <div className="w-2 h-2 bg-[#f7d51d] rounded-full shadow-[0_0_5px_#f7d51d]"></div>
          </div>
        </div>

        {/* Второй ряд: Статы и Лвл */}
        <div className="grid grid-cols-[1fr_50px] gap-4 items-center px-1">
          <div className="space-y-2">
            {/* Полоска HP */}
            <div className="relative w-full h-4 bg-[#1a1a1a] border border-white/10 overflow-hidden">
              <div 
                className="h-full bg-[#cc0000] shadow-[0_0_10px_#cc0000] transition-all duration-500" 
                style={{ width: `${character.hp}%` }}
              />
              <span className="absolute inset-0 flex items-center justify-center text-[7px] text-white font-black uppercase drop-shadow-[1px_1px_0_rgba(0,0,0,1)]">
                Health {character.hp}%
              </span>
            </div>
            
            {/* Полоска XP */}
            <div className="relative w-full h-1.5 bg-[#1a1a1a] border border-white/5 overflow-hidden">
              <div 
                className="h-full bg-[#0070dd] shadow-[0_0_8px_#0070dd] transition-all duration-1000" 
                // {/* Исправил max_xp под твой бэкенд (там через подчеркивание) */}
                style={{ width: `${(character.xp / (character.max_xp || 100)) * 100}%` }}
              />
            </div>
          </div>

          <div className="flex flex-col items-center justify-center border-l border-white/10 h-full">
            <span className="text-white/30 text-[7px] uppercase tracking-tighter">Lvl</span>
            <span className="text-white text-lg font-black leading-none">{character.lvl}</span>
          </div>
        </div>
      </div>

      {/* --- ЦЕНТРАЛЬНАЯ ОБЛАСТЬ С ВИДЕО --- */}
      <div className="flex-1 relative bg-black">
        <video
          src={videos?.camp || ""}
          autoPlay
          loop
          muted
          playsInline
          /* Добавил playsInline и webkit-playsinline для мобилок */
          webkit-playsinline="true"
          className="absolute inset-0 w-full h-full object-cover opacity-80"
          style={{ imageRendering: 'pixelated', willChange: 'transform' }}
        />
        
        {/* Градиенты для глубины и скрытия стыков */}
        <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black/60 pointer-events-none" />
        
        {/* Декоративная виньетка по краям */}
        <div className="absolute inset-0 shadow-[inset_0_0_100px_rgba(0,0,0,0.8)] pointer-events-none" />
      </div>
    
    </div>
  );
};

export default CharacterPage;