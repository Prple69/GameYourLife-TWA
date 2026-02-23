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
const allVideoFiles = import.meta.glob('./assets/*.mp4', { eager: true });
const allImageFiles = import.meta.glob('./assets/*.{png,jpg,jpeg,gif}', { eager: true });

// Карта соответствия: "как вызываем в коде" : "имя файла в assets"
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
      // Подготовка списка видео для загрузки
      const videosToLoad = Object.entries(allVideoFiles).map(([path, module]) => {
        const fileName = path.split('/').pop().split('.')[0];
        const alias = Object.keys(assetNamingMap).find(key => assetNamingMap[key] === fileName);
        return {
          id: alias || fileName,
          src: module.default
        };
      });

      const imagesToLoad = Object.values(allImageFiles).map(module => module.default);
      
      // Общее количество шагов (API + Видео + Картинки)
      const totalSteps = videosToLoad.length + imagesToLoad.length + 1;
      let completedSteps = 0;
      const tempVideoUrls = {};

      const increment = () => {
        completedSteps++;
        setProgress(Math.round((completedSteps / totalSteps) * 100));
      };

      try {
        // 1. Загрузка профиля (если падает — сразу в error)
        const userRes = await userService.getProfile(userData.id, userData.username);
        if (!userRes) throw new Error("API_ERROR: Profile not found");
        increment();

        // 2. Загрузка Видео в Blob
        const videoPromises = videosToLoad.map(async (v) => {
          const response = await fetch(v.src);
          if (!response.ok) throw new Error(`FETCH_FAILED: ${v.id}`);
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
            img.onerror = () => reject(new Error("IMG_LOAD_FAILED"));
          });
        });

        // Ждем выполнения ВСЕХ загрузок
        await Promise.all([...videoPromises, ...imagePromises]);

        // Сохраняем всё в стейт одновременно
        setVideoUrls(tempVideoUrls);
        setCharacter(userRes);
        
        // Даем небольшую паузу для завершения рендеринга в памяти
        setTimeout(() => {
          setIsLoaded(true);
        }, 800);

      } catch (err) {
        console.error("Critical error during init:", err);
        setError(err.message || "CONNECTION_ERROR");
      }
    };

    initializeApp();

    // Чистим память при размонтировании
    return () => {
      Object.values(videoUrls).forEach(url => URL.revokeObjectURL(url));
    };
  }, [userData]);

  const triggerHaptic = (style = 'light') => {
    if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred(style);
  };

  // Экран ошибки (блокирует всё)
  if (error) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center p-10 z-[100000]">
        <div className="border-2 border-red-600 p-6 bg-red-900/10 text-center">
          <h1 className="text-red-500 font-black text-2xl mb-2 italic">SYSTEM FAILURE</h1>
          <p className="text-white/40 text-[10px] uppercase tracking-[0.2em] mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-6 py-2 bg-white text-black font-black text-xs uppercase"
          >
            REBOOT
          </button>
        </div>
      </div>
    );
  }

  const pageProps = { 
    character, 
    setCharacter, 
    videos: videoUrls, 
    triggerHaptic 
  };

  return (
    <div className="fixed inset-0 bg-black text-white font-mono overflow-hidden select-none touch-none">
      
      {/* Основной контент. Мы используем opacity и скрытие через 'hidden', 
          чтобы страницы не размонтировались при переключении табов.
      */}
      <main 
        className={`w-full h-full relative z-10 transition-opacity duration-1000 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        style={{ transform: 'translateZ(0)' }} // Принудительное GPU ускорение
      >
        {isLoaded && character && (
          <div className="w-full h-full relative">
            
            <div className={activeTab === 'camp' ? 'block h-full' : 'hidden'}>
              <CharacterPage {...pageProps} />
            </div>
            
            <div className={activeTab === 'quests' ? 'block h-full' : 'hidden'}>
              <QuestsPage {...pageProps} />
            </div>
            
            <div className={activeTab === 'shop' ? 'block h-full' : 'hidden'}>
              <ShopPage {...pageProps} />
            </div>
            
            <div className={activeTab === 'inventory' ? 'block h-full' : 'hidden'}>
              <InventoryPage {...pageProps} />
            </div>
            
            <div className={activeTab === 'leaderboard' ? 'block h-full' : 'hidden'}>
              <LeaderboardPage {...pageProps} />
            </div>

            <Navigation 
              activeTab={activeTab} 
              setActiveTab={(tab) => {
                triggerHaptic('soft');
                setActiveTab(tab);
              }} 
            />
          </div>
        )}
      </main>

      {/* Лоадер. Исчезает только когда isLoaded === true */}
      <LoadingPage progress={progress} isLoaded={isLoaded} />
      
    </div>
  );
};

export default App;