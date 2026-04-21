import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { shopService, inventoryService } from '../services/api';

const AvatarSelector = ({ isOpen, onClose, avatars, currentAvatar, onSelect }) => {
  const navigate = useNavigate();

  // Fetch shop catalog to know which skins are premium
  const { data: shopItems = [] } = useQuery({
    queryKey: ['shop-items'],
    queryFn: shopService.getCatalog,
    staleTime: 1000 * 60 * 5,
    enabled: isOpen,
  });

  // Fetch inventory to know which premium skins user owns
  const { data: inventoryItems = [] } = useQuery({
    queryKey: ['inventory'],
    queryFn: inventoryService.list,
    staleTime: 1000 * 60,
    enabled: isOpen,
  });

  if (!isOpen) return null;

  // Build sets for quick lookup
  const premiumSkins = shopItems.filter(s => s.item_type === 'skin');
  const premiumSkinsByKey = Object.fromEntries(premiumSkins.map(s => [s.avatar_key, s]));
  const ownedSkinKeys = new Set(
    inventoryItems
      .filter(inv => inv.shop_item?.item_type === 'skin')
      .map(inv => inv.shop_item?.avatar_key)
      .filter(Boolean)
  );

  const handleAvatarClick = (av) => {
    const isPremium = Boolean(premiumSkinsByKey[av.id]);
    const isOwned = ownedSkinKeys.has(av.id);

    if (isPremium && !isOwned) {
      // Navigate to shop skins tab
      onClose();
      navigate('/app/shop?filter=skins');
      return;
    }
    onSelect(av.id);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/90"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-sm bg-[#0a0a0a] border-2 border-white/20 p-6 shadow-[10px_10px_0_#000]">

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 w-10 h-10 bg-white text-black border-2 border-black flex items-center justify-center shadow-[4px_4px_0_#000] active:translate-y-0.5 active:shadow-none transition-all z-10"
        >
          <span className="text-2xl font-[1000]">×</span>
        </button>

        <h2 className="text-white text-xl font-[1000] uppercase tracking-tighter mb-8 text-center italic">
          СМЕНИТЬ ОБЛИК
        </h2>

        <div className="grid grid-cols-3 gap-4 mb-8">
          {avatars.map((av) => {
            const isPremium = Boolean(premiumSkinsByKey[av.id]);
            const isOwned = ownedSkinKeys.has(av.id);
            const isLocked = isPremium && !isOwned;
            const isSelected = currentAvatar === av.id;
            const premiumSkin = premiumSkinsByKey[av.id];

            return (
              <div
                key={av.id}
                onClick={() => handleAvatarClick(av)}
                className={`aspect-square border-2 cursor-pointer transition-all active:scale-95 relative overflow-hidden ${
                  isSelected
                    ? 'border-[#daa520] shadow-[0_0_15px_rgba(218,165,32,0.4)] z-10'
                    : isLocked
                      ? 'border-white/10'
                      : 'border-white/10 grayscale hover:grayscale-0'
                }`}
              >
                <img
                  src={av.img}
                  alt={av.label}
                  className={`w-full h-full object-cover ${isLocked ? 'grayscale' : ''}`}
                />

                {/* Selected indicator */}
                {isSelected && !isLocked && (
                  <div className="absolute inset-0 border-2 border-[#daa520] pointer-events-none" />
                )}

                {/* Lock overlay for unowned premium skins */}
                {isLocked && (
                  <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-xl leading-none">🔒</span>
                    {premiumSkin?.price_gold != null && (
                      <span className="text-[#daa520] text-[8px] font-black font-mono mt-1 uppercase">
                        {premiumSkin.price_gold}G
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <p className="text-white/30 text-[9px] uppercase font-[1000] text-center tracking-[0.2em]">
          ВЫБЕРИТЕ СВОЕГО ГЕРОЯ
        </p>
      </div>
    </div>
  );
};

export default AvatarSelector;
