import React from 'react';

const Background = ({ type }) => {
  // Настройки атмосферы для каждой локации
  const themes = {
    hero: {
      bg: "from-[#2e1065] via-[#1a0b2e] to-[#0d0514]",
      particle: "bg-[#ffae00]", // Оранжевые искры костра
      glow: "rgba(255, 174, 0, 0.15)"
    },
    quests: {
      bg: "from-[#1e1b4b] via-[#0f172a] to-[#020617]",
      particle: "bg-[#a855f7]", // Фиолетовый туман/магия
      glow: "rgba(168, 85, 247, 0.1)"
    },
    leaderboard: {
      bg: "from-[#450a0a] via-[#1a0505] to-[#000000]",
      particle: "bg-[#ffffff]", // Белые искры стали
      glow: "rgba(239, 68, 68, 0.1)"
    }
  };

  const theme = themes[type] || themes.hero;

  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
      {/* 1. Основной слой градиента */}
      <div 
        className={`absolute inset-0 bg-gradient-to-b ${theme.bg} transition-colors duration-1000 ease-in-out`} 
      />

      {/* 2. Слой пиксельной текстуры (накладывается поверх) */}
      <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/pixel-weave.png')]" />

      {/* 3. Система частиц */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(12)].map((_, i) => (
          <div
            key={`${type}-${i}`}
            className={`absolute rounded-full animate-particle ${theme.particle}`}
            style={{
              width: Math.random() * 4 + 2 + 'px',
              height: Math.random() * 4 + 2 + 'px',
              left: Math.random() * 100 + '%',
              bottom: '-20px',
              animationDelay: Math.random() * 5 + 's',
              animationDuration: Math.random() * 3 + 4 + 's',
              boxShadow: `0 0 8px ${theme.glow}`
            }}
          />
        ))}
      </div>

      {/* 4. Мягкое виньетирование (затемнение краев) */}
      <div className="absolute inset-0 shadow-[inset_0_0_120px_rgba(0,0,0,0.8)]" />

      {/* Стили анимации */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes particle-up {
          0% {
            transform: translateY(0) scale(1);
            opacity: 0;
          }
          20% {
            opacity: 0.8;
          }
          100% {
            transform: translateY(-110vh) translateX(${Math.random() * 40 - 20}px);
            opacity: 0;
          }
        }
        .animate-particle {
          animation: particle-up linear infinite;
        }
      `}} />
    </div>
  );
};

export default Background;