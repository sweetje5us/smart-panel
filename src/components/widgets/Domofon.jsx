import React, { useState } from 'react';
import ip from '../ip.json';
import token from '../token.json';
import './DoorphoneWidget.css'; // Импортируем CSS файл для стилизации

const DoorphoneWidget = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tokenStream, setTokenStream] = useState('');
  const [key, setKey] = useState(0);
  const [loading, setLoading] = useState(false); // Состояние загрузки
  const [error, setError] = useState(null); // Состояние ошибки
  const token_rt = token.token_rostelecom; // Укажите ваш токен
  const access_token = token.token_yandex;

  const fetchVideo = () => {
    setLoading(true);
    setError(null); // Сбрасываем предыдущее состояние ошибки

    const myHeaders = new Headers();
    myHeaders.append("Authorization", `Bearer ${token_rt}`);
    myHeaders.append("Cookie", "TS01418b58=0194c94451f6d4dcdb1aaee7050bc54214a245b60e29f36c6e44ce726793a4f1a6ae715bb28ef514bb5a8980d84309f9ad49cf5afd");

    const requestOptions = {
      method: "GET",
      headers: myHeaders,
      redirect: "follow"
    };

    fetch(`http://${ip.ip}:${ip.port}/https://vc.key.rt.ru/api/v1/cameras?limit=100&offset=0`, requestOptions)
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(result => {
        const streamUrl = 'https://live-vdk4.camera.rt.ru/stream/004acf75-a06b-4731-8949-ef801caa3412/live.mp4?mp4-fragment-length=0.5&mp4-use-speed=0&mp4-afiller=1&token=' + result.data.items[1].streamer_token;
        console.log('New stream URL:', streamUrl);
        setTokenStream(streamUrl);
        setKey(prevKey => prevKey + 1); // Обновляем ключ для перерисовки компонента
      })
      .catch(error => {
        console.error('Error fetching video:', error);
        setError('Ошибка при получении видео. Пожалуйста, попробуйте позже.');
      })
      .finally(() => setLoading(false)); // Сбрасываем состояние загрузки
  };

  const handleFetch = () => {
    const myHeaders = new Headers();
    myHeaders.append("Accept", "*/*");
    myHeaders.append("Authorization", `Bearer ${access_token}`);
    myHeaders.append("Content-Length", "0");

    const requestOptions = {
      method: "POST",
      headers: myHeaders,
      redirect: "follow"
    };

    fetch(`http://${ip.ip}:${ip.port}/https://api.iot.yandex.net/v1.0/scenarios/1f5db684-471a-48e3-93c5-062a05594e08/actions`, requestOptions)
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.text();
      })
      .then(result => console.log(result))
      .catch(error => console.error('Error in handleFetch:', error));
  };

  const handleOpenDoor = (e) => {
    e.preventDefault();
    handleFetch();

    const myHeaders = new Headers();
    myHeaders.append("Authorization", token_rt);

    const requestOptions = {
      method: "POST",
      headers: myHeaders,
      redirect: "follow"
    };

    fetch("https://household.key.rt.ru/api/v2/app/devices/25575/open", requestOptions)
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.text();
      })
      .then(result => console.log('Дверь открыта'))
      .catch(error => console.error('Error opening door:', error));
  };

  const handleOpenModal = () => {
    fetchVideo();
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTokenStream(''); // Очищаем поток при закрытии модального окна
  };

  return (
    <>
    <h1>Домофон</h1>
    <div className="doorphone-container">
      <button className="button1" onClick={handleOpenModal}>Домофон</button>
      {isModalOpen && (
        <div className="modal">
          <div className="modal-content">
          <div className="header-text">3 подъезд, Центральный вход</div>
            <span className="close" onClick={handleCloseModal}>&times;</span>
            <div className="doorphone-card">
              {loading && <div>Загрузка...</div>} {/* Индикатор загрузки */}
              {error && <div style={{ color: 'red' }}>{error}</div>} {/* Сообщение об ошибке */}
              <video key={key} width="400" controls autoPlay>
                <source src={tokenStream} type="video/mp4" />
                Ваш браузер не поддерживает видеоплеер.
              </video>
              <div className="button-container">
                <button className="button"  onClick={fetchVideo}>Обновить</button>
                <button className="button"  onClick={handleOpenDoor}>Открыть дверь</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
    
  );
};

export default DoorphoneWidget;
