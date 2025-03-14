import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import ip from '../ip.json';
import './Cameras.css';
import Button from '@mui/material/Button';
import doorImage from '../../images/door.jpg';
import door2Image from '../../images/door2.jpg';

const Cameras = () => {
    const [cameras, setCameras] = useState([]);
    const [rtCameras, setRtCameras] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedCamera, setSelectedCamera] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [videoLoading, setVideoLoading] = useState(false);
    const [videoError, setVideoError] = useState(false);
    const [streamerToken, setStreamerToken] = useState('');
    const [playbackType, setPlaybackType] = useState(null); // 'pc' или 'ipad'
    const iframeRef = useRef(null);
    const videoRef = useRef(null);
    const wsRef = useRef(null);
    const mediaSourceRef = useRef(null);
    const sourceBufferRef = useRef(null);
    const isAppending = useRef(false);
    const dataQueue = useRef([]);
    const [previewErrors, setPreviewErrors] = useState({});
    const [bufferSize, setBufferSize] = useState(0);
    const bufferRef = useRef(new Uint8Array(0));
    const isFirstChunk = useRef(true);

    const sortCameras = (cameras) => {
        return cameras.sort((a, b) => {
            // Сначала проверяем, является ли камера одной из двух главных
            if (a.title === "3 подъезд (Центральный вход)") return -1;
            if (b.title === "3 подъезд (Центральный вход)") return 1;
            if (a.title === "3 подъезд (Вход со двора)") return -1;
            if (b.title === "3 подъезд (Вход со двора)") return 1;
            
            // Затем проверяем, начинается ли название с "3 подъезд"
            const aIsThird = a.title.startsWith("3 подъезд");
            const bIsThird = b.title.startsWith("3 подъезд");
            if (aIsThird && !bIsThird) return -1;
            if (!aIsThird && bIsThird) return 1;
            
            // В остальных случаях сортируем по алфавиту
            return a.title.localeCompare(b.title);
        });
    };

    useEffect(() => {
        const fetchCameras = async () => {
            try {
                const [ukResponse, rtResponse] = await Promise.all([
                    axios.get(`http://${ip.ip}:${ip.port}/api/uk/cameras`),
                    axios.get(`http://${ip.ip}:${ip.port}/api/rt/cameras/streams`)
                ]);

                if (ukResponse.data && ukResponse.data.items) {
                    setCameras(sortCameras(ukResponse.data.items));
                }
                if (rtResponse.data) {
                    console.log('RT камеры:', rtResponse.data.map(cam => cam.title));
                    setRtCameras(sortCameras(rtResponse.data));
                }
                setLoading(false);
            } catch (err) {
                console.error('Ошибка при загрузке камер:', err);
                setError('Не удалось загрузить список камер');
                setLoading(false);
            }
        };

        fetchCameras();
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

    const openWebSocket = async (camera) => {
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
        if (selectedCamera && selectedCamera.isRtCamera) {
            openWebSocket(selectedCamera);
            
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
    }, [selectedCamera]);

    const isIPad = () => {
        const userAgent = navigator.userAgent.toLowerCase();
        return /ipad/i.test(userAgent);
    };

    const handleCameraClick = async (camera, isRtCamera = false) => {
        try {
            setSelectedCamera({
                ...camera,
                isRtCamera,
                streamURL: isRtCamera ? camera.url : camera.streamURL,
                title: camera.title,
                ipCameraStatusTitle: isRtCamera ? camera.status.title : camera.ipCameraStatusTitle,
                ipCameraTypeTitle: isRtCamera ? camera.category.title : camera.ipCameraTypeTitle,
                ipCameraStatusColor: isRtCamera ? (camera.status.type === 'online' ? '#4CAF50' : '#f44336') : camera.ipCameraStatusColor
            });
            setIsModalOpen(true);
            setVideoLoading(true);
            setVideoError(false);
        } catch (error) {
            console.error('Ошибка при открытии камеры:', error);
            setVideoError(true);
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedCamera(null);
        setVideoLoading(false);
        setVideoError(false);
        if (iframeRef.current) {
            iframeRef.current.src = '';
        }
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

    const handleIframeLoad = () => {
        setVideoLoading(false);
        setVideoError(false);
    };

    const handleIframeError = () => {
        setVideoLoading(false);
        setVideoError(true);
    };

    const handleVideoLoad = () => {
        setVideoLoading(false);
        setVideoError(false);
    };

    const handleVideoError = () => {
        setVideoLoading(false);
        setVideoError(true);
    };

    const isHLSStream = (url) => {
        return url.includes('service.hd59.ru') || url.endsWith('.m3u8');
    };

    const handlePreviewError = (cameraId) => {
        setPreviewErrors(prev => ({
            ...prev,
            [cameraId]: true
        }));
    };

    const renderCameraPreview = (camera, isRtCamera = false) => {
        if (camera.title === "3 подъезд (Центральный вход)") {
            return (
                <img 
                    src={doorImage}
                    alt={camera.title}
                    loading="lazy"
                    width="300"
                    height="200"
                    className="camera-thumbnail"
                />
            );
        }

        if (camera.title === "3 подъезд (Вход со двора)") {
            return (
                <img 
                    src={door2Image}
                    alt={camera.title}
                    loading="lazy"
                    width="300"
                    height="200"
                    className="camera-thumbnail"
                />
            );
        }

        if (isRtCamera) {
            return previewErrors[camera.id] ? (
                <div className="camera-preview-placeholder">
                    <span>Нет превью</span>
                </div>
            ) : (
                <img 
                    src={`https://live-vdk4.camera.rt.ru/stream/${camera.id}/snapshot.jpg?token=${camera.token}`}
                    alt={camera.title}
                    loading="lazy"
                    width="300"
                    height="200"
                    className="camera-thumbnail"
                    onError={() => handlePreviewError(camera.id)}
                />
            );
        } else {
            return (
                <img 
                    src={camera.image}
                    alt={camera.title}
                    loading="lazy"
                    width="300"
                    height="200"
                    className="camera-thumbnail"
                />
            );
        }
    };

    const renderVideoContent = () => {
        if (!selectedCamera) return null;

        if (selectedCamera.isRtCamera) {
            return (
                <video
                    ref={videoRef}
                    className="video-stream"
                    controls
                    playsInline
                    onLoadedData={handleVideoLoad}
                    onError={handleVideoError}
                />
            );
        }

        if (isHLSStream(selectedCamera.streamURL)) {
            return (
                <iframe
                    ref={iframeRef}
                    src={selectedCamera.streamURL}
                    className="video-stream"
                    onLoad={handleIframeLoad}
                    onError={handleIframeError}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                />
            );
        } else {
            return (
                <img 
                    src={selectedCamera.streamURL}
                    alt={selectedCamera.title}
                    className="stream-image"
                    onLoad={handleIframeLoad}
                    onError={handleIframeError}
                />
            );
        }
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
        return <div className="cameras-loading">Загрузка...</div>;
    }

    if (error) {
        return <div className="cameras-error">{error}</div>;
    }

    return (
        <div className="cameras-container">
            <div className="cameras-grid">
                {rtCameras.map((camera) => (
                    <div 
                        key={camera.id} 
                        className="camera-card"
                        onClick={() => handleCameraClick(camera, true)}
                    >
                        <div className="camera-image">
                            {renderCameraPreview(camera, true)}
                            <div className="camera-status" style={{ backgroundColor: camera.status.type === 'online' ? '#4CAF50' : '#f44336' }}>
                                {camera.status.title}
                            </div>
                        </div>
                        <div className="camera-info">
                            <h3>{camera.title}</h3>
                            <p>{camera.category.title}</p>
                            {camera.title === "3 подъезд (Центральный вход)" && (
                                <Button 
                                    variant="contained" 
                                    color="primary" 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        openDoor();
                                    }}
                                    style={{ marginTop: '10px' }}
                                >
                                    Открыть дверь
                                </Button>
                            )}
                        </div>
                    </div>
                ))}
                {cameras.map((camera) => (
                    <div 
                        key={camera.id} 
                        className="camera-card"
                        onClick={() => handleCameraClick(camera)}
                    >
                        <div className="camera-image">
                            {renderCameraPreview(camera)}
                            <div className="camera-status" style={{ backgroundColor: camera.ipCameraStatusColor }}>
                                {camera.ipCameraStatusTitle}
                            </div>
                        </div>
                        <div className="camera-info">
                            <h3>{camera.title}</h3>
                            <p>{camera.ipCameraTypeTitle}</p>
                        </div>
                    </div>
                ))}
            </div>

            {isModalOpen && selectedCamera && (
                <div className="modal-overlay" onClick={handleCloseModal}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <button className="modal-close" onClick={handleCloseModal}>×</button>
                        <h2>{selectedCamera.title}</h2>
                        <div className="video-container">
                            {videoLoading && <div className="video-loading">Загрузка видео...</div>}
                            {videoError && (
                                <div className="video-error">
                                    Ошибка загрузки видеопотока
                                </div>
                            )}
                            {renderVideoContent()}
                        </div>
                        <div className="camera-details">
                            <p><strong>Тип:</strong> {selectedCamera.ipCameraTypeTitle}</p>
                            <p><strong>Статус:</strong> {selectedCamera.ipCameraStatusTitle}</p>
                            {!selectedCamera.isRtCamera && selectedCamera.hasArchive && <p><strong>Доступен архив</strong></p>}
                            {selectedCamera.title === "3 подъезд (Центральный вход)" && (
                                <Button 
                                    variant="contained" 
                                    color="primary" 
                                    onClick={openDoor}
                                    style={{ marginTop: '10px' }}
                                >
                                    Открыть дверь
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Cameras; 