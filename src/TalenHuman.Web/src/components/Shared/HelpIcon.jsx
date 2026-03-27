import React from 'react';
import { HelpCircle } from 'lucide-react';

const HelpIcon = ({ text, className = "" }) => {
  if (!text) return null;

  return (
    <div 
      className={`inline-flex items-center justify-center ml-1.5 cursor-help text-slate-400 dark:text-slate-300 hover:text-indigo-500 transition-colors duration-200 ${className}`}
      data-v12-tooltip={text}
    >
      <HelpCircle size={14} strokeWidth={2.5} />
    </div>
  );
};

export default HelpIcon;
