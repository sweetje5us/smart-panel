import React, { useState, useEffect } from 'react';
import './Carousel.css'; // Импорт стилей
import img5 from '../../images/living_room.jpg'; // Изображение для гостиной
import ip from '../ip.json';
import token from '../token.json';
import Switch from '@mui/material/Switch';
import { alpha, styled } from '@mui/material/styles';
import { grey } from '@mui/material/colors';
import { faTelevision } from '@fortawesome/free-solid-svg-icons';




import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import NewCeilingLightIcon from './../../images/devices/light_off.png'; // Замените на новое изображение
import NewTvIcon from './../../images/devices/tv.png'; // Замените на новое изображение
import NewStripLightIcon from './../../images/devices/light_strip.png'; // Замените на новое изображение
import NewSmartSpeakerIcon2 from './../../images/devices/station_mini.png'; // Замените на новое изображение
import NewSmartSpeakerIcon1 from './../../images/devices/station_max.png'; // Замените на новое изображение
import NewSmartSpeakerIcon3 from './../../images/devices/station_2.png'; // Замените на новое изображение
import NewDishwasherIcon from './../../images/devices/dishwashing_machine.png'; // Замените на новое изображение
import NewThermostatIcon from './../../images/devices/radiator.png'; // Замените на новое изображение
import MotionSensorIcon from './../../images/devices/motion_sensor.png'; // Замените на новое изображение
import WaterSensorIcon from './../../images/devices/water_leak_sensor.png'; // Замените на новое изображение
import ClimatSensorIcon from './../../images/devices/climat_sensor.png'; // Замените на новое изображение
// Объект с изображениями для комнат
const roomImages = {
  "Гостиная": img5,
  "Спальня": require('../../images/bedroom.jpg'),
  "Кухня": require('../../images/kitchen.jpg'),
  "Ванная": require('../../images/bathroom.jpg'),
  "Балкон": require('../../images/balcony.jpg'),
  "Прихожая": require('../../images/hallway.jpg'),
  "Гардероб": require('../../images/wardrobe.jpg')
};
const AntSwitch = styled(Switch)(({ theme }) => ({
    width: 28,
    height: 16,
    padding: 0,
    display: 'flex',
    '&:active': {
      '& .MuiSwitch-thumb': {
        width: 15,
      },
      '& .MuiSwitch-switchBase.Mui-checked': {
        transform: 'translateX(9px)',
      },
    },
    '& .MuiSwitch-switchBase': {
      padding: 2,
      '&.Mui-checked': {
        transform: 'translateX(12px)',
        color: '#000000',
        '& + .MuiSwitch-track': {
          opacity: 1,
          backgroundColor: '#FFFFFF',
          ...theme.applyStyles('dark', {
            backgroundColor: '#000000',
          }),
        },
      },
    },
    '& .MuiSwitch-thumb': {
      boxShadow: '0 2px 4px 0 rgb(0 35 11 / 20%)',
      width: 12,
      height: 12,
      borderRadius: 6,
      transition: theme.transitions.create(['width'], {
        duration: 200,
      }),
    },
    '& .MuiSwitch-track': {
      borderRadius: 16 / 2,
      opacity: 1,
      backgroundColor: '#A8ACB7',
      boxSizing: 'border-box',
      ...theme.applyStyles('dark', {
        backgroundColor: 'rgba(255,255,255,.35)',
      }),
    },
}));

const address = `http://${ip.ip}:${ip.port}`;
const access_token = token.token_yandex;

const CarouselWithDevices = () => {
  const [rooms, setRooms] = useState([]);
  const [devices, setDevices] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fadeClass, setFadeClass] = useState('fade-in');
  const [isAnimating, setIsAnimating] = useState(false);

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

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (rooms.length) {
        fetchDevicesData(rooms);
      }
    }, 60000); // 30 секунд

    return () => clearInterval(intervalId); // Очистка интервала при размонтировании компонента
  }, [rooms]);

  const handleNext = () => {
    if (isAnimating) return;
    setFadeClass('fade-out');
    setIsAnimating(true);

    setTimeout(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % rooms.length);
      setFadeClass('fade-in');
      setIsAnimating(false);
    }, 500);
  };

  const handlePrev = () => {
    if (isAnimating) return;
    setFadeClass('fade-out');
    setIsAnimating(true);

    setTimeout(() => {
      setCurrentIndex((prevIndex) => (prevIndex - 1 + rooms.length) % rooms.length);
      setFadeClass('fade-in');
      setIsAnimating(false);
    }, 500);
  };

  const handleRoomChange = (event) => {
    const selectedRoomIndex = parseInt(event.target.value, 10);
    setCurrentIndex(selectedRoomIndex);
  };

  const toggleDeviceState = async (deviceId) => {
    const device = devices[deviceId];
    if (device) {
      const currentState = device.capabilities.find(cap => cap.type === "devices.capabilities.on_off").state.value;
      const newState = !currentState; // Инвертируем текущее состояние

      // Обновляем состояние устройства на сервере
      await handleChangeSw5(deviceId, newState);

      // Обновляем локальное состояние устройства
      setDevices(prevDevices => ({
        ...prevDevices,
        [deviceId]: {
          ...device,
          capabilities: device.capabilities.map(cap => 
            cap.type === "devices.capabilities.on_off"
              ? { ...cap, state: { ...cap.state, value: newState } }
              : cap
          )
        }
      }));

      console.log(`Устройство ${device.name} переключено на ${newState}.`);
    }
  };

  const handleChangeSw5 = async (id, value) => {
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    myHeaders.append('Accept', 'application/json');
    myHeaders.append("Authorization", `Bearer ${access_token}`);

    const raw = JSON.stringify({
      "devices": [{ "id": id, "actions": [{ "type": "devices.capabilities.on_off", "state": { "instance": "on", "value": value } }] }] }
    );

    try {
      await fetch(`${address}/https://api.iot.yandex.net/v1.0/devices/actions`, {
        method: "POST",
        headers: myHeaders,
        body: raw,
      });
    } catch (error) {
      console.error(error);
    }
  };

  if (!rooms.length) {
    return <div>Загрузка...</div>;
  }

  const currentRoom = rooms[currentIndex];

  const getTemperatureAndHumidity = () => {
    const currentRoomName = currentRoom.name;
    let temperature, humidity;

    const temperatureDevice = currentRoom.devices.find(deviceId => {
      const device = devices[deviceId];
      return device && device.type === "devices.types.sensor.climate";
    });

    if (temperatureDevice && devices[temperatureDevice]) {
      const properties = devices[temperatureDevice].properties || [];
      const temperatureProp = properties.find(prop => prop.parameters?.instance === "temperature");
      const humidityProp = properties.find(prop => prop.parameters?.instance === "humidity");
      
      temperature = temperatureProp ? Math.round(temperatureProp.state.value) + '°C' : 'Неизвестно';
      humidity = humidityProp ? humidityProp.state.value + '%' : 'Неизвестно';
    } else if (currentRoomName === "Кухня") {
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

    return {
      temperature: temperature || 'Неизвестно',
      humidity: humidity || 'Неизвестно',
    };
  };

  const { temperature, humidity } = getTemperatureAndHumidity();

  return (
    <>
    
    <h2>Yandex Home</h2>
    <div className="carousel-container">
      <div className="carousel">
        <div className={`carousel-image ${fadeClass}`} style={{ backgroundImage: `url(${roomImages[currentRoom.name] || img5})` }}>
          <div className="top-left-blocks">
            <select value={currentIndex} onChange={handleRoomChange} className="room-select">
              {rooms.map((room, index) => (
                <option key={room.name} value={index}>
                 {room.name}
                </option>
              ))}
            </select>
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
          {currentRoom.devices.map((deviceId) => {
            const device = devices[deviceId];
            // Проверяем, существует ли устройство и не является ли оно переключателем
            if (device && device.type !== "devices.types.switch") {
              return (
                <div className="device-card" key={deviceId}>
                  {renderDeviceInfo(device, toggleDeviceState)} {/* Передаем toggleDeviceState как аргумент */}
                </div>
              );
            }
            return null; // Если устройство не существует или это переключатель, ничего не рендерим
          })}
        </div>
      </div>
    </div>
    </>
  );
};
const handleChangeTemp = async (id, value) => {
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    myHeaders.append('Accept', 'application/json');
    myHeaders.append("Authorization", `Bearer ${access_token}`);
  
    const raw = JSON.stringify({
      "devices": [{ "id": id, "actions": [{ "type": "devices.capabilities.range", "state": { "instance": "temperature", "value": value } }] }]
    });
  
    try {
      await fetch(`${address}/https://api.iot.yandex.net/v1.0/devices/actions`, {
        method: "POST",
        headers: myHeaders,
        body: raw,
      });
      console.log(`Температура для устройства ${id} установлена на ${value}°C`);
    } catch (error) {
      console.error("Ошибка при изменении температуры:", error);
    }
  };
// Функция для рендеринга информации об устройстве
const renderDeviceInfo = (device, toggleDeviceState) => {
  const properties = device.properties || [];
  const capabilities = device.capabilities || [];
  const info = [];
  const displayedKeys = new Set();

  const switchableDeviceTypes = [
    "devices.types.media_device.tv",
    "devices.types.light",
    "devices.types.light.ceiling",
    "devices.types.vacuum_cleaner",
    "devices.types.socket",
    "devices.types.dishwasher",
    "devices.types.thermostat"
  ];

  const deviceNameKey = `device-name-${device.id}`;
  if (!displayedKeys.has(deviceNameKey)) {
    // Добавляем название устройства
    info.push(<p key={`device-name-${device.id}-label`}><strong>{device.name}</strong></p>);

        // Добавляем изображение устройства
        switch (device.type) {
            case "devices.types.media_device.tv":
                info.push(
                    <div key={`device-icon-tv-${device.id}`} style={{ textAlign: 'center', margin: '10px 0' }}>
                        <img className="device-image" src={NewTvIcon} alt="TV Icon" style={{ width: '9em', height: 'auto' }} />
                    </div>
                );
                break;
            case "devices.types.light.ceiling":
                info.push(
                    <div key={`device-icon-ceiling-light-${device.id}`} style={{ textAlign: 'center', margin: '10px 0' }}>
                        <img className="device-image" src={NewCeilingLightIcon} alt="Ceiling Light Icon" style={{ width: '9em', height: 'auto' }} />
                    </div>
                );
                break;
            case "devices.types.sensor.motion":
                info.push(
                    <div key={`device-icon-sensor-motion-${device.id}`} style={{ textAlign: 'center', margin: '10px 0' }}>
                        <img className="device-image" src={MotionSensorIcon} alt="Motion Sensor Icon" style={{ width: '9em', height: 'auto' }} />
                    </div>
                );
                break;
            case "devices.types.sensor.water_leak":
                info.push(
                    <div key={`device-icon-sensor-water-${device.id}`} style={{ textAlign: 'center' }}>
                        <img className="device-image" src={WaterSensorIcon} alt="Water Leak Sensor Icon" style={{ width: '9em', height: 'auto' }} />
                    </div>
                );
                break;
            case "devices.types.sensor.climate":
                info.push(
                    <div key={`device-icon-sensor-climate-${device.id}`} style={{ textAlign: 'center' }}>
                        <img className="device-image" src={ClimatSensorIcon} alt="Climate Sensor Icon" style={{ width: '9em', height: 'auto' }} />
                    </div>
                );
                break;
            case "devices.types.light.strip":
                info.push(
                    <div key={`device-icon-strip-light-${device.id}`} style={{ textAlign: 'center' }}>
                        <img className="device-image" src={NewStripLightIcon} alt="Strip Light Icon" style={{ width: '9em', height: 'auto' }} />
                    </div>
                );
                break;
            case "devices.types.smart_speaker.yandex.station_2":
                info.push(
                    <div key={`device-icon-smart-speaker-${device.id}`} style={{ textAlign: 'center' }}>
                        <img className="device-image" src={NewSmartSpeakerIcon1} alt="Smart Speaker Icon" style={{ width: '9em', height: 'auto' }} />
                    </div>
                );
                break;
            case "devices.types.smart_speaker.yandex.station.mini_2":
                info.push(
                    <div key={`device-icon-smart-speaker-${device.id}`} style={{ textAlign: 'center' }}>
                        <img className="device-image" src={NewSmartSpeakerIcon2} alt="Smart Speaker Icon" style={{ width: '9em', height: 'auto' }} />
                    </div>
                );
                break;
            case "devices.types.smart_speaker.yandex.station.midi":
                info.push(
                    <div key={`device-icon-smart-speaker-${device.id}`} style={{ textAlign: 'center' }}>
                        <img className="device-image" src={NewSmartSpeakerIcon3} alt="Smart Speaker Icon" style={{ width: '9em', height: 'auto' }} />
                    </div>
                );
                break;
            case "devices.types.dishwasher":
                info.push(
                    <div key={`device-icon-dishwasher-${device.id}`} style={{ textAlign: 'center' }}>
                        <img className="device-image" src={NewDishwasherIcon} alt="Dishwasher Icon" style={{ width: '9em', height: 'auto' }} />
                    </div>
                );
                break;
            case "devices.types.thermostat":
                info.push(
                    <div key={`device-icon-thermostat-${device.id}`} style={{ textAlign: 'center' }}>
                        <img className="device-image" src={NewThermostatIcon} alt="Thermostat Icon" style={{ width: '9em', height: 'auto' }} />
                    </div>
                );
                break;
            // Добавьте другие типы устройств по мере необходимости
        }

        // Добавляем слайдер для термостата, если это термостат
        if (device.type === "devices.types.thermostat") {
            const heatingTempCapability = capabilities.find(cap => cap.type === "devices.capabilities.range");
            const currentTemperature = heatingTempCapability?.state?.value;
            const isSwitchOn = capabilities.find(cap => cap.type === "devices.capabilities.on_off")?.state?.value;
      
            // Добавляем слайдер для термостата
            if (currentTemperature !== undefined && isSwitchOn) {
              info.push(
                <div key={`thermostat-slider-${device.id}`} style={{ marginBottom: '60px' }}>
                  <label>Температура: {currentTemperature}°C</label>
                  <input 
                    type="range" 
                    min="0" 
                    max="30" 
                    value={currentTemperature} 
                    step="1" 
                    onChange={(e) => {
                      const newTemperature = e.target.value;
                      console.log(`Установка новой температуры для ${device.name}: ${newTemperature}°C`);
                      handleChangeTemp(device.id, newTemperature); // Вызов функции изменения температуры
                    }} 
                    style={{ width: '100%' }} 
                  />
                </div>
              );
            }
          }
      
          displayedKeys.add(deviceNameKey);
        }

    const handleProperty = (key, value, label) => {
        if (!displayedKeys.has(key)) {
            info.push(<p key={key}>{label}: {value}</p>);
            displayedKeys.add(key);
        }
    };

    // Обработка свойств устройства
    properties.forEach((property) => {
        const instance = property.parameters?.instance;
        const stateValue = property.state?.value;

        if (instance === "temperature") {
            handleProperty("temperature", Math.round(stateValue) + '°C', "Температура");
        } else if (instance === "humidity") {
            handleProperty("humidity", stateValue + '%', "Влажность");
        }
    });

    // Проверяем наличие возможности переключения
    const isSwitchOn = capabilities.find(cap => cap.type === "devices.capabilities.on_off")?.state?.value;
    if (switchableDeviceTypes.includes(device.type)) {
        info.push(
            <div key="switch-block" style={{ position: 'absolute', bottom: '20px', left: '10px', right: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ marginBottom: '0' }}>{isSwitchOn ? "ON" : "OFF"}</strong>
                    <AntSwitch 
                        checked={isSwitchOn} 
                        onChange={() => toggleDeviceState(device.id)} 
                    />
                </div>
            </div>
        );
    }

    return (
        <div>
            
 {info}
        </div>
           
        
    );
};


export default CarouselWithDevices;
