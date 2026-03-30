import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import HelpIcon from './HelpIcon';
import { getTenantTimeZone, getTenantLocale } from '../../utils/localization';

const RealTimeClock = ({ countryCode, timeZoneId, isCollapsed }) => {
  const [time, setTime] = useState(new Date());

  const countries = {
    'CO': { name: 'Colombia' },
    'MX': { name: 'México' },
    'PA': { name: 'Panamá' },
    'EC': { name: 'Ecuador' },
  };

  const config = countries[countryCode] || countries['CO'];
  const timeZone = getTenantTimeZone(countryCode, timeZoneId);
  const locale = getTenantLocale(countryCode);
  const flagCode = (countryCode || 'CO').toLowerCase();
  const flagUrl = `https://flagcdn.com/w40/${flagCode}.png`;

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatOptions = {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  };

  const dateOptions = {
    timeZone,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  };

  const timeString = time.toLocaleTimeString(locale, formatOptions);
  
  // Custom Date Format: DD/MM/YYYY
  const dayStr = String(time.getDate()).padStart(2, '0');
  const monthStr = String(time.getMonth() + 1).padStart(2, '0');
  const yearStr = time.getFullYear();
  const dateString = `${dayStr}/${monthStr}/${yearStr}`;

  if (isCollapsed) {
    return (
      <div className="flex justify-center p-2 mb-1 animate-in zoom-in-95 duration-300" title={`${config.name}: ${timeString}`}>
         <div style={{ 
            width: '24px', height: '24px', borderRadius: '50%', overflow: 'hidden', 
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.4)', position: 'relative',
            border: '1px solid rgba(255, 255, 255, 0.1)'
         }}>
            <img 
               src={flagUrl} 
               alt={config.name}
               style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/20 pointer-events-none"></div>
         </div>
      </div>
    );
  }

  return (
    <div className="mx-[1.25rem] mb-4 p-0 flex items-center gap-2.5 animate-in fade-in transition-all">
        <div className="relative shrink-0 flex items-center">
          <div style={{ 
            width: '28px', height: '28px', borderRadius: '50%', overflow: 'hidden', 
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.4)', position: 'relative',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <img 
                src={flagUrl} 
                alt={config.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/30 pointer-events-none"></div>
          </div>
          <div style={{
            position: 'absolute', bottom: '-2px', right: '-2px', 
            width: '9px', height: '9px', backgroundColor: '#10b981', 
            border: '1.5px solid #0f172a', borderRadius: '50%'
          }}></div>
        </div>
        <div className="flex flex-col min-w-0 justify-center">
            <span style={{ 
                fontSize: '10.5px', fontWeight: '800', color: 'white', 
                letterSpacing: '0.05em', lineHeight: '1', fontFamily: 'inherit' 
            }}>
                {timeString.toUpperCase()}
            </span>
            <span style={{ 
                fontSize: '8px', fontWeight: '600', color: '#94a3b8', 
                marginTop: '4px', textTransform: 'uppercase', lineHeight: '1',
                letterSpacing: '0.02em', whiteSpace: 'nowrap'
            }}>
                {dateString}
            </span>
        </div>
    </div>
  );
};

export default RealTimeClock;
