import React from 'react';

// Принимаем videos из пропсов для мгновенной загрузки
const LeaderboardPage = ({ 
  character = { name: "Sir Pixelot", hp: 85, lvl: 14, xp: 1200, maxXp: 2000, gold: 450 },
  videos 
}) => {
  const leaders = [
    { name: "Sir Galahad", lvl: 42, xp: 9999, class: "Paladin" },
    { name: "Shadow_Mage", lvl: 38, xp: 8500, class: "Warlock" },
    { name: "Sir Pixelot", lvl: 14, xp: 1240, class: "Knight", isMe: true },
    { name: "Noob_Master", lvl: 2, xp: 150, class: "Squire" },
  ];

  return (
    <div className="fixed inset-0 w-full h-full bg-black overflow-hidden flex flex-col font-mono">
      
      {/* --- ВЕРХНЯЯ ПАНЕЛЬ --- */}
      <div className="relative z-20 w-full bg-[#111111] border-b-4 border-[#2a1a10] shadow-[0_4px_10px_rgba(0,0,0,0.9)] px-5 py-4">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#222] border-2 border-[#daa520] flex items-center justify-center shadow-[2px_2px_0_#000]">
              <span className="text-[#daa520] text-xs font-bold">R</span>
            </div>
            <div>
              <h1 className="text-[#daa520] text-[16px] font-bold uppercase tracking-tighter leading-none">{character.name}</h1>
              <p className="text-white/30 text-[8px] uppercase tracking-widest mt-1">Global Rankings</p>
            </div>
          </div>
          <div className="bg-black/60 px-3 py-1 border border-[#daa520]/20 flex items-center gap-2">
            <span className="text-[#f7d51d] text-xs font-bold">{character.gold}</span>
            <div className="w-2 h-2 bg-[#f7d51d] rounded-full shadow-[0_0_5px_#f7d51d]"></div>
          </div>
        </div>

        <div className="grid grid-cols-[1fr_50px] gap-4 items-center px-1">
           <div className="relative w-full h-2 bg-[#1a1a1a] border border-white/10 overflow-hidden">
              <div 
                className="h-full bg-[#0070dd] shadow-[0_0_8px_#0070dd]" 
                style={{ width: `${(character.xp / character.maxXp) * 100}%` }} 
              />
            </div>
            <div className="text-right text-[7px] text-white/40 uppercase tracking-tighter">Ranked #242</div>
        </div>
      </div>

      {/* --- ОБЛАСТЬ ТАБЛИЦЫ --- */}
      <div className="flex-1 relative overflow-hidden">
        {/* ФОНОВОЕ ВИДЕО (Через Blob) */}
        <div className="absolute inset-0 bg-black">
          <video
            src={videos?.leader || ""}
            autoPlay loop muted playsInline
            className="w-full h-full object-cover opacity-30"
            style={{ 
              imageRendering: 'pixelated',
              willChange: 'transform' 
            }}
          />
        </div>
        
        {/* ТАБЛИЦА ЛИДЕРОВ */}
        {/* УБРАЛИ backdrop-blur-md, заменили на плотный bg-black/85 */}
        <div className="absolute inset-0 z-10 overflow-y-auto p-5 bg-gradient-to-b from-black/90 via-transparent to-black">
          <div className="border border-white/10 bg-black/85 overflow-hidden shadow-2xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#111] border-b border-[#daa520]/30">
                  <th className="p-3 text-[9px] text-[#daa520] uppercase font-black tracking-widest">#</th>
                  <th className="p-3 text-[9px] text-[#daa520] uppercase font-black tracking-widest">Hero</th>
                  <th className="p-3 text-[9px] text-[#daa520] uppercase font-black tracking-widest text-right">Lvl</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {leaders.map((user, i) => {
                  const isTop3 = i < 3;
                  const isMe = user.isMe;

                  return (
                    <tr 
                      key={i} 
                      className={`${isMe ? 'bg-[#32CD32]/5' : ''} transition-colors duration-300`}
                    >
                      <td className="p-3">
                        <span className={`text-[10px] font-bold ${isTop3 ? 'text-[#f7d51d]' : 'text-white/20'}`}>
                          {i + 1}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex flex-col">
                          <span className={`text-[11px] uppercase font-black tracking-tight ${isMe ? 'text-[#32CD32]' : 'text-gray-300'}`}>
                            {user.name} {isMe && <span className="text-[8px] opacity-70">(YOU)</span>}
                          </span>
                          <span className="text-[7px] text-white/20 uppercase tracking-[0.2em]">{user.class}</span>
                        </div>
                      </td>
                      <td className="p-3 text-right">
                        <span className={`text-[11px] font-bold ${isMe ? 'text-[#32CD32]' : 'text-white'}`}>
                          {user.lvl}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <p className="mt-6 text-center text-[7px] text-white/20 uppercase tracking-[0.4em] animate-pulse">
            Syncing with the Great Archive...
          </p>
        </div>
      </div>

    </div>
  );
};

export default LeaderboardPage;