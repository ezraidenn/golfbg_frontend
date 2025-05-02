import React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Componente para mostrar un elemento individual de la lista de tareas
const ChecklistItem = ({ task, onToggle, onItemClick, getUserFullName }) => {
    // Función para formatear fechas
    const formatDate = (dateString) => {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            return format(date, "dd/MM/yyyy HH:mm", { locale: es });
        } catch (e) {
            console.error("Error al formatear fecha:", e);
            return dateString;
        }
    };
    
    return (
        <div className="checklist-item" onClick={() => onItemClick(task)}>
            <div className="checklist-item-checkbox">
                <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => onToggle(task.id)}
                    onClick={(e) => e.stopPropagation()}
                />
            </div>
            <div className="checklist-item-content">
                <div className={`checklist-item-text ${task.completed ? 'completed' : ''}`}>
                    {task.text}
                    {task.important && <span className="badge important">Importante</span>}
                    {task.private && <span className="badge private">Privado</span>}
                </div>
                <div className="checklist-item-meta">
                    <span className="creator">Por: {getUserFullName(task.created_by)}</span>
                    <span className="date">{formatDate(task.created_at)}</span>
                    {task.scheduled_date && (
                        <span className="scheduled-date">
                            Programada: {formatDate(task.scheduled_date)}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChecklistItem;
