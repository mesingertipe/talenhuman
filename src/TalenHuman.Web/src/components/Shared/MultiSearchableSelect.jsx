import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, X, Check, Building2 } from 'lucide-react';

const MultiSearchableSelect = ({ 
  options = [], 
  value = [], 
  onChange, 
  placeholder = "Seleccionar tiendas...", 
  label = "",
  icon: Icon = Building2,
  disabled = false,
  required = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef(null);

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

  const toggleOption = (optionId) => {
    const newValue = value.includes(optionId)
      ? value.filter(id => id !== optionId)
      : [...value, optionId];
    onChange(newValue);
  };

  const removeOption = (e, optionId) => {
    e.stopPropagation();
    onChange(value.filter(id => id !== optionId));
  };

  const selectedOptions = options.filter(opt => value.includes(opt.id || opt.value));

  return (
    <div className="relative" ref={containerRef}>
      {label && (
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      {/* Visually hidden but focusable input for HTML5 validation popup */}
      <input 
        type="text"
        required={required}
        value={value.length > 0 ? 'selected' : ''}
        onChange={() => {}}
        className="sr-only"
        style={{ opacity: 0, position: 'absolute', zIndex: -1, width: '1px', height: '1px', padding: 0, margin: 0, border: 'none' }}
        tabIndex={-1}
      />
      
      <div 
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`relative flex flex-wrap items-center p-2 rounded-xl border transition-all cursor-pointer min-h-[52px] ${
          disabled ? 'bg-slate-100 dark:bg-slate-800/50 cursor-not-allowed opacity-80 border-slate-200 dark:border-slate-700' :
          isOpen ? 'bg-white dark:bg-slate-900 border-indigo-500 dark:border-indigo-400 ring-4 ring-indigo-50 dark:ring-indigo-900/20 shadow-sm' : 
          'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
        }`}
      >
        <Icon size={18} className={`ml-2 mr-2 ${isOpen ? 'text-indigo-500 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`} />
        
        <div className="flex flex-wrap gap-1.5 flex-1">
          {selectedOptions.length > 0 ? (
            selectedOptions.map(opt => (
              <div 
                key={opt.id || opt.value} 
                className="flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 px-2.5 py-1.5 rounded-lg text-[11px] font-black border border-indigo-100 dark:border-indigo-800 animate-in zoom-in-95 duration-200 uppercase tracking-tight"
              >
                <span>{opt.name || opt.label}</span>
                <X 
                  size={12} 
                  className="hover:text-red-500 dark:hover:text-red-400 cursor-pointer transition-colors" 
                  onClick={(e) => removeOption(e, opt.id || opt.value)}
                />
              </div>
            ))
          ) : (
            <span className="text-slate-400 dark:text-slate-500 ml-1 text-sm font-medium">{placeholder}</span>
          )}
        </div>
        
        <ChevronDown size={18} className={`ml-2 mr-1 text-slate-400 dark:text-slate-500 transition-transform duration-300 ${isOpen ? 'rotate-180 text-indigo-500 dark:text-indigo-400' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-3 text-slate-400 dark:text-slate-500" />
              <input
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
                const isSelected = value.includes(option.id || option.value);
                return (
                  <div
                    key={option.id || option.value}
                    onClick={(e) => {
                        e.stopPropagation();
                        toggleOption(option.id || option.value);
                    }}
                    className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all mb-1 last:mb-0 ${
                      isSelected 
                        ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400' 
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:translate-x-1'
                    }`}
                  >
                    <span className={`text-[13px] uppercase tracking-tight ${isSelected ? 'font-black' : 'font-bold'}`}>
                      {option.name || option.label}
                    </span>
                    <div className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${
                      isSelected 
                        ? 'bg-indigo-600 dark:bg-indigo-500 border-indigo-600 dark:border-indigo-500 shadow-sm' 
                        : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600'
                    }`}>
                      {isSelected && <Check size={14} className="text-white" strokeWidth={4} />}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-slate-400 dark:text-slate-600 text-[10px] font-black uppercase tracking-[0.2em] italic">
                Sin resultados
              </div>
            )}
          </div>
          
          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-6 mt-1">
               <span>{value.length} seleccionadas</span>
               <button 
                onClick={(e) => { e.stopPropagation(); onChange([]); }}
                className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors"
               >
                Limpiar todo
               </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiSearchableSelect;
