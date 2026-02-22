import React from 'react';
import Header from '../components/Header';

const ShopPage = ({ gold = 450, videos }) => {
  const items = [
    { id: 1, name: "Перо Феникса", price: 200, icon: "🔥", desc: "Дарует вторую жизнь после смерти" },
    { id: 2, name: "Клевер удачи", price: 150, icon: "🍀", desc: "Увеличивает получаемый опыт в 1.5 раза" },
  ];

  return (
    <div className="fixed inset-0 w-full h-full bg-black overflow-hidden flex flex-col font-mono">
      
      {/* --- ЗАДНИЙ ФОН --- */}
      <div className="absolute inset-0 z-0 bg-black">
        <video
          src={videos?.shop || ""}
          autoPlay loop muted playsInline
          className="w-full h-full object-cover opacity-60"
          style={{ imageRendering: 'pixelated' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black" />
      </div>

      {/* --- КОНТЕНТ --- */}
      <div className="relative z-10 flex flex-col h-full p-5 pb-24">
        
        {/* Интегрированный хедер. Золото передаем сюда, отступ 64px */}
        <Header 
          title="Лавка" 
          subtitle="Торговец редкостями" 
          gold={gold} 
          pt={64} 
        />

        {/* Список товаров */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 mt-2 custom-scrollbar">
          {items.map(item => (
            <div 
              key={item.id} 
              className="bg-black/60 border-2 border-white/5 p-3 flex items-center gap-4 active:scale-[0.98] transition-all shadow-[4px_4px_0_#000]"
            >
              {/* Иконка предмета */}
              <div className="w-14 h-14 bg-[#111] border border-[#daa520]/40 flex items-center justify-center text-2xl relative shrink-0 shadow-[inset_0_0_10px_rgba(0,0,0,0.8)]">
                <span className="z-10 drop-shadow-[0_2px_2px_rgba(0,0,0,1)]">{item.icon}</span>
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="text-[#daa520] font-black text-[12px] uppercase leading-none mb-1 truncate">
                  {item.name}
                </h3>
                <p className="text-white/40 text-[9px] leading-tight italic">
                  {item.desc}
                </p>
              </div>

              {/* Кнопка купить */}
              <button 
                className="bg-[#daa520] text-black px-3 py-3 font-black text-[10px] uppercase shadow-[2px_2px_0_#000] active:shadow-none active:translate-x-0.5 active:translate-y-0.5 transition-all outline-none"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                {item.price} G
              </button>
            </div>
          ))}
        </div>

        {/* Декоративная подпись */}
        <div className="mt-4 opacity-10 text-[7px] text-center uppercase tracking-[0.4em]">
          Обновление ассортимента через 12:44:02
        </div>
      </div>

      {/* Финальное затемнение низа */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black via-transparent to-transparent opacity-40" />
    </div>
  );
};

export default ShopPage;