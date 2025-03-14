import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import ip from "../ip.json";
import { useNotifications } from '../../contexts/NotificationContext';
import NotificationService from '../../services/NotificationService';
import './TasksWidget.css';

const address = `http://${ip.ip}:${ip.port}`;

const TasksWidget = () => {
    const { updateNotificationCount } = useNotifications();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [previousTasks, setPreviousTasks] = useState([]);
    const [isFirstLoad, setIsFirstLoad] = useState(true);
    
    // Получаем текущего пользователя из localStorage
    const currentUser = JSON.parse(localStorage.getItem('user')) || {};
    const currentUserName = currentUser.name || '';

    // Отправка уведомления через API
    const sendNotificationToAPI = async (title, taskId) => {
        try {
            const currentDate = new Date();
            const formattedDate = currentDate.toISOString().split('T')[0];
            const formattedTime = currentDate.toTimeString().split(' ')[0].substring(0, 5);
            const taskLink = taskId ? `http://${address}/tasks/${taskId}` : `http://${address}/tasks`;
            
            await NotificationService.createNotification({
                title: title,
                message: title,
                type: 'info',
                source: 'tasks',
                date: formattedDate,
                time: formattedTime,
                link: taskLink
            });
            
            // Обновляем счетчик уведомлений
            updateNotificationCount();
        } catch (error) {
            console.error('Ошибка при отправке уведомления:', error);
        }
    };

    // Проверка новых задач
    const checkNewTasks = (newTasks) => {
        // Пропускаем проверку при первой загрузке
        if (isFirstLoad) {
            setIsFirstLoad(false);
            setPreviousTasks(newTasks);
            return;
        }

        // Проверяем новые задачи
        const newAssignedTasks = newTasks.filter(task => {
            // Проверяем, является ли задача новой
            const isNewTask = !previousTasks.some(prevTask => prevTask.task_id === task.task_id);
            // Проверяем, назначена ли задача текущему пользователю
            const isAssignedToCurrentUser = task.assignee === currentUserName;
            
            return isNewTask && isAssignedToCurrentUser;
        });

        // Отправляем уведомления о новых задачах
        newAssignedTasks.forEach(task => {
            const title = `Новая задача: ${task.name}`;
            sendNotificationToAPI(title, task.task_id);
        });

        // Обновляем список предыдущих задач
        setPreviousTasks(newTasks);
    };

    const getPriorityIcon = (priority) => {
        switch (priority) {
            case 'Critical':
                return '🔴';
            case 'High':
                return '🟠';
            case 'Medium':
                return '🟡';
            case 'Low':
                return '🟢';
            case 'Blocked':
                return '⚫';
            default:
                return '⚪';
        }
    };

    const fetchTasks = async () => {
        try {
            const response = await fetch(`${address}/api/tasks`);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            
            // Преобразуем объект задач в массив и фильтруем
            const allTasks = Array.isArray(data) ? data : Object.values(data).flat();
            
            // Фильтруем задачи по имени текущего пользователя
            const userTasks = allTasks.filter(task => 
                (task.status === 'To do' || task.status === 'In Progress') &&
                task.assignee === currentUserName
            );
            
            // Сортируем задачи по приоритету
            const sortedTasks = userTasks.sort((a, b) => {
                const priorityOrder = {
                    'Blocked': 0,
                    'Critical': 1,
                    'High': 2,
                    'Medium': 3,
                    'Low': 4
                };
                return priorityOrder[a.priority] - priorityOrder[b.priority];
            });
            
            checkNewTasks(sortedTasks);
            setTasks(sortedTasks);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching tasks:', error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTasks();
        // Обновляем задачи каждые 2 минуты
        const interval = setInterval(fetchTasks, 120000);
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <div className="tasks-widget">
                <div className="tasks-widget-header">
                    <h2>Мои задачи</h2>
                </div>
                <div className="tasks-widget-content loading">
                    Загрузка...
                </div>
            </div>
        );
    }

    return (
        <div className="tasks-widget">
            <div className="tasks-widget-header">
                <h2>Мои задачи</h2>
                <Link to="/tasks" className="view-all-link">
                    Все задачи
                </Link>
            </div>
            <div className="tasks-widget-content">
                {tasks.length === 0 ? (
                    <div className="no-tasks">
                        Нет активных задач
                    </div>
                ) : (
                    <div className="tasks-list">
                        {tasks.map(task => (
                            <Link to={`/tasks/${task.task_id}`} key={task.task_id} className="task-item">
                                <div className="task-item-header">
                                    <span className="task-priority">
                                        {getPriorityIcon(task.priority)}
                                    </span>
                                    <span className="task-status" data-status={task.status}>
                                        {task.status === 'To do' ? 'К выполнению' : 'В работе'}
                                    </span>
                                </div>
                                <div className="task-item-title">
                                    {task.name}
                                </div>
                                {task.description && (
                                    <div className="task-item-description">
                                        {task.description}
                                    </div>
                                )}
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TasksWidget;