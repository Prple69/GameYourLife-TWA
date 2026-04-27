import React from 'react';
import Header from '../components/Header';

const PACKS = [
  { id: 1, gems: 100, label: '100 gems', popular: false },
  { id: 2, gems: 500, label: '500 gems', popular: true },
  { id: 3, gems: 1500, label: '1500 gems', popular: false },
];

const COMING_SOON_LABEL = 'Скоро';

export default function GemsPage() {
  return (
    <div className="min-h-screen w-full bg-black flex flex-col font-mono items-center relative overflow-hidden">
      <div className="relative z-10 flex flex-col items-center w-[92%] h-full">
        <div className="w-full shrink-0 text-center">
          <Header title="GEMS" subtitle="ПОПОЛНЕНИЕ КРИСТАЛЛОВ" />
        </div>

        <div className="w-full max-w-md flex flex-col gap-4 mt-6"
          style={{ marginBottom: 'calc(130px + env(safe-area-inset-bottom, 0px))' }}
        >
          {PACKS.map(pack => (
            <div
              key={pack.id}
              className="relative bg-[#111]/80 border border-[#9966ff]/40 p-5 text-center shadow-[4px_4px_0_#000]"
            >
              {pack.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#9966ff] text-black px-3 py-0.5 text-[10px] font-black uppercase tracking-widest shadow-[2px_2px_0_#000]">
                  ПОПУЛЯРНО
                </div>
              )}
              <div className="text-4xl font-black mb-1 text-[#9966ff] drop-shadow-[0_0_12px_#9966ff]">
                💎 {pack.gems}
              </div>
              <p className="text-white/50 text-[10px] uppercase tracking-widest mb-4">{pack.label}</p>
              <button
                disabled
                className="w-full bg-[#333] text-white/40 px-4 py-2 text-[11px] font-black uppercase tracking-widest cursor-not-allowed opacity-60 border border-white/10"
              >
                {COMING_SOON_LABEL}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
