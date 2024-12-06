// src/components/Sidebar.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const Sidebar = () => {
  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const daysOfWeek = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
      const day = daysOfWeek[now.getDay()];
      const date = `${day}, ${now.getDate()} ${now.toLocaleString('default', { month: 'long' })}`;
      
      setCurrentTime(`${hours}:${minutes}`);
      setCurrentDate(date);
    };

    updateDateTime();
    const intervalId = setInterval(updateDateTime, 60000); // обновляем каждую минуту

    return () => clearInterval(intervalId); // очистка интервала при размонтировании компонента
  }, []);

  return (
    <div style={{ width: '200px', height: '100vh', background: '#f4f4f4', padding: '20px' }}>
      
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '2.5rem', margin: 0 }}>{currentTime}</h1>
        <p style={{ fontSize: '1rem', margin: 0 }}>{currentDate}</p>
        <h2>Умный дом</h2>
      </div>
      <ul style={{ listStyleType: 'none', padding: 0 }}>
        <li><Link to="/">Главная</Link></li>
        <li><Link to="/smart-home">Умный дом</Link></li>
        <li><Link to="/orders">Заказы</Link></li>
        <li><Link to="/notifications">Уведомления</Link></li>
        <li><Link to="/info">Информация</Link></li>
      </ul>
    </div>
  );
};

export default Sidebar;
