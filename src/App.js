// src/App.js
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Login from './components/Login';
import Register from './components/Register';
import Sidebar from './components/Sidebar';
import UserProfile from './components/UserProfile';
import Settings from './components/Settings';
import Tasks from './components/Tasks';
import Calendar from './components/Calendar';
import Orders from './components/Orders';
import Map from './components/Map';
import NotificationsPage from './pages/NotificationsPage';
import Info from './components/Info';
import Home from './components/Home';
import NewsUK from './components/widgets/NewsUK';
import Cameras from './components/widgets/Cameras';
import Invoices from './components/widgets/Invoices';
import './App.css';
import './styles/themes.css';

const PrivateRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('user');
  return isAuthenticated ? children : <Navigate to="/login" />;
};

const App = () => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <AuthProvider>
      <NotificationProvider>
        <ThemeProvider>
          <Router>
            <div className="app">
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route
                  path="/*"
                  element={
                    <PrivateRoute>
                      <div className="app-container">
                        <Sidebar isExpanded={isExpanded} setIsExpanded={setIsExpanded} />
                        <main className={`main-content ${isExpanded ? 'sidebar-expanded' : ''}`}>
                          <Routes>
                            <Route path="/" element={<Home />} />
                            <Route path="/tasks" element={<Tasks />} />
                            <Route path="/tasks/:task_id" element={<Tasks />} />
                            <Route path="/calendar" element={<Calendar />} />
                            <Route path="/orders" element={<Orders />} />
                            <Route path="/map" element={<Map />} />
                            <Route path="/notifications" element={<NotificationsPage />} />
                            <Route path="/info" element={<Info />} />
                            <Route path="/settings" element={<Settings />} />
                            <Route path="/user" element={<UserProfile />} />
                            <Route path="/news" element={<NewsUK />} />
                            <Route path="/cameras" element={<Cameras />} />
                            <Route path="/invoices" element={<Invoices />} />
                          </Routes>
                        </main>
                      </div>
                    </PrivateRoute>
                  }
                />
              </Routes>
            </div>
          </Router>
        </ThemeProvider>
      </NotificationProvider>
    </AuthProvider>
  );
};

export default App;
