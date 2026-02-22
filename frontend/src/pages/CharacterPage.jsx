import React from 'react';
import Header from '../components/Header';

const CharacterPage = ({ 
  character = { name: "Sir Pixelot", hp: 85, lvl: 14, xp: 1200, max_xp: 2000, gold: 450 },
  videos 
}) => {
  return (
    <div className="fixed inset-0 w-full h-full bg-black overflow-hidden flex flex-col font-mono">
      
      {/* --- ЗАДНИЙ ФОН (ВИДЕО БЕЗ ЗАТЕМНЕНИЯ) --- */}
      <div className="absolute inset-0 z-0 bg-black">
        <video
          src={videos?.camp || ""}
          autoPlay loop muted playsInline
          className="w-full h-full object-cover opacity-100" // Прозрачность 100%
          style={{ imageRendering: 'pixelated' }}
        />
        {/* Только верхний градиент, чтобы текст хедера не терялся */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-transparent pointer-events-none" />
      </div>

      {/* --- КОНТЕНТ --- */}
      <div className="relative z-10 flex flex-col h-full p-5">
        
        {/* Хедер с золотом */}
        <Header 
          title="Лагерь" 
          subtitle="Безопасная зона" 
          gold={character.gold} // Теперь золото отображается справа
        />

        {/* --- ПАНЕЛЬ СТАТОВ --- */}
        <div className="flex gap-4 items-end mt-4 px-1">
          
          {/* Аватарка и Уровень */}
          <div className="relative shrink-0 group">
            <div className="w-16 h-16 bg-black/60 border-2 border-[#f7d51d] shadow-[0_0_15px_rgba(247,213,29,0.3)] flex items-center justify-center relative overflow-hidden">
              <span className="text-[#f7d51d] text-4xl font-black italic z-10 drop-shadow-[2px_2px_0_#000]">R</span>
              <div className="absolute inset-0 bg-gradient-to-tr from-[#f7d51d]/20 to-transparent" />
            </div>
            {/* Уровень как отдельный шильдик */}
            <div className="absolute -top-2 -left-2 bg-[#f7d51d] text-black text-[10px] font-black px-2 py-0.5 shadow-[2px_2px_0_#000] rotate-[-5deg]">
              LVL {character.lvl}
            </div>
          </div>

          {/* Информационные полоски */}
          <div className="flex-1 flex flex-col gap-3">
            
            {/* Блок HP */}
            <div className="w-full">
              <div className="flex justify-between items-end mb-1">
                <span className="text-[#cc0000] text-[9px] font-black uppercase tracking-tighter">Vitality</span>
                <span className="text-white text-[10px] font-bold">{character.hp}%</span>
              </div>
              <div className="relative w-full h-4 bg-black/80 border border-white/20 shadow-[2px_2px_0_rgba(0,0,0,0.5)]">
                {/* Сетка делений на полоске HP */}
                <div className="absolute inset-0 z-10 flex justify-between px-1 pointer-events-none">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="w-[1px] h-full bg-black/30" />
                  ))}
                </div>
                <div 
                  className="h-full bg-gradient-to-r from-[#880000] to-[#ff0000] shadow-[0_0_10px_#ff0000] transition-all duration-700" 
                  style={{ width: `${character.hp}%` }}
                />
              </div>
            </div>

            {/* Блок XP */}
            <div className="w-full">
              <div className="flex justify-between items-end mb-1">
                <span className="text-[#0070dd] text-[9px] font-black uppercase tracking-tighter">Experience</span>
                <span className="text-white/60 text-[8px]">{character.xp} / {character.max_xp}</span>
              </div>
              <div className="relative w-full h-2 bg-black/80 border border-white/10">
                <div 
                  className="h-full bg-[#0070dd] shadow-[0_0_8px_#0070dd] transition-all duration-1000" 
                  style={{ width: `${(character.xp / (character.max_xp || 100)) * 100}%` }}
                />
              </div>
            </div>
          </div>

        </div>

        {/* Имя персонажа вынесено ниже для акцента */}
        <div className="mt-4 ml-1">
           <h3 className="text-white text-lg font-black uppercase tracking-tight leading-none drop-shadow-[2px_2px_0_rgba(0,0,0,1)]">
             {character.username || character.name}
           </h3>
           <div className="h-0.5 w-12 bg-[#f7d51d] mt-1 shadow-[0_0_5px_#f7d51d]" />
        </div>

      </div>

      {/* Нижняя тень для кнопок меню */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/60 via-transparent to-transparent" />
    </div>
  );
};

export default CharacterPage;