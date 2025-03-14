import React, { useState, useEffect } from 'react';
import NotificationService from '../services/NotificationService';
import { useNotifications } from '../contexts/NotificationContext';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import ip from '../components/ip.json';
import './NotificationsPage.css';

const API_URL = `http://${ip.ip}:${ip.port}/api/notifications`;

const NotificationsPage = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { user } = useAuth();
    const { updateNotificationCount } = useNotifications();

    // Загрузка уведомлений
    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const response = await axios.get(API_URL, {
                params: { userId: user?.id }
            });
            setNotifications(response.data);
            
            // Обновляем счетчик в сайдбаре
            const unreadCount = response.data.filter(n => !n.isRead).length;
            NotificationService.updateSidebarBadge(unreadCount);
        } catch (err) {
            console.error('Ошибка при получении уведомлений:', err);
            setError('Не удалось загрузить уведомления');
        } finally {
            setLoading(false);
        }
    };

    // Отметить уведомление как прочитанное
    const markAsRead = async (notificationId) => {
        if (!user?.id) return;

        try {
            await axios.patch(`${API_URL}/${notificationId}/read`, null, {
                params: { userId: user.id }
            });
            
            // Обновляем локальное состояние
            setNotifications(prev => 
                prev.map(notif => 
                    notif.id === notificationId 
                        ? { ...notif, isRead: true }
                        : notif
                )
            );
            
            // Обновляем глобальный счетчик
            const unreadCount = notifications.filter(n => !n.isRead).length - 1;
            NotificationService.updateSidebarBadge(unreadCount);
        } catch (err) {
            console.error('Ошибка при отметке уведомления как прочитанного:', err);
        }
    };

    // Удаление уведомления
    const deleteNotification = async (notificationId) => {
        if (!user?.id) return;

        try {
            await axios.delete(`${API_URL}/${notificationId}`, {
                params: { userId: user.id }
            });
            
            // Обновляем локальное состояние
            setNotifications(prev => prev.filter(n => n.id !== notificationId));
            
            // Обновляем глобальный счетчик
            const unreadCount = notifications.filter(n => n.id !== notificationId && !n.isRead).length;
            NotificationService.updateSidebarBadge(unreadCount);
        } catch (err) {
            console.error('Ошибка при удалении уведомления:', err);
        }
    };

    // Удаление всех уведомлений
    const deleteAllNotifications = async () => {
        if (!user?.id) return;

        try {
            const sources = [...new Set(notifications.map(n => n.source))];
            await Promise.all(sources.map(source => 
                axios.delete(`${API_URL}/source/${source}`, {
                    params: { userId: user.id }
                })
            ));
            
            // Обновляем локальное состояние
            setNotifications([]);
            
            // Обновляем глобальный счетчик
            NotificationService.updateSidebarBadge(0);
        } catch (err) {
            console.error('Ошибка при удалении всех уведомлений:', err);
        }
    };

    // Форматирование времени
    const formatTime = (date, time) => {
        return `${date} ${time}`;
    };

    useEffect(() => {
        if (user?.id) {
            fetchNotifications();
            
            // Обновляем уведомления каждую минуту
            const interval = setInterval(fetchNotifications, 60000);
            
            return () => clearInterval(interval);
        }
    }, [user?.id]);

    if (loading) {
        return (
            <div className="notifications-page">
                <div className="loading">Загрузка уведомлений...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="notifications-page">
                <div className="error">{error}</div>
            </div>
        );
    }

    return (
        <div className="notifications-page">
            <div className="notifications-header">
                <h1>Уведомления</h1>
                <div className="header-actions">
                    {notifications.length > 0 && (
                        <button 
                            className="clear-all"
                            onClick={deleteAllNotifications}
                        >
                            Очистить все
                        </button>
                    )}
                </div>
            </div>

            <div className="notifications-list">
                {notifications.length > 0 ? (
                    notifications.map(notification => (
                        <div
                            key={notification.id}
                            className={`notification-item ${notification.isRead ? 'read' : 'unread'}`}
                            onMouseEnter={() => !notification.isRead && markAsRead(notification.id)}
                        >
                            <div className="notification-time">
                                {formatTime(notification.eventDate, notification.eventTime)}
                            </div>
                            <div className="notification-content">
                                <div className="notification-title">
                                    {notification.title}
                                </div>
                                <div className="notification-source">
                                    Источник: {notification.source}
                                </div>
                            </div>
                            <div className="notification-actions">
                                {notification.link && (
                                    <a 
                                        href={notification.link}
                                        className="notification-link"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        Перейти →
                                    </a>
                                )}
                                <button
                                    className="delete-notification"
                                    onClick={() => deleteNotification(notification.id)}
                                    title="Удалить уведомление"
                                >
                                    ×
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="no-notifications">
                        <span className="material-icons">notifications_none</span>
                        <p>Нет уведомлений</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotificationsPage; 