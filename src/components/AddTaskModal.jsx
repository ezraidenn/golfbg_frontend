import React, { useState } from 'react';

// Componente modal para añadir una nueva tarea
const AddTaskModal = ({ onClose, onSave, username, initialDate, minDate = new Date() }) => {
    const [newTask, setNewTask] = useState({
        text: '',
        completed: false,
        created_by: username,
        notes: '',
        scheduled_date: initialDate ? initialDate.toISOString() : new Date().toISOString(), // Fecha obligatoria, por defecto hoy
        important: false,
        private: false
    });
    
    const [errors, setErrors] = useState({});
    
    const validateForm = () => {
        const newErrors = {};
        
        if (!newTask.text.trim()) {
            newErrors.text = 'Por favor, ingresa una descripción para la tarea.';
        }
        
        if (!newTask.scheduled_date) {
            newErrors.scheduled_date = 'La fecha es obligatoria.';
        } else {
            const taskDate = new Date(newTask.scheduled_date);
            const minDateTime = new Date(minDate);
            
            // Comparar solo las fechas sin la hora
            const taskDay = new Date(taskDate.getFullYear(), taskDate.getMonth(), taskDate.getDate());
            const minDay = new Date(minDateTime.getFullYear(), minDateTime.getMonth(), minDateTime.getDate());
            
            if (taskDay < minDay) {
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
                ...newTask,
                completed: newTask.completed === true || newTask.completed === "true",
                important: newTask.important === true || newTask.important === "true",
                private: newTask.private === true || newTask.private === "true"
            };
            console.log('Guardando tarea con valores:', taskToSave);
            onSave(taskToSave, true);
        }
    };
    
    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h3 className="modal-title">Añadir Nueva Tarea</h3>
                
                <div className="modal-body">
                    <div className="form-group">
                        <label>Descripción de la tarea: <span className="required">*</span></label>
                        <input 
                            type="text" 
                            value={newTask.text} 
                            onChange={(e) => setNewTask({...newTask, text: e.target.value})}
                            className={`form-input ${errors.text ? 'error' : ''}`}
                            placeholder="Describe la tarea a realizar"
                        />
                        {errors.text && <div className="error-text">{errors.text}</div>}
                    </div>
                    
                    <div className="form-group">
                        <label>Estado:</label>
                        <select 
                            value={newTask.completed ? "true" : "false"}
                            onChange={(e) => setNewTask({
                                ...newTask, 
                                completed: e.target.value === "true"
                            })}
                            className="form-select"
                        >
                            <option value="false">Pendiente</option>
                            <option value="true">Completada</option>
                        </select>
                    </div>
                    
                    <div className="form-group">
                        <label>Importante:</label>
                        <select 
                            value={newTask.important ? "true" : "false"}
                            onChange={(e) => setNewTask({
                                ...newTask, 
                                important: e.target.value === "true"
                            })}
                            className="form-select"
                        >
                            <option value="false">No</option>
                            <option value="true">Sí</option>
                        </select>
                    </div>
                    
                    <div className="form-group">
                        <label>Privado:</label>
                        <select 
                            value={newTask.private ? "true" : "false"}
                            onChange={(e) => setNewTask({
                                ...newTask, 
                                private: e.target.value === "true"
                            })}
                            className="form-select"
                        >
                            <option value="false">No (Visible para todos)</option>
                            <option value="true">Sí (Solo visible para mí)</option>
                        </select>
                    </div>
                    
                    <div className="form-group">
                        <label>Fecha programada: <span className="required">*</span></label>
                        <input 
                            type="datetime-local" 
                            value={newTask.scheduled_date ? new Date(newTask.scheduled_date).toISOString().slice(0, 16) : ''}
                            onChange={(e) => setNewTask({
                                ...newTask, 
                                scheduled_date: e.target.value ? new Date(e.target.value).toISOString() : null
                            })}
                            className={`form-input ${errors.scheduled_date ? 'error' : ''}`}
                            min={new Date(minDate).toISOString().slice(0, 16)}
                            required
                        />
                        {errors.scheduled_date && <div className="error-text">{errors.scheduled_date}</div>}
                    </div>
                    
                    <div className="form-group">
                        <label>Notas adicionales (opcional):</label>
                        <textarea 
                            value={newTask.notes} 
                            onChange={(e) => setNewTask({...newTask, notes: e.target.value})}
                            className="form-textarea"
                            placeholder="Información adicional sobre la tarea"
                        />
                    </div>
                </div>
                
                <div className="modal-footer">
                    <button 
                        className="btn save-btn" 
                        onClick={handleSave}
                    >
                        Guardar
                    </button>
                    <button 
                        className="btn cancel-btn" 
                        onClick={onClose}
                    >
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddTaskModal;
