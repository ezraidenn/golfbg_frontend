// src/components/Header.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styles from './Header.module.css';
import { API_URL } from '../utils/api';

const routeTitleMap = {
    '/': 'Inicio',
    '/login': 'Iniciar Sesión',
    '/bolsas': 'Inventario de Bolsas',
    '/miembros': 'Gestión de Miembros',
    '/mantenimientos': 'Mantenimientos',
    '/reportes': 'Reportes',
    '/auditoria': 'Auditoría',
    '/miperfil': 'Mi Perfil',
    '/admin': 'Administración',
    '/alerta': 'Alertas'
};

const Header = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const notificationRef = useRef(null);
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loadingNotifications, setLoadingNotifications] = useState(false);
    const [notificationError, setNotificationError] = useState(null);
    const [deletingNotification, setDeletingNotification] = useState(null);
    const [deletingAll, setDeletingAll] = useState(false);

    const pageTitle = routeTitleMap[location.pathname] || 'Gestión de Bastones';
    const showBackButton = location.pathname !== '/';

    const handleBack = () => navigate(-1);
    const handleProfileClick = () => navigate('/miperfil');

    const handleNotificationsClick = () => {
        setShowNotifications(!showNotifications);
    };

    // Función para cargar notificaciones desde el backend
    const loadNotifications = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        setLoadingNotifications(true);
        try {
            const response = await fetch(`${API_URL}/notifications/my`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                throw new Error(`Error ${response.status}`);
            }
            
            const data = await response.json();
            setNotifications(data);
            setUnreadCount(data.filter(n => !n.read).length);
        } catch (error) {
            console.error("Error cargando notificaciones:", error);
            setNotificationError("Error al cargar notificaciones");
        } finally {
            setLoadingNotifications(false);
        }
    };

    // Función para marcar notificaciones como leídas
    const markAsRead = async (notificationId) => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const response = await fetch(`${API_URL}/notifications/mark-read`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    notification_ids: [notificationId],
                    mark_all: false
                })
            });
            
            if (!response.ok) {
                throw new Error(`Error ${response.status}`);
            }
            
            // Actualizar el estado local
            setNotifications(prev => 
                prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
            );
            setUnreadCount(prev => prev > 0 ? prev - 1 : 0);
        } catch (error) {
            console.error("Error marcando notificación como leída:", error);
        }
    };

    // Función para eliminar una notificación
    const deleteNotification = async (notificationId, event) => {
        event.stopPropagation(); // Evitar que el clic se propague al elemento padre
        
        const token = localStorage.getItem('token');
        if (!token) return;

        setDeletingNotification(notificationId);
        
        try {
            console.log(`Intentando eliminar notificación ID: ${notificationId}`);
            const response = await fetch(`${API_URL}/notifications/${notificationId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                }
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${data.detail || 'Error desconocido'}`);
            }
            
            console.log(`Respuesta del servidor:`, data);
            
            // Actualizar el estado local
            const updatedNotifications = notifications.filter(n => n.id !== notificationId);
            setNotifications(updatedNotifications);
            
            // Actualizar el contador de no leídas si era una notificación no leída
            const wasUnread = notifications.find(n => n.id === notificationId)?.read === false;
            if (wasUnread) {
                setUnreadCount(prev => prev > 0 ? prev - 1 : 0);
            }
            
        } catch (error) {
            console.error("Error eliminando notificación:", error);
            alert("No se pudo eliminar la notificación: " + error.message);
        } finally {
            setDeletingNotification(null);
        }
    };

    // Función para eliminar todas las notificaciones
    const deleteAllNotifications = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        if (!notifications.length) return;

        // Confirmación del usuario
        if (!confirm("¿Estás seguro de que deseas eliminar todas las notificaciones?")) {
            return;
        }

        setDeletingAll(true);
        
        try {
            console.log("Intentando eliminar todas las notificaciones");
            const response = await fetch(`${API_URL}/notifications/all/delete`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                }
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${data.detail || 'Error desconocido'}`);
            }
            
            console.log(`Respuesta del servidor:`, data);
            
            // Actualizar el estado local
            setNotifications([]);
            setUnreadCount(0);
            
        } catch (error) {
            console.error("Error eliminando todas las notificaciones:", error);
            alert("No se pudieron eliminar todas las notificaciones: " + error.message);
        } finally {
            setDeletingAll(false);
        }
    };

    // Función para manejar el clic en una notificación
    const handleNotificationClick = (notification) => {
        // Si la notificación no está leída, marcarla como leída
        if (!notification.read) {
            markAsRead(notification.id);
        }
        
        // Si la notificación tiene un enlace, navegar a él
        if (notification.link) {
            // Corregir la ruta si es necesario (cambiar /alertas por /alerta)
            let correctedLink = notification.link;
            if (correctedLink.startsWith('/alertas')) {
                correctedLink = correctedLink.replace('/alertas', '/alerta');
            }
            
            navigate(correctedLink);
            setShowNotifications(false);
        }
    };

    // Cargar notificaciones al montar el componente y cada 30 segundos
    useEffect(() => {
        loadNotifications();
        const interval = setInterval(loadNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    // Cerrar el menú de notificaciones al hacer clic fuera de él
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (notificationRef.current && !notificationRef.current.contains(event.target)) {
                setShowNotifications(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <header className={styles.header}>
            <div className={styles.leftSection}>
                {showBackButton && (
                    <button className={styles.iconButton} onClick={handleBack}>
                        <span className={styles.backArrow}>←</span>
                    </button>
                )}
            </div>

            <div className={styles.centerSection}>
                <h1 className={styles.title}>{pageTitle}</h1>
            </div>

            <div className={styles.rightSection}>
                <div ref={notificationRef} className={styles.notificationContainer}>
                    <button className={styles.iconButton} onClick={handleProfileClick}>
                        <i className="fas fa-user"></i>
                    </button>

                    <div style={{ position: 'relative' }}>
                        <button className={styles.iconButton} onClick={handleNotificationsClick}>
                            <i className="fas fa-bell"></i>
                            {unreadCount > 0 && (
                                <span className={styles.notificationBadge}>
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                            )}
                        </button>

                        {showNotifications && (
                            <div className={styles.notificationPopup}>
                                <div className={styles.notificationHeader}>
                                    <h3>Notificaciones</h3>
                                    <div className={styles.notificationActions}>
                                        {notifications.length > 0 && (
                                            <button 
                                                className={`${styles.deleteAllButton} ${deletingAll ? styles.loading : ''}`}
                                                onClick={deleteAllNotifications}
                                                disabled={deletingAll}
                                            >
                                                {deletingAll ? 'Eliminando...' : 'Eliminar todas'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                                
                                {loadingNotifications && <p className={styles.notificationMessage}>Cargando...</p>}
                                {notificationError && <p className={styles.error}>{notificationError}</p>}
                                {!loadingNotifications && !notificationError && notifications.length === 0 && (
                                    <p className={styles.notificationMessage}>No hay notificaciones</p>
                                )}
                                {!loadingNotifications && !notificationError && notifications.length > 0 && (
                                    <ul className={styles.notificationList}>
                                        {notifications.map(notif => (
                                            <li 
                                                key={notif.id} 
                                                className={`${styles.notificationItem} ${notif.read ? styles.read : styles.unread}`}
                                                onClick={() => handleNotificationClick(notif)}
                                            >
                                                <div className={styles.notificationContent}>
                                                    <p className={styles.notificationMessage}>{notif.message}</p>
                                                    <small className={styles.notificationTime}>
                                                        {new Date(notif.timestamp).toLocaleString()}
                                                    </small>
                                                </div>
                                                <div className={styles.notificationActions}>
                                                    {notif.type === 'recordatorio_bolsa' && (
                                                        <span className={styles.notificationIcon}>⚠️</span>
                                                    )}
                                                    <button 
                                                        className={styles.deleteButton}
                                                        onClick={(e) => deleteNotification(notif.id, e)}
                                                        disabled={deletingNotification === notif.id}
                                                        title="Eliminar notificación"
                                                    >
                                                        {deletingNotification === notif.id ? 
                                                            <span className={styles.loadingIcon}>...</span> : 
                                                            <span>×</span>
                                                        }
                                                    </button>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;