import React, { useEffect, useRef } from 'react';

const YandexMap = () => {
    const mapRef = useRef(null); // Используем useRef для хранения ссылки на карту

    useEffect(() => {
        const initMap = () => {
            if (!mapRef.current) { // Проверяем, существует ли уже карта
                mapRef.current = new window.ymaps.Map("map", {
                    center: [57.999168, 56.271461], // Устанавливаем центр карты
                    zoom: 15, // Устанавливаем уровень масштабирования
                    controls: ['zoomControl', 'typeSelector', 'searchControl', 'geolocationControl', 'trafficControl'] // Включаем элементы управления
                });

                // Создаем Placemark на указанных координатах с красным цветом
                const placemark = new window.ymaps.Placemark([57.999168, 56.271461], {
                    balloonContent: 'Вы здесь' // Изменяем содержимое балуна
                }, {
                    preset: 'islands#redIcon' // Устанавливаем красный цвет для иконки
                });

                // Добавляем Placemark на карту
                mapRef.current.geoObjects.add(placemark);

                // Устанавливаем обработчик события для изменения размеров карты
                window.addEventListener('resize', () => {
                    mapRef.current.container.fitToViewport();
                });
            }
        };

        // Проверяем, загружен ли API Яндекс.Карт
        if (window.ymaps) {
            initMap();
        } else {
            // Если API не загружен, добавляем скрипт
            const script = document.createElement('script');
            script.src = "https://api-maps.yandex.ru/2.1/?apikey=4f615c92-1ef6-4abf-adee-5ad16ccc3605&lang=ru_RU";
            script.async = true;
            script.onload = () => {
                window.ymaps.ready(initMap);
            };
            document.body.appendChild(script);
        }

        // Убираем обработчик события при размонтировании компонента
        return () => {
            window.removeEventListener('resize', () => {
                mapRef.current.container.fitToViewport();
            });
        };
    }, []);

    return (
        <div id="map" style={{ width: '100%', height: '400px', overflow: 'hidden' }}></div>
    );
};

export default YandexMap;
