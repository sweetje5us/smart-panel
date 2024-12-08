import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHouse, faHouseLaptop, faCartShopping, faLocationArrow, faBell, faNewspaper, faPlay } from '@fortawesome/free-solid-svg-icons';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import PropTypes from 'prop-types';
import YandexMusic from './widgets/YandexMusic.jsx';

const Sidebar = ({ open }) => {
  const location = useLocation();
  const [showMusic, setShowMusic] = useState(false);

  const toggleMusic = () => {
    setShowMusic(prevShowMusic => !prevShowMusic);
  };

  const menuItems = [
    { text: 'Главная', icon: faHouse, path: '/' },
    { text: 'Умный дом', icon: faHouseLaptop, path: '/smart-home' },
    { text: 'Заказы', icon: faCartShopping, path: '/orders' },
    { text: 'Карта', icon: faLocationArrow, path: '/map' },
    { text: 'Уведомления', icon: faBell, path: '/notifications' },
    { text: 'Новости УК', icon: faNewspaper, path: '/info' },
    { text: 'Музыка', icon: faPlay, action: toggleMusic },
  ];

  return (
    <>
      <List>
        {menuItems.map(({ text, icon, path, action }) => (
          <ListItem key={text} disablePadding sx={{ display: 'block' }}>
            <ListItemButton
              component={action ? 'button' : Link} // Используем 'button' если есть action
              to={path}
              onClick={action} // Вызываем action, если он есть
              sx={{ 
                minHeight: 48, 
                px: 2.5,
                backgroundColor: location.pathname === path ? 'rgba(0, 0, 0, 0.08)' : 'transparent',
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.1)',
                }
              }}
              aria-label={text}
            >
              <FontAwesomeIcon icon={icon} style={{ marginRight: '8px' }} />
              {open && <ListItemText primary={text} />}
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      {/* Компонент YandexMusic отображается поверх страницы */}
      <div style={{
        position: 'fixed', // Или 'absolute', в зависимости от ваших требований
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000, // Убедитесь, что z-index выше других элементов
        display: showMusic ? 'block' : 'none', // Условное отображение
      }}>
        <YandexMusic />
      </div>
    </>
  );
};

Sidebar.propTypes = {
  open: PropTypes.bool.isRequired,
};

export default Sidebar;
