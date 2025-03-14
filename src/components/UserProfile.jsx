import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import ip from '../ip.json';
import './UserProfile.css';

const address = `http://${ip.ip}:${ip.port}`;

const UserProfile = () => {
  const { user } = useAuth();
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);

  useEffect(() => {
    loadUserData();
  }, [user?.id]);

  const loadUserData = async () => {
    if (!user?.id) return;
    
    try {
      const response = await fetch(`${address}/api/auth/users/${user.id}`);
      const result = await response.json();
      
      if (response.ok) {
        setUserData(result);
        setAvatarPreview(result.settings?.img || null);
      } else {
        setError('Ошибка при загрузке данных пользователя');
      }
    } catch (err) {
      setError('Произошла ошибка при загрузке данных');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${address}/api/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: userData.name,
          settings: {
            ...userData.settings,
            img: avatarPreview
          }
        })
      });

      const result = await response.json();

      if (response.ok) {
        setSuccess('Данные успешно обновлены');
        setIsEditing(false);
        loadUserData(); // Перезагружаем данные
      } else {
        setError(result.error || 'Ошибка при обновлении данных');
      }
    } catch (err) {
      setError('Произошла ошибка при обновлении данных');
    }
  };

  const compressImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Устанавливаем максимальные размеры
          const maxWidth = 200;
          const maxHeight = 200;
          
          // Вычисляем новые размеры с сохранением пропорций
          let width = img.width;
          let height = img.height;
          
          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          // Рисуем изображение с новыми размерами
          ctx.drawImage(img, 0, 0, width, height);
          
          // Конвертируем в JPEG с качеством 0.7
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
          resolve(compressedDataUrl);
        };
        
        img.onerror = (error) => reject(error);
      };
      
      reader.onerror = (error) => reject(error);
    });
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const compressedImage = await compressImage(file);
        setAvatarPreview(compressedImage);
      } catch (err) {
        setError('Ошибка при обработке изображения');
      }
    }
  };

  const handleNameChange = (e) => {
    setUserData(prev => ({
      ...prev,
      name: e.target.value
    }));
  };

  const handleCancel = () => {
    setIsEditing(false);
    loadUserData(); // Загружаем исходные данные
  };

  if (isLoading) {
    return <div className="profile-loading">Загрузка...</div>;
  }

  if (!userData) {
    return <div className="profile-error">Не удалось загрузить данные пользователя</div>;
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>Профиль пользователя</h1>
        <div className="profile-info">
          <div className="avatar-section">
            <div className="avatar-preview">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Аватар пользователя" />
              ) : (
                <div className="avatar-placeholder">
                  {userData.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            {isEditing && (
              <label className="avatar-upload">
                Изменить аватар
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  style={{ display: 'none' }}
                />
              </label>
            )}
          </div>
          <div className="user-info">
            <div className="form-group">
              <label htmlFor="name">Имя</label>
              <input
                type="text"
                id="name"
                value={userData.name}
                onChange={handleNameChange}
                disabled={!isEditing}
                className="name-input"
              />
            </div>
            <p className="login-info"><strong>Логин:</strong> {userData.login}</p>
          </div>
        </div>
      </div>

      {error && <div className="profile-error">{error}</div>}
      {success && <div className="profile-success">{success}</div>}

      <div className="profile-actions">
        {!isEditing ? (
          <button
            type="button"
            className="edit-button"
            onClick={() => setIsEditing(true)}
          >
            Редактировать
          </button>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="profile-form">
              <button type="submit" className="save-button">
                Сохранить
              </button>
            </form>
            <button
              type="button"
              className="cancel-button"
              onClick={handleCancel}
            >
              Отмена
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default UserProfile; 