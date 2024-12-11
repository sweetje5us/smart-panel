import React, { useState } from 'react';

const MusicPlayer = () => {
    const [volume, setVolume] = useState(50); // Уровень громкости от 0 до 100

   

    return (
        <div style={{ width: '100%', 
            height: '100%', 
            zIndex: 9999, // Установите высокое значение
            
            top: 0, // Установите позицию сверху
            left: 0, // Установите позицию слева
            backgroundColor: 'rgba(255, 255, 255, 0.8)'  }}>
            <iframe 
                frameBorder="0" 
                allow="clipboard-write" 
                style={{ border: 'none', width: '100%', height: '600px' }} 
                src="https://music.yandex.ru/iframe/playlist/yamusic-daily/115342344" 
                title="Music Player"
            >
                Слушайте <a href='https://music.yandex.ru/users/yamusic-daily/playlists/115342344'>отдых</a> — <a href='https://music.yandex.ru/users/bryleffe'>bryleffe</a> на Яндекс Музыке
            </iframe>
           
        </div>
    );
};

export default MusicPlayer;
