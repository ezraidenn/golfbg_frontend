import React, { useState, useEffect, useCallback } from 'react';
import { getApiEndpoint } from '../config';
import { format, isEqual, isSameDay, parseISO, startOfDay, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

// Importar componentes
import ChecklistItem from './ChecklistItem';
import TaskDetailModal from './TaskDetailModal';
import AddTaskModal from './AddTaskModal';

// Importar estilos
import './Checklist.css';

const BASE_URL = getApiEndpoint('');

// Componente principal del Checklist
const ChecklistModerno = ({ username = '' }) => {
    const [tasks, setTasks] = useState([]);
    const [filteredTasks, setFilteredTasks] = useState([]);
    const [selectedTask, setSelectedTask] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showCalendar, setShowCalendar] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentUsername, setCurrentUsername] = useState(username || localStorage.getItem('username') || 'admin');
    const [isAdmin, setIsAdmin] = useState(false);
    const [showPrivate, setShowPrivate] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [taskDates, setTaskDates] = useState([]);
    const [users, setUsers] = useState({});

    // Ajustar zona horaria para Mérida, Yucatán (UTC-6)
    const adjustTimeZone = (date) => {
        if (!date) return null;
        const newDate = new Date(date);
        return newDate;
    };

    // Ensure the current username and admin status are correctly set
    useEffect(() => {
        let storedUsername = username || localStorage.getItem('username') || 'admin';
        setCurrentUsername(storedUsername);

        const userRole = localStorage.getItem('userRole') || '';
        const isAdminUser = userRole.toLowerCase() === 'admin' || storedUsername.toLowerCase() === 'admin';
        setIsAdmin(isAdminUser);
        console.log('User role and admin status set:', { storedUsername, userRole, isAdminUser });
        
        // Imprimir información adicional para depuración
        console.log('Información de usuario actual:', {
            username,
            storedUsername,
            fromLocalStorage: localStorage.getItem('username'),
            finalUsername: storedUsername,
            userRole,
            isAdminUser
        });

        fetchUsers();
    }, [username]);

    // Función para obtener la lista de usuarios
    const fetchUsers = async () => {
        try {
            // Usar el mapa estático en lugar de intentar obtener los usuarios de la API
            // ya que el endpoint /users/ está dando 404
            setUsers({
                'admin': 'Raul Cetina',
                'Admin': 'Raul Cetina',
                'raul': 'Raul Cetina',
                'juan': 'Juan Pérez',
                'maria': 'María García',
                'carlos': 'Carlos Rodríguez',
                'ana': 'Ana López',
                'Usuario': 'Usuario'
            });
        } catch (error) {
            console.error("Error al cargar usuarios:", error);
            // Usar el mapa estático en caso de error
            setUsers({
                'admin': 'Raul Cetina',
                'Admin': 'Raul Cetina',
                'raul': 'Raul Cetina',
                'juan': 'Juan Pérez',
                'maria': 'María García',
                'carlos': 'Carlos Rodríguez',
                'ana': 'Ana López',
                'Usuario': 'Usuario'
            });
        }
    };

    // Función para obtener el nombre completo de un usuario
    const getUserFullName = (username) => {
        return users[username] || username;
    };

    // Función para verificar si una tarea es privada (puede venir como boolean o como 0/1)
    const isPrivate = (task) => {
        // Considerar cualquier valor que pueda representar "verdadero"
        return task.private === true || 
               task.private === 1 || 
               task.private === "1" || 
               task.private === "true" || 
               Number(task.private) > 0;
    };

    // Load tasks and apply filtering logic
    const loadTasks = useCallback(async () => {
        if (!currentUsername) return;

        setLoading(true);
        setError(null);

        try {
            // Usar la URL básica sin parámetros
            const response = await fetch(`${BASE_URL}/checklist`);

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const allTasks = await response.json();
            console.log('All tasks loaded:', allTasks);
            
            // Examinar cada tarea para ver sus propiedades
            allTasks.forEach((task, index) => {
                console.log(`Tarea ${index}:`, {
                    id: task.id,
                    text: task.text,
                    created_by: task.created_by,
                    private: task.private,
                    privateType: typeof task.private,
                    isPrivateResult: isPrivate(task)
                });
            });
            
            // Verificar si hay tareas privadas en la respuesta
            const privateTasksCount = allTasks.filter(task => isPrivate(task)).length;
            console.log(`Tareas privadas en la respuesta: ${privateTasksCount}`);
            
            // Verificar tareas del usuario actual
            const userTasks = allTasks.filter(task => task.created_by === currentUsername);
            console.log(`Tareas del usuario ${currentUsername}: ${userTasks.length}`);
            
            // Verificar tareas privadas del usuario actual
            const userPrivateTasks = allTasks.filter(task => isPrivate(task) && task.created_by === currentUsername);
            console.log(`Tareas privadas del usuario ${currentUsername}: ${userPrivateTasks.length}`);

            let filteredTasks = [];

            // Simplificar la lógica de filtrado
            if (showPrivate) {
                // En modo privado, mostrar solo las tareas privadas del usuario actual
                filteredTasks = allTasks.filter(task => isPrivate(task) && task.created_by === currentUsername);
                console.log('Mostrando tareas privadas del usuario:', filteredTasks.length);
            } else {
                // En modo general:
                // 1. Para admin: mostrar solo tareas no privadas
                // 2. Para usuario normal: mostrar tareas públicas + sus tareas privadas
                if (isAdmin) {
                    // Admin ve solo tareas no privadas
                    filteredTasks = allTasks.filter(task => !isPrivate(task));
                    console.log('Admin viendo tareas no privadas:', filteredTasks.length);
                } else {
                    // Usuario normal ve tareas públicas + sus tareas privadas
                    filteredTasks = allTasks.filter(task => 
                        !isPrivate(task) || (isPrivate(task) && task.created_by === currentUsername)
                    );
                    console.log('Usuario viendo tareas generales:', filteredTasks.length);
                }
            }

            console.log('Filtered tasks:', {
                currentUsername,
                isAdmin,
                showPrivate,
                filteredCount: filteredTasks.length,
                filtered: filteredTasks
            });
            setTasks(filteredTasks);

            // Extraer todas las fechas que tienen tareas programadas
            const dates = filteredTasks
                .filter(task => task.scheduled_date)
                .map(task => {
                    const date = adjustTimeZone(new Date(task.scheduled_date));
                    return startOfDay(date);
                });

            // Eliminar duplicados y convertir a objetos Date
            const uniqueDates = [...new Set(dates.map(date => date.toISOString()))];
            setTaskDates(uniqueDates.map(dateStr => new Date(dateStr)));

            // Aplicar filtro de fecha
            filterTasksByDate(filteredTasks, selectedDate);
        } catch (error) {
            console.error('Error loading tasks:', error);
            setError('Failed to load tasks. Please try again later.');
        } finally {
            setLoading(false);
        }
    }, [currentUsername, isAdmin, showPrivate]);

    useEffect(() => {
        loadTasks();
    }, [loadTasks]);

    // Función para filtrar tareas por fecha
    const filterTasksByDate = (allTasks, date) => {
        if (!date) {
            setFilteredTasks(allTasks);
            return;
        }

        const today = startOfDay(new Date());
        const selectedDay = startOfDay(new Date(date));

        // Si la fecha seleccionada es hoy, mostrar tareas de hoy y tareas sin fecha
        if (isEqual(selectedDay, today)) {
            setFilteredTasks(allTasks.filter(task =>
                !task.scheduled_date || // Tareas sin fecha programada
                isSameDay(adjustTimeZone(parseISO(task.scheduled_date)), today) // Tareas programadas para hoy
            ));
        } else {
            // Si es otra fecha, mostrar solo las tareas de esa fecha
            setFilteredTasks(allTasks.filter(task =>
                task.scheduled_date && isSameDay(adjustTimeZone(parseISO(task.scheduled_date)), selectedDay)
            ));
        }
    };

    // Actualizar tareas filtradas cuando cambia la fecha seleccionada
    useEffect(() => {
        filterTasksByDate(tasks, selectedDate);
    }, [selectedDate, tasks]);

    // Función para marcar una tarea como completada/pendiente
    const handleToggleTask = async (taskId) => {
        try {
            const taskToUpdate = tasks.find(task => task.id === taskId);
            if (!taskToUpdate) return;

            // Permitir que cualquier usuario pueda marcar como completada cualquier tarea
            // No se requiere verificación de permisos para el toggle

            const updatedTask = {
                ...taskToUpdate,
                completed: !taskToUpdate.completed
            };

            const response = await fetch(`${BASE_URL}/checklist/${taskId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updatedTask),
            });

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            // Actualizar el estado local
            const updatedTasks = tasks.map(task =>
                task.id === taskId ? { ...task, completed: !task.completed } : task
            );
            setTasks(updatedTasks);

            // Actualizar las tareas filtradas
            filterTasksByDate(updatedTasks, selectedDate);
        } catch (err) {
            console.error("Error al actualizar la tarea:", err);
            setError(`Error al actualizar la tarea: ${err.message}`);
        }
    };

    // Función para abrir el modal de detalles
    const handleTaskClick = (task) => {
        setSelectedTask(task);
        setShowDetailModal(true);
    };

    // Función para guardar una tarea (nueva o editada)
    const handleSaveTask = async (taskData, isNew) => {
        try {
            // Asegurarse de que la tarea tenga el usuario actual
            const taskWithUser = {
                ...taskData,
                created_by: isNew ? currentUsername : taskData.created_by
            };

            // Verificar si el usuario puede editar esta tarea
            if (!isNew && !canEditTask(taskData)) {
                setError('No tienes permiso para modificar esta tarea');
                return;
            }

            if (isNew) {
                // Crear nueva tarea
                const response = await fetch(`${BASE_URL}/checklist/`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(taskWithUser),
                });

                if (!response.ok) {
                    throw new Error(`Error ${response.status}: ${response.statusText}`);
                }

                // Recargar las tareas
                await loadTasks();
                setShowAddModal(false);
            } else {
                // Actualizar tarea existente
                const response = await fetch(`${BASE_URL}/checklist/${taskData.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(taskWithUser),
                });

                if (!response.ok) {
                    throw new Error(`Error ${response.status}: ${response.statusText}`);
                }

                // Actualizar el estado local
                const updatedTasks = tasks.map(task =>
                    task.id === taskData.id ? taskWithUser : task
                );
                setTasks(updatedTasks);

                // Actualizar las tareas filtradas
                filterTasksByDate(updatedTasks, selectedDate);
                setShowDetailModal(false);
            }
        } catch (err) {
            console.error("Error al guardar la tarea:", err);
            setError(`Error al guardar la tarea: ${err.message}`);
        }
    };

    // Función para eliminar una tarea
    const handleDeleteTask = async (taskId) => {
        try {
            const taskToDelete = tasks.find(task => task.id === taskId);
            
            // Verificar si el usuario puede eliminar esta tarea
            if (!canEditTask(taskToDelete)) {
                setError('No tienes permiso para eliminar esta tarea');
                return;
            }
            
            const response = await fetch(`${BASE_URL}/checklist/${taskId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            // Actualizar el estado local
            const updatedTasks = tasks.filter(task => task.id !== taskId);
            setTasks(updatedTasks);

            // Actualizar las tareas filtradas
            filterTasksByDate(updatedTasks, selectedDate);
            setShowDetailModal(false);
        } catch (err) {
            console.error("Error al eliminar la tarea:", err);
            setError(`Error al eliminar la tarea: ${err.message}`);
        }
    };

    // Función para cambiar el filtro de tareas privadas
    const handleTogglePrivateFilter = () => {
        console.log('Cambiando filtro de privado:', !showPrivate);
        setShowPrivate(!showPrivate);
    };

    // Función para manejar el cambio de fecha en el calendario
    const handleDateChange = (date) => {
        setSelectedDate(date);
        setShowCalendar(false);
    };

    // Función para formatear la fecha seleccionada
    const formatSelectedDate = (date) => {
        return format(date, "dd/MM/yyyy", { locale: es });
    };

    // Renderizado condicional para el calendario
    const renderCalendar = () => {
        if (!showCalendar) return null;

        return (
            <div className="calendar-container">
                <DatePicker
                    selected={selectedDate}
                    onChange={handleDateChange}
                    inline
                    locale={es}
                    highlightDates={taskDates}
                    todayButton="Hoy"
                    minDate={new Date()} // Fecha mínima es hoy
                />
            </div>
        );
    };

    // Obtener la fecha mínima (hoy)
    const getMinDate = () => {
        return new Date();
    };

    // Verificar si el usuario puede editar/eliminar una tarea
    const canEditTask = (task) => {
        if (!task) return false;
        
        // Imprimir información detallada para depuración
        console.log('Verificando permisos de edición:', {
            taskCreator: task.created_by,
            currentUsername,
            isCreator: task.created_by === currentUsername,
            isAdmin,
            taskCreatorType: typeof task.created_by,
            currentUsernameType: typeof currentUsername
        });
        
        // El creador siempre puede editar sus propias tareas
        // Comparar como strings para evitar problemas de tipo
        if (String(task.created_by).trim() === String(currentUsername).trim()) {
            console.log('Usuario es creador de la tarea, tiene permiso');
            return true;
        }
        
        // Admin puede editar cualquier tarea
        if (currentUsername === 'admin' || isAdmin) {
            console.log('Usuario es admin, tiene permiso');
            return true;
        }
        
        console.log('Usuario no tiene permiso para editar esta tarea');
        return false;
    };

    return (
        <div className="checklist-container">
            <div className="checklist-header">
                <h1 className="checklist-title">Pendientes</h1>
                <div className="checklist-actions">
                    <button
                        className="btn add-btn"
                        onClick={() => setShowAddModal(true)}
                    >
                        <span className="icon">+</span>
                        <span className="text">Nueva</span>
                    </button>

                    <button
                        className={`btn filter-btn ${showPrivate ? 'active' : ''}`}
                        onClick={handleTogglePrivateFilter}
                    >
                        {showPrivate ? 'Privado' : 'General'}
                    </button>

                    <button
                        className="btn calendar-btn"
                        onClick={() => setShowCalendar(!showCalendar)}
                    >
                        <span className="icon">📅</span>
                        <span className="text">{formatSelectedDate(selectedDate)}</span>
                    </button>
                </div>
            </div>

            {renderCalendar()}

            {error && <div className="error-message">{error}</div>}

            <div className="checklist-content">
                {loading ? (
                    <div className="loading-spinner">
                        <div className="spinner"></div>
                        <p>Cargando tareas...</p>
                    </div>
                ) : filteredTasks.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">📝</div>
                        <p>No hay tareas para {formatSelectedDate(selectedDate)}</p>
                        <button
                            className="btn add-btn"
                            onClick={() => setShowAddModal(true)}
                        >
                            Añadir Nueva Tarea
                        </button>
                    </div>
                ) : (
                    <div className="tasks-list">
                        {filteredTasks.map(task => (
                            <ChecklistItem
                                key={task.id}
                                task={task}
                                onToggle={handleToggleTask}
                                onItemClick={handleTaskClick}
                                getUserFullName={getUserFullName}
                            />
                        ))}
                    </div>
                )}
            </div>

            {showAddModal && (
                <AddTaskModal
                    onClose={() => setShowAddModal(false)}
                    onSave={handleSaveTask}
                    username={currentUsername}
                    initialDate={selectedDate}
                    minDate={getMinDate()}
                />
            )}

            {showDetailModal && selectedTask && (
                <TaskDetailModal
                    task={selectedTask}
                    onClose={() => setShowDetailModal(false)}
                    onSave={handleSaveTask}
                    onDelete={handleDeleteTask}
                    minDate={getMinDate()}
                    getUserFullName={getUserFullName}
                    isAdmin={isAdmin}
                    username={currentUsername} // Pasar explícitamente el nombre de usuario
                />
            )}
        </div>
    );
};

export default ChecklistModerno;
