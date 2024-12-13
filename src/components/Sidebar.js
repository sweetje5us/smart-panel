import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHouse, faHouseLaptop, faCartShopping, faLocationArrow, faBell, faNewspaper, faPlay, faArrowLeft, faArrowRight, faTimes, faTasks } from '@fortawesome/free-solid-svg-icons';
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
  const [currentSection, setCurrentSection] = useState('Главная'); // Состояние для текущего раздела

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
  ];

  const handleMenuItemClick = (text) => {
    setCurrentSection(text); // Устанавливаем текущий раздел
  };

  return (
    <>
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        height: '100vh',
        width: isExpanded ? '240px' : '60px',
        transition: 'width 0.3s',
        backgroundColor: 'white',
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

          {menuItems.map(({ text, icon, path, action }) => (
            <ListItem key={text} disablePadding sx={{ display: 'block' }}>
              <ListItemButton
                component={path ? Link : 'button'}
                to={path}
                onClick={() => {
                  handleMenuItemClick(text); // Устанавливаем текущий раздел при клике
                  if (action) action(); // Если есть действие, выполняем его
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
                <FontAwesomeIcon icon={icon} style={{ marginRight: '8px' }} />
                {isExpanded && <ListItemText primary={text} />}
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

      {/* Основной контейнер для содержимого страницы */}
      <div style={{
        marginLeft: isExpanded ? '240px' : '60px', // Отступ слева равный ширине сайдбара
        transition: 'margin-left 0.3s',
        padding: '20px', // Добавляем отступы для содержимого
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
