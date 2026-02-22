import React from 'react';
import Header from '../components/Header';

const CharacterPage = ({ 
  character = { name: "Sir Pixelot", hp: 85, lvl: 14, xp: 1200, max_xp: 2000, gold: 450 },
  videos 
}) => {
  return (
    <div className="fixed inset-0 w-full h-full bg-black overflow-hidden flex flex-col font-mono">
      
      {/* --- ЗАДНИЙ ФОН (ВИДЕО) --- */}
      <div className="absolute inset-0 z-0 bg-black">
        <video
          src={videos?.camp || ""}
          autoPlay loop muted playsInline
          className="w-full h-full object-cover opacity-60"
          style={{ imageRendering: 'pixelated' }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/80" />
      </div>

      {/* --- КОНТЕНТ --- */}
      <div className="relative z-10 flex flex-col h-full p-5">
        
        {/* Хедер сам задает pt-[68px] и отступ снизу */}
        <Header 
          title="Лагерь" 
          subtitle="Безопасная зона" 
          gold={character.gold}
        />

        {/* --- СТАТЫ ПЕРСОНАЖА (ПРОЗРАЧНЫЙ ФОН) --- */}
        <div className="flex gap-4 items-center mt-2 px-1">
          
          {/* Аватарка */}
          <div className="relative shrink-0">
            <div className="w-14 h-14 bg-black/40 border-2 border-[#daa520]/50 flex items-center justify-center shadow-[4px_4px_0_rgba(0,0,0,0.5)]">
              <span className="text-[#daa520] text-2xl font-black italic drop-shadow-md">R</span>
            </div>
            {/* Уровень */}
            <div className="absolute -bottom-1 -right-1 bg-[#daa520] text-black text-[9px] font-black px-1 border border-black">
              {character.lvl}
            </div>
          </div>

          {/* Имя и Полоски */}
          <div className="flex-1 space-y-2">
            <div>
              <h3 className="text-white text-[13px] font-black uppercase tracking-tight leading-none drop-shadow-md">
                {character.username || character.name}
              </h3>
              <p className="text-[#daa520]/70 text-[7px] uppercase tracking-widest mt-1 font-bold">Рыцарь ордена</p>
            </div>

            {/* Полоски без тяжелых рамок */}
            <div className="space-y-1.5">
              {/* HP */}
              <div className="relative w-full h-2.5 bg-black/40 border border-white/10 overflow-hidden">
                <div 
                  className="h-full bg-[#cc0000] shadow-[0_0_8px_#cc0000] transition-all duration-500" 
                  style={{ width: `${character.hp}%` }}
                />
                <span className="absolute inset-0 flex items-center justify-center text-[5px] text-white/90 font-black uppercase tracking-tighter">
                  HEALTH {character.hp}%
                </span>
              </div>
              
              {/* XP */}
              <div className="relative w-full h-1 bg-black/40 border border-white/5 overflow-hidden">
                <div 
                  className="h-full bg-[#0070dd] shadow-[0_0_5px_#0070dd] transition-all duration-1000" 
                  style={{ width: `${(character.xp / (character.max_xp || 100)) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Нижняя виньетка для глубины */}
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_-100px_100px_rgba(0,0,0,0.9)]" />
    </div>
  );
};

export default CharacterPage;