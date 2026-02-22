import React from 'react';
import Header from '../components/Header';

const LeaderboardPage = ({ 
  character = { name: "Sir Pixelot", hp: 85, lvl: 14, gold: 450, rank: 242 },
  videos 
}) => {
  const leaders = Array.from({ length: 100 }, (_, i) => ({
    name: i === 5 ? "Sir Pixelot" : `Hero_${i + 1}`,
    lvl: 50 - i,
    class: i % 2 === 0 ? "Рыцарь" : "Маг",
    isMe: i === 5
  }));

  return (
    <div className="fixed inset-0 w-full h-full bg-black overflow-hidden flex flex-col font-mono">
      
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

      <div className="relative z-10 flex flex-col items-center h-full p-5">
        
        <Header title="Зал Славы" subtitle="Топ 100 героев" pt={64} />

        {/* --- ПАНЕЛЬ ТВОЕГО РАНГА --- */}
        <div className="w-full max-w-md mt-4 mb-3 h-[65px] flex items-center px-4 bg-black/60 border border-[#F5F5F0]/20 backdrop-blur-[6px]">
           <div className="w-12">
              <span className="text-[12px] text-[#daa520] font-black uppercase leading-none">Ты</span>
           </div>
           <div className="flex-1 flex flex-col">
              <span className="text-[16px] text-[#F5F5F0] font-black uppercase tracking-tight leading-none">
                {character.name}
              </span>
              <span className="text-[10px] text-[#A1A1AA] uppercase tracking-[0.1em] mt-1 font-bold">
                Твой текущий ранг
              </span>
           </div>
           <div className="w-14 text-right">
              <span className="text-lg font-black text-[#F5F5F0]">#{character.rank || 242}</span>
           </div>
        </div>

        {/* --- КОНТЕЙНЕР ТАБЛИЦЫ --- */}
        <div className="w-full max-w-md h-[490px] flex flex-col">
          
          {/* ШАПКА ТАБЛИЦЫ (Стиль как у панели ранга) */}
          <div className="flex h-[45px] items-center bg-black/60 border border-[#F5F5F0]/20 border-b-[#daa520]/40 shrink-0 px-4 backdrop-blur-[6px]">
            <div className="w-10 text-[11px] text-[#daa520] font-black uppercase">#</div>
            <div className="flex-1 text-[11px] text-[#daa520] font-black uppercase tracking-widest text-center">Герой</div>
            <div className="w-14 text-[11px] text-[#daa520] font-black uppercase text-right">Ур</div>
          </div>

          {/* ТЕЛО ТАБЛИЦЫ (Твоя исходная прозрачность) */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar bg-black/40 border-x border-b border-white/10 backdrop-blur-[6px]">
            <div className="bg-black/10">
              {leaders.map((user, i) => {
                const isTop3 = i < 3;
                const showGold = user.isMe && (character.rank <= 100);

                return (
                  <div 
                    key={i} 
                    className={`flex items-center h-[65px] px-4 border-b border-white/5 transition-colors ${showGold ? 'bg-[#daa520]/25' : ''}`}
                  >
                    <div className="w-10">
                      <span className={`text-[16px] font-black ${isTop3 ? 'text-[#daa520]' : 'text-[#A1A1AA]'}`}>
                        {i + 1}
                      </span>
                    </div>
                    
                    <div className="flex-1 flex flex-col ml-1">
                      <span className={`text-[15px] uppercase font-black tracking-tight leading-none ${showGold ? 'text-[#daa520]' : 'text-[#F5F5F0]'}`}>
                        {user.name}
                      </span>
                      <span className="text-[10px] text-[#A1A1AA] uppercase tracking-widest mt-1 font-bold">
                        {user.class}
                      </span>
                    </div>

                    <div className="w-14 text-right">
                      <span className={`text-[16px] font-black ${showGold ? 'text-[#daa520]' : 'text-[#F5F5F0]/80'}`}>
                        {user.lvl}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default LeaderboardPage;