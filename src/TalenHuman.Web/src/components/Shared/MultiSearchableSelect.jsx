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
          disabled ? 'bg-slate-100 cursor-not-allowed opacity-80 border-slate-200' :
          isOpen ? 'bg-white border-indigo-500 ring-2 ring-indigo-50 shadow-sm' : 
          'bg-slate-50 border-slate-200 hover:border-slate-300'
        }`}
      >
        <Icon size={18} className={`ml-1 mr-2 ${isOpen ? 'text-indigo-500' : 'text-slate-400'}`} />
        
        <div className="flex flex-wrap gap-1.5 flex-1">
          {selectedOptions.length > 0 ? (
            selectedOptions.map(opt => (
              <div 
                key={opt.id || opt.value} 
                className="flex items-center gap-1 bg-indigo-100 text-indigo-700 px-2 py-1 rounded-lg text-xs font-bold border border-indigo-200 animate-in zoom-in-95 duration-200"
              >
                <span>{opt.name || opt.label}</span>
                <X 
                  size={12} 
                  className="hover:text-indigo-900 cursor-pointer" 
                  onClick={(e) => removeOption(e, opt.id || opt.value)}
                />
              </div>
            ))
          ) : (
            <span className="text-slate-400 ml-1">{placeholder}</span>
          )}
        </div>
        
        <ChevronDown size={18} className={`ml-2 mr-1 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-indigo-500' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-2 border-bottom border-slate-100 bg-slate-50/50">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                autoFocus
                type="text"
                placeholder="Buscar tiendas..."
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
                const isSelected = value.includes(option.id || option.value);
                return (
                  <div
                    key={option.id || option.value}
                    onClick={(e) => {
                        e.stopPropagation();
                        toggleOption(option.id || option.value);
                    }}
                    className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-colors ${
                      isSelected ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span className={`text-sm ${isSelected ? 'font-bold' : 'font-medium'}`}>
                      {option.name || option.label}
                    </span>
                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
                      isSelected ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-300'
                    }`}>
                      {isSelected && <Check size={14} className="text-white" />}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-4 text-center text-slate-400 text-sm italic">
                No se encontraron tiendas
              </div>
            )}
          </div>
          
          <div className="p-2 bg-slate-50 border-t border-slate-100 flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4">
               <span>{value.length} seleccionadas</span>
               <button 
                onClick={(e) => { e.stopPropagation(); onChange([]); }}
                className="text-indigo-600 hover:text-indigo-800"
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
