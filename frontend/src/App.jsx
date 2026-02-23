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

// Видео-ассеты (исходные пути)
import shopVideoSrc from './assets/shop_anim.mp4';
import bagVideoSrc from './assets/bag_anim.mp4';
import campVideoSrc from './assets/hero_anim.mp4';
import leaderVideoSrc from './assets/leaderboard_anim.mp4';
import questsVideoSrc from './assets/quests_anim.mp4';

const App = () => {
  // 1. Инициализация Telegram WebApp
  const tg = window.Telegram.WebApp;

  const [activeTab, setActiveTab] = useState('camp');
  const [isLoaded, setIsLoaded] = useState(false);
  const [progress, setProgress] = useState(0);
  const [videoUrls, setVideoUrls] = useState({});
  
  // Состояние персонажа
  const [character, setCharacter] = useState(null);

  // Получаем данные из Telegram
  const userData = useMemo(() => {
    return {
      id: tg.initDataUnsafe?.user?.id?.toString() || "123456789",
      username: tg.initDataUnsafe?.user?.username || "Hero"
    };
  }, [tg]);

  useEffect(() => {
    tg.ready();
    tg.expand();

    const assets = [
      { id: 'shop', src: shopVideoSrc },
      { id: 'bag', src: bagVideoSrc },
      { id: 'camp', src: campVideoSrc },
      { id: 'leader', src: leaderVideoSrc },
      { id: 'quests', src: questsVideoSrc }
    ];

    const initializeApp = async () => {
      let loadedCount = 0;
      const newVideoUrls = {};

      try {
        // 1. Загружаем данные игрока из FastAPI (передаем и ID, и username)
        const userRes = await userService.getProfile(userData.id, userData.username);
        setCharacter(userRes);

        // 2. Параллельно загружаем видео-ассеты в Blob
        await Promise.all(assets.map(async (asset) => {
          try {
            const response = await fetch(asset.src);
            const blob = await response.blob();
            const objectUrl = URL.createObjectURL(blob);
            newVideoUrls[asset.id] = objectUrl;
            
            loadedCount++;
            setProgress(Math.round((loadedCount / assets.length) * 100));
          } catch (e) {
            console.error(`Ошибка загрузки ассета ${asset.id}:`, e);
            loadedCount++; 
          }
        }));

        setVideoUrls(newVideoUrls);
        setTimeout(() => setIsLoaded(true), 800);

      } catch (err) {
        console.error("Критическая ошибка инициализации:", err);
        // Fallback: если бэкенд упал, ставим дефолтные статы, чтобы приложение открылось
        setCharacter({ 
          telegram_id: userData.id, 
          username: userData.username, 
          lvl: 1, xp: 0, max_xp: 100, gold: 0, hp: 100,
          xp_multiplier: 1.0, gold_multiplier: 1.0,
          selected_avatar: 'avatar1', char_class: 'knight'
        });
        setIsLoaded(true);
      }
    };

    initializeApp();

    // Очистка Blob-ссылок при размонтировании
    return () => {
      Object.values(newVideoUrls).forEach(url => URL.revokeObjectURL(url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userData]); // Зависим только от userData

  // Вибрация
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
      gold: character.gold, 
      videos: videoUrls, // Передаем Blob-ссылки для мгновенного воспроизведения
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
    <div className="fixed inset-0 bg-black text-white font-mono overflow-hidden select-none">
      <main className="w-full h-full relative z-10">
        {isLoaded && character ? renderPage() : null}
      </main>

      <Navigation 
        activeTab={activeTab} 
        setActiveTab={(tab) => {
          triggerHaptic('soft');
          setActiveTab(tab);
        }} 
      />

      {/* Показываем лоадер, пока isLoaded false ИЛИ character еще не пришел */}
      <LoadingPage progress={progress} isLoaded={isLoaded && !!character} />
    </div>
  );
};

export default App;