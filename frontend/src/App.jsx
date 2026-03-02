import React, { useState, useEffect, useMemo, memo } from 'react';
import Navigation from "./components/Navigation.jsx";
import CharacterPage from "./pages/CharacterPage.jsx";
import QuestsPage from "./pages/QuestsPage.jsx";
import LeaderboardPage from "./pages/LeaderboardPage.jsx";
import ShopPage from "./pages/ShopPage.jsx";
import InventoryPage from "./pages/InventoryPage.jsx";
import LoadingPage from "./pages/LoadingPage.jsx";
import { userService } from './services/api';
import axios from 'axios';

// Замени на актуальный адрес из Tuna
axios.defaults.baseURL = 'https://gameurlife.ru.tuna.am';
// Оптимизируем компоненты страниц, чтобы они не перерисовывались в скрытом состоянии
const MemoCamp = memo(CharacterPage);
const MemoQuests = memo(QuestsPage);
const MemoShop = memo(ShopPage);
const MemoInv = memo(InventoryPage);
const MemoLeader = memo(LeaderboardPage);

const allVideoFiles = import.meta.glob('./assets/*.mp4', { eager: true });
const allImageFiles = import.meta.glob('./assets/*.{png,jpg,jpeg,gif}', { eager: true });

const assetNamingMap = {
  'shop': 'shop_anim',
  'bag': 'bag_anim',
  'camp': 'hero_anim',
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
        setProgress(prev => Math.min(Math.round((completedSteps / totalSteps) * 100), 99));
      };

      try {
        // --- ОПТИМИЗАЦИЯ: Запускаем всё параллельно ---
        const apiPromise = userService.getProfile();
        
        const videoPromises = videosToLoad.map(async (v) => {
          const response = await fetch(v.src);
          if (!response.ok) throw new Error(`VF_${v.id}`);
          const blob = await response.blob();
          tempVideoUrls[v.id] = URL.createObjectURL(blob);
          increment();
        });

        const imagePromises = imagesToLoad.map((src) => {
          return new Promise((resolve, reject) => {
            const img = new Image();
            img.src = src;
            img.onload = () => { increment(); resolve(); };
            img.onerror = () => reject(new Error("IMG_F"));
          });
        });

        // Ждем и API, и ассеты одновременно
        const [userRes] = await Promise.all([apiPromise, ...videoPromises, ...imagePromises]);
        
        if (!userRes) throw new Error("USER_NOT_FOUND");
        
        increment(); // Последний шаг — API

        setVideoUrls(tempVideoUrls);
        setCharacter(userRes);
        
        // Маленький хак: даем 100% и ждем чуть-чуть, чтобы браузер "прожевал" Blob URL
        setProgress(100);
        setTimeout(() => setIsLoaded(true), 600);

      } catch (err) {
        setError(err.message);
      }
    };

    initializeApp();
    return () => Object.values(videoUrls).forEach(url => URL.revokeObjectURL(url));
  }, [userData]);

  const triggerHaptic = (style = 'light') => {
    if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred(style);
  };

  if (error) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center p-10 z-[100000]">
        <div className="border-2 border-red-600 p-6 bg-red-950/20 text-center">
          <h1 className="text-red-500 font-black text-2xl mb-2 italic">SYSTEM FAILURE</h1>
          <button onClick={() => window.location.reload()} className="px-6 py-2 bg-white text-black font-bold text-xs">REBOOT</button>
        </div>
      </div>
    );
  }

  const pageProps = { character, setCharacter, videos: videoUrls, triggerHaptic };

  return (
    <div className="fixed inset-0 bg-black text-white font-mono overflow-hidden select-none touch-none">
      
      <main 
        className={`w-full h-full relative z-10 transition-opacity duration-700 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        style={{ transform: 'translate3d(0,0,0)', willChange: 'opacity' }}
      >
        {isLoaded && character && (
          <div className="w-full h-full relative">
            {/* Рендеринг всех страниц. Теперь они обернуты в memo */}
            <div className={activeTab === 'camp' ? 'block h-full' : 'hidden'}>
              <MemoCamp {...pageProps} />
            </div>
            
            <div className={activeTab === 'quests' ? 'block h-full' : 'hidden'}>
              <MemoQuests {...pageProps} />
            </div>
            
            <div className={activeTab === 'shop' ? 'block h-full' : 'hidden'}>
              <MemoShop {...pageProps} />
            </div>
            
            <div className={activeTab === 'inventory' ? 'block h-full' : 'hidden'}>
              <MemoInv {...pageProps} />
            </div>
            
            <div className={activeTab === 'leaderboard' ? 'block h-full' : 'hidden'}>
              <MemoLeader {...pageProps} />
            </div>

            <Navigation 
              activeTab={activeTab} 
              setActiveTab={(tab) => { triggerHaptic('soft'); setActiveTab(tab); }} 
            />
          </div>
        )}
      </main>

      <LoadingPage progress={progress} isLoaded={isLoaded} />
    </div>
  );
};

export default App;