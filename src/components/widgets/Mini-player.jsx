import React, { useEffect, useState, useRef } from 'react';
import ip from '../ip.json'
const address = `http://${ip.ip}:${ip.port}`

const AudioPlayer = () => {
    const [tracks, setTracks] = useState([]);
    const [currentTrack, setCurrentTrack] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef(new Audio());

    useEffect(() => {
        const fetchTracks = async () => {
            try {
                const response = await fetch(`${address}/https://music.yandex.ru/handlers/playlist.jsx?external-domain=music.yandex.ru&overembed=false&lang=ru&kinds=1056&owner=bryleffe&pageSize=100&pageNumber=0`, {
                    method: 'GET',
                    headers: {
                        'accept': 'application/json, text/plain, */*',
                        'accept-language': 'ru,en;q=0.9,la;q=0.8',
                        'referer': 'https://music.yandex.ru/iframe/playlist/bryleffe/1056',
                        'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Safari/605.1.15',
                    },
                });
                const data = await response.json();
                setTracks(data.playlist.tracks || []); // Извлекаем треки из ответа
            } catch (error) {
                console.error('Ошибка при получении треков:', error);
            }
        };

        fetchTracks();
    }, []);

    const playTrack = async (track) => {
        if (currentTrack) {
            audioRef.current.pause();
        }
    
        // Construct the audio URL using the track details
        const audioUrl = `https://s160iva.storage.yandex.net/get-mp3/${track.id}/...`; // Replace '...' with the appropriate path segment
    
        // Set the audio source
        audioRef.current.src = audioUrl;
    
        // Attempt to play the audio
        try {
            await audioRef.current.play();
            setCurrentTrack(track);
            setIsPlaying(true);
        } catch (error) {
            console.error('Ошибка при воспроизведении трека:', error);
            alert('Не удалось воспроизвести трек. Пожалуйста, проверьте соединение.');
        }
    };
    

    const handlePlayPause = () => {
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    const handleNext = () => {
        const currentIndex = tracks.findIndex(t => t.id === currentTrack.id);
        const nextIndex = (currentIndex + 1) % tracks.length;
        playTrack(tracks[nextIndex]);
    };

    const handlePrev = () => {
        const currentIndex = tracks.findIndex(t => t.id === currentTrack.id);
        const prevIndex = (currentIndex - 1 + tracks.length) % tracks.length;
        playTrack(tracks[prevIndex]);
    };

    return (
        <div>
            <h1>Аудиоплеер</h1>
            {currentTrack && (
                <div>
                    <h2>Сейчас играет:</h2>
                    <p>Исполнитель: {currentTrack.artists[0].name}</p>
                    <p>Название: {currentTrack.title}</p>
                </div>
            )}
            <div>
                <button onClick={handlePrev}>Назад</button>
                <button onClick={handlePlayPause}>{isPlaying ? 'Пауза' : 'Играть'}</button>
                <button onClick={handleNext}>Вперед</button>
            </div>
            <ul>
                {tracks.map(track => (
                    <li key={track.id}>
                        {track.title} - {track.artists[0].name}
                        <button onClick={() => playTrack(track)}>Играть</button>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default AudioPlayer;
