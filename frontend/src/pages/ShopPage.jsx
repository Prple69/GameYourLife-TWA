import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { v4 as uuidv4 } from 'uuid';
import Header from '../components/Header';
import { shopService, userService } from '../services/api';

const FILTERS = [
  { key: 'all', label: 'Все' },
  { key: 'boosters', label: 'Бусты' },
  { key: 'skins', label: 'Скины' },
  { key: 'potions', label: 'Зелья' },
];

const filterItems = (items, filter) => {
  if (filter === 'all') return items;
  if (filter === 'boosters') return items.filter(i => i.item_type.startsWith('booster_'));
  if (filter === 'skins') return items.filter(i => i.item_type === 'skin');
  if (filter === 'potions') return items.filter(i => i.item_type === 'potion_heal');
  return items;
};

const Toast = ({ message, onDismiss }) => (
  <div
    className="fixed bottom-[150px] left-1/2 -translate-x-1/2 z-[90] bg-[#0a0a0a] border border-[#daa520]/40 px-5 py-3 shadow-[6px_6px_0_#000] font-mono text-center min-w-[220px]"
    onClick={onDismiss}
  >
    <span className="text-white text-[11px] uppercase font-black tracking-widest">{message}</span>
  </div>
);

const ShopPage = ({ videos }) => {
  const queryClient = useQueryClient();
  const [activeFilter, setActiveFilter] = useState('all');
  const [confirmItem, setConfirmItem] = useState(null);
  const [buying, setBuying] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const { data: items = [], isLoading: itemsLoading } = useQuery({
    queryKey: ['shop-items'],
    queryFn: shopService.getCatalog,
    staleTime: 1000 * 60 * 5,
  });

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: userService.getProfile,
    staleTime: 1000 * 60,
  });

  const filteredItems = filterItems(items, activeFilter);

  const handleBuyClick = (item) => {
    if (!user || user.gold < item.price_gold) {
      showToast(`Не хватает gold (есть: ${user?.gold ?? 0}, нужно: ${item.price_gold})`);
      return;
    }
    setConfirmItem(item);
  };

  const handleConfirmBuy = async () => {
    if (!confirmItem) return;
    setBuying(true);
    try {
      const idempotency_key = uuidv4();
      const result = await shopService.buy(confirmItem.id, { idempotency_key });
      queryClient.setQueryData(['user'], (prev) =>
        prev ? { ...prev, gold: result.gold_remaining } : prev
      );
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      showToast(`Куплено: ${result.item_name} ✓`);
      setConfirmItem(null);
    } catch (err) {
      const code = err?.response?.data?.detail;
      if (code === 'already_owned') {
        showToast('Этот скин уже у тебя');
      } else if (code === 'insufficient_gold') {
        showToast('Не хватает gold');
      } else {
        showToast('Ошибка покупки');
      }
    } finally {
      setBuying(false);
    }
  };

  const glassStyle = {
    WebkitBackdropFilter: 'blur(8px)',
    backdropFilter: 'blur(8px)',
  };

  return (
    <div className="min-h-screen w-full bg-black flex flex-col font-mono items-center relative overflow-hidden">

      {/* BACKGROUND */}
      <div className="absolute inset-0 z-0">
        {videos?.shop && (
          <video
            src={videos.shop}
            autoPlay loop muted playsInline
            className="w-full h-full object-cover opacity-60"
            style={{ imageRendering: 'pixelated' }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-transparent to-black" />
      </div>

      {/* CONTENT */}
      <div className="relative z-10 flex flex-col items-center w-[92%] h-full">

        <div className="w-full shrink-0 text-center">
          <Header title="ЛАВКА" subtitle="ТОРГОВЕЦ РЕДКОСТЯМИ" />
        </div>

        {/* BALANCE */}
        <div className="w-full max-w-md flex justify-start mt-4 mb-3 shrink-0">
          <div
            style={glassStyle}
            className="bg-black/60 border-2 border-[#daa520] px-4 py-2 flex items-center gap-3 shadow-[0_0_15px_rgba(218,165,32,0.2)]"
          >
            <div className="w-4 h-4 bg-[#daa520] rotate-45 border border-black shadow-[0_0_8px_#daa520] shrink-0" />
            <span className="text-[#daa520] text-xl font-black tabular-nums">
              {user?.gold ?? '—'}
              <span className="text-[12px] ml-1 opacity-80 uppercase">Gold</span>
            </span>
          </div>
        </div>

        {/* FILTER TABS */}
        <div className="w-full max-w-md flex gap-2 mb-3 shrink-0 flex-wrap">
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key)}
              className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest border transition-all
                ${activeFilter === f.key
                  ? 'bg-[#daa520] text-black border-[#daa520]'
                  : 'bg-transparent text-[#daa520] border-[#daa520]/50 hover:border-[#daa520]'
                }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* ITEMS LIST */}
        <div
          className="w-full max-w-md flex-1 flex flex-col overflow-hidden relative"
          style={{ marginBottom: 'calc(130px + env(safe-area-inset-bottom, 0px))' }}
        >
          <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
            {itemsLoading ? (
              <div className="text-center py-10 text-[#daa520]/60 text-[10px] uppercase tracking-widest font-black">
                Загрузка...
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-10 text-white/30 text-[10px] uppercase tracking-widest">
                Нет товаров
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {filteredItems.map(item => {
                  const canAfford = user && user.gold >= item.price_gold;
                  return (
                    <div
                      key={item.id}
                      style={glassStyle}
                      className="bg-black/65 border border-white/10 p-4 flex items-center gap-4 active:scale-[0.98] transition-all shadow-lg relative overflow-hidden group shrink-0"
                    >
                      {/* ICON */}
                      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-black/40 border-2 border-[#daa520]/20 flex items-center justify-center text-3xl sm:text-4xl shrink-0 shadow-[inset_0_0_15px_rgba(0,0,0,0.8)]">
                        <span className="drop-shadow-[0_0_10px_rgba(255,255,255,0.2)] group-hover:scale-110 transition-transform">
                          {item.icon || '🎁'}
                        </span>
                      </div>

                      {/* DESCRIPTION */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-[#daa520] font-black text-lg sm:text-xl uppercase tracking-tighter leading-none truncate mb-2">
                          {item.name}
                        </h3>
                        <p className="text-[#F5F5F0]/60 text-[10px] sm:text-[12px] leading-tight font-bold uppercase tracking-tight italic">
                          {item.description}
                        </p>
                      </div>

                      {/* BUY BUTTON */}
                      <button
                        onClick={() => handleBuyClick(item)}
                        className={`h-12 px-4 sm:px-6 font-black text-sm sm:text-lg uppercase shadow-[0_3px_0_#966e00] active:shadow-none active:translate-y-0.5 transition-all outline-none border border-black/20
                          ${canAfford
                            ? 'bg-[#daa520] text-black'
                            : 'bg-[#daa520]/30 text-red-400 opacity-50 cursor-not-allowed'
                          }`}
                        style={{ WebkitTapHighlightColor: 'transparent' }}
                      >
                        {item.price_gold}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-[80%] h-6 bg-[#daa520]/10 blur-xl pointer-events-none" />
        </div>
      </div>

      {/* CONFIRM MODAL */}
      {confirmItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-md bg-black/80">
          <div className="w-full max-w-sm bg-[#111] border-2 border-[#daa520] p-6 shadow-[10px_10px_0px_#000]">
            <h2 className="text-[#daa520] text-xl font-black uppercase mb-4 tracking-tighter text-center">
              Подтверждение
            </h2>
            <p className="text-white/80 text-center mb-8 uppercase text-[10px] font-bold leading-relaxed font-mono">
              Купить &laquo;{confirmItem.name}&raquo; за{' '}
              <span className="text-[#daa520]">{confirmItem.price_gold} gold</span>?
            </p>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setConfirmItem(null)}
                disabled={buying}
                className="py-3 border border-white/20 text-white/40 font-black uppercase text-[10px] active:bg-white/5"
              >
                ОТМЕНА
              </button>
              <button
                onClick={handleConfirmBuy}
                disabled={buying}
                className="py-3 bg-[#daa520] text-black font-black uppercase text-[10px] shadow-[3px_3px_0px_#000] active:translate-y-0.5 active:shadow-none disabled:opacity-50"
              >
                {buying ? '...' : 'КУПИТЬ'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}

      <div className="absolute inset-x-0 bottom-0 h-40 pointer-events-none bg-gradient-to-t from-black via-transparent to-transparent z-0" />
    </div>
  );
};

export default ShopPage;
