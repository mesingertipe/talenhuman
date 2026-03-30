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
         <img 
            src={flagUrl} 
            alt={config.name}
            className="w-6 h-6 rounded-full object-cover aspect-square shadow-sm border-none" 
         />
      </div>
    );
  }

  return (
    <div className="mx-[1.25rem] mb-3 p-0 flex items-center gap-3 animate-in fade-in transition-all">
        <div className="relative shrink-0 flex items-center">
          <img 
              src={flagUrl} 
              alt={config.name}
              className="w-7 h-7 rounded-full shadow-md object-cover aspect-square border-none" 
          />
          <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-[1.5px] border-[#0f172a] rounded-full"></div>
        </div>
        <div className="flex flex-col min-w-0 justify-center">
            <span className="text-[13px] font-black text-white tracking-widest leading-none">
                {timeString.toUpperCase()}
            </span>
            <span className="text-[10px] font-bold text-slate-400 mt-1 uppercase leading-none truncate tracking-wide">
                {dateString}
            </span>
        </div>
    </div>
  );
};

export default RealTimeClock;
