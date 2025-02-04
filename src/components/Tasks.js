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
    const [taskPriority, settaskPriority] = useState('');
    const [kanbanId, setkanbanId] = useState('');
    const [assignee, setAssignee] = useState('');
    const [description, setDescription] = useState('');
    const [editingTask, setEditingTask] = useState(null);

    const fetchTasks = async () => {
        try {
            const response = await fetch(`${address}/api/tasks`);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();

            const formattedTasks = data.reduce((acc, task) => {
                if (!acc[task.status]) {
                    acc[task.status] = [];
                }
                if (!acc[task.status].some(t => t.task_id === task.task_id)) {
                    acc[task.status].push(task);
                }
                return acc;
            }, { ...initialTasks });

            setTasks(formattedTasks);
        } catch (error) {
            console.error('Error fetching tasks:', error);
        }
    };

    const handleAddTask = async () => {
        console.log("kanbanId:", kanbanId); // Проверка значения kanbanId
        console.log("taskPriority:", taskPriority); // Проверка значения taskPriority
        console.log("taskName:", taskName); // Проверка значения taskName
        console.log("assignee:", assignee); // Проверка значения assignee
        console.log("description:", description); // Проверка значения description
    
        if (!taskPriority || !kanbanId) {
            alert("Пожалуйста, выберите приоритет и канбан ID.");
            return;
        }
    
        const newTask = {
            task_id: uuidv4(),
            kanban_id: kanbanId,
            name: taskName,
            assignee: assignee,
            description: description,
            status: 'Backlog',
            priority: taskPriority,
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
            priority: taskPriority,
            kanban_id: kanbanId,
            description: description
        };

        const response = await fetch(`${address}/api/tasks`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updatedTask)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error response:', errorText);
            throw new Error(`HTTP error! status: ${response.status}`);
        }

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
        settaskPriority('');
        setkanbanId('');
        setModalOpen(false);
        setEditModalOpen(false);
    };

    const handleDrop = async (status, e) => {
        e.preventDefault();
        const taskId = e.dataTransfer.getData("text/plain");

        if (!taskId) {
            console.error("taskId не найден в dataTransfer");
            return;
        }

        let taskToMove = null;

        setTasks(prevTasks => {
            const newTasks = { ...prevTasks };

            for (const key of Object.keys(newTasks)) {
                const taskIndex = newTasks[key].findIndex(task => String(task.task_id) === String(taskId));

                if (taskIndex !== -1) {
                    taskToMove = newTasks[key][taskIndex];
                    newTasks[key].splice(taskIndex, 1);
                    break;
                }
            }

            if (taskToMove) {
                const updatedTask = { ...taskToMove, status };
                newTasks[status].push(updatedTask);

                fetch(`${address}/api/tasks`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(updatedTask)
                }).catch(error => console.error('Ошибка при обновлении задачи:', error));
            } else {
                console.error("Задача не найдена для перемещения:", taskId);
            }

            return newTasks;
        });
    };

    const handleDeleteTask = async (taskId) => {
        try {
            const response = await fetch(`${address}/api/tasks/${taskId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Error deleting task:', errorText);
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            setTasks(prevTasks => {
                const updatedTasks = { ...prevTasks };
                for (const status in updatedTasks) {
                    updatedTasks[status] = updatedTasks[status].filter(task => task.task_id !== taskId);
                }
                return updatedTasks;
            });
        } catch (error) {
            console.error('Error deleting task:', error);
        }
    };

    const handleDragStart = (e, taskId) => {
        e.dataTransfer.setData("text/plain", taskId);
    };

    const handleActionSelect = (e, taskId) => {
        const action = e.target.value;

        if (action === "edit") {
            const task = Object.values(tasks).flat().find(t => t.task_id === taskId);
            if (task) {
                handleEditTask(task);
            } else {
                console.error("Task not found:", taskId);
            }
        } else if (action === "delete") {
            handleDeleteTask(taskId);
        }

        e.target.value = ""; // Сбрасываем выбор
    };

    const handleEditTask = (task) => {
        setEditingTask(task);
        setTaskName(task.name);
        setAssignee(task.assignee);
        settaskPriority(task.priority); // Используем task.priority
        setkanbanId(task.kanban_id); // Используем task.kanban_id
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
                <button onClick={() => setModalOpen(true)}>+</button>
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
                           <div key={task.task_id} className="task" style={{ backgroundColor: task.backgroundColor }} draggable onDragStart={e => handleDragStart(e, task.task_id)}>
                          <div className="task-header">
    <div className="task-name" onClick={() => handleEditTask(task)}><b>{task.name}</b></div>
    <div className="task-actions">
        <select className="task-select" onChange={(e) => handleActionSelect(e, task.task_id)} defaultValue="">
            <option value="" disabled>...</option> {/* Заменили на placeholder */}
            <option value="edit">Редактировать</option>
            <option value="delete">Удалить</option>
        </select>
        
    </div>
</div>
<div className="task-body">
    <div className="task-user"><b>Приоритет:</b> {task.priority}</div> {/* Изменено на task.priority */}
    <div className="task-user"><b>Доска:</b> {task.kanban_id}</div> {/* Изменено на task.kanban_id */}
    <div className="task-user"><b>Исполнитель:</b> {task.assignee}</div>
    <div className="task-desc"><b>Описание:</b></div>
    <div className="task-desc"> {task.description}</div>
</div>

                       </div>
                        ))}
                    </div>
                ))}
            </div>
            
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
                     <select
                        type="select"
                        value={taskPriority}
                        onChange={e => settaskPriority(e.target.value)}
                        placeholder="Приоритет"
                        
                    >
                        <option value="" disabled>-</option>
                      <option value="low">Low</option>
                      <option value="middle">Middle</option>  
                    </select>
                    <select
                        type="select"
                        value={kanbanId}
                        onChange={e => setkanbanId(e.target.value)}
                        placeholder="kanban Id"
                    >
                         <option value="" disabled>-</option>
                      <option value="Panel">Panel</option>
                      <option value="Work">Work</option>  
                    </select>
                  
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
                      <select
                        type="select"
                        value={taskPriority}
                        onChange={e => settaskPriority(e.target.value)}
                        placeholder="Приоритет"
                    >
                      <option value="low">Low</option>
                      <option value="middle">Middle</option>  
                    </select>
                    <select
                        type="select"
                        value={kanbanId}
                        onChange={e => setkanbanId(e.target.value)}
                        placeholder="kanban Id"
                    >
                      <option value="Panel">Panel</option>
                      <option value="Work">Work</option>  
                    </select>
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