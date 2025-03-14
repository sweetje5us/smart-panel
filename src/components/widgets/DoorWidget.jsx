import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import ip from '../ip.json';
import Button from '@mui/material/Button';
import doorImage from '../../images/door.jpg';
import './DoorWidget.css';

const DoorWidget = () => {
    const [camera, setCamera] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [videoLoading, setVideoLoading] = useState(false);
    const [videoError, setVideoError] = useState(false);
    const videoRef = useRef(null);
    const wsRef = useRef(null);
    const mediaSourceRef = useRef(null);
    const sourceBufferRef = useRef(null);
    const isAppending = useRef(false);
    const dataQueue = useRef([]);

    useEffect(() => {
        const fetchCamera = async () => {
            try {
                const response = await axios.get(`http://${ip.ip}:${ip.port}/api/rt/cameras/streams`);
                const centralCamera = response.data.find(cam => cam.title === "3 подъезд (Центральный вход)");
                if (centralCamera) {
                    setCamera(centralCamera);
                }
                setLoading(false);
            } catch (err) {
                console.error('Ошибка при загрузке камеры:', err);
                setError('Не удалось загрузить камеру');
                setLoading(false);
            }
        };

        fetchCamera();
    }, []);

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
            setVideoError(true);
        } finally {
            isAppending.current = false;
        }
    };

    const openWebSocket = async () => {
        try {
            const timestamp = Math.floor(Date.now() / 1000);
            const wsUrl = `wss://live-vdk4.camera.rt.ru/stream/${camera.id}/${timestamp}.mp4?mp4-fragment-length=0.5&mp4-use-speed=0&mp4-afiller=1&token=${camera.token}`;
        
            const ws = new WebSocket(wsUrl);
            ws.binaryType = 'arraybuffer';
            wsRef.current = ws;

            ws.onopen = () => {
                console.log('Подключено к WebSocket серверу');
                if (videoRef.current) {
                    videoRef.current.play().catch(error => {
                        console.error('Ошибка воспроизведения:', error);
                        setVideoError(true);
                    });
                }
            };

            ws.onclose = (event) => {
                console.log('Соединение закрыто', event);
                setVideoError(true);
            };

            ws.onerror = (event) => {
                console.error('Ошибка WebSocket:', event);
                setVideoError(true);
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
                    setVideoError(true);
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
            setVideoError(true);
        }
    };

    useEffect(() => {
        if (isModalOpen && camera) {
            openWebSocket();
            
            return () => {
                if (videoRef.current) {
                    videoRef.current.src = '';
                }
                if (wsRef.current) {
                    wsRef.current.close();
                }
                if (mediaSourceRef.current && mediaSourceRef.current.readyState === 'open') {
                    mediaSourceRef.current.endOfStream();
                }
            };
        }
    }, [isModalOpen, camera]);

    const handleOpenModal = () => {
        setIsModalOpen(true);
        setVideoLoading(true);
        setVideoError(false);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setVideoLoading(false);
        setVideoError(false);
        if (videoRef.current) {
            videoRef.current.src = '';
        }
        if (wsRef.current) {
            wsRef.current.close();
        }
        if (mediaSourceRef.current && mediaSourceRef.current.readyState === 'open') {
            mediaSourceRef.current.endOfStream();
        }
    };

    const handleVideoLoad = () => {
        setVideoLoading(false);
        setVideoError(false);
    };

    const handleVideoError = () => {
        setVideoLoading(false);
        setVideoError(true);
    };

    const openDoor = async () => {
        try {
            const response = await axios.post('https://household.key.rt.ru/api/v2/app/devices/25575/open', null, {
                headers: {
                    'Accept': 'application/json, text/plain, */*',
                    'Accept-Language': 'ru',
                    'Authorization': 'Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6InB1YmxpYzpiNGE4NjgwNC04NDhiLTQzYWQtYmY3Ny01MjI0M2MzZTNhNDEiLCJ0eXAiOiJKV1QifQ.eyJhdWQiOltdLCJjbGllbnRfaWQiOiJiV0Z6ZEdWeU9qYzRPVFUyTmpveE9USTRNRGswT2pFMk56QTZOVFV3T1RjNk16b3hOanBRUTNWWFpHRmpTV3h0VDBjcmRpdG1OekEwYzA4MVVtaGtNblpLV21reFRFNTNURkZ1UnprMk56aFpQUT09IiwiZXhwIjoxNzU2MDQ1OTU4LCJleHQiOnt9LCJpYXQiOjE3MjQ1MDk5NTgsImlzcyI6Imh0dHBzOi8vb2F1dGgyLmtleS5ydC5ydS8iLCJqdGkiOiJhNjY4YjkyMi01Y2YzLTQwNWQtOGViOS04NmE1OWU1M2ZhODkiLCJuYmYiOjE3MjQ1MDk5NTgsInNjcCI6W10sInN1YiI6ImJXRnpkR1Z5T2pjNE9UVTJOam94T1RJNE1EazBPakUyTnpBNk5UVXdPVGM2TXpveE5qcFFRM1ZYWkdGalNXeHRUMGNyZGl0bU56QTBjMDgxVW1oa01uWktXbWt4VEU1M1RGRnVSemsyTnpoWlBRPT0ifQ.nOj2EZ3ZBYdd4TPuoXPx3WZOqwYgmWBCu6go_vaB1rahvh5seseI-RlvzaiLDG8YTsCVJuUTsnNjm8xCTv6_JZyR77yE4Fk0w9l3GUP6LfsH6DYqmArP9Dk7dpkiqQAMAIv3aryee6GxsB_0vZKTJ9ud0qel46f8VsE4vl34okdUvBMpSvvIpwEwKJMoDp0oa6wVZN5k118vUURjsuIxvLd3d9fvD2izpDUkKwRKNE3tPSEAxD_huAYQLWk5zcqJh_yC8D_DSPNCzRM_9wtWebxyUVmFIILq_3KYIU7c6vVf7alea0yJlf6onK_zD-FOKytUCIa1YcYmxBQJ3RM0RHgI5KzbAOZmqzg49O4VzVNrh1sBrjPiKajmhmBZ8wIyoftBlnDeytwdTJOUDv80Tykw03FqaFAO5XaYfDPSatAP7Qti8x3M3fiJ92IFVj-e8xFdHpExCB3B8OItsh2gOkg2XWpG0n0prvfo2T-5NpKu8oRIoGOSIzvAJ-tB5PasTI1vGT1G_-mGJBHFElqBg6cIDNCIuAggBpE7xUB2nQQ1Bdm_SAzkgjTyj-dJl6s8aSfkKCoXhvmGIQWY1dF7KeL_hAkwr_vJK5e76dUfanFnqn8MO3E4YkvaIVAH-aF8nwRER-c20weP7kCTSNFg3kYFuY9qZxPLIs0OorH1Krg',
                    'Connection': 'keep-alive',
                    'Content-Length': '0',
                    'Origin': 'https://key.rt.ru',
                    'Referer': 'https://key.rt.ru/',
                    'Sec-Fetch-Dest': 'empty',
                    'Sec-Fetch-Mode': 'cors',
                    'Sec-Fetch-Site': 'same-site',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 YaBrowser/24.7.0.0 Safari/537.36',
                    'X-Request-Id': '4dd57c49-a24e-42ee-8d24-e7f9db415779',
                    'sec-ch-ua': '"Not/A)Brand";v="8", "Chromium";v="126", "YaBrowser";v="24.7", "Yowser";v="2.5"',
                    'sec-ch-ua-mobile': '?0',
                    'sec-ch-ua-platform': '"Windows"'
                },
            });

            if (response.status === 200) {
                alert('Дверь открыта! 🚪');
            } else {
                throw new Error('Не удалось открыть дверь.');
            }
        } catch (error) {
            console.error('Ошибка при открытии двери:', error);
            alert('Ошибка при открытии двери. Пожалуйста, попробуйте позже.');
        }
    };

    if (loading) {
        return <div className="door-widget-loading">Загрузка...</div>;
    }

    if (error) {
        return <div className="door-widget-error">{error}</div>;
    }

    if (!camera) {
        return <div className="door-widget-error">Камера не найдена</div>;
    }

    return (
        <>
            <div className="door-widget">
                <div className="door-widget-card">
                    <div className="door-widget-image" onClick={handleOpenModal}>
                        <img 
                            src={doorImage}
                            alt={camera.title}
                            loading="lazy"
                            width="300"
                            height="200"
                            className="door-widget-thumbnail"
                        />
                        <div className="door-widget-status" style={{ backgroundColor: camera.status.type === 'online' ? '#4CAF50' : '#f44336' }}>
                            {camera.status.title}
                        </div>
                    </div>
                    <div className="door-widget-info">
                        <h3>{camera.title}</h3>
                        <p>{camera.category.title}</p>
                        <Button 
                            variant="contained" 
                            color="primary" 
                            onClick={openDoor}
                            style={{ marginTop: '10px', width: '100%' }}
                        >
                            Открыть дверь
                        </Button>
                    </div>
                </div>
            </div>

            {isModalOpen && (
                <div className="door-modal-overlay" onClick={handleCloseModal}>
                    <div className="door-modal-content" onClick={e => e.stopPropagation()}>
                        <button className="door-modal-close" onClick={handleCloseModal}>×</button>
                        <h2>{camera.title}</h2>
                        <div className="door-video-container">
                            {videoLoading && <div className="door-video-loading">Загрузка видео...</div>}
                            {videoError && (
                                <div className="door-video-error">
                                    Ошибка загрузки видеопотока
                                </div>
                            )}
                            <video
                                ref={videoRef}
                                className="door-video-stream"
                                controls
                                playsInline
                                onLoadedData={handleVideoLoad}
                                onError={handleVideoError}
                            />
                        </div>
                        <div className="door-widget-info">
                            <p><strong>Тип:</strong> {camera.category.title}</p>
                            <p><strong>Статус:</strong> {camera.status.title}</p>
                            <Button 
                                variant="contained" 
                                color="primary" 
                                onClick={openDoor}
                                style={{ marginTop: '10px', width: '100%' }}
                            >
                                Открыть дверь
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default DoorWidget; 