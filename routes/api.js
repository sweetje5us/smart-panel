const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');

// Базовый маршрут для проверки
router.get('/', (req, res) => {
  res.json({ message: 'API работает' });
});

// Middleware для проверки userId
const checkUserId = (req, res, next) => {
  const userId = req.query.userId || req.body.userId;
  if (!userId) {
    return res.status(400).json({ error: 'Необходимо указать userId' });
  }
  req.userId = userId;
  next();
};

// Маршруты для уведомлений
router.get('/notifications', checkUserId, async (req, res) => {
  try {
    const { date } = req.query;
    // Здесь должна быть логика получения уведомлений из базы данных
    // Временно возвращаем пустой массив
    res.json([]);
  } catch (error) {
    console.error('Ошибка при получении уведомлений:', error);
    res.status(500).json({ error: 'Ошибка при получении уведомлений' });
  }
});

router.patch('/notifications/:id/read', checkUserId, async (req, res) => {
  try {
    const { id } = req.params;
    // Здесь должна быть логика обновления статуса уведомления
    res.json({ success: true });
  } catch (error) {
    console.error('Ошибка при обновлении уведомления:', error);
    res.status(500).json({ error: 'Ошибка при обновлении уведомления' });
  }
});

router.delete('/notifications/:id', checkUserId, async (req, res) => {
  try {
    const { id } = req.params;
    // Здесь должна быть логика удаления уведомления
    res.json({ success: true });
  } catch (error) {
    console.error('Ошибка при удалении уведомления:', error);
    res.status(500).json({ error: 'Ошибка при удалении уведомления' });
  }
});

router.delete('/notifications/source/:source', checkUserId, async (req, res) => {
  try {
    const { source } = req.params;
    // Здесь должна быть логика удаления уведомлений по источнику
    res.json({ success: true });
  } catch (error) {
    console.error('Ошибка при удалении уведомлений:', error);
    res.status(500).json({ error: 'Ошибка при удалении уведомлений' });
  }
});

// Маршрут для погоды
router.post('/weather', async (req, res) => {
  console.log('Получен запрос к /api/weather');
  console.log('Тело запроса:', req.body);
  
  try {
    console.log('Отправка запроса к API Яндекс.Погоды...');
    const response = await fetch('https://api.weather.yandex.ru/graphql/query', {
      method: 'POST',
      headers: {
        'X-Yandex-Weather-Key': process.env.REACT_APP_YANDEX_WEATHER_KEY || 'your_api_key_here',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    });

    if (!response.ok) {
      console.error(`Ошибка API Яндекс.Погоды: ${response.status}`);
      throw new Error(`Yandex Weather API responded with status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Успешно получены данные о погоде');
    res.json(data);
  } catch (error) {
    console.error('Weather API proxy error:', error);
    res.status(500).json({ error: 'Ошибка при получении данных о погоде' });
  }
});

// Экспортируем маршрутизатор
module.exports = router; 