import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
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
  variant = "classic", // classic | minimal
  multiple = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const [menuStyle, setMenuStyle] = useState({});

  const getLabel = () => {
    if (multiple) {
        if (!value || !Array.isArray(value) || value.length === 0) return placeholder;
        return `${value.length} Seleccionados`;
    }
    const selectedOption = options.find(opt => opt.id === value || opt.value === value);
    return selectedOption ? (selectedOption.name || selectedOption.label) : placeholder;
  };

  // V26 SLEDGEHAMMER: Calculate physical screen position for the portal
  useLayoutEffect(() => {
    if (isOpen && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const winHeight = window.innerHeight;
        const margin = 16;
        
        // Calculate available space below and above
        const spaceBelow = winHeight - rect.bottom - margin;
        const spaceAbove = rect.top - margin;
        
        // Decide direction: show above if there's less space below and more space above
        const showAbove = (spaceBelow < 200) && (spaceAbove > spaceBelow);
        const maxH = showAbove ? spaceAbove : spaceBelow;
        
        setMenuStyle({
            position: 'fixed',
            top: showAbove ? 'auto' : `${rect.bottom + 8}px`,
            bottom: showAbove ? `${winHeight - rect.top + 8}px` : 'auto',
            left: `${rect.left}px`,
            width: `${rect.width}px`,
            maxHeight: `${Math.min(300, maxH)}px`,
            zIndex: 20000000,
            pointerEvents: 'auto',
            display: 'flex',
            flexDirection: 'column'
        });
    }
  }, [isOpen, options.length]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        // Check if click was on the portaled menu
        const menu = document.getElementById('searchable-select-portal-menu');
        if (menu && menu.contains(event.target)) return;
        setIsOpen(false);
      }
    };
    
    // Close on scroll to prevent detached menus, but ignore scroll events inside the dropdown menu itself
    const handleScroll = (event) => { 
      if (!isOpen) return;
      const menu = document.getElementById('searchable-select-portal-menu');
      if (menu && menu.contains(event.target)) return;
      setIsOpen(false); 
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScroll, true);
    return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        window.removeEventListener("scroll", handleScroll, true);
    }
  }, [isOpen]);

  const filteredOptions = options.filter(opt => {
    if (!opt) return false;
    const search = (searchTerm || "").toLowerCase();
    const name = (opt.name || "").toLowerCase();
    const label = (opt.label || "").toLowerCase();
    return name.includes(search) || label.includes(search);
  });

  const handleSelect = (option) => {
    const optId = option.id || option.value;
    if (multiple) {
        let newValue = Array.isArray(value) ? [...value] : [];
        if (newValue.includes(optId)) {
            newValue = newValue.filter(id => id !== optId);
        } else {
            newValue.push(optId);
        }
        onChange(newValue);
    } else {
        onChange(optId);
        setIsOpen(false);
        setSearchTerm("");
    }
  };

  const renderDropdownMenu = () => {
    if (!isOpen) return null;

    return createPortal(
        <div 
          id="searchable-select-portal-menu"
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-[0_20px_100px_rgba(0,0,0,0.4)] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
          style={menuStyle}
          onClick={(e) => e.stopPropagation()}
        >
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
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2 bespoke-scrollbar" style={{ minHeight: 0 }}>
            {multiple && Array.isArray(value) && value.length > 0 && (
                <button 
                    onClick={(e) => { e.stopPropagation(); onChange([]); }}
                    className="w-full p-2 text-[10px] font-black uppercase text-rose-500 hover:bg-rose-50 rounded-lg mb-2 transition-colors border border-rose-100 border-dashed"
                >
                    Limpiar selección ({value.length})
                </button>
            )}
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => {
                const optId = option.id || option.value;
                const isSelected = multiple 
                    ? (Array.isArray(value) && value.includes(optId))
                    : optId === value;

                return (
                  <div
                    key={optId}
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
                    {(isSelected || multiple) && (
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                        isSelected 
                            ? 'bg-indigo-600 dark:bg-indigo-500 text-white shadow-sm' 
                            : 'bg-slate-100 dark:bg-slate-800 text-transparent border border-slate-200 dark:border-slate-700'
                      }`}>
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
        </div>,
        document.body
    );
  };

  return (
    <div 
      className="relative w-full" 
      ref={containerRef}
    >
      {label && (
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      {/* Visually hidden for accessibility */}
      <input 
        type="text"
        value={Array.isArray(value) ? value.join(',') : (value || '')}
        readOnly
        className="sr-only"
        tabIndex="-1"
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
           <span className={`text-sm font-black uppercase tracking-tight ${(!value || (Array.isArray(value) && value.length === 0)) ? 'text-slate-400 dark:text-slate-300 tracking-widest' : 'text-slate-800 dark:text-white'}`}>
             {getLabel()}
           </span>
        </div>
        
        <ChevronDown size={18} className={`ml-2 text-slate-400 dark:text-slate-500 transition-transform duration-300 ${isOpen ? 'rotate-180 text-indigo-500 dark:text-indigo-400' : ''}`} />
      </div>

      {renderDropdownMenu()}
    </div>
  );
};

export default SearchableSelect;
