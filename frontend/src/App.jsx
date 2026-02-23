import React, { useState, useEffect, useMemo } from 'react';
import Navigation from "./components/Navigation.jsx";
import CharacterPage from "./pages/CharacterPage.jsx";
import QuestsPage from "./pages/QuestsPage.jsx";
import LeaderboardPage from "./pages/LeaderboardPage.jsx";
import ShopPage from "./pages/ShopPage.jsx";
import InventoryPage from "./pages/InventoryPage.jsx";
import LoadingPage from "./pages/LoadingPage.jsx";

import { userService } from './services/api';

import shopVideoSrc from './assets/shop_anim.mp4';
import bagVideoSrc from './assets/bag_anim.mp4';
import campVideoSrc from './assets/hero_anim.mp4';
import leaderVideoSrc from './assets/leaderboard_anim.mp4';
import questsVideoSrc from './assets/quests_anim.mp4';
import avatar1 from './assets/avatar1.png'; 
import avatar2 from './assets/avatar2.png';
import avatar3 from './assets/avatar3.png';

const App = () => {
  const tg = window.Telegram.WebApp;

  const [activeTab, setActiveTab] = useState('camp');
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(null); // Добавляем состояние ошибки
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

    const videoAssets = [
      { id: 'shop', src: shopVideoSrc },
      { id: 'bag', src: bagVideoSrc },
      { id: 'camp', src: campVideoSrc },
      { id: 'leader', src: leaderVideoSrc },
      { id: 'quests', src: questsVideoSrc }
    ];
    const imageAssets = [avatar1, avatar2, avatar3];

    const initializeApp = async () => {
      const totalSteps = videoAssets.length + imageAssets.length + 1;
      let completedSteps = 0;
      
      // Локальные хранилища, чтобы не дергать стейт постоянно
      const tempVideoUrls = {};

      const increment = () => {
        completedSteps++;
        setProgress(Math.round((completedSteps / totalSteps) * 100));
      };

      try {
        // 1. Сначала данные профиля. Если тут ошибка — летим в catch
        const userRes = await userService.getProfile(userData.id, userData.username);
        if (!userRes) throw new Error("Данные персонажа не получены");

        // 2. Загрузка видео через Fetch (Blob)
        const videoPromises = videoAssets.map(async (asset) => {
          const response = await fetch(asset.src);
          if (!response.ok) throw new Error(`Ошибка загрузки ${asset.id}`);
          const blob = await response.blob();
          tempVideoUrls[asset.id] = URL.createObjectURL(blob);
          increment();
        });

        // 3. Кеширование картинок
        const imagePromises = imageAssets.map((src) => {
          return new Promise((resolve, reject) => {
            const img = new Image();
            img.src = src;
            img.onload = () => { increment(); resolve(); };
            img.onerror = () => reject(new Error("Ошибка загрузки картинки"));
          });
        });

        // Ждем абсолютно всё
        await Promise.all([userRes, ...videoPromises, ...imagePromises]);

        // Только когда ВСЁ загружено, обновляем стейты ОДИН раз
        setCharacter(userRes);
        setVideoUrls(tempVideoUrls);
        
        // Маленькая пауза, чтобы браузер «прожевал» ассеты перед показом
        setTimeout(() => setIsLoaded(true), 400);

      } catch (err) {
        console.error("Критический сбой:", err);
        setError("ОШИБКА ПОДКЛЮЧЕНИЯ К СЕРВЕРУ");
        // setIsLoaded остается false, приложение не откроется
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
      <div className="fixed inset-0 bg-black flex items-center justify-center p-10 text-center">
        <div className="border border-red-500/50 p-6 bg-red-500/10">
          <h1 className="text-red-500 font-black text-xl mb-4">CRITICAL_ERROR</h1>
          <p className="text-white/60 text-xs leading-relaxed uppercase tracking-widest">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-6 px-4 py-2 border border-white text-white text-[10px] font-bold"
          >
            ПЕРЕЗАГРУЗИТЬ
          </button>
        </div>
      </div>
    );
  }

  const renderPage = () => {
    if (!character) return null;
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