// src/components/Header.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styles from './Header.module.css';
import { fetchNotifications } from '../api';

const routeTitleMap = {
    '/': 'Inicio',
    '/login': 'Iniciar Sesión',
    '/bolsas': 'Inventario de Bolsas',
    '/miembros': 'Gestión de Miembros',
    '/mantenimientos': 'Mantenimientos',
    '/reportes': 'Reportes',
    '/auditoria': 'Auditoría',
    '/miperfil': 'Mi Perfil',
    '/admin': 'Administración'
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

    const pageTitle = routeTitleMap[location.pathname] || 'Gestión de Bastones';
    const showBackButton = location.pathname !== '/';

    const handleBack = () => navigate(-1);
    const handleProfileClick = () => navigate('/miperfil');

    const handleNotificationsClick = () => {
        setShowNotifications(!showNotifications);
    };

    useEffect(() => {
        const loadNotifications = async () => {
            const token = localStorage.getItem('token');
            if (!token) return;

            setLoadingNotifications(true);
            try {
                const data = await fetchNotifications(20);
                setNotifications(data);
                setUnreadCount(data.filter(n => !n.read).length);
            } catch (error) {
                setNotificationError("Error al cargar notificaciones");
            } finally {
                setLoadingNotifications(false);
            }
        };

        loadNotifications();
        const interval = setInterval(loadNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

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
                                {loadingNotifications && <p>Cargando...</p>}
                                {notificationError && <p className={styles.error}>{notificationError}</p>}
                                {!loadingNotifications && !notificationError && notifications.length === 0 && (
                                    <p>No hay notificaciones</p>
                                )}
                                {!loadingNotifications && !notificationError && notifications.length > 0 && (
                                    <ul>
                                        {notifications.map(notif => (
                                            <li key={notif.id} className={notif.read ? styles.read : styles.unread}>
                                                <p>{notif.message}</p>
                                                <small>{new Date(notif.timestamp).toLocaleString()}</small>
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