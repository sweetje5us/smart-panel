import React, { useState } from 'react';
import Doorvideo from './widgets/Doorvideo.jsx';
import OrdersTracking from './widgets/DCOrders.jsx'; // Импортируем OrdersTracking
import CarouselWithDevices from './widgets/YandexHomeQuasar.jsx';
import './widgets/Home.css'; // Импортируйте стили

const Home = () => {
  const [expandedWidget, setExpandedWidget] = useState(null);
  const [hasOrders, setHasOrders] = useState(false); // Состояние для отслеживания наличия заказов

  const handleWidgetClick = (widgetName) => {
    setExpandedWidget(expandedWidget === widgetName ? null : widgetName);
  };

  return (
    <div>
      <h1>Главная страница</h1>
      
      <Doorvideo />
      {/* Добавляем OrdersTracking и передаем onOrdersUpdate */}
      <OrdersTracking onOrdersUpdate={setHasOrders} />
      <CarouselWithDevices />
    </div>
  );
};

export default Home;
