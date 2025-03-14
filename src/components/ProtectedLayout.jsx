import React, { useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { NotificationProvider } from '../contexts/NotificationContext';
import Sidebar from './Sidebar';

const ProtectedLayout = () => {
  const { isAuthenticated } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="app-container">
      <Sidebar isExpanded={isExpanded} setIsExpanded={setIsExpanded} />
      <div className={`main-content ${isExpanded ? 'sidebar-expanded' : ''}`}>
        <NotificationProvider>
          <Outlet />
        </NotificationProvider>
      </div>
    </div>
  );
};

export default ProtectedLayout; 