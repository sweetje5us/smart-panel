const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const http = require('http');
const path = require('path');
require('dotenv').config();

const apiRoutes = require('./routes/api');
const setupWebSocket = require('./config/websocket');

const hostname = '192.168.0.24';
const port = '8080';
const app = express();

// Middleware для логирования запросов
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  console.log('Headers:', req.headers);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Body:', req.body);
  }
  next();
});

const corsOptions = {
  origin: '*',
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));

// Увеличиваем лимит для JSON
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

app.use(express.static(path.join(__dirname, 'public')));

// Тестовый маршрут
app.get('/test', (req, res) => {
  res.json({ message: 'Сервер работает' });
});

// Подключаем маршруты API
console.log('Регистрируем API маршруты...');
app.use('/api', apiRoutes);
console.log('API маршруты зарегистрированы');

// Выводим все зарегистрированные маршруты
console.log('Зарегистрированные маршруты:');
function printRoutes(stack, prefix = '') {
  stack.forEach(r => {
    if (r.route && r.route.path) {
      console.log(`${Object.keys(r.route.methods).join(',')} ${prefix}${r.route.path}`);
    } else if (r.name === 'router' && r.handle.stack) {
      printRoutes(r.handle.stack, prefix + r.regexp.source.replace('\\/?(?=\\/|$)', '').replace('^\\/',''));
    }
  });
}
printRoutes(app._router.stack);

// Обработчик ошибок
app.use((err, req, res, next) => {
  console.error('Ошибка приложения:', err);
  res.status(500).json({
    error: 'Внутренняя ошибка сервера',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Обработчик для несуществующих маршрутов
app.use((req, res) => {
  console.log(`404 - Маршрут не найден: ${req.method} ${req.url}`);
  res.status(404).json({ error: 'Маршрут не найден' });
});

// Создаем HTTP сервер
const server = http.createServer(app);

// Настраиваем WebSocket
const wss = setupWebSocket(server);

// Запускаем сервер
server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}`);
  console.log(`WebSocket server running at ws://${hostname}:${port}`);
}); 