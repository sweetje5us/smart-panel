import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useTaskFilters } from '../context/TaskFiltersContext';
import './Tasks.css';

// Функция для дебаунса
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, delay]);

  return debouncedValue;
};

const Tasks = () => {
  const { filters, updateFilters, resetFilters } = useTaskFilters();
  const [allTasks, setAllTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchInput, setSearchInput] = useState(filters.search);
  const debouncedSearch = useDebounce(searchInput, 300);

  // Загрузка задач
  useEffect(() => {
    const loadTasks = async () => {
      setIsLoading(true);
      try {
        // Здесь будет загрузка задач с сервера
        // const response = await fetch('/api/tasks');
        // const tasksData = await response.json();
        
        // Временные данные для демонстрации
        const mockTasks = [
          {
            id: 1,
            title: 'Задача 1',
            status: 'active',
            priority: 'high',
            date: new Date(),
            description: 'Описание задачи 1'
          },
          {
            id: 2,
            title: 'Задача 2',
            status: 'completed',
            priority: 'medium',
            date: new Date(),
            description: 'Описание задачи 2'
          }
        ];

        setAllTasks(mockTasks);
      } catch (error) {
        console.error('Ошибка при загрузке задач:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTasks();
  }, []);

  // Обновление поиска при изменении debouncedSearch
  useEffect(() => {
    updateFilters({ search: debouncedSearch });
  }, [debouncedSearch, updateFilters]);

  // Мемоизированная функция фильтрации
  const filteredTasks = useMemo(() => {
    if (!allTasks.length) return [];
    
    const searchLower = filters.search.toLowerCase();
    
    return allTasks.filter(task => {
      // Фильтр по статусу
      if (filters.status !== 'all' && task.status !== filters.status) {
        return false;
      }

      // Фильтр по приоритету
      if (filters.priority !== 'all' && task.priority !== filters.priority) {
        return false;
      }

      // Фильтр по дате
      if (filters.date !== 'all') {
        const taskDate = new Date(task.date);
        const today = new Date();
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

        switch (filters.date) {
          case 'today':
            if (taskDate.toDateString() !== today.toDateString()) return false;
            break;
          case 'week':
            if (taskDate < weekAgo) return false;
            break;
          case 'month':
            if (taskDate < monthAgo) return false;
            break;
        }
      }

      // Фильтр по поиску
      if (searchLower) {
        return (
          task.title.toLowerCase().includes(searchLower) ||
          task.description.toLowerCase().includes(searchLower)
        );
      }

      return true;
    }).sort((a, b) => {
      // Сортировка
      const order = filters.sortOrder === 'asc' ? 1 : -1;
      
      switch (filters.sortBy) {
        case 'date':
          return order * (new Date(a.date) - new Date(b.date));
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return order * (priorityOrder[a.priority] - priorityOrder[b.priority]);
        case 'status':
          const statusOrder = { active: 1, completed: 2, cancelled: 3 };
          return order * (statusOrder[a.status] - statusOrder[b.status]);
        default:
          return 0;
      }
    });
  }, [allTasks, filters]);

  // Мемоизированные обработчики
  const handleStatusChange = useCallback((status) => {
    updateFilters({ status });
  }, [updateFilters]);

  const handlePriorityChange = useCallback((priority) => {
    updateFilters({ priority });
  }, [updateFilters]);

  const handleDateChange = useCallback((date) => {
    updateFilters({ date });
  }, [updateFilters]);

  const handleSearchChange = useCallback((e) => {
    setSearchInput(e.target.value);
  }, []);

  const handleSortChange = useCallback((sortBy, sortOrder) => {
    updateFilters({ sortBy, sortOrder });
  }, [updateFilters]);

  return (
    <div className="tasks-container">
      <div className="tasks-header">
        <h1>Задачи</h1>
        <button onClick={resetFilters} className="reset-filters-btn">
          Сбросить фильтры
        </button>
      </div>

      <div className="filters-section">
        <div className="filter-group">
          <label>Статус:</label>
          <select 
            value={filters.status}
            onChange={(e) => handleStatusChange(e.target.value)}
          >
            <option value="all">Все</option>
            <option value="active">Активные</option>
            <option value="completed">Завершенные</option>
            <option value="cancelled">Отмененные</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Приоритет:</label>
          <select 
            value={filters.priority}
            onChange={(e) => handlePriorityChange(e.target.value)}
          >
            <option value="all">Все</option>
            <option value="high">Высокий</option>
            <option value="medium">Средний</option>
            <option value="low">Низкий</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Дата:</label>
          <select 
            value={filters.date}
            onChange={(e) => handleDateChange(e.target.value)}
          >
            <option value="all">Все</option>
            <option value="today">Сегодня</option>
            <option value="week">На неделю</option>
            <option value="month">На месяц</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Поиск:</label>
          <input
            type="text"
            value={searchInput}
            onChange={handleSearchChange}
            placeholder="Поиск задач..."
          />
        </div>

        <div className="filter-group">
          <label>Сортировка:</label>
          <select 
            value={filters.sortBy}
            onChange={(e) => handleSortChange(e.target.value, filters.sortOrder)}
          >
            <option value="date">По дате</option>
            <option value="priority">По приоритету</option>
            <option value="status">По статусу</option>
          </select>
          <button 
            onClick={() => handleSortChange(filters.sortBy, filters.sortOrder === 'asc' ? 'desc' : 'asc')}
            className="sort-order-btn"
          >
            {filters.sortOrder === 'asc' ? '↑' : '↓'}
          </button>
        </div>
      </div>

      <div className="tasks-list">
        {isLoading ? (
          <div className="loading">Загрузка задач...</div>
        ) : filteredTasks.length === 0 ? (
          <div className="no-tasks">Задачи не найдены</div>
        ) : (
          filteredTasks.map(task => (
            <div key={task.id} className="task-item">
              <h3>{task.title}</h3>
              <p>{task.description}</p>
              <div className="task-meta">
                <span className={`status ${task.status}`}>{task.status}</span>
                <span className={`priority ${task.priority}`}>{task.priority}</span>
                <span className="date">{new Date(task.date).toLocaleDateString()}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Tasks; 