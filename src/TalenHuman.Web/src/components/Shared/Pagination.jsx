import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import SearchableSelect from './SearchableSelect';

const Pagination = ({ 
  currentPage, 
  totalPages, 
  onPageChange, 
  totalItems, 
  itemsPerPage, 
  onItemsPerPageChange 
}) => {
  if (totalPages <= 1 && totalItems <= itemsPerPage) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 bg-white border-t border-slate-200 sm:px-6 rounded-b-xl gap-4">
      <div className="flex items-center text-sm text-slate-500">
        <span className="font-medium mr-2">
          Mostrando {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)} a {Math.min(currentPage * itemsPerPage, totalItems)} de {totalItems} resultados
        </span>
        
        <div className="w-32 ml-2">
            <SearchableSelect
                options={[
                    { id: 10, name: '10 / pág' },
                    { id: 25, name: '25 / pág' },
                    { id: 50, name: '50 / pág' },
                    { id: 100, name: '100 / pág' }
                ]}
                value={itemsPerPage}
                onChange={(val) => onItemsPerPageChange(Number(val))}
                placeholder="Ver..."
            />
        </div>
      </div>
      
      <div className="flex items-center space-x-1">
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="p-1 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Primera página"
        >
          <ChevronsLeft size={18} />
        </button>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-1 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Anterior"
        >
          <ChevronLeft size={18} />
        </button>
        
        <div className="flex items-center justify-center min-w-[2rem] h-8 rounded-md bg-indigo-50 text-indigo-600 font-bold text-sm border border-indigo-100">
          {currentPage}
        </div>
        
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages || totalPages === 0}
          className="p-1 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Siguiente"
        >
          <ChevronRight size={18} />
        </button>
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages || totalPages === 0}
          className="p-1 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Última página"
        >
          <ChevronsRight size={18} />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
