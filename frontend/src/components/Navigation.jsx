import { NavLink } from 'react-router-dom';
import invIcon    from '../assets/icons/bag_icon.png';
import shopIcon   from '../assets/icons/shop_icon.png';
import campIcon   from '../assets/icons/firecamp_icon.png';
import questsIcon from '../assets/icons/quests_icon.png';
import leaderIcon from '../assets/icons/leaderboard_icon.png';

const tabs = [
  { to: '/app/inventory',   label: 'СУМКА',   icon: invIcon },
  { to: '/app/shop',        label: 'ЛАВКА',   icon: shopIcon },
  { to: '/app/character',   label: 'ЛАГЕРЬ',  icon: campIcon },
  { to: '/app/quests',      label: 'ЗАДАНИЯ', icon: questsIcon },
  { to: '/app/leaderboard', label: 'ЛИДЕРЫ',  icon: leaderIcon },
  { to: '/app/friends',     label: 'ДРУЗЬЯ',  icon: leaderIcon },
];

const Navigation = () => {
  return (
    <div
      className="fixed bottom-0 left-0 z-50 flex flex-col items-center justify-end w-full"
      style={{
        paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))',
        pointerEvents: 'none',
      }}
    >
      {/* Background blur gradient */}
      <div
        className="absolute bottom-0 left-0 w-full h-[160px] pointer-events-none z-0"
        style={{
          background: `linear-gradient(to top,
            rgba(0,0,0,1) 0%,
            rgba(0,0,0,0.9) 40%,
            rgba(0,0,0,0.5) 70%,
            transparent 100%
          )`,
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            backdropFilter: 'blur(12px)',
            WebkitMaskImage: 'linear-gradient(to top, black 0%, black 50%, transparent 100%)',
            maskImage: 'linear-gradient(to top, black 0%, black 50%, transparent 100%)',
          }}
        />
      </div>

      {/* Tab buttons */}
      <div className="relative z-20 w-[98%] max-w-2xl flex items-end justify-between px-1 pointer-events-auto">
        {tabs.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            className="relative flex-1 flex flex-col items-center justify-center transition-all duration-200 active:scale-90 outline-none group"
            style={{ WebkitTapHighlightColor: 'transparent', textDecoration: 'none' }}
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <div className="absolute w-16 h-16 bg-yellow-500/20 blur-3xl rounded-full z-0 animate-pulse" />
                )}
                <div className={`relative flex items-center justify-center transition-all duration-300 ${
                  isActive ? 'scale-125 -translate-y-2' : 'scale-100 hover:scale-105'
                }`}>
                  <img
                    src={icon}
                    alt={label}
                    className={`w-12 h-12 md:w-16 md:h-16 transition-all ${
                      isActive ? 'brightness-125 saturate-150' : 'brightness-50 opacity-50'
                    }`}
                    style={{
                      imageRendering: 'pixelated',
                      filter: isActive ? 'drop-shadow(0 0 12px rgba(250, 204, 21, 0.7))' : 'none',
                    }}
                  />
                </div>
                <span className={`mt-2 text-[9px] md:text-[11px] font-[1000] tracking-[0.1em] transition-colors ${
                  isActive ? 'text-yellow-400' : 'text-white/20'
                }`}>
                  {label}
                </span>
                <div className={`mt-1.5 h-1 rounded-full transition-all duration-500 ${
                  isActive ? 'w-6 bg-yellow-400 shadow-[0_0_12px_#facc15]' : 'w-0 bg-transparent'
                }`} />
              </>
            )}
          </NavLink>
        ))}
      </div>
    </div>
  );
};

export default Navigation;
