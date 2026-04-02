import React from 'react';

const TalenHumanLogo = ({ size = 32, type = 'full' }) => {
  const isSmall = size < 40;
  
  const iconBox = (
    <div style={{ 
      width: `${size}px`, 
      height: `${size}px`, 
      background: 'rgba(255, 255, 255, 0.15)', // 🚀 SOFT SEMI-TRANSPARENT BACKDROP
      backdropFilter: 'blur(8px)',
      borderRadius: isSmall ? '12px' : '22px', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      flexShrink: 0
    }}>
      <span style={{ 
        color: 'white', 
        fontSize: `${size * 0.45}px`, 
        fontWeight: '900', 
        fontStyle: 'italic', 
        letterSpacing: '-1.5px',
        fontFamily: "'Outfit', sans-serif",
        textShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        TH
      </span>
    </div>
  );

  if (type === 'icon') return iconBox;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: isSmall ? '8px' : '14px' }}>
      {iconBox}
      <span style={{ 
        fontSize: `${size * 0.55}px`, 
        fontWeight: '900', 
        letterSpacing: '-1px', 
        color: 'inherit',
        fontFamily: "'Outfit', sans-serif"
      }}>
        TalenHuman
      </span>
    </div>
  );
};

export default TalenHumanLogo;
