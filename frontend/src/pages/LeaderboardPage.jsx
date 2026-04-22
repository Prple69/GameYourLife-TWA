import { useState, useEffect, useCallback } from 'react';
import Header from '../components/Header';
import { leaderboardService } from '../services/api';

const LeaderboardPage = ({
  character = { name: "Sir Pixelot", hp: 85, lvl: 14, gold: 450 },
  videos
}) => {
  const [entries, setEntries] = useState([]);
  const [userRank, setUserRank] = useState(null);
  const [totalUsers, setTotalUsers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const glassStyle = {
    WebkitBackdropFilter: 'blur(5px)',
    backdropFilter: 'blur(5px)',
    transform: 'translateZ(0)',
  };

  const fetchData = useCallback(async () => {
    try {
      const [topData, meData] = await Promise.all([
        leaderboardService.getTop(0, 100),
        leaderboardService.getMe(),
      ]);
      setEntries(topData.entries);
      setTotalUsers(topData.total);
      setUserRank(meData.rank);
    } catch {
      setError('Ошибка загрузки лидерборда');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="min-h-screen w-full bg-black flex flex-col font-mono items-center relative overflow-hidden">

      {/* --- ФОН --- */}
      <div className="absolute inset-0 z-0">
        {videos?.leader && (
          <video
            src={videos.leader}
            autoPlay loop muted playsInline
            className="w-full h-full object-cover opacity-100"
            style={{ imageRendering: 'pixelated' }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black" />
      </div>

      {/* --- ОСНОВНОЙ КОНТЕНТ --- */}
      <div className="relative z-10 flex flex-col items-center w-[92%] h-full">

        <div className="w-full shrink-0">
          <Header title="Зал Славы" subtitle={`Топ ${totalUsers} героев`} />
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
                {character?.name || 'Герой'}
              </span>
              <span className="text-[2.5vw] sm:text-[10px] text-[#A1A1AA] uppercase tracking-[0.1em] mt-1 font-bold">
                Твой текущий ранг
              </span>
           </div>
           <div className="w-[15%] text-right">
              <span className="text-[5vw] sm:text-lg font-black text-[#F5F5F0]">
                {userRank ? `#${userRank}` : '—'}
              </span>
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
            <div className="w-[12%] text-[10px] text-[#daa520] font-black uppercase text-right">Ур</div>
            <div className="w-[12%] text-[10px] text-[#daa520] font-black uppercase text-right">XP</div>
          </div>

          {/* ТЕЛО ТАБЛИЦЫ */}
          <div
            style={glassStyle}
            className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar bg-black/40 border-x border-b border-white/10 shadow-2xl"
          >
            <div className="bg-black/5 min-h-full">
              {loading && (
                <div className="flex items-center justify-center h-32 text-[#A1A1AA] text-sm">
                  Загрузка...
                </div>
              )}

              {!loading && error && (
                <div className="flex flex-col items-center justify-center h-32 gap-3">
                  <span className="text-red-400 text-sm">{error}</span>
                  <button
                    onClick={() => { setError(null); setLoading(true); fetchData(); }}
                    className="text-[#daa520] text-sm border border-[#daa520]/40 px-3 py-1"
                  >
                    Повторить
                  </button>
                </div>
              )}

              {!loading && !error && entries.map((entry) => {
                const isTop3 = entry.rank <= 3;
                const isMe = entry.rank === userRank;

                return (
                  <div
                    key={entry.user_id}
                    className={`flex items-center h-[60px] px-4 border-b border-white/5 ${isMe ? 'bg-[#daa520]/20' : ''}`}
                  >
                    <div className="w-[10%]">
                      <span className={`text-[16px] font-black ${isTop3 ? 'text-[#daa520]' : 'text-[#A1A1AA]/50'}`}>
                        {entry.rank}
                      </span>
                    </div>
                    <div className="flex-1 ml-1">
                      <span className={`text-[15px] uppercase font-black tracking-tight ${isMe ? 'text-[#daa520]' : 'text-[#F5F5F0]'}`}>
                        {entry.display_name}
                      </span>
                    </div>
                    <div className="w-[12%] text-right">
                      <span className={`text-[16px] font-black ${isMe ? 'text-[#daa520]' : 'text-[#F5F5F0]/80'}`}>
                        {entry.lvl}
                      </span>
                    </div>
                    <div className="w-[12%] text-right">
                      <span className="text-[14px] text-[#A1A1AA]/60">{entry.xp}</span>
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
