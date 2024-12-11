import React, { useState } from 'react';
import Domofon from './widgets/Domofon.jsx';
import OrdersTracking from './widgets/DCOrders.jsx'; // Импортируем OrdersTracking
import CarouselWithDevices from './widgets/Carousel.jsx';
import './widgets/Home.css'; // Импортируйте стили

const Home = () => {
  const [expandedWidget, setExpandedWidget] = useState(null);
  const [hasOrders, setHasOrders] = useState(false); // Состояние для отслеживания наличия заказов

  const handleWidgetClick = (widgetName) => {
    setExpandedWidget(expandedWidget === widgetName ? null : widgetName);
  };

  return (
    <div>
      <h2>Добро пожаловать в дашборд умного дома!</h2>
      
      <Domofon />
      {/* Добавляем OrdersTracking и передаем onOrdersUpdate */}
      <OrdersTracking onOrdersUpdate={setHasOrders} />
      <CarouselWithDevices />
    </div>
  );
};

export default Home;
