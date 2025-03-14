import React, { useState, useEffect } from 'react';
import Doorvideo from './widgets/Doorvideo.jsx';
import OrdersTracking from './widgets/DCOrders.jsx'; // Импортируем OrdersTracking
import CarouselWithDevices from './widgets/YandexHomeQuasar.jsx';
import HomeWidget from './widgets/HomeWidget.jsx';
import './widgets/Home.css'; // Импортируйте стили
import TasksWidget from './widgets/TasksWidget.jsx';
import CalendarWidget from './widgets/CalendarWidget.jsx';
import WeatherWidget from './widgets/WeatherWidget.jsx';
import DoorWidget from './widgets/DoorWidget.jsx';

const Home = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasOrders, setHasOrders] = useState(false);

  useEffect(() => {
    // Имитация загрузки данных
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="home-container">
      <div className="welcome-section">
        <h1>Умная панель управления</h1>
        <p>Управляйте всеми устройствами и сервисами вашего дома в одном месте</p>
      </div>
      
      <div className="widgets-grid">
        <div className="dashboard">
          <div className="dashboard-section">
            <WeatherWidget />
            <CalendarWidget />
          </div>
          <div className="dashboard-section">
            <TasksWidget />
            <DoorWidget />
          </div>
          <div className="dashboard-section">
            <OrdersTracking onOrdersUpdate={setHasOrders} />
          </div>
        </div>
        
        {isLoading ? (
          <div className="loading-overlay">
            <div className="loading-spinner" />
          </div>
        ) : (
          <HomeWidget />
        )}
      </div>
    </div>
  );
};

export default Home;
