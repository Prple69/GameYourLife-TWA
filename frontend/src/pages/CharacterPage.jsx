import React from 'react';
import Header from '../components/Header';

const CharacterPage = ({ 
  character = {}, 
  videos 
}) => {
  const {
    name = "Странник",
    username = "Purple",
    hp = 85,
    lvl = 14,
    xp = 1200,
    max_xp = 2000,
    gold = 450
  } = character;

  const xpPercentage = Math.min((xp / (max_xp || 100)) * 100, 100);

  return (
    <div className="fixed inset-0 w-full h-full bg-black overflow-hidden flex flex-col font-mono">
      
      {/* --- ФОНОВОЕ ВИДЕО --- */}
      <div className="absolute inset-0 z-0 bg-black">
        <video
          src={videos?.camp || ""}
          autoPlay loop muted playsInline
          className="w-full h-full object-cover opacity-100"
          style={{ imageRendering: 'pixelated' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black/40 pointer-events-none" />
      </div>

      {/* --- КОНТЕНТ --- */}
      <div className="relative z-10 flex flex-col h-full p-5">
        
        {/* Хедер теперь только для локации (золото не передаем) */}
        <Header 
          title="Лагерь" 
          subtitle="" 
        />

        {/* --- ЕДИНЫЙ БЛОК ПРОФИЛЯ --- */}
        <div className="mt-4 flex flex-col gap-5 px-1">
          
          {/* Верхний ряд: Аватар, Имя и Золото */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Аватар */}
              <div className="relative shrink-0">
                <div className="w-14 h-14 bg-[#111] border-2 border-[#444] shadow-[4px_4px_0_#000] flex items-center justify-center">
                  <span className="text-white/10 text-3xl font-black">?</span>
                </div>
                <div className="absolute -top-2 -left-2 bg-[#222] border border-[#daa520] text-[#daa520] text-[9px] font-black px-1.5 py-0.5 shadow-[2px_2px_0_#000]">
                  {lvl} ЛВЛ
                </div>
              </div>

              {/* Имя и Титул */}
              <div>
                <h3 className="text-white text-base font-black uppercase tracking-tighter leading-none drop-shadow-[2px_2px_0_#000]">
                  {username || name}
                </h3>
                <p className="text-[#666] text-[7px] uppercase tracking-[0.3em] mt-1 font-bold">Рыцарь смерти</p>
              </div>
            </div>

            {/* Золото теперь тут (в профиле) */}
            <div className="bg-[#111]/80 border-2 border-[#daa520]/40 px-3 py-1 shadow-[4px_4px_0_#000] flex items-center gap-2">
              <span className="text-[#daa520] text-xs font-black">{gold}</span>
              <div className="w-2.5 h-2.5 bg-[#daa520] shadow-[2px_2px_0_#000]" />
            </div>
          </div>

          {/* Блок полосок (Жизнь и Опыт) */}
          <div className="grid grid-cols-1 gap-4 bg-black/40 p-3 border border-white/5 backdrop-blur-sm">
            
            {/* Жизнь */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-widest">
                <span className="text-[#aa0000]">Здоровье</span>
                <span className="text-white">{hp}%</span>
              </div>
              <div className="relative w-full h-4 bg-[#0a0a0a] border border-[#333]">
                <div 
                  className="h-full bg-[#700] transition-all duration-500 relative" 
                  style={{ width: `${hp}%` }}
                >
                  <div className="absolute top-0 left-0 w-full h-0.5 bg-white/5" />
                </div>
                {/* Сетка делений */}
                <div className="absolute inset-0 flex justify-evenly pointer-events-none">
                  <div className="w-px h-full bg-black/60" />
                  <div className="w-px h-full bg-black/60" />
                  <div className="w-px h-full bg-black/60" />
                  <div className="w-px h-full bg-black/60" />
                </div>
              </div>
            </div>

            {/* Опыт */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-widest">
                <span className="text-[#3b82f6]">Опыт</span>
                <span className="text-white/40">{xp}/{max_xp}</span>
              </div>
              <div className="relative w-full h-1.5 bg-[#0a0a0a] border border-[#222]">
                <div 
                  className="h-full bg-[#1e40af] transition-all duration-1000" 
                  style={{ width: `${xpPercentage}%` }}
                />
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Виньетка снизу */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/80 via-transparent to-transparent" />
    </div>
  );
};

export default CharacterPage;