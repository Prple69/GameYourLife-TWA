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

  const glassStyle = {
    WebkitBackdropFilter: 'blur(8px)',
    backdropFilter: 'blur(8px)',
  };

  return (
    <div className="min-h-screen w-full bg-black flex flex-col font-mono items-center relative overflow-hidden">
      
      {/* --- ЗАДНИЙ ФОН --- */}
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

      {/* --- КОНТЕНТ (Ширина 92% как в лидеборде) --- */}
      <div className="relative z-10 flex flex-col items-center w-[92%] h-full">
        
        <div className="w-full shrink-0 text-center">
          <Header title="ЛАВКА" subtitle="ТОРГОВЕЦ РЕДКОСТЯМИ" />
        </div>

        {/* --- ТВОЙ БАЛАНС (СЛЕВА) --- */}
        <div className="w-full max-w-md flex justify-start mt-4 mb-4 shrink-0">
          <div 
            style={glassStyle}
            className="bg-black/60 border-2 border-[#daa520] px-4 py-2 flex items-center gap-3 shadow-[0_0_15px_rgba(218,165,32,0.2)]"
          >
            <div className="w-4 h-4 bg-[#daa520] rotate-45 border border-black shadow-[0_0_8px_#daa520] shrink-0" />
            <div className="flex flex-col items-start leading-none">
              <span className="text-[#daa520] text-xl font-black tabular-nums">
                {gold}<span className="text-[12px] ml-1 opacity-80 uppercase">Gold</span>
              </span>
            </div>
          </div>
        </div>

        {/* --- СПИСОК ТОВАРОВ (Ограничение как в лидеборде) --- */}
        <div 
          className="w-full max-w-md flex-1 flex flex-col overflow-hidden relative"
          style={{ 
            marginBottom: 'calc(130px + env(safe-area-inset-bottom, 0px))' 
          }}
        >
          <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
            <div className="flex flex-col gap-4">
              {items.map(item => (
                <div 
                  key={item.id} 
                  style={glassStyle}
                  className="bg-black/65 border border-white/10 p-4 flex items-center gap-4 active:scale-[0.98] transition-all shadow-lg relative overflow-hidden group shrink-0"
                >
                  {/* ИКОНКА ТОВАРА */}
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-black/40 border-2 border-[#daa520]/20 flex items-center justify-center text-3xl sm:text-4xl shrink-0 shadow-[inset_0_0_15px_rgba(0,0,0,0.8)]">
                    <span className="drop-shadow-[0_0_10px_rgba(255,255,255,0.2)] group-hover:scale-110 transition-transform">{item.icon}</span>
                  </div>
                  
                  {/* ОПИСАНИЕ */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[#daa520] font-black text-lg sm:text-xl uppercase tracking-tighter leading-none truncate mb-2">
                      {item.name}
                    </h3>
                    <p className="text-[#F5F5F0]/60 text-[10px] sm:text-[12px] leading-tight font-bold uppercase tracking-tight italic">
                      {item.desc}
                    </p>
                  </div>

                  {/* КНОПКА ПОКУПКИ */}
                  <button 
                    className="bg-[#daa520] text-black h-12 px-4 sm:px-6 font-black text-sm sm:text-lg uppercase shadow-[0_3px_0_#966e00] active:shadow-none active:translate-y-0.5 transition-all outline-none border border-black/20"
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                  >
                    {item.price}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Визуальный акцент снизу */}
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-[80%] h-6 bg-[#daa520]/10 blur-xl pointer-events-none" />
        </div>

      </div>

      {/* Мягкое затемнение для навигации */}
      <div className="absolute inset-x-0 bottom-0 h-40 pointer-events-none bg-gradient-to-t from-black via-transparent to-transparent z-0" />
    </div>
  );
};

export default ShopPage;