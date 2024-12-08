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

  // Функция для получения данных о температуре и влажности
  const getTemperatureAndHumidity = () => {
    const currentRoomName = currentRoom.name;
    let temperature, humidity;

    // Проверяем, есть ли данные о температуре и влажности в текущей комнате
    const temperatureDevice = currentRoom.devices.find(deviceId => {
      const device = devices[deviceId];
      return device && device.type === "devices.types.sensor.climate"; // Измените тип в зависимости от вашего API
    });

    if (temperatureDevice && devices[temperatureDevice]) {
      const properties = devices[temperatureDevice].properties || [];
      const temperatureProp = properties.find(prop => prop.parameters?.instance === "temperature");
      const humidityProp = properties.find(prop => prop.parameters?.instance === "humidity");
      
      temperature = temperatureProp ? Math.round(temperatureProp.state.value) + '°C' : 'Неизвестно';
      humidity = humidityProp ? humidityProp.state.value + '%' : 'Неизвестно';
    } else {
      // Если текущая комната - кухня, подтягиваем данные из гостиной
      if (currentRoomName === "Кухня") {
        const livingRoom = rooms.find(room => room.name === "Гостиная");
        if (livingRoom) {
          const livingTemperatureDevice = livingRoom.devices.find(deviceId => {
            const device = devices[deviceId];
            return device && device.type === "devices.types.sensor.climate";
          });

          if (livingTemperatureDevice && devices[livingTemperatureDevice]) {
            const properties = devices[livingTemperatureDevice].properties || [];
            const temperatureProp = properties.find(prop => prop.parameters?.instance === "temperature");
            const humidityProp = properties.find(prop => prop.parameters?.instance === "humidity");
            
            temperature = temperatureProp ? Math.round(temperatureProp.state.value) + '°C' : 'Неизвестно';
            humidity = humidityProp ? humidityProp.state.value + '%' : 'Неизвестно';
          }
        }
      }
    }

    return {
      temperature: temperature || 'Неизвестно',
      humidity: humidity || 'Неизвестно',
    };
  };

  const { temperature, humidity } = getTemperatureAndHumidity();

  return (
    <div className="carousel-container">
      <div className="carousel">
        <div className={`carousel-image ${fadeClass}`} style={{ backgroundImage: `url(${roomImages[currentRoom.name] || img5})` }}>
          <div className="top-left-blocks">
            <h2 className="block">{currentRoom.name}</h2>
            {/* Условие для скрытия блоков температуры и влажности в гардеробе */}
            {currentRoom.name !== "Гардероб" && (
              <>
                <p className="block">
                  <svg className="icon" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10 18.3333C12.5313 18.3333 14.5833 16.2813 14.5833 13.75C14.5833 12.303 13.9128 11.0126 12.8655 10.1726C12.6458 9.99643 12.5 9.73805 12.5 9.4564V4.16666C12.5 2.78594 11.3807 1.66666 10 1.66666C8.61929 1.66666 7.5 2.78594 7.5 4.16666V9.4564C7.5 9.73805 7.35421 9.99643 7.1345 10.1726C6.0872 11.0126 5.41666 12.303 5.41666 13.75C5.41666 16.2813 7.46869 18.3333 10 18.3333Z" stroke="#1C274C" strokeWidth="1.5"/>
                    <path d="M12.0831 13.7499C12.0831 14.9005 11.1504 15.8332 9.99981 15.8332C8.84922 15.8332 7.91648 14.9005 7.91648 13.7499C7.91648 12.5993 8.84922 11.6666 9.99981 11.6666C11.1504 11.6666 12.0831 12.5993 12.0831 13.7499Z" stroke="#1C274C" strokeWidth="1.5"/>
                    <path d="M10 11.6667V4.16666" stroke="#1C274C" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  <span className="space">{temperature}</span>
                </p>
                <p className="block">
                  <svg className="icon" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8.33333 14.8611C8.33333 16.7788 6.84095 18.3333 5 18.3333C3.15905 18.3333 1.66667 16.7788 1.66667 14.8611C1.66667 13.6613 2.97161 12.0598 3.94852 11.0291C4.52685 10.4189 5.47315 10.4189 6.05147 11.0291C7.02839 12.0598 8.33333 13.6613 8.33333 14.8611Z" stroke="#1C274C" strokeWidth="1.5"/>
                    <path d="M18.3333 14.8611C18.3333 16.7788 16.841 18.3333 15 18.3333C13.1591 18.3333 11.6667 16.7788 11.6667 14.8611C11.6667 13.6613 12.9716 12.0598 13.9485 11.0291C14.5269 10.4189 15.4731 10.4189 16.0515 11.0291C17.0284 12.0598 18.3333 13.6613 18.3333 14.8611Z" stroke="#1C274C" strokeWidth="1.5"/>
                    <path d="M13.3333 6.52777C13.3333 8.44542 11.8409 9.99999 10 9.99999C8.15905 9.99999 6.66667 8.44542 6.66667 6.52777C6.66667 5.32792 7.97161 3.72649 8.94852 2.69572C9.52685 2.08552 10.4731 2.08552 11.0515 2.69572C12.0284 3.72649 13.3333 5.32792 13.3333 6.52777Z" stroke="#1C274C" strokeWidth="1.5"/>
                  </svg>
                  <span className="space">{humidity}</span>
                </p>
              </>
            )}
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
