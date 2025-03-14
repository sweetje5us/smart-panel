import React, { useState, useEffect } from 'react';
import Doorvideo from './widgets/Doorvideo.jsx';
import OrdersTracking from './widgets/DCOrders.jsx';
import CarouselWithDevices from './widgets/YandexHomeQuasar.jsx';
import HomeWidget from './widgets/HomeWidget.jsx';
import TasksWidget from './widgets/TasksWidget.jsx';
import CalendarWidget from './widgets/CalendarWidget.jsx';
import WeatherWidget from './widgets/WeatherWidget.jsx';
import './widgets/Home.css';
import './Dashboard.css';

const Dashboard = () => {
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
        <div className="dashboard-container">
            <div className="dashboard-header">
                <h2>Панель управления</h2>
                <p>Управляйте всеми устройствами и сервисами вашего дома в одном месте</p>
            </div>
            <div className="dashboard-content">
                <div className="widgets-grid">
                    <div className="dashboard">
                        <div className="dashboard-section">
                            <WeatherWidget />
                            <CalendarWidget />
                        </div>
                        <div className="dashboard-section">
                            <TasksWidget />
                        </div>
                    </div>
                    
                    <OrdersTracking onOrdersUpdate={setHasOrders} />
                    
                    {isLoading ? (
                        <div className="loading-overlay">
                            <div className="loading-spinner" />
                        </div>
                    ) : (
                        <HomeWidget />
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard; 