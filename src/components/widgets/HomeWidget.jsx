import React, { useEffect, useState, useRef, useCallback, useMemo, memo } from 'react';
import ip from '../ip.json';
import './HomeWidget.css';
import axios from 'axios';
import { useTheme } from '../../contexts/ThemeContext';

// Выводим конфигурацию для отладки
// console.log('IP Configuration:', ip);

// WebSocket URL для устройств с явным указанием протокола и хоста
const WS_URL = `ws://${ip.ip}:${ip.port}/ws/devices`;
// console.log('WebSocket URL:', WS_URL);

// Константы
const MAX_RECONNECT_ATTEMPTS = 3;
const INITIAL_RECONNECT_DELAY = 5000;
const CONNECTION_TIMEOUT = 60000; // 60 секунд согласно документации
const REFRESH_INTERVAL = 5000; // Интервал обновления данных (5 секунд)

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

// Массив WebSocket URLs для устройств
const WS_URLS = [
    `ws://${ip.ip}:${ip.port}/api/ws/devices`,
    `ws://${ip.ip}:${ip.port}/ws/devices`,
    `ws://${ip.ip}:${ip.port}/api/ws`,
    `ws://${ip.ip}:${ip.port}/ws`
];

// SVG иконки
const CloseIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z" fill="currentColor"/>
  </svg>
);

const ExpandMoreIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16.59 8.59L12 13.17L7.41 8.59L6 10L12 16L18 10L16.59 8.59Z" fill="currentColor"/>
  </svg>
);

const ThermostatIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M15 13V5c0-1.66-1.34-3-3-3S9 3.34 9 5v8c-1.21.91-2 2.37-2 4 0 2.76 2.24 5 5 5s5-2.24 5-5c0-1.63-.79-3.09-2-4zm-4-8c0-.55.45-1 1-1s1 .45 1 1h-2z" fill="currentColor"/>
  </svg>
);

const HumidityIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0L12 2.69z" fill="currentColor"/>
  </svg>
);

const LightIcon = ({ active }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.87-3.13-7-7-7zm-1 14h2v-3.34l.6-.4C14.99 11.21 16 10.2 16 9c0-2.21-1.79-4-4-4S8 6.79 8 9c0 1.2 1.01 2.21 2.4 3.26l.6.4V16z" fill={active ? "#FFD700" : "currentColor"}/>
  </svg>
);

const DoorIcon = ({ active }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M19 19V5c0-1.1-.9-2-2-2H7c-1.1 0-2 .9-2 2v14H4v2h16v-2h-1zm-2 0H7V5h10v14zm-5-8h2v2h-2v-2z" 
      fill={active ? "#FFD700" : "#FFFFFF"}/>
  </svg>
);

// Порядок отображения комнат
const roomOrder = {
  "Кухня": 0,
  "Гостиная": 1,
  "Спальня": 2,
  "Ванная": 3,
  "Прихожая": 4,
  "Гардероб": 5,
  "Балкон": 6
};

// Кастомный переключатель
const CustomSwitch = memo(({ checked, onChange, disabled }) => (
  <label className={`custom-switch ${disabled ? 'disabled' : ''}`}>
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      disabled={disabled}
    />
    <span className="switch-slider"></span>
  </label>
));

// Обновляем стили для переключателя с учетом темы
const styles = `
.theme-dark .home-widget {
  background: #1a1a1a;
  color: #ffffff;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.theme-dark .widget-content {
  flex: 1;
  padding: 5px;
  display: flex;
  flex-direction: column;
}

.theme-dark .rooms-grid {
  flex: 1;
  display: grid;
  gap: 5px;
  padding: 5px;
}

.theme-dark .room-card {
  background: #2d2d2d;
  border: 1px solid rgba(255, 255, 255, 0.1);
  height: 120px;
  position: relative;
  overflow: hidden;
}

.theme-dark .room-background {
  width: 100%;
  height: 100%;
  object-fit: cover;
  position: absolute;
  top: 0;
  left: 0;
}

.theme-dark .room-content {
  position: relative;
  z-index: 1;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 8px;
}

.theme-dark .room-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 4px;
}

.theme-dark .room-header h3 {
  margin: 0;
  padding: 4px 8px;
  font-size: 1rem;
  border-radius: 4px;
}

.theme-dark .room-climate {
  display: flex;
  gap: 4px;
}

.theme-dark .climate-item {
  padding: 2px 6px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.9rem;
}

.theme-dark .room-lights {
  display: flex;
  gap: 4px;
  justify-content: flex-end;
}

.theme-dark .light-control {
  padding: 4px;
  border-radius: 4px;
  cursor: pointer;
}

.theme-dark .room-overlay {
  background: linear-gradient(to bottom, rgba(0,0,0,0.5), rgba(0,0,0,0.8));
}

.theme-dark .modal-content {
  background: #1a1a1a;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.theme-dark .modal-header h3 {
  color: #ffffff;
}

.theme-dark .modal-device-item {
  background: #2d2d2d;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.theme-dark .device-name {
  color: #ffffff;
}

.theme-dark .device-type {
  color: rgba(255, 255, 255, 0.7);
}

.theme-dark .custom-switch .switch-slider {
  background-color: #444;
}

.theme-dark .custom-switch input:checked + .switch-slider {
  background-color: #4CAF50;
}

.theme-dark .custom-switch .switch-slider:before {
  background-color: #fff;
}

.theme-dark .close-button {
  color: #ffffff;
}

.theme-dark .loading-indicator {
  background: rgba(0, 0, 0, 0.7);
  color: #ffffff;
}

.custom-switch {
  position: relative;
  display: inline-block;
  width: 40px;
  height: 24px;
  cursor: pointer;
}

.custom-switch.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.custom-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.switch-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: .2s;
  border-radius: 24px;
  box-shadow: inset 0 1px 3px rgba(0,0,0,0.2);
}

.switch-slider:before {
  position: absolute;
  content: "";
  height: 16px;
  width: 16px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  transition: .2s;
  border-radius: 50%;
  box-shadow: 0 1px 3px rgba(0,0,0,0.3);
}

input:checked + .switch-slider {
  background-color: #4CAF50;
}

input:checked + .switch-slider:before {
  transform: translateX(16px);
}

input:disabled + .switch-slider {
  cursor: not-allowed;
  opacity: 0.7;
}

.modal-device-item {
  transition: all 0.2s ease;
}

.modal-device-item:hover {
  transform: translateY(-2px);
}

.theme-dark .modal-device-item:hover {
  background: #363636;
}

.light-control {
  transition: all 0.2s ease;
}

.light-control:hover {
  transform: scale(1.1);
}

.theme-dark .light-control:hover {
  background: rgba(255, 255, 255, 0.1);
}

.theme-dark .light-control.active:hover {
  background: rgba(255, 215, 0, 0.3);
}
`;

// Добавляем стили в head
const styleSheet = document.createElement("style");
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);

// Определяем RoomCard до его использования
const RoomCard = memo(({ room, climate, devices, onRoomClick, onLightControl, lightStates, roomImage }) => {
  const lights = devices.filter(device => 
    device.type.includes('light') || 
    (device.type === 'devices.types.switch' && device.capabilities?.some(cap => 
      cap?.type === 'devices.capabilities.on_off' && cap?.state?.value !== undefined
    ))
  );

  const displayedLights = lights.length > 1 
    ? lights.filter(light => /[12]/.test(light.name))
    : lights;

  return (
    <div key={room.id} className="room-card">
      <img 
        src={roomImage || roomImages["Гостиная"]} 
        alt={room.name}
        className="room-background"
      />
      <div className="room-overlay" />
      <div className="room-content">
        <div className="room-header">
          <h3 onClick={() => onRoomClick(room)}>{room.name}</h3>
          {climate && (
            <div className="room-climate">
              {climate.temperature !== undefined && (
                <div className="climate-item">
                  <span>{climate.temperature.toFixed(1)}°C</span>
                  <ThermostatIcon />
                </div>
              )}
              {climate.humidity !== undefined && (
                <div className="climate-item">
                  <span>{climate.humidity.toFixed(0)}%</span>
                  <HumidityIcon />
                </div>
              )}
            </div>
          )}
        </div>
        <div className="room-lights">
          {displayedLights.map(light => {
            const onOffCap = light.capabilities?.find(cap => 
              cap?.type === 'devices.capabilities.on_off' && cap?.state?.value !== undefined
            );
            if (!onOffCap) return null;

            const isActive = lightStates[light.id] ?? onOffCap.state.value;

            return (
              <div 
                key={light.id} 
                className={`light-control ${isActive ? 'active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onLightControl(light.id, onOffCap);
                }}
              >
                <LightIcon active={isActive} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

// Компонент модального окна
const CustomModal = ({ open, onClose, children }) => {
  if (!open) return null;

  return (
    <div className={`custom-modal ${open ? 'open' : ''}`} onClick={onClose}>
      <div className="custom-modal-content" onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
};

// Добавляем новый компонент для стабильного рендеринга сетки комнат
const RoomsGrid = memo(({ rooms, devices, onRoomClick, onLightControl, lightStates }) => {
  const devicesByRoomId = useMemo(() => {
    const mapping = new Map();
    devices.forEach(device => {
      if (device.room) {
        if (!mapping.has(device.room)) {
          mapping.set(device.room, []);
        }
        mapping.get(device.room).push(device);
      }
    });
    return mapping;
  }, [devices]);

  const climateByRoomId = useMemo(() => {
    const mapping = new Map();
    devices.forEach(device => {
      if (device.room && device.type === 'devices.types.sensor.climate') {
        const temperature = device.properties?.find(
          prop => prop?.type === 'devices.properties.float' && 
                  prop?.parameters?.instance === 'temperature'
        )?.state?.value;

        const humidity = device.properties?.find(
          prop => prop?.type === 'devices.properties.float' && 
                  prop?.parameters?.instance === 'humidity'
        )?.state?.value;

        if (temperature !== undefined || humidity !== undefined) {
          mapping.set(device.room, { temperature, humidity });
        }
      }
    });
    return mapping;
  }, [devices]);

  return (
    <div className="rooms-grid">
      {rooms.map(room => {
        const roomDevices = devicesByRoomId.get(room.id) || [];
        const climate = climateByRoomId.get(room.id);
        // console.log(`Комната ${room.name}:`, { devices: roomDevices, climate });
        
        return (
          <RoomCard
            key={room.id}
            room={room}
            climate={climate}
            devices={roomDevices}
            onRoomClick={onRoomClick}
            onLightControl={onLightControl}
            lightStates={lightStates}
            roomImage={roomImages[room.name]}
          />
        );
      })}
    </div>
  );
});

// Мок-данные для отладки
const mockDevices = [
  {
    id: 'light1',
    name: 'Основной свет',
    type: 'devices.types.light',
    room: 'living_room',
    capabilities: [
      {
        type: 'devices.capabilities.on_off',
        state: { instance: 'on', value: false }
      }
    ]
  },
  {
    id: 'climate1',
    name: 'Климат-контроль',
    type: 'devices.types.sensor.climate',
    room: 'living_room',
    properties: [
      {
        type: 'devices.properties.float',
        parameters: { instance: 'temperature' },
        state: { value: 22.5 }
      },
      {
        type: 'devices.properties.float',
        parameters: { instance: 'humidity' },
        state: { value: 45 }
      }
    ]
  }
];

const mockRooms = [
  { id: 'living_room', name: 'Гостиная' },
  { id: 'bedroom', name: 'Спальня' },
  { id: 'kitchen', name: 'Кухня' },
  { id: 'bathroom', name: 'Ванная' },
  { id: 'hallway', name: 'Прихожая' }
];

const HomeWidget = () => {
  const { theme } = useTheme();
  const [devices, setDevices] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [localLightStates, setLocalLightStates] = useState({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const isUpdatingRef = useRef(false);

  // Оптимизированная функция сравнения устройств
  const areDevicesEqual = useCallback((prevDevices, newDevices) => {
    if (!prevDevices || !newDevices) return false;
    if (prevDevices === newDevices) return true;
    if (prevDevices.length !== newDevices.length) return false;

    const prevMap = new Map(prevDevices.map(device => [device.id, device]));
    return newDevices.every(newDevice => {
      const prevDevice = prevMap.get(newDevice.id);
      if (!prevDevice) return false;
      
      const prevCapabilities = JSON.stringify(prevDevice.capabilities || []);
      const newCapabilities = JSON.stringify(newDevice.capabilities || []);
      const prevProperties = JSON.stringify(prevDevice.properties || []);
      const newProperties = JSON.stringify(newDevice.properties || []);
      
      return prevDevice.room === newDevice.room && 
             prevCapabilities === newCapabilities && 
             prevProperties === newProperties;
    });
  }, []);

  // Получение устройств
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://${ip.ip}:${ip.port}/api/devices`);
      
      if (response.status === 200) {
        // console.log('Получены данные:', response.data);
        
        // Обработка комнат
        if (response.data.rooms && Array.isArray(response.data.rooms)) {
          const sortedRooms = [...response.data.rooms].sort((a, b) => {
            const orderA = roomOrder[a.name] ?? 999;
            const orderB = roomOrder[b.name] ?? 999;
            return orderA - orderB;
          });
          setRooms(sortedRooms);
          
          // Обработка устройств
          if (response.data.devices && Array.isArray(response.data.devices)) {
            setDevices(prevDevices => {
              if (areDevicesEqual(prevDevices, response.data.devices)) {
                return prevDevices;
              }
              return response.data.devices;
            });
          } else {
            // console.log('Нет данных об устройствах в ответе');
            setDevices([]);
          }
          
          setError(null);
        } else {
          // console.log('Используем мок-данные: неверный формат ответа');
          setRooms(mockRooms);
          setDevices(mockDevices);
        }
      } else {
        throw new Error('Неверный статус ответа');
      }
    } catch (err) {
      // console.log('Ошибка при получении данных:', err.message);
      // console.log('Используем мок-данные для отладки');
      setRooms(mockRooms);
      setDevices(mockDevices);
      setError('Не удалось загрузить данные');
    } finally {
      setLoading(false);
    }
  }, [areDevicesEqual]);

  // Обновляем данные каждые 5 секунд
  useEffect(() => {
    let isMounted = true;

    const fetchAndRefresh = async () => {
      if (!isMounted) return;
      await fetchData();
    };

    fetchAndRefresh();
    const interval = setInterval(fetchAndRefresh, REFRESH_INTERVAL);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [fetchData]);

  // Обновление устройств
  const refreshDevices = useCallback(async () => {
    if (isRefreshing || isUpdatingRef.current) return;
    
    setIsRefreshing(true);
    try {
      const refreshPaths = [
        '/api/devices/refresh',
        '/devices/refresh',
        '/api/smart-home/devices/refresh'
      ];

      let success = false;
      for (const path of refreshPaths) {
        try {
          const response = await axios.post(`${path}`);
          if (response?.data?.status === 'ok' && Array.isArray(response.data?.devices)) {
            setDevices(prevDevices => {
              if (areDevicesEqual(prevDevices, response.data.devices)) {
                return prevDevices;
              }
              return response.data.devices;
            });
            setError(null);
            success = true;
            break;
          }
        } catch (e) {
          // console.log(`Попытка обновления через ${path} не удалась:`, e.message);
          continue;
        }
      }

      if (!success) {
        // console.log('Не удалось обновить данные, используем текущее состояние');
      }
    } catch (error) {
      console.error('Ошибка при обновлении устройств:', error);
      setError('Не удалось обновить состояние устройств');
    } finally {
      setIsRefreshing(false);
      isUpdatingRef.current = false;
    }
  }, [isRefreshing, areDevicesEqual]);

  // Мемоизируем отсортированные комнаты
  const sortedRooms = useMemo(() => {
    return [...rooms].sort((a, b) => {
      const orderA = roomOrder[a.name] ?? 999;
      const orderB = roomOrder[b.name] ?? 999;
      return orderA - orderB;
    });
  }, [rooms]);

  // Оптимизированная функция управления светом
  const handleLightControl = useCallback(async (deviceId, capability) => {
    const newValue = !capability.state.value;
    
    // Оптимистичное обновление состояния
    setLocalLightStates(prev => ({
      ...prev,
      [deviceId]: newValue
    }));

    // Оптимистичное обновление устройств
    setDevices(prevDevices => 
      prevDevices.map(device => 
        device.id === deviceId
          ? {
              ...device,
              capabilities: device.capabilities.map(cap =>
                cap.type === capability.type
                  ? { ...cap, state: { ...cap.state, value: newValue } }
                  : cap
              )
            }
          : device
      )
    );

    try {
      await axios.post(`http://${ip.ip}:${ip.port}/api/devices/${deviceId}/action`, {
        action_type: capability.type,
        instance: capability.state.instance,
        value: newValue
      });
      
      // Обновляем все данные после успешного запроса
      await fetchData();
    } catch (error) {
      console.error('Ошибка при управлении устройством:', error);
      
      // Откатываем состояние в случае ошибки
      setLocalLightStates(prev => ({
        ...prev,
        [deviceId]: capability.state.value
      }));
      
      // Откатываем состояние устройства
      setDevices(prevDevices => 
        prevDevices.map(device => 
          device.id === deviceId
            ? {
                ...device,
                capabilities: device.capabilities.map(cap =>
                  cap.type === capability.type
                    ? { ...cap, state: { ...cap.state, value: capability.state.value } }
                    : cap
                )
              }
            : device
        )
      );
      
      setError('Не удалось изменить состояние устройства');
    }
  }, [fetchData]);

  // Открытие модального окна
  const handleRoomClick = (room) => {
    setSelectedRoom(room);
    setModalOpen(true);
  };

  return (
    <div className={`home-widget ${theme === 'dark' ? 'theme-dark' : ''}`}>
      <div className="widget-content">
        {isRefreshing && (
          <div className="loading-indicator visible">Обновление...</div>
        )}
        <RoomsGrid
          rooms={sortedRooms}
          devices={devices}
          onRoomClick={handleRoomClick}
          onLightControl={handleLightControl}
          lightStates={localLightStates}
        />
      </div>

      <CustomModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      >
        {selectedRoom && (
          <>
            <div className="custom-modal-header">
              <h3>{selectedRoom.name}</h3>
              <button className="close-button" onClick={() => setModalOpen(false)}>
                <CloseIcon />
              </button>
            </div>
            <div className="modal-devices">
              {devices
                .filter(device => device.room === selectedRoom.id)
                .map(device => {
                  const onOffCap = device.capabilities?.find(cap => 
                    cap?.type === 'devices.capabilities.on_off' && cap?.state?.value !== undefined
                  );

                  const isUpdating = localLightStates[device.id] !== undefined && 
                                   localLightStates[device.id] !== onOffCap?.state.value;

                  return (
                    <div key={device.id} className="modal-device-item">
                      <div className="device-info">
                        <span className="device-name">{device.name}</span>
                        <span className="device-type">{device.type}</span>
                      </div>
                      {onOffCap && (
                        <div className="device-control">
                          <CustomSwitch 
                            checked={localLightStates[device.id] ?? onOffCap.state.value}
                            onChange={() => handleLightControl(device.id, onOffCap)}
                            disabled={isUpdating}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </>
        )}
      </CustomModal>
    </div>
  );
};

export default memo(HomeWidget);