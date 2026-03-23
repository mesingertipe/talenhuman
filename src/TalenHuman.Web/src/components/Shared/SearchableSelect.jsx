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
  required = false
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
        value={value || ''}
        onChange={() => {}}
        className="sr-only"
        style={{ opacity: 0, position: 'absolute', zIndex: -1, width: '1px', height: '1px', padding: 0, margin: 0, border: 'none' }}
        tabIndex={-1}
      />
      
      <div 
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`relative flex items-center p-3 rounded-xl border transition-all cursor-pointer ${
          disabled ? 'bg-slate-100 cursor-not-allowed opacity-80 border-slate-200' :
          isOpen ? 'bg-white border-indigo-500 ring-2 ring-indigo-50 shadow-sm' : 
          'bg-slate-50 border-slate-200 hover:border-slate-300'
        }`}
      >
        {Icon && <Icon size={18} className={`mr-3 ${isOpen ? 'text-indigo-500' : 'text-slate-400'}`} />}
        
        <div className="flex-1 truncate">
          {selectedOption ? (
            <span className="font-medium text-slate-800">{selectedOption.name || selectedOption.label}</span>
          ) : (
            <span className="text-slate-400">{placeholder}</span>
          )}
        </div>
        
        <ChevronDown size={18} className={`ml-2 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-indigo-500' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-2 border-bottom border-slate-100 bg-slate-50/50">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                ref={inputRef}
                autoFocus
                type="text"
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-2 pl-9 text-sm rounded-lg border-slate-200 focus:ring-2 focus:ring-indigo-500 border"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
          
          <div className="max-h-60 overflow-y-auto p-1 custom-scrollbar">
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
                    className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-colors ${
                      isSelected ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span className={`text-sm ${isSelected ? 'font-bold' : 'font-medium'}`}>
                      {option.name || option.label}
                    </span>
                    {isSelected && <Check size={16} className="text-indigo-600" />}
                  </div>
                );
              })
            ) : (
              <div className="p-4 text-center text-slate-400 text-sm italic">
                No se encontraron resultados
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;
