import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Componente modal para ver/editar detalles de la tarea
const TaskDetailModal = ({ task, onClose, onSave, onDelete, minDate = new Date(), getUserFullName, isAdmin = false, username = '' }) => {
    const [editedTask, setEditedTask] = useState({ ...task });
    const [isEditing, setIsEditing] = useState(false);
    const [errors, setErrors] = useState({});
    // Usar el username que se pasa como prop, o si no, obtenerlo del localStorage
    const currentUsername = username || localStorage.getItem('username') || '';
    
    // Imprimir información de usuario para depuración
    console.log('TaskDetailModal - Información de usuario:', {
        username,
        currentUsername,
        fromLocalStorage: localStorage.getItem('username'),
        isAdmin,
        taskCreator: task?.created_by
    });
    
    // Función para formatear fechas
    const formatDate = (dateString) => {
        if (!dateString) return '';
        try {
            // Crear una nueva fecha y ajustar para GMT-6 (Mérida)
            const date = new Date(dateString);
            // Ajustar a GMT-6 (Mérida)
            const adjustedDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
            return format(adjustedDate, "dd/MM/yyyy HH:mm", { locale: es });
        } catch (e) {
            console.error("Error al formatear fecha:", e);
            return dateString;
        }
    };
    
    useEffect(() => {
        // Actualizar el estado local cuando cambia la tarea seleccionada
        setEditedTask({ ...task });
        setIsEditing(false);
        setErrors({});
    }, [task]);
    
    if (!task) return null;
    
    const validateForm = () => {
        const newErrors = {};
        
        if (!editedTask.text.trim()) {
            newErrors.text = 'Por favor, ingresa una descripción para la tarea.';
        }
        
        if (!editedTask.scheduled_date) {
            newErrors.scheduled_date = 'La fecha es obligatoria.';
        } else {
            const taskDate = new Date(editedTask.scheduled_date);
            const minDateTime = new Date(minDate);
            
            // Comparar solo las fechas sin la hora
            const taskDay = new Date(taskDate.getFullYear(), taskDate.getMonth(), taskDate.getDate());
            const minDay = new Date(minDateTime.getFullYear(), minDateTime.getMonth(), minDateTime.getDate());
            
            if (taskDay < minDay && taskDay.getTime() !== new Date(task.scheduled_date).setHours(0,0,0,0)) {
                newErrors.scheduled_date = 'La fecha debe ser hoy o posterior.';
            }
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    
    const handleSave = () => {
        if (validateForm()) {
            // Asegurarse de que los valores booleanos sean realmente booleanos
            const taskToSave = {
                ...editedTask,
                completed: editedTask.completed === true || editedTask.completed === "true",
                important: editedTask.important === true || editedTask.important === "true",
                private: editedTask.private === true || editedTask.private === "true"
            };
            console.log('Guardando tarea editada con valores:', taskToSave);
            onSave(taskToSave, false);
        }
    };
    
    const handleDelete = () => {
        onDelete(task.id);
    };
    
    // Determinar si el usuario puede editar la tarea
    // Verificar si el usuario actual es el creador o es admin
    const canEdit = () => {
        // Convertir a strings y comparar
        const creatorUsername = String(task.created_by || '').trim();
        const currentUser = String(currentUsername || '').trim();
        
        // Verificar si es el creador o admin
        const isCreator = creatorUsername === currentUser;
        const isAdminUser = currentUsername === 'admin' || isAdmin;
        
        console.log('Verificación de permisos:', {
            creatorUsername,
            currentUser,
            isCreator,
            isAdminUser,
            result: isCreator || isAdminUser
        });
        
        return isCreator || isAdminUser;
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h3 className="modal-title">{isEditing ? 'Editar Tarea' : 'Detalles de la Tarea'}</h3>
                
                <div className="modal-body">
                    <div className="form-group">
                        <label>Tarea: {isEditing && <span className="required">*</span>}</label>
                        <input 
                            type="text" 
                            value={editedTask.text} 
                            onChange={(e) => setEditedTask({...editedTask, text: e.target.value})}
                            disabled={!isEditing}
                            className={`form-input ${errors.text && isEditing ? 'error' : ''}`}
                        />
                        {errors.text && isEditing && <div className="error-text">{errors.text}</div>}
                    </div>
                    
                    <div className="form-group">
                        <label>Creado por:</label>
                        <div className="info-text">{getUserFullName(task.created_by)}</div>
                    </div>
                    
                    <div className="form-group">
                        <label>Fecha de creación:</label>
                        <div className="info-text">
                            {formatDate(task.created_at)}
                        </div>
                    </div>
                    
                    <div className="form-group">
                        <label>Estado:</label>
                        {isEditing ? (
                            <select 
                                value={editedTask.completed ? "true" : "false"}
                                onChange={(e) => setEditedTask({
                                    ...editedTask, 
                                    completed: e.target.value === "true"
                                })}
                                className="form-select"
                            >
                                <option value="false">Pendiente</option>
                                <option value="true">Completada</option>
                            </select>
                        ) : (
                            <div className="info-text">
                                {task.completed ? 'Completada' : 'Pendiente'}
                            </div>
                        )}
                    </div>
                    
                    <div className="form-group">
                        <label>Importante:</label>
                        {isEditing ? (
                            <select 
                                value={editedTask.important ? "true" : "false"}
                                onChange={(e) => setEditedTask({
                                    ...editedTask, 
                                    important: e.target.value === "true"
                                })}
                                className="form-select"
                            >
                                <option value="false">No</option>
                                <option value="true">Sí</option>
                            </select>
                        ) : (
                            <div className="info-text">
                                {task.important ? 'Sí' : 'No'}
                            </div>
                        )}
                    </div>
                    
                    <div className="form-group">
                        <label>Privado:</label>
                        {isEditing ? (
                            <select 
                                value={editedTask.private ? "true" : "false"}
                                onChange={(e) => setEditedTask({
                                    ...editedTask, 
                                    private: e.target.value === "true"
                                })}
                                className="form-select"
                            >
                                <option value="false">No (Visible para todos)</option>
                                <option value="true">Sí (Solo visible para mí)</option>
                            </select>
                        ) : (
                            <div className="info-text">
                                {task.private ? 'Sí (Solo visible para mí)' : 'No (Visible para todos)'}
                            </div>
                        )}
                    </div>
                    
                    <div className="form-group">
                        <label>Fecha programada: {isEditing && <span className="required">*</span>}</label>
                        {isEditing ? (
                            <>
                                <input 
                                    type="datetime-local" 
                                    value={editedTask.scheduled_date ? new Date(editedTask.scheduled_date).toISOString().slice(0, 16) : ''}
                                    onChange={(e) => setEditedTask({
                                        ...editedTask, 
                                        scheduled_date: e.target.value ? new Date(e.target.value).toISOString() : null
                                    })}
                                    className={`form-input ${errors.scheduled_date ? 'error' : ''}`}
                                    min={new Date(minDate).toISOString().slice(0, 16)}
                                    required
                                />
                                {errors.scheduled_date && <div className="error-text">{errors.scheduled_date}</div>}
                            </>
                        ) : (
                            <div className="info-text">
                                {task.scheduled_date ? formatDate(task.scheduled_date) : 'No programada'}
                            </div>
                        )}
                    </div>
                    
                    <div className="form-group">
                        <label>Notas adicionales:</label>
                        {isEditing ? (
                            <textarea 
                                value={editedTask.notes || ''}
                                onChange={(e) => setEditedTask({...editedTask, notes: e.target.value})}
                                className="form-textarea"
                            />
                        ) : (
                            <div className="info-text">{task.notes || 'Sin notas'}</div>
                        )}
                    </div>
                </div>
                
                <div className="modal-footer">
                    {isEditing ? (
                        <>
                            <button 
                                className="btn save-btn" 
                                onClick={handleSave}
                            >
                                Guardar
                            </button>
                            <button 
                                className="btn cancel-btn" 
                                onClick={() => {
                                    setEditedTask({...task});
                                    setIsEditing(false);
                                    setErrors({});
                                }}
                            >
                                Cancelar
                            </button>
                        </>
                    ) : (
                        <>
                            {canEdit() && (
                                <>
                                    <button 
                                        className="btn edit-btn" 
                                        onClick={() => {
                                            console.log('Edit button clicked');
                                            setIsEditing(true);
                                        }}
                                    >
                                        Editar
                                    </button>
                                    <button 
                                        className="btn delete-btn" 
                                        onClick={() => {
                                            console.log('Delete button clicked');
                                            handleDelete();
                                        }}
                                    >
                                        Eliminar
                                    </button>
                                </>
                            )}
                            <button 
                                className="btn close-btn" 
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

export default TaskDetailModal;
