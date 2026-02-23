import React, { useState } from 'react';
import Header from '../components/Header';
import AvatarSelector from '../components/AvatarSelector';
import ProfileModal from '../components/ProfileModal';
import { userService } from '../services/api';

// Ассеты
import avatar1 from '../assets/avatar1.png'; 
import avatar2 from '../assets/avatar2.png';
import avatar3 from '../assets/avatar3.png';

const avatarMap = {
  avatar1: avatar1,
  avatar2: avatar2,
  avatar3: avatar3
};

const CharacterPage = ({ character, setCharacter, videos, triggerHaptic }) => {
  if (!character) return null;

  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

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
    // 1. Сохраняем старый аватар на случай ошибки сервера
    const oldAvatar = character.selected_avatar;

    try {
      triggerHaptic('medium');
      
      // 2. МГНОВЕННОЕ ОБНОВЛЕНИЕ (Optimistic)
      // Мы не ждем ответа, а сразу обновляем стейт
      setCharacter(prev => ({ ...prev, selected_avatar: avatarId }));
      setIsSelectorOpen(false);

      // 3. Отправляем запрос в фоне
      const updatedUser = await userService.updateAvatar(character.telegram_id, avatarId);
      
      // 4. Синхронизируем финальные данные от сервера
      setCharacter({ ...updatedUser }); 
      
    } catch (err) {
      console.error("Ошибка при смене аватара:", err);
      // Если сервер упал — возвращаем как было
      setCharacter(prev => ({ ...prev, selected_avatar: oldAvatar }));
      alert("Не удалось сохранить аватар. Попробуйте позже.");
    }
  };

  return (
    <div className="fixed inset-0 w-full h-full bg-black overflow-hidden flex flex-col font-mono select-none touch-none">
      {/* BACKGROUND VIDEO */}
      <div className="absolute inset-0 z-0 bg-black">
        <video 
          src={videos?.camp || ""} 
          autoPlay loop muted playsInline 
          className="w-full h-full object-cover opacity-70" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black" />
      </div>

      <Header title="ЛАГЕРЬ" subtitle="СТАТУС ГЕРОЯ" gold={character.gold} />

      <div className="relative z-20 flex flex-col items-center w-full px-4 mt-6">
        
        {/* КАРТОЧКА ПЕРСОНАЖА (ВЕРХНЯЯ ЧАСТЬ) */}
        <div className={`flex items-start p-4 bg-black/60 backdrop-blur-xl border border-white/10 rounded-sm w-full max-w-[500px] transition-opacity ${isUpdating ? 'opacity-50' : 'opacity-100'}`}>
          
          {/* ЛЕВО: АВАТАР */}
          <div className="relative shrink-0">
            <div 
              className="w-24 h-24 sm:w-32 sm:h-32 bg-black/40 border-2 border-[#daa520]/40 cursor-pointer active:scale-95 transition-all overflow-hidden shadow-[0_0_20px_rgba(218,165,32,0.2)]"
              onClick={() => { triggerHaptic('light'); setIsSelectorOpen(true); }}
            >
              <img 
                src={avatarMap[character.selected_avatar] || avatar1} 
                alt="Avatar" 
                className="w-full h-full object-cover" 
              />
              <div className="absolute bottom-0 inset-x-0 bg-black/80 text-[7px] text-center py-0.5 text-[#daa520] font-black uppercase tracking-tighter">
                ИЗМЕНИТЬ
              </div>
            </div>
          </div>

          {/* ПРАВО: ИНФО */}
          <div 
            className="flex flex-col ml-4 flex-1 cursor-pointer"
            onClick={() => { triggerHaptic('medium'); setIsProfileOpen(true); }}
          >
            <div className="flex items-baseline gap-2">
              <h3 className="text-white text-xl sm:text-2xl font-[1000] uppercase tracking-tighter truncate">
                {character.username}
              </h3>
              <span className="text-[#daa520] text-sm font-black">
                Lvl {character.lvl}
              </span>
            </div>
            
            <p className="text-white/40 text-[9px] font-black uppercase tracking-widest -mt-1 mb-2">
              {titles[character.char_class] || titles.knight}
            </p>

            {/* ЗОЛОТО В ПАНЕЛИ */}
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 w-fit px-3 py-1 rounded-sm">
              <span className="text-lg">🪙</span>
              <span className="text-[#daa520] font-[1000] text-lg tracking-tighter">
                {character.gold.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* НИЖНЯЯ ЧАСТЬ: ПОЛОСКИ СТАТУСА (ВЫНЕСЕНЫ НИЖЕ) */}
        <div className="w-full max-w-[500px] mt-4 space-y-3 bg-black/40 p-4 border-x border-b border-white/5">
          {/* HP Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
              <span className="text-red-500/80">Здоровье</span>
              <span className="text-white">{character.hp} / {character.max_hp}</span>
            </div>
            <div className="h-2 bg-white/5 border border-white/10 overflow-hidden p-[1px]">
              <div 
                className="h-full bg-gradient-to-r from-red-800 to-red-500 transition-all duration-1000 shadow-[0_0_10px_rgba(239,68,68,0.4)]" 
                style={{ width: `${hpPercentage}%` }} 
              />
            </div>
          </div>

          {/* XP Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
              <span className="text-[#daa520]/80">Опыт</span>
              <span className="text-white">{character.xp} / {character.max_xp}</span>
            </div>
            <div className="h-2 bg-white/5 border border-white/10 overflow-hidden p-[1px]">
              <div 
                className="h-full bg-gradient-to-r from-[#b8860b] to-[#ffd700] transition-all duration-1000 shadow-[0_0_10px_rgba(218,165,32,0.4)]" 
                style={{ width: `${xpPercentage}%` }} 
              />
            </div>
          </div>
        </div>

      </div>

      {/* МОДАЛЬНЫЕ ОКНА */}
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