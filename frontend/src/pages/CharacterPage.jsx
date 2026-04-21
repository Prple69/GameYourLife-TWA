import React, { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Header from '../components/Header';
import AvatarSelector from '../components/AvatarSelector';
import ProfileModal from '../components/ProfileModal';
import ProgressBar from '../components/ProgressBar';
import CharacterCard from '../components/CharacterCard';
import api, { userService } from '../services/api';

import avatar1 from '../assets/avatar1.png';
import avatar2 from '../assets/avatar2.png';
import avatar3 from '../assets/avatar3.png';

const avatarMap = { avatar1, avatar2, avatar3 };

// Phase 4: mirror backend max_xp_for_level formula (ensure single source in tests eventually)
const maxXpForStatLevel = (lvl) =>
  Math.max(1, Math.round(10 * Math.pow(1.2, Math.max(1, lvl) - 1)));

const STAT_META = [
  { key: 'strength',  label: 'СИЛА',         labelColor: 'text-red-500',    barClass: 'bg-gradient-to-r from-red-600 to-red-400',       shadow: 'rgba(239,68,68,0.5)' },
  { key: 'endurance', label: 'ВЫНОСЛИВОСТЬ', labelColor: 'text-green-500',  barClass: 'bg-gradient-to-r from-green-600 to-green-400',   shadow: 'rgba(34,197,94,0.5)' },
  { key: 'wisdom',    label: 'МУДРОСТЬ',     labelColor: 'text-blue-500',   barClass: 'bg-gradient-to-r from-blue-600 to-blue-400',     shadow: 'rgba(59,130,246,0.5)' },
  { key: 'charisma',  label: 'ОБАЯНИЕ',      labelColor: 'text-yellow-500', barClass: 'bg-gradient-to-r from-yellow-600 to-yellow-400', shadow: 'rgba(234,179,8,0.5)' },
];

const TITLES = {
  knight: 'РЫЦАРЬ СМЕРТИ',
  mage: 'ВЕРХОВНАЯ МАГИНЯ',
  shadow: 'ПРИЗРАК ПУСТОШИ',
};

const AVATARS = [
  { id: 'avatar1', img: avatar1, label: 'Рыцарь' },
  { id: 'avatar2', img: avatar2, label: 'Маг' },
  { id: 'avatar3', img: avatar3, label: 'Тень' },
];

const RetroStatus = ({ text }) => (
  <div
    className="min-h-screen bg-black flex items-center justify-center font-mono text-yellow-400 text-xs"
    style={{ fontFamily: "'Press Start 2P', monospace" }}
  >
    {text}
  </div>
);

const CharacterPage = () => {
  const queryClient = useQueryClient();
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const {
    data: character,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['user'],
    queryFn: () => api.get('/user/me').then((r) => r.data),
    staleTime: 1000 * 60,
  });

  const handleAvatarChange = useCallback(
    async (avatarId) => {
      const prev = character?.selected_avatar;
      queryClient.setQueryData(['user'], (old) =>
        old ? { ...old, selected_avatar: avatarId } : old
      );
      setIsSelectorOpen(false);
      try {
        const updated = await userService.updateAvatar(avatarId);
        if (updated) queryClient.setQueryData(['user'], updated);
      } catch (err) {
        console.error(err);
        queryClient.setQueryData(['user'], (old) =>
          old ? { ...old, selected_avatar: prev } : old
        );
      }
    },
    [character?.selected_avatar, queryClient]
  );

  if (isLoading) return <RetroStatus text="ЗАГРУЗКА ПЕРСОНАЖА..." />;
  if (isError || !character) return <RetroStatus text="ОШИБКА ЗАГРУЗКИ" />;

  return (
    <div className="min-h-screen w-full bg-black flex flex-col font-mono relative overflow-hidden">
      <div className="absolute inset-0 z-0 bg-black">
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black" />
      </div>

      <Header title="ЛАГЕРЬ" subtitle="ПРОФИЛЬ" />

      <div className="relative z-20 flex flex-col items-center w-full px-6 mt-4">
        <CharacterCard
          character={character}
          titles={TITLES}
          avatarMap={avatarMap}
          onAvatarClick={() => setIsSelectorOpen(true)}
          onInfoClick={() => setIsProfileOpen(true)}
        />

        <div className="w-full max-w-[400px] mt-3 px-2 space-y-4">
          <ProgressBar
            label="Жизнь"
            value={character.hp}
            max={character.max_hp}
            labelColor="text-red-500"
            barClass="bg-gradient-to-r from-red-600 to-red-400"
            shadowColor="rgba(239,68,68,0.5)"
          />
          <ProgressBar
            label="Опыт"
            value={character.xp}
            max={character.max_xp}
            labelColor="text-[#daa520]"
            barClass="bg-gradient-to-r from-[#b8860b] to-[#ffd700]"
            shadowColor="rgba(218,165,32,0.5)"
          />
        </div>

        <div className="w-full max-w-[400px] mt-4 px-2 grid grid-cols-2 gap-3">
          {STAT_META.map(({ key, label, labelColor, barClass, shadow }) => {
            const level = character[`stat_${key}_level`] ?? 1;
            const xp = character[`stat_${key}_xp`] ?? 0;
            const maxXp = maxXpForStatLevel(level);
            return (
              <div key={key} className="bg-white/5 border border-white/10 p-2 space-y-1">
                <div className="flex justify-between text-[9px] font-black uppercase tracking-widest">
                  <span className={labelColor}>{label}</span>
                  <span className="text-white/60 tabular-nums">LVL {level}</span>
                </div>
                <ProgressBar
                  label=""
                  value={xp}
                  max={maxXp}
                  labelColor={labelColor}
                  barClass={barClass}
                  shadowColor={shadow}
                />
              </div>
            );
          })}
        </div>
      </div>

      <AvatarSelector
        isOpen={isSelectorOpen}
        onClose={() => setIsSelectorOpen(false)}
        avatars={AVATARS}
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
