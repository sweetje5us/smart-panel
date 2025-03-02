import React, { useState, useRef } from 'react';
import axios from 'axios';
import Modal from 'react-modal';
import ReactPlayer from 'react-player';
import Button from '@mui/material/Button';

import ip from '../ip.json';


// Устанавливаем элемент для модального окна
Modal.setAppElement('#root');



const getToken = async () => {
  try {
    const response = await axios.get(`http://${ip.ip}:${ip.port}/api/streamertoken`, {
      
    });

    // Извлекаем токен из ответа
    const streamerToken = response.data.token;
    console.log('Полученный токен:', streamerToken);
    
    // Возвращаем токен для дальнейшего использования
    return streamerToken;
  } catch (error) {
    console.error('Ошибка при получении токена:', error);
    throw error; // Пробрасываем ошибку дальше
  }
};

// Стили для модального окна
const customStyles = {
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    transform: 'translate(-50%, -50%)',
    width: '80%', // Ширина модального окна
    maxWidth: '600px', // Максимальная ширина
    padding: '20px', // Отступы внутри модального окна
  },
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.75)', // Полупрозрачный фон
  },
};

const KanbanWidget = () => {
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [source, setSource] = useState('iPad');
  const [videoUrl, setVideoUrl] = useState('');
  const [streamerToken, setStreamerToken] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const videoRef = useRef(null);
  const wsRef = useRef(null);
  const mediaSourceRef = useRef(null);
  const sourceBufferRef = useRef(null);
  const isAppending = useRef(false);
  const dataQueue = useRef([]);

  const appendData = (data) => {
    if (data.byteLength === 0) return;
  
    if (isAppending.current) {
      dataQueue.current.push(data);
      return;
    }
  
    isAppending.current = true;
  
    if (!sourceBufferRef.current || sourceBufferRef.current.updating || mediaSourceRef.current.readyState !== 'open') {
      dataQueue.current.push(data);
      isAppending.current = false;
      return;
    }
  
    try {
      
      sourceBufferRef.current.appendBuffer(data);
    } catch (e) {
      console.error('Ошибка при добавлении данных в SourceBuffer:', e);
      setErrorMessage('Ошибка при добавлении данных в SourceBuffer: ' + (e.message || 'Неизвестная ошибка'));
    } finally {
      isAppending.current = false;
    }
  };
  
  
  const openWebSocket = async () => {
    try {
      const token = await getToken(); // Получаем токен
      setStreamerToken(token);
      const wsUrl = `wss://live-vdk4.camera.rt.ru/stream/004acf75-a06b-4731-8949-ef801caa3412/${Math.floor(Date.now() / 1000)}.mp4?mp4-fragment-length=0.5&mp4-use-speed=0&mp4-afiller=1&token=${token}`;
  
      const ws = new WebSocket(wsUrl);
      ws.binaryType = 'arraybuffer';
      wsRef.current = ws;
  
      ws.onopen = () => {
        console.log('Подключено к WebSocket серверу');
        // Начинаем воспроизведение видео
        if (videoRef.current) {
          videoRef.current.play();
        }
      };
  
      ws.onclose = (event) => {
        console.log('Соединение закрыто', event);
        setErrorMessage('Соединение закрыто: ' + event.reason);
      };
  
      ws.onerror = (event) => {
        console.error('Ошибка WebSocket:', event);
        setErrorMessage('Ошибка WebSocket: ' + JSON.stringify(event));;
      };
  
      const mediaSource = new MediaSource();
      mediaSourceRef.current = mediaSource;
  
      if (videoRef.current) {
        videoRef.current.src = URL.createObjectURL(mediaSource);
      }
  
      mediaSource.addEventListener('sourceopen', () => {
        try {
          const sourceBuffer = mediaSource.addSourceBuffer('video/mp4; codecs="avc1.42E01E, mp4a.40.2"');
          sourceBufferRef.current = sourceBuffer;
  
          sourceBuffer.addEventListener('updateend', () => {
            isAppending.current = false;
            if (dataQueue.current.length > 0) {
              appendData(dataQueue.current.shift());
            }
          });
  
          ws.onmessage = (event) => {
           
            const byteArray = new Uint8Array(event.data);

  appendData(byteArray);
          };
  
        } catch (e) {
          console.error('Ошибка при добавлении SourceBuffer:', e);
          setErrorMessage('Ошибка при добавлении SourceBuffer: ' + (e.message || 'Неизвестная ошибка'));
        }
      });
  
      return () => {
        ws.close();
        if (mediaSourceRef.current && mediaSourceRef.current.readyState === 'open') {
          mediaSourceRef.current.endOfStream();
        }
      };
    } catch (error) {
      console.error('Ошибка при открытии WebSocket:', error);
      setErrorMessage('Ошибка при открытии WebSocket: ' + (error.message || 'Неизвестная ошибка'));
    }
  };

  const timestamp = Math.floor(Date.now() / 1000);

  const toggleSource = () => {
    if (source === 'PC') {
      setSource('iPad');
      setVideoUrl(`wss://live-vdk4.camera.rt.ru/stream/004acf75-a06b-4731-8949-ef801caa3412/${timestamp}.mp4?mp4-fragment-length=0.5&mp4-use-speed=0&mp4-afiller=1&token=${streamerToken}`);
      openWebSocket(); // URL для iPad
    } else {
      setSource('PC');
      setVideoUrl(`https://live-vdk4.camera.rt.ru/stream/004acf75-a06b-4731-8949-ef801caa3412/live.mp4?mp4-fragment-length=0.5&mp4-use-speed=0&mp4-afiller=1&token=${streamerToken}`);
      if (videoRef.current) {
        videoRef.current.src = videoUrl; // Устанавливаем HTTP URL для PC
      }
    }
  };

  const openModal = async () => {
    try {
      console.log('Попытка получить токен...');
      const token = await getToken();
      console.log('Полученный токен:', token);
      
      if (!token) {
        throw new Error('Не удалось получить токен.');
      }
  
      setStreamerToken(token);
      setVideoUrl(`https://live-vdk4.camera.rt.ru/stream/004acf75-a06b-4731-8949-ef801caa3412/live.mp4?mp4-fragment-length=0.5&mp4-use-speed=0&mp4-afiller=1&token=${token}`);
      setModalIsOpen(true);
      if (source === 'iPad') {
        openWebSocket();
      }
    } catch (error) {
      console.error('Не удалось открыть модальное окно:', error.message);
      alert('Ошибка при получении токена. Пожалуйста, проверьте свои учетные данные.');
    }
  };

  const closeModal = () => setModalIsOpen(false);


  const openDoor = async () => {
    try {
      const response = await axios.post('https://household.key.rt.ru/api/v2/app/devices/25575/open', null, {
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'ru',
          'Authorization': 'Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6InB1YmxpYzpiNGE4NjgwNC04NDhiLTQzYWQtYmY3Ny01MjI0M2MzZTNhNDEiLCJ0eXAiOiJKV1QifQ.eyJhdWQiOltdLCJjbGllbnRfaWQiOiJiV0Z6ZEdWeU9qYzRPVFUyTmpveE9USTRNRGswT2pFMk56QTZOVFV3T1RjNk16b3hOanBRUTNWWFpHRmpTV3h0VDBjcmRpdG1OekEwYzA4MVVtaGtNblpLV21reFRFNTNURkZ1UnprMk56aFpQUT09IiwiZXhwIjoxNzU2MDQ1OTU4LCJleHQiOnt9LCJpYXQiOjE3MjQ1MDk5NTgsImlzcyI6Imh0dHBzOi8vb2F1dGgyLmtleS5ydC5ydS8iLCJqdGkiOiJhNjY4YjkyMi01Y2YzLTQwNWQtOGViOS04NmE1OWU1M2ZhODkiLCJuYmYiOjE3MjQ1MDk5NTgsInNjcCI6W10sInN1YiI6ImJXRnpkR1Z5T2pjNE9UVTJOam94T1RJNE1EazBPakUyTnpBNk5UVXdPVGM2TXpveE5qcFFRM1ZYWkdGalNXeHRUMGNyZGl0bU56QTBjMDgxVW1oa01uWktXbWt4VEU1M1RGRnVSemsyTnpoWlBRPT0ifQ.nOj2EZ3ZBYdd4TPuoXPx3WZOqwYgmWBCu6go_vaB1rahvh5seseI-RlvzaiLDG8YTsCVJuUTsnNjm8xCTv6_JZyR77yE4Fk0w9l3GUP6LfsH6DYqmArP9Dk7dpkiqQAMAIv3aryee6GxsB_0vZKTJ9ud0qel46f8VsE4vl34okdUvBMpSvvIpwEwKJMoDp0oa6wVZN5k118vUURjsuIxvLd3d9fvD2izpDUkKwRKNE3tPSEAxD_huAYQLWk5zcqJh_yC8D_DSPNCzRM_9wtWebxyUVmFIILq_3KYIU7c6vVf7alea0yJlf6onK_zD-FOKytUCIa1YcYmxBQJ3RM0RHgI5KzbAOZmqzg49O4VzVNrh1sBrjPiKajmhmBZ8wIyoftBlnDeytwdTJOUDv80Tykw03FqaFAO5XaYfDPSatAP7Qti8x3M3fiJ92IFVj-e8xFdHpExCB3B8OItsh2gOkg2XWpG0n0prvfo2T-5NpKu8oRIoGOSIzvAJ-tB5PasTI1vGT1G_-mGJBHFElqBg6cIDNCIuAggBpE7xUB2nQQ1Bdm_SAzkgjTyj-dJl6s8aSfkKCoXhvmGIQWY1dF7KeL_hAkwr_vJK5e76dUfanFnqn8MO3E4YkvaIVAH-aF8nwRER-c20weP7kCTSNFg3kYFuY9qZxPLIs0OorH1Krg', // Замените на ваш токен
          'Content-Length': '0',
        },
      });

      if (response.status === 200) {
        alert('Дверь открыта! 🚪');
      } else {
        throw new Error('Не удалось открыть дверь.');
      }
    } catch (error) {
      console.error('Ошибка при открытии двери:', error);
      setErrorMessage('Ошибка при открытии двери: ' + (error.message || 'Неизвестная ошибка'));
    }
  };

  return (
    <div>
      <Button  aria-haspopup="true"
      
      variant="contained"
      disableElevation onClick={openModal}>Открыть видеодомофон</Button>
      
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        contentLabel="Модальное окно"
        style={customStyles} // Применяем кастомные стили
      >
        <h2>Видеоплеер</h2>
        <video ref={videoRef} controls style={{ width: '100%', height: 'auto' }} />
        
        <Button   id="demo-customized-button"
     
        aria-haspopup="true"
      
        variant="contained"
        disableElevation onClick={openDoor}>Открыть дверь</Button>
        <Button  aria-haspopup="true"
      
      variant="contained"
      disableElevation onClick={closeModal}>Закрыть</Button>
      </Modal>
    </div>
  );
};

export default KanbanWidget;