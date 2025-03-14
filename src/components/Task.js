// src/components/Task.js
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ip from "./ip.json";

const address = `http://${ip.ip}:${ip.port}`;

const Task = () => {
  const { task_id } = useParams(); // Получаем task_id из параметров маршрута
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTask = async () => {
    try {
      const response = await fetch(`${address}/api/tasks/${task_id}`);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      setTask(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTask();
  }, [task_id]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div style={{
        position: 'fixed',
        top: 0,
        right: 0,
        height: '100vh',
        width: '350px',
        transition: 'transform 0.3s',
        backgroundColor: '#FFFFFF',
        boxShadow: '-2px 0 5px rgba(0,0,0,0.1)',
        overflowY: 'auto',
        transform: 'translateX(0)',
      }}>
      <div className='modal-header'>Task Details</div>
      {task ? (
        <div>
          <h2>{task.name}</h2>
          <p><strong>Description:</strong> {task.description}</p>
          <p><strong>Assignee:</strong> {task.assignee}</p>
          <p><strong>Priority:</strong> {task.priority}</p>
          <p><strong>Status:</strong> {task.status}</p>
          <p><strong>Kanban ID:</strong> {task.kanban_id}</p>
        </div>
      ) : (
        <div>No task found.</div>
      )}
    </div>
  );
};

export default Task;
