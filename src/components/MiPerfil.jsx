// src/components/MiPerfil.jsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Screen from "../components/Screen"; // Asume layout base

import { API_URL } from '../utils/api'

const BASE_URL = API_URL;
const DEFAULT_IMAGE = "https://assets.api.uizard.io/api/cdn/stream/3edc26c7-9a6e-4dee-81f6-f853c56a7783.png";

// --- Placeholder API functions (Replace with actual imports from '../api') ---
const fetchUserProfileAPI = async (token) => {
    const res = await fetch(`${BASE_URL}/usuarios/me`, { headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` } });
    if (!res.ok) {
        let detail = "Error al obtener perfil";
        try { detail = (await res.json()).detail || detail; } catch (e) {}
        const error = new Error(detail); error.status = res.status; throw error;
    }
    return res.json();
};
const uploadProfileImageAPI = async (token, file) => {
    const formData = new FormData(); formData.append("file", file);
    const res = await fetch(`${BASE_URL}/usuarios/upload-profile_image`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: formData });
    if (!res.ok) { const err = await res.json().catch(() => ({ detail: "Error subiendo imagen" })); throw new Error(err.detail); }
    return res.json();
};
const updateUserProfileAPI = async (token, data) => {
    const res = await fetch(`${BASE_URL}/usuarios/me`, { method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(data) });
    if (!res.ok) { const err = await res.json().catch(() => ({ detail: "Error guardando cambios" })); throw new Error(err.detail); }
    return res.json();
};
const changePasswordAPI = async (token, data) => {
    const res = await fetch(`${BASE_URL}/usuarios/cambiar-password`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(data) });
    if (!res.ok) { const err = await res.json().catch(() => ({ detail: "Error cambiando contraseña" })); throw new Error(err.detail); }
    return { message: "Contraseña cambiada exitosamente" };
};
// --- End Placeholders ---

// --- Componente Principal ---
export default function MiPerfil() {
    const navigate = useNavigate();
    const [token, setToken] = useState(localStorage.getItem("token"));

    // Estados del perfil
    const [userProfile, setUserProfile] = useState({
        image: DEFAULT_IMAGE, name: "", email: "", role: "", lastLogin: ""
    });

    // Estados de edición
    const [isEditingInfo, setIsEditingInfo] = useState(false);
    const [tempName, setTempName] = useState("");
    const [tempEmail, setTempEmail] = useState("");

    // Estados de cambio de contraseña
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    // Estados de carga y mensajes
    const [loadingProfile, setLoadingProfile] = useState(true);
    const [loadingUpdate, setLoadingUpdate] = useState(false);
    const [loadingPassword, setLoadingPassword] = useState(false);
    const [loadingImage, setLoadingImage] = useState(false);
    const [errorProfile, setErrorProfile] = useState("");
    const [errorUpdate, setErrorUpdate] = useState("");
    const [errorPassword, setErrorPassword] = useState("");
    const [errorImage, setErrorImage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const fileInputRef = useRef(null);
    const currentPreviewUrl = useRef(null);

    // Función para formatear fecha de último login
    const formatLastLogin = (dateString) => {
        if (!dateString) return "Nunca";
        try {
            return new Date(dateString).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' });
        } catch {
            return "Fecha inválida";
        }
    };

    // --- Cargar Perfil Inicial ---
    const loadProfile = useCallback(async () => {
        if (!token) { navigate("/login"); return; }
        setLoadingProfile(true); setErrorProfile(""); setSuccessMessage("");
        try {
            const data = await fetchUserProfileAPI(token);
            setUserProfile({
                name: data.name || data.username || "Sin Nombre",
                email: data.email || "Sin Email",
                role: data.rol || "Sin Rol",
                lastLogin: formatLastLogin(data.last_login),
                image: data.profile_image || DEFAULT_IMAGE,
            });
        } catch (error) {
            console.error("Error loading profile:", error);
            setErrorProfile(`Error al cargar perfil: ${error.message}`);
            if (error.status === 401) {
                localStorage.removeItem("token");
                navigate("/login");
            }
        } finally {
            setLoadingProfile(false);
        }
    }, [token, navigate]);

    useEffect(() => {
        loadProfile();
    }, [loadProfile]);

    // --- Limpieza de URL de previsualización ---
    useEffect(() => {
        return () => {
            if (currentPreviewUrl.current) {
                URL.revokeObjectURL(currentPreviewUrl.current);
            }
        };
    }, []);

    // --- Manejo Subida Imagen ---
    const handleImageClick = () => {
        if (!loadingImage) fileInputRef.current?.click();
    };

    const handleImageUpload = async (event) => {
        const file = event.target.files?.[0];
        if (!file || !token) return;

        if (currentPreviewUrl.current) {
            URL.revokeObjectURL(currentPreviewUrl.current);
        }
        const previewUrl = URL.createObjectURL(file);
        currentPreviewUrl.current = previewUrl;
        setUserProfile(prev => ({ ...prev, image: previewUrl }));
        setLoadingImage(true); setErrorImage(""); setSuccessMessage("");

        try {
            const data = await uploadProfileImageAPI(token, file);
            if (data.profile_image) {
                setUserProfile(prev => ({ ...prev, image: data.profile_image }));
                setSuccessMessage("Imagen actualizada.");
                URL.revokeObjectURL(previewUrl);
                currentPreviewUrl.current = null;
            } else {
                throw new Error("URL de imagen no recibida del servidor.");
            }
        } catch (error) {
            console.error("Error uploading image:", error);
            setErrorImage(error.message || "Error al subir imagen.");
            loadProfile(); // Recargar para obtener la imagen correcta
        } finally {
            setLoadingImage(false);
            if(fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    // --- Manejo Edición Información ---
    const handleEditInfo = () => {
        setTempName(userProfile.name); setTempEmail(userProfile.email);
        setErrorUpdate(''); setSuccessMessage(''); setIsEditingInfo(true); setIsChangingPassword(false);
    };
    const handleCancelEdit = () => { setIsEditingInfo(false); setErrorUpdate(''); };
    const handleSaveEdit = async () => {
        if (!token) return;
        setLoadingUpdate(true); setErrorUpdate(''); setSuccessMessage('');
        try {
            const updatedData = await updateUserProfileAPI(token, { name: tempName, email: tempEmail });
            setUserProfile(prev => ({
                ...prev,
                name: updatedData.name || updatedData.username || prev.name,
                email: updatedData.email || prev.email
            }));
            setIsEditingInfo(false);
            setSuccessMessage("Información guardada.");
        } catch (error) {
            console.error("Error saving profile:", error);
            setErrorUpdate(error.message || "Error al guardar.");
        } finally {
            setLoadingUpdate(false);
        }
    };

    // --- Manejo Cambio Contraseña ---
    const handleToggleChangePassword = () => {
        setErrorPassword(''); setSuccessMessage(''); setOldPassword(''); setNewPassword(''); setConfirmPassword('');
        setIsChangingPassword(prev => !prev); setIsEditingInfo(false);
    };
    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setErrorPassword(''); setSuccessMessage('');
        if (newPassword !== confirmPassword) { setErrorPassword("Las nuevas contraseñas no coinciden."); return; }
        if (!oldPassword || !newPassword) { setErrorPassword("Todos los campos de contraseña son requeridos."); return; }
        if (!token) return;
        setLoadingPassword(true);
        try {
            await changePasswordAPI(token, { old_password: oldPassword, new_password: newPassword });
            setSuccessMessage("Contraseña cambiada exitosamente.");
            setIsChangingPassword(false);
            setOldPassword(''); setNewPassword(''); setConfirmPassword('');
        } catch (error) {
            console.error("Error changing password:", error);
            setErrorPassword(error.message || "Error al cambiar contraseña.");
        } finally {
            setLoadingPassword(false);
        }
    };

    // --- Manejo Logout ---
    const handleLogout = () => {
        if (window.confirm("¿Seguro que deseas cerrar sesión?")) {
            localStorage.removeItem("token");
            localStorage.removeItem("loggedIn");
            setToken(null);
            navigate("/login");
        }
    };

    // --- Funciones de Renderizado ---
    const renderProfileView = () => (
        <>
            <h4 style={styles.profileName}>{userProfile.name}</h4>
            <p style={styles.profileDetail}>{userProfile.email}</p>
            <p style={styles.profileDetail}>
                Rol: <span style={styles.roleBadge}>{userProfile.role}</span>
            </p>
            <p style={styles.profileDetail}>Último login: {userProfile.lastLogin}</p>
            <div style={styles.buttonContainer}> {/* Contenedor para botones */}
                <button style={{...styles.button, ...styles.editButton}} onClick={handleEditInfo} disabled={loadingProfile}>Editar Información</button>
                <button style={{...styles.button, ...styles.passwordButton}} onClick={handleToggleChangePassword} disabled={loadingProfile}>Cambiar Contraseña</button>
            </div>
        </>
    );

    const renderEditInfoView = () => (
        <form onSubmit={(e)=>{e.preventDefault(); handleSaveEdit();}} style={styles.editForm}>
            <h4 style={styles.formSectionTitle}>Editar Información</h4>
            <div style={styles.formGroup}>
                <label htmlFor="edit-name" style={styles.label}>Nombre:</label>
                <input id="edit-name" style={styles.input} value={tempName} onChange={(e) => setTempName(e.target.value)} required disabled={loadingUpdate} />
            </div>
            <div style={styles.formGroup}>
                <label htmlFor="edit-email" style={styles.label}>Correo Electrónico:</label>
                <input id="edit-email" type="email" style={styles.input} value={tempEmail} onChange={(e) => setTempEmail(e.target.value)} required disabled={loadingUpdate} />
            </div>
            <p style={styles.profileDetail}>Rol: <span style={styles.roleBadge}>{userProfile.role}</span> (No editable)</p>
            {errorUpdate && <p style={styles.errorMessage}>{errorUpdate}</p>}
            <div style={styles.buttonGroup}>
                <button type="submit" style={{...styles.button, ...styles.saveButton}} disabled={loadingUpdate}>{loadingUpdate ? 'Guardando...' : 'Guardar Cambios'}</button>
                <button type="button" style={{...styles.button, ...styles.cancelButton}} onClick={handleCancelEdit} disabled={loadingUpdate}>Cancelar</button>
            </div>
        </form>
    );

    const renderChangePasswordView = () => (
        <form onSubmit={handlePasswordSubmit} style={styles.editForm}>
             <h4 style={styles.formSectionTitle}>Cambiar Contraseña</h4>
            <div style={styles.formGroup}>
                <label htmlFor="old-password" style={styles.label}>Contraseña Actual:</label>
                <input id="old-password" type="password" style={styles.input} value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} required disabled={loadingPassword} />
            </div>
             <div style={styles.formGroup}>
                <label htmlFor="new-password" style={styles.label}>Nueva Contraseña:</label>
                <input id="new-password" type="password" style={styles.input} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required disabled={loadingPassword} />
            </div>
             <div style={styles.formGroup}>
                <label htmlFor="confirm-password" style={styles.label}>Confirmar Nueva Contraseña:</label>
                <input id="confirm-password" type="password" style={styles.input} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required disabled={loadingPassword} />
            </div>
            {errorPassword && <p style={styles.errorMessage}>{errorPassword}</p>}
            <div style={styles.buttonGroup}>
                <button type="submit" style={{...styles.button, ...styles.saveButton}} disabled={loadingPassword}>{loadingPassword ? 'Cambiando...' : 'Confirmar Cambio'}</button>
                <button type="button" style={{...styles.button, ...styles.cancelButton}} onClick={handleToggleChangePassword} disabled={loadingPassword}>Cancelar</button>
            </div>
        </form>
    );

    // --- Render Principal ---
    return (
        <Screen>
            <div style={styles.container}>
                <h3 style={styles.pageTitle}>Mi Perfil</h3>

                {/* Imagen de Perfil */}
                <div style={styles.imageContainer}>
                    <label htmlFor="upload-photo" style={{ cursor: loadingImage || loadingProfile ? 'default' : 'pointer', display: 'inline-block', position: 'relative' }}>
                        <img src={userProfile.image} alt="Perfil" style={styles.profileImage} onError={(e) => e.target.src = DEFAULT_IMAGE} />
                        {loadingImage && <div style={styles.imageLoadingOverlay}><div style={styles.spinner}></div></div>}
                         {!loadingImage && !isEditingInfo && !isChangingPassword && <div style={styles.editIconOverlay} title="Cambiar imagen">✏️</div>}
                    </label>
                    <input ref={fileInputRef} type="file" id="upload-photo" accept="image/png, image/jpeg, image/gif" style={{ display: "none" }} onChange={handleImageUpload} disabled={loadingImage || loadingProfile} />
                    {errorImage && <p style={{...styles.errorMessage, fontSize: '12px', padding: '5px 8px', marginTop: '5px'}}>{errorImage}</p>}
                </div>

                {/* Mensajes Globales */}
                {successMessage && <p style={styles.successMessage}>{successMessage}</p>}

                {/* Contenido Principal */}
                <div style={styles.contentArea}>
                    {loadingProfile ? <p style={styles.loadingText}>Cargando...</p> :
                     errorProfile ? <p style={styles.errorMessage}>{errorProfile}</p> :
                     isEditingInfo ? renderEditInfoView() :
                     isChangingPassword ? renderChangePasswordView() :
                     renderProfileView()
                    }
                </div>

                {/* Botón Logout */}
                {!isEditingInfo && !isChangingPassword && !loadingProfile && !errorProfile && (
                    <button style={{ ...styles.button, ...styles.logoutButton }} onClick={handleLogout} disabled={loadingUpdate || loadingPassword}>
                        Cerrar Sesión
                    </button>
                )}
            </div>
        </Screen>
    );
}

// --- Estilos (sin la definición de @keyframes) ---
const styles = {
    container: {
        width: '100%', maxWidth: '600px', margin: '30px auto', padding: '30px',
        fontFamily: "'Poppins', sans-serif", backgroundColor: '#ffffff',
        borderRadius: '12px', boxShadow: '0 6px 20px rgba(0,0,0,0.08)',
        textAlign: 'center', paddingBottom: '40px', boxSizing: 'border-box',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px',
    },
    pageTitle: { fontSize: "26px", fontWeight: "700", marginBottom: "10px", color: '#2d3748' },
    imageContainer: { position: 'relative', marginBottom: '10px'},
    profileImage: {
        width: "130px", height: "130px", borderRadius: "50%", objectFit: "cover",
        display: "block", border: '4px solid #e2e8f0',
    },
    imageLoadingOverlay: {
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', fontSize: '14px', fontWeight: 'bold',
    },
    spinner: { // Estilo que usa la animación global 'spin'
        border: '4px solid rgba(255, 255, 255, 0.3)', borderRadius: '50%', borderTop: '4px solid #fff',
        width: '30px', height: '30px',
        animation: 'spin 1s linear infinite', // Referencia a la animación definida en CSS
    },
    // '@keyframes spin' ELIMINADO DE AQUÍ
    editIconOverlay: {
        position: 'absolute', bottom: '5px', right: '5px', backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '50%', padding: '6px', lineHeight: '1', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', fontSize: '14px'
    },
    contentArea: {
        width: '100%', borderTop: '1px solid #e2e8f0', paddingTop: '25px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px'
    },
    profileName: { fontSize: "24px", fontWeight: "600", margin: "0 0 5px 0", color: '#1a202c' },
    profileDetail: { color: "#4a5568", fontSize: "14px", margin: "2px 0", lineHeight: '1.6' },
    roleBadge: { display: 'inline-block', padding: '4px 12px', fontSize: '12px', fontWeight: '600', borderRadius: '12px', color: '#fff', backgroundColor: '#718096' },
    editForm: { width: '100%', maxWidth: '450px', display: 'flex', flexDirection: 'column', gap: '18px', marginTop: '10px', alignItems: 'stretch' },
    formSectionTitle: { fontSize: '18px', fontWeight: '600', color: '#333', marginBottom: '5px', textAlign: 'left', width: '100%', borderBottom: '1px solid #eee', paddingBottom: '5px'},
    formGroup: { display: 'flex', flexDirection: 'column', gap: '6px', width: '100%', textAlign: 'left' },
    label: { fontSize: '14px', fontWeight: '500', color: '#4a5568' },
    input: {
        width: '100%', height: '42px', padding: '0 12px', border: '1px solid #cbd5e0',
        boxSizing: 'border-box', borderRadius: '6px', fontSize: '14px', fontFamily: 'Poppins',
    },
    button: {
        width: "100%", height: "42px", backgroundColor: "#4a5568",
        color: "#ffffff", fontSize: "14px", fontWeight: "600",
        borderRadius: "8px", border: "none", cursor: "pointer",
        padding: '0 15px',
        margin: "5px 0", transition: 'background-color 0.2s, opacity 0.2s',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
    },
    buttonContainer: { // Contenedor añadido para los botones de acción del perfil
        display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', maxWidth: '350px', marginTop: '15px'
    },
    buttonDisabled: { backgroundColor: '#a0aec0', cursor: 'not-allowed', opacity: 0.7 },
    editButton: { backgroundColor: '#4a5568'},
    passwordButton: { backgroundColor: '#dd6b20'},
    saveButton: { backgroundColor: '#38a169'},
    cancelButton: { backgroundColor: '#a0aec0', color: '#1a202c'},
    logoutButton: { backgroundColor: "#e53e3e", fontSize: "15px", fontWeight: "700", height: "44px", marginTop: "25px", },
    buttonGroup: { display: "flex", gap: "12px", marginTop: "10px", width: '100%' },
    loadingText: { color: '#718096', fontStyle: 'italic', padding: '20px 0'},
    errorMessage: { color: '#c53030', backgroundColor: '#fed7d7', border: '1px solid #fbb6ce', borderRadius: '6px', padding: '10px 12px', fontSize: '13px', textAlign: 'center', width: '100%', boxSizing: 'border-box', marginTop: '10px' },
    successMessage: { color: '#2f855a', backgroundColor: '#c6f6d5', border: '1px solid #9ae6b4', borderRadius: '6px', padding: '10px 12px', fontSize: '13px', textAlign: 'center', width: '100%', boxSizing: 'border-box', marginBottom: '15px'},
};

// Placeholder Screen si no se importa
if (typeof Screen === 'undefined') { const Screen = ({ children }) => <div style={{backgroundColor: '#f0f2f5', minHeight: '100vh'}}>{children}</div>; }