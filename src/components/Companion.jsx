import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import CompanionCat from './CompanionCat';
import CompanionPikachu from './CompanionPikachu';
import ip from "./ip.json";

const Companion = () => {
  const { user } = useAuth();
  const [companionType, setCompanionType] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Загрузка начальных настроек
  useEffect(() => {
    const fetchUserSettings = async () => {
      if (!user?.id) return;

      try {
        const response = await fetch(`http://${ip.ip}:${ip.port}/api/auth/users/${user.id}`);
        if (!response.ok) {
          throw new Error('Ошибка при получении настроек пользователя');
        }

        const userData = await response.json();
        const type = userData.settings?.services?.companion?.type || 'none';
        setCompanionType(type);
      } catch (err) {
        console.error('Ошибка при загрузке настроек компаньона:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserSettings();
  }, [user?.id]);

  // Прослушивание изменений настроек
  useEffect(() => {
    const handleSettingsChange = (event) => {
      console.log('Получено событие изменения настроек компаньона:', event.detail);
      setCompanionType(event.detail.type);
    };

    window.addEventListener('companionSettingsChanged', handleSettingsChange);

    return () => {
      window.removeEventListener('companionSettingsChanged', handleSettingsChange);
    };
  }, []);

  if (isLoading || error || !companionType || companionType === 'none') {
    return null;
  }

  switch (companionType) {
    case 'bears':
      return <CompanionCat />;
    case 'pikachu':
      return <CompanionPikachu />;
    default:
      return null;
  }
};

export default Companion; 