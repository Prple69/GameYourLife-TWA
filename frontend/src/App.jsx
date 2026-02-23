import React, { useState, useEffect, useMemo } from 'react';
import Navigation from "./components/Navigation.jsx";
import CharacterPage from "./pages/CharacterPage.jsx";
import QuestsPage from "./pages/QuestsPage.jsx";
import LeaderboardPage from "./pages/LeaderboardPage.jsx";
import ShopPage from "./pages/ShopPage.jsx";
import InventoryPage from "./pages/InventoryPage.jsx";
import LoadingPage from "./pages/LoadingPage.jsx";
import { userService } from './services/api';

// --- АВТОМАТИЧЕСКИЙ ИМПОРТ ВСЕХ АССЕТОВ ---
// Эта магия Vite соберет все видео и картинки из папки assets
const allVideoFiles = import.meta.glob('./assets/*.mp4', { eager: true });
const allImageFiles = import.meta.glob('./assets/*.{png,jpg,jpeg,gif}', { eager: true });

const App = () => {
  const tg = window.Telegram.WebApp;

  const [activeTab, setActiveTab] = useState('camp');
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const [videoUrls, setVideoUrls] = useState({});
  const [character, setCharacter] = useState(null);

  const userData = useMemo(() => ({
    id: tg.initDataUnsafe?.user?.id?.toString() || "123456789",
    username: tg.initDataUnsafe?.user?.username || "Hero"
  }), [tg]);

  useEffect(() => {
    tg.ready();
    tg.expand();

    const initializeApp = async () => {
      // Превращаем объекты импортов в массивы путей
      const videos = Object.entries(allVideoFiles).map(([path, module]) => ({
        id: path.split('/').pop().split('.')[0], // Берем имя файла как ID (например, 'shop_anim')
        src: module.default
      }));

      const images = Object.values(allImageFiles).map(module => module.default);

      const totalSteps = videos.length + images.length + 1;
      let completedSteps = 0;
      const tempVideoUrls = {};

      const increment = () => {
        completedSteps++;
        setProgress(Math.round((completedSteps / totalSteps) * 100));
      };

      try {
        // 1. Загрузка профиля
        const userRes = await userService.getProfile(userData.id, userData.username);
        if (!userRes) throw new Error("API_DATA_MISSING");
        increment();

        // 2. Загрузка ВСЕХ найденных видео в Blob
        const videoPromises = videos.map(async (v) => {
          const response = await fetch(v.src);
          if (!response.ok) throw new Error(`FAILED_VIDEO: ${v.id}`);
          const blob = await response.blob();
          tempVideoUrls[v.id] = URL.createObjectURL(blob);
          increment();
        });

        // 3. Кеширование ВСЕХ найденных картинок
        const imagePromises = images.map((src) => {
          return new Promise((resolve, reject) => {
            const img = new Image();
            img.src = src;
            img.onload = () => { increment(); resolve(); };
            img.onerror = () => reject(new Error("IMAGE_LOAD_FAILED"));
          });
        });

        await Promise.all([...videoPromises, ...imagePromises]);

        // Финализация
        setCharacter(userRes);
        setVideoUrls(tempVideoUrls);
        setTimeout(() => setIsLoaded(true), 500);

      } catch (err) {
        console.error("Critical error:", err);
        setError(err.message || "CONNECTION_LOST");
      }
    };

    initializeApp();

    return () => {
      Object.values(videoUrls).forEach(url => URL.revokeObjectURL(url));
    };
  }, [userData]);

  const triggerHaptic = (style = 'light') => {
    if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred(style);
  };

  if (error) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center p-10 text-center z-[100000]">
        <div className="border-2 border-red-600 p-6 bg-red-900/20 backdrop-blur-md">
          <h1 className="text-red-500 font-[1000] text-2xl mb-2 tracking-tighter italic">SYSTEM_FAILURE</h1>
          <p className="text-white/40 text-[10px] uppercase tracking-[0.3em] mb-6">{error}</p>
          <button onClick={() => window.location.reload()} className="px-6 py-2 bg-white text-black font-black text-xs uppercase hover:bg-red-500 hover:text-white transition-colors">
            REBOOT_SYSTEM
          </button>
        </div>
      </div>
    );
  }

  const renderPage = () => {
    if (!character) return null;
    // Теперь в videos лежат все файлы по их именам: videos.shop_anim, videos.hero_anim и т.д.
    const props = { character, setCharacter, videos: videoUrls, triggerHaptic };

    switch (activeTab) {
      case 'inventory': return <InventoryPage {...props} />;
      case 'shop':      return <ShopPage {...props} />;
      case 'camp':      return <CharacterPage {...props} />;
      case 'quests':    return <QuestsPage {...props} />;
      case 'leaderboard': return <LeaderboardPage {...props} />;
      default:          return <CharacterPage {...props} />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black text-white font-mono overflow-hidden select-none touch-none">
      <main className={`w-full h-full relative z-10 transition-opacity duration-1000 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
        {isLoaded && renderPage()}
      </main>

      {isLoaded && (
        <Navigation 
          activeTab={activeTab} 
          setActiveTab={(tab) => { triggerHaptic('soft'); setActiveTab(tab); }} 
        />
      )}

      <LoadingPage progress={progress} isLoaded={isLoaded} />
    </div>
  );
};

export default App;