import React, { useState } from 'react';

// Принимаем объект videos из App.jsx
const InventoryPage = ({ character, videos }) => {
  const [selectedItem, setSelectedItem] = useState(null);

  const inventoryItems = [
    { id: 1, pos: 0, name: "Старый меч", icon: "🗡️", rarity: "common", stats: "+5 АТК", desc: "Побитый временем клинок." },
    { id: 2, pos: 1, name: "Лечебное зелье", icon: "🧪", rarity: "common", count: 3, desc: "Пахнет травами и надеждой." },
    { id: 3, pos: 5, name: "Кольцо Силы", icon: "💍", rarity: "rare", stats: "+2 СИЛ", desc: "Странно вибрирует на пальце." },
  ];

  const slots = Array.from({ length: 20 });

  return (
    <div className="fixed inset-0 w-full h-full bg-black overflow-hidden flex flex-col">
      
      {/* --- ЗАДНИЙ ФОН (ВИДЕО ЧЕРЕЗ BLOB) --- */}
      <div className="absolute inset-0 z-0 bg-black">
        <video 
          // Используем видео из памяти, если оно загружено, иначе ничего
          src={videos?.bag || ""} 
          autoPlay 
          loop 
          muted 
          playsInline
          className="w-full h-full object-cover opacity-50"
          style={{ 
            imageRendering: 'pixelated',
            // can help prevent color shifting on some mobile GPUs
            willChange: 'transform' 
          }}
        />
        {/* Более плотный градиент для защиты от "золотых" засветов */}
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black/20 to-black" />
      </div>

      {/* --- КОНТЕНТ --- */}
      <div className="relative z-10 flex flex-col h-full p-5 pb-32">
        
        {/* Шапка инвентаря */}
        <div className="flex justify-between items-center mb-6 border-l-4 border-[#0070dd] pl-3">
          <div>
            <h2 className="text-[#0070dd] text-2xl font-black uppercase tracking-tighter drop-shadow-[0_2px_2px_rgba(0,0,0,1)]">
              Рюкзак
            </h2>
            <p className="text-white/40 text-[8px] uppercase tracking-widest">Вес: 4.2 / 20.0 кг</p>
          </div>
        </div>

        {/* Сетка слотов */}
        <div className="grid grid-cols-4 gap-2 mb-6">
          {slots.map((_, index) => {
            const item = inventoryItems.find(i => i.pos === index);
            const isSelected = selectedItem?.pos === index;

            return (
              <div 
                key={index}
                onClick={() => item && setSelectedItem(item)}
                className={`
                  aspect-square border-2 flex items-center justify-center relative transition-all active:scale-95 select-none outline-none
                  ${item ? 'bg-black/80 border-white/20' : 'bg-black/40 border-white/5'}
                  ${isSelected ? 'border-[#f7d51d] shadow-[0_0_10px_rgba(247,213,29,0.3)]' : ''}
                `}
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                {item && (
                  <>
                    <span className="text-2xl drop-shadow-md">{item.icon}</span>
                    {item.count > 1 && (
                      <span className="absolute bottom-0 right-0.5 text-[9px] font-bold text-[#f7d51d]">
                        x{item.count}
                      </span>
                    )}
                    {item.rarity === 'rare' && (
                      <div className="absolute top-0.5 right-0.5 w-1 h-1 bg-cyan-400 rounded-full shadow-[0_0_3px_cyan]" />
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* --- ПАНЕЛЬ ИНФОРМАЦИИ (БЕЗ BACKDROP-BLUR) --- */}
        {/* Убрали backdrop-blur-md, чтобы не ломать цвета на фоне видео */}
        <div className="flex-1 bg-black/85 border-2 border-white/10 p-4 flex flex-col relative overflow-hidden shadow-2xl">
          {selectedItem ? (
            <>
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-[#f7d51d] font-bold uppercase text-sm tracking-tight">{selectedItem.name}</h3>
                <span className="text-cyan-400 text-[9px] font-bold uppercase">{selectedItem.stats}</span>
              </div>
              <p className="text-white/60 text-[10px] leading-relaxed italic">
                "{selectedItem.desc}"
              </p>
              <div className="mt-auto flex gap-2">
                <button className="flex-1 bg-white/5 hover:bg-white/10 text-white text-[10px] font-bold py-3 border border-white/10 uppercase outline-none active:bg-white/20 transition-colors" style={{ WebkitTapHighlightColor: 'transparent' }}>
                  Выбросить
                </button>
                <button className="flex-1 bg-[#0070dd] hover:bg-[#0084ff] text-white text-[10px] font-bold py-3 shadow-[2px_2px_0_#000] uppercase outline-none active:translate-y-0.5 transition-all" style={{ WebkitTapHighlightColor: 'transparent' }}>
                  Использовать
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center border border-dashed border-white/5">
              <p className="text-white/10 text-[9px] uppercase tracking-widest text-center">
                Выберите предмет <br/> в рюкзаке
              </p>
            </div>
          )}
          
          {/* Декор */}
          <div className="absolute top-0 right-0 w-4 h-4 bg-white/5 -rotate-45 translate-x-2 -translate-y-2" />
        </div>
      </div>
    </div>
  );
};

export default InventoryPage;