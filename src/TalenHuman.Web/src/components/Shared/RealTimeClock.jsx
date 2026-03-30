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
  const dateString = time.toLocaleDateString(locale, dateOptions);

  if (isCollapsed) {
    return (
      <div className="flex justify-center p-2 animate-in zoom-in-95 duration-300" title={`${config.name}: ${timeString}`}>
         <img 
            src={flagUrl} 
            alt={config.name}
            className="w-8 h-8 rounded-full border-2 border-indigo-500/30 object-cover shadow-sm" 
         />
      </div>
    );
  }

  return (
    <div className="mx-4 mb-4 p-3 bg-slate-800/40 dark:bg-white/5 rounded-xl border border-white/5 dark:border-indigo-500/10 flex items-center gap-3 animate-in fade-in transition-all">
        <img 
            src={flagUrl} 
            alt={config.name}
            className="w-10 h-auto rounded shadow-sm border border-white/10" 
        />
        <div className="flex flex-col min-w-0">
            <span className="text-[14px] font-[900] text-indigo-400 tracking-tight font-mono leading-none">
                {timeString}
            </span>
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-1 uppercase leading-none truncate">
                {dateString}
            </span>
        </div>
    </div>
  );
};

export default RealTimeClock;
