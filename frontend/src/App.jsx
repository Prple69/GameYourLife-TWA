import React, { useState, useEffect, useMemo } from 'react';
import Navigation from "./components/Navigation.jsx";
import CharacterPage from "./pages/CharacterPage.jsx";
import QuestsPage from "./pages/QuestsPage.jsx";
import LeaderboardPage from "./pages/LeaderboardPage.jsx";
import ShopPage from "./pages/ShopPage.jsx";
import InventoryPage from "./pages/InventoryPage.jsx";
import LoadingPage from "./pages/LoadingPage.jsx";
import { userService } from './services/api';

// Авто-импорт всех файлов из папки assets
const allVideoFiles = import.meta.glob('./assets/*.mp4', { eager: true });
const allImageFiles = import.meta.glob('./assets/*.{png,jpg,jpeg,gif}', { eager: true });

// Карта соответствия: "как пишем в коде": "как называется файл"
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
      // Подготовка списка видео с учетом алиасов
      const videosToLoad = Object.entries(allVideoFiles).map(([path, module]) => {
        const fileName = path.split('/').pop().split('.')[0];
        // Ищем, нет ли для этого файла короткого имени (например, camp для hero_anim)
        const alias = Object.keys(assetNamingMap).find(key => assetNamingMap[key] === fileName);
        return {
          id: alias || fileName,
          src: module.default
        };
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
        // 1. Загрузка данных юзера (Критично)
        const userRes = await userService.getProfile(userData.id, userData.username);
        if (!userRes) throw new Error("USER_PROFILE_NOT_FOUND");
        increment();

        // 2. Загрузка ВИДЕО (Blob)
        const videoPromises = videosToLoad.map(async (v) => {
          const response = await fetch(v.src);
          if (!response.ok) throw new Error(`VIDEO_FETCH_FAILED: ${v.id}`);
          const blob = await response.blob();
          tempVideoUrls[v.id] = URL.createObjectURL(blob);
          increment();
        });

        // 3. Загрузка КАРТИНОК
        const imagePromises = imagesToLoad.map((src) => {
          return new Promise((resolve, reject) => {
            const img = new Image();
            img.src = src;
            img.onload = () => { increment(); resolve(); };
            img.onerror = () => reject(new Error("IMAGE_LOAD_FAILED"));
          });
        });

        // Ждем завершения абсолютно всех процессов
        await Promise.all([...videoPromises, ...imagePromises]);

        // Финальная синхронизация состояний
        setVideoUrls(tempVideoUrls);
        setCharacter(userRes);
        
        // Даем браузеру 600мс на «утряску» ресурсов перед скрытием лоадера
        setTimeout(() => {
          setIsLoaded(true);
        }, 600);

      } catch (err) {
        console.error("Critical Load Error:", err);
        setError(err.message || "DATABASE_OFFLINE");
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

  // Экран фатальной ошибки
  if (error) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center p-10 text-center z-[100000]">
        <div className="border border-red-600 p-8 bg-red-950/20 backdrop-blur-md">
          <div className="text-red-500 font-black text-3xl mb-2 tracking-tighter">FATAL_ERROR</div>
          <div className="text-white/40 text-[8px] uppercase tracking-[0.5em] mb-8">{error}</div>
          <button 
            onClick={() => window.location.reload()} 
            className="px-8 py-3 bg-white text-black font-black text-[10px] uppercase tracking-widest active:scale-95 transition-transform"
          >
            REBOOT SYSTEM
          </button>
        </div>
      </div>
    );
  }

  const renderPage = () => {
    // Двойная проверка: если данных нет, не рендерим ничего
    if (!character || Object.keys(videoUrls).length === 0) return null;

    const props = { 
      character, 
      setCharacter, 
      videos: videoUrls, 
      triggerHaptic 
    };

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
      {/* Контент монтируется только когда ВСЁ загружено */}
      {isLoaded && character && (
        <>
          <main className="w-full h-full relative z-10 animate-in fade-in duration-1000">
            {renderPage()}
          </main>
          <Navigation 
            activeTab={activeTab} 
            setActiveTab={(tab) => {
              triggerHaptic('soft');
              setActiveTab(tab);
            }} 
          />
        </>
      )}

      {/* Лоадер перекрывает всё, пока isLoaded = false */}
      <LoadingPage progress={progress} isLoaded={isLoaded} />
    </div>
  );
};

export default App;