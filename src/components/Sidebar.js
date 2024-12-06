// src/components/Sidebar.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Select from 'react-select'; // Убедитесь, что вы установили react-select
import YandexMusic from './widgets/YandexMusic.jsx';

const cities = {
  'Пермь': { lat: 56.271461, lon: 57.999168 },
  'Дюртюли': { lat: 54.3047, lon: 55.9880 }
  // Здесь можно добавить больше городов
};

const Sidebar = () => {
  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');
  const [weatherData, setWeatherData] = useState(null);
  const [city, setCity] = useState({ label: 'Пермь', value: 'Пермь' }); // Установлено значение по умолчанию

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const daysOfWeek = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
      const day = daysOfWeek[now.getDay()];
      const date = `${day}, ${now.getDate()} ${now.toLocaleString('default', { month: 'long' })}`;
      
      setCurrentTime(`${hours}:${minutes}`);
      setCurrentDate(date);
    };

    updateDateTime();
    const intervalId = setInterval(updateDateTime, 60000); // обновляем каждую минуту
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (city) {
      fetchWeather(cities[city.label].lat, cities[city.label].lon);
    }
  }, [city]);

  const fetchWeather = async (lat, lon) => {
    const raw = JSON.stringify({
      query: `{ weatherByPoint(request: {lat: ${lat}, lon: ${lon}}) { now { cloudiness humidity precType precStrength pressure temperature fahrenheit: temperature(unit: FAHRENHEIT) windSpeed windDirection } } }`
    });

    const requestOptions = {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
        'X-Yandex-API-Key': 'demo_yandex_weather_api_key_ca6d09349ba0' // Замените на ваш API ключ
      },
      body: raw,
      redirect: "follow"
    };

    try {
      const response = await fetch('https://api.weather.yandex.ru/graphql/query', requestOptions);
      if (response.ok) {
        const result = await response.json();
        setWeatherData(result.data.weatherByPoint.now);
      }
    } catch (error) {
      console.error(error);
      setWeatherData(null); // Очистить предыдущие данные о погоде
      alert('Ошибка при загрузке данных о погоде. Попробуйте снова.');
    }
  };

  const getWeatherImage = (precType) => {
    const images = {
      'NO_TYPE': 'https://openweathermap.org/img/wn/01d@2x.png',
      'RAIN': 'https://openweathermap.org/img/wn/10d@2x.png',
      'SLEET': 'https://openweathermap.org/img/wn/50d@2x.png',
      'HAIL': 'https://openweathermap.org/img/wn/09d@2x.png',
      'SNOW': 'https://openweathermap.org/img/wn/13d@2x.png'
    };
    return images[precType] || '';
  };

  const getWeatherDescription = () => {
    if (!weatherData) return '';

    const { precType, precStrength } = weatherData;
    const descriptions = {
      'NO_TYPE': precStrength === 'ZERO' ? 'Ясно' : '',
      'RAIN': {
        'ZERO': 'Облачно',
        'WEAK': 'Слабый дождь',
        'AVERAGE': 'Средний дождь',
        'STRONG': 'Сильный дождь',
        'VERY_STRONG': 'Сильная гроза'
      },
      'SLEET': 'Мокрый снег',
      'HAIL': 'Град',
      'SNOW': {
        'ZERO': 'Снегопада нет',
        'WEAK': 'Слабый снег',
        'AVERAGE': 'Средний снег',
        'STRONG': 'Сильный снег',
        'VERY_STRONG': 'Очень сильный снег'
      }
    };

    return typeof descriptions[precType] === 'object' 
      ? descriptions[precType][precStrength] 
      : descriptions[precType];
  };

  const options = Object.keys(cities).map(city => ({ label: city, value: city }));

  return (
    <div style={{ width: '200px', height: '100vh', background: '#f4f4f4', padding: '20px' }}>
      <h2>Умный дом</h2>
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '2.5rem', margin: 0 }}>{currentTime}</h1>
        <p style={{ fontSize: '1rem', margin: 0 }}>{currentDate}</p>
      </div>
  
      <div className="flex flex-col col-span-full sm:col-span-6 xl:col-span-4 bg-white dark:bg-gray-800 shadow-sm rounded-xl p-5">
        <div className="flex flex-col items-center">
          <h1 style={{ fontSize: '2.5rem', margin: 0 }}>{weatherData ? `${weatherData.temperature}°` : 'Загрузка...'}</h1>
          <div className="text-sm text-5xl font-bold text-gray-800 dark:text-gray-100">
            <img
              style={{ alignSelf: 'center', width: '100px', height: '100px' }}
              src={weatherData ? getWeatherImage(weatherData.precType) : ''}
              alt="weather"
            />
          </div>
        </div>
        <div className="text-lm text-3xl font-bold text-gray-800 dark:text-gray-100 mr-1">
          {getWeatherDescription()}
        </div>
  
        <div className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase mb-1">
          {city ? city.label : 'Выберите город'}
        </div>
  
        <div className="flex items-start">
          <div className="text-sm font-medium text-white-700 px-1.5 bg-blue-500/20 rounded-full">
            Влажность {weatherData ? weatherData.humidity : 'Загрузка...'}%
          </div>
          <div className="text-sm font-medium text-white-700 px-1.5 bg-yellow-500/20 rounded-full">
            Ветер до {weatherData ? weatherData.windSpeed : 'Загрузка...'} м/с
          </div>
        </div>
  
        <div className="mt-4">
          <Select
            options={options}
            onChange={setCity}
            value={city} // Установите текущее значение
            placeholder="Выберите город"
            className="mb-4"
          />
        </div>
      </div>
  
      <ul style={{ listStyleType: 'none', padding: 0 }}>
        <li><Link to="/">Главная</Link></li>
        <li><Link to="/smart-home">Умный дом</Link></li>
        <li><Link to="/orders">Заказы</Link></li>
        <li><Link to="/map">Карта</Link></li>
        <li><Link to="/notifications">Уведомления</Link></li>
        <li><Link to="/info">Новости УК</Link></li>
      </ul>
      <YandexMusic></YandexMusic>
    </div>
  );
};

export default Sidebar;
