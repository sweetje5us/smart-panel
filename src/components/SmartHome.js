// src/components/SmartHome.js
import React from 'react';
import YandexHome from './widgets/YandexHome.jsx';
import CarouselWithDevices from './widgets/Carousel.jsx';
import './widgets/SmartHome.css'; // Импортируем CSS файл

const SmartHome = () => {
    return (
        <div className="smart-home-container">
            <h2>Умный дом</h2>
            <div className="grid-container">
                <div className="grid-item">
                    <YandexHome />
                </div>
                <div className="grid-item">
                    <CarouselWithDevices />
                </div>
            </div>
        </div>
    );
};

export default SmartHome;
