import React from 'react';
// Импортируем иконки
import invIcon from '../assets/icons/bag_icon.png';
import shopIcon from '../assets/icons/shop_icon.png';
import campIcon from '../assets/icons/firecamp_icon.png';
import questsIcon from '../assets/icons/quests_icon.png';
import leaderIcon from '../assets/icons/leaderboard_icon.png';

const Navigation = ({ 
  activeTab, 
  setActiveTab, 
  width = "100%",   
  height = "550px" 
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
      className="fixed bottom-0 left-0 z-50 flex items-end justify-center pb-4"
      style={{ width: width, height: height }}
    >
      {/* МЯГКОЕ ЗАДНЕЕ ЗАТЕМНЕНИЕ (Уходит в самый низ) */}
      <div 
        className="absolute -bottom-4 left-0 w-full h-[120px] pointer-events-none z-0"
        style={{
          // Увеличиваем плотность черного в самом низу (0%), чтобы он сливался с краем
          background: `linear-gradient(to top, 
            rgba(0,0,0,1) 0%, 
            rgba(0,0,0,0.8) 20%, 
            rgba(0,0,0,0.4) 50%, 
            transparent 100%
          )`,
        }}
      >
        <div 
          className="absolute inset-0"
          style={{
            backdropFilter: 'blur(8px)',
            // Маска теперь более плавная, чтобы верхняя граница блюра вообще не читалась
            WebkitMaskImage: 'linear-gradient(to top, black 0%, black 30%, transparent 90%)',
            maskImage: 'linear-gradient(to top, black 0%, black 30%, transparent 90%)',
          }}
        />
      </div>

      <div className="relative z-20 w-full flex items-center justify-between px-2 max-w-lg">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="relative flex-1 flex flex-col items-center justify-center transition-all duration-200 active:scale-90"
            >
              {/* СВЕЧЕНИЕ АКТИВНОГО ЭЛЕМЕНТА */}
              {isActive && (
                <div className="absolute w-12 h-12 bg-white/10 blur-xl rounded-full z-0" />
              )}

              {/* КОНТЕЙНЕР ДЛЯ ИКОНКИ (Теперь все одинаковые) */}
              <div className={`relative flex items-center justify-center transition-transform duration-300 ${isActive ? 'scale-125' : 'scale-100'}`}>
                <img 
                  src={tab.icon} 
                  alt={tab.label}
                  className={`w-11 h-11 transition-all ${
                    isActive ? 'brightness-125 saturate-125' : 'brightness-75 opacity-70 grayscale-[20%]'
                  }`}
                  style={{ 
                    imageRendering: 'pixelated',
                    filter: isActive ? 'drop-shadow(0 0 10px #facc15)' : 'none'
                  }}
                />
              </div>

              {/* ТЕКСТ ПОДПИСИ */}
              <span className={`mt-1 text-[9px] font-black tracking-widest transition-colors ${
                isActive 
                  ? 'text-yellow-400' 
                  : 'text-white/40'
              }`}>
                {tab.label}
              </span>

              {/* ТОЧКА ПОД АКТИВНОЙ КНОПКОЙ */}
              <div className={`mt-1 w-1 h-1 rounded-full transition-all duration-300 ${
                isActive ? 'bg-yellow-400 shadow-[0_0_5px_#facc15]' : 'bg-transparent'
              }`} />
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Navigation;