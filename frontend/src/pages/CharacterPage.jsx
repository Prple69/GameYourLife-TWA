import React, { useState } from 'react';
import Header from '../components/Header';
import AvatarSelector from '../components/AvatarSelector';
import ProfileModal from '../components/ProfileModal';

import avatar1 from '../assets/avatar1.png'; 
import avatar2 from '../assets/avatar2.png';
import avatar3 from '../assets/avatar3.png';

const CharacterPage = ({ character = {}, videos, triggerHaptic }) => {
  const {
    username = "Purple",
    hp = 85, max_hp = 100,
    lvl = 99, xp = 1200, max_xp = 2000,
    char_class = 'knight'
  } = character;

  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [currentAvatar, setCurrentAvatar] = useState(avatar1);

  const xpPercentage = Math.min((xp / (max_xp || 100)) * 100, 100);
  const hpPercentage = Math.min((hp / (max_hp || 100)) * 100, 100);

  const titles = {
    knight: "РЫЦАРЬ СМЕРТИ",
    mage: "ВЕРХОВНАЯ МАГИНЯ",
    shadow: "ПРИЗРАК ПУСТОШИ"
  };

  const avatars = [{ id: 1, img: avatar1 }, { id: 2, img: avatar2 }, { id: 3, img: avatar3 }];

  return (
    <div className="fixed inset-0 w-full h-full bg-black overflow-hidden flex flex-col font-mono select-none touch-none">
      
      {/* ФОН */}
      <div className="absolute inset-0 z-0 bg-black">
        <video src={videos?.camp || ""} autoPlay loop muted playsInline className="w-full h-full object-cover" />
      </div>

      {/* HEADER */}
      <Header title="ЛАГЕРЬ" subtitle="СТАТУС ГЕРОЯ" />

      {/* --- АДАПТИВНЫЙ HUD --- */}
      <div className="relative z-20 flex justify-center w-full px-3 mt-4">
        
        {/* ПАНЕЛЬ: items-stretch заставляет детей тянуться */}
        <div className="flex items-stretch p-4 pr-6 sm:pr-10 bg-black/45 backdrop-blur-md border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.6)] animate-in fade-in zoom-in-95 duration-500 rounded-sm w-full sm:w-auto max-w-[550px] sm:max-w-none">
          
          {/* 1. АВАТАРКА (Эталон высоты: 144px) */}
          <div className="relative shrink-0">
            <div 
              className="w-36 h-36 sm:w-40 sm:h-40 bg-black/20 border-2 border-white/20 shadow-lg cursor-pointer active:scale-95 transition-all overflow-hidden"
              onClick={() => setIsSelectorOpen(true)}
            >
              <img src={currentAvatar} alt="Avatar" className="w-full h-full object-cover scale-110" />
            </div>
          </div>

          {/* 2. ИНФОРМАЦИЯ (Высота h-36 соответствует аватарке) */}
          <div 
            className="flex flex-col justify-between px-5 sm:px-7 cursor-pointer group flex-1 h-36 sm:h-40 overflow-hidden"
            onClick={() => { if(triggerHaptic) triggerHaptic('medium'); setIsProfileOpen(true); }}
          >
            {/* ВЕРХНИЙ КРАЙ: НИК И КЛАСС */}
            <div className="flex flex-col pt-0.5">
              <div className="flex items-baseline gap-4">
                <h3 className="text-white text-2xl sm:text-3xl font-[1000] uppercase tracking-tighter drop-shadow-md group-hover:text-[#daa520] transition-colors leading-none truncate max-w-[130px] sm:max-w-none">
                  {username}
                </h3>
                <span className="text-[#daa520] text-xl sm:text-2xl font-[1000] drop-shadow-md leading-none shrink-0 ml-6 sm:ml-8 tracking-tighter">
                  {lvl} LVL
                </span>
              </div>
              <p className="text-[#daa520] text-[12px] sm:text-[11px] font-[1000] uppercase tracking-widest mt-2 opacity-80 leading-none">
                {titles[char_class]}
              </p>
            </div>

            {/* НИЖНИЙ КРАЙ: БАРЫ И ТЕКСТ ПОД НИМИ */}
            <div className="w-full sm:w-64 md:w-80 flex flex-col gap-3 pb-0.5">
              
              {/* HP SECTION */}
              <div className="flex flex-col gap-1.5">
                <div className="h-3.5 bg-black/60 border border-white/10 overflow-hidden relative shadow-inner">
                  <div 
                    className="h-full bg-gradient-to-r from-red-800 to-red-500 transition-all duration-700 relative" 
                    style={{ width: `${hpPercentage}%` }} 
                  >
                    <div className="absolute top-0 left-0 w-full h-[35%] bg-white/20" />
                  </div>
                </div>
                <div className="flex justify-between items-center leading-none px-0.5">
                  <span className="text-white/80 text-[11px] font-[1000] tabular-nums tracking-tight">
                    {hp}/{max_hp} <span className="text-red-500 ml-0.5 font-black uppercase">HP</span>
                  </span>
                </div>
              </div>

              {/* XP SECTION */}
              <div className="flex flex-col gap-1.5">
                <div className="h-3.5 bg-black/60 border border-white/10 overflow-hidden relative shadow-inner">
                  <div 
                    className="h-full bg-gradient-to-r from-[#b8860b] via-[#daa520] to-[#ffd700] transition-all duration-1000 relative shadow-[0_0_10px_rgba(218,165,32,0.3)]" 
                    style={{ width: `${xpPercentage}%` }} 
                  >
                    <div className="absolute top-0 left-0 w-full h-[35%] bg-white/25" />
                  </div>
                </div>
                <div className="flex justify-between items-center leading-none px-0.5">
                  <span className="text-white/80 text-[11px] font-[1000] tabular-nums tracking-tight">
                    {xp}/{max_xp} <span className="text-[#daa520] ml-0.5 font-black uppercase">XP</span>
                  </span>
                </div>
              </div>

            </div>
          </div>
          
        </div>
      </div>

      {/* МОДАЛКИ */}
      <AvatarSelector 
        isOpen={isSelectorOpen} 
        onClose={() => setIsSelectorOpen(false)} 
        avatars={avatars} 
        currentAvatar={currentAvatar} 
        onSelect={(img) => { setCurrentAvatar(img); setIsSelectorOpen(false); }} 
      />

      <ProfileModal 
        isOpen={isProfileOpen} 
        onClose={() => setIsProfileOpen(false)} 
        character={character} 
      />
    </div>
  );
};

export default CharacterPage;