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
          className="w-full h-full object-cover opacity-80"
          style={{ imageRendering: 'pixelated' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-transparent to-black/60 pointer-events-none" />
      </div>

      {/* --- КОНТЕНТ --- */}
      <div className="relative z-10 flex flex-col items-center w-full h-full px-4 overflow-y-auto pt-4 pb-20">
        
        <div className="w-full max-w-2xl shrink-0">
          <Header title="ЛАГЕРЬ" subtitle="СТАТУС" />
        </div>

        {/* --- ГЛАВНАЯ ПАНЕЛЬ --- */}
        <div className="relative mt-6 md:mt-10 w-full max-w-2xl bg-black/70 backdrop-blur-2xl border-2 border-white/15 p-5 md:p-8 shadow-2xl">
          
          {/* ЗОЛОТО: Теперь это отдельный "шильдик" в углу панели */}
          <div className="absolute -top-3 -right-3 bg-black border-2 border-[#daa520] px-3 py-1.5 flex items-center gap-2 shadow-[4px_4px_0_#000] z-30">
            <div className="w-3 h-3 bg-[#daa520] rotate-45 border border-black shadow-[0_0_8px_#daa520]" />
            <span className="text-[#daa520] text-lg md:text-2xl font-[1000] tabular-nums leading-none">
              {gold}
            </span>
          </div>

          <div className="flex flex-col md:flex-row gap-6 md:gap-10">
            
            {/* ЛЕВАЯ ЧАСТЬ: Аватар и Ник (на мобилках) */}
            <div className="flex flex-row md:flex-col items-center md:items-start gap-5 md:gap-0 shrink-0">
              
              {/* АВАТАР с увеличенным LVL */}
              <div className="relative shrink-0">
                <div className="w-28 h-28 sm:w-32 sm:h-32 md:w-52 md:h-52 bg-[#111] border-2 border-[#555] shadow-[6px_6px_0_#000] flex items-center justify-center overflow-hidden">
                  <span className="text-white/5 text-7xl md:text-[12rem] font-black not-italic">?</span>
                </div>
                
                {/* УВЕЛИЧЕННЫЙ LVL */}
                <div className="absolute -bottom-2 -left-2 bg-[#daa520] border-2 border-black text-black text-[14px] md:text-[22px] font-[1000] px-3 py-1 shadow-[4px_4px_0_#000] z-20">
                  {lvl} LVL
                </div>
              </div>

              {/* Информация для мобилок (справа от аватара) */}
              <div className="md:hidden flex-1 min-w-0">
                <h3 className="text-white text-2xl font-[1000] uppercase tracking-tighter truncate leading-none">
                  {username || name}
                </h3>
                <p className="text-[#daa520] text-[16px] uppercase font-[1000] mt-2 leading-none">
                  Рыцарь Смерти
                </p>
              </div>
            </div>

            {/* ПРАВАЯ ЧАСТЬ: Полоски (и ник на десктопе) */}
            <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch">
              
              {/* Ник (Только десктоп) */}
              <div className="hidden md:block mb-6">
                <h3 className="text-white text-5xl font-[1000] uppercase tracking-tighter leading-none truncate drop-shadow-[4px_4px_0_#000]">
                  {username || name}
                </h3>
                <p className="text-[#daa520] text-[24px] uppercase tracking-[0.1em] font-[1000] mt-3 leading-none">
                  Рыцарь Смерти
                </p>
              </div>

              {/* ПОЛОСКИ СТАТОВ */}
              <div className="flex flex-col gap-5 md:gap-8">
                
                {/* ЗДОРОВЬЕ */}
                <div className="space-y-2">
                  <div className="flex justify-between items-end px-1">
                    <span className="text-[#ef4444] text-[13px] md:text-[18px] font-[1000] uppercase tracking-widest">Здоровье</span>
                    <span className="text-white text-xl md:text-3xl font-[1000] leading-none tracking-tighter">
                      {hp}/{max_hp}
                    </span>
                  </div>
                  <div className="relative w-full h-5 bg-black border-2 border-white/10 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-[#800] via-[#ef4444] to-[#ff3030] transition-all duration-700 relative animate-[pulse-bar_3s_infinite]" 
                      style={{ width: `${hpPercentage}%` }}
                    >
                      <div className="absolute top-0 left-0 w-full h-[30%] bg-white/20" />
                    </div>
                  </div>
                </div>

                {/* ОПЫТ */}
                <div className="space-y-2">
                  <div className="flex justify-between items-end px-1">
                    <span className="text-[#daa520] text-[13px] md:text-[18px] font-[1000] uppercase tracking-widest">Опыт</span>
                    <span className="text-white text-xl md:text-3xl font-[1000] leading-none tracking-tighter">
                      {xp}/{max_xp}
                    </span>
                  </div>
                  <div className="relative w-full h-5 bg-black border-2 border-white/10 overflow-hidden">
                    <div 
                      className="h-full bg-[#daa520] transition-all duration-1000 relative shadow-[0_0_15px_rgba(218,165,32,0.4)]" 
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
          50% { transform: translateX(100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes pulse-bar {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.85; }
        }
      `}} />
    </div>
  );
};

export default CharacterPage;