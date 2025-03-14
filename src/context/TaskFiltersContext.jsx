import React, { createContext, useContext, useState, useEffect } from 'react';
import { getTaskFilters, saveTaskFilters, resetTaskFilters } from '../utils/settings';

const TaskFiltersContext = createContext();

export const TaskFiltersProvider = ({ children }) => {
  const [filters, setFilters] = useState(getTaskFilters());

  // Загрузка фильтров при монтировании
  useEffect(() => {
    const savedFilters = getTaskFilters();
    setFilters(savedFilters);
  }, []);

  const updateFilters = (newFilters) => {
    const updatedFilters = { ...filters, ...newFilters };
    saveTaskFilters(updatedFilters);
    setFilters(updatedFilters);
  };

  const resetFilters = () => {
    const defaultFilters = resetTaskFilters();
    setFilters(defaultFilters);
  };

  return (
    <TaskFiltersContext.Provider value={{ filters, updateFilters, resetFilters }}>
      {children}
    </TaskFiltersContext.Provider>
  );
};

export const useTaskFilters = () => {
  const context = useContext(TaskFiltersContext);
  if (!context) {
    throw new Error('useTaskFilters должен использоваться внутри TaskFiltersProvider');
  }
  return context;
}; 