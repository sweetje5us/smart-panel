import React, { useState, useEffect } from 'react';
import './WeatherWidget.css';
import ip from '../ip.json'
const API_URL = `${ip.ip}:${ip.port}/api`;
// Импорт фоновых изображений
const weatherBackgrounds = {
  winter: {
    clear: require('../../assets/weather-backgrounds/winter-clear.gif'),
    clouds: require('../../assets/weather-backgrounds/winter-clouds.gif'),
    rain: require('../../assets/weather-backgrounds/winter-rain.gif'),
    snow: require('../../assets/weather-backgrounds/winter-snow.gif'),
    thunderstorm: require('../../assets/weather-backgrounds/winter-thunderstorm.gif'),
    mist: require('../../assets/weather-backgrounds/winter-mist.gif'),
    default: require('../../assets/weather-backgrounds/winter-default.gif')
  },
  spring: {
    clear: require('../../assets/weather-backgrounds/spring-clear.gif'),
    clouds: require('../../assets/weather-backgrounds/spring-clouds.gif'),
    rain: require('../../assets/weather-backgrounds/spring-rain.gif'),
    thunderstorm: require('../../assets/weather-backgrounds/spring-thunderstorm.gif'),
    mist: require('../../assets/weather-backgrounds/spring-mist.gif'),
    default: require('../../assets/weather-backgrounds/spring-default.gif')
  },
  summer: {
    clear: require('../../assets/weather-backgrounds/summer-clear.gif'),
    clouds: require('../../assets/weather-backgrounds/summer-clouds.gif'),
    rain: require('../../assets/weather-backgrounds/summer-rain.gif'),
    thunderstorm: require('../../assets/weather-backgrounds/summer-thunderstorm.gif'),
    mist: require('../../assets/weather-backgrounds/summer-mist.gif'),
    default: require('../../assets/weather-backgrounds/summer-default.gif')
  },
  autumn: {
    clear: require('../../assets/weather-backgrounds/autumn-clear.gif'),
    clouds: require('../../assets/weather-backgrounds/autumn-clouds.gif'),
    rain: require('../../assets/weather-backgrounds/autumn-rain.gif'),
    thunderstorm: require('../../assets/weather-backgrounds/autumn-thunderstorm.gif'),
    mist: require('../../assets/weather-backgrounds/autumn-mist.gif'),
    default: require('../../assets/weather-backgrounds/autumn-default.gif')
  }
};

const WeatherWidget = () => {
  const [weatherData, setWeatherData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const getCurrentSeason = () => {
    const month = new Date().getMonth();
    if (month >= 11 || month <= 1) return 'winter';
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    return 'autumn';
  };

  const getWeatherBackground = (precType, precStrength) => {
    const season = getCurrentSeason();
    const seasonBackgrounds = weatherBackgrounds[season];
    
    if (precType === 'NO_TYPE' && precStrength === 'ZERO') return seasonBackgrounds.clear;
    if (precType === 'RAIN') return seasonBackgrounds.rain;
    if (precType === 'SNOW') return seasonBackgrounds.snow;
    if (precType === 'HAIL') return seasonBackgrounds.thunderstorm;
    if (precType === 'SLEET') return seasonBackgrounds.mist;
    
    return seasonBackgrounds.clouds;
  };

  const getWeatherDescription = (precType, precStrength) => {
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

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const response = await fetch(`http://${API_URL}/weather`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: `{
              weatherByPoint(request: { lat: 56.271461, lon: 57.999168 }) {
                now {
                  cloudiness
                  humidity
                  precType
                  precStrength
                  pressure
                  temperature
                  windSpeed
                  windDirection
                }
              }
            }`
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        setWeatherData(result.data.weatherByPoint.now);
        setError(null);
      } catch (err) {
        setError('Ошибка при загрузке данных о погоде');
        console.error('Weather fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
    const interval = setInterval(fetchWeather, 600000); // Обновление каждые 10 минут

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="weather-widget loading">
        <div className="loading-spinner" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="weather-widget error">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  if (!weatherData) return null;

  const backgroundImage = getWeatherBackground(weatherData.precType, weatherData.precStrength);
  const weatherDescription = getWeatherDescription(weatherData.precType, weatherData.precStrength);

  return (
    <div 
      className="weather-widget"
      style={{
        backgroundImage: `url(${backgroundImage})`,
      }}
    >
      <div className="weather-content">
        <div className="temperature">
          {Math.round(weatherData.temperature)}°C
        </div>
        <div className="weather-details">
          <div className="weather-description">
            {weatherDescription}
          </div>
          <div className="humidity">
            Влажность: {weatherData.humidity}%
          </div>
          <div className="pressure">
            Давление: {Math.round(weatherData.pressure)} мм рт.ст.
          </div>
          <div className="wind">
            Ветер: {weatherData.windSpeed} м/с
          </div>
        </div>
        <div className="city-name">
          Пермь
        </div>
      </div>
    </div>
  );
};

export default WeatherWidget; 