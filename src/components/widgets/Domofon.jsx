import React, { useState, useEffect } from 'react';
import ip from '../ip.json';
import token from '../token.json';

const DoorphoneWidget = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tokenStream, setTokenStream] = useState('');
  const [key, setKey] = useState(0);
  const token_rt = token.token_rostelecom; // Укажите ваш токен
  const access_token = token.token_yandex;


  const fetchVideo = () => {
    const myHeaders = new Headers();
    myHeaders.append("Authorization", `Bearer ${token_rt}`);
    myHeaders.append("Cookie", "TS01418b58=0194c94451f6d4dcdb1aaee7050bc54214a245b60e29f36c6e44ce726793a4f1a6ae715bb28ef514bb5a8980d84309f9ad49cf5afd");

    const requestOptions = {
      method: "GET",
      headers: myHeaders,
      redirect: "follow"
    };

    fetch(`http://${ip.ip}:${ip.port}/https://vc.key.rt.ru/api/v1/cameras?limit=100&offset=0`, requestOptions)
      .then(response => response.json())
      .then(result => {
        const streamUrl = 'https://live-vdk4.camera.rt.ru/stream/004acf75-a06b-4731-8949-ef801caa3412/live.mp4?mp4-fragment-length=0.5&mp4-use-speed=0&mp4-afiller=1&token=' + result.data.items[1].streamer_token;
        console.log('New stream URL:', streamUrl);
        setTokenStream(streamUrl);
        setKey(prevKey => prevKey + 1); // Обновляем ключ для перерисовки компонента
      })
      .catch(error => console.error('Error fetching video:', error));
  };
  const handleFetch = () => {
    const myHeaders = new Headers();
    myHeaders.append("Accept", "*/*");
    myHeaders.append("Accept-Language", "ru,en;q=0.9,la;q=0.8");
    myHeaders.append("Connection", "keep-alive");
    myHeaders.append("Content-Length", "0");
    myHeaders.append("Origin", "https://yandex.ru");
    myHeaders.append("Referer", "https://yandex.ru/");
    myHeaders.append("Sec-Fetch-Dest", "empty");
    myHeaders.append("Sec-Fetch-Mode", "cors");
    myHeaders.append("Sec-Fetch-Site", "same-site");
    myHeaders.append("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 YaBrowser/24.10.0.0 Safari/537.36");
    myHeaders.append("content-type", "application/json");
    myHeaders.append("sec-ch-ua", "\"Chromium\";v=\"128\", \"Not;A=Brand\";v=\"24\", \"YaBrowser\";v=\"24.10\", \"Yowser\";v=\"2.5\"");
    myHeaders.append("sec-ch-ua-arch", "\"x86\"");
    myHeaders.append("sec-ch-ua-bitness", "\"64\"");
    myHeaders.append("sec-ch-ua-full-version-list", "\"Chromium\";v=\"128.0.6613.186\", \"Not;A=Brand\";v=\"24.0.0.0\", \"YaBrowser\";v=\"24.10.4.756\", \"Yowser\";v=\"2.5\"");
    myHeaders.append("sec-ch-ua-mobile", "?0");
    myHeaders.append("sec-ch-ua-platform", "\"Windows\"");
    myHeaders.append("sec-ch-ua-platform-version", "\"15.0.0\"");
    myHeaders.append("sec-ch-ua-wow64", "?0");
    myHeaders.append("x-csrf-token", "75ad0365ba9101c61e29065e1c8125a353e25580:1733252442");
    myHeaders.append("Authorization", `Bearer ${access_token}`);
    myHeaders.append("Cookie", "_yasc=DENjToIXXwtmawzN85GtoTKloAmFJaciYfpNldGdMAYy5LWsB8IJAIHUWaE+ixuL");

    const requestOptions = {
      method: "POST",
      headers: myHeaders,
      redirect: "follow"
    };

    fetch(`http://${ip.ip}:${ip.port}/https://api.iot.yandex.net/v1.0/scenarios/1f5db684-471a-48e3-93c5-062a05594e08/actions`, requestOptions)
      .then((response) => response.text())
      .then((result) => console.log(result))
      .catch((error) => console.error(error));
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
      .then(response => response.text())
      .then(result => console.log('Дверь открыта'))
      .catch(error => console.error(error));
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
    <div>
      <button onClick={handleOpenModal}>Домофон</button>
      {isModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <span className="close" onClick={handleCloseModal}>&times;</span>
            <video key={key} width="400" controls autoPlay>
              <source src={tokenStream} type="video/mp4" />
              Ваш браузер не поддерживает видеоплеер.
            </video>
            <div>
              <button onClick={fetchVideo}>Обновить</button>
              <button onClick={handleOpenDoor}>Открыть дверь</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoorphoneWidget;
