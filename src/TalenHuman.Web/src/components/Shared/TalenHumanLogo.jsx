import React from 'react';

const TalenHumanLogo = ({ size = 32, type = 'full', white = false }) => {
  const isSmall = size < 40;
  const isHeader = type === 'header';
  
  const iconSize = isHeader ? 22 : size;
  
  const iconBox = (
    <div style={{ 
      width: `${iconSize}px`, 
      height: `${iconSize}px`, 
      background: (white || isHeader) ? 'rgba(255, 255, 255, 0.15)' : 'rgba(79, 70, 229, 0.1)', 
      backdropFilter: 'blur(8px)',
      borderRadius: isSmall ? '10px' : '20px', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      border: `1px solid ${(white || isHeader) ? 'rgba(255,255,255,0.2)' : 'rgba(79, 70, 229, 0.2)'}`,
      flexShrink: 0
    }}>
      <span style={{ 
        color: (white || isHeader) ? 'white' : '#4f46e5', 
        fontSize: `${iconSize * 0.45}px`, 
        fontWeight: '900', 
        fontStyle: 'italic', 
        letterSpacing: '-1px',
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
        fontSize: isHeader ? '24px' : `${size * 0.55}px`, 
        fontWeight: '950', 
        letterSpacing: isHeader ? '-1.2px' : '-1px', 
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
