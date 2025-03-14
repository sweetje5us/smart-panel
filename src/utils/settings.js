// Ключи для localStorage
const STORAGE_KEYS = {
  USER: 'user',
  TASK_FILTERS: 'taskFilters'
};

// Начальные значения фильтров
const DEFAULT_TASK_FILTERS = {
  status: 'all',
  priority: 'all',
  date: 'all',
  search: '',
  sortBy: 'date',
  sortOrder: 'desc',
  kanbanId: [],
  showBacklog: false,
  sprint: []
};

// Функции для работы с настройками пользователя
export const saveUserSettings = (settings) => {
  try {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(settings));
    return settings;
  } catch (error) {
    console.error('Ошибка при сохранении настроек пользователя:', error);
    return null;
  }
};

export const getUserSettings = () => {
  try {
    const settings = localStorage.getItem(STORAGE_KEYS.USER);
    return settings ? JSON.parse(settings) : null;
  } catch (error) {
    console.error('Ошибка при получении настроек пользователя:', error);
    return null;
  }
};

// Функции для работы с фильтрами задач
export const saveTaskFilters = (filters) => {
  try {
    // Получаем текущие фильтры
    const currentFilters = getTaskFilters();
    
    // Объединяем текущие фильтры с новыми, сохраняя существующие значения
    const updatedFilters = {
      ...currentFilters,
      ...filters
    };
    
    localStorage.setItem(STORAGE_KEYS.TASK_FILTERS, JSON.stringify(updatedFilters));
    return updatedFilters;
  } catch (error) {
    console.error('Ошибка при сохранении фильтров задач:', error);
    return null;
  }
};

export const getTaskFilters = () => {
  try {
    const filters = localStorage.getItem(STORAGE_KEYS.TASK_FILTERS);
    if (!filters) return DEFAULT_TASK_FILTERS;
    
    const parsedFilters = JSON.parse(filters);
    // Объединяем дефолтные значения с сохраненными, сохраняя существующие значения
    return {
      ...DEFAULT_TASK_FILTERS,
      ...parsedFilters
    };
  } catch (error) {
    console.error('Ошибка при получении фильтров задач:', error);
    return DEFAULT_TASK_FILTERS;
  }
};

export const resetTaskFilters = () => {
  try {
    localStorage.setItem(STORAGE_KEYS.TASK_FILTERS, JSON.stringify(DEFAULT_TASK_FILTERS));
    return DEFAULT_TASK_FILTERS;
  } catch (error) {
    console.error('Ошибка при сбросе фильтров задач:', error);
    return DEFAULT_TASK_FILTERS;
  }
};

// Функция для очистки всех настроек пользователя
export const clearUserSettings = () => {
  try {
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.TASK_FILTERS);
    return true;
  } catch (error) {
    console.error('Ошибка при очистке настроек пользователя:', error);
    return false;
  }
}; 