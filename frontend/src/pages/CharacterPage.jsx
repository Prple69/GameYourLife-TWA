import React from 'react';
import Header from '../components/Header';

const CharacterPage = ({ 
  character = { name: "Sir Pixelot", hp: 85, lvl: 14, xp: 1200, max_xp: 2000, gold: 450 },
  videos 
}) => {
  return (
    <div className="fixed inset-0 w-full h-full bg-black overflow-hidden flex flex-col font-mono">
      
      {/* --- ВЕРХНЯЯ ПАНЕЛЬ --- */}
      <div className="relative z-20 w-full bg-[#111] border-b-4 border-[#2a1a10] shadow-[0_4px_15px_rgba(0,0,0,1)] px-5 pb-6">
        
        {/* Хедер теперь про локацию */}
        <Header 
          title="Лагерь" 
          subtitle="Безопасная зона" 
          gold={character.gold}
          pt="pt-[68px]" 
          sgap="gap-1"
        />

        {/* --- КАРТОЧКА ПЕРСОНАЖА (ОТДЕЛЬНО) --- */}
        <div className="mt-2 bg-[#1a1a1a] border-2 border-white/5 p-3 shadow-[4px_4px_0_#000] flex gap-4 items-center">
          
          {/* Аватарка */}
          <div className="relative shrink-0">
            <div className="w-16 h-16 bg-black border-2 border-[#daa520] flex items-center justify-center shadow-[inset_0_0_10px_rgba(218,165,32,0.2)]">
              {/* Буква или иконка */}
              <span className="text-[#daa520] text-3xl font-black italic drop-shadow-[2px_2px_0_#000]">R</span>
            </div>
            {/* Уровень в углу аватарки */}
            <div className="absolute -bottom-1 -right-1 bg-[#daa520] text-black text-[10px] font-black px-1.5 border-2 border-[#1a1a1a]">
              Lvl {character.lvl}
            </div>
          </div>

          {/* Имя и Статы */}
          <div className="flex-1 space-y-3">
            <div>
              <h3 className="text-white text-[14px] font-black uppercase tracking-tight leading-none">
                {character.username || character.name}
              </h3>
              <p className="text-[#daa520] text-[7px] uppercase tracking-[0.2em] mt-1 font-bold">Рыцарь ордена</p>
            </div>

            {/* Полоски */}
            <div className="space-y-2">
              {/* HP */}
              <div className="relative w-full h-3 bg-black border border-white/10 shadow-[2px_2px_0_rgba(0,0,0,0.5)] overflow-hidden">
                <div 
                  className="h-full bg-[#cc0000] shadow-[0_0_10px_#cc0000] transition-all duration-500" 
                  style={{ width: `${character.hp}%` }}
                />
                <span className="absolute inset-0 flex items-center justify-center text-[6px] text-white font-black uppercase">
                  HP {character.hp}%
                </span>
              </div>
              
              {/* XP */}
              <div className="relative w-full h-1.5 bg-black border border-white/5 overflow-hidden">
                <div 
                  className="h-full bg-[#0070dd] shadow-[0_0_8px_#0070dd] transition-all duration-1000" 
                  style={{ width: `${(character.xp / (character.max_xp || 100)) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- ЦЕНТРАЛЬНАЯ ОБЛАСТЬ С ВИДЕО --- */}
      <div className="flex-1 relative bg-black">
        <video
          src={videos?.camp || ""}
          autoPlay loop muted playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-80"
          style={{ imageRendering: 'pixelated' }}
        />
        
        {/* Градиенты и виньетка */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black pointer-events-none" />
        <div className="absolute inset-0 shadow-[inset_0_0_150px_rgba(0,0,0,0.9)] pointer-events-none" />
      </div>
    
    </div>
  );
};

export default CharacterPage;