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
    max_hp = 100,
    lvl = 999,
    xp = 1200,
    max_xp = 2000,
    gold = 450
  } = character;

  const xpPercentage = Math.min((xp / (max_xp || 100)) * 100, 100);
  const hpPercentage = Math.min((hp / (max_hp || 100)) * 100, 100);

  return (
    <div className="fixed inset-0 w-full h-full bg-black overflow-hidden flex flex-col font-mono items-center select-none touch-none">
      
      {/* --- ФОН --- */}
      <div className="absolute inset-0 z-0 bg-black">
        <video
          src={videos?.camp || ""}
          autoPlay loop muted playsInline
          className="w-full h-full object-cover opacity-60"
          style={{ imageRendering: 'pixelated' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-transparent to-black/60 pointer-events-none" />
      </div>

      {/* --- КОНТЕНТ --- */}
      <div className="relative z-10 flex flex-col items-center w-full h-full px-4 pt-4 pb-20">
        
        <div className="w-full max-w-2xl shrink-0">
          <Header title="ЛАГЕРЬ" subtitle="СТАТУС ПЕРСОНАЖА" />
        </div>

        {/* --- ГЛАВНАЯ ПАНЕЛЬ --- */}
        <div className="relative mt-4 md:mt-6 w-full max-w-xl bg-black/70 backdrop-blur-xl border border-white/15 p-4 md:p-6 shadow-xl">
          
          {/* ЗОЛОТО: Компактный шильдик */}
          <div className="absolute -top-2 -right-2 bg-black border border-[#daa520] px-2 py-1 flex items-center gap-2 shadow-[3px_3px_0_#000] z-30">
            <div className="w-2.5 h-2.5 bg-[#daa520] rotate-45 border border-black shadow-[0_0_5px_#daa520]" />
            <span className="text-[#daa520] text-sm md:text-lg font-[1000] tabular-nums leading-none">
              {gold}
            </span>
          </div>

          <div className="flex flex-col md:flex-row gap-4 md:gap-8">
            
            {/* ЛЕВАЯ ЧАСТЬ: Аватар */}
            <div className="flex flex-row md:flex-col items-center md:items-start gap-4 md:gap-0 shrink-0">
              
              <div className="relative shrink-0">
                <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-40 md:h-40 bg-[#111] border border-[#444] shadow-[4px_4px_0_#000] flex items-center justify-center overflow-hidden">
                  <span className="text-white/5 text-5xl md:text-[8rem] font-black not-italic">?</span>
                </div>
                
                {/* LVL: Теперь более соразмерный */}
                <div className="absolute -bottom-1 -left-1 bg-[#daa520] border border-black text-black text-[11px] md:text-[15px] font-[1000] px-2 py-0.5 shadow-[2px_2px_0_#000] z-20">
                  {lvl} LVL
                </div>
              </div>

              {/* Мобильный ник */}
              <div className="md:hidden flex-1 min-w-0">
                <h3 className="text-white text-lg font-[1000] uppercase tracking-tighter truncate leading-none">
                  {username || name}
                </h3>
                <p className="text-[#daa520] text-[12px] uppercase font-[1000] mt-1.5 leading-none">
                  Рыцарь Смерти
                </p>
              </div>
            </div>

            {/* ПРАВАЯ ЧАСТЬ: Инфа и Статы */}
            <div className="flex-1 min-w-0 flex flex-col justify-center self-stretch">
              
              {/* Десктопный ник */}
              <div className="hidden md:block mb-4">
                <h3 className="text-white text-3xl font-[1000] uppercase tracking-tighter leading-none truncate drop-shadow-[2px_2px_0_#000]">
                  {username || name}
                </h3>
                <p className="text-[#daa520] text-[16px] uppercase tracking-[0.1em] font-[1000] mt-2 leading-none">
                  Рыцарь Смерти
                </p>
              </div>

              {/* ПОЛОСКИ СТАТОВ: Сбалансированный размер */}
              <div className="flex flex-col gap-3.5 md:gap-5">
                
                {/* ЗДОРОВЬЕ */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-end px-0.5">
                    <span className="text-[#ef4444] text-[11px] md:text-[14px] font-[1000] uppercase tracking-widest">Здоровье</span>
                    <span className="text-white text-sm md:text-xl font-[1000] leading-none tracking-tighter">
                      {hp}/{max_hp}
                    </span>
                  </div>
                  <div className="relative w-full h-3.5 bg-black border border-white/10 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-[#800] via-[#ef4444] to-[#ff3030] transition-all duration-700 relative" 
                      style={{ width: `${hpPercentage}%` }}
                    >
                      <div className="absolute top-0 left-0 w-full h-[30%] bg-white/20" />
                    </div>
                  </div>
                </div>

                {/* ОПЫТ */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-end px-0.5">
                    <span className="text-[#daa520] text-[11px] md:text-[14px] font-[1000] uppercase tracking-widest">Опыт</span>
                    <span className="text-white text-sm md:text-xl font-[1000] leading-none tracking-tighter">
                      {xp}/{max_xp}
                    </span>
                  </div>
                  <div className="relative w-full h-3.5 bg-black border border-white/10 overflow-hidden">
                    <div 
                      className="h-full bg-[#daa520] transition-all duration-1000 relative shadow-[0_0_10px_rgba(218,165,32,0.3)]" 
                      style={{ width: `${xpPercentage}%` }}
                    >
                      <div className="absolute inset-0 w-full h-full animate-[scan-line_4s_linear_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent translate-x-[-100%]" />
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes scan-line {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}} />
    </div>
  );
};

export default CharacterPage;