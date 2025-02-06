import React, { useState, useEffect, useCallback  } from 'react';
import { v4 as uuidv4 } from 'uuid';
import ip from "./ip.json";
import './KanbanBoard.css';


const address = `http://${ip.ip}:${ip.port}`;
const initialTasks = {
    Backlog: [],
    'To do': [],
    'In Progress': [],
    Done: []
};

const colors = ['#FFFFFF'];

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
    const [selectedTask, setSelectedTask] = useState(null);
    const [taskStatus, settaskStatus] = useState('');

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
    const handleTaskClick = (task) => {
        setEditingTask(task);
        setTaskName(task.name);
        setAssignee(task.assignee);
        settaskPriority(task.priority);
        setkanbanId(task.kanban_id);
        setDescription(task.description);
        settaskStatus(task.status);
        setEditModalOpen(true);
        setSelectedTask(task);
    };
    
    const handleAddTask = async () => {
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
        try {
            const updatedTask = {
                ...editingTask,
                name: taskName,
                assignee: assignee,
                priority: taskPriority,
                kanban_id: kanbanId,
                description: description,
                status: taskStatus,
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
    
            // Обновляем локально
            setTasks(prevTasks => {
                const newTasks = { ...prevTasks };
                const column = newTasks[editingTask.status];
                const taskIndex = column.findIndex(t => t.task_id === editingTask.task_id);
                if (taskIndex !== -1) {
                    column[taskIndex] = updatedTask;
                }
                return newTasks;
            });
    
            // Сбрасываем поля и закрываем модальное окно
            resetTaskInputs();
    
            // Обновляем список задач
            await fetchTasks();
    
        } catch (error) {
            console.error('Error updating task:', error);
        }
    };
    

    const resetTaskInputs = () => {
        setTaskName('');
        setAssignee('');
        setDescription('');
        settaskPriority('');
        setkanbanId('');
        setModalOpen(false);
        setEditModalOpen(false);
        setSelectedTask(null);
        
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
            resetTaskInputs();
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
        settaskPriority(task.priority);
        setkanbanId(task.kanban_id);
        setDescription(task.description);
        settaskStatus(task.status);
        setEditModalOpen(true);
        setSelectedTask(task);
    };
    const scrollToTaskColumn = (status) => {
    const columnIndex = Object.keys(tasks).indexOf(status);
    const columnWidth = 673; // ширина одного столбца
    const offset = columnIndex * columnWidth;
    
    const kanbanBoard = document.querySelector('.kanban-board');
    kanbanBoard.scrollTo({
        left: offset,
        behavior: 'smooth'
    });
};

useEffect(() => {
    if (editModalOpen && selectedTask) {
        scrollToTaskColumn(selectedTask.status);
    }
}, [editModalOpen, selectedTask]);
    
    useEffect(() => {
        fetchTasks();
        const interval = setInterval(fetchTasks, 120000);
        return () => clearInterval(interval);
    }, []);
    
    return (
        <>
            <h1>Kanban Board</h1>
            <div className={`kanban-board ${modalOpen || editModalOpen ? 'shifted' : ''}`}>
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
                                    <div className="task-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div className='task-user'>
                                            <svg width="21" height="21" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path fillRule="evenodd" clipRule="evenodd" d="M11.3191 0.837689L19.772 9.47967C20.0753 9.79016 20.0753 10.2932 19.772 10.6037L16.9613 13.4772L16.8628 13.578L10.4998 20.0833L7.04081 16.547L1.22749 10.6037C0.924169 10.2932 0.924169 9.79016 1.22749 9.47967L4.13674 6.50534L10.4998 0L11.3191 0.837689ZM7.59573 10.0416L10.4998 13.0107L13.4039 10.0416L10.4998 7.07261L7.59573 10.0416Z" fill="#4085F7"/>
                                                <path fillRule="evenodd" clipRule="evenodd" d="M10.501 7.07271C8.59961 5.12858 8.59035 1.97971 10.4802 0.0239258L4.125 6.51867L7.58395 10.055L10.501 7.07271Z" fill="url(#paint0_linear_1356_4310)"/>
                                                <path fillRule="evenodd" clipRule="evenodd" d="M13.4118 10.0337L10.5 13.0107C11.4177 13.9484 11.9333 15.2205 11.9333 16.547C11.9333 17.8735 11.4177 19.1456 10.5 20.0833L16.8708 13.57L13.4118 10.0337Z" fill="url(#paint1_linear_1356_4310)"/>
                                                <defs>
                                                    <linearGradient id="paint0_linear_1356_4310" x1="8.66474" y1="0.879189" x2="3.73753" y2="2.91439" gradientUnits="userSpaceOnUse">
                                                        <stop offset="0.18" stopColor="#0052CC"/>
                                                        <stop offset="1" stopColor="#2684FF"/>
                                                    </linearGradient>
                                                    <linearGradient id="paint1_linear_1356_4310" x1="12.3665" y1="19.1721" x2="17.2841" y2="17.1516" gradientUnits="userSpaceOnUse">
                                                        <stop offset="0.18" stopColor="#0052CC"/>
                                                        <stop offset="1" stopColor="#2684FF"/>
                                                    </linearGradient>
                                                </defs>
                                            </svg>
                                        </div>
                                        <div className="task-name" style={{ flexGrow: 1, margin: '0 10px' }} onClick={() => handleTaskClick(task)}>
                                            <b>{task.name}</b>
                                        </div>
                                    </div>
                                    <div className="task-body">
                                        <div className="priority">
                                            <div className="kanban-icon">
                                                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <rect width="14" height="14" rx="2" fill="#63BA3B"/>
                                                    <path fillRule="evenodd" clipRule="evenodd" d="M4 4C4 3.44772 4.44772 3 5 3H9C9.55228 3 10 3.44772 10 4V11L7 8L4 11V4Z" fill="white"/>
                                                </svg>
                                            </div>
                                            <div className="task-kanbanid">{task.kanban_id}</div>
                                        </div>
                                        <div className="task-priority" style={{ display: 'flex', alignItems: 'flex-start' }}>
    <svg style={{ marginRight: '5px' }} width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="10" height="10" rx="5" fill={
            task.priority === 'Low' ? '#808080' : // Серый
            task.priority === 'Medium' ? '#0000FF' : // Синий
            task.priority === 'High' ? '#FFFF00' : // Желтый
            task.priority === 'Critical' ? '#FFA500' : // Оранжевый
            task.priority === 'Blocked' ? '#FF0000' : // Красный
            '#00A553' // Зеленый по умолчанию
        } />
    </svg>
    <span style={{ marginLeft: '5px' }}>{task.priority}</span>
</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
                
                {modalOpen && (
                    <div className="modal" style={{
                        position: 'fixed',
                        top: '0',
                        right: '0',
                        height: '100vh',
                        width: '700px',
                        transition: 'transform 0.3s',
                        backgroundColor: '#FFFFFF',
                        boxShadow: '-2px 0 5px rgba(0,0,0,0.1)',
                        overflowY: 'auto',
                        transform: modalOpen ? 'translateX(0)' : 'translateX(100%)'
                    }}>
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
                            <option value="Low">Low</option>
                            <option value="Medium">Medium</option>
                            <option value="High">High</option>
                            <option value="Critical">Critical</option>
                            <option value="Blocked">Blocked</option>  
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
                    <div className="modal" style={{
                        position: 'fixed',
                        top: '0',
                        right: '0',
                        height: '100vh',
                        width: '50%',
                        transition: 'transform 0.3s',
                        backgroundColor: '#FFFFFF',
                        boxShadow: '-2px 0 5px rgba(0,0,0,0.1)',
                        overflowY: 'auto',
                        transform: editModalOpen ? 'translateX(0)' : 'translateX(100%)'
                    }}>
                        <div className='modal-header'>Edit Task</div>
                        <input
                            type="text"
                            value={assignee}
                            onChange={e => setAssignee(e.target.value)}
                            placeholder="Исполнитель"
                            className='modal-user'
                        />                        <input
                            type="text"
                            value={taskName}
                            onChange={e => setTaskName(e.target.value)}
                            placeholder="Название задачи"
                            className='modal-name'
                        />
                         
                        <div className='modal-actions'>
                        <button className='modal-save' onClick={handleApplyChanges}>Применить</button>
                        <button className='modal-save'onClick={()=>{
                            if (window.confirm('Уверены что хотите удалить задачу?')) {
                                handleDeleteTask(editingTask.task_id)}}
                            }
                           
                            >Удалить</button>
                        <button className='modal-close' onClick={() => {
                            if (taskName !== editingTask.name || assignee !== editingTask.assignee || description !== editingTask.description) {
                                if (window.confirm('Уверены что хотите закрыть без изменений?')) {
                                    resetTaskInputs();
                                }
                            } else {
                                resetTaskInputs();
                            }
                        }}>Закрыть</button>
                        </div>
                       
                        <div className='modal-details'>
                            <div className='modal-details-header'><b>Details</b></div>
                            
                        <select
                            type="select"
                            value={kanbanId}
                            onChange={e => setkanbanId(e.target.value)}
                            placeholder="kanban Id"
                            className='modal-kanbanid'
                        >
                            <option value="Panel">Panel</option>
                            <option value="Work">Work</option>  
                        </select>
                        <select
                            type="select"
                            value={taskStatus}
                            onChange={e => settaskStatus(e.target.value)}
                            placeholder="Статус"
                            className='modal-priority'
                        >
                            <option value="Backlog">Backlog</option>
                            <option value="To do">To do</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Done">Done</option>
                                
                        </select>
                        
                        <select
                            type="select"
                            value={taskPriority}
                            onChange={e => settaskPriority(e.target.value)}
                            placeholder="Приоритет"
                            className='modal-priority'
                        >
                            
                            <option value="Low">Low</option>
                            <option value="Medium">Medium</option>
                            <option value="High">High</option>
                            <option value="Critical">Critical</option>
                            <option value="Blocked">Blocked</option>     
                        </select>
                        </div>
                        <div className='modal-description-header'><b>Description</b></div>
                        <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="Описание задачи"
                            className='modal-desc'
                        />
                      
                        
                    </div>
                )}
            </div>
        </>
    );
};

export default KanbanBoard;
