import React, { useState } from 'react';
import Domofon from './widgets/Domofon.jsx';
import DCOrders from './widgets/DCOrders.jsx';
import YandexHome from './widgets/YandexHome.jsx';
import './widgets/Home.css'; // Импортируйте стили

const Home = () => {
  const [expandedWidget, setExpandedWidget] = useState(null);

  const handleWidgetClick = (widgetName) => {
    setExpandedWidget(expandedWidget === widgetName ? null : widgetName);
  };

  return (
    <div>
      <h2>Добро пожаловать в дашборд умного дома!</h2>
      <div className="container">
        <div 
          className={`widget ${expandedWidget === 'Domofon' ? 'expanded' : ''}`} 
          onClick={() => handleWidgetClick('Domofon')}
        >
          <Domofon />
        </div>
        <div 
          className={`widget ${expandedWidget === 'DCOrders' ? 'expanded' : ''}`} 
          onClick={() => handleWidgetClick('DCOrders')}
        >
          <DCOrders />
        </div>
        <div 
          className={`widget ${expandedWidget === 'YandexHome' ? 'expanded' : ''}`} 
          onClick={() => handleWidgetClick('YandexHome')}
        >
          <YandexHome />
        </div>
      </div>
    </div>
  );
};

export default Home;
