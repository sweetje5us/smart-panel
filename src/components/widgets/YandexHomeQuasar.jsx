import React, { useEffect, useState } from 'react';
import ip from '../ip.json';
import './Carousel.css';
import Switch from '@mui/material/Switch';
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

    useEffect(() => {
      const newSocket = new WebSocket(address);
      setSocket(newSocket);

      newSocket.onopen = () => {
          console.log('WebSocket connected');
      };
  
      newSocket.onmessage = (event) => {
          const data = JSON.parse(event.data);
          if (data.status === 'ok' && data.households) {
              const household = data.households[0];
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

    const handleRoomChange = (roomId) => {
        setSelectedRoomId(roomId);
    };

    const handleSwitchChange = (deviceId, currentState) => {
        const newState = !currentState; // Изменяем состояние
        const message = {
            device_id: deviceId,
            action_type: "devices.capabilities.on_off",
            value: newState
        };

        // Отправляем сообщение через WebSocket
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify(message));
        } else {
            console.error('WebSocket is not open. Message not sent:', message);
        }
    };

    const renderDeviceInfo = (device) => {
      const { icon_url, name, properties = [], capabilities = [] } = device;
  
      const onOffCapability = capabilities.find(cap => cap.type === "devices.capabilities.on_off");
      const isChecked = onOffCapability ? onOffCapability.state?.value : false; // Используем оператор опциональной цепочки
  
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
        <div className="carousel-container">
            <h2>Карусель комнат</h2>
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
                </div>
            </div>

            <div className="devices-list">
                <h3>Устройства в комнате:</h3>
                <div className="devices-grid">
                    {devices.map(renderDeviceInfo)}
                </div>
            </div>
        </div>
    );
};

export default Carousel;
