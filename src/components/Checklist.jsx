// src/components/Checklist.jsx
import React, { useState, useEffect, useCallback } from "react";
import { getApiEndpoint } from '../config';
import Calendar from 'react-calendar';
import { format, isEqual, isSameDay, parseISO, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import 'react-calendar/dist/Calendar.css';

const BASE_URL = getApiEndpoint('');

// Mapeo de usernames a nombres completos
const USER_NAMES = {
    'admin': 'Raul Cetina',
    'Admin': 'Raul Cetina',
    'raul': 'Raul Cetina',
    'juan': 'Juan Pérez',
    'maria': 'María García',
    'carlos': 'Carlos Rodríguez',
    'ana': 'Ana López'
};

// Función para obtener el nombre completo a partir del username
const getUserFullName = (username) => {
    return USER_NAMES[username] || username;
};

// Componente para la tarea individual del checklist
const ChecklistItem = ({ task, onToggle, onItemClick, onDelete, canDelete }) => {
    // Función para formatear fechas
    const formatDate = (dateString) => {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (e) {
            console.error("Error al formatear fecha:", e);
            return dateString;
        }
    };
    
    return (
        <div 
            style={styles.checklistItem}
            onClick={() => onItemClick(task)}
        >
            <div style={styles.checkboxContainer} onClick={(e) => e.stopPropagation()}>
                <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={(e) => {
                        onToggle(task.id);
                    }}
                    style={styles.checkbox}
                />
            </div>
            <div style={styles.taskContent}>
                <div style={{
                    ...styles.taskText,
                    textDecoration: task.completed ? 'line-through' : 'none'
                }}>
                    {task.text}
                    {task.important && <span style={styles.importantBadge}>Importante</span>}
                    {task.private && <span style={styles.privateBadge}>Privado</span>}
                </div>
                <div style={styles.taskMetaContainer}>
                    <div style={styles.taskMeta}>
                        <span>Por: {getUserFullName(task.created_by)}</span>
                    </div>
                    <div style={styles.taskMeta}>
                        <span>{formatDate(task.created_at)}</span>
                    </div>
                </div>
            </div>
            {canDelete && (
                <button 
                    style={styles.deleteButton}
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete(task.id);
                    }}
                >
                    Eliminar
                </button>
            )}
        </div>
    );
};

// Componente modal para ver/editar detalles de la tarea
const TaskDetailModal = ({ task, onClose, onSave, isAdmin, onDelete }) => {
    const [editedTask, setEditedTask] = useState({ ...task });
    const [isEditing, setIsEditing] = useState(false);
    
    // Función para formatear fechas
    const formatDate = (dateString) => {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (e) {
            console.error("Error al formatear fecha:", e);
            return dateString;
        }
    };
    
    useEffect(() => {
        // Actualizar el estado local cuando cambia la tarea seleccionada
        setEditedTask({ ...task });
        setIsEditing(false);
    }, [task]);
    
    if (!task) return null;
    
    const handleSave = () => {
        onSave(editedTask, false);
    };
    
    const handleDelete = () => {
        onDelete(task.id);
    };
    
    return (
        <div style={styles.modalOverlay}>
            <div style={styles.modalContent}>
                <h3 style={styles.modalTitle}>{isEditing ? 'Editar Tarea' : 'Detalles de la Tarea'}</h3>
                
                <div style={styles.modalBody}>
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Tarea:</label>
                        <input 
                            type="text" 
                            value={editedTask.text} 
                            onChange={(e) => setEditedTask({...editedTask, text: e.target.value})}
                            style={styles.input}
                            disabled={!isEditing}
                        />
                    </div>
                    
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Creado por:</label>
                        <div style={styles.infoText}>{getUserFullName(task.created_by)}</div>
                    </div>
                    
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Fecha de creación:</label>
                        <div style={styles.infoText}>
                            {formatDate(task.created_at)}
                        </div>
                    </div>
                    
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Estado:</label>
                        {isEditing ? (
                            <select 
                                value={editedTask.completed ? "true" : "false"}
                                onChange={(e) => setEditedTask({
                                    ...editedTask, 
                                    completed: e.target.value === "true"
                                })}
                                style={styles.input}
                            >
                                <option value="false">Pendiente</option>
                                <option value="true">Completada</option>
                            </select>
                        ) : (
                            <div style={styles.infoText}>
                                {task.completed ? 'Completada' : 'Pendiente'}
                            </div>
                        )}
                    </div>
                    
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Importante:</label>
                        {isEditing ? (
                            <select 
                                value={editedTask.important ? "true" : "false"}
                                onChange={(e) => setEditedTask({
                                    ...editedTask, 
                                    important: e.target.value === "true"
                                })}
                                style={styles.input}
                            >
                                <option value="false">No</option>
                                <option value="true">Sí</option>
                            </select>
                        ) : (
                            <div style={styles.infoText}>
                                {task.important ? 'Sí' : 'No'}
                            </div>
                        )}
                    </div>
                    
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Privado:</label>
                        {isEditing ? (
                            <select 
                                value={editedTask.private ? "true" : "false"}
                                onChange={(e) => setEditedTask({
                                    ...editedTask, 
                                    private: e.target.value === "true"
                                })}
                                style={styles.input}
                            >
                                <option value="false">No (Visible para todos)</option>
                                <option value="true">Sí (Solo visible para mí)</option>
                            </select>
                        ) : (
                            <div style={styles.infoText}>
                                {task.private ? 'Sí (Solo visible para mí)' : 'No (Visible para todos)'}
                            </div>
                        )}
                    </div>
                    
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Fecha programada:</label>
                        {isEditing ? (
                            <input 
                                type="datetime-local" 
                                value={editedTask.scheduled_date ? new Date(editedTask.scheduled_date).toISOString().slice(0, 16) : ''}
                                onChange={(e) => setEditedTask({
                                    ...editedTask, 
                                    scheduled_date: e.target.value ? new Date(e.target.value).toISOString() : null
                                })}
                                style={styles.input}
                            />
                        ) : (
                            <div style={styles.infoText}>
                                {task.scheduled_date ? formatDate(task.scheduled_date) : 'No programada'}
                            </div>
                        )}
                    </div>
                    
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Notas adicionales:</label>
                        {isEditing ? (
                            <textarea 
                                value={editedTask.notes || ''}
                                onChange={(e) => setEditedTask({...editedTask, notes: e.target.value})}
                                style={{...styles.input, height: '80px'}}
                            />
                        ) : (
                            <div style={styles.infoText}>{task.notes || 'Sin notas'}</div>
                        )}
                    </div>
                </div>
                
                <div style={styles.modalFooter}>
                    {isEditing ? (
                        <>
                            <button 
                                style={{...styles.button, ...styles.saveButton}} 
                                onClick={handleSave}
                            >
                                Guardar
                            </button>
                            <button 
                                style={{...styles.button, ...styles.cancelButton}} 
                                onClick={() => {
                                    setEditedTask({...task});
                                    setIsEditing(false);
                                }}
                            >
                                Cancelar
                            </button>
                        </>
                    ) : (
                        <>
                            <button 
                                style={{...styles.button, ...styles.editButton}} 
                                onClick={() => setIsEditing(true)}
                            >
                                Editar
                            </button>
                            {onDelete && (
                                <button 
                                    style={{...styles.button, ...styles.deleteButton}} 
                                    onClick={handleDelete}
                                >
                                    Eliminar
                                </button>
                            )}
                            <button 
                                style={{...styles.button, ...styles.closeButton}} 
                                onClick={onClose}
                            >
                                Cerrar
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

// Componente modal para agregar nueva tarea
const AddTaskModal = ({ onClose, onSave, username, initialDate }) => {
    const [newTask, setNewTask] = useState({
        text: '',
        completed: false,
        created_by: username,
        notes: '',
        scheduled_date: initialDate ? initialDate.toISOString() : null,
        important: false,
        private: false
    });
    
    const handleSubmit = (e) => {
        e.preventDefault();
        if (!newTask.text.trim()) {
            alert('Por favor ingresa un texto para la tarea');
            return;
        }
        onSave(newTask, true);
    };
    
    return (
        <div style={styles.modalOverlay}>
            <div style={styles.modalContent}>
                <h3 style={styles.modalTitle}>Agregar Nueva Tarea</h3>
                
                <form onSubmit={handleSubmit} style={styles.modalBody}>
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Tarea:</label>
                        <input 
                            type="text" 
                            value={newTask.text} 
                            onChange={(e) => setNewTask({...newTask, text: e.target.value})}
                            style={styles.input}
                            placeholder="Descripción de la tarea"
                            required
                        />
                    </div>
                    
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Estado:</label>
                        <select 
                            value={newTask.completed ? "true" : "false"}
                            onChange={(e) => setNewTask({
                                ...newTask, 
                                completed: e.target.value === "true"
                            })}
                            style={styles.input}
                        >
                            <option value="false">Pendiente</option>
                            <option value="true">Completada</option>
                        </select>
                    </div>
                    
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Importante:</label>
                        <select 
                            value={newTask.important ? "true" : "false"}
                            onChange={(e) => setNewTask({
                                ...newTask, 
                                important: e.target.value === "true"
                            })}
                            style={styles.input}
                        >
                            <option value="false">No</option>
                            <option value="true">Sí</option>
                        </select>
                    </div>
                    
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Privado:</label>
                        <select 
                            value={newTask.private ? "true" : "false"}
                            onChange={(e) => setNewTask({
                                ...newTask, 
                                private: e.target.value === "true"
                            })}
                            style={styles.input}
                        >
                            <option value="false">No (Visible para todos)</option>
                            <option value="true">Sí (Solo visible para mí)</option>
                        </select>
                    </div>
                    
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Fecha programada (opcional):</label>
                        <input 
                            type="datetime-local" 
                            value={newTask.scheduled_date || ''}
                            onChange={(e) => setNewTask({
                                ...newTask, 
                                scheduled_date: e.target.value || null
                            })}
                            style={styles.input}
                        />
                    </div>
                    
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Notas adicionales (opcional):</label>
                        <textarea 
                            value={newTask.notes} 
                            onChange={(e) => setNewTask({...newTask, notes: e.target.value})}
                            style={{...styles.input, height: '80px'}}
                            placeholder="Información adicional sobre la tarea"
                        />
                    </div>
                    
                    <div style={styles.modalFooter}>
                        <button 
                            type="submit"
                            style={{...styles.button, ...styles.saveButton}}
                        >
                            Guardar
                        </button>
                        <button 
                            type="button"
                            style={{...styles.button, ...styles.closeButton}} 
                            onClick={onClose}
                        >
                            Cancelar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Componente principal del Checklist
const Checklist = () => {
    const [tasks, setTasks] = useState([]);
    const [filteredTasks, setFilteredTasks] = useState([]);
    const [selectedTask, setSelectedTask] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showCalendar, setShowCalendar] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [username, setUsername] = useState(''); // Inicialmente vacío
    const [showPrivate, setShowPrivate] = useState(false); // Estado para el filtro de privadas
    const [selectedDate, setSelectedDate] = useState(new Date()); // Fecha seleccionada para filtrar
    const [taskDates, setTaskDates] = useState([]); // Fechas que tienen tareas
    
    // Función para obtener el nombre de usuario actual
    useEffect(() => {
        // Obtener el usuario del localStorage (o de donde esté almacenado en la aplicación)
        const storedUsername = localStorage.getItem('username') || 'admin';
        setUsername(storedUsername);
    }, []);
    
    // Función para cargar las tareas
    const loadTasks = useCallback(async () => {
        setLoading(true);
        setError(null);
        
        try {
            // Añadir parámetros de consulta para el filtrado
            const queryParams = new URLSearchParams();
            queryParams.append('username', username);
            queryParams.append('show_private', showPrivate);
            
            const response = await fetch(`${BASE_URL}/checklist?${queryParams.toString()}`);
            
            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            setTasks(data);
            
            // Extraer todas las fechas que tienen tareas programadas
            const dates = data
                .filter(task => task.scheduled_date)
                .map(task => startOfDay(new Date(task.scheduled_date)).toISOString());
            
            // Eliminar duplicados
            setTaskDates([...new Set(dates)].map(dateStr => new Date(dateStr)));
            
            // Aplicar filtro de fecha
            filterTasksByDate(data, selectedDate);
        } catch (err) {
            console.error("Error al cargar las tareas:", err);
            setError(`Error al cargar las tareas: ${err.message}`);
        } finally {
            setLoading(false);
        }
    }, [username, showPrivate, selectedDate]); // Añadir selectedDate como dependencia
    
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
                isSameDay(parseISO(task.scheduled_date), today) // Tareas programadas para hoy
            ));
        } else {
            // Si es otra fecha, mostrar solo las tareas de esa fecha
            setFilteredTasks(allTasks.filter(task => 
                task.scheduled_date && isSameDay(parseISO(task.scheduled_date), selectedDay)
            ));
        }
    };
    
    // Cargar tareas al montar el componente o cuando cambian los filtros
    useEffect(() => {
        if (username) {
            loadTasks();
        }
    }, [loadTasks, username]);
    
    // Actualizar tareas filtradas cuando cambia la fecha seleccionada
    useEffect(() => {
        filterTasksByDate(tasks, selectedDate);
    }, [selectedDate, tasks]);
    
    // Función para marcar una tarea como completada/pendiente
    const handleToggleTask = async (taskId) => {
        try {
            const taskToUpdate = tasks.find(task => task.id === taskId);
            if (!taskToUpdate) return;
            
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
            if (isNew) {
                // Crear nueva tarea
                const response = await fetch(`${BASE_URL}/checklist/`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(taskData),
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
                    body: JSON.stringify(taskData),
                });
                
                if (!response.ok) {
                    throw new Error(`Error ${response.status}: ${response.statusText}`);
                }
                
                // Actualizar el estado local
                const updatedTasks = tasks.map(task => 
                    task.id === taskData.id ? taskData : task
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
        setShowPrivate(!showPrivate);
    };
    
    // Función para manejar el cambio de fecha en el calendario
    const handleDateChange = (date) => {
        setSelectedDate(date);
        setShowCalendar(false);
    };
    
    // Función para determinar si una fecha tiene tareas (para mostrar puntos en el calendario)
    const tileContent = ({ date, view }) => {
        if (view !== 'month') return null;
        
        // Verificar si hay tareas para esta fecha
        const hasTasksOnDate = taskDates.some(taskDate => isSameDay(taskDate, date));
        
        return hasTasksOnDate ? (
            <div style={styles.calendarDot}></div>
        ) : null;
    };
    
    // Función para formatear la fecha seleccionada
    const formatSelectedDate = (date) => {
        return format(date, "dd/MM", { locale: es });
    };
    
    return (
        <div style={styles.pageContainer}>
            <div style={styles.container}>
                <h2 style={styles.title}>Pendientes</h2>
                
                <div style={styles.filterContainer}>
                    <div style={styles.filterButtons}>
                        <button 
                            style={styles.iconButton} 
                            onClick={() => setShowAddModal(true)}
                            title="Añadir nueva tarea"
                        >
                            <span role="img" aria-label="añadir">➕</span>
                        </button>
                        
                        <button 
                            style={{
                                ...styles.iconButton,
                                backgroundColor: showPrivate ? '#4CAF50' : '#f0f0f0',
                                color: showPrivate ? 'white' : '#333',
                            }} 
                            onClick={handleTogglePrivateFilter}
                            title={showPrivate ? "Mostrar todas las tareas" : "Mostrar solo tareas privadas"}
                        >
                            {showPrivate ? "Privado" : "General"}
                        </button>
                        
                        <button 
                            style={styles.iconButton} 
                            onClick={() => setShowCalendar(!showCalendar)}
                            title="Seleccionar fecha"
                        >
                            <span role="img" aria-label="calendario">📅</span> {formatSelectedDate(selectedDate)}
                        </button>
                    </div>
                </div>
                
                {showCalendar && (
                    <div style={styles.calendarContainer}>
                        <Calendar 
                            onChange={handleDateChange}
                            value={selectedDate}
                            locale="es-ES"
                            tileContent={tileContent}
                        />
                    </div>
                )}
                
                {error && <div style={styles.error}>{error}</div>}
                
                {loading ? (
                    <div style={styles.loading}>Cargando tareas...</div>
                ) : (
                    <div style={styles.taskList}>
                        {filteredTasks.length === 0 ? (
                            <div style={styles.emptyMessage}>
                                No hay tareas para {formatSelectedDate(selectedDate)}. ¡Añade una nueva tarea!
                            </div>
                        ) : (
                            filteredTasks.map(task => (
                                <ChecklistItem 
                                    key={task.id}
                                    task={task}
                                    onToggle={handleToggleTask}
                                    onItemClick={handleTaskClick}
                                    onDelete={handleDeleteTask}
                                    canDelete={task.created_by === username}
                                />
                            ))
                        )}
                    </div>
                )}
                
                {showAddModal && (
                    <AddTaskModal 
                        onClose={() => setShowAddModal(false)}
                        onSave={handleSaveTask}
                        username={username}
                        initialDate={selectedDate}
                    />
                )}
                
                {showDetailModal && selectedTask && (
                    <TaskDetailModal 
                        task={selectedTask}
                        onClose={() => setShowDetailModal(false)}
                        onSave={handleSaveTask}
                        onDelete={selectedTask.created_by === username ? handleDeleteTask : null}
                        isAdmin={username === 'admin'}
                    />
                )}
            </div>
        </div>
    );
};

// Datos de ejemplo para usar mientras el backend se implementa
const MOCK_TASKS = [
    {
        id: 1,
        text: "Verificar inventario de palos",
        completed: false,
        created_by: "Admin",
        created_at: "2025-05-01T10:00:00",
        scheduled_date: "2025-05-03T14:00:00",
        notes: "Revisar especialmente los palos de la marca TaylorMade",
        important: true
    },
    {
        id: 2,
        text: "Llamar al proveedor de bolsas",
        completed: true,
        created_by: "Admin",
        created_at: "2025-04-28T09:30:00",
        scheduled_date: null,
        notes: "Preguntar por el nuevo modelo de bolsas",
        important: false
    },
    {
        id: 3,
        text: "Actualizar sistema de inventario",
        completed: false,
        created_by: "Admin",
        created_at: "2025-05-02T08:15:00",
        scheduled_date: "2025-05-05T11:00:00",
        notes: "Incluir nuevos campos para mantenimiento",
        important: true
    }
];

// Estilos
const styles = {
    pageContainer: {
        display: 'flex',
        justifyContent: 'center',
        width: '100%',
        padding: '0 40px',
    },
    container: {
        width: '100%',
        maxWidth: '1000px',
        margin: '20px auto',
        padding: '30px',
        backgroundColor: '#f9f9f9',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    },
    title: {
        margin: 0,
        fontSize: '24px',
        color: '#333',
        marginBottom: '20px',
        textAlign: 'center',
    },
    taskList: {
        marginTop: '20px',
    },
    checklistItem: {
        display: 'flex',
        alignItems: 'center',
        padding: '15px 20px',
        backgroundColor: 'white',
        borderRadius: '8px',
        marginBottom: '10px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        cursor: 'pointer',
        transition: 'transform 0.2s, box-shadow 0.2s',
        position: 'relative',
    },
    checkboxContainer: {
        marginRight: '15px',
    },
    checkbox: {
        width: '20px',
        height: '20px',
        cursor: 'pointer',
    },
    taskContent: {
        flex: 1,
    },
    taskText: {
        flex: 1,
        fontSize: '14px',
        paddingLeft: '20px',
        paddingRight: '20px',
        color: '#212529',
        marginBottom: '4px',
        wordBreak: 'break-word',
    },
    taskMetaContainer: {
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '12px',
        color: '#6c757d',
        paddingLeft: '20px',
        paddingRight: '20px',
    },
    taskMeta: {
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '12px',
        color: '#6c757d',
        paddingLeft: '20px',
        paddingRight: '20px',
    },
    button: {
        padding: '8px 16px',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: 'bold',
        transition: 'background-color 0.3s',
    },
    iconButton: {
        padding: '8px 12px',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '16px',
        fontWeight: 'bold',
        transition: 'background-color 0.3s',
        backgroundColor: '#4CAF50',
        color: 'white',
    },
    addButton: {
        backgroundColor: '#28a745',
        color: 'white',
    },
    deleteButton: {
        backgroundColor: '#dc3545',
        color: 'white',
        padding: '6px 12px',
        borderRadius: '4px',
        border: 'none',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: 'bold',
    },
    error: {
        padding: '10px',
        backgroundColor: '#f8d7da',
        color: '#721c24',
        borderRadius: '4px',
        marginBottom: '15px',
        fontSize: '14px',
    },
    loading: {
        padding: '15px',
        textAlign: 'center',
        color: '#6c757d',
        fontSize: '16px',
    },
    emptyMessage: {
        padding: '20px',
        textAlign: 'center',
        color: '#6c757d',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    },
    modalOverlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
    },
    modalContent: {
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        width: '90%',
        maxWidth: '500px',
        maxHeight: '90vh',
        overflow: 'auto',
        position: 'relative',
        zIndex: 10000,
    },
    modalTitle: {
        margin: '0 0 15px 0',
        fontSize: '18px',
        color: '#333',
    },
    modalBody: {
        marginBottom: '20px',
    },
    modalFooter: {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '10px',
        marginTop: '20px',
    },
    formGroup: {
        marginBottom: '15px',
    },
    label: {
        display: 'block',
        marginBottom: '5px',
        fontSize: '14px',
        fontWeight: 'bold',
        color: '#333',
    },
    input: {
        width: '100%',
        padding: '8px 12px',
        border: '1px solid #ced4da',
        borderRadius: '4px',
        fontSize: '14px',
    },
    infoText: {
        padding: '8px 12px',
        backgroundColor: '#f8f9fa',
        borderRadius: '4px',
        fontSize: '14px',
    },
    saveButton: {
        backgroundColor: '#007bff',
        color: 'white',
    },
    editButton: {
        backgroundColor: '#6c757d',
        color: 'white',
    },
    cancelButton: {
        backgroundColor: '#6c757d',
        color: 'white',
    },
    closeButton: {
        backgroundColor: '#6c757d',
        color: 'white',
    },
    importantBadge: {
        fontSize: '12px',
        color: 'red',
        marginLeft: '5px',
    },
    privateBadge: {
        fontSize: '12px',
        color: 'blue',
        marginLeft: '5px',
    },
    filterContainer: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '15px',
    },
    filterButtons: {
        display: 'flex',
        gap: '10px',
    },
    calendarContainer: {
        padding: '20px',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
        position: 'relative',
        zIndex: 10000,
        margin: '0 auto 20px auto',
        maxWidth: '350px',
    },
    calendarDot: {
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        backgroundColor: '#007bff',
        position: 'absolute',
        bottom: '3px',
        left: '50%',
        transform: 'translateX(-50%)',
    },
};

export default Checklist;
