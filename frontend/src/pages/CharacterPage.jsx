import React, { useState } from 'react';
import Header from '../components/Header';
import AvatarSelector from '../components/AvatarSelector';
import ProfileModal from '../components/ProfileModal';
import { userService } from '../services/api';

// Ассеты
import avatar1 from '../assets/avatar1.png'; 
import avatar2 from '../assets/avatar2.png';
import avatar3 from '../assets/avatar3.png';

const avatarMap = { avatar1, avatar2, avatar3 };

const CharacterPage = ({ character, setCharacter, videos, triggerHaptic }) => {
  if (!character) return null;

  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const xpPercentage = Math.min((character.xp / (character.max_xp || 100)) * 100, 100);
  const hpPercentage = Math.min((character.hp / (character.max_hp || 100)) * 100, 100);

  const titles = {
    knight: "РЫЦАРЬ СМЕРТИ",
    mage: "ВЕРХОВНАЯ МАГИНЯ",
    shadow: "ПРИЗРАК ПУСТОШИ"
  };

  const avatars = [
    { id: 'avatar1', img: avatar1, label: 'Рыцарь' }, 
    { id: 'avatar2', img: avatar2, label: 'Маг' }, 
    { id: 'avatar3', img: avatar3, label: 'Тень' }
  ];

  const handleAvatarChange = async (avatarId) => {
    const oldAvatar = character.selected_avatar;
    try {
      triggerHaptic('medium');
      setCharacter(prev => ({ ...prev, selected_avatar: avatarId }));
      setIsSelectorOpen(false);
      const updatedUser = await userService.updateAvatar(character.telegram_id, avatarId);
      setCharacter({ ...updatedUser }); 
    } catch (err) {
      console.error(err);
      setCharacter(prev => ({ ...prev, selected_avatar: oldAvatar }));
    }
  };

  return (
    <div className="fixed inset-0 w-full h-full bg-black overflow-hidden flex flex-col font-mono select-none touch-none">
      {/* BACKGROUND VIDEO */}
      <div className="absolute inset-0 z-0 bg-black">
        <video 
          src={videos?.camp || ""} 
          autoPlay loop muted playsInline 
          className="w-full h-full object-cover opacity-80" 
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black" />
      </div>

      <Header title="ЛАГЕРЬ" subtitle="ПРОФИЛЬ" gold={character.gold} />

      <div className="relative z-20 flex flex-col items-center w-full px-6 mt-4">
        
        {/* МИНИ-КАРТОЧКА (Стеклянная) */}
        <div className="flex items-center p-3 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-xl w-full max-w-[400px] shadow-2xl">
          
          {/* АВАТАР */}
          <div 
            className="relative w-20 h-20 sm:w-24 sm:h-24 shrink-0 cursor-pointer active:scale-95 transition-transform"
            onClick={() => { triggerHaptic('light'); setIsSelectorOpen(true); }}
          >
            <div className="absolute inset-0 rounded-lg border border-[#daa520]/30 shadow-[0_0_15px_rgba(218,165,32,0.1)]" />
            <img 
              src={avatarMap[character.selected_avatar] || avatar1} 
              alt="Avatar" 
              className="w-full h-full object-cover rounded-lg" 
            />
            <div className="absolute -bottom-1 -right-1 bg-[#daa520] p-1 rounded-md shadow-lg">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="black"><path d="M21 13h-8v8h-2v-8H3v-2h8V3h2v8h8v2z"/></svg>
            </div>
          </div>

          {/* ИНФО */}
          <div 
            className="ml-4 flex-1 cursor-pointer"
            onClick={() => { triggerHaptic('medium'); setIsProfileOpen(true); }}
          >
            <h3 className="text-white text-lg font-black uppercase tracking-tighter leading-none">
              {character.username}
            </h3>
            <p className="text-[#daa520] text-[10px] font-black mt-1 tracking-widest">
              {titles[character.char_class] || titles.knight}
            </p>
            <div className="mt-2 inline-block bg-white/10 px-2 py-0.5 rounded text-[10px] text-white/60 font-bold">
              LVL {character.lvl}
            </div>
          </div>
        </div>

        {/* СТАТУС-БАРЫ (Ультра-прозрачные) */}
        <div className="w-full max-w-[400px] mt-3 px-2 space-y-4">
          {/* HP */}
          <div className="space-y-1">
            <div className="flex justify-between text-[9px] font-black uppercase text-white/40 tracking-[0.2em]">
              <span>Жизнь</span>
              <span className="text-red-500/80">{character.hp}</span>
            </div>
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-red-600 to-red-400 transition-all duration-1000 shadow-[0_0_8px_rgba(239,68,68,0.5)]" 
                style={{ width: `${hpPercentage}%` }} 
              />
            </div>
          </div>

          {/* XP */}
          <div className="space-y-1">
            <div className="flex justify-between text-[9px] font-black uppercase text-white/40 tracking-[0.2em]">
              <span>Опыт</span>
              <span className="text-[#daa520]/80">{character.xp} / {character.max_xp}</span>
            </div>
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[#b8860b] to-[#ffd700] transition-all duration-1000 shadow-[0_0_8px_rgba(218,165,32,0.5)]" 
                style={{ width: `${xpPercentage}%` }} 
              />
            </div>
          </div>
        </div>

      </div>

      {/* МОДАЛКИ */}
      <AvatarSelector 
        isOpen={isSelectorOpen} 
        onClose={() => setIsSelectorOpen(false)} 
        avatars={avatars} 
        currentAvatar={character.selected_avatar} 
        onSelect={handleAvatarChange} 
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