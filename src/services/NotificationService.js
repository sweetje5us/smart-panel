import axios from 'axios';
import ip from '../components/ip.json';

// Базовые URL с /api
const BASE_URL = `http://${ip.ip}:${ip.port}/api`;

// WebSocket URL для уведомлений (без /api в пути)
const WS_URL = `ws://${ip.ip}:${ip.port}/ws/notifications`;

console.log('Конфигурация API:', { 
    BASE_URL, 
    WS_URL,
    ip: ip.ip,
    port: ip.port 
});

class NotificationService {
    static instance = null;
    ws = null;
    userId = null;
    reconnectAttempts = 0;
    maxReconnectAttempts = 5;
    reconnectDelay = 5000;
    listeners = new Set();
    onNotificationCallback = null;
    onBadgeUpdateCallback = null;
    pingInterval = null;
    isReconnecting = false;
    connectionTimeout = null;
    isConnecting = false;
    connectionPromise = null;
    axiosInstance = null;
    notifications = [];

    constructor() {
        if (NotificationService.instance) {
            return NotificationService.instance;
        }
        
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 5000;
        this.onNotificationCallback = null;
        this.onBadgeUpdateCallback = null;
        this.notifications = [];
        this.eventListeners = new Map();
        this.axiosInstance = axios.create({
            baseURL: BASE_URL,
            timeout: 5000,
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        NotificationService.instance = this;
    }

    static getInstance() {
        if (!NotificationService.instance) {
            NotificationService.instance = new NotificationService();
        }
        return NotificationService.instance;
    }

    // Получение уведомлений через HTTP
    async fetchNotifications() {
        if (!this.userId) {
            console.warn('UserId не установлен');
            return [];
        }

        try {
            const response = await this.axiosInstance.get('/notifications', {
                params: { userId: this.userId }
            });
            return response.data;
        } catch (error) {
            console.error('Ошибка при получении уведомлений через HTTP:', error);
            return [];
        }
    }

    // Проверка доступности сервера
    async checkServerAvailability() {
        try {
            // Используем существующий эндпоинт notifications для проверки
            const response = await this.axiosInstance.get('/notifications/health');
            return response.status === 200;
        } catch (error) {
            if (error.response) {
                // Если получаем ответ от сервера, даже с ошибкой - сервер доступен
                return true;
            }
            console.error('Ошибка при проверке доступности сервера:', error);
            return false;
        }
    }

    async initialize(userId) {
        this.userId = userId;
        
        try {
            // Проверяем доступность сервера перед подключением
            const isServerAvailable = await this.checkServerAvailability();
            if (!isServerAvailable) {
                console.error('Сервер недоступен. Попытка переподключения...');
                this.scheduleReconnect();
                return;
            }
            
            await this.connect();
        } catch (error) {
            console.error('Ошибка при инициализации:', error);
            this.scheduleReconnect();
        }
    }

    async connect() {
        if (this.isConnecting) {
            console.log('Подключение уже в процессе');
            return;
        }

        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('Превышено максимальное количество попыток подключения');
            return;
        }

        this.isConnecting = true;

        try {
            await this.tryConnect();
        } catch (error) {
            console.error('Ошибка при подключении к WebSocket:', error);
            this.scheduleReconnect();
        } finally {
            this.isConnecting = false;
        }
    }

    async tryConnect() {
        if (!this.userId) {
            throw new Error('UserId не установлен');
        }

        const wsUrl = `ws://${ip.ip}:${ip.port}/ws/notifications?userId=${this.userId}`;
        
        return new Promise((resolve, reject) => {
            let connectionTimeout;
            let isConnectionEstablished = false;
            
            try {
                if (this.ws) {
                    this.ws.close();
                    this.ws = null;
                }

                this.ws = new WebSocket(wsUrl);

                connectionTimeout = setTimeout(() => {
                    if (!isConnectionEstablished) {
                        if (this.ws) {
                            this.ws.close();
                            this.ws = null;
                        }
                        reject(new Error('Таймаут подключения'));
                    }
                }, 10000);

                this.ws.onopen = () => {
                    isConnectionEstablished = true;
                    clearTimeout(connectionTimeout);
                    this.reconnectAttempts = 0;
                    this.notifyListeners({ type: 'connection', status: 'connected' });
                    resolve();
                };

                this.ws.onclose = (event) => {
                    clearTimeout(connectionTimeout);
                    
                    this.notifyListeners({ 
                        type: 'connection', 
                        status: 'disconnected',
                        code: event.code,
                        reason: event.reason
                    });
                    
                    if (!isConnectionEstablished) {
                        reject(new Error(`Соединение закрыто до установки: ${event.reason || 'Причина не указана'}`));
                    } else if (event.code !== 1000) {
                        this.scheduleReconnect();
                    }
                };

                this.ws.onerror = (error) => {
                    if (!isConnectionEstablished) {
                        clearTimeout(connectionTimeout);
                        reject(new Error('Ошибка при установке WebSocket соединения'));
                    }
                };

                this.ws.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data);
                        this.handleMessage(data);
                    } catch (error) {
                        console.error('Ошибка при обработке сообщения WebSocket:', error);
                    }
                };

            } catch (error) {
                clearTimeout(connectionTimeout);
                reject(error);
            }
        });
    }

    startPingInterval() {
        // Отправляем ping каждые 30 секунд для поддержания соединения
        this.pingInterval = setInterval(() => {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify({ type: 'ping' }));
            }
        }, 30000);
    }

    stopPingInterval() {
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
        }
    }

    handleMessage(data) {
        switch (data.type) {
            case 'notifications':
                if (Array.isArray(data.data)) {
                    this.handleAllNotifications(data.data);
                }
                break;
            case 'notification':
                if (data.data) {
                    this.handleNewNotification(data.data);
                }
                break;
            case 'error':
                this.notifyListeners({
                    type: 'error',
                    message: data.message
                });
                break;
        }
    }

    scheduleReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
            setTimeout(() => this.connect(), delay);
        } else {
            this.notifyListeners({
                type: 'error',
                message: 'Не удалось установить соединение с сервером уведомлений'
            });
        }
    }

    addListener(listener) {
        this.listeners.add(listener);
    }

    removeListener(listener) {
        this.listeners.delete(listener);
    }

    notifyListeners(event) {
        this.listeners.forEach(listener => {
            try {
                listener(event);
            } catch (error) {
                console.error('Ошибка в слушателе уведомлений:', error);
            }
        });
    }

    disconnect() {
        this.stopPingInterval();
        if (this.ws) {
            this.ws.close(1000, 'Нормальное закрытие');
            this.ws = null;
        }
        this.reconnectAttempts = 0;
        this.isConnecting = false;
    }

    onNotification(callback) {
        this.onNotificationCallback = callback;
    }

    onBadgeUpdate(callback) {
        this.onBadgeUpdateCallback = callback;
    }

    // Обработка всех уведомлений
    handleAllNotifications(notifications) {
        // Обновляем список уведомлений
        this.notifications = notifications.filter(n => n.userId === this.userId);
        const unreadCount = this.notifications.filter(n => !n.isRead).length;
        
        // Уведомляем слушателей
        this.notifyListeners({
            type: 'notifications',
            notifications: this.notifications,
            unreadCount,
            userId: this.userId
        });
    }

    // Обработка нового уведомления
    handleNewNotification(notification) {
        if (notification.userId === this.userId) {
            // Проверяем, нет ли уже такого уведомления
            const isDuplicate = this.notifications.some(n => n.id === notification.id);
            if (!isDuplicate) {
                this.notifications.push(notification);
                const unreadCount = this.notifications.filter(n => !n.isRead).length;
                
                this.notifyListeners({
                    type: 'new_notification',
                    notification,
                    unreadCount
                });

                this.showNotificationPopup(notification);
            }
        }
    }

    // Получение всех уведомлений
    getNotifications() {
        return this.notifications;
    }

    // Получение количества непрочитанных уведомлений
    getUnreadCount() {
        return this.notifications.filter(n => !n.isRead).length;
    }

    // Отметка уведомления как прочитанного
    async markAsRead(notificationId) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'markAsRead',
                notificationId
            }));
        }
    }

    // Удаление уведомления
    async deleteNotification(notificationId) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'deleteNotification',
                notificationId
            }));
        }
    }

    // Удаление всех уведомлений по источнику
    async deleteAllBySource(source) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'deleteAllBySource',
                source
            }));
        }
    }

    // Создание нового уведомления
    createNotification(data) {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            throw new Error('WebSocket соединение не установлено');
        }

        this.ws.send(JSON.stringify({
            type: 'createNotification',
            userId: this.userId,
            data: {
                ...data,
                type: data.type || 'info'
            }
        }));
    }

    // Обновление бейджа в сайдбаре
    updateSidebarBadge(count) {
        this.notifyListeners({
            type: 'badge_update',
            count: count,
            userId: this.userId
        });
    }

    // Показ всплывающего уведомления
    showNotificationPopup(notification) {
        const popup = document.createElement('div');
        popup.className = 'notification-popup';
        popup.innerHTML = `
            <div class="notification-content">
                <div class="notification-title">${notification.title}</div>
                <div class="notification-time">${notification.eventTime}</div>
            </div>
            <button class="notification-close">×</button>
        `;

        const closeButton = popup.querySelector('.notification-close');
        closeButton.addEventListener('click', () => {
            popup.classList.add('notification-hiding');
            setTimeout(() => popup.remove(), 300);
        });

        document.body.appendChild(popup);
        setTimeout(() => popup.classList.add('notification-visible'), 10);
        setTimeout(() => {
            if (document.body.contains(popup)) {
                popup.classList.add('notification-hiding');
                setTimeout(() => popup.remove(), 300);
            }
        }, 5000);
    }

    // Система событий
    on(event, callback) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, new Set());
        }
        this.eventListeners.get(event).add(callback);
    }

    off(event, callback) {
        if (this.eventListeners.has(event)) {
            this.eventListeners.get(event).delete(callback);
        }
    }

    emit(event, data) {
        if (this.eventListeners.has(event)) {
            this.eventListeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Ошибка в обработчике события ${event}:`, error);
                }
            });
        }
    }
}

export default NotificationService.getInstance(); 