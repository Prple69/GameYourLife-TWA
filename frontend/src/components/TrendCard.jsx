import React from 'react';
// Импортируем твою иконку огня
import FireIcon from '../assets/icons/fire.svg';

export const TrendCard = ({ item }) => {
  return (
    <div 
      style={{
        position: 'relative',
        width: '175px',
        height: '184px',
        flex: 'none',
        order: 0,
        flexGrow: 0,
        overflow: 'hidden',
        borderRadius: '16px',
      }}
      className="active:scale-[0.97] transition-all duration-200 cursor-pointer"
    >
      {/* Rectangle 2 (Изображение на фоне) */}
      <div 
        style={{
          position: 'absolute',
          width: '175px',
          height: '184px',
          left: '0px',
          top: '0px',
          backgroundImage: `url(${item.image_url})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          borderRadius: '16px',
        }}
      />

      {/* Frame 68 (Badge HOT) */}
      {item.is_hot && (
        <div 
          style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '6px',
            gap: '4px',
            position: 'absolute',
            width: '60px',
            height: '30px',
            left: '105px',
            top: '9px',
            background: '#FF551D',
            borderRadius: '16px',
            zIndex: 2
          }}
        >
          {/* solar:fire-bold (Твоя иконка) */}
          <img 
            src={FireIcon} 
            alt="fire" 
            style={{ width: '18px', height: '18px', flex: 'none' }} 
          />
          
          {/* HOT (Текст) */}
          <span 
            style={{
              width: '26px',
              height: '15px',
              fontFamily: "'Inter', sans-serif",
              fontWeight: '700',
              fontSize: '12px',
              lineHeight: '15px',
              letterSpacing: '-0.03em',
              color: '#FFFFFF'
            }}
          >
            HOT
          </span>
        </div>
      )}

      {/* Frame 22 (Нижняя плашка с текстом) */}
      <div 
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          padding: '12px 11px',
          gap: '10px',
          position: 'absolute',
          width: '175px',
          height: '60px',
          left: '0px',
          top: '124px',
          background: '#131313',
          borderRadius: '0px 0px 16px 16px',
          zIndex: 3
        }}
      >
        {/* Frame 21 (Контейнер для текста) */}
        <div 
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            padding: '0px',
            gap: '4px',
            width: '132px',
            height: '33px'
          }}
        >
          {/* Disney Meme (Заголовок) */}
          <h4 
            style={{
              width: '132px',
              height: '17px',
              fontFamily: "'Inter', sans-serif",
              fontWeight: '600',
              fontSize: '14px',
              lineHeight: '17px',
              letterSpacing: '-0.03em',
              color: '#FFFFFF',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {item.title}
          </h4>

          {/* P Diddy Running... (Описание) */}
          <p 
            style={{
              width: '132px',
              height: '12px',
              fontFamily: "'Inter', sans-serif",
              fontWeight: '500',
              fontSize: '10px',
              lineHeight: '12px',
              letterSpacing: '-0.03em',
              color: '#FFFFFF',
              opacity: 0.5,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {item.description}
          </p>
        </div>
      </div>
    </div>
  );
};

export const TrendSkeleton = () => (
  <div 
    style={{ 
      width: '175px', 
      height: '184px', 
      borderRadius: '16px', 
      background: '#131313' 
    }} 
    className="animate-pulse" 
  />
);