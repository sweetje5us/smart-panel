import React, { useEffect, useState } from 'react';
import ip from '../ip.json';
import './Carousel.css';
import Switch from '@mui/material/Switch';
import Slider from '@mui/material/Slider';
import { styled } from '@mui/material/styles';

// Импортируем изображения
const img5 = require('../../images/living_room.jpg');
const roomImages = {
  "Гостиная": img5,
  "Спальня": require('../../images/bedroom.jpg'),
  "Кухня": require('../../images/kitchen.jpg'),
  "Ванная": require('../../images/bathroom.jpg'),
  "Балкон": require('../../images/balcony.jpg'),
  "Прихожая": require('../../images/hallway.jpg'),
  "Гардероб": require('../../images/wardrobe.jpg')
};

const address = `ws://${ip.ip}:${ip.port}/public`;

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

const Carousel = () => {
    const [rooms, setRooms] = useState([]);
    const [selectedRoomId, setSelectedRoomId] = useState(null);
    const [devices, setDevices] = useState([]);
    const [currentRoom, setCurrentRoom] = useState({});
    const [householdData, setHouseholdData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [socket, setSocket] = useState(null);
    const [sliderValues, setSliderValues] = useState({}); // Состояние для хранения значений слайдеров

    useEffect(() => {
      const newSocket = new WebSocket(address);
      setSocket(newSocket);

      newSocket.onopen = () => {
          console.log('WebSocket connected');
      };
  
      newSocket.onmessage = (event) => {
          const data = JSON.parse(event.data);
          const enrichedData = {
            type: "yandex",
            ...data
          };

          if (enrichedData.status === 'ok' && enrichedData.households) {
            const household = enrichedData.households[0];
            setHouseholdData(household);
            setRooms(household.rooms);
            setLoading(false);
      
            if (household.rooms.length > 0 && selectedRoomId === null) {
              const firstRoom = household.rooms[0];
              setSelectedRoomId(firstRoom.id);
            }
          }
        };
  
      newSocket.onclose = () => {
          console.log('WebSocket disconnected');
      };
  
      return () => {
          newSocket.close();
      };
    }, [selectedRoomId]);

    useEffect(() => {
      if (householdData && selectedRoomId) {
          const selectedRoom = householdData.rooms.find(room => room.id === selectedRoomId);
          if (selectedRoom) {
              setDevices(selectedRoom.items);
              setCurrentRoom(selectedRoom);
          }
      }
    }, [householdData, selectedRoomId]);
    const handleNextRoom = () => {
        const currentIndex = rooms.findIndex(room => room.id === selectedRoomId);
        const nextIndex = (currentIndex + 1) % rooms.length; // Циклический переход
        setSelectedRoomId(rooms[nextIndex].id);
      };
  
      const handlePrevRoom = () => {
        const currentIndex = rooms.findIndex(room => room.id === selectedRoomId);
        const prevIndex = (currentIndex - 1 + rooms.length) % rooms.length; // Циклический переход
        setSelectedRoomId(rooms[prevIndex].id);
      };

    const handleRoomChange = (roomId) => {
        setSelectedRoomId(roomId);
    };

    const handleSwitchChange = (deviceId, currentState) => {
      const newState = !currentState; // Изменяем состояние
  
      // Обновляем состояние сразу для мгновенной реакции
      setDevices(prevDevices => 
          prevDevices.map(device => 
              device.id === deviceId ? { ...device, capabilities: device.capabilities.map(cap => 
                  cap.type === "devices.capabilities.on_off" ? { ...cap, state: { value: newState } } : cap
              ) } : device
          )
      );
  
      const message = {
          device_id: deviceId,
          action_type: "devices.capabilities.on_off",
          instance: "on",
          value: newState
      };
  
      // Отправляем сообщение через WebSocket
      if (socket && socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify(message));
      } else {
          console.error('WebSocket is not open. Message not sent:', message);
      }
  };

    const handleSliderChangeCommitted = (deviceId, value) => {
        const message = {
            device_id: deviceId,
            action_type: "devices.capabilities.range",
            instance: "temperature",
            value: value
        };

        // Отправляем сообщение через WebSocket
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify(message));
        } else {
            console.error('WebSocket is not open. Message not sent:', message);
        }
    };

    const handleSliderChange = (deviceId, value) => {
        setSliderValues(prevValues => ({ ...prevValues, [deviceId]: value })); // Обновляем значение слайдера для конкретного устройства
    };

    const renderDeviceInfo = (device) => {
        const { icon_url, name, properties = [], capabilities = [] } = device;

        const onOffCapability = capabilities.find(cap => cap.type === "devices.capabilities.on_off");
        const isChecked = onOffCapability ? onOffCapability.state?.value : false; // Используем оператор опциональной цепочки

        // Проверяем, является ли устройство термостатом
        const isThermostat = device.type === "devices.types.thermostat";
        const temperatureCapability = capabilities.find(cap => cap.type === "devices.capabilities.range");
        const currentTemperature = temperatureCapability ? temperatureCapability.state?.value : 0; // Получаем текущее значение температуры
        
        // Получаем текущее значение слайдера для этого устройства
        const sliderValue = sliderValues[device.id] !== undefined ? sliderValues[device.id] : currentTemperature;

        return (
            <div key={device.id} className="device-card">
                <img src={icon_url} alt={name} className="device-image" />
                <p>{name}</p>
                <div className="device-details">
                    {properties.map((property, index) => {
                        if (property?.parameters?.instance === "battery_level" && property.state) {
                            return <p key={index}>Заряд: {property.state.value}%</p>;
                        }
                        if (property?.parameters?.instance === "humidity" && property.state) {
                            return <p key={index}>Влажность: {property.state.value}%</p>;
                        }
                        if (property?.parameters?.instance === "temperature" && property.state) {
                            return <p key={index}>Температура: {property.state.value}°C</p>;
                        }
                        return null;
                    })}
                    {onOffCapability && (
    <div>
        <p>Состояние: {isChecked ? "Включено" : "Выключено"}</p>
        <AntSwitch
            checked={isChecked}
            onChange={() => handleSwitchChange(device.id, isChecked)}
        />
    </div>
)}
                    {/* Если устройство термостат */}
                    {isThermostat && isChecked && (
                        <div>
                            <p>Температура: {sliderValue}°C</p>
                            <Slider
                                value={sliderValue}
                                onChange={(e, newValue) => handleSliderChange(device.id, newValue)}
                                onChangeCommitted={() => handleSliderChangeCommitted(device.id, sliderValue)}
                                step={1}
                                marks={[0, 10, 20, 30]}
                                min={0}
                                max={30}
                                valueLabelDisplay="auto"
                            />
                        </div>
                    )}
                </div>
            </div>
        );
    };

    if (loading) {
        return <div>Загрузка...</div>;
    }

    if (error) {
        return <div>{error}</div>;
    }

    return (
        <>
         
        <div className="carousel-container">
           
            <div className="carousel">
                <div className="carousel-image" style={{ backgroundImage: `url(${roomImages[currentRoom.name] || img5})` }}>
                    <div className="top-left-blocks">
                       
                        <select className="room-select" value={selectedRoomId} onChange={(e) => handleRoomChange(e.target.value)}>
                            {rooms.map((room) => (
                                <option key={room.id} value={room.id}>
                                    {room.name}
                                </option>
                            ))}
                        </select>
                      
                        
                    </div>
                    <div className="carousel-controls">
            <button className="nav-button" onClick={handlePrevRoom} aria-label="Предыдущая комната">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 5L9 12L15 19" stroke="#1C274C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button className="nav-button" onClick={handleNextRoom} aria-label="Следующая комната">
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
                    {devices.map(renderDeviceInfo)}
                </div>
            </div>
        </div>
        </>
        
    );
};

export default Carousel;
