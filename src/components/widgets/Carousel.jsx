import React, { useState } from 'react';
import './Carousel.css'; // Импорт стилей
import img5 from '../../images/living_room.jpg';

const rooms = [
  {
    id: 1,
    name: 'Прихожая',
    devices: [
      { id: 1, name: 'Свет', state: false },
      { id: 2, name: 'Звонок', state: false },
      { id: 3, name: 'Умный замок', state: false },
      { id: 4, name: 'Датчик температуры', state: { temperature: 22, humidity: 50 } },
      { id: 5, name: 'Теплый пол', state: true, temperature: 25 },
    ],
    image: 'path/to/wardrobe.jpg',
  },
  {
    id: 2,
    name: 'Гардероб',
    devices: [
      { id: 1, name: 'Свет', state: false },
      { id: 2, name: 'Датчик движения', state: false },
    ],
    image: 'path/to/wardrobe.jpg',
  },
  {
    id: 3,
    name: 'Ванная',
    devices: [
      { id: 1, name: 'Свет', state: false },
      { id: 2, name: 'Водонагреватель', state: false },
      { id: 3, name: 'Датчик температуры', state: { temperature: 24, humidity: 40 } },
      { id: 4, name: 'Теплый пол', state: false, temperature: 22 },
    ],
    image: 'path/to/bathroom.jpg',
  },
  {
    id: 4,
    name: 'Кухня',
    devices: [
      { id: 1, name: 'Холодильник', state: false },
      { id: 2, name: 'Плита', state: false },
      { id: 3, name: 'Свет', state: false },
      { id: 4, name: 'Датчик температуры', state: { temperature: 20, humidity: 45 } },
      { id: 5, name: 'Теплый пол', state: false, temperature: 24 },
    ],
    image: 'path/to/kitchen.jpg',
  },
  {
    id: 5,
    name: 'Гостиная',
    devices: [
      { id: 1, name: 'Телевизор', state: false },
      { id: 2, name: 'Свет', state: false },
      { id: 3, name: 'Аудиосистема', state: false },
      { id: 4, name: 'Датчик температуры', state: { temperature: 21, humidity: 55 } },
      { id: 5, name: 'Теплый пол', state: false, temperature: 23 },
    ],
    image: img5,
  },
  {
    id: 6,
    name: 'Спальня',
    devices: [
      { id: 1, name: 'Свет', state: false },
      { id: 2, name: 'Кондиционер', state: false },
      { id: 3, name: 'Датчик температуры', state: { temperature: 23, humidity: 50 } },
      { id: 4, name: 'Теплый пол', state: false, temperature: 22 },
    ],
    image: 'path/to/bedroom.jpg',
  },
  {
    id: 7,
    name: 'Балкон',
    devices: [
      { id: 1, name: 'Свет', state: false },
      { id: 2, name: 'Датчик температуры', state: { temperature: 19, humidity: 60 } },
      { id: 3, name: 'Теплый пол', state: false, temperature: 20 },
    ],
    image: 'path/to/balcony.jpg',
  },
];

const CarouselWithDevices = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % rooms.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + rooms.length) % rooms.length);
  };

  const toggleDeviceState = (deviceId) => {
    const currentRoom = rooms[currentIndex];
    const device = currentRoom.devices.find(dev => dev.id === deviceId);
    if (device) {
      // Переключение состояния устройства
      if (device.name === 'Датчик температуры') {
        console.log(`Температура: ${device.state.temperature}°C, Влажность: ${device.state.humidity}%`);
      } else {
        device.state = !device.state; // Переключение состояния для других устройств
      }
    }
  };

  const currentRoom = rooms[currentIndex];
  const temperatureSensor = currentRoom.devices.find(dev => dev.name === 'Датчик температуры');

  return (
    <div className="carousel-container">
      <div className="carousel">
        <div className="carousel-image" style={{ backgroundImage: `url(${currentRoom.image})` }}>
          <div className="top-left-block">
            <h2 className="block">{currentRoom.name}</h2>
          </div>

          <div className="carousel-controls">
            <button onClick={handlePrev} aria-label="Предыдущая комната">Назад</button>
            <button onClick={handleNext} aria-label="Следующая комната">Вперед</button>
          </div>

          <div className="top-right-blocks">
            {temperatureSensor && (
              <>
                <div className="block">{temperatureSensor.state.temperature}°C</div>
                <div className="block">{temperatureSensor.state.humidity}%</div>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="devices-list">
        <h3>Устройства в комнате:</h3>
        <div className="devices-grid">
          {currentRoom.devices.map((device) => (
            <div className="device-card" key={device.id} onClick={() => toggleDeviceState(device.id)}>
              <p>{device.name}</p>
              {device.name === 'Датчик температуры' ? (
                <p>{device.state.temperature}°C, {device.state.humidity}%</p>
              ) : device.name === 'Теплый пол' ? (
                <>
                  <p>Состояние: {device.state ? 'Включен' : 'Выключен'}</p>
                  {device.state && <p>{device.temperature}°C</p>}
                </>
              ) : (
                <p>Состояние: {device.state ? 'Включено' : 'Выключено'}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CarouselWithDevices;
