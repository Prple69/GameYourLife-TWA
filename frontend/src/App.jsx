import React, { useState, useEffect, useMemo } from 'react';
import Navigation from "./components/Navigation.jsx";
import CharacterPage from "./pages/CharacterPage.jsx";
import QuestsPage from "./pages/QuestsPage.jsx";
import LeaderboardPage from "./pages/LeaderboardPage.jsx";
import ShopPage from "./pages/ShopPage.jsx";
import InventoryPage from "./pages/InventoryPage.jsx";
import LoadingPage from "./pages/LoadingPage.jsx";

// Сервис для запросов к бэкенду
import { userService } from './services/api';

// Видео-ассеты
import shopVideoSrc from './assets/shop_anim.mp4';
import bagVideoSrc from './assets/bag_anim.mp4';
import campVideoSrc from './assets/hero_anim.mp4';
import leaderVideoSrc from './assets/leaderboard_anim.mp4';
import questsVideoSrc from './assets/quests_anim.mp4';

// Картинки-аватары (кешируем их тоже)
import avatar1 from './assets/avatar1.png'; 
import avatar2 from './assets/avatar2.png';
import avatar3 from './assets/avatar3.png';

const App = () => {
  const tg = window.Telegram.WebApp;

  const [activeTab, setActiveTab] = useState('camp');
  const [isLoaded, setIsLoaded] = useState(false);
  const [progress, setProgress] = useState(0);
  const [videoUrls, setVideoUrls] = useState({});
  const [character, setCharacter] = useState(null);

  // Данные пользователя из Telegram
  const userData = useMemo(() => ({
    id: tg.initDataUnsafe?.user?.id?.toString() || "123456789",
    username: tg.initDataUnsafe?.user?.username || "Hero"
  }), [tg]);

  useEffect(() => {
    tg.ready();
    tg.expand();

    // Список всех ассетов для предзагрузки
    const videoAssets = [
      { id: 'shop', src: shopVideoSrc },
      { id: 'bag', src: bagVideoSrc },
      { id: 'camp', src: campVideoSrc },
      { id: 'leader', src: leaderVideoSrc },
      { id: 'quests', src: questsVideoSrc }
    ];

    const imageAssets = [avatar1, avatar2, avatar3];

    const initializeApp = async () => {
      // Общее кол-во шагов = видео + картинки + 1 (запрос к API)
      const totalSteps = videoAssets.length + imageAssets.length + 1;
      let completedSteps = 0;
      const newVideoUrls = {};

      const incrementProgress = () => {
        completedSteps++;
        setProgress(Math.round((completedSteps / totalSteps) * 100));
      };

      try {
        // 1. Загружаем данные персонажа
        const userRes = await userService.getProfile(userData.id, userData.username);
        setCharacter(userRes);
        incrementProgress();

        // 2. Загружаем видео в Blob (параллельно)
        const videoPromises = videoAssets.map(async (asset) => {
          try {
            const response = await fetch(asset.src);
            const blob = await response.blob();
            const objectUrl = URL.createObjectURL(blob);
            newVideoUrls[asset.id] = objectUrl;
          } catch (e) {
            console.error(`Ошибка загрузки видео ${asset.id}:`, e);
          }
          incrementProgress();
        });

        // 3. Загружаем картинки в кеш браузера (параллельно)
        const imagePromises = imageAssets.map((src) => {
          return new Promise((resolve) => {
            const img = new Image();
            img.src = src;
            img.onload = () => { incrementProgress(); resolve(); };
            img.onerror = () => { incrementProgress(); resolve(); };
          });
        });

        // Ждем выполнения всех промисов
        await Promise.all([...videoPromises, ...imagePromises]);

        setVideoUrls(newVideoUrls);
        
        // Небольшая пауза для завершения рендеринга
        setTimeout(() => setIsLoaded(true), 600);

      } catch (err) {
        console.error("Ошибка инициализации:", err);
        // Fallback: дефолтный герой, если бэк упал
        setCharacter({ 
          telegram_id: userData.id, 
          username: userData.username, 
          lvl: 1, xp: 0, max_xp: 100, gold: 0, hp: 100, max_hp: 100,
          selected_avatar: 'avatar1', char_class: 'knight'
        });
        setIsLoaded(true);
      }
    };

    initializeApp();

    // Очистка памяти при закрытии
    return () => {
      Object.values(videoUrls).forEach(url => URL.revokeObjectURL(url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userData]);

  const triggerHaptic = (style = 'light') => {
    if (tg.HapticFeedback) {
      tg.HapticFeedback.impactOccurred(style);
    }
  };

  const renderPage = () => {
    if (!character) return null;

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
      {/* Плавный контейнер для страниц */}
      <main className={`w-full h-full relative z-10 transition-opacity duration-700 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
        {character && renderPage()}
      </main>

      {/* Навигация видна всегда или только после загрузки? Оставим после загрузки для чистоты */}
      {isLoaded && (
        <Navigation 
          activeTab={activeTab} 
          setActiveTab={(tab) => {
            triggerHaptic('soft');
            setActiveTab(tab);
          }} 
        />
      )}

      {/* Экран загрузки */}
      <LoadingPage progress={progress} isLoaded={isLoaded && !!character} />
    </div>
  );
};

export default App;