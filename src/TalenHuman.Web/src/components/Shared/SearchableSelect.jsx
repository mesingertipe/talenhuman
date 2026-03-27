import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, X, Check } from 'lucide-react';

const SearchableSelect = ({ 
  options = [], 
  value, 
  onChange, 
  placeholder = "Seleccionar...", 
  label = "",
  icon: Icon,
  disabled = false,
  required = false,
  variant = "classic" // classic | minimal
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  const selectedOption = options.find(opt => opt.id === value || opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt => 
    opt.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    opt.label?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (option) => {
    onChange(option.id || option.value);
    setIsOpen(false);
    setSearchTerm("");
  };

  return (
    <div 
      className="relative w-full" 
      ref={containerRef}
      style={{ zIndex: isOpen ? 100 : 1 }}
    >
      {label && (
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      {/* Visually hidden but focusable input for HTML5 validation popup */}
      <input 
        type="text"
        value={value || ''}
        onChange={() => {}}
        className="sr-only"
        style={{ opacity: 0, position: 'absolute', zIndex: -1, width: '1px', height: '1px', padding: 0, margin: 0, border: 'none' }}
      />
      
      <div 
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`relative flex items-center w-full p-3 rounded-xl transition-all cursor-pointer ${
          variant === "minimal" 
            ? (isOpen ? 'bg-white dark:bg-slate-900 border border-indigo-500 dark:border-indigo-400 ring-4 ring-indigo-50 dark:ring-indigo-900/20 shadow-sm' : 'bg-transparent border-transparent hover:bg-slate-100/50 dark:hover:bg-slate-800/30')
            : (disabled ? 'bg-slate-100 dark:bg-slate-800/50 cursor-not-allowed opacity-80 border-slate-200 dark:border-slate-700' :
               isOpen ? 'bg-white dark:bg-slate-900 border-indigo-500 dark:border-indigo-400 ring-4 ring-indigo-50 dark:ring-indigo-900/20 shadow-sm' : 
               'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 border')
        }`}
      >
        {Icon && <Icon size={18} className={`mr-3 ${isOpen ? 'text-indigo-500 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`} />}
        
        <div className="flex-1 truncate">
          {selectedOption ? (
            <span className="font-black text-slate-800 dark:text-white text-sm uppercase tracking-tight">{selectedOption.name || selectedOption.label}</span>
          ) : (
            <span className="text-slate-400 dark:text-slate-300 text-sm font-black uppercase tracking-widest">{placeholder}</span>
          )}
        </div>
        
        <ChevronDown size={18} className={`ml-2 text-slate-400 dark:text-slate-500 transition-transform duration-300 ${isOpen ? 'rotate-180 text-indigo-500 dark:text-indigo-400' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute z-[1000] w-full mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-3 text-slate-400 dark:text-slate-500" />
              <input
                ref={inputRef}
                autoFocus
                type="text"
                placeholder="Filtrar opciones..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-2.5 pl-10 text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all text-slate-800 dark:text-white"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
          
          <div className="max-h-64 overflow-y-auto p-2 bespoke-scrollbar">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => {
                const isSelected = (option.id || option.value) === value;
                return (
                  <div
                    key={option.id || option.value}
                    onClick={(e) => {
                        e.stopPropagation();
                        handleSelect(option);
                    }}
                    className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all mb-1 last:mb-0 ${
                      isSelected 
                        ? 'bg-indigo-50 dark:bg-indigo-600 text-indigo-700 dark:text-white' 
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-100 hover:translate-x-2'
                    }`}
                  >
                    <span className={`text-[13px] uppercase tracking-tight ${isSelected ? 'font-black' : 'font-bold'}`}>
                      {option.name || option.label}
                    </span>
                    {isSelected && (
                      <div className="w-6 h-6 rounded-lg bg-indigo-600 dark:bg-indigo-500 flex items-center justify-center text-white shadow-sm">
                        <Check size={14} strokeWidth={4} />
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center bg-slate-50/50 dark:bg-slate-800/30 rounded-xl m-2">
                <Search size={24} className="mx-auto mb-3 text-slate-300 dark:text-slate-600 opacity-50" />
                <div className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">
                  Sin resultados
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;
