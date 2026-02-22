import React, { useState } from 'react';
import Header from '../components/Header';
import AvatarSelector from '../components/AvatarSelector';
import ProfileModal from '../components/ProfileModal';

// Импорт ассетов остается на фронте
import avatar1 from '../assets/avatar1.png'; 
import avatar2 from '../assets/avatar2.png';
import avatar3 from '../assets/avatar3.png';

const avatarMap = {
  avatar1: avatar1,
  avatar2: avatar2,
  avatar3: avatar3
};

const CharacterPage = ({ character, videos, triggerHaptic, onAvatarChange }) => {
  // Если данных еще нет, показываем пустое состояние (защита от краша)
  if (!character) return null;

  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const xpPercentage = Math.min((character.xp / (character.max_xp || 100)) * 100, 100);
  const hpPercentage = Math.min((character.hp / (character.max_hp || 100)) * 100, 100);

  const handleAvatarChange = async (newId) => {
    const res = await userService.updateAvatar(character.id, newId);
    setCharacter(res.data); // Это обновит состояние во всем App
  };

  const titles = {
    knight: "РЫЦАРЬ СМЕРТИ",
    mage: "ВЕРХОВНАЯ МАГИНЯ",
    shadow: "ПРИЗРАК ПУСТОШИ"
  };

  const avatars = [
    { id: 'avatar1', img: avatar1 }, 
    { id: 'avatar2', img: avatar2 }, 
    { id: 'avatar3', img: avatar3 }
  ];

  return (
    <div className="fixed inset-0 w-full h-full bg-black overflow-hidden flex flex-col font-mono select-none touch-none">
      <div className="absolute inset-0 z-0 bg-black">
        <video src={videos?.camp || ""} autoPlay loop muted playsInline className="w-full h-full object-cover" />
      </div>

      <Header title="ЛАГЕРЬ" subtitle="СТАТУС ГЕРОЯ" gold={character.gold} />

      <div className="relative z-20 flex justify-center w-full px-3 mt-4">
        <div className="flex items-stretch p-4 pr-6 sm:pr-10 bg-black/45 backdrop-blur-md border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.6)] rounded-sm w-full sm:w-auto max-w-[550px]">
          
          {/* АВАТАРКА: Берем из маппинга по ключу из БД */}
          <div className="relative shrink-0">
            <div 
              className="w-36 h-36 sm:w-40 sm:h-40 bg-black/20 border-2 border-white/20 cursor-pointer active:scale-95 transition-all overflow-hidden"
              onClick={() => setIsSelectorOpen(true)}
            >
              <img 
                src={avatarMap[character.selected_avatar] || avatar1} 
                alt="Avatar" 
                className="w-full h-full object-cover scale-110" 
              />
            </div>
          </div>

          <div 
            className="flex flex-col justify-between px-5 sm:px-7 cursor-pointer group flex-1 h-36 sm:h-40"
            onClick={() => { triggerHaptic?.('medium'); setIsProfileOpen(true); }}
          >
            <div className="flex flex-col pt-0.5">
              <div className="flex items-baseline gap-4">
                <h3 className="text-white text-2xl sm:text-3xl font-[1000] uppercase tracking-tighter group-hover:text-[#daa520] transition-colors truncate max-w-[130px]">
                  {character.username}
                </h3>
                <span className="text-[#daa520] text-xl sm:text-2xl font-[1000] ml-6 tracking-tighter">
                  {character.lvl} LVL
                </span>
              </div>
              <p className="text-[#daa520] text-[12px] font-[1000] uppercase tracking-widest mt-2 opacity-80">
                {titles[character.char_class] || titles.knight}
              </p>
            </div>

            <div className="w-full sm:w-64 md:w-80 flex flex-col gap-3 pb-0.5">
              {/* HP */}
              <div className="flex flex-col gap-1.5">
                <div className="h-3.5 bg-black/60 border border-white/10 overflow-hidden relative">
                  <div className="h-full bg-gradient-to-r from-red-800 to-red-500 transition-all duration-700" style={{ width: `${hpPercentage}%` }} />
                </div>
                <div className="text-white/80 text-[11px] font-[1000]">
                  {character.hp}/{character.max_hp} <span className="text-red-500">HP</span>
                </div>
              </div>

              {/* XP */}
              <div className="flex flex-col gap-1.5">
                <div className="h-3.5 bg-black/60 border border-white/10 overflow-hidden relative">
                  <div className="h-full bg-gradient-to-r from-[#b8860b] via-[#daa520] to-[#ffd700] transition-all duration-1000" style={{ width: `${xpPercentage}%` }} />
                </div>
                <div className="text-white/80 text-[11px] font-[1000]">
                  {character.xp}/{character.max_xp} <span className="text-[#daa520]">XP</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AvatarSelector 
        isOpen={isSelectorOpen} 
        onClose={() => setIsSelectorOpen(false)} 
        avatars={avatars} 
        currentAvatar={avatarMap[character.selected_avatar]} 
        onSelect={(imgId) => onAvatarChange(imgId)} // Передаем ID (avatar1, avatar2) в функцию родителя
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