import React from 'react';
import Header from '../components/Header';

const CharacterPage = ({ 
  // Дефолтные данные на случай, если пропсы не пришли
  character = {}, 
  videos 
}) => {
  // Константы для безопасности данных
  const {
    name = "Неизвестный",
    username,
    hp = 100,
    lvl = 1,
    xp = 0,
    max_xp = 1000,
    gold = 0
  } = character;

  const xpPercentage = Math.min((xp / (max_xp || 100)) * 100, 100);

  return (
    <div className="fixed inset-0 w-full h-full bg-black overflow-hidden flex flex-col font-mono">
      
      {/* --- ЗАДНИЙ ФОН (ВИДЕО) --- */}
      <div className="absolute inset-0 z-0 bg-black">
        <video
          src={videos?.camp || ""}
          autoPlay loop muted playsInline
          className="w-full h-full object-cover opacity-100"
          style={{ imageRendering: 'pixelated' }}
        />
        {/* Затемнение только сверху для читаемости текста */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-transparent pointer-events-none" />
      </div>

      {/* --- КОНТЕНТ --- */}
      <div className="relative z-10 flex flex-col h-full p-5">
        
        <Header 
          title="Лагерь" 
          subtitle="Безопасная зона" 
          gold={gold} 
        />

        {/* --- ИНФОРМАЦИЯ О ГЕРОЕ --- */}
        <div className="flex gap-4 items-start mt-2 px-1">
          
          {/* Аватарка (Пиксельная рамка) */}
          <div className="relative shrink-0">
            <div className="w-16 h-16 bg-[#1a1a1a] border-2 border-[#555] shadow-[4px_4px_0_#000] flex items-center justify-center">
              <span className="text-white/20 text-4xl font-black uppercase">?</span>
              {/* Если будет картинка, она встанет сюда */}
              <div className="absolute inset-0 border border-white/5" />
            </div>
            {/* Уровень */}
            <div className="absolute -bottom-2 -right-2 bg-[#222] border-2 border-[#daa520] text-[#daa520] text-[10px] font-black px-1.5 py-0.5 shadow-[2px_2px_0_#000]">
              УР {lvl}
            </div>
          </div>

          {/* Характеристики */}
          <div className="flex-1 flex flex-col gap-4">
            
            {/* Имя и Класс */}
            <div className="mb-1">
              <h3 className="text-white text-lg font-black uppercase tracking-tighter leading-none drop-shadow-[2px_2px_0_#000]">
                {username || name}
              </h3>
              <p className="text-[#888] text-[8px] uppercase tracking-[0.2em] mt-1">Странник пустоши</p>
            </div>

            {/* Здоровье (Тяжелая полоса) */}
            <div className="w-full">
              <div className="flex justify-between items-center mb-1 px-0.5">
                <span className="text-[#aa0000] text-[8px] font-black uppercase tracking-widest">Жизнь</span>
                <span className="text-white text-[8px] font-bold">{hp}%</span>
              </div>
              <div className="relative w-full h-5 bg-[#111] border-2 border-[#333] shadow-[2px_2px_0_#000]">
                {/* Сетка делений */}
                <div className="absolute inset-0 z-10 flex justify-evenly pointer-events-none">
                  <div className="w-[2px] h-full bg-black/40" />
                  <div className="w-[2px] h-full bg-black/40" />
                  <div className="w-[2px] h-full bg-black/40" />
                </div>
                <div 
                  className="h-full bg-[#880000] transition-all duration-500 relative" 
                  style={{ width: `${hp}%` }}
                >
                  {/* Блик на полоске для объема */}
                  <div className="absolute top-0 left-0 w-full h-[2px] bg-white/10" />
                </div>
              </div>
            </div>

            {/* Опыт (Тонкая полоса) */}
            <div className="w-full">
              <div className="flex justify-between items-center mb-1 px-0.5">
                <span className="text-[#3b82f6] text-[8px] font-black uppercase tracking-widest">Опыт</span>
                <span className="text-white/40 text-[7px] italic">{xp} / {max_xp}</span>
              </div>
              <div className="relative w-full h-2 bg-[#111] border border-[#333]">
                <div 
                  className="h-full bg-[#1d4ed8] transition-all duration-1000" 
                  style={{ width: `${xpPercentage}%` }}
                />
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Нижний градиент для кнопок навигации */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black via-transparent to-transparent" />
    </div>
  );
};

export default CharacterPage;