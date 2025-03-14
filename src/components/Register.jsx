import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ip from '../ip.json';
import './Login.css';

const address = `http://${ip.ip}:${ip.port}`;

const Register = () => {
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { register } = useAuth();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const userData = {
        login: username,
        name: name,
        password: password,
        settings: {
          img: '',
          services: {
            calendar: {
              theme: 'light',
              view: 'week'
            },
            notification: {
              sound: true,
              desktop: true
            },
            tasks: {
              sortBy: 'priority',
              groupBy: 'status'
            }
          }
        }
      };

      const result = await register(userData);
      
      if (result.success) {
        navigate('/');
      } else {
        setError(result.error || 'Ошибка при регистрации');
      }
    } catch (err) {
      setError('Произошла ошибка при попытке регистрации');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>Регистрация</h1>
        </div>
        <form onSubmit={handleRegister} className="login-form">
          {error && <div className="login-error">{error}</div>}
          <div className="form-group">
            <label htmlFor="username">Логин</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Введите логин"
              required
              disabled={isLoading}
              autoComplete="username"
            />
          </div>
          <div className="form-group">
            <label htmlFor="name">Имя</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Введите ваше имя"
              required
              disabled={isLoading}
              autoComplete="name"
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Пароль</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Введите пароль"
              required
              disabled={isLoading}
              autoComplete="new-password"
            />
          </div>
          <button 
            type="submit" 
            className="login-button"
            disabled={isLoading}
          >
            {isLoading ? 'Регистрация...' : 'Зарегистрироваться'}
          </button>
          <div className="form-footer">
            Уже есть аккаунт? <Link to="/login">Войти</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register; 