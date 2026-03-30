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
         <div className="w-6 h-6 rounded-full overflow-hidden shadow-sm border-none ring-1 ring-white/10">
            <img 
               src={flagUrl} 
               alt={config.name}
               className="w-full h-full object-cover" 
            />
         </div>
      </div>
    );
  }

  return (
    <div className="mx-[1.25rem] mb-4 p-0 flex items-center gap-2.5 animate-in fade-in transition-all">
        <div className="relative shrink-0 flex items-center">
          <div className="w-7 h-7 rounded-full overflow-hidden shadow-md border-none ring-1 ring-white/10">
            <img 
                src={flagUrl} 
                alt={config.name}
                className="w-full h-full object-cover" 
            />
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-500 border border-[#0f172a] rounded-full"></div>
        </div>
        <div className="flex flex-col min-w-0 justify-center">
            <span className="text-[11px] font-bold text-white tracking-widest leading-tight">
                {timeString.toUpperCase()}
            </span>
            <span className="text-[8px] font-semibold text-slate-400 uppercase leading-none truncate tracking-wider">
                {dateString}
            </span>
        </div>
    </div>
  );
};

export default RealTimeClock;
