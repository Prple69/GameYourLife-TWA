import React from 'react';
import invIcon from '../assets/icons/bag_icon.png';
import shopIcon from '../assets/icons/shop_icon.png';
import campIcon from '../assets/icons/firecamp_icon.png';
import questsIcon from '../assets/icons/quests_icon.png';
import leaderIcon from '../assets/icons/leaderboard_icon.png';

const Navigation = ({ 
  activeTab, 
  setActiveTab, 
  width = "100%",   
}) => {
  
  const tabs = [
    { id: 'inventory', label: 'СУМКА', icon: invIcon },
    { id: 'shop', label: 'ЛАВКА', icon: shopIcon },
    { id: 'camp', label: 'ЛАГЕРЬ', icon: campIcon }, 
    { id: 'quests', label: 'ЗАДАНИЯ', icon: questsIcon },
    { id: 'leaderboard', label: 'ЛИДЕРЫ', icon: leaderIcon },
  ];

  return (
    <div 
      className="fixed bottom-0 left-0 z-50 flex flex-col items-center justify-end w-full"
      style={{ 
        // Добавляем безопасную зону снизу для iOS/Android
        paddingBottom: 'calc(10px + env(safe-area-inset-bottom, 0px))',
        pointerEvents: 'none' // Чтобы само пространство вокруг кнопок не блокировало клики
      }}
    >
      {/* МЯГКОЕ ЗАДНЕЕ ЗАТЕМНЕНИЕ */}
      <div 
        className="absolute bottom-0 left-0 w-full h-[140px] pointer-events-none z-0"
        style={{
          background: `linear-gradient(to top, 
            rgba(0,0,0,1) 0%, 
            rgba(0,0,0,0.9) 30%, 
            rgba(0,0,0,0.4) 60%, 
            transparent 100%
          )`,
        }}
      >
        <div 
          className="absolute inset-0"
          style={{
            backdropFilter: 'blur(10px)',
            WebkitMaskImage: 'linear-gradient(to top, black 0%, black 40%, transparent 100%)',
            maskImage: 'linear-gradient(to top, black 0%, black 40%, transparent 100%)',
          }}
        />
      </div>

      {/* КОНТЕЙНЕР КНОПОК */}
      {/* Ограничиваем ширину max-w-2xl как и у контента квестов */}
      <div className="relative z-20 w-[96%] max-w-2xl flex items-center justify-between px-2 pointer-events-auto">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="relative flex-1 flex flex-col items-center justify-center transition-all duration-200 active:scale-90 outline-none"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              {/* СВЕЧЕНИЕ АКТИВНОГО ЭЛЕМЕНТА */}
              {isActive && (
                <div className="absolute w-14 h-14 bg-yellow-500/10 blur-2xl rounded-full z-0" />
              )}

              {/* КОНТЕЙНЕР ДЛЯ ИКОНКИ */}
              <div className={`relative flex items-center justify-center transition-all duration-300 ${isActive ? 'scale-110 -translate-y-1' : 'scale-100'}`}>
                <img 
                  src={tab.icon} 
                  alt={tab.label}
                  className={`w-10 h-10 md:w-12 md:h-12 transition-all ${
                    isActive ? 'brightness-125 saturate-125' : 'brightness-75 opacity-60'
                  }`}
                  style={{ 
                    imageRendering: 'pixelated',
                    filter: isActive ? 'drop-shadow(0 0 8px rgba(250, 204, 21, 0.6))' : 'none'
                  }}
                />
              </div>

              {/* ТЕКСТ ПОДПИСИ */}
              <span className={`mt-1.5 text-[8px] md:text-[10px] font-black tracking-[0.15em] transition-colors ${
                isActive 
                  ? 'text-yellow-400' 
                  : 'text-white/30'
              }`}>
                {tab.label}
              </span>

              {/* ИНДИКАТОР */}
              <div className={`mt-1 h-0.5 rounded-full transition-all duration-300 ${
                isActive ? 'w-4 bg-yellow-400 shadow-[0_0_8px_#facc15]' : 'w-0 bg-transparent'
              }`} />
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Navigation;