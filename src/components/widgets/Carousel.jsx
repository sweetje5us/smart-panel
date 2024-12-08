import React, { useState, useEffect } from 'react';
import './Carousel.css'; // Импорт стилей
import img5 from '../../images/living_room.jpg'; // Изображение для гостиной
import ip from '../ip.json';
import token from '../token.json';
import Switch from '@mui/material/Switch';

// Объект с изображениями для комнат
const roomImages = {
  "Гостиная": img5,
  "Спальня": require('../../images/bedroom.jpg'), // Замените на путь к изображению для спальни
  "Кухня": require('../../images/kitchen.jpg'), // Замените на путь к изображению для кухни
  "Ванная": require('../../images/bathroom.jpg'),
  "Балкон": require('../../images/balcony.jpg'),
  "Прихожая": require('../../images/hallway.jpg'),
  "Гардероб": require('../../images/wardrobe.jpg') // Замените на путь к изображению для гардероба
  // Добавьте другие комнаты и их изображения
};

const address = `http://${ip.ip}:${ip.port}`;
const access_token = token.token_yandex;

const CarouselWithDevices = () => {
  const [rooms, setRooms] = useState([]);
  const [devices, setDevices] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fadeClass, setFadeClass] = useState('fade-in'); // Начальное состояние для анимации
  const [isAnimating, setIsAnimating] = useState(false); // Для отслеживания анимации

  const fetchRooms = async () => {
    try {
      const response = await fetch(`${address}/https://api.iot.yandex.net/v1.0/user/info`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      });

      const data = await response.json();

      if (data.status === 'ok') {
        setRooms(data.rooms);
        await fetchDevicesData(data.rooms);
      } else {
        console.error('Ошибка при получении данных:', data);
      }
    } catch (error) {
      console.error('Ошибка сети:', error);
    }
  };

  const fetchDevicesData = async (rooms) => {
    const deviceIds = [];

    rooms.forEach(room => {
      room.devices.forEach(deviceId => {
        if (!deviceIds.includes(deviceId)) {
          deviceIds.push(deviceId);
        }
      });
    });

    const devicePromises = deviceIds.map(id =>
      fetch(`${address}/https://api.iot.yandex.net/v1.0/devices/${id}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      })
    );

    try {
      const deviceResponses = await Promise.all(devicePromises);
      const deviceDataArray = await Promise.all(deviceResponses.map(res => res.json()));

      const devicesArray = deviceDataArray.reduce((acc, device) => {
        if (device.status === 'ok') {
          acc[device.id] = {
            ...device,
            type: device.type,
          };
        }
        return acc;
      }, {});

      setDevices(devicesArray);
    } catch (error) {
      console.error('Ошибка при получении данных об устройствах:', error);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const handleNext = () => {
    if (isAnimating) return; // Если анимация идет, не переключаем
    setFadeClass('fade-out'); // Устанавливаем класс для выхода
    setIsAnimating(true); // Начинаем анимацию

    setTimeout(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % rooms.length);
      setFadeClass('fade-in'); // Устанавливаем класс для входа
      setIsAnimating(false); // Завершаем анимацию
    }, 500); // Длительность анимации
  };

  const handlePrev = () => {
    if (isAnimating) return; // Если анимация идет, не переключаем
    setFadeClass('fade-out'); // Устанавливаем класс для выхода
    setIsAnimating(true); // Начинаем анимацию

    setTimeout(() => {
      setCurrentIndex((prevIndex) => (prevIndex - 1 + rooms.length) % rooms.length);
      setFadeClass('fade-in'); // Устанавливаем класс для входа
      setIsAnimating(false); // Завершаем анимацию
    }, 500); // Длительность анимации
  };

  const toggleDeviceState = (deviceId) => {
    const device = devices[deviceId];
    if (device) {
      console.log(`Устройство ${device.name} переключено.`);
    }
  };

  if (!rooms.length) {
    return <div>Загрузка...</div>;
  }

  const currentRoom = rooms[currentIndex];

  return (
    <div className="carousel-container">
      <div className="carousel">
        <div className={`carousel-image ${fadeClass}`} style={{ backgroundImage: `url(${roomImages[currentRoom.name] || img5})` }}>
          <div className="top-left-block">
            <h2 className="block">{currentRoom.name}</h2>
          </div>

          <div className="carousel-controls">
            <button className="nav-button" onClick={handlePrev} aria-label="Предыдущая комната">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 5L9 12L15 19" stroke="#1C274C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button className="nav-button" onClick={handleNext} aria-label="Следующая комната">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 5L15 12L9 19" stroke="#1C274C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
      <div className="devices-list">
        <h3>Устройства в комнате:</h3>
        <div className="devices-grid">
          {currentRoom.devices.map((deviceId) => (
            <div className="device-card" key={deviceId} onClick={() => toggleDeviceState(deviceId)}>
              {devices[deviceId] ? (
                <>
                  <p>{devices[deviceId].name}</p>
                  {renderDeviceInfo(devices[deviceId])}
                </>
              ) : (
                <p>Загрузка устройства...</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Функция для рендеринга информации об устройстве
const renderDeviceInfo = (device) => {
  const properties = device.properties || [];
  const capabilities = device.capabilities || [];
  let info = [];
  const displayedKeys = new Set(); // Множество для отслеживания уже выведенных ключей

  const handleProperty = (key, value, label) => {
    if (!displayedKeys.has(key)) {
      info.push(<p key={key}>{label}: {value}</p>);
      displayedKeys.add(key);
    }
  };

  const handleSwitch = (key, value, label) => {
    if (!displayedKeys.has(key)) {
      info.push(
        <div key={key}>
          {label}: <Switch checked={value} />
        </div>
      );
      displayedKeys.add(key);
    }
  };

  // Обработка свойств устройства
  if (device.type === "devices.types.sensor") {
    // Выводим данные только из properties для сенсоров
    properties.forEach((property) => {
      const instance = property.parameters?.instance;
      const stateValue = property.state?.value;

      if (instance === "temperature") {
        handleProperty("temperature", Math.round(stateValue) + '°C', "Температура");
      } else if (instance === "humidity") {
        handleProperty("humidity", stateValue + '%', "Влажность");
      } else if (instance === "battery_level") {
        handleProperty("battery_level", stateValue + '%', "Заряд");
      } else if (instance === "water_leak") {
        handleProperty("water_leak", stateValue ? 'Есть' : 'Нет', "Статус протечки");
      }
    });
  } else {
    // Обработка возможностей устройства для других типов
    capabilities.forEach((capability) => {
      const capabilityType = capability.type;
      const stateValue = capability.state?.value;

      if (capabilityType === "devices.capabilities.on_off") {
        handleSwitch("on_off", stateValue, "Статус");
      } else if (capabilityType === "devices.capabilities.range") {
        handleProperty("heating_temp", stateValue, "Температура нагрева");
      }
    });
  }

  // Настройки отображения данных по типу устройства
  const deviceTypeHandlers = {
    "devices.types.sensor.water_leak": () => {
      const waterLeakBattery = properties.find(p => p.parameters?.instance === "battery_level");
      const waterLeakStatus = properties.find(p => p.parameters?.instance === "water_leak");
      handleProperty("water_leak_battery", waterLeakBattery?.state?.value || 'Неизвестно', "Заряд");
      handleProperty("water_leak_status", waterLeakStatus?.state?.value ? 'Есть' : 'Нет', "Статус протечки");
    },
    "devices.types.sensor.motion": () => {
      const motionBattery = properties.find(p => p.parameters?.instance === "battery_level");
      handleProperty("motion_battery", motionBattery?.state?.value || 'Неизвестно', "Заряд");
    },
    "devices.types.sensor.climate": () => {
      const climateTemperature = properties.find(p => p.parameters?.instance === "temperature");
      const climateHumidity = properties.find(p => p.parameters?.instance === "humidity");
      const climateBattery = properties.find(p => p.parameters?.instance === "battery_level");
      handleProperty("climate_temp", Math.round(climateTemperature?.state?.value || 0) + '°C', "Температура");
      handleProperty("climate_humidity", climateHumidity?.state?.value || 'Неизвестно', "Влажность");
      handleProperty("climate_battery", climateBattery?.state?.value || 'Неизвестно', "Заряд");
    },
    "devices.types.vacuum_cleaner": () => {
      const vacuumStatus = capabilities.find(c => c.type === "devices.capabilities.on_off");
      const vacuumBattery = properties.find(p => p.parameters?.instance === "battery_level");
      handleSwitch("vacuum_status", vacuumStatus?.state?.value, "Статус");
      handleProperty("vacuum_battery", vacuumBattery?.state?.value || 'Неизвестно', "Заряд");
    },
    default: () => {
      info.push(<p key="unknown">Тип устройства неизвестен</p>);
    }
  };

  // Вызываем обработчик для текущего типа устройства
  if (deviceTypeHandlers[device.type]) {
    deviceTypeHandlers[device.type]();
  } else {
    deviceTypeHandlers.default();
  }

  return info;
};

export default CarouselWithDevices;
