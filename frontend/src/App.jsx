import React, { useState, useEffect, useMemo } from 'react';
import Navigation from "./components/Navigation.jsx";
import CharacterPage from "./pages/CharacterPage.jsx";
import QuestsPage from "./pages/QuestsPage.jsx";
import LeaderboardPage from "./pages/LeaderboardPage.jsx";
import ShopPage from "./pages/ShopPage.jsx";
import InventoryPage from "./pages/InventoryPage.jsx";
import LoadingPage from "./pages/LoadingPage.jsx";
import { userService } from './services/api';

// Автоматический импорт всех ассетов из папки
const allVideoFiles = import.meta.glob('./assets/*.mp4', { eager: true });
const allImageFiles = import.meta.glob('./assets/*.{png,jpg,jpeg,gif}', { eager: true });

// Карта соответствия для сохранения старых имен в коде
const assetNamingMap = {
  'shop':   'shop_anim',
  'bag':    'bag_anim',
  'camp':   'hero_anim',
  'leader': 'leaderboard_anim',
  'quests': 'quests_anim'
};

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
      // Подготовка списка видео
      const videosToLoad = Object.entries(allVideoFiles).map(([path, module]) => {
        const fileName = path.split('/').pop().split('.')[0];
        const alias = Object.keys(assetNamingMap).find(key => assetNamingMap[key] === fileName);
        return { id: alias || fileName, src: module.default };
      });

      const imagesToLoad = Object.values(allImageFiles).map(module => module.default);
      
      const totalSteps = videosToLoad.length + imagesToLoad.length + 1;
      let completedSteps = 0;
      const tempVideoUrls = {};

      const increment = () => {
        completedSteps++;
        setProgress(Math.round((completedSteps / totalSteps) * 100));
      };

      try {
        // 1. Загрузка профиля
        const userRes = await userService.getProfile(userData.id, userData.username);
        if (!userRes) throw new Error("CRITICAL_API_ERROR");
        increment();

        // 2. Загрузка Видео в Blob
        const videoPromises = videosToLoad.map(async (v) => {
          const response = await fetch(v.src);
          if (!response.ok) throw new Error(`FAILED_TO_FETCH_VIDEO: ${v.id}`);
          const blob = await response.blob();
          tempVideoUrls[v.id] = URL.createObjectURL(blob);
          increment();
        });

        // 3. Кеширование Картинок
        const imagePromises = imagesToLoad.map((src) => {
          return new Promise((resolve, reject) => {
            const img = new Image();
            img.src = src;
            img.onload = () => { increment(); resolve(); };
            img.onerror = () => reject(new Error("IMAGE_PRELOAD_FAILED"));
          });
        });

        await Promise.all([...videoPromises, ...imagePromises]);

        setVideoUrls(tempVideoUrls);
        setCharacter(userRes);
        
        // Пауза для GPU, чтобы отрисовать первый кадр видео в памяти
        setTimeout(() => setIsLoaded(true), 800);

      } catch (err) {
        console.error("Initialization Failed:", err);
        setError(err.message);
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
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center p-10 z-[100000]">
        <div className="border border-red-500 p-6 bg-red-500/10 text-center">
          <h1 className="text-red-500 font-black text-xl mb-2">SYSTEM FAILURE</h1>
          <p className="text-white/40 text-[10px] uppercase mb-6">{error}</p>
          <button onClick={() => window.location.reload()} className="bg-white text-black px-6 py-2 font-bold text-xs italic">RETRY</button>
        </div>
      </div>
    );
  }

  // Общие пропсы для всех страниц
  const pageProps = { 
    character, 
    setCharacter, 
    videos: videoUrls, 
    triggerHaptic 
  };

  return (
    <div className="fixed inset-0 bg-black text-white font-mono overflow-hidden select-none touch-none">
      
      {/* Плавный контейнер с GPU-ускорением */}
      <main 
        className={`w-full h-full relative z-10 transition-opacity duration-1000 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        style={{ transform: 'translateZ(0)' }}
      >
        {isLoaded && character && (
          <div className="w-full h-full relative">
            {/* Рендерим все страницы сразу, переключаем видимость через hidden */}
            <div className={activeTab === 'camp' ? 'block h-full' : 'hidden h-full'}>
              <CharacterPage {...pageProps} />
            </div>
            <div className={activeTab === 'quests' ? 'block h-full' : 'hidden h-full'}>
              <QuestsPage {...pageProps} />
            </div>
            <div className={activeTab === 'shop' ? 'block h-full' : 'hidden h-full'}>
              <ShopPage {...pageProps} />
            </div>
            <div className={activeTab === 'inventory' ? 'block h-full' : 'hidden h-full'}>
              <InventoryPage {...pageProps} />
            </div>
            <div className={activeTab === 'leaderboard' ? 'block h-full' : 'hidden h-full'}>
              <LeaderboardPage {...pageProps} />
            </div>

            <Navigation 
              activeTab={activeTab} 
              setActiveTab={(tab) => { triggerHaptic('soft'); setActiveTab(tab); }} 
            />
          </div>
        )}
      </main>

      {/* Лоадер перекрывает всё, пока не загрузимся */}
      <LoadingPage progress={progress} isLoaded={isLoaded} />
    </div>
  );
};

export default App;