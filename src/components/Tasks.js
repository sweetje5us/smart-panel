import React, { useState, useEffect, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useParams, useNavigate } from 'react-router-dom';
import ip from "./ip.json";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
    useDroppable
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import './Tasks.css';
import { useNotifications } from '../contexts/NotificationContext';
import { useTheme } from '../contexts/ThemeContext';

// Импортируем иконки приоритетов
import criticalIcon from '../priority/critical.svg';
import highIcon from '../priority/high.svg';
import mediumIcon from '../priority/medium.svg';
import lowIcon from '../priority/low.svg';
import blockedIcon from '../priority/blocked.svg';
import defaultIcon from '../priority/default.svg';

// Список всех пользователей системы
const users = {
    "597729cf-760b-40a4-8cde-e748224925a5": {
        name: "Евгений",
        role: "Администратор",
        id: "597729cf-760b-40a4-8cde-e748224925a5"
    },
    "29476d2e-1849-4885-9c51-6137976230c5": {
        name: "Александра",
        role: "Пользователь",
        id: "29476d2e-1849-4885-9c51-6137976230c5"
    }
};

// Функция для поиска userId по имени пользователя
const findUserIdByName = (name) => {
    const userEntry = Object.entries(users).find(([_, user]) => user.name === name);
    if (userEntry) {
        console.log('Найден пользователь:', userEntry);
        return userEntry[0];
    }
    console.log('Пользователь не найден для имени:', name);
    return null;
};

const address = `http://${ip.ip}:${ip.port}`;
const initialTasks = {
    'Backlog': [],
    'To do': [],
    'In Progress': [],
    'Done': []
};

const colors = ['#FFFFFF'];

const getRandomColor = () => {
    return colors[Math.floor(Math.random() * colors.length)];
};

const Sprint = [
    { title: '1 Итерация', sprint_date: '24.02.2025-10.03.2025', id: 'unique_sprint_id' },
  ];

  const Board = [
    { title: 'Panel', id: 'unique_sprint_id' },
    { title: 'Work', id: 'unique_sprint_id' },
];

const COLUMN_ORDER = ['Backlog', 'To do', 'In Progress', 'Done'];

const getPriorityIcon = (priority) => {
    switch (priority) {
        case 'Critical':
            return <img src={criticalIcon} alt="Critical" className="priority-icon" />;
        case 'High':
            return <img src={highIcon} alt="High" className="priority-icon" />;
        case 'Medium':
            return <img src={mediumIcon} alt="Medium" className="priority-icon" />;
        case 'Low':
            return <img src={lowIcon} alt="Low" className="priority-icon" />;
        case 'Blocked':
            return <img src={blockedIcon} alt="Blocked" className="priority-icon" />;
        default:
            return <img src={defaultIcon} alt="Default" className="priority-icon" />;
    }
};

const getPriorityColor = (priority) => {
    switch (priority) {
        case 'Critical':
            return '#FF5630';
        case 'High':
            return '#FF7452';
        case 'Medium':
            return '#FFC400';
        case 'Low':
            return '#36B37E';
        case 'Blocked':
            return '#5A6A84';
        default:
            return '#DFE1E6';
    }
};

const DroppableColumn = ({ status, children }) => {
    const { setNodeRef } = useDroppable({
        id: status,
        data: {
            type: 'column',
            status: status,
            columnId: status
        }
    });

    return (
        <div ref={setNodeRef} style={{ height: '100%', width: '100%' }}>
            {children}
        </div>
    );
};

const TaskCard = ({ task, onTaskClick, onDeleteClick }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleMenuClick = (e) => {
        e.stopPropagation();
        setIsMenuOpen(!isMenuOpen);
    };

    const handleEditClick = (e) => {
        e.stopPropagation();
        setIsMenuOpen(false);
        onTaskClick(task);
    };

    const handleDeleteClick = (e) => {
        e.stopPropagation();
        setIsMenuOpen(false);
        onDeleteClick(task);
    };

    return (
        <div className="task-card" onClick={() => onTaskClick(task)}>
            <div className="task-header">
                <div className="task-header-left">
                    <div className="task-id">{task.task_id}</div>
                </div>
                <div className="task-actions" ref={menuRef}>
                    <button 
                        className="task-actions-button"
                        onClick={handleMenuClick}
                    >
                        <span className="material-icons">more_vert</span>
                    </button>
                    {isMenuOpen && (
                        <div className="task-menu">
                            <div className="task-menu-item" onClick={handleEditClick}>
                                <span className="material-icons">edit</span>
                                Редактировать
                            </div>
                            <div className="task-menu-item delete" onClick={handleDeleteClick}>
                                <span className="material-icons">delete</span>
                                Удалить
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <div className="task-content">
                <div className="task-title">{task.name}</div>
                <div className="task-assignee">{task.assignee}</div>
                <div className="task-priority" style={{ color: getPriorityColor(task.priority) }}>
                    {getPriorityIcon(task.priority)}
                    <span className="priority-text">{task.priority}</span>
                </div>
            </div>
        </div>
    );
};

const KanbanBoard = () => {
    const { task_id } = useParams();
    const navigate = useNavigate();
    const { theme } = useTheme();
    const [tasks, setTasks] = useState(initialTasks);
    const [modalOpen, setModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [taskName, setTaskName] = useState('');
    const [taskPriority, setTaskPriority] = useState('Low');
    const [kanbanId, setKanbanId] = useState('Panel');
    const [assignee, setAssignee] = useState('');
    const [description, setDescription] = useState('');
    const [editingTask, setEditingTask] = useState(null);
    const [selectedTask, setSelectedTask] = useState(null);
    const [taskStatus, setTaskStatus] = useState('Backlog');
    const [collapsedBoards, setCollapsedBoards] = useState(new Set());
    const [filters, setFilters] = useState({
        kanbanId: [],
        showBacklog: false,
        sprint: [],
        assignee: '',
        status: ''
    });
    const [boards, setBoards] = useState([]);
    const [newBoardTitle, setNewBoardTitle] = useState('');
    const [error, setError] = useState('');
    const [boardModalOpen, setBoardModalOpen] = useState(false);
    const [createMenuAnchorEl, setCreateMenuAnchorEl] = useState(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [taskToDelete, setTaskToDelete] = useState(null);
    const [selectedBoard, setSelectedBoard] = useState(null);
    const [selectedSprint, setSelectedSprint] = useState(null);
    const [selectedAssignee, setSelectedAssignee] = useState(null);
    const [boardDropdownOpen, setBoardDropdownOpen] = useState(false);
    const [sprintDropdownOpen, setSprintDropdownOpen] = useState(false);
    const [assigneeDropdownOpen, setAssigneeDropdownOpen] = useState(false);
    const [activeId, setActiveId] = useState(null);
    const [notification, setNotification] = useState(null);
    const [isCreating, setIsCreating] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filtersMenuOpen, setFiltersMenuOpen] = useState(false);
    
    const boardDropdownRef = useRef(null);
    const sprintDropdownRef = useRef(null);
    const assigneeDropdownRef = useRef(null);
    const nameRef = useRef(null);
    const descriptionRef = useRef(null);
    const statusDropdownRef = useRef(null);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const { sendNotification } = useNotifications();

    const getPriorityOrder = (priority) => {
        switch (priority) {
            case 'Blocked':
                return 0;
            case 'Critical':
                return 1;
            case 'High':
                return 2;
            case 'Medium':
                return 3;
            case 'Low':
                return 4;
            default:
                return 5;
        }
    };

    const sortTasksByPriority = (tasks) => {
        return [...tasks].sort((a, b) => {
            const priorityA = getPriorityOrder(a.priority);
            const priorityB = getPriorityOrder(b.priority);
            return priorityA - priorityB;
        });
    };

    const fetchBoards = async () => {
        try {
            const response = await fetch(`${address}/api/boards`);
            if (!response.ok) {
                throw new Error('Ошибка при получении данных');
            }
            const data = await response.json();
            const transformedBoards = data.map(board => ({
                title: board.title,
                kanban_id: board.title
            }));
            setBoards(transformedBoards);
        } catch (error) {
            console.error('Ошибка при получении досок:', error);
        }
    };

    const fetchTasks = useCallback(async () => {
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
    }, []);

    useEffect(() => {
        fetchBoards();
        fetchTasks();
        const interval = setInterval(fetchTasks, 120000);
        return () => clearInterval(interval);
    }, [fetchTasks]);

    const handleDragStart = (event) => {
        setActiveId(event.active.id);
    };

    const handleDragEnd = async (event) => {
        const { active, over } = event;
        
        if (!over) return;

        const activeId = active.id;
        let targetStatus = null;

        if (over.data.current?.type === 'column') {
            targetStatus = over.data.current.status;
        } else if (over.data.current?.sortable?.containerId) {
            targetStatus = over.data.current.sortable.containerId;
        }

        if (!targetStatus || !COLUMN_ORDER.includes(targetStatus)) {
            console.error('Invalid target status:', targetStatus);
            return;
        }

        try {
            let sourceTask = null;
            let sourceStatus = null;
            
            Object.entries(tasks).forEach(([status, taskList]) => {
                const task = taskList.find(t => t.task_id === activeId);
                if (task) {
                    sourceStatus = status;
                    sourceTask = task;
                }
            });

            if (!sourceTask) {
                console.error('Source task not found');
                return;
            }

            const updatedTask = {
                ...sourceTask,
                status: targetStatus
            };

            const newTasks = { ...tasks };
            newTasks[sourceStatus] = newTasks[sourceStatus].filter(task => task.task_id !== activeId);
            
            if (!newTasks[targetStatus]) {
                newTasks[targetStatus] = [];
            }
            
            newTasks[targetStatus].unshift(updatedTask);
            setTasks(newTasks);

            const response = await fetch(`${address}/api/tasks`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updatedTask)
            });

            if (!response.ok) {
                throw new Error('Failed to update task on server');
            }

            // Отправляем уведомление создателю задачи при изменении статуса
            if (sourceTask.creator && sourceTask.creator !== currentUserName) {
                console.log('Поиск ID для создателя:', sourceTask.creator);
                const creatorUserId = findUserIdByName(sourceTask.creator);
                console.log('Найден ID создателя:', creatorUserId);

                if (creatorUserId) {
                    const currentDate = new Date();
                    sendNotification({
                        userId: creatorUserId,
                        title: `Задача "${sourceTask.name}" перемещена в статус "${targetStatus}"`,
                        source: 'Tasks',
                        link: `/tasks/${sourceTask.task_id}`,
                        eventDate: currentDate.toISOString().split('T')[0],
                        eventTime: currentDate.toTimeString().split(' ')[0]
                    });
                }
            }

            // Отправляем уведомление исполнителю при переходе задачи в статус "К выполнению"
            if (targetStatus === 'To do' && sourceTask.assignee && sourceTask.assignee !== currentUserName) {
                const assigneeUserId = findUserIdByName(sourceTask.assignee);
                if (assigneeUserId) {
                    const currentDate = new Date();
                    await fetch('http://192.168.0.20:8080/api/notifications', {
                        method: 'POST',
                        headers: {
                            'Accept': '*/*',
                            'Accept-Language': 'ru,en;q=0.9,la;q=0.8',
                            'Connection': 'keep-alive',
                            'Content-Type': 'application/json',
                            'Origin': 'http://localhost:3000',
                            'Referer': 'http://localhost:3000/',
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 YaBrowser/25.2.0.0 Safari/537.36'
                        },
                        body: JSON.stringify({
                            userId: assigneeUserId,
                            title: `На вас назначена новая задача "${sourceTask.name}"`,
                            source: "Kanban доска",
                            link: getTaskUrl(sourceTask.task_id),
                            eventDate: currentDate.toISOString().split('T')[0],
                            eventTime: currentDate.toTimeString().split(':').slice(0, 2).join(':')
                        })
                    });
                }
            }

            setNotification({
                message: 'Задача успешно перемещена',
                type: 'success'
            });
            setTimeout(() => setNotification(null), 3000);
        } catch (error) {
            console.error('Error in handleDragEnd:', error);
            setNotification({
                message: 'Произошла ошибка при перемещении задачи',
                type: 'error'
            });
            setTimeout(() => setNotification(null), 3000);
            fetchTasks();
        }

        setActiveId(null);
    };
    
    // Функция для транслитерации русского текста в латиницу
    const transliterate = (text) => {
        const ru = {
            'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 
            'е': 'e', 'ё': 'e', 'ж': 'zh', 'з': 'z', 'и': 'i',
            'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n',
            'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't',
            'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'c', 'ч': 'ch',
            'ш': 'sh', 'щ': 'sch', 'ь': '', 'ы': 'y', 'ъ': '',
            'э': 'e', 'ю': 'yu', 'я': 'ya'
        };
        return text.toLowerCase().split('').map(char => ru[char] || char).join('');
    };

    // Функция для генерации ID задачи
    const generateTaskId = (boardTitle) => {
        const prefix = transliterate(boardTitle).substring(0, 2).toUpperCase();
        const randomNum = Math.floor(Math.random() * 900000) + 100000; // Генерируем 6-значное число
        return `${prefix}-${randomNum}`;
    };

    const handleUpdateTask = async (updatedTask) => {
        try {
            const response = await fetch(`${address}/api/tasks/${updatedTask.task_id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updatedTask)
            });

            if (!response.ok) {
                throw new Error('Failed to update task');
            }

            setTasks(prevTasks => {
                const newTasks = { ...prevTasks };
                Object.keys(newTasks).forEach(status => {
                    const taskIndex = newTasks[status].findIndex(t => t.task_id === updatedTask.task_id);
                    if (taskIndex !== -1) {
                        newTasks[status].splice(taskIndex, 1);
                    }
                });
                if (!newTasks[updatedTask.status]) {
                    newTasks[updatedTask.status] = [];
                }
                newTasks[updatedTask.status].push(updatedTask);
                return newTasks;
            });

            // Отправляем уведомление об обновлении задачи
            await handleTaskUpdate(updatedTask.task_id, 'update', updatedTask.assignee);

            setNotification({
                message: 'Задача успешно обновлена',
                type: 'success'
            });
            setTimeout(() => setNotification(null), 3000);
        } catch (error) {
            console.error('Error updating task:', error);
            setNotification({
                message: 'Ошибка при обновлении задачи',
                type: 'error'
            });
            setTimeout(() => setNotification(null), 3000);
        }
    };

    const handleAddTask = async () => {
        if (!taskPriority || !kanbanId) {
            setNotification({
                message: 'Пожалуйста, выберите приоритет и доску',
                type: 'error'
            });
            setTimeout(() => setNotification(null), 3000);
            return;
        }
    
        setIsCreating(true);
        const newTask = {
            task_id: generateTaskId(kanbanId),
            kanban_id: kanbanId,
            name: taskName,
            assignee: assignee,
            description: description,
            status: taskStatus,
            priority: taskPriority,
            backgroundColor: getRandomColor(),
            creator: currentUserName
        };
    
        try {
            const response = await fetch(`${address}/api/tasks`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newTask)
            });

            if (!response.ok) {
                throw new Error('Failed to create task');
            }

            setTasks(prevTasks => ({
                ...prevTasks,
                [taskStatus]: [...prevTasks[taskStatus], newTask]
            }));

            // Отправляем уведомление о создании задачи
            await handleTaskUpdate(newTask.task_id, 'create', newTask.assignee);

            // Отправляем дополнительное уведомление исполнителю, если задача создана в статусе "К выполнению"
            if (taskStatus === 'To do' && assignee && assignee !== currentUserName) {
                const assigneeUserId = findUserIdByName(assignee);
                if (assigneeUserId) {
                    const currentDate = new Date();
                    await fetch('http://192.168.0.20:8080/api/notifications', {
                        method: 'POST',
                        headers: {
                            'Accept': '*/*',
                            'Accept-Language': 'ru,en;q=0.9,la;q=0.8',
                            'Connection': 'keep-alive',
                            'Content-Type': 'application/json',
                            'Origin': 'http://localhost:3000',
                            'Referer': 'http://localhost:3000/',
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 YaBrowser/25.2.0.0 Safari/537.36'
                        },
                        body: JSON.stringify({
                            userId: assigneeUserId,
                            title: `На вас назначена новая задача "${newTask.name}"`,
                            source: "Kanban доска",
                            link: getTaskUrl(newTask.task_id),
                            eventDate: currentDate.toISOString().split('T')[0],
                            eventTime: currentDate.toTimeString().split(':').slice(0, 2).join(':')
                        })
                    });
                }
            }

            setNotification({
                message: 'Задача успешно создана',
                type: 'success'
            });
            setTimeout(() => setNotification(null), 3000);

            setTaskName('');
            setDescription('');
            setAssignee('');
            setTaskPriority('Low');
            setModalOpen(false);
        } catch (error) {
            console.error('Error creating task:', error);
            setNotification({
                message: 'Ошибка при создании задачи',
                type: 'error'
            });
            setTimeout(() => setNotification(null), 3000);
        } finally {
            setIsCreating(false);
        }
    };

    const handleEditTask = (task) => {
        setSelectedTask(task);
        setTaskName(task.name);
        setDescription(task.description || '');
        setAssignee(task.assignee);
        setTaskStatus(task.status);
        setTaskPriority(task.priority);
        setKanbanId(task.kanban_id);
        setEditModalOpen(true);
        // Добавляем URL в историю браузера
        window.history.pushState({}, '', `/tasks/${task.task_id}`);
    };

    // Функция для получения URL задачи
    const getTaskUrl = (taskId) => {
        return `tasks/${taskId}`;
    };

    // Обновляем использование sendNotification из контекста
    const handleTaskUpdate = async (taskId, action, assignee) => {
        const taskUrl = getTaskUrl(taskId);
        const currentDate = new Date();
        const task = Object.values(tasks).flat().find(t => t.task_id === taskId);
        
        if (!task) return;

        let title = '';
        switch (action) {
            case 'create':
                title = `Вам назначена новая задача "${task.name}"`;
                break;
            case 'update':
                title = `Задача "${task.name}" была обновлена`;
                break;
            case 'delete':
                title = `Задача "${task.name}" была удалена`;
                break;
            default:
                title = `Изменения в задаче "${task.name}"`;
        }

        // Для создания задачи отправляем уведомление исполнителю
        if (action === 'create') {
            const userId = findUserIdByName(assignee);
            if (!userId) {
                console.error('Не удалось найти ID пользователя для:', assignee);
                return;
            }
            await fetch('http://192.168.0.20:8080/api/notifications', {
                method: 'POST',
                headers: {
                    'Accept': '*/*',
                    'Accept-Language': 'ru,en;q=0.9,la;q=0.8',
                    'Connection': 'keep-alive',
                    'Content-Type': 'application/json',
                    'Origin': 'http://localhost:3000',
                    'Referer': 'http://localhost:3000/',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 YaBrowser/25.2.0.0 Safari/537.36'
                },
                body: JSON.stringify({
                    userId,
                    title,
                    source: "Kanban доска",
                    link: taskUrl,
                    eventDate: currentDate.toISOString().split('T')[0],
                    eventTime: currentDate.toTimeString().split(':').slice(0, 2).join(':')
                })
            });
        } else {
            // Для обновления и удаления отправляем уведомление создателю
            const creatorUserId = findUserIdByName(task.creator);
            if (!creatorUserId) {
                console.error('Не удалось найти ID создателя для:', task.creator);
                return;
            }
            await fetch('http://192.168.0.20:8080/api/notifications', {
                method: 'POST',
                headers: {
                    'Accept': '*/*',
                    'Accept-Language': 'ru,en;q=0.9,la;q=0.8',
                    'Connection': 'keep-alive',
                    'Content-Type': 'application/json',
                    'Origin': 'http://localhost:3000',
                    'Referer': 'http://localhost:3000/',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 YaBrowser/25.2.0.0 Safari/537.36'
                },
                body: JSON.stringify({
                    userId: creatorUserId,
                    title,
                    source: "Kanban доска",
                    link: taskUrl,
                    eventDate: currentDate.toISOString().split('T')[0],
                    eventTime: currentDate.toTimeString().split(':').slice(0, 2).join(':')
                })
            });
        }
    };

    // Обновляем useEffect для обработки URL при загрузке
    useEffect(() => {
        const path = window.location.pathname;
        const match = path.match(/^\/tasks\/(.+)$/);
        
        if (match) {
            const taskId = match[1];
            const task = Object.values(tasks).flat().find(t => t.task_id === taskId);
            if (task) {
                handleEditTask(task);
            }
        }
    }, [tasks]);

    const handleDeleteTask = async (task) => {
        try {
            const response = await fetch(`${address}/api/tasks/${task.task_id}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('Failed to delete task');
            }

            setTasks(prevTasks => {
                const newTasks = { ...prevTasks };
                Object.keys(newTasks).forEach(status => {
                    newTasks[status] = newTasks[status].filter(t => t.task_id !== task.task_id);
                });
                return newTasks;
            });

            // Отправляем уведомление об удалении задачи
            await handleTaskUpdate(task.task_id, 'delete', task.assignee);

            setNotification({
                message: 'Задача успешно удалена',
                type: 'success'
            });
            setTimeout(() => setNotification(null), 3000);
        } catch (error) {
            console.error('Error deleting task:', error);
            setNotification({
                message: 'Ошибка при удалении задачи',
                type: 'error'
            });
            setTimeout(() => setNotification(null), 3000);
        }
    };

    const handleApplyChanges = async () => {
        setIsEditing(true);
        try {
            const updatedTask = {
                ...selectedTask,
                name: taskName,
                assignee: assignee,
                priority: taskPriority,
                kanban_id: selectedTask.kanban_id,
                description: description,
                status: taskStatus,
            };
    
            await handleUpdateTask(updatedTask);

            setEditModalOpen(false);
            resetTaskInputs();
        } catch (error) {
            console.error('Error updating task:', error);
            setNotification({
                message: 'Произошла ошибка при обновлении задачи',
                type: 'error'
            });
            setTimeout(() => setNotification(null), 3000);
        } finally {
            setIsEditing(false);
        }
    };

    const resetTaskInputs = () => {
        setTaskName('');
        setAssignee('');
        setDescription('');
        setTaskPriority('');
        setKanbanId('');
        setModalOpen(false);
        setEditModalOpen(false);
        setSelectedTask(null);
        navigate('/tasks/');
    };

    const handleCreateMenuClick = (event) => {
        setCreateMenuAnchorEl(event.currentTarget);
    };

    const handleCreateMenuClose = () => {
        setCreateMenuAnchorEl(null);
    };

    const handleCreateTask = () => {
        setCreateMenuAnchorEl(null);
        setTaskName('');
        setAssignee('');
        setDescription('');
        setTaskPriority('Low');
        setKanbanId('');
        setTaskStatus('Backlog');
        setModalOpen(true);
    };

    const handleCreateBoard = () => {
        setCreateMenuAnchorEl(null);
        setBoardModalOpen(true);
    };

    const handleAddBoard = async () => {
        if (!newBoardTitle) {
            setError('Название доски не может быть пустым');
            return;
        }

        const isDuplicate = boards.some(board => board.title === newBoardTitle);
        if (isDuplicate) {
            setError('Доска с таким названием уже существует');
            return;
        }

        try {
            const newBoard = { title: newBoardTitle };
            const response = await fetch(`${address}/api/boards`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newBoard)
            });

            if (!response.ok) {
                throw new Error('Failed to create board');
            }

            setBoards([...boards, newBoard]);
            setNewBoardTitle('');
            setError('');
            setBoardModalOpen(false);

            setNotification({
                message: 'Доска успешно создана',
                type: 'success'
            });
            setTimeout(() => setNotification(null), 3000);
        } catch (error) {
            console.error('Error creating board:', error);
            setNotification({
                message: 'Произошла ошибка при создании доски',
                type: 'error'
            });
            setTimeout(() => setNotification(null), 3000);
        }
    };

    const handleBoardSelect = (board) => {
        setSelectedBoard(board);
        setBoardDropdownOpen(false);
        setFilters(prev => ({ 
            ...prev, 
            kanbanId: board ? [board.title] : []
        }));
    };

    const handleSprintSelect = (sprint) => {
        setSelectedSprint(sprint);
        setSprintDropdownOpen(false);
        setFilters(prev => ({ 
            ...prev, 
            sprint: sprint ? [sprint.title] : []
        }));
    };

    const handleCheckboxChange = (event) => {
        setFilters(prev => ({ ...prev, showBacklog: event.target.checked }));
    };

    // Получаем текущего пользователя из localStorage
    const currentUser = JSON.parse(localStorage.getItem('user')) || {};
    const currentUserName = currentUser.name || '';

useEffect(() => {
        // При инициализации устанавливаем текущего пользователя как исполнителя по умолчанию
        setAssignee(currentUserName);
    }, [currentUserName]);
    
    // Обновляем логику фильтрации задач
    const filteredTasks = useCallback((tasks) => {
        return Object.fromEntries(
            Object.entries(tasks).map(([status, statusTasks]) => {
                let filtered = statusTasks;

                if (filters.assignee) {
                    filtered = filtered.filter(task => task.assignee === filters.assignee);
                }

                if (filters.kanbanId.length > 0) {
                    filtered = filtered.filter(task => 
                        filters.kanbanId.includes(task.kanban_id)
                    );
                }

                if (!filters.showBacklog && status === 'Backlog') {
                    return null;
                }

                return [status, filtered];
            })
        );
    }, [filters]);

    // Обновляем обработчик выбора исполнителя в фильтре
    const handleAssigneeSelect = (selectedAssignee) => {
        setAssigneeDropdownOpen(false);
        setSelectedAssignee(selectedAssignee);
        setFilters(prev => ({
            ...prev,
            assignee: selectedAssignee === '' ? '' : selectedAssignee
        }));
    };

    // Обновляем компонент фильтра исполнителя
    const renderAssigneeFilter = () => {
        const allUsers = Object.values(users).map(user => user.name);

        return (
            <div className="filter-group" ref={assigneeDropdownRef}>
                <button 
                    className={`filter-button ${selectedAssignee ? 'active' : ''}`}
                    onClick={() => setAssigneeDropdownOpen(!assigneeDropdownOpen)}
                >
                    <span>{selectedAssignee || 'Исполнитель'}</span>
                </button>
                {assigneeDropdownOpen && (
                    <div className="filter-dropdown">
                        <div
                            className={`filter-dropdown-item ${!selectedAssignee ? 'selected' : ''}`}
                            onClick={() => handleAssigneeSelect('')}
                        >
                            Все исполнители
        </div>
                        {allUsers.map(userName => (
                            <div 
                                key={userName}
                                className={`filter-dropdown-item ${selectedAssignee === userName ? 'selected' : ''}`}
                                onClick={() => handleAssigneeSelect(userName)}
                            >
                                {userName === currentUserName ? `${userName} (Вы)` : userName}
                            </div>
                        ))}
    </div>
)}
    </div>
        );
    };

    // Обновляем компонент выбора исполнителя для модальных окон
    const renderAssigneeDropdown = () => {
        const allUsers = Object.values(users).map(user => user.name);

        return (
            <div className="form-group">
                <label>Исполнитель</label>
                <div className="dropdown-container">
                    <button
                        type="button"
                        className="dropdown-button"
                        onClick={() => setAssigneeDropdownOpen(!assigneeDropdownOpen)}
                    >
                        {assignee || 'Выберите исполнителя'}
                    </button>
                    {assigneeDropdownOpen && (
                        <div className="dropdown-menu" ref={assigneeDropdownRef}>
                            {allUsers.map(userName => (
                                <div 
                                    key={userName}
                                    className="dropdown-item"
                                    onClick={() => {
                                        setAssignee(userName);
                                        setAssigneeDropdownOpen(false);
                                    }}
                                >
                                    {userName === currentUserName ? `${userName} (Вы)` : userName}
                                        </div>
                            ))}
                                        </div>
                    )}
                                    </div>
                                            </div>
        );
    };

    // Обновляем функцию для обработки выбора статуса
    const handleStatusSelect = (selectedStatus) => {
        setStatusDropdownOpen(false);
        setFilters(prev => ({
            ...prev,
            status: prev.status === selectedStatus ? '' : selectedStatus,
            // Если выбран статус Backlog, включаем флаг showBacklog
            showBacklog: selectedStatus === 'Backlog' ? true : false
        }));
    };

    // Обновляем обработчик переключателя бэклога
    const handleBacklogToggle = (event) => {
        const isChecked = event.target.checked;
        setFilters(prev => ({
            ...prev,
            showBacklog: isChecked,
            // Если включаем бэклог через переключатель и нет выбранного статуса,
            // или если выключаем бэклог и был выбран статус Backlog,
            // сбрасываем фильтр статуса
            status: isChecked && !prev.status ? '' : 
                   (!isChecked && prev.status === 'Backlog' ? '' : prev.status)
        }));
    };

    // Обновляем компонент фильтра по статусам
    const renderStatusFilter = () => (
        <div className="filter-group" ref={statusDropdownRef}>
            <button 
                className={`filter-button ${filters.status ? 'active' : ''}`}
                onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
            >
                <span>{filters.status || 'Статус'}</span>
            </button>
            {statusDropdownOpen && (
                <div className="filter-dropdown">
                    <div
                        className={`filter-dropdown-item ${!filters.status ? 'selected' : ''}`}
                        onClick={() => handleStatusSelect('')}
                    >
                        Все статусы
                    </div>
                    {COLUMN_ORDER.map(status => (
                        <div
                            key={status}
                            className={`filter-dropdown-item ${filters.status === status ? 'selected' : ''}`}
                            onClick={() => handleStatusSelect(status)}
                        >
                            {status}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    // Обновляем компонент переключателя бэклога
    const renderBacklogToggle = () => (
        <div className="filter-group">
            <label className="checkbox-label">
                <input
                    type="checkbox"
                    checked={filters.showBacklog}
                    onChange={handleBacklogToggle}
                    disabled={filters.status && filters.status !== 'Backlog'}
                />
                Бэклог
            </label>
        </div>
    );

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (boardDropdownRef.current && !boardDropdownRef.current.contains(event.target)) {
                setBoardDropdownOpen(false);
            }
            if (sprintDropdownRef.current && !sprintDropdownRef.current.contains(event.target)) {
                setSprintDropdownOpen(false);
            }
            if (assigneeDropdownRef.current && !assigneeDropdownRef.current.contains(event.target)) {
                setAssigneeDropdownOpen(false);
            }
            if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target)) {
                setStatusDropdownOpen(false);
            }
            if (createMenuAnchorEl && !event.target.closest('.create-button-container')) {
                setCreateMenuAnchorEl(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [createMenuAnchorEl]);
    
    // Добавляем функцию для фильтрации задач по поиску
    const filterTasksBySearch = (tasks) => {
        if (!searchQuery) return tasks;
        
        const query = searchQuery.toLowerCase();
        return tasks.filter(task => 
            task.name.toLowerCase().includes(query) || 
            (task.description && task.description.toLowerCase().includes(query))
        );
    };

    const toggleBoardCollapse = (boardTitle) => {
        setCollapsedBoards(prev => {
            const newCollapsed = new Set(prev);
            if (newCollapsed.has(boardTitle)) {
                newCollapsed.delete(boardTitle);
            } else {
                newCollapsed.add(boardTitle);
            }
            return newCollapsed;
        });
    };

    const renderColumns = () => {
        if (selectedBoard) {
            return (
                <div className="board-section">
                    <div 
                        className={`board-section-header ${collapsedBoards.has(selectedBoard.title) ? 'collapsed' : ''}`}
                        onClick={() => toggleBoardCollapse(selectedBoard.title)}
                    >
                        <h2>
                            <span className="collapse-icon">
                                {collapsedBoards.has(selectedBoard.title) ? '▶' : '▼'}
                            </span>
                            {selectedBoard.title}
                        </h2>
                    </div>
                    {!collapsedBoards.has(selectedBoard.title) && (
                        <div className={`board-columns ${filters.status ? 'filtered-by-status' : ''}`}>
                            {COLUMN_ORDER.map((status) => {
                                let columnTasks = tasks[status] || [];
                                columnTasks = columnTasks.filter(task => 
                                    task.kanban_id === selectedBoard.title
                                );

                                if (filters.assignee) {
                                    columnTasks = columnTasks.filter(task => 
                                        task.assignee === filters.assignee
                                    );
                                }

                                columnTasks = filterTasksBySearch(columnTasks);

                                if (!filters.showBacklog && status === 'Backlog') {
                                    return null;
                                }

                                if (filters.status && status !== filters.status) {
                                    return null;
                                }

                                if (columnTasks.length === 0) {
                                    return null;
                                }

                                return (
                                    <DroppableColumn key={status} status={status}>
                                        <div className="column">
                                            <div className="column-header">
                                                <h3>{status}</h3>
                                                <span className="task-count">{columnTasks.length}</span>
                                            </div>
                                            <div className="column-content">
                                                <SortableContext
                                                    items={columnTasks.map(task => task.task_id)}
                                                    strategy={verticalListSortingStrategy}
                                                >
                                                    <div className="tasks-grid">
                                                        {sortTasksByPriority(columnTasks).map((task) => (
                                                            <TaskCard 
                                                                key={task.task_id} 
                                                                task={task} 
                                                                onTaskClick={handleEditTask}
                                                                onDeleteClick={(task) => {
                                                                    setTaskToDelete(task);
                                                                    setDeleteDialogOpen(true);
                                                                }}
                                                            />
                                                        ))}
                                                    </div>
                                                </SortableContext>
                                            </div>
                                        </div>
                                    </DroppableColumn>
                                );
                            })}
                        </div>
                    )}
                </div>
            );
        }

        return boards.map(board => {
            let hasAnyTasks = false;
            const boardColumns = (
                <div className={`board-columns ${filters.status ? 'filtered-by-status' : ''}`}>
                    {COLUMN_ORDER.map(status => {
                        let columnTasks = tasks[status] || [];
                        columnTasks = columnTasks.filter(task => task.kanban_id === board.title);

                        if (filters.assignee) {
                            columnTasks = columnTasks.filter(task => 
                                task.assignee === filters.assignee
                            );
                        }

                        columnTasks = filterTasksBySearch(columnTasks);

                        if (!filters.showBacklog && status === 'Backlog') {
                            return null;
                        }

                        if (filters.status && status !== filters.status) {
                            return null;
                        }

                        if (columnTasks.length === 0) {
                            return null;
                        }

                        hasAnyTasks = true;

                        return (
                            <DroppableColumn key={`${board.title}-${status}`} status={status}>
                                <div className="column">
                                    <div className="column-header">
                                        <h3>{status}</h3>
                                        <span className="task-count">{columnTasks.length}</span>
                                    </div>
                                    <div className="column-content">
                                        <SortableContext
                                            items={columnTasks.map(task => task.task_id)}
                                            strategy={verticalListSortingStrategy}
                                        >
                                            <div className="tasks-grid">
                                                {sortTasksByPriority(columnTasks).map((task) => (
                                                    <TaskCard 
                                                        key={task.task_id} 
                                                        task={task} 
                                                        onTaskClick={handleEditTask}
                                                        onDeleteClick={(task) => {
                                                            setTaskToDelete(task);
                                                            setDeleteDialogOpen(true);
                                                        }}
                                                    />
                                                ))}
                                            </div>
                                        </SortableContext>
                                    </div>
                                </div>
                            </DroppableColumn>
                        );
                    })}
                </div>
            );

            if (!hasAnyTasks) {
                return null;
            }

            return (
                <div key={board.title} className="board-section">
                    <div 
                        className={`board-section-header ${collapsedBoards.has(board.title) ? 'collapsed' : ''}`}
                        onClick={() => toggleBoardCollapse(board.title)}
                    >
                        <h2>
                            <span className="collapse-icon">
                                {collapsedBoards.has(board.title) ? '▶' : '▼'}
                            </span>
                            {board.title}
                        </h2>
                    </div>
                    {!collapsedBoards.has(board.title) && boardColumns}
                </div>
            );
        });
    };

    // Добавляем компонент поиска
    const renderSearchField = () => (
        <div className="search-field">
            <span className="material-icons search-icon">search</span>
            <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск задач..."
                className="search-input"
            />
            {searchQuery && (
                <button
                    className="clear-search"
                    onClick={() => setSearchQuery('')}
                >
                    ✕
                </button>
            )}
        </div>
    );

    const renderCreateTaskModal = () => (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Создать задачу</h2>
                    <button className="close-button" onClick={() => setModalOpen(false)}>✕</button>
                </div>
                <div className="kanban-modal-content">
                    <div className="modal-section">
                        <div className="modal-field">
                            <label>Название задачи</label>
                            <input
                                type="text"
            value={taskName}
            onChange={e => setTaskName(e.target.value)}
                                placeholder="Введите название задачи"
                                autoFocus
        />
        </div>
                    </div>
                    
                    <div className="modal-section">
                        <div className="modal-section-title">Детали</div>
                        <div className="modal-field">
                            <label>Доска</label>
            <select
    value={kanbanId}
                                onChange={e => setKanbanId(e.target.value)}
>
                                <option value="">Выберите доску</option>
    {boards.map(board => (
        <option key={board.kanban_id} value={board.kanban_id}>
            {board.title}
        </option>
    ))}
</select>
                        </div>
                        <div className="modal-field">
                            <label>Приоритет</label>
            <select
                value={taskPriority}
                                onChange={e => setTaskPriority(e.target.value)}
                            >
                                <option value="Low">Низкий</option>
                                <option value="Medium">Средний</option>
                                <option value="High">Высокий</option>
                                <option value="Critical">Критический</option>
                                <option value="Blocked">Заблокирован</option>
            </select>
        </div>
                        <div className="modal-field">
                            <label>Статус</label>
                            <select
                                value={taskStatus}
                                onChange={e => setTaskStatus(e.target.value)}
                            >
                                <option value="Backlog">Бэклог</option>
                                <option value="To do">К выполнению</option>
                            </select>
                        </div>
                        <div className="modal-field">
                            <label>Создатель</label>
                            <input
                                type="text"
                                value={currentUserName}
                                disabled
                                className="input-disabled"
                            />
                        </div>
                    </div>

                    <div className="modal-section">
                        <div className="modal-section-title">Люди</div>
                        <div className="modal-field">
                            {renderAssigneeDropdown()}
                        </div>
                    </div>

                    <div className="modal-section">
                        <div className="modal-section-title">Описание</div>
                        <div className="modal-field">
        <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
                                placeholder="Введите описание задачи"
        />
    </div>
                    </div>
                </div>
                <div className="modal-actions">
                    <button 
                        className="modal-button modal-button-secondary" 
                        onClick={() => setModalOpen(false)}
                        disabled={isCreating}
                    >
                        Отмена
                    </button>
                    <button 
                        className={`modal-button modal-button-primary ${isCreating ? 'modal-button-loading' : ''}`}
                        onClick={handleAddTask}
                        disabled={isCreating}
                    >
                        {isCreating ? (
                            <>
                                <div className="spinner" />
                                Создание...
                            </>
                        ) : 'Создать'}
                    </button>
                </div>
            </div>
        </div>
    );

    const renderEditTaskModal = () => (
        <div className="modal-overlay" onClick={() => {
            setEditModalOpen(false);
            navigate('/tasks/');
        }}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Редактировать задачу {selectedTask?.task_id}</h2>
                    <button className="close-button" onClick={() => {
                        setEditModalOpen(false);
                        navigate('/tasks/');
                    }}>✕</button>
                </div>
                <div className="kanban-modal-content">
                    <div className="modal-section">
                        <div className="modal-field">
                            <label>Название задачи</label>
                            <input
                                type="text"
                            value={taskName}
                            onChange={e => setTaskName(e.target.value)}
                                placeholder="Введите название задачи"
                                autoFocus
                            />
                        </div>
                        </div>
                       
                    <div className="modal-section">
                        <div className="modal-section-title">Детали</div>
                        <div className="modal-field">
                            <label>Доска</label>
                        <select
                            value={kanbanId}
                                onChange={e => setKanbanId(e.target.value)}
                            >
                                <option value="">Выберите доску</option>
                                {boards.map(board => (
                                    <option key={board.kanban_id} value={board.kanban_id}>
                                        {board.title}
                                    </option>
                                ))}
                        </select>
                        </div>
                        <div className="modal-field">
                            <label>Приоритет</label>
                        <select
                                value={taskPriority}
                                onChange={e => setTaskPriority(e.target.value)}
                            >
                                <option value="Low">Низкий</option>
                                <option value="Medium">Средний</option>
                                <option value="High">Высокий</option>
                                <option value="Critical">Критический</option>
                                <option value="Blocked">Заблокирован</option>
                        </select>
                        </div>
                        <div className="modal-field">
                            <label>Статус</label>
                        <select
                                value={taskStatus}
                                onChange={e => setTaskStatus(e.target.value)}
                            >
                                <option value="Backlog">Бэклог</option>
                                <option value="To do">К выполнению</option>
                            </select>
                        </div>
                        <div className="modal-field">
                            <label>Создатель</label>
                            <div className="creator-field">{selectedTask?.creator}</div>
                        </div>
                    </div>

                    <div className="modal-section">
                        <div className="modal-section-title">Люди</div>
                        <div className="modal-field">
                            {renderAssigneeDropdown()}
                        </div>
                    </div>

                    <div className="modal-section">
                        <div className="modal-section-title">Описание</div>
                        <div className="modal-field">
                        <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                                placeholder="Введите описание задачи"
                            />
                        </div>
                    </div>
                </div>
                <div className="modal-actions">
                    <button 
                        className="modal-button modal-button-secondary" 
                        onClick={() => {
                            setEditModalOpen(false);
                            navigate('/tasks/');
                        }}
                        disabled={isEditing}
                    >
                        Отмена
                    </button>
                    <button 
                        className={`modal-button modal-button-primary ${isEditing ? 'modal-button-loading' : ''}`}
                        onClick={handleApplyChanges}
                        disabled={isEditing}
                    >
                        {isEditing ? (
                            <>
                                <div className="spinner" />
                                Сохранение...
                            </>
                        ) : 'Сохранить'}
                    </button>
                </div>
            </div>
        </div>
    );

    const renderCreateBoardModal = () => (
        <div className="modal-overlay" onClick={() => setBoardModalOpen(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Создать доску</h2>
                    <button className="close-button" onClick={() => setBoardModalOpen(false)}>✕</button>
                </div>
                <div className="kanban-modal-content">
                    <div className="modal-section">
                        <div className="modal-field">
                            <label>Название доски</label>
                            <input
                                type="text"
                                value={newBoardTitle}
                                onChange={e => setNewBoardTitle(e.target.value)}
                                placeholder="Введите название доски"
                                autoFocus
                            />
                            {error && <div className="error-message">{error}</div>}
                        </div>
                    </div>
                </div>
                <div className="modal-actions">
                    <button className="modal-button modal-button-secondary" onClick={() => setBoardModalOpen(false)}>
                        Отмена
                    </button>
                    <button className="modal-button modal-button-primary" onClick={handleAddBoard}>
                        Создать
                    </button>
                </div>
            </div>
        </div>
    );

    const handleResetFilters = () => {
        setSelectedBoard(null);
        setSelectedSprint(null);
        setSelectedAssignee('');
        setFilters({
            kanbanId: [],
            showBacklog: false,
            sprint: [],
            assignee: '',
            status: ''
        });
    };

    const handleDeleteConfirm = async () => {
        setIsDeleting(true);
        try {
            await handleDeleteTask(taskToDelete);
            setDeleteDialogOpen(false);
            setTaskToDelete(null);
            setNotification({
                message: 'Задача успешно удалена',
                type: 'success'
            });
            setTimeout(() => setNotification(null), 3000);
        } catch (error) {
            console.error('Error deleting task:', error);
            setNotification({
                message: 'Ошибка при удалении задачи',
                type: 'error'
            });
            setTimeout(() => setNotification(null), 3000);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className={`kanban-container ${theme === 'dark' ? 'theme-dark' : ''}`}>
            <div className="kanban-header">
                <div className="kanban-filters">
                    <div className="board-selector">
                        <div className="board-selector-header">
                            <span>Доска</span>
                        </div>
                        <div className="board-selector-content" ref={boardDropdownRef}>
                            <button 
                                className={`board-selector-button ${boardDropdownOpen ? 'active' : ''}`}
                                onClick={() => setBoardDropdownOpen(!boardDropdownOpen)}
                            >
                                {selectedBoard ? selectedBoard.title : 'Все доски'}
                                <span className="material-icons">expand_more</span>
                            </button>
                            {boardDropdownOpen && (
                                <div className="board-dropdown">
                                    <div
                                        className={`board-dropdown-item ${!selectedBoard ? 'selected' : ''}`}
                                        onClick={() => handleBoardSelect(null)}
                                    >
                                        Все доски
                                    </div>
                                    {boards.map(board => (
                                        <div
                                            key={board.title}
                                            className={`board-dropdown-item ${selectedBoard?.title === board.title ? 'selected' : ''}`}
                                            onClick={() => handleBoardSelect(board)}
                                        >
                                            {board.title}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="filters-row">
                        {renderSearchField()}
                        <button 
                            className={`filters-button ${filtersMenuOpen ? 'active' : ''}`}
                            onClick={() => setFiltersMenuOpen(!filtersMenuOpen)}
                        >
                            <span className="material-icons">tune</span>
                            Фильтры
                        </button>
                        {filtersMenuOpen && (
                            <div className="filters-menu">
                                <div className="filters-menu-header">
                                    <div className="filters-menu-title">Фильтры</div>
                                    <div className="filters-menu-actions">
                                        <button 
                                            className="filters-menu-button reset"
                                            onClick={handleResetFilters}
                                        >
                                            <span className="material-icons">restart_alt</span>
                                            Сбросить
                                        </button>
                                        <button 
                                            className="filters-menu-button close"
                                            onClick={() => setFiltersMenuOpen(false)}
                                        >
                                            <span className="material-icons">close</span>
                                        </button>
                                    </div>
                                </div>
                                <div className="filters-menu-section">
                                    <div className="filters-menu-title">Спринт</div>
                                    <div
                                        className={`filter-dropdown-item ${!selectedSprint ? 'selected' : ''}`}
                                        onClick={() => handleSprintSelect(null)}
                                    >
                                        Все спринты
                                    </div>
                                    {Sprint.map(sprint => (
                                        <div
                                            key={sprint.title}
                                            className={`filter-dropdown-item ${selectedSprint?.title === sprint.title ? 'selected' : ''}`}
                                            onClick={() => handleSprintSelect(sprint)}
                                        >
                                            {sprint.title}
                                        </div>
                                    ))}
                                </div>
                                <div className="filters-menu-section">
                                    <div className="filters-menu-title">Статус</div>
                                    <div
                                        className={`filter-dropdown-item ${!filters.status ? 'selected' : ''}`}
                                        onClick={() => handleStatusSelect('')}
                                    >
                                        Все статусы
                                    </div>
                                    {COLUMN_ORDER.map(status => (
                                        <div
                                            key={status}
                                            className={`filter-dropdown-item ${filters.status === status ? 'selected' : ''}`}
                                            onClick={() => handleStatusSelect(status)}
                                        >
                                            {status}
                                        </div>
                                    ))}
                                </div>
                                <div className="filters-menu-section">
                                    <div className="filters-menu-title">Исполнитель</div>
                                    <div
                                        className={`filter-dropdown-item ${!selectedAssignee ? 'selected' : ''}`}
                                        onClick={() => handleAssigneeSelect('')}
                                    >
                                        Все исполнители
                                    </div>
                                    {Object.values(users).map(user => (
                                        <div 
                                            key={user.name}
                                            className={`filter-dropdown-item ${selectedAssignee === user.name ? 'selected' : ''}`}
                                            onClick={() => handleAssigneeSelect(user.name)}
                                        >
                                            {user.name === currentUserName ? `${user.name} (Вы)` : user.name}
                                        </div>
                                    ))}
                                </div>
                                <div className="filters-menu-section">
                                    <div className="filters-menu-title">Отображение</div>
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={filters.showBacklog}
                                            onChange={handleBacklogToggle}
                                            disabled={filters.status && filters.status !== 'Backlog'}
                                        />
                                        Показывать бэклог
                                    </label>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="filters-row">
                        <div className="create-button-container">
                            <button
                                className="create-button"
                                onClick={handleCreateMenuClick}
                            >
                                ➕ Создать
                            </button>
                            {createMenuAnchorEl && (
                                <div className="create-menu">
                                    <div className="create-menu-item" onClick={handleCreateTask}>
                                        <span className="material-icons">add_task</span>
                                        Создать задачу
                                    </div>
                                    <div className="create-menu-item" onClick={handleCreateBoard}>
                                        <span className="material-icons">dashboard</span>
                                        Создать доску
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="quick-filters">
                            <button 
                                className={`quick-filter-button ${filters.assignee === currentUserName ? 'active' : ''}`}
                                onClick={() => handleAssigneeSelect(filters.assignee === currentUserName ? '' : currentUserName)}
                            >
                                <span className="material-icons">person</span>
                                Мои задачи
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <div className="kanban-board">
                    {renderColumns()}
                </div>
                <DragOverlay>
                    {activeId ? (
                        <TaskCard
                            task={Object.values(tasks)
                                .flat()
                                .find(task => task.task_id === activeId)}
                            onTaskClick={handleEditTask}
                        />
                    ) : null}
                </DragOverlay>
            </DndContext>

            {modalOpen && renderCreateTaskModal()}
            {editModalOpen && renderEditTaskModal()}
            {boardModalOpen && renderCreateBoardModal()}
            {deleteDialogOpen && (
                <div className="modal-overlay" onClick={() => setDeleteDialogOpen(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Подтверждение удаления</h2>
                            <button className="close-button" onClick={() => setDeleteDialogOpen(false)}>✕</button>
                        </div>
                        <div className="kanban-modal-content">
                            <p>Вы уверены, что хотите удалить задачу "{taskToDelete?.name}"?</p>
                        </div>
                        <div className="modal-actions">
                            <button 
                                className="modal-button modal-button-secondary" 
                                onClick={() => setDeleteDialogOpen(false)}
                                disabled={isDeleting}
                            >
                                Отмена
                            </button>
                            <button 
                                className={`modal-button modal-button-primary ${isDeleting ? 'modal-button-loading' : ''}`}
                                onClick={handleDeleteConfirm}
                                disabled={isDeleting}
                            >
                                {isDeleting ? (
                                    <>
                                        <div className="spinner" />
                                        Удаление...
                                    </>
                                ) : 'Удалить'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
                
            <CSSTransition
                in={notification !== null}
                timeout={300}
                classNames="notification"
                unmountOnExit
            >
                <div className={`notification notification-${notification?.type}`}>
                    {notification?.message}
                </div>
            </CSSTransition>
        </div>
    );
};

export default KanbanBoard;