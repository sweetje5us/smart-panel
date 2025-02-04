import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHouse, faHouseLaptop, faCartShopping, faLocationArrow, faBell, faNewspaper, faPlay, faArrowLeft, faArrowRight, faTimes, faTasks, faCog } from '@fortawesome/free-solid-svg-icons';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import PropTypes from 'prop-types';
import YandexMusic from './widgets/YandexMusic.jsx';

const Sidebar = () => {
  const location = useLocation();
  const [showMusic, setShowMusic] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [currentSection, setCurrentSection] = useState('Главная'); 
  const [selectedCity, setSelectedCity] = useState('Пермь');
  const [temperature, setTemperature] = useState(null);
  const [currentTime, setCurrentTime] = useState('');

  const toggleMusic = () => {
    setShowMusic(prevShowMusic => !prevShowMusic);
  };

  const closeMusic = () => {
    setShowMusic(false);
  };

  const toggleSidebar = () => {
    setIsExpanded(prev => !prev);
  };

  const menuItems = [
    { text: 'Главная', icon: faHouse, path: '/' },
    { text: 'Задачи', icon: faTasks, path: '/tasks' },
    { text: 'Умный дом', icon: faHouseLaptop, path: '/smart-home' },
    { text: 'Заказы', icon: faCartShopping, path: '/orders' },
    { text: 'Карта', icon: faLocationArrow, path: '/map' },
    { text: 'Уведомления', icon: faBell, path: '/notifications' },
    { text: 'Новости УК', icon: faNewspaper, path: '/info' },
    { text: 'Музыка', icon: faPlay, action: toggleMusic },
    { text: 'Настройки', icon: faCog, path: '/settings' }, // раздел "Настройки"
    { text: 'Время', time: currentTime }, // раздел "Время"
    { text: 'Погода', action: null } // раздел "Погода"
  ];

  const handleMenuItemClick = (text) => {
    setCurrentSection(text);
  };

  // Функция для получения текущей температуры
  const fetchTemperature = async (city) => {
    const temperatures = {
      'Пермь': '15°C',
      'Дюртюли': '18°C'
    };
    setTemperature(temperatures[city]);
  };

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const formattedTime = isExpanded 
        ? now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) 
        : now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setCurrentTime(formattedTime);
    };

    const intervalId = setInterval(updateTime, 1000);
    updateTime(); // обновляем время сразу при загрузке

    return () => clearInterval(intervalId);
  }, [isExpanded]);

  return (
    <>
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        height: '100vh',
        width: isExpanded ? '240px' : '60px',
        transition: 'width 0.3s',
        backgroundColor: '#E0E0E0',
        boxShadow: '2px 0 5px rgba(0,0,0,0.1)',
        overflowY: 'auto'
      }}>
        <List>
          <ListItem disablePadding sx={{ display: 'block' }}>
            <ListItemButton onClick={toggleSidebar} sx={{
              width: '100%',
              minHeight: 48,
              px: 2.5,
              backgroundColor: 'transparent',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.1)',
              }
            }}>
              {isExpanded ? (
                <>
                  <FontAwesomeIcon icon={faArrowLeft} />
                  <span style={{ marginLeft: '8px' }}>Скрыть меню</span>
                </>
              ) : (
                <FontAwesomeIcon icon={faArrowRight} />
              )}
            </ListItemButton>
          </ListItem>

          {menuItems.map(({ text, icon, path, action, time }) => (
            <ListItem key={text} disablePadding sx={{ display: 'block' }}>
              <ListItemButton
                component={path ? Link : 'button'}
                to={path}
                onClick={() => {
                  handleMenuItemClick(text);
                  if (action) action();
                }}
                sx={{
                  width: '100%',
                  minHeight: 48,
                  px: 2.5,
                  backgroundColor: currentSection === text ? 'rgba(0, 0, 0, 0.08)' : 'transparent',
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.1)',
                  }
                }}
                aria-label={text}
                role={path ? 'link' : 'button'}
                tabIndex={0}
              >
                {icon && <FontAwesomeIcon icon={icon} style={{ marginRight: '8px' }} />}
                {text === 'Время' ? (
                  <div style={{ textAlign: isExpanded ? 'left' : 'center', width: '10%', fontSize: '14px' }}>
                    <b>{currentTime}</b>
                  </div>
                ) : text === 'Погода' ? (
                  <div style={{ textAlign: isExpanded ? 'left' : 'center', width: '100%' }}>
                    {isExpanded ? (
                      <>
                        <select 
                          onChange={(e) => {
                            setSelectedCity(e.target.value);
                            fetchTemperature(e.target.value);
                          }} 
                          value={selectedCity} 
                          style={{ 
                            width: '100%', // Устанавливаем ширину в 100%
                            margin: '0 auto', 
                            display: 'block' 
                          }}
                        >
                          <option value="Пермь">Пермь</option>
                          <option value="Дюртюли">Дюртюли</option>
                        </select>
                        <span style={{ marginLeft: '8px' }}>{temperature}</span>
                      </>
                    ) : (
                      <div>
                        <select 
                          onChange={(e) => {
                            setSelectedCity(e.target.value);
                            fetchTemperature(e.target.value);
                          }} 
                          value={selectedCity} 
                          style={{ 
                            width: '100%', // Устанавливаем ширину в 100%
                            margin: '0 auto', 
                            display: 'block' 
                          }}
                        >
                          <option value="Пермь">Пермь</option>
                          <option value="Дюртюли">Дюртюли</option>
                        </select>
                        <div>{temperature}</div>
                      </div>
                    )}
                  </div>
                ) : (
                  isExpanded && <ListItemText primary={text} />
                )}
              </ListItemButton>
            </ListItem>
          ))}
        </List>

        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          display: showMusic ? 'block' : 'none',
        }}>
          <button onClick={closeMusic} style={{
            position: 'absolute',
            top: '-40px',
            right: '10px',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: 'black',
          }}>
            <FontAwesomeIcon icon={faTimes} style={{ fontSize: '24px' }} />
          </button>
          <YandexMusic />
        </div>
      </div>

      <div style={{
        marginLeft: isExpanded ? '240px' : '60px',
        transition: 'margin-left 0.3s',
      }}>
        {/* Содержимое разделов */}
      </div>
    </>
  );
};

Sidebar.propTypes = {
  open: PropTypes.bool.isRequired,
};

export default Sidebar;
