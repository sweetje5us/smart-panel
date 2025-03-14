import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import ip from '../ip.json';
import './Settings.css';

const address = `http://${ip.ip}:${ip.port}`;

const themeOptions = [
  { value: 'light', label: 'Светлая' },
  { value: 'dark', label: 'Темная' },
  { value: 'loft-light', label: 'Лофт светлый' },
  { value: 'loft-dark', label: 'Лофт темный' },
  { value: 'halloween', label: 'Хэллоуин' },
  { value: 'new-year', label: 'Новый год' },
  { value: 'cyberpunk', label: 'Киберпанк' },
  { value: 'scandinavian', label: 'Скандинавская' }
];

const Settings = () => {
  const { user, getUser, updateUser } = useAuth();
  const { updateTheme } = useTheme();
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedSettings, setEditedSettings] = useState(null);

  useEffect(() => {
    loadUserData();
  }, [user?.id]);

  const loadUserData = async () => {
    if (!user?.id) return;
    
    try {
      const result = await getUser(user.id);
      if (result.success) {
        setUserData(result.user);
        // Применяем тему из настроек пользователя только при загрузке
        if (result.user.settings?.theme) {
          updateTheme(result.user.settings.theme);
        }
      } else {
        setError('Ошибка при загрузке настроек');
      }
    } catch (err) {
      setError('Произошла ошибка при загрузке настроек');
    } finally {
      setIsLoading(false);
    }
  };

  // Функция для применения всех настроек
  const applySettings = (settings) => {
    // Применяем тему
    if (settings.theme) {
      updateTheme(settings.theme);
    }

    // Применяем настройки сервисов
    if (settings.services) {
      // Публикуем событие для обновления настроек компаньона
      const companionEvent = new CustomEvent('companionSettingsChanged', {
        detail: { type: settings.services.companion?.type || 'none' }
      });
      window.dispatchEvent(companionEvent);

      // Публикуем событие для обновления настроек сайдбара
      const sidebarEvent = new CustomEvent('sidebarSettingsChanged', {
        detail: { enabled: settings.services.sidebar }
      });
      window.dispatchEvent(sidebarEvent);

      // Публикуем событие для обновления настроек уведомлений
      const notificationEvent = new CustomEvent('notificationSettingsChanged', {
        detail: { enabled: settings.services.notification }
      });
      window.dispatchEvent(notificationEvent);

      // Публикуем событие для обновления настроек календаря
      const calendarEvent = new CustomEvent('calendarSettingsChanged', {
        detail: { enabled: settings.services.calendar }
      });
      window.dispatchEvent(calendarEvent);

      // Публикуем событие для обновления настроек задач
      const tasksEvent = new CustomEvent('tasksSettingsChanged', {
        detail: { enabled: settings.services.tasks }
      });
      window.dispatchEvent(tasksEvent);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!editedSettings) return;

    setError('');
    setSuccess('');

    try {
      const result = await updateUser(user.id, {
        settings: editedSettings
      });

      if (result.success) {
        setSuccess('Настройки успешно обновлены');
        setIsEditing(false);
        setEditedSettings(null);
        
        // Применяем все настройки
        applySettings(editedSettings);
        
        // Перезагружаем данные пользователя
        loadUserData();
      } else {
        setError(result.error || 'Ошибка при обновлении настроек');
      }
    } catch (err) {
      setError('Произошла ошибка при обновлении настроек');
    }
  };

  const handleEdit = (e) => {
    e.preventDefault();
    console.log('Включение режима редактирования');
    setEditedSettings(userData.settings);
    setIsEditing(true);
  };

  const handleCancel = (e) => {
    e.preventDefault();
    console.log('Отмена редактирования');
    setIsEditing(false);
    setEditedSettings(null);
  };

  const handleThemeChange = (newTheme) => {
    console.log('Изменение темы:', newTheme);
    setEditedSettings(prev => ({
      ...prev,
      theme: newTheme
    }));
  };

  const handleServiceToggle = (service) => {
    console.log('Переключение сервиса:', service);
    setEditedSettings(prev => ({
      ...prev,
      services: {
        ...prev.services,
        [service]: !prev.services[service]
      }
    }));
  };

  const handleCompanionTypeChange = (type) => {
    console.log('Изменение типа помощника:', type);
    setEditedSettings(prev => ({
      ...prev,
      services: {
        ...prev.services,
        companion: {
          ...prev.services.companion,
          type
        }
      }
    }));
  };

  if (isLoading) {
    return <div className="settings-container">Загрузка...</div>;
  }

  if (!userData) {
    return <div className="settings-container">Настройки недоступны</div>;
  }

  const settings = isEditing ? editedSettings : userData.settings;

  return (
    <div className="settings-container">
      <h2>Настройки</h2>
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="settings-section">
          <h3>Внешний вид</h3>
          <div className="setting-item">
            <label>Тема оформления:</label>
            <select
              value={settings.theme || 'light'}
              onChange={(e) => handleThemeChange(e.target.value)}
              disabled={!isEditing}
            >
              {themeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="settings-section">
          <h3>Сервисы</h3>
          <div className="setting-item">
            <label>
              <input
                type="checkbox"
                checked={settings.services.sidebar}
                onChange={() => handleServiceToggle('sidebar')}
                disabled={!isEditing}
              />
              Боковая панель
            </label>
          </div>
          <div className="setting-item">
            <label>
              <input
                type="checkbox"
                checked={settings.services.notification}
                onChange={() => handleServiceToggle('notification')}
                disabled={!isEditing}
              />
              Уведомления
            </label>
          </div>
          <div className="setting-item">
            <label>
              <input
                type="checkbox"
                checked={settings.services.calendar}
                onChange={() => handleServiceToggle('calendar')}
                disabled={!isEditing}
              />
              Календарь
            </label>
          </div>
          <div className="setting-item">
            <label>
              <input
                type="checkbox"
                checked={settings.services.tasks}
                onChange={() => handleServiceToggle('tasks')}
                disabled={!isEditing}
              />
              Задачи
            </label>
          </div>
        </div>

        <div className="settings-section">
          <h3>Помощник</h3>
          <div className="setting-item">
            <label>Тип помощника:</label>
            <select
              value={settings.services.companion?.type || 'none'}
              onChange={(e) => handleCompanionTypeChange(e.target.value)}
              disabled={!isEditing}
            >
              <option value="none">Отключен</option>
              <option value="bear">Медведи</option>
              <option value="pickachu">Пикачу</option>
            </select>
          </div>
        </div>

        <div className="settings-actions">
          {!isEditing ? (
            <button type="button" onClick={handleEdit}>
              Редактировать
            </button>
          ) : (
            <>
              <button type="submit">Сохранить</button>
              <button type="button" onClick={handleCancel}>
                Отмена
              </button>
            </>
          )}
        </div>
      </form>
    </div>
  );
};

export default Settings; 