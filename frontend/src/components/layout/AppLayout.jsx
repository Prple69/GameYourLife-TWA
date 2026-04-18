import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navigation from '../Navigation';
import useMediaQuery from '../../hooks/useMediaQuery';

export default function AppLayout() {
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  return (
    // No more "fixed inset-0 overflow-hidden select-none touch-none" — that broke desktop
    <div className="min-h-screen bg-black text-white font-mono flex">
      {/* Desktop: fixed sidebar (256px), hidden on mobile */}
      {isDesktop && <Sidebar />}

      {/* Main content: offset by sidebar width on desktop */}
      <main
        className={`flex-1 overflow-auto ${isDesktop ? 'ml-64' : 'pb-24'}`}
      >
        {/* pb-24 on mobile provides clearance above bottom-tabs Navigation */}
        <Outlet />
      </main>

      {/* Mobile: fixed bottom-tabs Navigation, hidden on desktop */}
      {!isDesktop && <Navigation />}
    </div>
  );
}
