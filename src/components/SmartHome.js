// src/components/SmartHome.js
import React from 'react';
import CarouselWithDevices from './widgets/YandexHomeQuasar.jsx';
import CarouselWithDevices2 from './widgets/Carousel.jsx';
import './widgets/SmartHome.css'; // Импортируем CSS файл

const SmartHome = () => {
    return (
        <div className="smart-home-container">
            <h2>Умный дом</h2>
            <div className="grid-container">
                <div className="grid-item">
                   
                </div>
                <div className="grid-item">
                    <CarouselWithDevices />
                </div>
            </div>
        </div>
    );
};

export default SmartHome;
