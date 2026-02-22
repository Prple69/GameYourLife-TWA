import React from 'react';
import Header from '../components/Header';

const LeaderboardPage = ({ 
  character = { name: "Sir Pixelot", hp: 85, lvl: 14, gold: 450, rank: 242 },
  videos 
}) => {
  const leaders = Array.from({ length: 100 }, (_, i) => ({
    name: i === 5 ? "Sir Pixelot" : `Hero_${i + 1}`,
    lvl: 101 - i,
    class: i % 2 === 0 ? "Рыцарь" : "Маг",
    isMe: i === 5
  }));

  const glassStyle = {
    WebkitBackdropFilter: 'blur(10px)',
    backdropFilter: 'blur(10px)',
    transform: 'translateZ(0)', 
  };

  return (
    <div className="fixed inset-0 w-full h-full bg-black overflow-hidden flex flex-col font-mono items-center">
      
      {/* --- ФОН --- */}
      <div className="absolute inset-0 z-0">
        <video
          src={videos?.leader || ""}
          autoPlay loop muted playsInline
          className="w-full h-full object-cover opacity-100"
          style={{ imageRendering: 'pixelated' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black" />
      </div>

      {/* --- ОСНОВНОЙ КОНТЕНТ --- */}
      <div className="relative z-10 flex flex-col items-center w-[92%] h-full">
        
        <div className="w-full shrink-0">
          <Header title="Зал Славы" subtitle="Топ 100 героев" />
        </div>

        {/* ПАНЕЛЬ РАНГА */}
        <div 
          style={glassStyle}
          className="w-full max-w-md mb-4 min-h-[60px] flex items-center px-4 bg-black/60 border border-[#F5F5F0]/20 shrink-0 shadow-lg"
        >
           <div className="w-[12%]">
              <span className="text-[12px] text-[#daa520] font-black uppercase leading-none">Ты</span>
           </div>
           <div className="flex-1 flex flex-col py-2">
              <span className="text-[4vw] sm:text-[16px] text-[#F5F5F0] font-black uppercase tracking-tight leading-none">
                {character.name}
              </span>
              <span className="text-[2.5vw] sm:text-[10px] text-[#A1A1AA] uppercase tracking-[0.1em] mt-1 font-bold">
                Твой текущий ранг
              </span>
           </div>
           <div className="w-[15%] text-right">
              <span className="text-[5vw] sm:text-lg font-black text-[#F5F5F0]">#{character.rank || 242}</span>
           </div>
        </div>

        {/* --- КОНТЕЙНЕР ТАБЛИЦЫ --- */}
        {/* mb: Суммируем базовый отступ 160px и безопасную зону снизу для iPhone/Android */}
        <div 
          className="w-full max-w-md flex-1 flex flex-col overflow-hidden relative"
          style={{ 
            marginBottom: 'calc(130px + env(safe-area-inset-bottom, 0px))' 
          }}
        >
          
          {/* ШАПКА ТАБЛИЦЫ */}
          <div 
            style={glassStyle}
            className="flex h-[40px] sm:h-[45px] items-center bg-black/80 border border-[#F5F5F0]/20 border-b-[#daa520]/40 shrink-0 px-4 z-20"
          >
            <div className="w-[10%] text-[10px] text-[#daa520] font-black uppercase">#</div>
            <div className="flex-1 text-[10px] text-[#daa520] font-black uppercase tracking-widest text-center">Герой</div>
            <div className="w-[15%] text-[10px] text-[#daa520] font-black uppercase text-right">Ур</div>
          </div>

          {/* ТЕЛО ТАБЛИЦЫ */}
          <div 
            style={glassStyle}
            className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar bg-black/40 border-x border-b border-white/10 shadow-2xl"
          >
            <div className="bg-black/5 min-h-full">
              {leaders.map((user, i) => {
                const isTop3 = i < 3;
                const showGold = user.isMe && (character.rank <= 100);

                return (
                  <div 
                    key={i} 
                    className={`flex items-center h-[60px] sm:h-[65px] px-4 border-b border-white/5 transition-colors ${showGold ? 'bg-[#daa520]/20' : ''}`}
                  >
                    <div className="w-[10%]">
                      <span className={`text-[4vw] sm:text-[16px] font-black ${isTop3 ? 'text-[#daa520]' : 'text-[#A1A1AA]/50'}`}>
                        {i + 1}
                      </span>
                    </div>
                    
                    <div className="flex-1 flex flex-col ml-1">
                      <span className={`text-[3.8vw] sm:text-[15px] uppercase font-black tracking-tight leading-none ${showGold ? 'text-[#daa520]' : 'text-[#F5F5F0]'}`}>
                        {user.name}
                      </span>
                      <span className="text-[2.5vw] sm:text-[10px] text-[#A1A1AA] uppercase tracking-widest mt-1 font-bold">
                        {user.class}
                      </span>
                    </div>

                    <div className="w-[15%] text-right">
                      <span className={`text-[4vw] sm:text-[16px] font-black ${showGold ? 'text-[#daa520]' : 'text-[#F5F5F0]/80'}`}>
                        {user.lvl}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Визуальный акцент: мягкое свечение под таблицей */}
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-[80%] h-6 bg-[#daa520]/10 blur-xl pointer-events-none" />
        </div>
      </div>
    </div>
  );
};

export default LeaderboardPage;