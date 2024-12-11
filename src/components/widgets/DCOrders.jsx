import React, { useEffect, useState } from 'react';
import ip from '../ip.json';
import './OrderTracking.css'; // Импортируем CSS файл для стилизации

const address = `${ip.ip}:${ip.port}`;

const OrderItem = ({ order }) => (
  <div className="order-card">
    <h2>Заказ {order.order.orderNr}</h2>
    <p>Статус: {order.title}</p>
    <p>{order.description}</p>
    <p>Магазин: {order.place.name}</p>
    <p>Адрес магазина: {order.place.address}</p>
    <p>Телефон для связи: {order.contact.phone}</p>
  </div>
);

const OrdersTracking = ({ onOrdersUpdate }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOrders = async () => {
    try {
      const response = await fetch(`http://${address}/api/orders/tracking`);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Ошибка при получении данных: ${response.status} ${errorText}`);
      }
      const data = await response.json();
      console.log('Полученные заказы:', data.payload.trackedOrders);
      if (data.payload && Array.isArray(data.payload.trackedOrders)) {
        setOrders(data.payload.trackedOrders);
        onOrdersUpdate(data.payload.trackedOrders.length > 0); // Обновляем состояние о наличии заказов
      } else {
        throw new Error('Полученные данные не содержат отслеживаемых заказов');
      }
      
    } catch (err) {
      setError(err.message);
      onOrdersUpdate(false); // Если есть ошибка, сообщаем, что заказов нет
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(); // Первоначальная загрузка данных

    const intervalId = setInterval(() => {
      fetchOrders(); // Обновление данных каждые 30 секунд
    }, 30000);

    return () => clearInterval(intervalId); // Очистка интервала при размонтировании
  }, []);

  if (loading) {
    return <div>Загрузка...</div>;
  }

  if (error) {
    return <div>Ошибка: {error}</div>;
  }

  if (orders.length === 0) {
    return (
      <div className="orders-container">
        <h1>Заказы в DeliveryClub</h1>
        <div className="orders-list">
          Заказов в DeliveryClub нет
        </div>
      </div>
    );
  }

  return (
    <div className="orders-container">
      <h1>Заказы в DeliveryClub</h1>
      <div className="orders-list">
        {orders.map(order => (
          <OrderItem key={order.order.orderNr} order={order} /> // Используем order.order.orderNr как ключ
        ))}
      </div>
    </div>
  );
};

export default OrdersTracking;
