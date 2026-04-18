import { NavLink } from 'react-router-dom';
import invIcon       from '../../assets/icons/bag_icon.png';
import shopIcon      from '../../assets/icons/shop_icon.png';
import campIcon      from '../../assets/icons/firecamp_icon.png';
import questsIcon    from '../../assets/icons/quests_icon.png';
import leaderIcon    from '../../assets/icons/leaderboard_icon.png';

const navItems = [
  { to: '/app/quests',      label: 'ЗАДАНИЯ',   icon: questsIcon },
  { to: '/app/character',   label: 'ЛАГЕРЬ',    icon: campIcon },
  { to: '/app/shop',        label: 'ЛАВКА',     icon: shopIcon },
  { to: '/app/inventory',   label: 'СУМКА',     icon: invIcon },
  { to: '/app/leaderboard', label: 'ЛИДЕРЫ',    icon: leaderIcon },
];

export default function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-black border-r border-yellow-400/20 flex flex-col z-30">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-yellow-400/20">
        <NavLink to="/">
          <span
            className="text-yellow-400 text-xs leading-relaxed"
            style={{ fontFamily: "'Press Start 2P', monospace" }}
          >
            GAME<br />YOUR LIFE
          </span>
        </NavLink>
      </div>

      {/* Navigation items */}
      <nav className="flex-1 py-6 px-3 space-y-1">
        {navItems.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-3 transition-colors ${
                isActive
                  ? 'bg-yellow-400/10 border border-yellow-400/40 text-yellow-400'
                  : 'text-white/40 hover:text-white/80 hover:bg-white/5 border border-transparent'
              }`
            }
          >
            <img
              src={icon}
              alt={label}
              className="w-8 h-8"
              style={{ imageRendering: 'pixelated' }}
            />
            <span className="text-xs font-mono font-bold tracking-widest">{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer links */}
      <div className="px-6 py-4 border-t border-yellow-400/20 space-y-1">
        {[
          ['/privacy', 'Конфиденциальность'],
          ['/terms', 'Условия'],
          ['/public-offer', 'Оферта'],
        ].map(([to, label]) => (
          <NavLink
            key={to}
            to={to}
            className="block text-[10px] font-mono text-white/20 hover:text-white/50 transition-colors"
          >
            {label}
          </NavLink>
        ))}
      </div>
    </aside>
  );
}
