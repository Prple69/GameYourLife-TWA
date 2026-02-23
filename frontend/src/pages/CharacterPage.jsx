import React, { useState, useCallback, useMemo } from 'react';
import Header from '../components/Header';
import AvatarSelector from '../components/AvatarSelector';
import ProfileModal from '../components/ProfileModal';
import ProgressBar from '../components/ProgressBar';
import CharacterCard from '../components/CharacterCard';
import { userService } from '../services/api';

// Ассеты выносим за пределы компонента, чтобы не пересоздавать объект
import avatar1 from '../assets/avatar1.png'; 
import avatar2 from '../assets/avatar2.png';
import avatar3 from '../assets/avatar3.png';
const avatarMap = { avatar1, avatar2, avatar3 };

const TITLES = {
  knight: "РЫЦАРЬ СМЕРТИ",
  mage: "ВЕРХОВНАЯ МАГИНЯ",
  shadow: "ПРИЗРАК ПУСТОШИ"
};

const AVATAR_OPTIONS = [
  { id: 'avatar1', img: avatar1, label: 'Рыцарь' }, 
  { id: 'avatar2', img: avatar2, label: 'Маг' }, 
  { id: 'avatar3', img: avatar3, label: 'Тень' }
];

const CharacterPage = ({ character, setCharacter, videos, triggerHaptic }) => {
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Оптимизация функций через useCallback
  const handleAvatarChange = useCallback(async (avatarId) => {
    const oldAvatar = character.selected_avatar;
    try {
      if (triggerHaptic) triggerHaptic('medium');
      // Оптимистичное обновление UI
      setCharacter(prev => ({ ...prev, selected_avatar: avatarId }));
      setIsSelectorOpen(false);
      
      const updatedUser = await userService.updateAvatar(character.telegram_id, avatarId);
      setCharacter(updatedUser); 
    } catch (err) {
      console.error(err);
      setCharacter(prev => ({ ...prev, selected_avatar: oldAvatar }));
    }
  }, [character.telegram_id, character.selected_avatar, setCharacter, triggerHaptic]);

  if (!character) return null;

  return (
    <div className="fixed inset-0 w-full h-full bg-black overflow-hidden flex flex-col font-mono select-none touch-none">
      
      {/* BACKGROUND VIDEO (GPU Optimized) */}
      <div className="absolute inset-0 z-0 bg-black">
        {videos?.camp && (
          <video 
            src={videos.camp} 
            autoPlay loop muted playsInline 
            className="w-full h-full object-cover opacity-80"
            style={{ transform: 'translateZ(0)' }} 
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black" />
      </div>

      <Header title="ЛАГЕРЬ" subtitle="ПРОФИЛЬ"/>

      <div className="relative z-20 flex flex-col items-center w-full px-6 mt-4">
        
        <CharacterCard 
          character={character}
          titles={TITLES}
          avatarMap={avatarMap}
          onAvatarClick={() => { triggerHaptic?.('light'); setIsSelectorOpen(true); }}
          onInfoClick={() => { triggerHaptic?.('medium'); setIsProfileOpen(true); }}
        />

        <div className="w-full max-w-[400px] mt-3 px-2 space-y-4">
          <ProgressBar 
            label="Жизнь" 
            value={character.hp} 
            max={character.max_hp} 
            colorClass="text-red-500" 
            shadowColor="rgba(239,68,68,0.5)" 
          />
          <ProgressBar 
            label="Опыт" 
            value={character.xp} 
            max={character.max_xp} 
            colorClass="text-[#daa520]" 
            shadowColor="rgba(218,165,32,0.5)" 
          />
        </div>
      </div>

      <AvatarSelector 
        isOpen={isSelectorOpen} 
        onClose={() => setIsSelectorOpen(false)} 
        avatars={AVATAR_OPTIONS} 
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