import React, { useState } from 'react';
import Header from '../components/Header';
import AvatarSelector from '../components/AvatarSelector';
import ProfileModal from '../components/ProfileModal';
import { userService } from '../services/api'; // Импортируем наш сервис

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
  const [isUpdating, setIsUpdating] = useState(false); // Состояние загрузки аватара

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

  // ФУНКЦИЯ ОБНОВЛЕНИЯ АВАТАРА В БД
  const handleAvatarChange = async (avatarId) => {
    try {
      setIsUpdating(true);
      triggerHaptic('medium');
      
      // Отправляем на бэкенд (FastAPI)
      const res = await userService.updateAvatar(character.id, avatarId);
      
      // Обновляем глобальное состояние в App.js
      setCharacter(res.data);
      
      setIsSelectorOpen(false);
    } catch (err) {
      console.error("Ошибка при смене аватара:", err);
    } finally {
      setIsUpdating(false);
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
        {/* Градиент для читаемости текста */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/60" />
      </div>

      <Header title="ЛАГЕРЬ" subtitle="СТАТУС ГЕРОЯ" gold={character.gold} />

      {/* ОСНОВНОЙ КОНТЕНТ С УЧЕТОМ SAFE AREA */}
      <div className="relative z-20 flex flex-col items-center w-full px-4 mt-2 sm:mt-8">
        
        {/* КАРТОЧКА ПЕРСОНАЖА */}
        <div className={`flex flex-col sm:flex-row items-center sm:items-stretch p-5 bg-black/50 backdrop-blur-xl border border-white/10 rounded-sm w-full max-w-[500px] transition-opacity ${isUpdating ? 'opacity-50' : 'opacity-100'}`}>
          
          {/* АВАТАРКА С ПУЛЬСАЦИЕЙ ПРИ КЛИКЕ */}
          <div className="relative shrink-0 mb-4 sm:mb-0">
            <div 
              className="w-32 h-32 sm:w-40 sm:h-40 bg-black/40 border-2 border-[#daa520]/40 cursor-pointer active:scale-95 transition-all overflow-hidden shadow-[0_0_20px_rgba(218,165,32,0.2)]"
              onClick={() => { triggerHaptic('light'); setIsSelectorOpen(true); }}
            >
              <img 
                src={avatarMap[character.selected_avatar] || avatar1} 
                alt="Avatar" 
                className="w-full h-full object-cover scale-110" 
              />
              <div className="absolute bottom-0 inset-x-0 bg-black/60 text-[8px] text-center py-1 text-[#daa520] font-black tracking-widest uppercase">
                Сменить
              </div>
            </div>
          </div>

          {/* ИНФО-БЛОК */}
          <div 
            className="flex flex-col justify-between sm:px-6 flex-1 w-full"
            onClick={() => { triggerHaptic('medium'); setIsProfileOpen(true); }}
          >
            <div className="text-center sm:text-left">
              <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-3 justify-center sm:justify-start">
                <h3 className="text-white text-2xl sm:text-3xl font-[1000] uppercase tracking-tighter truncate">
                  {character.username}
                </h3>
                <span className="text-[#daa520] text-xl font-[1000] tracking-tighter">
                  {character.lvl} LVL
                </span>
              </div>
              <p className="text-[#daa520]/70 text-[10px] sm:text-[12px] font-[1000] uppercase tracking-[0.2em] mt-1">
                {titles[character.char_class] || titles.knight}
              </p>
            </div>

            {/* PROGRESS BARS */}
            <div className="flex flex-col gap-3 mt-6 sm:mt-0">
              {/* HP Bar */}
              <div className="space-y-1">
                <div className="h-2.5 bg-black/60 border border-white/5 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-red-900 to-red-500 transition-all duration-1000 shadow-[0_0_10px_rgba(239,68,68,0.3)]" 
                    style={{ width: `${hpPercentage}%` }} 
                  />
                </div>
                <div className="flex justify-between text-[10px] font-black">
                  <span className="text-white/40 uppercase">Жизнь</span>
                  <span className="text-red-500">{character.hp}/{character.max_hp}</span>
                </div>
              </div>

              {/* XP Bar */}
              <div className="space-y-1">
                <div className="h-2.5 bg-black/60 border border-white/5 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-[#b8860b] to-[#ffd700] transition-all duration-1000 shadow-[0_0_10px_rgba(218,165,32,0.3)]" 
                    style={{ width: `${xpPercentage}%` }} 
                  />
                </div>
                <div className="flex justify-between text-[10px] font-black">
                  <span className="text-white/40 uppercase">Опыт</span>
                  <span className="text-[#daa520]">{character.xp}/{character.max_xp}</span>
                </div>
              </div>
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