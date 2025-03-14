import React, { useEffect, useRef } from 'react';

const YandexMap = () => {
    const mapRef = useRef(null);
    const containerRef = useRef(null);

    useEffect(() => {
        const initMap = () => {
            if (!mapRef.current && containerRef.current) {
                mapRef.current = new window.ymaps.Map(containerRef.current, {
                    center: [57.999168, 56.271461],
                    zoom: 15,
                    controls: ['zoomControl', 'typeSelector', 'searchControl', 'geolocationControl', 'trafficControl']
                });

                const placemark = new window.ymaps.Placemark([57.999168, 56.271461], {
                    balloonContent: 'Вы здесь'
                }, {
                    preset: 'islands#redIcon'
                });

                mapRef.current.geoObjects.add(placemark);

                const handleResize = () => {
                    if (mapRef.current) {
                        mapRef.current.container.fitToViewport();
                    }
                };

                window.addEventListener('resize', handleResize);
                return () => window.removeEventListener('resize', handleResize);
            }
        };

        if (window.ymaps && containerRef.current) {
            window.ymaps.ready(initMap);
        }
    }, []);

    return <div ref={containerRef} id="map" style={{ width: '100%', height: '400px' }} />;
};

export default YandexMap;
