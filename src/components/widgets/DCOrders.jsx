import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ip from '../ip.json';
import { useNotifications } from '../../contexts/NotificationContext';
import { useTheme } from '../../contexts/ThemeContext';
import './OrderTracking.css';
import { Link } from 'react-router-dom';

const address = `${ip.ip}:${ip.port}`;

// Иконка статуса заказа
const StatusIcon = ({ status }) => {
  const getStatusColor = () => {
    switch (status.toLowerCase()) {
      case 'принят':
        return '#1FA550'; // зеленый DC
      case 'готовится':
        return '#FFA500'; // оранжевый
      case 'в пути':
        return '#00C853'; // яркий зеленый
      default:
        return '#757575'; // серый
    }
  };

  return (
    <div className="status-indicator" style={{ backgroundColor: getStatusColor() }}>
      <div className="status-pulse" style={{ borderColor: getStatusColor() }} />
    </div>
  );
};

const OrderItem = ({ order }) => (
  <div className="order-card">
    <div className="order-header">
      <div className="order-number">
        <span className="label">Заказ</span>
        <span className="value">#{order.order.orderNr}</span>
      </div>
      <div className="order-status">
        <StatusIcon status={order.title} />
        <span className="status-text">{order.title}</span>
      </div>
    </div>
    
    <div className="order-content">
      <div className="order-place">
        <div className="place-name">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zM12 11.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="currentColor"/>
          </svg>
          <span>{order.place.name}</span>
        </div>
        <div className="place-address">{order.place.address}</div>
      </div>
      
      <div className="order-contact">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6.62 10.79c1.44 2.83 3.76 5.15 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" fill="currentColor"/>
        </svg>
        <span>{order.contact.phone}</span>
      </div>

      <div className="order-description">
        {order.description}
      </div>
    </div>
  </div>
);

const OrdersTracking = ({ onOrdersUpdate }) => {
  const { theme } = useTheme();
  const { updateNotificationCount } = useNotifications();
  const [orders, setOrders] = useState([]);
  const [previousOrders, setPreviousOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Отправка уведомления через API
  const sendNotificationToAPI = async (title) => {
    try {
      const currentDate = new Date();
      const formattedDate = currentDate.toISOString().split('T')[0];
      const formattedTime = currentDate.toTimeString().split(' ')[0].substring(0, 5);
      
      await axios.post('http://192.168.0.24:8080/api/notifications', {
        eventDate: formattedDate,
        eventTime: formattedTime,
        title: title,
        source: 'dc-orders',
        link: 'http://192.168.0.24:8080/orders'
      });
      
      // Обновляем счетчик уведомлений
      updateNotificationCount();
    } catch (error) {
      console.error('Ошибка при отправке уведомления:', error);
    }
  };

  // Проверка новых заказов и изменений статуса
  const checkOrderChanges = (newOrders) => {
    if (previousOrders.length > 0) {
      // Проверяем новые заказы
      const newOrderItems = newOrders.filter(order => 
        !previousOrders.some(prevOrder => prevOrder.order.orderNr === order.order.orderNr)
      );

      // Проверяем изменения статуса на "Заказ доставлен"
      const deliveredOrders = newOrders.filter(order => {
        const prevOrder = previousOrders.find(prev => prev.order.orderNr === order.order.orderNr);
        return prevOrder && prevOrder.title !== order.title && order.title === 'Заказ доставлен';
      });

      // Отправляем уведомления о новых заказах
      newOrderItems.forEach(order => {
        const title = `Новый заказ #${order.order.orderNr}`;
        sendNotificationToAPI(title);
      });

      // Отправляем уведомления о доставленных заказах
      deliveredOrders.forEach(order => {
        const title = `Заказ #${order.order.orderNr} доставлен`;
        sendNotificationToAPI(title);
      });
    }
    setPreviousOrders(newOrders);
  };

  const fetchOrders = async () => {
    try {
      const response = await fetch(`http://${address}/api/orders/tracking`);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Ошибка при получении данных: ${response.status} ${errorText}`);
      }
      const data = await response.json();
      if (data.payload && Array.isArray(data.payload.trackedOrders)) {
        checkOrderChanges(data.payload.trackedOrders);
        setOrders(data.payload.trackedOrders);
        onOrdersUpdate(data.payload.trackedOrders.length > 0);
      } else {
        throw new Error('Полученные данные не содержат отслеживаемых заказов');
      }
    } catch (err) {
      setError(err.message);
      onOrdersUpdate(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const intervalId = setInterval(fetchOrders, 30000);
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className={`dc-widget ${theme === 'dark' ? 'theme-dark' : ''}`}>
      <div className="dc-widget-header">
        <h2>
          <span className="dc-logo">Delivery</span>
          <span className="dc-logo blue">Club</span>
        </h2>
        {orders.length > 0 && (
          <div className="orders-count">
            {orders.length} {orders.length === 1 ? 'заказ' : orders.length < 5 ? 'заказа' : 'заказов'}
          </div>
        )}
      </div>

      <div className="orders-list">
        {loading ? (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <span>Загрузка заказов...</span>
          </div>
        ) : error ? (
          <div className="error-message">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="currentColor"/>
            </svg>
            <span>{error}</span>
          </div>
        ) : orders.length === 0 ? (
          <div className="no-orders">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z" fill="currentColor"/>
            </svg>
            <span>Активных заказов нет</span>
          </div>
        ) : (
          orders.map(order => (
            <OrderItem key={order.order.orderNr} order={order} />
          ))
        )}
      </div>
    </div>
  );
};

export default OrdersTracking;
