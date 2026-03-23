import { useState, useMemo, useEffect } from 'react';

export const useTableData = (initialData, searchFields = [], defaultItemsPerPage = 10) => {
  const [data, setData] = useState(initialData);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(defaultItemsPerPage);

  // Update data if the parent passes a new initialData (e.g., after an API fetch)
  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) {
      return data;
    }
    const lowercasedTerm = searchTerm.toLowerCase();
    return data.filter(item => {
      // If no searchFields provided, search purely by item's string values (shallow)
      if (searchFields.length === 0) {
        return Object.values(item).some(val => 
          String(val).toLowerCase().includes(lowercasedTerm)
        );
      }
      // Otherwise, search specific fields
      return searchFields.some(field => {
        const value = item[field];
        return value && String(value).toLowerCase().includes(lowercasedTerm);
      });
    });
  }, [data, searchTerm, searchFields]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  // Auto-correct current page if data shrinks
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage]);

  return {
    data: paginatedData,
    totalItems: filteredData.length,
    searchTerm,
    setSearchTerm: (term) => {
      setSearchTerm(term);
      setCurrentPage(1); // Reset to first page on search
    },
    currentPage,
    setCurrentPage,
    totalPages,
    itemsPerPage,
    setItemsPerPage
  };
};
