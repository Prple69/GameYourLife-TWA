import React, { useState } from 'react';
import Header from '../components/Header';

const InventoryPage = ({ character, videos }) => {
  const [selectedItem, setSelectedItem] = useState(null);

  const inventoryItems = [
    { id: 1, pos: 0, name: "Старый меч", icon: "🗡️", rarity: "common", stats: "+5 АТК", desc: "Побитый временем клинок." },
    { id: 2, pos: 1, name: "Лечебное зелье", icon: "🧪", rarity: "common", count: 3, desc: "Пахнет травами и надеждой." },
    { id: 3, pos: 5, name: "Кольцо Силы", icon: "💍", rarity: "rare", stats: "+2 СИЛ", desc: "Странно вибрирует на пальце." },
  ];

  const slots = Array.from({ length: 20 });

  return (
    <div className="fixed inset-0 w-full h-full bg-black overflow-hidden flex flex-col font-mono">
      
      {/* --- ЗАДНИЙ ФОН --- */}
      <div className="absolute inset-0 z-0 bg-black">
        <video 
          src={videos?.bag || ""} 
          autoPlay loop muted playsInline
          className="w-full h-full object-cover opacity-60"
          style={{ imageRendering: 'pixelated' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black" />
      </div>

      {/* --- КОНТЕНТ --- */}
      <div className="relative z-10 flex flex-col h-full p-5 pb-24">
        
        {/* Используем наш Header. pt=64 по умолчанию, либо впиши свое число */}
        <Header 
          title="Рюкзак" 
          subtitle="Вес: 4.2 / 20.0 кг" 
          pt={64} 
        />

        {/* Сетка слотов */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {slots.map((_, index) => {
            const item = inventoryItems.find(i => i.pos === index);
            const isSelected = selectedItem?.pos === index;

            return (
              <div 
                key={index}
                onClick={() => item && setSelectedItem(item)}
                className={`
                  aspect-square border-2 flex items-center justify-center relative transition-all active:scale-95
                  ${item ? 'bg-black/60 border-white/20' : 'bg-black/20 border-white/5'}
                  ${isSelected ? 'border-[#daa520] bg-[#daa520]/10' : ''}
                `}
              >
                {item && (
                  <>
                    <span className="text-2xl drop-shadow-md">{item.icon}</span>
                    {item.count > 1 && (
                      <span className="absolute bottom-0 right-0.5 text-[9px] font-black text-[#daa520] bg-black/80 px-0.5">
                        x{item.count}
                      </span>
                    )}
                    {item.rarity === 'rare' && (
                      <div className="absolute top-0.5 right-0.5 w-1 h-1 bg-[#daa520]" />
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* --- ПАНЕЛЬ ИНФОРМАЦИИ --- */}
        <div className="flex-1 bg-black/80 border-2 border-[#333] p-4 flex flex-col relative shadow-[4px_4px_0_#000]">
          {selectedItem ? (
            <>
              <div className="flex justify-between items-start mb-2 border-b border-white/5 pb-2">
                <div className="flex flex-col">
                  <h3 className="text-[#daa520] font-black uppercase text-xs tracking-tight">
                    {selectedItem.name}
                  </h3>
                  <span className="text-white/20 text-[7px] uppercase tracking-widest">
                    Предмет
                  </span>
                </div>
                <span className="text-[#daa520] text-[9px] font-black uppercase bg-[#daa520]/10 px-1">
                  {selectedItem.stats}
                </span>
              </div>
              
              <p className="text-gray-400 text-[10px] leading-relaxed italic mb-4">
                "{selectedItem.desc}"
              </p>

              <div className="mt-auto flex gap-2">
                <button className="flex-1 bg-black text-[#aa0000] text-[9px] font-black py-3 border border-[#aa0000]/30 uppercase active:bg-[#aa0000]/10 transition-colors">
                  Выбросить
                </button>
                <button className="flex-1 bg-[#daa520] text-black text-[9px] font-black py-3 shadow-[2px_2px_0_#000] uppercase active:translate-y-0.5 transition-all">
                  Использовать
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-white/10 text-[8px] uppercase tracking-[0.3em] text-center leading-loose">
                Выберите предмет <br/> для осмотра
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Нижняя виньетка */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black via-transparent to-transparent opacity-50" />
    </div>
  );
};

export default InventoryPage;