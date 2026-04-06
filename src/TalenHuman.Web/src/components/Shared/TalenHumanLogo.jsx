import React from 'react';

const TalenHumanLogo = ({ size = 32, type = 'full', white = false }) => {
  const isSmall = size < 40;
  const isHeader = type === 'header';
  
  const iconSize = isHeader ? 22 : size;
  
  const iconBox = (
    <div style={{ 
      width: `${iconSize}px`, 
      height: `${iconSize}px`, 
      background: (white || isHeader) ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)', 
      backdropFilter: 'blur(12px)',
      borderRadius: isSmall ? '12px' : '22px', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      border: `1px solid rgba(255,255,255,0.2)`,
      flexShrink: 0
    }}>
      <span style={{ 
        color: 'white', 
        fontSize: `${iconSize * 0.45}px`, 
        fontWeight: '950', 
        fontStyle: 'normal', 
        letterSpacing: '-1.5px',
        fontFamily: "'Outfit', sans-serif"
      }}>
        TH
      </span>
    </div>
  );

  if (type === 'icon') return iconBox;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: isHeader ? '12px' : (isSmall ? '8px' : '14px') }}>
      {iconBox}
      <span style={{ 
        fontSize: isHeader ? '32px' : `${size * 0.55}px`, 
        fontWeight: '950', 
        letterSpacing: isHeader ? '-1.5px' : '-1px', 
        color: (white || isHeader) ? 'white' : 'inherit',
        fontFamily: "'Outfit', sans-serif",
        textTransform: isHeader ? 'none' : 'none'
      }}>
        TalenHuman
      </span>
    </div>
  );
};

export default TalenHumanLogo;
