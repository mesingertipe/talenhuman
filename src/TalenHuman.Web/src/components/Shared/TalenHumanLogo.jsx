import React from 'react';

const TalenHumanLogo = ({ size = 32, type = 'full' }) => {
  const isSmall = size < 40;
  
  const iconBox = (
    <div style={{ 
      width: `${size}px`, 
      height: `${size}px`, 
      background: 'white', // 🚀 CLEAN LOGO BACKDROP
      borderRadius: isSmall ? '10px' : '18px', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      border: '1px solid rgba(0,0,0,0.05)',
      boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)',
      flexShrink: 0,
      overflow: 'hidden'
    }}>
       <img 
         src="/icon.png" 
         alt="Logo" 
         style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
       />
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
