// src/App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Home from './components/Home';
import SmartHome from './components/SmartHome';
import Orders from './components/Orders';
import Map from './components/Map';
import Notifications from './components/Notifications';
import Info from './components/Info';

const App = () => {
  return (
    <Router>
      <div style={{ display: 'flex' }}>
        <Sidebar />
        <div style={{ padding: '20px', flex: 1 }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/smart-home" element={<SmartHome />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/map" element={<Map />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/info" element={<Info />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
};

export default App;
