import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHouse, faHouseLaptop, faCartShopping, faLocationArrow, faBell, faNewspaper } from '@fortawesome/free-solid-svg-icons';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';

const Sidebar = ({ open }) => {
  return (
    <List>
      {[
        { text: 'Главная', icon: faHouse, path: '/' },
        { text: 'Умный дом', icon: faHouseLaptop, path: '/smart-home' },
        { text: 'Заказы', icon: faCartShopping, path: '/orders' },
        { text: 'Карта', icon: faLocationArrow, path: '/map' },
        { text: 'Уведомления', icon: faBell, path: '/notifications' },
        { text: 'Новости УК', icon: faNewspaper, path: '/info' },
      ].map(({ text, icon, path }) => (
        <ListItem key={text} disablePadding sx={{ display: 'block' }}>
          <ListItemButton
            component={Link}
            to={path}
            sx={{ minHeight: 48, px: 2.5 }}
          >
            <FontAwesomeIcon icon={icon} style={{ marginRight: '8px' }} />
            {open && <ListItemText primary={text} />}
          </ListItemButton>
        </ListItem>
      ))}
    </List>
  );
};

export default Sidebar;
