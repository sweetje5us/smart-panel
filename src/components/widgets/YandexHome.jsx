import React, { useState, useEffect } from 'react';
import SendIcon from '@mui/icons-material/Send';
import { CloseRounded } from '@mui/icons-material';
import Switch from '@mui/material/Switch';
import Button from '@mui/material/Button'; // Импортируем Button из MUI
import ip from '../ip.json';
import token from '../token.json';

const address = `${ip.ip}:${ip.port}`;
const access_token = token.token_yandex;

function handleChangeSw5(id, value) {
  const myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");
  myHeaders.append('Accept', 'application/json');
  myHeaders.append("Authorization", `Bearer ${access_token}`);

  const raw = JSON.stringify({
    "devices": [{ "id": id, "actions": [{ "type": "devices.capabilities.on_off", "state": { "instance": "on", "value": value } }] }]
  });

  fetch(`http://${address}/https://api.iot.yandex.net/v1.0/devices/actions`, {
    method: "POST",
    headers: myHeaders,
    body: raw,
  }).catch((error) => console.error(error));
}

function handleChangeTemp(id, value) {
  const myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");
  myHeaders.append('Accept', 'application/json');
  myHeaders.append("Authorization", `Bearer ${access_token}`);

  const raw = JSON.stringify({
    "devices": [{ "id": id, "actions": [{ "type": "devices.capabilities.range", "state": { "instance": "temperature", "value": value } }] }] }
  );

  fetch(`http://${address}/https://api.iot.yandex.net/v1.0/devices/actions`, {
    method: "POST",
    headers: myHeaders,
    body: raw,
  }).catch((error) => console.error(error));
}

const useDeviceStatus = (id, src) => {
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const myHeaders = new Headers();
    myHeaders.append("Authorization", `Bearer ${access_token}`);

    fetch(`http://${address}/https://api.iot.yandex.net/v1.0/devices/${id}`, {
      method: "GET",
      headers: myHeaders,
    })
      .then(response => response.json())
      .then(result => {
        let value;
        if (id === '35e3f2df-4372-452b-a61a-c6bf4f5cf4a2') {
          value = result.properties[1]?.state?.value;
        } else {
          value = src === 0 ? result.capabilities[1]?.state?.value : result.properties[src]?.state?.value;
        }
        setUserData(value);
      })
      .catch((error) => console.error(error));
  }, [id, src]);

  return userData;
};

const StatusDisplay = ({ id, src }) => {
  const userData = useDeviceStatus(id, src);
  const roundedValue = userData !== null ? Math.round(userData) : null;

  return <span>{roundedValue !== null ? (roundedValue > 0 ? `+${roundedValue}` : roundedValue) : '-'}</span>;
};

const Toggle = ({ className, value }) => {
  const [myArray, setMyArray] = useState(Array(30).fill(false));
  const [currentTemperature, setCurrentTemperature] = useState(0);

  const fetchData = async () => {
    try {
      const response = await fetch(`http://${address}/https://api.iot.yandex.net/v1.0/devices/${value}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const result = await response.json();
      setMyArray(prev => {
        const newArray = [...prev];
        newArray[className] = result.capabilities[0]?.state?.value ?? false;
        return newArray;
      });
      setCurrentTemperature(result.capabilities[1]?.state?.value ?? 0);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      fetchData();
    }, 30000);
    return () => clearInterval(interval);
  }, [className, value]);

  const handleClick = (event) => {
    const newValue = event.target.checked;
    const updatedArray = [...myArray];
    updatedArray[className] = newValue;
    setMyArray(updatedArray);
    handleChangeSw5(value, newValue);
  };

  return (
    <div>
      <label>
        <Switch 
          checked={myArray[className]} 
          onChange={handleClick} 
          color="primary" 
        />
        {className > 10 && myArray[className] && (
          <span>{currentTemperature}°</span>
        )}
      </label>
    </div>
  );
};

const DashboardCard07 = () => {
  const rooms = [
    { id: '1', name: 'Прихожая', lightId: '75cb6fc4-3fd9-4c60-a2ef-ba32cf97961f', temperatureId: 'ab2cdb7c-0af5-4dd2-9e8a-0999f45dbf26', radiatorId: '-', floorId: '64f7c874-fada-446c-8cc3-83848e6d54ff' },
    { id: '2', name: 'Гардероб', lightId: 'bd142373-4be7-4a22-ba7f-67c62520e419', temperatureId: '-', radiatorId: '-', floorId: '-' },
    { id: '3', name: 'Ванная', lightId: '68695c4b-c4b3-4eef-bd06-0788f0b2b1e3', temperatureId: 'eb1aac9f-4f5e-481a-acd3-731a8b3d489c', radiatorId: '-', floorId: '3c7fe2c1-cb3e-439a-a366-ec1c6238bb4b' },
    { id: '4', name: 'Кухня', lightId: '06373972-8464-4920-a866-73448fedea8f', temperatureId: '8bcfb58a-13b8-4e9b-a7a0-5199f2c28b8f', radiatorId: '-', floorId: '-' },
    { id: '5', name: 'Гостиная', lightId: '4c661077-a9fa-47ef-bf60-79bce8d3c673', temperatureId: '8bcfb58a-13b8-4e9b-a7a0-5199f2c28b8f', radiatorId: 'a8bb3e9e-7393-4683-8b30-761f1dcd2e89', floorId: '-' },
    { id: '6', name: 'Спальня', lightId: '1da20807-9966-4c1b-ae47-8665c5c989d3', temperatureId: 'f5e10267-5972-48fb-a358-c2db74c40df3', radiatorId: '18918a7c-3633-4bb4-aeb2-26104b68e38e', floorId: '-' },
    { id: '7', name: 'Балкон', lightId: '900dca1a-e53a-418c-82cc-5ebb8795e266', temperatureId: '35e3f2df-4372-452b-a61a-c6bf4f5cf4a2', radiatorId: '-', floorId: '-' },
  ];

  const handleClick = () => {
    const deviceIds = rooms.map(room => room.lightId);
    deviceIds.forEach(id => {
      handleChangeSw5(id, false);
    });
  };

  return (
    <div className="dashboard-card">
      <header className="header">
        <h2>Панель Умного дома</h2>
      </header>
      <div className="content">
        <table style={{ width: '100%', textAlign: 'center' }}>
          <thead>
            <tr>
              <th>Комната</th>
              <th>Свет</th>
              <th>Температура</th>
              <th>Радиатор</th>
              <th>Теплый пол</th>
            </tr>
          </thead>
          <tbody>
            {rooms.map((room, index) => (
              <tr key={room.id}>
                <td>{room.name}</td>
                <td>
                  <Toggle className={index.toString()} value={room.lightId} />
                </td>
                <td>
                  <StatusDisplay id={room.temperatureId} src={2} />
                </td>
                <td>
                  {room.radiatorId !== '-' ? (
                    <Toggle className={index + 10} value={room.radiatorId} />
                  ) : (
                    <div>-</div>
                  )}
                </td>
                <td>
                  {room.floorId !== '-' ? (
                    <Toggle className={index + 20} value={room.floorId} />
                  ) : (
                    <div>-</div>
                  )}
                </td>
              </tr>
            ))}
            <tr>
              <td colSpan={1}></td>
              <td>
                <Button 
                  variant="contained" 
                  color="secondary" 
                  onClick={handleClick} 
                  style={{ marginBottom: '16px' }} // Добавляем отступ для кнопки
                >
                  ВЫКЛ ВСЁ
                </Button>
              </td>
              <td></td>
              <td></td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DashboardCard07;
