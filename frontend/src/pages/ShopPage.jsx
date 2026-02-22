import React from 'react';
import Header from '../components/Header';

const ShopPage = ({ gold = 450, videos }) => {
  const items = [
    { id: 1, name: "Перо Феникса", price: 200, icon: "🔥", desc: "Дарует вторую жизнь после смерти в бою" },
    { id: 2, name: "Клевер удачи", price: 150, icon: "🍀", desc: "Увеличивает получаемый опыт в 1.5 раза" },
    { id: 3, name: "Древний фолиант", price: 500, icon: "📖", desc: "Открывает случайное скрытое умение" },
    { id: 4, name: "Перо Феникса", price: 200, icon: "🔥", desc: "Дарует вторую жизнь после смерти в бою" },
    { id: 5, name: "Клевер удачи", price: 150, icon: "🍀", desc: "Увеличивает получаемый опыт в 1.5 раза" },
    { id: 6, name: "Древний фолиант", price: 500, icon: "📖", desc: "Открывает случайное скрытое умение" },
  ];

  return (
    <div className="fixed inset-0 w-full h-full bg-black overflow-hidden flex flex-col font-mono select-none touch-none">
      
      {/* --- ЗАДНИЙ ФОН --- */}
      <div className="absolute inset-0 z-0 bg-black">
        <video
          src={videos?.shop || ""}
          autoPlay loop muted playsInline
          className="w-full h-full object-cover opacity-50"
          style={{ imageRendering: 'pixelated' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-transparent to-black" />
      </div>

      {/* --- КОНТЕНТ --- */}
      <div className="relative z-10 flex flex-col h-full px-4 pt-4 pb-24">
        
        <Header 
          title="ЛАВКА" 
          subtitle="ТОРГОВЕЦ РЕДКОСТЯМИ" 
        />

        {/* --- ТВОЙ БАЛАНС (В стиле новой панели персонажа) --- */}
        <div className="flex justify-end mt-4 mb-6">
          <div className="bg-black/80 border-2 border-[#daa520] px-4 py-2 flex items-center gap-3 shadow-[6px_6px_0_#000]">
            <div className="flex flex-col items-end">
              <span className="text-[#daa520]/60 text-[10px] uppercase font-[1000] tracking-widest leading-none mb-1">ТВОЙ БАЛАНС</span>
              <span className="text-[#daa520] text-xl md:text-3xl font-[1000] tabular-nums leading-none">
                {gold} <span className="text-[14px] md:text-[20px]">G</span>
              </span>
            </div>
            <div className="w-5 h-5 bg-[#daa520] rotate-45 border-2 border-black shadow-[0_0_10px_#daa520]" />
          </div>
        </div>

        {/* СПИСОК ТОВАРОВ */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
          {items.map(item => (
            <div 
              key={item.id} 
              className="bg-black/70 border-2 border-white/10 p-4 flex items-center gap-4 active:scale-[0.97] transition-all shadow-[6px_6px_0_#000] relative overflow-hidden group"
            >
              {/* ИКОНКА ТОВАРА */}
              <div className="w-16 h-16 md:w-20 md:h-20 bg-[#111] border-2 border-[#daa520]/30 flex items-center justify-center text-3xl md:text-4xl shrink-0 shadow-[inset_0_0_15px_rgba(0,0,0,1)]">
                <span className="drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">{item.icon}</span>
              </div>
              
              {/* ОПИСАНИЕ */}
              <div className="flex-1 min-w-0">
                <h3 className="text-[#daa520] font-[1000] text-lg md:text-2xl uppercase tracking-tighter leading-none truncate mb-2">
                  {item.name}
                </h3>
                <p className="text-white/60 text-[10px] md:text-[13px] leading-tight font-bold uppercase tracking-tight not-italic">
                  {item.desc}
                </p>
              </div>

              {/* КНОПКА ПОКУПКИ */}
              <button 
                className="bg-[#daa520] text-black h-14 px-4 md:px-6 font-[1000] text-base md:text-xl uppercase shadow-[4px_4px_0_#000] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all outline-none border-2 border-black"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                {item.price}
              </button>
            </div>
          ))}
        </div>

      </div>

      <div className="absolute inset-x-0 bottom-0 h-40 pointer-events-none bg-gradient-to-t from-black via-transparent to-transparent z-0" />
    </div>
  );
};

export default ShopPage;