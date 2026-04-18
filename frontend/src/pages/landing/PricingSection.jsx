const packs = [
  { gems: 100,  price: '99 ₽',  label: 'СТАРТОВЫЙ', highlight: false },
  { gems: 500,  price: '399 ₽', label: 'ПРИКЛЮЧЕНИЕ', highlight: true },
  { gems: 1500, price: '999 ₽', label: 'ЛЕГЕНДАРНЫЙ', highlight: false },
];

export default function PricingSection() {
  return (
    <section className="py-20 px-6 border-t border-white/5 bg-black/40">
      <div className="max-w-4xl mx-auto">
        <h2
          className="text-yellow-400 text-center mb-4 text-sm"
          style={{ fontFamily: "'Press Start 2P', monospace" }}
        >
          КРИСТАЛЛЫ
        </h2>
        <p className="text-center text-white/40 text-xs mb-12">
          Кристаллы используются для покупок в магазине. Скоро.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {packs.map(({ gems, price, label, highlight }) => (
            <div
              key={gems}
              className={`border p-6 text-center space-y-4 transition-colors ${
                highlight
                  ? 'border-yellow-400 bg-yellow-400/5'
                  : 'border-white/10 hover:border-white/20'
              }`}
            >
              {highlight && (
                <div className="text-[9px] font-mono text-yellow-400 tracking-widest">★ ПОПУЛЯРНЫЙ</div>
              )}
              <p
                className="text-yellow-400 text-2xl"
                style={{ fontFamily: "'Press Start 2P', monospace" }}
              >
                {gems}
              </p>
              <p className="text-white/40 text-[10px] font-mono">кристаллов</p>
              <p className="text-white font-bold text-sm font-mono">{price}</p>
              <p
                className="text-[9px] font-mono text-white/20 tracking-widest"
                style={{ fontFamily: "'Press Start 2P', monospace" }}
              >
                {label}
              </p>
              <button
                disabled
                className="w-full py-2 border border-yellow-400/20 text-yellow-400/30 text-[9px] font-mono cursor-not-allowed"
              >
                СКОРО
              </button>
            </div>
          ))}
        </div>
        <p className="text-center text-white/20 text-[10px] mt-6">
          * Цены указочны. Оплата через ЮKassa (карта, СБП, ЮMoney).
        </p>
      </div>
    </section>
  );
}
