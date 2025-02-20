// src/App.js
import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Home from './components/Home';
import SmartHome from './components/SmartHome';
import Orders from './components/Orders';
import Map from './components/Map';
import Notifications from './components/Notifications';
import Info from './components/Info';
import Tasks from './components/Tasks';
import Task from './components/Task';


const App = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true); // Состояние для управления боковой панелью

  return (
    <Router>
      <div style={{ display: 'flex', height: '100vh' }}>
        <Sidebar open={sidebarOpen} /> {/* Передаем проп open */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {/* Убрали marginLeft и добавили overflowY для вертикальной прокрутки */}
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/smart-home" element={<SmartHome />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/map" element={<Map />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/info" element={<Info />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/tasks/:task_id" element={<Tasks />} /> {/* Добавляем маршрут для редактирования задачи */}
          </Routes>
        </div>
      </div>
    </Router>
  );
};

export default App;
