import React, { memo } from 'react';

const ProgressBar = ({ 
  label, 
  value = 0, 
  max = 100, 
  labelColor, // Например, "text-red-500"
  barClass,   // Например, "bg-gradient-to-r from-red-600 to-red-400"
  shadowColor 
}) => {
  const safeMax = max <= 0 ? 1 : max;
  const percentage = Math.min(Math.max((value / safeMax) * 100, 0), 100);

  return (
    <div className="space-y-1 w-full" role="progressbar" aria-label={label}>
      <div className="flex justify-between text-[9px] font-black uppercase tracking-[0.2em]">
        <span className="text-white/40">{label}</span>
        {/* Используем labelColor для цифр */}
        <span className={`${labelColor} tabular-nums`}>{value} / {max}</span>
      </div>
      
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
        <div 
          // barClass теперь передается целиком, Tailwind его точно увидит
          className={`h-full transition-all duration-1000 ease-out ${barClass}`} 
          style={{ 
            width: `${percentage}%`,
            boxShadow: `0 0 8px ${shadowColor}`,
            transform: 'translateZ(0)'
          }} 
        />
      </div>
    </div>
  );
};

export default memo(ProgressBar);