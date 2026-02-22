import React from 'react';

const ProfileModal = ({ isOpen, onClose, character }) => {
  if (!isOpen) return null;

  const stats = [
    { label: 'СИЛА', val: '14', color: 'text-red-500' },
    { label: 'ЛОВКОСТЬ', val: '22', color: 'text-green-500' },
    { label: 'ИНТЕЛЛЕКТ', val: '18', color: 'text-blue-500' },
    { label: 'УДАЧА', val: '7', color: 'text-yellow-500' },
  ];

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/95 backdrop-blur-xl" onClick={onClose} />
      
      <div className="relative w-full max-w-md bg-[#0a0a0a] border-2 border-white/20 p-6 shadow-[15px_15px_0_#000]">
        <button onClick={onClose} className="absolute -top-3 -right-3 w-10 h-10 bg-white text-black border-2 border-black flex items-center justify-center shadow-[4px_4px_0_#000] font-[1000] text-2xl active:translate-y-1 active:shadow-none transition-all">×</button>

        <h2 className="text-white text-2xl font-[1000] uppercase tracking-tighter mb-6 italic border-b border-white/10 pb-2">ПРОФИЛЬ ГЕРОЯ</h2>

        {/* СЕТКА СТАТИСТИКИ */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          {stats.map(s => (
            <div key={s.label} className="bg-white/5 p-3 border border-white/10 shadow-[4px_4px_0_rgba(255,255,255,0.05)]">
              <p className="text-white/40 text-[10px] font-[1000] uppercase tracking-widest">{s.label}</p>
              <p className={`${s.color} text-2xl font-[1000] tracking-tighter mt-1`}>{s.val}</p>
            </div>
          ))}
        </div>

        {/* ДОПОЛНИТЕЛЬНАЯ ИНФА */}
        <div className="space-y-4">
          <div className="flex justify-between text-[11px] font-[1000] uppercase tracking-widest border-b border-white/5 pb-2">
            <span className="text-white/40">УБИТО ВРАГОВ</span>
            <span className="text-white">1,248</span>
          </div>
          <div className="flex justify-between text-[11px] font-[1000] uppercase tracking-widest border-b border-white/5 pb-2">
            <span className="text-white/40">ПРОЙДЕНО КВЕСТОВ</span>
            <span className="text-white">42</span>
          </div>
          <div className="flex justify-between text-[11px] font-[1000] uppercase tracking-widest border-b border-white/5 pb-2">
            <span className="text-white/40">ВРЕМЯ В ПУТИ</span>
            <span className="text-white">148 ЧАСОВ</span>
          </div>
        </div>

        <button 
          onClick={onClose}
          className="w-full mt-8 py-3 bg-[#daa520] text-black font-[1000] uppercase tracking-widest shadow-[4px_4px_0_#000] active:translate-y-1 active:shadow-none transition-all"
        >
          ЗАКРЫТЬ ТЕРМИНАЛ
        </button>
      </div>
    </div>
  );
};

export default ProfileModal;