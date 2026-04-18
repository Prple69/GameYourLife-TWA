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
