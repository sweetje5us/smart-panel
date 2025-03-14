import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ip from '../ip.json';
import './NewsUK.css';

const NewsUK = () => {
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(0);
    const itemsPerPage = 10;

    useEffect(() => {
        const fetchNews = async () => {
            try {
                setLoading(true);
                const response = await axios.get(`http://${ip.ip}:${ip.port}/api/uk/news`, {
                    params: {
                        fromRow: page * itemsPerPage
                    }
                });

                if (response.data && response.data[0] && response.data[0].items) {
                    setNews(prevNews => [...prevNews, ...response.data[0].items]);
                } else {
                    setError('Неверный формат данных от сервера');
                }
            } catch (err) {
                console.error('Ошибка при получении новостей:', err);
                setError('Не удалось загрузить новости');
            } finally {
                setLoading(false);
            }
        };

        fetchNews();
    }, [page]);

    const formatDate = (timestamp) => {
        const date = new Date(timestamp * 1000);
        return date.toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    const handleLoadMore = () => {
        setPage(prev => prev + 1);
    };

    if (error) {
        return <div className="news-error">{error}</div>;
    }

    return (
        <div className="news-container">
            <div className="news-header">
                <h2>Новости УК</h2>
            </div>
            <div className="news-grid">
                {news.map((item) => (
                    <div key={item.id} className="news-card">
                        <div className="news-image">
                            <img 
                                src={item.image || item.previewImage || '/placeholder-news.jpg'} 
                                alt={item.title}
                                onError={(e) => {
                                    e.target.src = '/placeholder-news.jpg';
                                }}
                            />
                        </div>
                        <div className="news-content">
                            <div className="news-date">{formatDate(item.date)}</div>
                            <h3 className="news-title">{item.title}</h3>
                            <p className="news-preview">{item.preview}</p>
                            <div className="news-footer">
                                <a 
                                    href={item.shared.link} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="news-link"
                                >
                                    Подробнее
                                </a>
                                {item.isFixed && (
                                    <span className="news-fixed-badge">Закреплено</span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            {loading && <div className="news-loading">Загрузка...</div>}
            {!loading && (
                <button 
                    onClick={handleLoadMore} 
                    className="load-more-btn"
                >
                    Загрузить еще
                </button>
            )}
        </div>
    );
};

export default NewsUK;
