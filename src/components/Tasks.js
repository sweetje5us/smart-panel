import React, { useState, useEffect, useCallback, useRef   } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useParams, useNavigate   } from 'react-router-dom';
import ip from "./ip.json";
import {Link } from "react-router-dom";
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { styled, alpha } from '@mui/material/styles';
import Chip from '@mui/material/Chip';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import Stack from '@mui/material/Stack';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import FormGroup from '@mui/material/FormGroup';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
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
const Sprint = [
    { title: '1 Итерация', sprint_date: '24.02.2025-10.03.2025', id: 'unique_sprint_id' },

  ];
  const Board = [
    { title: 'Panel', id: 'unique_sprint_id' },
    { title: 'Work', id: 'unique_sprint_id' },

  ];

const StyledMenu = styled((props) => (
    <Menu
      elevation={0}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'right',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      {...props}
    />
  ))(({ theme }) => ({
    '& .MuiPaper-root': {
      borderRadius: 6,
      marginTop: theme.spacing(1),
      minWidth: 180,
      height: 180,
      color: 'rgb(55, 65, 81)',
      boxShadow:
        'rgb(255, 255, 255) 0px 0px 0px 0px, rgba(0, 0, 0, 0.05) 0px 0px 0px 1px, rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.05) 0px 4px 6px -2px',
      '& .MuiMenu-list': {
        padding: '4px 0',
      },
      '& .MuiMenuItem-root': {
        '& .MuiSvgIcon-root': {
          fontSize: 18,
          color: theme.palette.text.secondary,
          marginRight: theme.spacing(1.5),
        },
        '&:active': {
          backgroundColor: alpha(
            theme.palette.primary.main,
            theme.palette.action.selectedOpacity,
          ),
        },
      },
      ...theme.applyStyles('dark', {
        color: theme.palette.grey[300],
      }),
    },
  }));

const KanbanBoard = () => {
    const { task_id } = useParams();
    const navigate = useNavigate ();
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
    const nameRef = useRef(null);
    const descriptionRef = useRef(null);
    const [showBacklog, setShowBacklog] = useState(false);
    const [uniqueKanbanIds, setUniqueKanbanIds] = useState([]);
    const [filteredTasks, setFilteredTasks] = useState(initialTasks); // Состояние для хранения отфильтрованных задач
    const [filters, setFilters] = useState({
        kanbanId: [],
        showBacklog: false,
        sprint: ''
    });

    const handleCheckboxChange = (event) => {
        const checked = event.target.checked;
        setFilters(prev => ({ ...prev, showBacklog: checked })); // Убедитесь, что обновляете состояние правильно
    };
    const handleSprintChange = (event, value) => {
        setFilters(prev => ({ ...prev, sprint: value }));
    };
    const loadFiltersFromLocalStorage = () => {
        const storedFilters = JSON.parse(localStorage.getItem('kanbanFilters'));
        if (storedFilters) {
            setFilters(storedFilters);
        }
    };

    // Функция для сохранения фильтров в localStorage
    const saveFiltersToLocalStorage = (newFilters) => {
        localStorage.setItem('kanbanFilters', JSON.stringify(newFilters));
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
            const kanbanIds = [...new Set(data.map(task => task.kanban_id))];
            setUniqueKanbanIds(kanbanIds.map(id => ({ title: id }))); // Форматируем для Autocomplete
            // Применяем фильтры к новым данным
            const updatedFilteredTasks = applyFilters(Object.values(formattedTasks).flat(), filters);
            setFilteredTasks(updatedFilteredTasks);
        } catch (error) {
            console.error('Error fetching tasks:', error);
        }
    }, [filters]);
    useEffect(() => {
        loadFiltersFromLocalStorage();
        fetchTasks();
    }, []);
    useEffect(() => {
        saveFiltersToLocalStorage(filters);
    }, [filters]);
    const adjustHeight = (textarea) => {
        textarea.style.height = 'auto'; // Сбрасываем высоту
        textarea.style.height = `${textarea.scrollHeight}px`; // Устанавливаем высоту в соответствии с содержимым
    };
    
    useEffect(() => {
        if (nameRef.current) {
            adjustHeight(nameRef.current);
        }
        if (descriptionRef.current) {
            adjustHeight(descriptionRef.current);
        }
    }, [taskName, description]); 
    const handleKanbanIdChange = (event, value) => {
        const selectedKanbanIds = value.map(item => item.title);
        setFilters(prev => ({ ...prev, kanbanId: selectedKanbanIds }));
    };
    
    const applyFilters = (tasks, filters) => {
        const result = {};
        for (const status of Object.keys(initialTasks)) {
            result[status] = tasks.filter(task => 
                task.status === status &&
                (filters.kanbanId.length > 0 ? filters.kanbanId.includes(task.kanban_id) : true) &&
                (filters.sprint ? task.sprint === filters.sprint : true)
            );
        }
        return result;
    };
    
    
const handleFilterChange = async (newFilters) => {
    setFilters(newFilters);
    await fetchTasks(); // Получаем новые задачи с сервера
};
    const onDragEnd = (result) => {
        if (!result.destination) return;
    
        const { source, destination } = result;
    
        // Проверяем, что источник и назначение разные
        if (source.droppableId === destination.droppableId && source.index === destination.index) {
            return; // Ничего не меняем, если перемещение не произошло
        }
    
        // Получаем актуальные колонки задач для перемещения
        const sourceColumn = filteredTasks[source.droppableId] || tasks[source.droppableId];
        const destColumn = filteredTasks[destination.droppableId] || tasks[destination.droppableId];
    
        // Извлекаем перемещаемую задачу
        const [movedTask] = sourceColumn.splice(source.index, 1);
        destColumn.splice(destination.index, 0, movedTask);
    
        // Обновляем состояние с учетом фильтров
        setTasks(prevTasks => ({
            ...prevTasks,
            [source.droppableId]: [...sourceColumn],
            [destination.droppableId]: [...destColumn],
        }));
        fetchTasks();
    
        // Обновляем задачу на сервере
        const updatedTask = { ...movedTask, status: destination.droppableId };
        fetch(`${address}/api/tasks`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updatedTask)
        }).catch(error => console.error('Ошибка при обновлении задачи:', error));
        const updatedFilteredTasks = applyFilters(filteredTasks, filters);
setFilteredTasks(updatedFilteredTasks);
    };
   
    useEffect(() => {
        fetchTasks(); // Загружаем задачи при монтировании компонента
        const interval = setInterval(fetchTasks, 120000);
        return () => clearInterval(interval);
    }, [fetchTasks]);

    useEffect(() => {
        if (task_id) {
            const taskToEdit = Object.values(tasks).flat().find(task => task.task_id === task_id);
            if (taskToEdit) {
                openEditModal(taskToEdit);
            }
        }
    }, [task_id, tasks]);

    const openEditModal = (task) => {
        setEditingTask(task);
        setTaskName(task.name);
        setAssignee(task.assignee);
        settaskPriority(task.priority);
        setkanbanId(task.kanban_id);
        setDescription(task.description);
        settaskStatus(task.status);
        setEditModalOpen(true);
        setSelectedTask(task);
        navigate(`/tasks/${task.task_id}`, { replace: true });
    };

    // useEffect для открытия модального окна редактирования при загрузке компонента
    useEffect(() => {
        if (task_id) {
            const taskToEdit = Object.values(tasks).flat().find(task => task.task_id === task_id);
            if (taskToEdit) {
                openEditModal(taskToEdit);
            }
        }
    }, [task_id, tasks]);

    useEffect(() => {
        fetchTasks();
        const interval = setInterval(fetchTasks, 120000);
        return () => clearInterval(interval);
    }, []);

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
    const generateTaskId = (kanbanId, taskCount) => {
        // Извлекаем согласные буквы из kanbanId
        const consonants = kanbanId.match(/[бвгджзйклмнпрстфхцчшщqwrtpsdfghjklzxcvbnm]/gi);
        const firstTwoConsonants = consonants ? consonants.slice(0, 2).join('').toUpperCase() : 'XX'; // Если нет согласных, используем 'XX'
        
        // Форматируем числовую часть
        const numericPart = String(taskCount).padStart(6, '0'); // Обеспечиваем 6-значное число
    
        return `${firstTwoConsonants}-${numericPart}`;
    };
    
    const handleAddTask = async () => {
        if (!taskPriority || !kanbanId) {
            alert("Пожалуйста, выберите приоритет и канбан ID.");
            return;
        }
    
        // Получаем текущее количество задач в статусе 'Backlog' для генерации номера
        let taskCount = tasks.Backlog.length + 1; // +1 для нового задания
        let newTaskId = generateTaskId(kanbanId, taskCount);
        const existingTaskIds = tasks.Backlog.map(task => task.task_id);
        while (existingTaskIds.includes(newTaskId)) {
            taskCount += 1; // Увеличиваем счётчик
            newTaskId = generateTaskId(kanbanId, taskCount); // Генерируем новый task_id
        }
        const newTask = {
            task_id: newTaskId,
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
    
        setFilteredTasks(prevTasks => {
            const newTasks = { ...prevTasks };
    
            // Ищем задачу в текущем состоянии задач
            for (const key of Object.keys(newTasks)) {
                const taskIndex = newTasks[key].findIndex(task => String(task.task_id) === String(taskId));
    
                if (taskIndex !== -1) {
                    taskToMove = newTasks[key][taskIndex];
                    newTasks[key].splice(taskIndex, 1); // Удаляем задачу из старого столбца
                    break;
                }
            }
    
            if (taskToMove) {
                taskToMove.status = status; // Обновляем статус задачи
                newTasks[status] = newTasks[status] || []; // Убедитесь, что массив существует
                newTasks[status].push(taskToMove); // Добавляем задачу в новый столбец
    
                // Обновляем задачу на сервере
                fetch(`${address}/api/tasks`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(taskToMove)
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
            await fetchTasks();
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
const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleCloseA = () => {
    setAnchorEl(null);
    setModalOpen(true);
  };
  const handleClose = () => {
    setAnchorEl(null);
    
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
                
               
                        <div>
                            <div className='kanban-controls'>
                            <Button
        id="demo-customized-button"
        aria-controls={open ? 'demo-customized-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        variant="contained"
        disableElevation
        onClick={handleClick}
        endIcon={<KeyboardArrowDownIcon />}
        style={{ maxHeight: '40px', minWidth: '100px' }} 
      >
        Create
      </Button>
      <StyledMenu
        id="demo-customized-menu"
        MenuListProps={{
          'aria-labelledby': 'demo-customized-button',
        }}
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
      >
        <MenuItem onClick={handleCloseA} disableRipple>
        
          Create Task
        </MenuItem>
        <MenuItem onClick={handleClose} disableRipple>
         
          Create Board
        </MenuItem>
       
        <MenuItem onClick={handleClose} disableRipple>
        
          Create Sprint
        </MenuItem>
      </StyledMenu>
     
      <FormControlLabel
    control={<Checkbox checked={filters.showBacklog} onChange={handleCheckboxChange} />}
    label="Backlog"
/>

    
  
<Stack spacing={0} sx={{ minWidth: 350 }}>
                            <Autocomplete
                                multiple
                                id="tags-outlined"
                                options={uniqueKanbanIds}
                                getOptionLabel={(option) => option.title}
                                onChange={handleKanbanIdChange}
                                renderInput={(params) => (
                                    <TextField {...params} placeholder="Board" />
                                )}
                            />
                        </Stack>

    <Stack spacing={0} sx={{ minWidth: 350 }}>
        
     
      <Autocomplete
        multiple
        id="tags-outlined"
        options={Sprint}
        getOptionLabel={(option) => option.title}
        onChange={handleSprintChange}
        defaultValue={[Sprint[0]]}
        filterSelectedOptions
        renderInput={(params) => (
          <TextField
            {...params}
            
            placeholder="Sprint"
          />
        )}
      />
  
   
    </Stack>
    </div>
                            </div>
      
                <div className="columns">
                {Object.keys(filteredTasks).map(status => {
        if (status === "Backlog" && !filters.showBacklog) {
            return null; // Если showBacklog false, не рендерим столбец
        }
                    return(
                        <div
                            key={status}
                            className="column"
                            draggable
                            onDrop={e => handleDrop(status, e)}
                            onDragOver={e => e.preventDefault()}
                            
                        >
                            <h2 className="column-header">{status}</h2>
                            {filteredTasks[status].map(task => (
                                <div key={task.task_id} className="task" style={{ backgroundColor: task.backgroundColor }} draggable onDragStart={e => handleDragStart(e, task.task_id)}>
                                    <div className="task-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div className='task-user'>
                                        <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>Jira Software</title><path d="M12.004 0c-2.35 2.395-2.365 6.185.133 8.585l3.412 3.413-3.197 3.198a6.501 6.501 0 0 1 1.412 7.04l9.566-9.566a.95.95 0 0 0 0-1.344L12.004 0zm-1.748 1.74L.67 11.327a.95.95 0 0 0 0 1.344C4.45 16.44 8.22 20.244 12 24c2.295-2.298 2.395-6.096-.08-8.533l-3.47-3.469 3.2-3.2c-1.918-1.955-2.363-4.725-1.394-7.057z"/></svg>
                                        </div>
                                        <div className="task-name" style={{ flexGrow: 1, margin: '0 10px' }} >
                                            {/* Убедитесь, что путь правильный */}
                                            <Link to={`/tasks/${task.task_id}`} onClick={() => openEditModal(task)}>
                                                <b>{task.name}</b>
                                            </Link>
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
                    );
                })}
                </div>
                
                {modalOpen && (
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
        transform: modalOpen ? 'translateX(0)' : 'translateX(100%)'
    }}>
        <div className='modal-header'>Добавить задачу</div>
        <textarea
            ref={nameRef}
            value={taskName}
            onChange={e => setTaskName(e.target.value)}
            placeholder="Название задачи"
            className='modal-name'
        />
        <div className='modal-actions'>
            <button className='modal-save' onClick={handleAddTask}>Добавить</button>
            <button className='modal-close' onClick={() => setModalOpen(false)}>Закрыть</button>
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
        <div className='modal-details'>
                            <div className='modal-details-header'><b>People</b></div>
                          <div><select
                            type="select"
                            value={assignee}
                            onChange={e => setAssignee(e.target.value)}
                            placeholder="Исполнитель"
                            className='modal-kanbanid'
                        >
                            <option value="Евгений">Евгений</option>
                            <option value="Александра">Александра</option>  
                        </select></div> 
                        
                        
                        </div>
        <div className='modal-description-header'><b>Описание</b></div>
        <textarea
            ref={descriptionRef}
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Описание задачи"
            className='modal-desc'
        />
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
                        <div className='modal-header'>{task_id}</div>
                                              
                        <textarea
                        ref={nameRef}
                            value={taskName}
                            onChange={e => setTaskName(e.target.value)}
                            placeholder="Описание задачи"
                            className='modal-name'
                        />
                         
                        <div className='modal-actions'>
                        
                        <button className='modal-save' onClick={handleApplyChanges}>Применить</button>
                        
                        <Link to="/tasks">
                        <button className='modal-save'onClick={()=>{
                            if (window.confirm('Уверены что хотите удалить задачу?')) {
                                handleDeleteTask(editingTask.task_id)}}
                            }
                           
                            >Удалить</button>
                            </Link>
                            <Link to="/tasks">
                        <button className='modal-close' onClick={() => {
                            if (taskName !== editingTask.name || assignee !== editingTask.assignee || description !== editingTask.description) {
                                if (window.confirm('Уверены что хотите закрыть без изменений?')) {
                                    resetTaskInputs();
                                }
                            } else {
                                resetTaskInputs();
                            }
                        }}>Закрыть</button>
                        </Link>
                        
                      
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
                        <div className='modal-details'>
                            <div className='modal-details-header'><b>People</b></div>
                          <div><select
                            type="select"
                            value={assignee}
                            onChange={e => setAssignee(e.target.value)}
                            placeholder="Исполнитель"
                            className='modal-kanbanid'
                        >
                            <option value="Евгений">Евгений</option>
                            <option value="Александра">Александра</option>  
                        </select></div> 
                        
                        
                        </div>
                        <div className='modal-description-header'><b>Description</b></div>
                        <textarea
                        ref={descriptionRef}
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
