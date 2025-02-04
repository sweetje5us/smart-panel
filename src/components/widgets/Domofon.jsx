import React, { useEffect, useRef, useState } from 'react';
import Modal from 'react-modal';

// Установите элемент приложения для доступности
Modal.setAppElement('#root'); // Предполагается, что корневой элемент имеет id="root"

const VideoStream = () => {
  const videoRef = useRef(null);
  const wsRef = useRef(null);
  const [error, setError] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const mediaSourceRef = useRef(null);
  const sourceBufferRef = useRef(null);
  const isAppending = useRef(false);
  const dataQueue = useRef([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [videoSource, setVideoSource] = useState(null);

  const userAgent = navigator.userAgent;
  const isIpad = /iPad/.test(userAgent);

  const openModal = (source) => {
    setVideoSource(source);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setError(null);
    setIsPlaying(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.src = '';
    }
  };

  useEffect(() => {
    if (!videoSource) return;
  
    if (videoSource.type === 'ws') {
      const timestamp = Math.floor(Date.now() / 1000);
      const wsUrl = `wss://live-vdk4.camera.rt.ru/stream/004acf75-a06b-4731-8949-ef801caa3412/${timestamp}.mp4?mp4-fragment-length=0.5&mp4-use-speed=0&mp4-afiller=1&token=...`;
  
      const ws = new WebSocket(wsUrl);
      ws.binaryType = 'arraybuffer';
      wsRef.current = ws;
  
      ws.onopen = () => console.log('Подключено к WebSocket серверу');
      ws.onclose = (event) => {
        console.log('Соединение закрыто', event);
        setError('Соединение закрыто: ' + event.reason);
      };
      ws.onerror = (event) => {
        console.error('Ошибка WebSocket:', event);
        setError('Ошибка WebSocket: ' + (event.message || 'Неизвестная ошибка'));
      };
  
      const mediaSource = new MediaSource();
      mediaSourceRef.current = mediaSource;
  
      // Проверяем, существует ли videoRef.current перед установкой src
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
          setError('Ошибка при добавлении SourceBuffer: ' + (e.message || 'Неизвестная ошибка'));
        }
      });
  
      return () => {
        ws.close();
        if (mediaSourceRef.current && mediaSourceRef.current.readyState === 'open') {
          mediaSourceRef.current.endOfStream();
        }
      };
    } else if (videoSource.type === 'http') {
      // Также добавьте проверку здесь
      if (videoRef.current) {
        videoRef.current.src = videoSource.url;
      }
    }
  }, [videoSource]);
  

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
      setError('Ошибка при добавлении данных в SourceBuffer: ' + (e.message || 'Неизвестная ошибка'));
    } finally {
      isAppending.current = false;
    }
  };

  const handlePlay = () => {
    if (videoRef.current && mediaSourceRef.current.readyState === 'open') {
      videoRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(err => {
        console.error('Ошибка при воспроизведении видео:', err);
        setError('Не удалось воспроизвести видео: ' + (err.message || 'Неизвестная ошибка'));
      });
    }
  };

  const alternativeVideoUrl = `https://live-vdk4.camera.rt.ru/stream/004acf75-a06b-4731-8949-ef801caa3412/${Math.floor(Date.now() / 1000)}.mp4?mp4-fragment-length=0.5&mp4-use-speed=0&mp4-afiller=1&token=...`;

  return (
    <div>
      <h1>Выберите источник видеопотока</h1>
      <button onClick={() => openModal({ type: 'http', url: alternativeVideoUrl })}>PC</button>
      <button onClick={() => openModal({ type: 'ws' })}>iPad</button>

      <Modal isOpen={isModalOpen} onRequestClose={closeModal} contentLabel="Video Stream">
        <h2>Видеопоток</h2>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <video ref={videoRef} controls style={{ width: '100%', height: 'auto' }} />
        {!isPlaying && <button onClick={handlePlay}>Play Video</button>}
        <button onClick={closeModal}>Закрыть</button>
      </Modal>
    </div>
  );
};

export default VideoStream;
