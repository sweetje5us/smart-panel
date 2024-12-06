import React, { useEffect, useState } from 'react';
import ip from '../ip.json';
const address = `${ip.ip}:${ip.port}`;

const OrdersTracking = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch(`http://${address}/api/orders/tracking`);
        if (!response.ok) {
          throw new Error('Ошибка при получении данных');
        }
        const data = await response.json();

        // Проверяем, есть ли поле payload и массив trackedOrders
        if (data.payload && Array.isArray(data.payload.trackedOrders)) {
          setOrders(data.payload.trackedOrders);
        } else {
          throw new Error('Полученные данные не содержат отслеживаемых заказов');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  if (loading) {
    return <div>Загрузка...</div>;
  }

  if (error) {
    return <div>Ошибка: {error}</div>;
  }

  // Проверяем, есть ли отслеживаемые заказы
  if (orders.length === 0) {
    return <div>Отслеживаемых заказов в DeliveryClub - нет</div>;
  }

  return (
    <div>
      <h1>Текущие заказы</h1>
      <ul>
        {orders.map((order) => (
          <li key={order.id}>
            <h2>Заказ {order.order.orderNr}</h2>
            <p>Статус: {order.title}</p>
            <p>{order.description}</p>
            <p>Магазин: {order.place.name}</p>
            <p>Адрес магазина: {order.place.address}</p>
            <p>Телефон для связи: {order.contact.phone}</p>
            {/* Добавьте другие поля заказа по мере необходимости */}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default OrdersTracking;
