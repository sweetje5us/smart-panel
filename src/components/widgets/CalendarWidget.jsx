import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';
import ip from '../ip.json';
import { useNotifications } from '../../contexts/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import NotificationService from '../../services/NotificationService';
import notificationSound from '../../assets/notification.mp3';
import './CalendarWidget.css';

const address = `${ip.ip}:${ip.port}`;

// Форматирование времени события
const formatEventTime = (time, notification) => {
    if (!notification?.enabled) return time;
    return `${time} (⏰ за ${notification.time} мин)`;
};

// Выносим компонент модального окна в отдельный компонент
const EventModalPortal = ({ event, onClose }) => {
    const audioRef = useRef(null);

    useEffect(() => {
        audioRef.current = new Audio(notificationSound);
        audioRef.current.preload = 'auto';
    }, []);

    useEffect(() => {
        if (event) {
            try {
                if (audioRef.current) {
                    audioRef.current.currentTime = 0;
                    audioRef.current.play().catch(error => {
                        console.error('Ошибка воспроизведения звука:', error);
                    });
                }
            } catch (error) {
                console.error('Ошибка при работе со звуком:', error);
            }
        }
    }, [event]);

    if (!event) return null;

    return ReactDOM.createPortal(
        <div className="event-modal-overlay" onClick={onClose}>
            <div className="event-modal" onClick={e => e.stopPropagation()}>
                <div className="event-modal-header">
                    <h3>{event.title}</h3>
                    <button className="modal-close-btn" onClick={onClose}>×</button>
                </div>
                <div className="event-modal-content">
                    <div className="modal-info-row">
                        <span className="modal-label">Время:</span>
                        <span className="modal-value">{formatEventTime(event.time, event.notification)}</span>
                    </div>
                    {event.location && (
                        <div className="modal-info-row">
                            <span className="modal-label">Место:</span>
                            <span className="modal-value">
                                {event.location.startsWith('http') ? (
                                    <a href={event.location} target="_blank" rel="noopener noreferrer">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '16px', height: '16px', marginRight: '4px' }}>
                                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                                            <polyline points="15 3 21 3 21 9"></polyline>
                                            <line x1="10" y1="14" x2="21" y2="3"></line>
                                        </svg>
                                        {event.location}
                                    </a>
                                ) : (
                                    <span>
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '16px', height: '16px', marginRight: '4px' }}>
                                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                            <circle cx="12" cy="10" r="3"></circle>
                                        </svg>
                                        {event.location}
                                    </span>
                                )}
                            </span>
                        </div>
                    )}
                    {event.repeatDays?.length > 0 && (
                        <div className="modal-info-row">
                            <span className="modal-label">Повторяется:</span>
                            <span className="modal-value">
                                {event.repeatDays.map(day => ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'][day - 1]).join(', ')}
                            </span>
                        </div>
                    )}
                    {event.notification?.enabled && (
                        <div className="modal-info-row">
                            <span className="modal-label">Уведомление:</span>
                            <span className="modal-value">
                                За {event.notification.time} минут до начала
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
};

const CalendarWidget = () => {
    const { unreadCount, setUnreadCount } = useNotifications();
    const { user } = useAuth();
    const [todayEvents, setTodayEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [sentNotifications, setSentNotifications] = useState(() => {
        // Инициализируем состояние из localStorage
        const saved = localStorage.getItem('calendarSentNotifications');
        return saved ? new Set(JSON.parse(saved)) : new Set();
    });

    // Инициализируем аудио с правильным путем
    const audioRef = useRef(null);
    useEffect(() => {
        audioRef.current = new Audio(notificationSound);
        audioRef.current.preload = 'auto';
    }, []);

    // Сохраняем состояние в localStorage при изменении
    useEffect(() => {
        localStorage.setItem('calendarSentNotifications', JSON.stringify([...sentNotifications]));
    }, [sentNotifications]);

    const formatDate = (date) => {
        const d = new Date(date);
        // Устанавливаем время в полночь в локальном часовом поясе
        d.setHours(0, 0, 0, 0);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const getCurrentDate = () => {
        const now = new Date();
        // Устанавливаем время в полночь в локальном часовом поясе
        now.setHours(0, 0, 0, 0);
        return now;
    };

    const getDayOfWeek = (date) => {
        const day = date.getDay();
        return day === 0 ? 7 : day;
    };

    // Проверка повторяется ли событие сегодня
    const isEventRepeatingToday = (event) => {
        if (!event.repeatDays || event.repeatDays.length === 0) return false;
        const today = getCurrentDate();
        const dayOfWeek = getDayOfWeek(today);
        const eventDate = new Date(event.date);
        eventDate.setHours(0, 0, 0, 0);
        return eventDate <= today && event.repeatDays.includes(dayOfWeek);
    };

    // Воспроизведение звука уведомления
    const playNotificationSound = () => {
        try {
            if (audioRef.current) {
                audioRef.current.currentTime = 0;
                audioRef.current.play().catch(error => {
                    console.error('Ошибка воспроизведения звука:', error);
                });
            }
        } catch (error) {
            console.error('Ошибка при работе со звуком:', error);
        }
    };

    // Добавляем состояние для модального окна
    const [modalEvent, setModalEvent] = useState(null);

    // Обновляем функцию showEnhancedNotification для использования модального окна
    const showEnhancedNotification = (event, isPreNotification = false) => {
        if (isPreNotification) {
            // Для предварительных уведомлений оставляем всплывающее уведомление
            const timeLeft = event.notification.time;
            const title = `Напоминание о событии "${event.title}"`;
            const notification = document.createElement('div');
            notification.className = 'enhanced-notification pre-notification';
            notification.innerHTML = `
                <div class="notification-content">
                    <div class="notification-icon">⏰</div>
                    <div class="notification-text">
                        <div class="notification-title">${title}</div>
                        <div class="notification-body">Событие начнется через ${timeLeft} минут</div>
                    </div>
                </div>
                <button class="notification-close">×</button>
            `;

            const closeButton = notification.querySelector('.notification-close');
            closeButton.addEventListener('click', () => {
                notification.classList.add('notification-hiding');
                setTimeout(() => notification.remove(), 300);
            });

            setTimeout(() => {
                if (document.body.contains(notification)) {
                    notification.classList.add('notification-hiding');
                    setTimeout(() => notification.remove(), 300);
                }
            }, 10000);

            document.body.appendChild(notification);
            setTimeout(() => notification.classList.add('notification-visible'), 10);
        } else {
            // Для основных уведомлений показываем модальное окно
            setModalEvent(event);
        }
    };

    // Отправка уведомления через API
    const sendNotificationToAPI = async (title, eventTime, isPreNotification = false) => {
        if (!user?.id) return;

        try {
            const currentDate = new Date();
            const formattedDate = formatDate(currentDate);
            
            await NotificationService.createNotification({
                userId: user.id,
                title: title,
                message: title,
                type: isPreNotification ? 'warning' : 'info',
                source: 'calendar',
                date: formattedDate,
                time: eventTime,
                link: `${address}/calendar`,
                isRead: false
            });
            
            // Обновляем счетчик непрочитанных уведомлений
            if (setUnreadCount) {
                setUnreadCount(prev => prev + 1);
            }
        } catch (error) {
            console.error('Ошибка при отправке уведомления:', error);
        }
    };

    // Отдельный эффект для проверки уведомлений
    useEffect(() => {
        if (todayEvents.length === 0) return;

        // Проверяем уведомления каждые 30 секунд
        const notificationInterval = setInterval(() => {
            checkNotifications(todayEvents);
        }, 30000);

        // Проверяем уведомления сразу при изменении событий
        checkNotifications(todayEvents);

        return () => clearInterval(notificationInterval);
    }, [todayEvents]);

    // Обновляем функцию checkNotifications
    const checkNotifications = (events) => {
        const now = new Date();
        const currentHours = now.getHours();
        const currentMinutes = now.getMinutes();
        const currentTimeStr = `${String(currentHours).padStart(2, '0')}:${String(currentMinutes).padStart(2, '0')}`;
        const currentTotalMinutes = currentHours * 60 + currentMinutes;
        
        events.forEach(event => {
            const [eventHours, eventMinutes] = event.time.split(':').map(Number);
            const eventTotalMinutes = eventHours * 60 + eventMinutes;
            const notificationKey = `${event.id}-${event.time}`;
            
            // Проверяем предварительное уведомление
            if (event.notification?.enabled) {
                const preNotificationTime = eventTotalMinutes - event.notification.time;
                const preNotificationKey = `${notificationKey}-pre`;
                
                if (currentTotalMinutes === preNotificationTime && !sentNotifications.has(preNotificationKey)) {
                    showEnhancedNotification(event, true);
                    sendNotificationToAPI(`Напоминание о событии "${event.title}"`, event.time, true);
                    setSentNotifications(prev => new Set([...prev, preNotificationKey]));
                }
            }
            
            // Проверяем основное уведомление
            if (event.time === currentTimeStr && !sentNotifications.has(notificationKey)) {
                showEnhancedNotification(event, false);
                sendNotificationToAPI(`Событие "${event.title}" начинается сейчас`, event.time);
                setSentNotifications(prev => new Set([...prev, notificationKey]));
            }
        });
    };

    // Очистка старых уведомлений каждый день
    useEffect(() => {
        const today = new Date().toDateString();
        const clearOldNotifications = () => {
            setSentNotifications(new Set());
            localStorage.removeItem('calendarSentNotifications');
        };

        // Очищаем уведомления при изменении даты
        const checkDate = () => {
            const currentDate = new Date().toDateString();
            if (currentDate !== today) {
                clearOldNotifications();
            }
        };

        // Проверяем дату каждый час
        const interval = setInterval(checkDate, 3600000);
        return () => clearInterval(interval);
    }, []);

    const fetchTodayEvents = async () => {
        if (!user?.id) return;

        try {
            setLoading(true);
            const today = getCurrentDate();
            const todayStr = formatDate(today);
            
            const response = await axios.get(`http://${address}/api/calendar/events`, {
                params: {
                    userId: user.id,
                    date: todayStr
                }
            });
            
            if (response.status === 200) {
                // Фильтруем и сортируем события
                const allEvents = response.data;
                const todayEvents = allEvents.filter(event => {
                    const eventDate = new Date(event.date);
                    eventDate.setHours(0, 0, 0, 0);
                    return eventDate.getTime() === today.getTime() || isEventRepeatingToday(event);
                }).sort((a, b) => a.time.localeCompare(b.time));

                setTodayEvents(todayEvents);
                setError(null);
            }
        } catch (err) {
            console.error('Ошибка при получении событий:', err);
            setError('Не удалось загрузить события');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Первоначальная загрузка событий
        fetchTodayEvents();

        // Обновляем события каждую минуту
        const interval = setInterval(fetchTodayEvents, 60000);

        return () => clearInterval(interval);
    }, [user?.id]);

    const formatDisplayDate = (date) => {
        const today = getCurrentDate();
        return today.toLocaleDateString('ru-RU', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    // Проверка является ли событие текущим
    const isCurrentEvent = (event) => {
        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();
        const [hours, minutes] = event.time.split(':').map(Number);
        const eventTime = hours * 60 + minutes;
        const eventEndTime = eventTime + 60; // Предполагаем, что событие длится 1 час
        return currentTime >= eventTime && currentTime < eventEndTime;
    };

    // Проверка является ли событие прошедшим
    const isPastEvent = (event) => {
        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();
        const [hours, minutes] = event.time.split(':').map(Number);
        const eventTime = hours * 60 + minutes;
        return currentTime > eventTime;
    };

    if (loading) {
        return (
            <div className="calendar-widget">
                <div className="calendar-widget-header">
                    <div className="today-date">
                        {formatDisplayDate(new Date())}
                    </div>
                </div>
                <div className="calendar-widget-content loading">
                    Загрузка событий...
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="calendar-widget">
                <div className="calendar-widget-header">
                    <div className="today-date">
                        {formatDisplayDate(new Date())}
                    </div>
                </div>
                <div className="calendar-widget-content error">
                    {error}
                </div>
            </div>
        );
    }

    return (
        <div className="calendar-widget">
            <div className="calendar-widget-header">
                <div className="header-content">
                    <div className="today-date">
                        {formatDisplayDate(new Date())}
                    </div>
                    <a href="/calendar" className="add-calendar-link" title="Перейти в календарь">
                        +
                    </a>
                </div>
            </div>
            <div className="calendar-widget-content">
                {todayEvents.length > 0 ? (
                    <div className="events-list">
                        {todayEvents.map(event => {
                            const isPast = isPastEvent(event);
                            const isCurrent = isCurrentEvent(event);
                            return (
                                <div 
                                    key={event.id} 
                                    className={`event-item ${isPast ? 'past-event' : ''} ${isCurrent ? 'current-event' : ''}`}
                                >
                                    <div className="event-time">
                                        {formatEventTime(event.time, event.notification)}
                                    </div>
                                    <div className="event-title">
                                        {event.title}
                                        {event.repeatDays?.length > 0 && (
                                            <span className="repeat-indicator" title="Повторяющееся событие">
                                                🔄
                                            </span>
                                        )}
                                        {event.location && (
                                            <span className="location-indicator" title={event.location}>
                                                📍
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="no-events">
                        Нет событий на сегодня
                    </div>
                )}
            </div>
            {modalEvent && <EventModalPortal event={modalEvent} onClose={() => setModalEvent(null)} />}
        </div>
    );
};

export default CalendarWidget; 