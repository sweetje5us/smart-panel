import React, { useState } from 'react';
import DCOrders from './widgets/DCOrders';

const Orders = () => {
  const [hasOrders, setHasOrders] = useState(false); // Состояние для отслеживания наличия заказов

  return (
    <div>
      <h1>Ваши заказы</h1>
      <DCOrders onOrdersUpdate={setHasOrders} />
      
    </div>
  );
};

export default Orders;
