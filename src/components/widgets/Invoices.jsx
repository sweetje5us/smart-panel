import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ip from '../ip.json';
import './Invoices.css';

const Invoices = () => {
    const [invoicesData, setInvoicesData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [paymentLoading, setPaymentLoading] = useState(false);

    useEffect(() => {
        const fetchInvoices = async () => {
            try {
                const response = await axios.get(`http://${ip.ip}:${ip.port}/api/uk/invoices`);
                setInvoicesData(response.data);
                setLoading(false);
            } catch (err) {
                console.error('Ошибка при загрузке счетов:', err);
                setError('Не удалось загрузить счета');
                setLoading(false);
            }
        };

        fetchInvoices();
    }, []);

    const formatAmount = (amount) => {
        return new Intl.NumberFormat('ru-RU', {
            style: 'currency',
            currency: 'RUB'
        }).format(amount);
    };

    const handlePayment = async (invoice) => {
        if (!invoice) {
            console.error('Данные счета отсутствуют');
            return;
        }

        try {
            setPaymentLoading(true);
            
            if (invoicesData && invoicesData.paymentContext) {
                // Используем paymentContext для формирования ссылки
                const paymentUrl = `https://lk-tg.domyland.ru/pay/init?c=${encodeURIComponent(invoicesData.paymentContext)}`;
                window.open(paymentUrl, '_blank');
            } else {
                console.error('Отсутствует контекст оплаты');
            }
        } catch (err) {
            console.error('Ошибка при переходе к оплате:', err);
        } finally {
            setPaymentLoading(false);
        }
    };

    if (loading) {
        return <div className="invoices-loading">Загрузка...</div>;
    }

    if (error) {
        return <div className="invoices-error">{error}</div>;
    }

    if (!invoicesData || !invoicesData.items || invoicesData.items.length === 0) {
        return null;
    }

    return (
        <div className="invoices-container">
            {invoicesData.items.map((invoice) => (
                <div key={invoice.id} className="invoice-card">
                    <div className="invoice-content">
                        <div className="invoice-info">
                            <h3>{invoice.title}</h3>
                            <span className="invoice-amount">{formatAmount(invoice.totalSum)}</span>
                        </div>
                        <div className="invoice-actions">
                            {invoicesData.hasPaymentButton && (
                                <button 
                                    className="invoice-pay-button"
                                    onClick={() => handlePayment(invoice)}
                                    disabled={paymentLoading}
                                >
                                    {paymentLoading ? 'Загрузка...' : (invoicesData.paymentButtonTitle || 'Оплатить')}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default Invoices; 