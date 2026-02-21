import React from 'react';

const LoadingPage = ({ progress, isLoaded }) => {
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: '#000000',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 99999,
      fontFamily: 'monospace',
      transition: 'opacity 0.8s ease-in-out, visibility 0.8s',
      opacity: isLoaded ? 0 : 1,
      visibility: isLoaded ? 'hidden' : 'visible',
      pointerEvents: 'none'
    }}>
      <div style={{ width: '200px' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          color: '#daa520', 
          fontSize: '10px', 
          marginBottom: '8px',
          fontWeight: 'bold',
          letterSpacing: '1px'
        }}>
          <span>СИНХРОНИЗАЦИЯ</span>
          <span>{progress}%</span>
        </div>
        <div style={{ width: '100%', height: '2px', backgroundColor: '#1a1a1a' }}>
          <div style={{ 
            width: `${progress}%`, 
            height: '100%', 
            backgroundColor: '#daa520', 
            transition: 'width 0.3s ease-out',
            boxShadow: '0 0 10px rgba(218, 165, 32, 0.4)'
          }} />
        </div>
      </div>
    </div>
  );
};

export default LoadingPage;