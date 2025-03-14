import React, { createContext, useContext, useState, useEffect } from 'react';
import NotificationService from '../services/NotificationService';
import { useAuth } from '../context/AuthContext';
import ip from '../ip.json';

const address = `http://${ip.ip}:${ip.port}`;

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isConnected, setIsConnected] = useState(false);
    const { user } = useAuth();

    useEffect(() => {
        const handleNotificationEvent = (event) => {
            switch (event.type) {
                case 'notifications':
                    const userNotifications = event.notifications
                        .filter(n => n.userId === user?.id)
                        .filter((notification, index, self) =>
                            index === self.findIndex((n) => n.id === notification.id)
                        );
                    setNotifications(userNotifications);
                    setUnreadCount(userNotifications.filter(n => !n.isRead).length);
                    break;
                case 'new_notification':
                    if (event.notification.userId === user?.id) {
                        setNotifications(prev => {
                            const isDuplicate = prev.some(n => n.id === event.notification.id);
                            if (isDuplicate) {
                                return prev;
                            }
                            return [...prev, event.notification];
                        });
                        if (!event.notification.isRead) {
                            setUnreadCount(prev => prev + 1);
                        }
                    }
                    break;
                case 'connection':
                    setIsConnected(event.status === 'connected');
                    break;
                case 'badge_update':
                    if (event.userId === user?.id) {
                        setUnreadCount(event.count);
                    }
                    break;
                case 'error':
                    console.error('Ошибка уведомлений:', event.message);
                    break;
            }
        };

        // Добавляем слушатель
        NotificationService.addListener(handleNotificationEvent);

        // Инициализируем подключение при наличии пользователя
        if (user?.id) {
            NotificationService.initialize(user.id);
        }

        return () => {
            NotificationService.removeListener(handleNotificationEvent);
            NotificationService.disconnect();
        };
    }, [user?.id]);

    const sendNotification = async (notification) => {
        try {
            const currentDate = new Date();
            const notificationData = {
                ...notification,
                eventDate: notification.eventDate || currentDate.toISOString().split('T')[0],
                eventTime: notification.eventTime || currentDate.toISOString().split('T')[1].slice(0, 8),
                title: notification.title || 'Новое уведомление',
                source: notification.source || 'system',
                isRead: false
            };

            console.log('Отправка уведомления:', notificationData);

            const response = await fetch(`${address}/api/notifications`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(notificationData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to send notification');
            }

            const newNotification = await response.json();
            
            // Обновляем список уведомлений и счетчик только если уведомление для текущего пользователя
            if (newNotification.userId === user?.id) {
                setNotifications(prev => [...prev, newNotification]);
                if (!newNotification.isRead) {
                    setUnreadCount(prev => prev + 1);
                }
            }
        } catch (error) {
            console.error('Ошибка при отправке уведомления:', error);
            throw error;
        }
    };

    const markAsRead = async (notificationId) => {
        try {
            const updatedNotifications = notifications.map(notification =>
                notification.id === notificationId
                    ? { ...notification, isRead: true }
                    : notification
            );
            setNotifications(updatedNotifications);
            setUnreadCount(updatedNotifications.filter(n => !n.isRead).length);
        } catch (error) {
            console.error('Ошибка при отметке уведомления как прочитанного:', error);
        }
    };

    const deleteNotification = async (notificationId) => {
        try {
            const updatedNotifications = notifications.filter(n => n.id !== notificationId);
            setNotifications(updatedNotifications);
            setUnreadCount(updatedNotifications.filter(n => !n.isRead).length);
        } catch (error) {
            console.error('Ошибка при удалении уведомления:', error);
        }
    };

    return (
        <NotificationContext.Provider
            value={{
                notifications,
                unreadCount,
                setUnreadCount,
                isConnected,
                markAsRead,
                deleteNotification,
                sendNotification
            }}
        >
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications должен использоваться внутри NotificationProvider');
    }
    return context;
};

export default NotificationContext; 