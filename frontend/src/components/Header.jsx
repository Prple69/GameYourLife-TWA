import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { userService } from '../services/api';

const BOOST_TYPES = [
  { key: 'xp', label: '⚡ XP', expAttr: 'active_xp_expires_at', multAttr: 'active_xp_mult' },
  { key: 'gold', label: '🪙 Gold', expAttr: 'active_gold_expires_at', multAttr: 'active_gold_mult' },
  { key: 'strength_xp', label: '💪', expAttr: 'active_strength_xp_expires_at', multAttr: 'active_strength_xp_mult' },
  { key: 'wisdom_xp', label: '📚', expAttr: 'active_wisdom_xp_expires_at', multAttr: 'active_wisdom_xp_mult' },
  { key: 'endurance_xp', label: '🏃', expAttr: 'active_endurance_xp_expires_at', multAttr: 'active_endurance_xp_mult' },
  { key: 'charisma_xp', label: '✨', expAttr: 'active_charisma_xp_expires_at', multAttr: 'active_charisma_xp_mult' },
  { key: 'hp_max', label: '🛡️ HP+', expAttr: 'active_hp_max_expires_at', multAttr: null },
];

const Header = ({ title, subtitle, gold }) => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: userService.getProfile,
    staleTime: 1000 * 60,
    refetchInterval: 60000,
  });

  const activeBoosts = BOOST_TYPES
    .filter(b => user?.[b.expAttr] && new Date(user[b.expAttr]) > now)
    .map(b => {
      const seconds = Math.max(0, (new Date(user[b.expAttr]) - now) / 1000);
      const mm = Math.floor(seconds / 60);
      const ss = Math.floor(seconds % 60);
      return { ...b, timer: `${mm}:${ss.toString().padStart(2, '0')}`, expiresAt: user[b.expAttr] };
    })
    .sort((a, b) => new Date(a.expiresAt) - new Date(b.expiresAt));

  return (
    <header
      className="w-full shrink-0 z-50"
      style={{
        paddingTop: 'max(16px, calc(env(safe-area-inset-top, 0px) + 4px))',
        paddingBottom: '1vh',
        transform: 'translateZ(0)',
      }}
    >
      <div className="flex items-center justify-between px-4 h-14 sm:h-16 relative">

        {/* LEFT */}
        <div className="w-16 shrink-0" />

        {/* CENTER */}
        <div className="absolute left-1/2 -translate-x-1/2 text-center w-[60%] pointer-events-none flex flex-col items-center">
          <h2 className="text-[#daa520] text-[5.2vw] sm:text-2xl font-black uppercase tracking-tighter drop-shadow-[0_2px_2px_rgba(0,0,0,1)] leading-none truncate w-full">
            {title}
          </h2>
          {subtitle && (
            <p className="text-white/60 text-[2.8vw] sm:text-[12px] uppercase tracking-[0.15em] mt-1 leading-none opacity-80 truncate w-full">
              {subtitle}
            </p>
          )}
        </div>

        {/* RIGHT — gems + gold */}
        <div className="w-16 flex justify-end shrink-0 z-20 gap-1">
          {/* Gems badge */}
          {user?.gems != null && (
            <div className="relative flex items-center gap-1 bg-[#111]/80 backdrop-blur-md px-2 py-1 border border-[#9966ff]/40 shadow-[2px_2px_0_#000]">
              <span className="text-[#9966ff] font-bold text-[3.2vw] sm:text-sm tracking-tighter leading-none">
                {user.gems}
              </span>
              <span className="text-[3vw] sm:text-sm leading-none">💎</span>
            </div>
          )}
          {/* Gold badge (unchanged) */}
          {gold !== undefined && gold !== null && (
            <div className="relative flex items-center gap-1.5 bg-[#111]/80 backdrop-blur-md px-2 py-1 border border-[#f7d51d]/40 shadow-[2px_2px_0_#000]">
              <span className="text-[#f7d51d] font-bold text-[3.2vw] sm:text-sm tracking-tighter leading-none">
                {gold}
              </span>
              <div className="w-2 h-2 bg-[#f7d51d] shadow-[0_0_8px_#f7d51d] animate-pulse rotate-45 shrink-0" />
            </div>
          )}
        </div>
      </div>

      {/* ACTIVE BOOST TIMERS */}
      {activeBoosts.length > 0 && (
        <div className="flex items-center gap-2 px-4 mt-1 flex-wrap">
          {activeBoosts.map(boost => (
            <span
              key={boost.key}
              className="font-mono text-xs border border-[#daa520] px-2 py-0.5 text-[#daa520]"
            >
              {boost.label} <span className="text-white">{boost.timer}</span>
            </span>
          ))}
        </div>
      )}
    </header>
  );
};

export default Header;
