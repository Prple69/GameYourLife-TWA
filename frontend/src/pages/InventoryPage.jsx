import React, { useState } from 'react';
import Header from '../components/Header';

const InventoryPage = ({ character, videos }) => {
  const [selectedItem, setSelectedItem] = useState(null);

  const inventoryItems = [
    { id: 1, pos: 0, name: "Старый меч", icon: "🗡️", rarity: "common", stats: "+5 АТК", desc: "Побитый временем клинок, который еще способен проливать кровь врагов." },
    { id: 2, pos: 1, name: "Лечебное зелье", icon: "🧪", rarity: "common", count: 3, desc: "Горький отвар. Пахнет дикими травами и слабой надеждой на спасение." },
    { id: 3, pos: 5, name: "Кольцо Силы", icon: "💍", rarity: "rare", stats: "+2 СИЛ", desc: "Странно вибрирует на пальце. Кажется, оно само выбирает владельца." },
  ];

  const slots = Array.from({ length: 24 }); // Увеличил кол-во слотов, раз теперь есть место

  return (
    <div className="min-h-screen w-full bg-black flex flex-col font-mono relative overflow-hidden">
      
      {/* --- ЗАДНИЙ ФОН --- */}
      <div className="absolute inset-0 z-0 bg-black">
        <video 
          src={videos?.bag || ""} 
          autoPlay loop muted playsInline
          className="w-full h-full object-cover opacity-60"
          style={{ imageRendering: 'pixelated' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-transparent to-black" />
      </div>

      {/* --- КОНТЕНТ --- */}
      <div className="relative z-10 flex flex-col h-full px-4 pb-24">
        
        <Header 
          title="РЮКЗАК" 
          subtitle="ВЕС: 4.2 / 20.0 КГ" 
        />

        {/* СЕТКА СЛОТОВ (Теперь занимает больше места) */}
        <div className="flex-1 overflow-y-auto mt-4 pr-1 custom-scrollbar">
          <div className="grid grid-cols-4 gap-2.5 pb-10">
            {slots.map((_, index) => {
              const item = inventoryItems.find(i => i.pos === index);

              return (
                <div 
                  key={index}
                  onClick={() => item && setSelectedItem(item)}
                  className={`
                    aspect-square border-2 flex items-center justify-center relative transition-all active:scale-90
                    ${item ? 'bg-black/80 border-white/20' : 'bg-black/20 border-white/5'}
                  `}
                >
                  {item && (
                    <>
                      <span className="text-3xl md:text-5xl drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">{item.icon}</span>
                      {item.count > 1 && (
                        <span className="absolute bottom-1 right-1 text-[10px] md:text-xs font-[1000] text-white bg-black/90 px-1 border border-white/10">
                          x{item.count}
                        </span>
                      )}
                      {item.rarity === 'rare' && (
                        <div className="absolute top-1 right-1 w-2 h-2 bg-[#daa520] shadow-[0_0_8px_#daa520]" />
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* --- МОДАЛЬНОЕ ОКНО ПРЕДМЕТА --- */}
      {selectedItem && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center p-6 animate-in fade-in zoom-in duration-200">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-md" 
            onClick={() => setSelectedItem(null)}
          />
          
          {/* Карточка предмета */}
          <div className="relative w-full max-w-sm bg-[#0a0a0a] border-2 border-[#daa520] shadow-[10px_10px_0_#000] p-6 flex flex-col">
            
            {/* КНОПКА ЗАКРЫТИЯ (КРЕСТИК) */}
            <button 
              onClick={() => setSelectedItem(null)}
              className="absolute -top-3 -right-3 w-10 h-10 bg-[#daa520] text-black border-2 border-black flex items-center justify-center shadow-[4px_4px_0_#000] active:translate-y-0.5 active:shadow-none transition-all"
            >
              <span className="text-2xl font-[1000] leading-none">×</span>
            </button>

            {/* Иконка и Тип */}
            <div className="flex flex-col items-center mb-6">
              <div className="w-24 h-24 bg-black border-2 border-white/10 flex items-center justify-center text-6xl mb-4 shadow-[inset_0_0_20px_rgba(0,0,0,1)]">
                {selectedItem.icon}
              </div>
              <h3 className="text-[#daa520] font-[1000] uppercase text-2xl md:text-3xl tracking-tighter text-center">
                {selectedItem.name}
              </h3>
              <div className="mt-2 bg-[#daa520]/10 border border-[#daa520]/40 px-3 py-1">
                <span className="text-[#daa520] text-xs font-[1000] uppercase tracking-widest">
                  {selectedItem.stats}
                </span>
              </div>
            </div>

            {/* Описание */}
            <p className="text-white/70 text-sm md:text-base leading-snug font-bold uppercase tracking-tight text-center mb-8 px-2">
              {selectedItem.desc}
            </p>

            {/* Кнопки действий */}
            <div className="flex flex-col gap-3">
              <button className="w-full bg-[#daa520] text-black font-[1000] py-4 shadow-[4px_4px_0_#000] border-2 border-black uppercase active:translate-y-1 active:shadow-none transition-all">
                Использовать
              </button>
              <button 
                onClick={() => setSelectedItem(null)}
                className="w-full bg-black text-white/40 font-[1000] py-3 border-2 border-white/10 uppercase active:bg-white/5 transition-colors"
              >
                Назад
              </button>
              <button className="w-full mt-2 text-[#ff3030]/50 hover:text-[#ff3030] text-[10px] font-[1000] uppercase tracking-[0.2em] transition-colors">
                Выбросить предмет
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Нижняя виньетка */}
      <div className="absolute inset-x-0 bottom-0 h-40 pointer-events-none bg-gradient-to-t from-black via-transparent to-transparent z-0 opacity-80" />
    </div>
  );
};

export default InventoryPage;