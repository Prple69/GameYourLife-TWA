import React, { memo } from 'react';

const CharacterCard = ({ character, titles, avatarMap, onAvatarClick, onInfoClick }) => (
  <div className="flex items-center p-3 bg-bg-elev-1 backdrop-blur-2xl border border-border-3 rounded-xl w-full max-w-[400px] shadow-2xl">
    {/* АВАТАР */}
    <div
      className="relative w-20 h-20 sm:w-24 sm:h-24 shrink-0 cursor-pointer active:scale-95 transition-transform"
      onClick={onAvatarClick}
    >
      <div className="absolute inset-0 rounded-lg border border-gold-2/30 shadow-glow-gold" />
      <img
        src={avatarMap[character.selected_avatar] || avatarMap.avatar1}
        alt="Avatar"
        className="w-full h-full object-cover rounded-lg"
      />
      <div className="absolute -bottom-1 -right-1 bg-gold-2 p-1 rounded-md shadow-lg">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="black">
          <path d="M21 13h-8v8h-2v-8H3v-2h8V3h2v8h8v2z"/>
        </svg>
      </div>
    </div>

    {/* ИНФО */}
    <div className="ml-4 flex-1 cursor-pointer" onClick={onInfoClick}>
      <h3 className="text-text-1 text-lg font-black uppercase tracking-tighter leading-none">
        {character.username}
      </h3>
      <p className="text-gold-2 text-[10px] font-black mt-1 tracking-widest">
        {titles[character.char_class] || titles.knight}
      </p>
      <div className="mt-2 inline-block bg-bg-elev-2 px-2 py-0.5 rounded text-[10px] text-text-3 font-bold">
        LVL {character.lvl}
      </div>
    </div>
  </div>
);

export default memo(CharacterCard);
