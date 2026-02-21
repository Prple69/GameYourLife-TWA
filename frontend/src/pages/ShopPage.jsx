import React from 'react';

const ShopPage = ({ gold = 450, videos }) => {
  const items = [
    { id: 1, name: "Перо Феникса", price: 200, icon: "🔥", desc: "Дарует вторую жизнь" },
    { id: 2, name: "4-х листный клевер", price: 150, icon: "🍀", desc: "Опыт 1.5х" },
  ];

  return (
    <div className="fixed inset-0 w-full h-full bg-black overflow-hidden flex flex-col font-mono">
      
      {/* --- ЗАДНИЙ ФОН (ВИДЕО ЧЕРЕЗ BLOB) --- */}
      <div className="absolute inset-0 z-0 bg-black">
        <video
          src={videos?.shop || ""}
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover opacity-60"
          style={{ 
            imageRendering: 'pixelated',
            willChange: 'transform' 
          }}
        />
        {/* Градиент для читаемости без использования blur */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-black/80" />
      </div>

      {/* --- КОНТЕНТ МАГАЗИНА --- */}
      <div className="relative z-10 flex flex-col h-full p-5 pb-32">
        
        {/* Заголовок и баланс золота */}
        <div className="flex justify-between items-end mb-6 border-b-2 border-[#daa520]/30 pb-2">
          <div>
            <h2 className="text-[#daa520] text-2xl font-black uppercase tracking-tighter drop-shadow-[0_2px_2px_rgba(0,0,0,1)]">
              Лавка
            </h2>
            <p className="text-white/40 text-[8px] uppercase tracking-widest">Торговец артефактами</p>
          </div>
          
          {/* Баланс: убрали blur, добавили более плотный фон */}
          <div className="flex items-center gap-2 bg-[#111] px-3 py-1 border border-[#f7d51d]/40 shadow-[4px_4px_0_#000]">
            <span className="text-[#f7d51d] font-bold text-sm tracking-tighter">{gold}</span>
            <div className="w-2.5 h-2.5 bg-[#f7d51d] rounded-full shadow-[0_0_8px_#f7d51d] animate-pulse" />
          </div>
        </div>

        {/* Список товаров */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {items.map(item => (
            <div 
              key={item.id} 
              className="relative bg-[#1a1a1a] border-2 border-white/5 p-3 flex items-center gap-4 active:translate-y-1 transition-all shadow-[4px_4px_0_#000]"
            >
              {/* Иконка предмета */}
              <div className="w-14 h-14 bg-black border border-[#daa520]/30 flex items-center justify-center text-2xl relative overflow-hidden">
                <span className="z-10 drop-shadow-md">{item.icon}</span>
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
              </div>
              
              <div className="flex-1">
                <h3 className="text-[#f7d51d] font-bold text-[13px] uppercase leading-none mb-1">
                  {item.name}
                </h3>
                <p className="text-white/50 text-[9px] leading-tight font-medium">
                  {item.desc}
                </p>
              </div>

              {/* Кнопка купить */}
              <button 
                className="bg-[#daa520] active:bg-[#f7d51d] text-black px-4 py-3 font-black text-[10px] uppercase shadow-[2px_2px_0_#000] active:shadow-none transition-all outline-none"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                {item.price} G
              </button>
            </div>
          ))}
        </div>

        {/* Декоративная подпись снизу */}
        <div className="mt-4 opacity-20 text-[7px] text-center uppercase tracking-[0.3em]">
          Goods update in 12:44:02
        </div>
      </div>

    </div>
  );
};

export default ShopPage;