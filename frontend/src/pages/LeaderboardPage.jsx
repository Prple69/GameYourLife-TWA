import React from 'react';
import Header from '../components/Header';

const LeaderboardPage = ({ 
  character = { name: "Sir Pixelot", hp: 85, lvl: 14, xp: 1200, max_xp: 2000, gold: 450 },
  videos 
}) => {
  const leaders = [
    { name: "Sir Galahad", lvl: 42, xp: 9999, class: "Паладин" },
    { name: "Shadow_Mage", lvl: 38, xp: 8500, class: "Чернокнижник" },
    { name: "Sir Pixelot", lvl: 14, xp: 1240, class: "Рыцарь", isMe: true },
    { name: "Noob_Master", lvl: 2, xp: 150, class: "Оруженосец" },
  ];

  return (
    <div className="fixed inset-0 w-full h-full bg-black overflow-hidden flex flex-col font-mono">
      
      {/* --- ФОНОВОЕ ВИДЕО --- */}
      <div className="absolute inset-0 z-0 bg-black">
        <video
          src={videos?.leader || ""}
          autoPlay loop muted playsInline
          className="w-full h-full object-cover opacity-40"
          style={{ imageRendering: 'pixelated' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-transparent to-black" />
      </div>

      {/* --- КОНТЕНТ --- */}
      <div className="relative z-10 flex flex-col h-full p-5">
        
        {/* Хедер (используем твой ввод отступа, например 64px) */}
        <Header 
          title="Зал Славы" 
          subtitle="Величайшие герои" 
          pt={64} 
        />

        {/* Твоя позиция в рейтинге (вместо старой серой панели) */}
        <div className="mt-2 flex items-center justify-between px-2 py-3 border-y border-white/5 bg-white/5 backdrop-blur-sm mb-6">
          <div className="flex flex-col">
            <span className="text-[7px] text-white/30 uppercase tracking-[0.2em]">Твоё имя</span>
            <span className="text-[#32CD32] text-xs font-black uppercase tracking-tight">
              {character.name}
            </span>
          </div>
          <div className="text-right flex flex-col">
            <span className="text-[7px] text-white/30 uppercase tracking-[0.2em]">Ранг</span>
            <span className="text-white text-xs font-black italic">#242</span>
          </div>
        </div>

        {/* --- ТАБЛИЦА ЛИДЕРОВ --- */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="border border-white/10 bg-black/60 shadow-2xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-black/80 border-b border-[#daa520]/20">
                  <th className="p-3 text-[9px] text-[#daa520] uppercase font-black tracking-widest text-center w-10">#</th>
                  <th className="p-3 text-[9px] text-[#daa520] uppercase font-black tracking-widest">Герой</th>
                  <th className="p-3 text-[9px] text-[#daa520] uppercase font-black tracking-widest text-right">Ур</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {leaders.map((user, i) => {
                  const isTop3 = i < 3;
                  const isMe = user.isMe;

                  return (
                    <tr 
                      key={i} 
                      className={`${isMe ? 'bg-[#daa520]/10' : ''} transition-colors`}
                    >
                      <td className="p-3 text-center">
                        <span className={`text-[10px] font-bold ${isTop3 ? 'text-[#f7d51d]' : 'text-white/20'}`}>
                          {i + 1}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex flex-col">
                          <span className={`text-[11px] uppercase font-black tracking-tight ${isMe ? 'text-[#daa520]' : 'text-gray-300'}`}>
                            {user.name}
                          </span>
                          <span className="text-[7px] text-white/20 uppercase tracking-widest">{user.class}</span>
                        </div>
                      </td>
                      <td className="p-3 text-right">
                        <span className={`text-[11px] font-bold ${isMe ? 'text-[#daa520]' : 'text-white/60'}`}>
                          {user.lvl}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <p className="mt-6 text-center text-[7px] text-white/10 uppercase tracking-[0.4em]">
            Синхронизация с великим архивом...
          </p>
        </div>
      </div>

      {/* Нижняя тень */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
    </div>
  );
};

export default LeaderboardPage;