import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useNotifications } from '../contexts/NotificationContext';
import { useAuth } from '../context/AuthContext';
import './Sidebar.css';

const Sidebar = ({ isExpanded, setIsExpanded }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, getUser } = useAuth();
  const [userData, setUserData] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const { unreadCount } = useNotifications();

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    const loadUserData = async () => {
      if (!user?.id) return;
      
      try {
        const result = await getUser(user.id);
        if (result.success) {
          setUserData(result.user);
        }
      } catch (err) {
        console.error('Ошибка при загрузке данных пользователя:', err);
      }
    };

    loadUserData();
  }, [user?.id, getUser]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  const menuItems = [
    { path: '/', icon: 'home', label: 'Главная' },
    { path: '/tasks', icon: 'task', label: 'Задачи' },
    { path: '/calendar', icon: 'calendar_today', label: 'Календарь' },
    { path: '/orders', icon: 'shopping_cart', label: 'Заказы' },
    { path: '/map', icon: 'map', label: 'Карта' },
    { path: '/cameras', icon: 'videocam', label: 'Камеры' },
    { path: '/invoices', icon: 'receipt_long', label: 'Счета' },
    { path: '/news', icon: 'newspaper', label: 'Новости УК' },
    { 
      path: '/notifications', 
      icon: 'notifications', 
      label: 'Уведомления',
      badge: unreadCount
    },
    { path: '/settings', icon: 'settings', label: 'Настройки' },
    { path: '/user', icon: 'person', label: 'Профиль' }
  ];

  const toggleSidebar = (e) => {
    if (e) {
      e.stopPropagation();
    }
    setIsExpanded(!isExpanded);
  };

  const handleNavClick = () => {
    if (isMobile) {
      setIsExpanded(false);
    }
  };

  return (
    <>
      {isMobile && (
        <button className="mobile-menu-button" onClick={toggleSidebar}>
          <span className="material-icons">menu</span>
        </button>
      )}
      <div 
        className={`sidebar-overlay ${isExpanded ? 'active' : ''}`} 
        onClick={toggleSidebar}
      />
      <aside className={`sidebar ${isExpanded ? 'expanded' : ''}`}>
        <div className="sidebar-header">
          <div className="logo">
            <img src="/logo.png" alt="Logo" />
            {isExpanded && <span>Smart Panel</span>}
          </div>
          {!isMobile && (
            <button className="toggle-btn" onClick={toggleSidebar}>
              <span className="material-icons">
                {isExpanded ? 'chevron_left' : 'chevron_right'}
              </span>
            </button>
          )}
          {isMobile && (
            <button className="mobile-close-btn" onClick={toggleSidebar}>
              <span className="material-icons">close</span>
            </button>
          )}
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
              onClick={handleNavClick}
            >
              <span className="material-icons">{item.icon}</span>
              {isExpanded && <span>{item.label}</span>}
              {item.badge > 0 && (
                <span className="nav-badge">{item.badge}</span>
              )}
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            {userData?.settings?.img ? (
              <img 
                src={userData.settings.img} 
                alt={userData.name} 
                className="user-avatar"
              />
            ) : (
              <div className="user-avatar-placeholder">
                {userData?.name?.charAt(0)?.toUpperCase() || 'Г'}
              </div>
            )}
            {isExpanded && (
              <div className="user-details">
                <p className="user-name">{userData?.name || 'Гость'}</p>
                <p className="user-role">{userData?.login || 'Не авторизован'}</p>
              </div>
            )}
          </div>
          <button onClick={handleLogout} className="logout-btn">
            <span className="material-icons">logout</span>
            {isExpanded && <span>Выйти</span>}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar; 