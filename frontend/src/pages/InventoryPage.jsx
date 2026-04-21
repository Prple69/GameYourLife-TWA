import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { v4 as uuidv4 } from 'uuid';
import Header from '../components/Header';
import { inventoryService, userService } from '../services/api';

const BOOST_TYPES = [
  { key: 'xp', label: 'XP Буст', icon: '⚡', expAttr: 'active_xp_expires_at' },
  { key: 'gold', label: 'Gold Буст', icon: '🪙', expAttr: 'active_gold_expires_at' },
  { key: 'strength_xp', label: 'Сила XP', icon: '💪', expAttr: 'active_strength_xp_expires_at' },
  { key: 'wisdom_xp', label: 'Мудрость XP', icon: '📚', expAttr: 'active_wisdom_xp_expires_at' },
  { key: 'endurance_xp', label: 'Выносливость XP', icon: '🏃', expAttr: 'active_endurance_xp_expires_at' },
  { key: 'charisma_xp', label: 'Обаяние XP', icon: '✨', expAttr: 'active_charisma_xp_expires_at' },
  { key: 'hp_max', label: 'HP+', icon: '🛡️', expAttr: 'active_hp_max_expires_at' },
];

const BOOSTER_TYPE_MAP = {
  booster_xp: 'xp',
  booster_gold: 'gold',
  booster_strength_xp: 'strength_xp',
  booster_wisdom_xp: 'wisdom_xp',
  booster_endurance_xp: 'endurance_xp',
  booster_charisma_xp: 'charisma_xp',
  booster_hp_max: 'hp_max',
};

const Toast = ({ message, onDismiss }) => (
  <div
    className="fixed bottom-[150px] left-1/2 -translate-x-1/2 z-[90] bg-[#0a0a0a] border border-[#daa520]/40 px-5 py-3 shadow-[6px_6px_0_#000] font-mono text-center min-w-[220px]"
    onClick={onDismiss}
  >
    <span className="text-white text-[11px] uppercase font-black tracking-widest">{message}</span>
  </div>
);

const SectionHeader = ({ title }) => (
  <h3 className="font-mono uppercase tracking-widest text-[#daa520] text-[10px] font-black mt-5 mb-2 border-b border-[#daa520]/20 pb-1">
    {title}
  </h3>
);

const RetroStatus = ({ text }) => (
  <div className="min-h-screen bg-black flex items-center justify-center font-mono text-yellow-400 text-xs">
    {text}
  </div>
);

const InventoryPage = ({ videos }) => {
  const queryClient = useQueryClient();
  const [toast, setToast] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [now] = useState(new Date());

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const { data: inventoryItems = [], isLoading: inventoryLoading } = useQuery({
    queryKey: ['inventory'],
    queryFn: inventoryService.list,
    staleTime: 1000 * 30,
  });

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['user'],
    queryFn: userService.getProfile,
    staleTime: 1000 * 60,
  });

  if (inventoryLoading || userLoading) return <RetroStatus text="ЗАГРУЗКА РЮКЗАКА..." />;

  // Active effects derived from user boost fields
  const activeEffects = BOOST_TYPES.filter(b => {
    const expVal = user?.[b.expAttr];
    return expVal && new Date(expVal) > now;
  }).map(b => {
    const seconds = Math.max(0, (new Date(user[b.expAttr]) - now) / 1000);
    const mm = Math.floor(seconds / 60);
    const ss = Math.floor(seconds % 60);
    return { ...b, timer: `${mm}:${ss.toString().padStart(2, '0')}` };
  });

  // Partition inventory
  const boosters = inventoryItems.filter(inv => inv.shop_item?.item_type?.startsWith('booster_'));
  const skins = inventoryItems.filter(inv => inv.shop_item?.item_type === 'skin');
  const potions = inventoryItems.filter(inv => inv.shop_item?.item_type === 'potion_heal');

  const isBoostActive = (itemType) => {
    const boostKey = BOOSTER_TYPE_MAP[itemType];
    if (!boostKey) return false;
    const bt = BOOST_TYPES.find(b => b.key === boostKey);
    if (!bt) return false;
    return user?.[bt.expAttr] && new Date(user[bt.expAttr]) > now;
  };

  const handleActivate = async (inv) => {
    try {
      await inventoryService.activate(inv.id, { idempotency_key: uuidv4() });
      queryClient.invalidateQueries({ queryKey: ['user'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      showToast(`${inv.shop_item?.name} активирован!`);
    } catch (err) {
      const code = err?.response?.data?.detail;
      if (code === 'already_active') {
        showToast('Этот буст уже активен');
      } else {
        showToast('Ошибка активации');
      }
    }
  };

  const handleUsePotion = async (inv) => {
    try {
      const result = await inventoryService.activate(inv.id, { idempotency_key: uuidv4() });
      queryClient.invalidateQueries({ queryKey: ['user'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      showToast(`+${result.healed ?? ''} HP восстановлено`);
    } catch (err) {
      showToast('Ошибка использования');
    }
  };

  const handleEquip = async (inv) => {
    const avatarKey = inv.shop_item?.avatar_key;
    try {
      await inventoryService.equip(inv.id, { idempotency_key: uuidv4() });
      queryClient.setQueryData(['user'], prev =>
        prev ? { ...prev, selected_avatar: avatarKey } : prev
      );
      showToast(`Скин экипирован: ${inv.shop_item?.name}`);
    } catch (err) {
      showToast('Ошибка экипировки');
    }
  };

  const cardClass = 'border border-[#333] bg-black/60 shadow-[2px_2px_0_#000] p-3 flex items-center gap-3';

  return (
    <div className="min-h-screen w-full bg-black flex flex-col font-mono relative overflow-hidden">

      {/* BACKGROUND */}
      <div className="absolute inset-0 z-0 bg-black">
        {videos?.bag && (
          <video
            src={videos.bag}
            autoPlay loop muted playsInline
            className="w-full h-full object-cover opacity-60"
            style={{ imageRendering: 'pixelated' }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-transparent to-black" />
      </div>

      {/* CONTENT */}
      <div className="relative z-10 flex flex-col h-full px-4 pb-4">
        <Header title="РЮКЗАК" subtitle="ИНВЕНТАРЬ" />

        <div
          className="flex-1 overflow-y-auto mt-2 pr-1 custom-scrollbar"
          style={{ marginBottom: 'calc(130px + env(safe-area-inset-bottom, 0px))' }}
        >

          {/* SECTION: ACTIVE EFFECTS */}
          <SectionHeader title="Активные эффекты" />
          {activeEffects.length === 0 ? (
            <p className="text-white/30 text-[10px] uppercase tracking-widest py-2">Нет активных эффектов</p>
          ) : (
            <div className="flex flex-col gap-2">
              {activeEffects.map(eff => (
                <div key={eff.key} className={cardClass}>
                  <span className="text-2xl">{eff.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[#daa520] font-black text-[11px] uppercase tracking-widest truncate">{eff.label}</p>
                  </div>
                  <span className="font-mono text-white text-xs border border-[#daa520]/40 px-2 py-0.5 text-[#daa520]">
                    {eff.timer}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* SECTION: BOOSTERS */}
          <SectionHeader title="Бусты" />
          {boosters.length === 0 ? (
            <p className="text-white/30 text-[10px] uppercase tracking-widest py-2">Нет бустов</p>
          ) : (
            <div className="flex flex-col gap-2">
              {boosters.map(inv => {
                const item = inv.shop_item;
                const active = isBoostActive(item?.item_type);
                return (
                  <div
                    key={inv.id}
                    className={cardClass + ' cursor-pointer'}
                    onClick={() => setSelectedItem({ ...item, invId: inv.id, quantity: inv.quantity, type: 'booster' })}
                  >
                    <span className="text-2xl">{item?.icon || '⚡'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[#daa520] font-black text-[11px] uppercase tracking-widest truncate">{item?.name}</p>
                      {inv.quantity > 1 && (
                        <span className="text-white/40 text-[9px]">x{inv.quantity}</span>
                      )}
                    </div>
                    <button
                      disabled={active}
                      onClick={e => { e.stopPropagation(); handleActivate(inv); }}
                      className={`px-3 py-1 text-[9px] font-black uppercase border transition-all
                        ${active
                          ? 'border-white/10 text-white/20 cursor-not-allowed'
                          : 'bg-[#daa520] text-black border-[#daa520] active:opacity-80'
                        }`}
                    >
                      {active ? 'Активен' : 'Активировать'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* SECTION: SKINS */}
          <SectionHeader title="Скины" />
          {skins.length === 0 ? (
            <p className="text-white/30 text-[10px] uppercase tracking-widest py-2">Нет скинов</p>
          ) : (
            <div className="flex flex-col gap-2">
              {skins.map(inv => {
                const item = inv.shop_item;
                const isEquipped = item?.avatar_key === user?.selected_avatar;
                return (
                  <div
                    key={inv.id}
                    className={cardClass + ' cursor-pointer'}
                    onClick={() => setSelectedItem({ ...item, invId: inv.id, type: 'skin' })}
                  >
                    <span className="text-2xl">{item?.icon || '🎭'}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`font-black text-[11px] uppercase tracking-widest truncate ${isEquipped ? 'text-[#daa520]' : 'text-white/80'}`}>
                        {item?.name}
                      </p>
                      {isEquipped && <span className="text-[8px] text-[#daa520]/60 uppercase">Экипирован</span>}
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); handleEquip(inv); }}
                      className={`px-3 py-1 text-[9px] font-black uppercase border transition-all
                        ${isEquipped
                          ? 'border-[#daa520] text-[#daa520] bg-[#daa520]/10'
                          : 'border-white/20 text-white/60 active:bg-white/5'
                        }`}
                    >
                      {isEquipped ? 'Экипирован' : 'Экипировать'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* SECTION: POTIONS */}
          <SectionHeader title="Зелья" />
          {potions.length === 0 ? (
            <p className="text-white/30 text-[10px] uppercase tracking-widest py-2">Нет зелий</p>
          ) : (
            <div className="flex flex-col gap-2">
              {potions.map(inv => {
                const item = inv.shop_item;
                return (
                  <div
                    key={inv.id}
                    className={cardClass + ' cursor-pointer'}
                    onClick={() => setSelectedItem({ ...item, invId: inv.id, quantity: inv.quantity, type: 'potion' })}
                  >
                    <span className="text-2xl">{item?.icon || '🧪'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[#daa520] font-black text-[11px] uppercase tracking-widest truncate">{item?.name}</p>
                      <span className="text-white/40 text-[9px]">x{inv.quantity}</span>
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); handleUsePotion(inv); }}
                      className="px-3 py-1 text-[9px] font-black uppercase bg-[#daa520] text-black border border-[#daa520] active:opacity-80 transition-all"
                    >
                      Использовать
                    </button>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      </div>

      {/* ITEM DETAIL MODAL */}
      {selectedItem && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center p-6 animate-in fade-in zoom-in duration-200">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
            onClick={() => setSelectedItem(null)}
          />
          <div className="relative w-full max-w-sm bg-[#0a0a0a] border-2 border-[#daa520] shadow-[10px_10px_0_#000] p-6 flex flex-col">
            <button
              onClick={() => setSelectedItem(null)}
              className="absolute -top-3 -right-3 w-10 h-10 bg-[#daa520] text-black border-2 border-black flex items-center justify-center shadow-[4px_4px_0_#000] active:translate-y-0.5 active:shadow-none transition-all"
            >
              <span className="text-2xl font-[1000] leading-none">×</span>
            </button>

            <div className="flex flex-col items-center mb-6">
              <div className="w-24 h-24 bg-black border-2 border-white/10 flex items-center justify-center text-6xl mb-4 shadow-[inset_0_0_20px_rgba(0,0,0,1)]">
                {selectedItem.icon || '🎁'}
              </div>
              <h3 className="text-[#daa520] font-[1000] uppercase text-2xl tracking-tighter text-center">
                {selectedItem.name}
              </h3>
              {selectedItem.quantity > 1 && (
                <span className="text-white/40 text-[10px] mt-1">x{selectedItem.quantity}</span>
              )}
            </div>

            <p className="text-white/70 text-sm leading-snug font-bold uppercase tracking-tight text-center mb-8 px-2">
              {selectedItem.description}
            </p>

            <div className="flex flex-col gap-3">
              {selectedItem.type === 'booster' && (
                <button
                  onClick={() => {
                    const inv = boosters.find(i => i.id === selectedItem.invId);
                    if (inv) handleActivate(inv);
                    setSelectedItem(null);
                  }}
                  disabled={isBoostActive(selectedItem.item_type)}
                  className="w-full bg-[#daa520] text-black font-[1000] py-4 shadow-[4px_4px_0_#000] border-2 border-black uppercase active:translate-y-1 active:shadow-none transition-all disabled:opacity-50"
                >
                  Активировать
                </button>
              )}
              {selectedItem.type === 'skin' && (
                <button
                  onClick={() => {
                    const inv = skins.find(i => i.id === selectedItem.invId);
                    if (inv) handleEquip(inv);
                    setSelectedItem(null);
                  }}
                  className="w-full bg-[#daa520] text-black font-[1000] py-4 shadow-[4px_4px_0_#000] border-2 border-black uppercase active:translate-y-1 active:shadow-none transition-all"
                >
                  Экипировать
                </button>
              )}
              {selectedItem.type === 'potion' && (
                <button
                  onClick={() => {
                    const inv = potions.find(i => i.id === selectedItem.invId);
                    if (inv) handleUsePotion(inv);
                    setSelectedItem(null);
                  }}
                  className="w-full bg-[#daa520] text-black font-[1000] py-4 shadow-[4px_4px_0_#000] border-2 border-black uppercase active:translate-y-1 active:shadow-none transition-all"
                >
                  Использовать
                </button>
              )}
              <button
                onClick={() => setSelectedItem(null)}
                className="w-full bg-black text-white/40 font-[1000] py-3 border-2 border-white/10 uppercase active:bg-white/5 transition-colors"
              >
                Назад
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}

      <div className="absolute inset-x-0 bottom-0 h-40 pointer-events-none bg-gradient-to-t from-black via-transparent to-transparent z-0 opacity-80" />
    </div>
  );
};

export default InventoryPage;
