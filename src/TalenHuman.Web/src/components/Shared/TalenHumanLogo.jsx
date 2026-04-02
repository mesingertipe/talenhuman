import React from 'react';

const TalenHumanLogo = ({ size = 32, type = 'full' }) => {
  const isSmall = size < 40;
  
  const iconBox = (
    <div style={{ 
      width: `${size}px`, 
      height: `${size}px`, 
      background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)', 
      borderRadius: isSmall ? '10px' : '18px', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      border: '1.5px solid rgba(255,255,255,0.2)',
      boxShadow: '0 8px 16px rgba(79, 70, 229, 0.25)',
      flexShrink: 0
    }}>
      <span style={{ 
        color: 'white', 
        fontSize: `${size * 0.45}px`, 
        fontWeight: '900', 
        fontStyle: 'italic', 
        letterSpacing: '-1.5px',
        fontFamily: "'Outfit', sans-serif"
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
