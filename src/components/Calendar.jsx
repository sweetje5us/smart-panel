import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './Calendar.css';
import ip from '../ip.json'

const API_BASE_URL = `http://${ip.ip}:${ip.port}/api/calendar/events`;

// Праздничные дни в России на 2025 год с названиями
const HOLIDAYS = {
  '2025-01-01': 'Новый год',
  '2025-01-02': 'Новогодние каникулы',
  '2025-01-03': 'Новогодние каникулы',
  '2025-01-04': 'Новогодние каникулы',
  '2025-01-05': 'Новогодние каникулы',
  '2025-01-06': 'Новогодние каникулы',
  '2025-01-07': 'Рождество Христово',
  '2025-01-08': 'Новогодние каникулы',
  '2025-02-23': 'День защитника Отечества',
  '2025-02-24': 'Перенесенный выходной',
  '2025-03-08': 'Международный женский день',
  '2025-03-10': 'Перенесенный выходной',
  '2025-05-01': 'Праздник Весны и Труда',
  '2025-05-02': 'Перенесенный выходной',
  '2025-05-09': 'День Победы',
  '2025-06-12': 'День России',
  '2025-06-13': 'Перенесенный выходной',
  '2025-11-04': 'День народного единства'
};

// Рабочие выходные дни (перенесенные)
const WORKING_WEEKENDS = [
  '2025-02-22', // Рабочая суббота (за 24.02.2025)
  '2025-03-07', // Рабочая пятница (за 10.03.2025)
  '2025-05-08', // Рабочий четверг (за 02.05.2025)
  '2025-06-11', // Рабочая среда (за 13.06.2025)
];

const Calendar = () => {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showEventForm, setShowEventForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);
  const [newEvent, setNewEvent] = useState({
    title: '',
    time: '',
    location: '',
    repeatDays: [],
    notification: {
      enabled: false,
      time: 30
    }
  });
  const [etag, setEtag] = useState('');
  const [selectedDateEvents, setSelectedDateEvents] = useState([]);

  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    // Устанавливаем время в полночь в локальном часовом поясе
    d.setHours(0, 0, 0, 0);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Получение текущей даты в локальном часовом поясе
  const getCurrentDate = () => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now;
  };

  // Сравнение дат с учетом часового пояса
  const isSameDay = (date1, date2) => {
    if (!date1 || !date2) return false;
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    d1.setHours(0, 0, 0, 0);
    d2.setHours(0, 0, 0, 0);
    return d1.getTime() === d2.getTime();
  };

  // Загрузка всех событий
  const fetchAllEvents = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(API_BASE_URL, {
        params: { userId: user.id },
        headers: {
          'If-None-Match': etag
        },
        validateStatus: function (status) {
          return (status >= 200 && status < 300) || status === 304;
        }
      });
      
      if (response.status === 304) {
        return;
      }

      if (response.headers.etag) {
        setEtag(response.headers.etag);
      }

      if (response.status === 200 && response.data) {
        // Фильтруем события по userId текущего пользователя
        const userEvents = response.data.filter(event => event.userId === user.id);
        const sortedEvents = userEvents.sort((a, b) => a.time.localeCompare(b.time));
        setEvents(sortedEvents);
        
        if (selectedDate) {
          const dateEvents = sortedEvents.filter(event => event.date === formatDate(selectedDate));
          setSelectedDateEvents(dateEvents);
        }
      }
    } catch (err) {
      console.error('Ошибка при получении событий:', err);
      setError(err.response?.data?.message || 'Не удалось загрузить события');
      setEvents([]);
      setSelectedDateEvents([]);
    } finally {
      setLoading(false);
    }
  };

  // Загрузка событий с сервера для конкретной даты
  const fetchEvents = async (date) => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);
      const formattedDate = formatDate(date);
      
      const response = await axios.get(API_BASE_URL, {
        params: {
          userId: user.id,
          date: formattedDate
        },
        headers: {
          'If-None-Match': etag
        },
        validateStatus: function (status) {
          return (status >= 200 && status < 300) || status === 304;
        }
      });
      
      if (response.status === 304) {
        return;
      }

      if (response.headers.etag) {
        setEtag(response.headers.etag);
      }

      if (response.status === 200 && response.data) {
        // Фильтруем события по userId текущего пользователя
        const userEvents = response.data.filter(event => event.userId === user.id);
        const sortedEvents = userEvents.sort((a, b) => a.time.localeCompare(b.time));
        setSelectedDateEvents(sortedEvents);
      }
    } catch (err) {
      console.error('Ошибка при получении событий:', err);
      setError(err.response?.data?.message || 'Не удалось загрузить события');
      setSelectedDateEvents([]);
    } finally {
      setLoading(false);
    }
  };

  // Загрузка всех событий при монтировании компонента
  useEffect(() => {
    if (user?.id) {
      fetchAllEvents();
    }
  }, [user?.id]);

  // Загрузка событий при изменении выбранной даты
  useEffect(() => {
    if (selectedDate && user?.id) {
      const dateEvents = getEventsForDate(selectedDate);
      setSelectedDateEvents(dateEvents);
    }
  }, [selectedDate, events, user?.id]);

  // Периодическое обновление событий
  useEffect(() => {
    if (user?.id) {
      const interval = setInterval(() => {
        fetchAllEvents();
      }, 30000); // Обновляем каждые 30 секунд

      return () => clearInterval(interval);
    }
  }, [user?.id]);

  // Получение дня недели (1-7)
  const getDayOfWeek = (date) => {
    const day = date.getDay();
    return day === 0 ? 7 : day; // Преобразуем воскресенье из 0 в 7
  };

  // Проверка повторяется ли событие в этот день
  const isEventRepeating = (event, date) => {
    if (!event.repeatDays || event.repeatDays.length === 0) return false;
    const dayOfWeek = getDayOfWeek(date);
    return event.repeatDays.includes(dayOfWeek);
  };

  // Получение событий для конкретной даты с учетом повторений
  const getEventsForDate = (date) => {
    if (!date) return [];
    const dateStr = formatDate(date);
    const dayEvents = events.filter(event => {
      // Проверяем обычные события на эту дату
      if (event.date === dateStr) return true;
      // Проверяем повторяющиеся события
      const eventDate = new Date(event.date);
      eventDate.setHours(0, 0, 0, 0);
      if (eventDate <= date && isEventRepeating(event, date)) return true;
      return false;
    });
    return dayEvents;
  };

  // Обработчик добавления/редактирования события
  const handleSubmitEvent = async (e) => {
    e.preventDefault();
    if (!newEvent.title || !newEvent.time || !user?.id) {
      setError('Заполните обязательные поля');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const eventData = {
        date: formatDate(selectedDate),
        time: newEvent.time,
        title: newEvent.title,
        location: newEvent.location || '',
        repeatDays: newEvent.repeatDays || [],
        notification: {
          enabled: Boolean(newEvent.notification?.enabled),
          time: newEvent.notification?.enabled ? parseInt(newEvent.notification.time) || 30 : null
        },
        userId: user.id
      };

      let response;
      if (editingEvent) {
        // При редактировании добавляем id события
        response = await axios.put(`${API_BASE_URL}/${editingEvent.id}`, {
          ...eventData,
          id: editingEvent.id
        });
      } else {
        // При создании нового события
        response = await axios.post(API_BASE_URL, eventData);
      }
      
      if (response.status === 200 || response.status === 201) {
        await fetchAllEvents(); // Обновляем все события
        setShowEventForm(false);
        setEditingEvent(null);
        setNewEvent({
          title: '',
          time: '',
          location: '',
          repeatDays: [],
          notification: {
            enabled: false,
            time: 30
          }
        });
      }
    } catch (err) {
      console.error('Ошибка при сохранении события:', err);
      setError(err.response?.data?.message || 'Не удалось сохранить событие');
    } finally {
      setLoading(false);
    }
  };

  // Обработчик удаления события
  const handleDeleteEvent = async (eventId) => {
    const event = events.find(e => e.id === eventId);
    if (!event || !user?.id) return;

    let confirmMessage = 'Вы уверены, что хотите удалить это событие?';
    if (event.repeatDays && event.repeatDays.length > 0) {
      confirmMessage = 'Это повторяющееся событие. Вы уверены, что хотите удалить его полностью?';
    }

    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.delete(`${API_BASE_URL}/${eventId}`, {
        params: { userId: user.id }
      });
      
      if (response.status === 200) {
        // После успешного удаления, обновляем список событий
        await fetchAllEvents();
      }
    } catch (err) {
      console.error('Ошибка при удалении события:', err);
      setError(err.response?.data?.message || 'Не удалось удалить событие');
    } finally {
      setLoading(false);
    }
  };

  // Обработчик начала редактирования события
  const handleEditEvent = async (event) => {
    setEditingEvent(event);
    setNewEvent({
      title: event.title,
      time: event.time,
      location: event.location || '',
      repeatDays: event.repeatDays || [],
      notification: event.notification || { enabled: false, time: 30 }
    });
    setShowEventForm(true);
  };

  // Навигация по месяцам
  const navigateMonth = (direction) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + direction));
  };

  const monthNames = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ];

  // Проверка является ли день выходным
  const isWeekend = (date) => {
    if (!date) return false;
    const day = date.getDay();
    return day === 0 || day === 6; // воскресенье или суббота
  };

  // Проверка является ли день праздником
  const isHoliday = (date) => {
    if (!date) return false;
    const formattedDate = formatDate(date);
    return formattedDate in HOLIDAYS;
  };

  // Получение названия праздника
  const getHolidayName = (date) => {
    if (!date) return null;
    const formattedDate = formatDate(date);
    return HOLIDAYS[formattedDate] || null;
  };

  // Проверка является ли выходной день рабочим
  const isWorkingWeekend = (date) => {
    if (!date) return false;
    return WORKING_WEEKENDS.some(workingDay => {
      const workingDate = new Date(workingDay);
      return isSameDay(date, workingDate);
    });
  };

  // Получение класса для дня
  const getDayClass = (date) => {
    if (!date) return 'day';
    
    const classes = ['day'];
    
    // Проверяем праздники до всего остального
    if (isHoliday(date)) {
      classes.push('weekend');
    } else if (isWeekend(date) && !isWorkingWeekend(date)) {
      classes.push('weekend');
    } else if (isWorkingWeekend(date)) {
      classes.push('working-weekend');
    }
    
    if (selectedDate && isSameDay(date, selectedDate)) {
      classes.push('selected');
    }
    
    if (getEventsForDate(date).length > 0) {
      classes.push('has-events');
    }
    
    return classes.join(' ');
  };

  // Генерация календарной сетки
  const getCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];

    // Получаем день недели для первого дня месяца (0 - воскресенье, 1 - понедельник, и т.д.)
    let firstDayOfWeek = firstDay.getDay();
    // Преобразуем для недели, начинающейся с понедельника
    firstDayOfWeek = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
    
    // Добавляем пустые ячейки для дней до первого дня месяца
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null);
    }

    // Добавляем дни месяца
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const date = new Date(year, month, i);
      // Устанавливаем время в полночь
      date.setHours(0, 0, 0, 0);
      days.push(date);
    }

    return days;
  };

  if (!user?.id) {
    return <div className="calendar-error">Пожалуйста, войдите в систему</div>;
  }

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <button onClick={() => navigateMonth(-1)}>←</button>
        <h2>{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</h2>
        <button onClick={() => navigateMonth(1)}>→</button>
      </div>

      <div className="calendar-grid">
        <div className="weekdays">
          <div>Пн</div>
          <div>Вт</div>
          <div>Ср</div>
          <div>Чт</div>
          <div>Пт</div>
          <div className="weekend">Сб</div>
          <div className="weekend">Вс</div>
        </div>

        <div className="days">
          {getCalendarDays().map((day, index) => (
            <div
              key={index}
              className={getDayClass(day)}
              onClick={() => day && setSelectedDate(day)}
            >
              {day && (
                <>
                  <span className="day-number">{day.getDate()}</span>
                  {getHolidayName(day) && (
                    <div className="holiday-name" title={getHolidayName(day)}>
                      {getHolidayName(day)}
                    </div>
                  )}
                  <div className="day-events">
                    {getEventsForDate(day).map(event => (
                      <div key={event.id} className="event-dot" title={event.title} />
                    ))}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {selectedDate && (
        <div className="selected-date-events">
          <h3>События на {selectedDate.toLocaleDateString()}</h3>
          <button 
            onClick={() => {
              setEditingEvent(null);
              setNewEvent({ title: '', time: '', location: '', repeatDays: [], notification: { enabled: false, time: 30 } });
              setShowEventForm(true);
            }} 
            className="add-event-btn"
          >
            Добавить событие
          </button>
          {loading ? (
            <div className="loading-message">Загрузка...</div>
          ) : error ? (
            <div className="error-message">{error}</div>
          ) : (
            <div className="events-list">
              {selectedDateEvents.map(event => (
                <div key={event.id} className="event-item">
                  <div className="event-time">
                    {event.time}
                  </div>
                  <div className="event-details">
                    <h4>
                      {event.title}
                      {event.repeatDays?.length > 0 && (
                        <span className="repeat-indicator" title="Повторяющееся событие">
                          🔄
                        </span>
                      )}
                    </h4>
                    {event.location && (
                      <div className="event-location">
                        {event.location.startsWith('http') ? (
                          <a href={event.location} target="_blank" rel="noopener noreferrer">
                            📍 Открыть ссылку на место
                          </a>
                        ) : (
                          <span>📍 {event.location}</span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="event-actions">
                    <button 
                      onClick={() => handleEditEvent(event)}
                      className="edit-event-btn"
                      disabled={loading}
                    >
                      ✎
                    </button>
                    <button 
                      onClick={() => handleDeleteEvent(event.id)} 
                      className="delete-event-btn"
                      disabled={loading}
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showEventForm && (
        <div className="event-form-overlay">
          <div className="event-form">
            <h3>{editingEvent ? 'Редактировать событие' : 'Добавить событие'}</h3>
            <form onSubmit={handleSubmitEvent}>
              <div className="form-group">
                <label>Название:</label>
                <input
                  type="text"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Время:</label>
                <input
                  type="time"
                  value={newEvent.time}
                  onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Место:</label>
                <input
                  type="text"
                  value={newEvent.location}
                  onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Повторять по дням:</label>
                <div className="repeat-days">
                  {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((day, index) => (
                    <label key={index} className="day-checkbox">
                      <input
                        type="checkbox"
                        checked={newEvent.repeatDays.includes(index + 1)}
                        onChange={(e) => {
                          const dayNum = index + 1;
                          setNewEvent(prev => ({
                            ...prev,
                            repeatDays: e.target.checked
                              ? [...prev.repeatDays, dayNum]
                              : prev.repeatDays.filter(d => d !== dayNum)
                          }));
                        }}
                      />
                      {day}
                    </label>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label className="notification-checkbox">
                  <input
                    type="checkbox"
                    checked={newEvent.notification.enabled}
                    onChange={(e) => setNewEvent(prev => ({
                      ...prev,
                      notification: {
                        ...prev.notification,
                        enabled: e.target.checked
                      }
                    }))}
                  />
                  Включить уведомления
                </label>
                {newEvent.notification.enabled && (
                  <div className="notification-time">
                    <label>Уведомить за (минут):</label>
                    <input
                      type="number"
                      min="1"
                      max="180"
                      value={newEvent.notification.time}
                      onChange={(e) => setNewEvent(prev => ({
                        ...prev,
                        notification: {
                          ...prev.notification,
                          time: parseInt(e.target.value) || 30
                        }
                      }))}
                    />
                  </div>
                )}
              </div>
              {error && <div className="error-message">{error}</div>}
              <div className="form-actions">
                <button type="submit" disabled={loading}>
                  {loading ? 'Сохранение...' : editingEvent ? 'Сохранить' : 'Создать'}
                </button>
                <button 
                  type="button" 
                  onClick={() => {
                    setShowEventForm(false);
                    setEditingEvent(null);
                    setNewEvent({
                      title: '',
                      time: '',
                      location: '',
                      repeatDays: [],
                      notification: {
                        enabled: false,
                        time: 30
                      }
                    });
                  }} 
                  disabled={loading}
                >
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar; 