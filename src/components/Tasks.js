import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid'; // Импортируем uuid
import ip from "./ip.json";
import './KanbanBoard.css';

const address = `http://${ip.ip}:${ip.port}`;
const initialTasks = {
    Backlog: [],
    'To do': [],
    'In Progress': [],
    Done: []
};

const colors = ['#6A6DCD', '#FF5733', '#33FF57', '#3357FF', '#FF33A1', '#FFC300'];

const getRandomColor = () => {
    return colors[Math.floor(Math.random() * colors.length)];
};

const KanbanBoard = () => {
    const [tasks, setTasks] = useState(initialTasks);
    const [modalOpen, setModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [taskName, setTaskName] = useState('');
    const [assignee, setAssignee] = useState('');
    const [description, setDescription] = useState('');
    const [editingTask, setEditingTask] = useState(null);
    const kanbanId = 'unique_kanban_id';

    const fetchTasks = async () => {
        try {
            const response = await fetch(`${address}/api/tasks`);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
    
            // Создаем новый объект задач, сопоставляя с существующими задачами
            const formattedTasks = data.reduce((acc, task) => {
                if (!acc[task.status]) {
                    acc[task.status] = [];
                }
    
                // Проверяем, существует ли задача с таким же task_id
                if (!acc[task.status].some(t => t.task_id === task.task_id)) {
                    acc[task.status].push(task);
                }
    
                return acc;
            }, { ...initialTasks });
    
            // Объединяем существующие задачи с новыми, чтобы избежать дублирования
            const updatedTasks = { ...tasks };
            for (const status in formattedTasks) {
                formattedTasks[status].forEach(task => {
                    const existingTaskIndex = updatedTasks[status].findIndex(t => t.task_id === task.task_id);
                    if (existingTaskIndex === -1) {
                        updatedTasks[status].push(task); // Добавляем новую задачу
                    } else {
                        // Если задача уже существует, обновляем её данные
                        updatedTasks[status][existingTaskIndex] = task;
                    }
                });
            }
    
            // Удаляем задачи, которые отсутствуют в полученном списке
            for (const status in updatedTasks) {
                updatedTasks[status] = updatedTasks[status].filter(t => 
                    formattedTasks[status].some(ft => ft.task_id === t.task_id)
                );
            }
    
            setTasks(updatedTasks);
        } catch (error) {
            console.error('Error fetching tasks:', error);
        }
    };
    
    const handleAddTask = async () => {
        const newTask = {
            task_id: uuidv4(), // Генерация уникального id
            kanban_id: kanbanId,
            name: taskName,
            assignee: assignee,
            description: description,
            status: 'Backlog',
            backgroundColor: getRandomColor()
        };

        await fetch(`${address}/api/tasks`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newTask)
        });

        setTasks(prevTasks => ({
            ...prevTasks,
            Backlog: [...prevTasks.Backlog, newTask]
        }));
        resetTaskInputs();
    };

    const handleApplyChanges = async () => {
        const updatedTask = {
            ...editingTask,
            name: taskName,
            assignee: assignee,
            description: description
        };
    
        console.log('Updated Task:', updatedTask); // Проверьте, что task_id присутствует
    
        const requestBody = JSON.stringify(updatedTask);
        console.log('Request Body:', requestBody); // Проверьте, что JSON правильно сформирован
    
        const response = await fetch(`${address}/api/tasks`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: requestBody
        });
    
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error response:', errorText);
            throw new Error(`HTTP error! status: ${response.status}`);
        }
    
        // Обновление задач
        setTasks(prevTasks => {
            const newTasks = { ...prevTasks };
            const column = newTasks[editingTask.status];
            const taskIndex = column.findIndex(t => t.task_id === editingTask.task_id);
            if (taskIndex !== -1) {
                column[taskIndex] = updatedTask;
            }
            return newTasks;
        });
        resetTaskInputs();
    };

    const resetTaskInputs = () => {
        setTaskName('');
        setAssignee('');
        setDescription('');
        setModalOpen(false);
        setEditModalOpen(false);
    };

    const handleDrop = async (status, e) => {
        e.preventDefault();
        const taskId = e.dataTransfer.getData("text/plain");
        console.log("handleDrop вызван с статусом:", status, "и taskId:", taskId);
      
        if (!taskId) {
            console.error("taskId не найден в dataTransfer");
            return;
        }
      
        let taskToMove = null;
        let previousStatus = null;
    
        setTasks(prevTasks => {
            const newTasks = { ...prevTasks };
    
            // Поиск задачи и удаление из предыдущего статуса
            for (const key of Object.keys(newTasks)) {
                const taskIndex = newTasks[key].findIndex(task => String(task.task_id) === String(taskId));
    
                if (taskIndex !== -1) {
                    taskToMove = newTasks[key][taskIndex];
                    previousStatus = key;
                    newTasks[key].splice(taskIndex, 1); // Удаляем задачу из предыдущего статуса
                    break; // Выходим из цикла, так как задача найдена
                }
            }
    
            // Если задача была найдена, добавляем её в новый статус
            if (taskToMove) {
                const updatedTask = { ...taskToMove, status }; // Обновляем статус
                newTasks[status].push(updatedTask); // Добавляем задачу в новый статус
                
                // Отправляем PUT запрос для обновления статуса на сервере
                fetch(`${address}/api/tasks`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(updatedTask) // Отправляем обновленную задачу
                }).catch(error => console.error('Ошибка при обновлении задачи:', error));
            } else {
                console.error("Задача не найдена для перемещения:", taskId);
            }
    
            console.log("Обновленные задачи:", newTasks); // Отладка
            
            return newTasks;
        });
    };
    
    
    // Остальная часть вашего кода...
    
    
    
    
    

    const handleDragStart = (e, taskId) => {
        e.dataTransfer.setData("text/plain", taskId);
        console.log("Перетаскивание начато для taskId:", taskId); // Отладка
    };

    const handleEditTask = (task) => {
        setEditingTask(task);
        setTaskName(task.name);
        setAssignee(task.assignee);
        setDescription(task.description);
        setEditModalOpen(true);
    };

    useEffect(() => {
        fetchTasks();
        const interval = setInterval(fetchTasks, 120000);
        return () => clearInterval(interval);
    }, []);

    return (
        <>
            <h1>Kanban Board</h1>
            <div className="kanban-board">
                <div className="columns">
                    {Object.keys(tasks).map(status => (
                        <div
                            key={status}
                            className="column"
                            draggable
                            onDrop={e => handleDrop(status, e)}
                            onDragOver={e => e.preventDefault()}
                        >
                            <h2 className="column-header">{status}</h2>
                            {tasks[status].map(task => (
                                <div
                                    key={task.task_id}
                                    className="task"
                                    style={{ backgroundColor: task.backgroundColor }}
                                    draggable
                                    onDragStart={e => handleDragStart(e, task.task_id)}
                                >
                                    <h4>{task.name}</h4>
                                    <p><b>Исполнитель:</b> {task.assignee}</p>
                                    <p>Описание: {task.description}</p>
                                    <button onClick={() => handleEditTask(task)}>Редактировать</button>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
                <button onClick={() => setModalOpen(true)}>+</button>
                {modalOpen && (
                    <div className="modal">
                        <h2>Add Task</h2>
                        <input
                            type="text"
                            value={taskName}
                            onChange={e => setTaskName(e.target.value)}
                            placeholder="Название задачи"
                        />
                        <input
                            type="text"
                            value={assignee}
                            onChange={e => setAssignee(e.target.value)}
                            placeholder="Исполнитель"
                        />
                        <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="Описание задачи"
                        />
                        <button onClick={handleAddTask}>Добавить задачу</button>
                        <button onClick={() => setModalOpen(false)}>Закрыть</button>
                    </div>
                )}
                {editModalOpen && (
                    <div className="modal">
                        <h2>Edit Task</h2>
                        <input
                            type="text"
                            value={taskName}
                            onChange={e => setTaskName(e.target.value)}
                            placeholder="Название задачи"
                        />
                        <input
                            type="text"
                            value={assignee}
                            onChange={e => setAssignee(e.target.value)}
                            placeholder="Исполнитель"
                        />
                        <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="Описание задачи"
                        />
                        <button onClick={handleApplyChanges}>Применить</button>
                        <button onClick={() => {
                            if (taskName !== editingTask.name || assignee !== editingTask.assignee || description !== editingTask.description) {
                                if (window.confirm('Уверены что хотите закрыть без изменений?')) {
                                    resetTaskInputs();
                                }
                            } else {
                                resetTaskInputs();
                            }
                        }}>Закрыть</button>
                    </div>
                )}
            </div>
        </>
    );
};

export default KanbanBoard;
