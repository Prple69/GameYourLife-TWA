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

const App = () => {
  // 1. Инициализация Telegram WebApp
  const tg = window.Telegram.WebApp;

  const [activeTab, setActiveTab] = useState('camp');
  const [isLoaded, setIsLoaded] = useState(false);
  const [progress, setProgress] = useState(0);
  const [videoUrls, setVideoUrls] = useState({});
  
  // Состояние персонажа (null пока не загрузим из БД)
  const [character, setCharacter] = useState(null);

  // Получаем реальные данные из Telegram или используем заглушку для браузера
  const userData = useMemo(() => {
    return {
      id: tg.initDataUnsafe?.user?.id?.toString() || "123456789",
      username: tg.initDataUnsafe?.user?.username || "Hero"
    };
  }, [tg]);

  useEffect(() => {
    // Сообщаем Telegram, что приложение готово
    tg.ready();
    tg.expand(); // Разворачиваем на весь экран

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
        // 1. Загружаем данные игрока из FastAPI
        // Если юзера нет в базе, бэкенд его создаст автоматически
        const userRes = await userService.getProfile(userData.id);
        setCharacter(userRes.data);

        // 2. Параллельно загружаем тяжелые видео-ассеты в Blob
        const loadPromises = assets.map(async (asset) => {
          try {
            const response = await fetch(asset.src);
            const blob = await response.blob();
            const objectUrl = URL.createObjectURL(blob);
            newVideoUrls[asset.id] = objectUrl;
            
            loadedCount++;
            setProgress(Math.round((loadedCount / assets.length) * 100));
          } catch (e) {
            console.error(`Ошибка загрузки ассета ${asset.id}:`, e);
            loadedCount++; // Считаем попытку, чтобы не завис лоадер
          }
        });

        await Promise.all(loadPromises);
        
        setVideoUrls(newVideoUrls);
        // Небольшая задержка для плавности перехода с лоадера
        setTimeout(() => setIsLoaded(true), 800);

      } catch (err) {
        console.error("Критическая ошибка инициализации:", err);
        // В случае падения бэкенда ставим дефолтные статы
        setCharacter({ 
          telegram_id: userData.id, 
          username: userData.username, 
          lvl: 1, xp: 0, max_xp: 100, gold: 0, hp: 100,
          xp_multiplier: 1.0, gold_multiplier: 1.0 
        });
        setIsLoaded(true);
      }
    };

    initializeApp();

    // Очистка Blob-ссылок из памяти при закрытии
    return () => {
      Object.values(videoUrls).forEach(url => URL.revokeObjectURL(url));
    };
  }, [userData, tg]);

  // Функция для вызова вибрации в Telegram (Haptic Feedback)
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
      videos: {
        shop: shopVideoSrc,
        bag: bagVideoSrc,
        camp: campVideoSrc,
        leader: leaderVideoSrc,
        quests: questsVideoSrc
      },
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
      {/* Контент приложения */}
      <main className="w-full h-full relative z-10">
        {isLoaded && character ? renderPage() : null}
      </main>

      {/* Навигация */}
      <Navigation 
        activeTab={activeTab} 
        setActiveTab={(tab) => {
          triggerHaptic('soft');
          setActiveTab(tab);
        }} 
      />

      {/* Экран загрузки (перекрывает всё, пока не загрузим данные) */}
      <LoadingPage progress={progress} isLoaded={isLoaded && !!character} />
    </div>
  );
};

export default App;