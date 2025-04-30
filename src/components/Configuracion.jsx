// src/components/MiPerfil.jsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Screen from "../components/Screen"; // Asume layout base

// --- Componente Modal de Gestión QR ---
import QRManagementModal from './QRManagementModal'; // Asegúrate que la ruta sea correcta

import { API_URL } from '../utils/api'

const BASE_URL = API_URL;
const DEFAULT_IMAGE = "https://assets.api.uizard.io/api/cdn/stream/3edc26c7-9a6e-4dee-81f6-f853c56a7783.png";
const LOCAL_STORAGE_NOTIF_DEVOLUCION = 'notifDevolucionTardia';
const LOCAL_STORAGE_NOTIF_MANTENIMIENTO = 'notifMantenimiento';

// --- Placeholder API functions ---
const fetchUserProfileAPI = async (token) => { const res = await fetch(`${BASE_URL}/usuarios/me`, { headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` } }); if (!res.ok) { let d = "Error perfil"; try { d = (await res.json()).detail || d; } catch (e) {} const err = new Error(d); err.status = res.status; throw err; } return res.json(); };
const uploadProfileImageAPI = async (token, file) => { const f = new FormData(); f.append("file", file); const r = await fetch(`${BASE_URL}/usuarios/upload-profile_image`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: f }); if (!r.ok) { const e = await r.json().catch(()=>({detail:"Err img"})); throw new Error(e.detail); } return r.json(); };
const updateUserProfileAPI = async (token, data) => { const r = await fetch(`${BASE_URL}/usuarios/me`, { method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(data) }); if (!r.ok) { const e=await r.json().catch(()=>({detail:"Err save"})); throw new Error(e.detail); } return r.json(); };
const changePasswordAPI = async (token, data) => { const r = await fetch(`${BASE_URL}/usuarios/cambiar-password`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(data) }); if (!r.ok) { const e=await r.json().catch(()=>({detail:"Err pass"})); throw new Error(e.detail); } return { message: "OK" }; };
const fetchAdminUsersAPI = async (token) => { const r = await fetch(`${BASE_URL}/usuarios/list`, { headers: { Authorization: `Bearer ${token}` } }); if (!r.ok) throw new Error("Err list users"); return r.json(); };
const createUserAPI = async (token, data) => { const r = await fetch(`${BASE_URL}/usuarios/crear`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(data) }); if (!r.ok) { const e=await r.json().catch(()=>({detail:"Err create"})); throw new Error(e.detail); } return r.json(); };
const adminUpdateUserAPI = async (token, username, data) => { const r = await fetch(`${BASE_URL}/usuarios/${username}`, { method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(data) }); if (!r.ok) { const e=await r.json().catch(()=>({detail:"Err admin update"})); throw new Error(e.detail); } return r.json(); };
const forcePasswordAPI = async (token, username, newPassword) => { const r = await fetch(`${BASE_URL}/usuarios/${username}/force-password`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ new_password: newPassword }) }); if (!r.ok) { const e=await r.json().catch(()=>({detail:"Err force pass"})); throw new Error(e.detail); } return r.json(); };
const deleteUserAPI = async (token, username) => { const r = await fetch(`${BASE_URL}/usuarios/${username}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }); if (!r.ok) { const e=await r.json().catch(()=>({detail:"Err delete"})); throw new Error(e.detail); } return r.json(); };
// --- End Placeholders ---

// Componente Switch reutilizable
function Switch({ label, isToggled, onToggle, disabled }) {
    return (
      <div style={styles.switchContainer} onClick={() => !disabled && onToggle(!isToggled)}>
        <span style={{...styles.text, ...(disabled ? styles.disabledText : {})}}>{label}</span>
        <div style={{...styles.switchBase(isToggled), ...(disabled ? styles.disabledControl : {})}}>
          <div style={styles.toggleCircle(isToggled)} />
        </div>
      </div>
    );
}

// Card genérico reutilizable
const Card = ({ title, children }) => (
  <section style={styles.card} aria-labelledby={title.replace(/\s+/g, '-').toLowerCase()}>
    <h3 id={title.replace(/\s+/g, '-').toLowerCase()} style={styles.cardTitle}>{title}</h3>
    {children}
  </section>
);

// --- Componente Principal ---
export default function MiPerfil() {
    const navigate = useNavigate();
    const [token, setToken] = useState(localStorage.getItem("token"));

    // Perfil
    const [userProfile, setUserProfile] = useState({ image: DEFAULT_IMAGE, name: "", email: "", role: "", lastLogin: "", username: "" });

    // Edición Info
    const [isEditingInfo, setIsEditingInfo] = useState(false);
    const [tempName, setTempName] = useState("");
    const [tempEmail, setTempEmail] = useState("");

    // Cambio Contraseña
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showOldPass, setShowOldPass] = useState(false);
    const [showNewPass, setShowNewPass] = useState(false);
    const [showConfirmPass, setShowConfirmPass] = useState(false);

    // Admin: Lista y creación
    const [adminUsers, setAdminUsers] = useState([]);
    const [showCreateUser, setShowCreateUser] = useState(false);
    const [newUserData, setNewUserData] = useState({ username: "", password: "", rol: "usuario", name: "", email: "" });

    // Admin: Edición (Modal)
    const [showEditModal, setShowEditModal] = useState(false);
    const [editData, setEditData] = useState({ username: "", name: "", email: "", rol: "usuario" });

    // Admin: Forzar Contraseña (Modal)
    const [showForcePasswordModal, setShowForcePasswordModal] = useState(false);
    const [forcePasswordData, setForcePasswordData] = useState({ username: "", newPassword: "" });

    // Admin: Gestión QR (Modal)
    const [isQrModalOpen, setIsQrModalOpen] = useState(false);

    // Notificaciones (localStorage)
    const [alertaDevolucionTardia, setAlertaDevolucionTardia] = useState(() => JSON.parse(localStorage.getItem(LOCAL_STORAGE_NOTIF_DEVOLUCION) || 'true'));
    const [recordatorioMantenimiento, setRecordatorioMantenimiento] = useState(() => JSON.parse(localStorage.getItem(LOCAL_STORAGE_NOTIF_MANTENIMIENTO) || 'false'));

    // Carga y Errores
    const [loadingProfile, setLoadingProfile] = useState(true);
    const [loadingUpdate, setLoadingUpdate] = useState(false);
    const [loadingPassword, setLoadingPassword] = useState(false);
    const [loadingImage, setLoadingImage] = useState(false);
    const [loadingAdminAction, setLoadingAdminAction] = useState(false);
    const [errorProfile, setErrorProfile] = useState("");
    const [errorUpdate, setErrorUpdate] = useState("");
    const [errorPassword, setErrorPassword] = useState("");
    const [errorImage, setErrorImage] = useState("");
    const [errorAdmin, setErrorAdmin] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const fileInputRef = useRef(null);
    const currentPreviewUrl = useRef(null);

    // Formateador de Fecha
    const formatLastLogin = useCallback((dateString) => { 
        if (!dateString) return "Nunca"; 
        try { 
            // Crear la fecha a partir del string
            const date = new Date(dateString);
            
            // Restar 6 horas para ajustar la diferencia de zona horaria
            date.setHours(date.getHours() - 6);
            
            // Formatear la fecha ajustada
            return date.toLocaleString('es-MX', { 
                dateStyle: 'medium', 
                timeStyle: 'short'
            }); 
        } catch (error) { 
            console.error("Error formateando fecha:", error);
            return "Inválida"; 
        } 
    }, []);

    // --- Cargar Perfil y Usuarios Admin ---
    const loadProfileAndAdminData = useCallback(async () => {
        if (!token) { navigate("/login"); return; }
        setLoadingProfile(true); setErrorProfile(""); setSuccessMessage(""); setLoadingAdminAction(false); setErrorAdmin("");
        let isAdmin = false;
        let currentUsername = '';
        try {
            const data = await fetchUserProfileAPI(token);
            currentUsername = data.username;
            setUserProfile({ name: data.name || data.username || "N/D", email: data.email || "N/D", role: data.rol || "N/D", lastLogin: formatLastLogin(data.last_login), image: data.profile_image || DEFAULT_IMAGE, username: data.username });
            isAdmin = data.rol === "admin";
        } catch (error) {
            console.error("Err profile:", error); setErrorProfile(`Error perfil: ${error.message}`);
            if (error.status === 401) { localStorage.removeItem("token"); navigate("/login"); }
        } finally { setLoadingProfile(false); }

        if (isAdmin && currentUsername) {
            setLoadingAdminAction(true);
            try {
                const users = await fetchAdminUsersAPI(token);
                setAdminUsers(Array.isArray(users) ? users.filter(u => u.username !== currentUsername) : []);
            } catch (error) {
                console.error("Err list users:", error); setErrorAdmin(`Error cargando usuarios: ${error.message}`);
            } finally { setLoadingAdminAction(false); }
        } else {
            setAdminUsers([]);
        }
    }, [token, navigate, formatLastLogin]); // Dependencias correctas

    useEffect(() => { loadProfileAndAdminData(); }, [loadProfileAndAdminData]);

    // Limpieza URL Imagen
    useEffect(() => { return () => { if (currentPreviewUrl.current) URL.revokeObjectURL(currentPreviewUrl.current); }; }, []);

    // --- Handlers Imagen ---
    const handleImageClick = () => { if (!loadingImage) fileInputRef.current?.click(); };
    const handleImageUpload = async (event) => {
        const file = event.target.files?.[0]; if (!file || !token) return;
        if (currentPreviewUrl.current) URL.revokeObjectURL(currentPreviewUrl.current);
        const pUrl = URL.createObjectURL(file); currentPreviewUrl.current = pUrl;
        setUserProfile(prev => ({ ...prev, image: pUrl })); setLoadingImage(true); setErrorImage(""); setSuccessMessage("");
        try { const data = await uploadProfileImageAPI(token, file); if (data.profile_image) { setUserProfile(prev => ({ ...prev, image: data.profile_image })); setSuccessMessage("Imagen actualizada."); URL.revokeObjectURL(pUrl); currentPreviewUrl.current = null; } else throw new Error("URL no recibida."); }
        catch (error) { console.error("Err img upload:", error); setErrorImage(error.message || "Error subida."); loadProfileAndAdminData(); }
        finally { setLoadingImage(false); if(fileInputRef.current) fileInputRef.current.value = ""; }
    };

    // --- Handlers Edición Info ---
    const handleEditInfo = () => { setTempName(userProfile.name); setTempEmail(userProfile.email); setErrorUpdate(''); setSuccessMessage(''); setIsEditingInfo(true); setIsChangingPassword(false); };
    const handleCancelEdit = () => { setIsEditingInfo(false); setErrorUpdate(''); };
    const handleSaveEdit = async () => {
        if (!token) return; setLoadingUpdate(true); setErrorUpdate(''); setSuccessMessage('');
        try { const d = await updateUserProfileAPI(token, { name: tempName, email: tempEmail }); setUserProfile(p => ({ ...p, name: d.name || d.username || p.name, email: d.email || p.email })); setIsEditingInfo(false); setSuccessMessage("Perfil guardado."); }
        catch (error) { console.error("Err save profile:", error); setErrorUpdate(error.message || "Error guardando."); } finally { setLoadingUpdate(false); }
    };

    // --- Handlers Cambio Contraseña ---
    const handleToggleChangePassword = () => { setErrorPassword(''); setSuccessMessage(''); setOldPassword(''); setNewPassword(''); setConfirmPassword(''); setIsChangingPassword(prev => !prev); setIsEditingInfo(false); };
    const handlePasswordSubmit = async (e) => {
        e.preventDefault(); setErrorPassword(''); setSuccessMessage('');
        if (newPassword !== confirmPassword) { setErrorPassword("Nuevas contraseñas no coinciden."); return; }
        if (!oldPassword || !newPassword) { setErrorPassword("Campos requeridos."); return; }
        if (!token) return; setLoadingPassword(true);
        try { await changePasswordAPI(token, { old_password: oldPassword, new_password: newPassword }); setSuccessMessage("Contraseña cambiada."); setIsChangingPassword(false); setOldPassword(''); setNewPassword(''); setConfirmPassword(''); }
        catch (error) { console.error("Err change pass:", error); setErrorPassword(error.message || "Error."); } finally { setLoadingPassword(false); }
    };

    // --- Handlers Admin ---
    const handleAdminInputChange = (e, field) => setNewUserData(prev => ({ ...prev, [field]: e.target.value }));
    const handleCreateUser = async (e) => {
        e.preventDefault(); if (!token || userProfile.role !== 'admin') return;
        setLoadingAdminAction(true); setErrorAdmin(''); setSuccessMessage('');
        try { await createUserAPI(token, newUserData); setSuccessMessage(`Usuario ${newUserData.username} creado.`); setNewUserData({ username: "", password: "", rol: "usuario", name: "", email: "" }); setShowCreateUser(false); loadProfileAndAdminData(); }
        catch (error) { console.error("Err create user:", error); setErrorAdmin(error.message || "Error creando."); } finally { setLoadingAdminAction(false); }
    };
    const openEditModal = (user) => {
        setErrorAdmin(''); // Limpiar error antes de abrir
        setEditData({ username: user.username, name: user.name || "", email: user.email || "", rol: user.rol });
        setShowEditModal(true);
    };
    const closeEditModal = () => {
        setShowEditModal(false);
        setErrorAdmin(''); // Limpiar error al cerrar
    };
    // --- >>> INICIO: Modificaciones en saveEditModal <<< ---
    const saveEditModal = async () => {
        if (!token || userProfile.role !== 'admin') return;
        setLoadingAdminAction(true);
        setErrorAdmin(''); // Limpiar error antes de guardar
        setSuccessMessage(''); // Limpiar mensaje de éxito anterior
        try {
            const { username, name, email, rol } = editData;
            // Llama a la API para actualizar, incluyendo el rol
            await adminUpdateUserAPI(token, username, { name, email, rol });
            // Mensaje de éxito específico
            setSuccessMessage(`Usuario ${username} actualizado correctamente (Rol: ${rol}).`);
            setShowEditModal(false);
            loadProfileAndAdminData(); // Recargar lista para reflejar cambios
        } catch (error) {
            console.error("Err admin update:", error);
            // Mostrar el error específico dentro del modal
            setErrorAdmin(error.message || "Error al actualizar usuario. Verifica que el backend permita cambiar el rol.");
        } finally {
            setLoadingAdminAction(false);
        }
    };
    // --- >>> FIN: Modificaciones en saveEditModal <<< ---
    const openForcePasswordModal = (username) => {
        setErrorAdmin('');
        setForcePasswordData({ username, newPassword: '' });
        setShowForcePasswordModal(true);
    };
    const closeForcePasswordModal = () => {
        setShowForcePasswordModal(false);
        setErrorAdmin('');
    };
    const handleForcePasswordSubmit = async () => {
        if (!token || userProfile.role !== 'admin' || !forcePasswordData.newPassword) { setErrorAdmin("Se requiere nueva contraseña."); return; }
        setLoadingAdminAction(true); setErrorAdmin(''); setSuccessMessage('');
        try { await forcePasswordAPI(token, forcePasswordData.username, forcePasswordData.newPassword); setSuccessMessage(`Contraseña forzada para ${forcePasswordData.username}.`); setShowForcePasswordModal(false); }
        catch (error) { console.error("Err force pass:", error); setErrorAdmin(error.message || "Error forzando."); } finally { setLoadingAdminAction(false); }
    };
    const handleDeleteUser = async (username) => {
        if (!token || userProfile.role !== 'admin' || username === userProfile.username) return;
        if (!window.confirm(`¿Eliminar usuario ${username}?`)) return;
        setLoadingAdminAction(true); setErrorAdmin(''); setSuccessMessage('');
        try { await deleteUserAPI(token, username); setSuccessMessage(`Usuario ${username} eliminado.`); loadProfileAndAdminData(); }
        catch (error) { console.error("Err delete user:", error); setErrorAdmin(error.message || "Error eliminando."); } finally { setLoadingAdminAction(false); }
    };

    // --- Handlers Modal QR ---
    const handleOpenQrModal = () => setIsQrModalOpen(true);
    const handleCloseQrModal = () => setIsQrModalOpen(false);

    // --- Handlers Notificaciones ---
    const handleToggleDevolucion = (newVal) => { setAlertaDevolucionTardia(newVal); localStorage.setItem(LOCAL_STORAGE_NOTIF_DEVOLUCION, JSON.stringify(newVal)); setSuccessMessage("Preferencia guardada localmente."); };
    const handleToggleMantenimiento = (newVal) => { setRecordatorioMantenimiento(newVal); localStorage.setItem(LOCAL_STORAGE_NOTIF_MANTENIMIENTO, JSON.stringify(newVal)); setSuccessMessage("Preferencia guardada localmente."); };

    // --- Handlers Logout ---
    const handleLogout = () => { if (window.confirm("¿Cerrar sesión?")) { localStorage.removeItem("token"); localStorage.removeItem("loggedIn"); setToken(null); navigate("/login"); } };

    // --- Renderizado ---
    return (
        <Screen>
            <div style={styles.container}>
                <h3 style={styles.pageTitle}>Mi Perfil</h3>

                {/* Sección Imagen */}
                <div style={styles.imageContainer}>
                    <label htmlFor="upload-photo" style={{ cursor: loadingImage || loadingProfile ? 'default' : 'pointer', display: 'inline-block', position: 'relative' }}>
                        <img src={userProfile.image} alt="Perfil" style={styles.profileImage} onError={(e) => e.target.src = DEFAULT_IMAGE} />
                        {loadingImage && <div style={styles.imageLoadingOverlay}><div style={styles.spinner}></div></div>}
                        {!loadingImage && !isEditingInfo && !isChangingPassword && <div style={styles.editIconOverlay} title="Cambiar imagen">✏️</div>}
                    </label>
                    <input ref={fileInputRef} type="file" id="upload-photo" accept="image/png, image/jpeg, image/gif" style={{ display: "none" }} onChange={handleImageUpload} disabled={loadingImage || loadingProfile} />
                    {errorImage && <p style={styles.errorMessageSubtle}>{errorImage}</p>}
                </div>

                {/* Mensajes Globales */}
                {/* --- >>> CAMBIO: Mostrar mensaje de éxito solo si no hay error admin <<< --- */}
                {successMessage && !errorAdmin && <p style={styles.successMessage}>{successMessage}</p>}
                {loadingProfile && <p style={styles.loadingText}>Cargando perfil...</p>}
                {errorProfile && <p style={styles.errorMessage}>{errorProfile}</p>}

                 {/* Área de Contenido Principal */}
                 {!loadingProfile && !errorProfile && (
                     <div style={styles.contentArea}>
                         {/* Vista Normal Perfil */}
                         {!isEditingInfo && !isChangingPassword && (
                            <>
                                <h4 style={styles.profileName}>{userProfile.name}</h4>
                                <p style={styles.profileDetail}>{userProfile.email}</p>
                                <p style={styles.profileDetail}>Rol: <span style={styles.roleBadge}>{userProfile.role}</span></p>
                                <p style={styles.profileDetail}>Último login: {userProfile.lastLogin}</p>
                                <div style={styles.buttonContainer}>
                                    <button style={{...styles.button, ...styles.editButton}} onClick={handleEditInfo}>Editar Información</button>
                                    <button style={{...styles.button, ...styles.passwordButton}} onClick={handleToggleChangePassword}>Cambiar Contraseña</button>
                                </div>
                            </>
                         )}

                         {/* Formulario Editar Info */}
                         {isEditingInfo && (
                             <form onSubmit={(e)=>{e.preventDefault(); handleSaveEdit();}} style={styles.editForm}>
                                <h4 style={styles.formSectionTitle}>Editar Información</h4>
                                <div style={styles.formGroup}> <label htmlFor="edit-name" style={styles.label}>Nombre:</label> <input id="edit-name" style={styles.input} value={tempName} onChange={(e) => setTempName(e.target.value)} required disabled={loadingUpdate} /> </div>
                                <div style={styles.formGroup}> <label htmlFor="edit-email" style={styles.label}>Correo:</label> <input id="edit-email" type="email" style={styles.input} value={tempEmail} onChange={(e) => setTempEmail(e.target.value)} required disabled={loadingUpdate} /> </div>
                                <p style={styles.profileDetail}>Rol: <span style={styles.roleBadge}>{userProfile.role}</span> (No editable)</p>
                                {errorUpdate && <p style={styles.errorMessage}>{errorUpdate}</p>}
                                <div style={styles.buttonGroup}>
                                    <button type="submit" style={{...styles.button, ...styles.saveButton}} disabled={loadingUpdate}>{loadingUpdate ? 'Guardando...' : 'Guardar'}</button>
                                    <button type="button" style={{...styles.button, ...styles.cancelButton}} onClick={handleCancelEdit} disabled={loadingUpdate}>Cancelar</button>
                                </div>
                            </form>
                         )}

                         {/* Formulario Cambiar Contraseña */}
                         {isChangingPassword && (
                             <form onSubmit={handlePasswordSubmit} style={styles.editForm}>
                                 <h4 style={styles.formSectionTitle}>Cambiar Contraseña</h4>
                                 <PasswordInput label="Contraseña Actual:" id="old-password" value={oldPassword} onChange={setOldPassword} isVisible={showOldPass} toggleVisibility={() => setShowOldPass(p => !p)} disabled={loadingPassword} required />
                                 <PasswordInput label="Nueva Contraseña:" id="new-password" value={newPassword} onChange={setNewPassword} isVisible={showNewPass} toggleVisibility={() => setShowNewPass(p => !p)} disabled={loadingPassword} required />
                                 <PasswordInput label="Confirmar Nueva:" id="confirm-password" value={confirmPassword} onChange={setConfirmPassword} isVisible={showConfirmPass} toggleVisibility={() => setShowConfirmPass(p => !p)} disabled={loadingPassword} required />
                                 {errorPassword && <p style={styles.errorMessage}>{errorPassword}</p>}
                                 <div style={styles.buttonGroup}>
                                    <button type="submit" style={{...styles.button, ...styles.saveButton}} disabled={loadingPassword}>{loadingPassword ? 'Cambiando...' : 'Confirmar'}</button>
                                    <button type="button" style={{...styles.button, ...styles.cancelButton}} onClick={handleToggleChangePassword} disabled={loadingPassword}>Cancelar</button>
                                 </div>
                            </form>
                         )}
                     </div>
                 )}

                {/* --- Sección Admin (Condicional) --- */}
                {userProfile.role === 'admin' && !isEditingInfo && !isChangingPassword && (
                    <>
                        {/* Card Gestión de Usuarios */}
                        <Card title="Gestión de Usuarios (Admin)">
                            {loadingAdminAction && !showCreateUser && adminUsers.length === 0 && <p style={styles.loadingText}>Cargando usuarios...</p>}
                            {/* Mostrar error admin general fuera de los modales */}
                            {errorAdmin && !showEditModal && !showForcePasswordModal && !showCreateUser && <p style={styles.errorMessage}>{errorAdmin}</p>}
                            {!loadingAdminAction && adminUsers.length === 0 && !showCreateUser && <p style={styles.infoText}>No hay otros usuarios registrados.</p>}
                            {!loadingAdminAction && adminUsers.length > 0 && (
                                <div style={styles.adminUserList}>
                                    {adminUsers.map((user) => (
                                        <div key={user.username} style={styles.adminUserItem}>
                                            <div style={styles.adminUserInfo}>
                                                <span style={styles.adminUserName}>{user.name || user.username}</span>
                                                <span style={styles.adminUserRole}>({user.rol})</span>
                                                <div style={{fontSize: '12px', color: '#666', marginTop: '2px'}}>
                                                    Último login: {formatLastLogin(user.last_login)}
                                                </div>
                                            </div>
                                            <div style={styles.adminUserActions}>
                                                <button style={{...styles.adminButton, ...styles.adminEditBtn}} onClick={() => openEditModal(user)} disabled={loadingAdminAction} title="Editar">✏️</button>
                                                <button style={{...styles.adminButton, ...styles.adminPassBtn}} onClick={() => openForcePasswordModal(user.username)} disabled={loadingAdminAction} title="Forzar Contraseña">🔑</button>
                                                <button style={{...styles.adminButton, ...styles.adminDeleteBtn}} onClick={() => handleDeleteUser(user.username)} disabled={loadingAdminAction} title="Eliminar">🗑️</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {/* Botón/Formulario para crear usuario */}
                            <button style={{...styles.button, ...styles.adminActionButton, marginTop: '15px'}} onClick={() => setShowCreateUser(prev => !prev)} disabled={loadingAdminAction}>
                                {showCreateUser ? 'Cancelar Creación' : '+ Crear Nuevo Usuario'}
                            </button>
                            {showCreateUser && (
                                <form onSubmit={handleCreateUser} style={{...styles.editForm, marginTop: '15px', borderTop: '1px solid #eee', paddingTop: '15px'}}>
                                    <h4 style={styles.formSectionTitle}>Nuevo Usuario</h4>
                                    <div style={styles.formGroup}><label style={styles.label} htmlFor="new-username">Username:</label><input id="new-username" style={styles.input} value={newUserData.username} onChange={(e)=>handleAdminInputChange(e, 'username')} required disabled={loadingAdminAction}/></div>
                                    <div style={styles.formGroup}><label style={styles.label} htmlFor="new-password">Password:</label><input id="new-password" type="password" style={styles.input} value={newUserData.password} onChange={(e)=>handleAdminInputChange(e, 'password')} required disabled={loadingAdminAction}/></div>
                                    <div style={styles.formGroup}><label style={styles.label} htmlFor="new-name">Nombre:</label><input id="new-name" style={styles.input} value={newUserData.name} onChange={(e)=>handleAdminInputChange(e, 'name')} disabled={loadingAdminAction}/></div>
                                    <div style={styles.formGroup}><label style={styles.label} htmlFor="new-email">Email:</label><input id="new-email" type="email" style={styles.input} value={newUserData.email} onChange={(e)=>handleAdminInputChange(e, 'email')} disabled={loadingAdminAction}/></div>
                                    <div style={styles.formGroup}><label style={styles.label} htmlFor="new-role">Rol:</label><select id="new-role" style={styles.input} value={newUserData.rol} onChange={(e)=>handleAdminInputChange(e, 'rol')} disabled={loadingAdminAction}><option value="usuario">Usuario</option><option value="admin">Admin</option></select></div>
                                    {/* Mostrar error específico de creación */}
                                    {errorAdmin && showCreateUser && <p style={styles.errorMessage}>{errorAdmin}</p>}
                                    <button type="submit" style={{...styles.button, ...styles.saveButton}} disabled={loadingAdminAction}>{loadingAdminAction ? 'Creando...' : 'Crear Usuario'}</button>
                                </form>
                            )}
                        </Card>

                        {/* Botón para Gestión QR */}
                        <button
                            style={{...styles.button, ...styles.adminActionButton, marginTop: '20px'}}
                            onClick={handleOpenQrModal}
                            disabled={loadingAdminAction || loadingProfile}
                        >
                            Gestionar Códigos QR
                        </button>
                    </>
                )}

                {/* --- Sección Notificaciones --- */}
                {!isEditingInfo && !isChangingPassword && !loadingProfile && !errorProfile && (
                    <Card title="Preferencias (Guardado Local)">
                        <Switch label="Alertas por Devoluciones Tardías" isToggled={alertaDevolucionTardia} onToggle={handleToggleDevolucion} disabled={loadingUpdate || loadingPassword}/>
                        <Switch label="Recordatorios de Mantenimiento" isToggled={recordatorioMantenimiento} onToggle={handleToggleMantenimiento} disabled={loadingUpdate || loadingPassword}/>
                        <p style={styles.infoText}>Estos ajustes se guardan solo en este navegador.</p>
                    </Card>
                )}

                {/* Botón Logout */}
                {!isEditingInfo && !isChangingPassword && !loadingProfile && !errorProfile && (
                     <button style={{ ...styles.button, ...styles.logoutButton }} onClick={handleLogout} disabled={loadingUpdate || loadingPassword}>
                        Cerrar Sesión
                    </button>
                )}

                {/* --- Modales --- */}
                {/* Modal Editar Usuario */}
                {showEditModal && (
                    <Modal title={`Editar Usuario: ${editData.username}`} onClose={closeEditModal}>
                        <div style={styles.formGroup}><label htmlFor="modal-edit-name" style={styles.label}>Nombre:</label><input id="modal-edit-name" style={styles.input} value={editData.name} onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))} disabled={loadingAdminAction}/></div>
                        <div style={styles.formGroup}><label htmlFor="modal-edit-email" style={styles.label}>Correo:</label><input id="modal-edit-email" type="email" style={styles.input} value={editData.email} onChange={(e) => setEditData(prev => ({ ...prev, email: e.target.value }))} disabled={loadingAdminAction}/></div>
                        <div style={styles.formGroup}><label htmlFor="modal-edit-role" style={styles.label}>Rol:</label><select id="modal-edit-role" style={styles.input} value={editData.rol} onChange={(e) => setEditData(prev => ({ ...prev, rol: e.target.value }))} disabled={loadingAdminAction}><option value="usuario">Usuario</option><option value="admin">Admin</option></select></div>
                         {/* Mostrar error DENTRO del modal */}
                        {errorAdmin && <p style={styles.errorMessage}>{errorAdmin}</p>}
                        <div style={styles.buttonGroup}>
                            <button style={{...styles.button, ...styles.saveButton}} onClick={saveEditModal} disabled={loadingAdminAction}>{loadingAdminAction ? 'Guardando...' : 'Guardar'}</button>
                            <button style={{...styles.button, ...styles.cancelButton}} onClick={closeEditModal} disabled={loadingAdminAction}>Cancelar</button>
                        </div>
                    </Modal>
                )}
                {/* Modal Forzar Contraseña */}
                {showForcePasswordModal && (
                     <Modal title={`Forzar Contraseña para ${forcePasswordData.username}`} onClose={closeForcePasswordModal}>
                        <div style={styles.formGroup}><label htmlFor="modal-force-pass" style={styles.label}>Nueva Contraseña:</label><input id="modal-force-pass" type="password" style={styles.input} value={forcePasswordData.newPassword} onChange={(e) => setForcePasswordData(prev => ({ ...prev, newPassword: e.target.value }))} required disabled={loadingAdminAction}/></div>
                         {/* Mostrar error DENTRO del modal */}
                        {errorAdmin && <p style={styles.errorMessage}>{errorAdmin}</p>}
                        <div style={styles.buttonGroup}>
                            <button style={{...styles.button, ...styles.saveButton}} onClick={handleForcePasswordSubmit} disabled={loadingAdminAction}>{loadingAdminAction ? 'Aplicando...' : 'Forzar Cambio'}</button>
                            <button style={{...styles.button, ...styles.cancelButton}} onClick={closeForcePasswordModal} disabled={loadingAdminAction}>Cancelar</button>
                        </div>
                    </Modal>
                )}
                 {/* Modal Gestión QR */}
                {isQrModalOpen && (
                    <QRManagementModal isOpen={isQrModalOpen} onClose={handleCloseQrModal} />
                )}

            </div>
        </Screen>
    );
}


// --- Componente Password Input con Toggle ---
function PasswordInput({ label, id, value, onChange, isVisible, toggleVisibility, disabled, required }) {
    return (
        <div style={styles.formGroup}>
            <label htmlFor={id} style={styles.label}>{label}</label>
            <div style={styles.passwordInputContainer}>
                <input
                    type={isVisible ? 'text' : 'password'}
                    id={id}
                    style={styles.input}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    disabled={disabled}
                    required={required}
                    autoComplete={id === 'old-password' ? 'current-password' : 'new-password'}
                />
                <button type="button" onClick={toggleVisibility} style={styles.eyeButton} aria-label={isVisible ? "Ocultar" : "Mostrar"} disabled={disabled}>
                    {isVisible ? '👁️' : '👁️‍🗨️'}
                </button>
            </div>
        </div>
    );
}

// --- Componente Modal Genérico ---
function Modal({ title, children, onClose }) {
    const handleContentClick = (e) => { e.stopPropagation(); };
    return (
        <div style={styles.modalOverlay} onClick={onClose}>
            <div style={styles.modalContent} onClick={handleContentClick}>
                <h3 style={styles.modalTitle}>{title}</h3>
                {children}
            </div>
        </div>
    );
}


// --- Estilos (sin @keyframes spin) ---
const styles = {
    container: { width: '100%', maxWidth: '600px', margin: '30px auto', padding: '30px', fontFamily: "'Poppins', sans-serif", backgroundColor: '#ffffff', borderRadius: '12px', boxShadow: '0 6px 20px rgba(0,0,0,0.08)', textAlign: 'center', paddingBottom: '40px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', },
    pageTitle: { fontSize: "26px", fontWeight: "700", marginBottom: "10px", color: '#2d3748' },
    imageContainer: { position: 'relative', marginBottom: '5px'},
    profileImage: { width: "130px", height: "130px", borderRadius: "50%", objectFit: "cover", display: "block", border: '4px solid #e2e8f0', cursor: 'pointer', },
    imageLoadingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', fontSize: '14px', fontWeight: 'bold', },
    spinner: { border: '4px solid rgba(255, 255, 255, 0.3)', borderRadius: '50%', borderTop: '4px solid #fff', width: '30px', height: '30px', animation: 'spin 1s linear infinite', }, // Usa @keyframes spin global
    editIconOverlay: { position: 'absolute', bottom: '5px', right: '5px', backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '50%', padding: '6px', lineHeight: '1', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', fontSize: '14px' },
    contentArea: { width: '100%', borderTop: '1px solid #e2e8f0', paddingTop: '25px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px', },
    profileName: { fontSize: "24px", fontWeight: "600", margin: "0 0 5px 0", color: '#1a202c' },
    profileDetail: { color: "#4a5568", fontSize: "14px", margin: "2px 0", lineHeight: '1.6' },
    roleBadge: { display: 'inline-block', padding: '4px 12px', fontSize: '12px', fontWeight: '600', borderRadius: '12px', color: '#fff', backgroundColor: '#718096' },
    editForm: { width: '100%', maxWidth: '450px', display: 'flex', flexDirection: 'column', gap: '18px', marginTop: '10px', alignItems: 'stretch' },
    formSectionTitle: { fontSize: '18px', fontWeight: '600', color: '#333', marginBottom: '10px', textAlign: 'left', width: '100%', borderBottom: '1px solid #eee', paddingBottom: '5px'},
    formGroup: { display: 'flex', flexDirection: 'column', gap: '6px', width: '100%', textAlign: 'left' },
    label: { fontSize: '14px', fontWeight: '500', color: '#4a5568' },
    input: { width: '100%', height: '42px', padding: '0 12px', border: '1px solid #cbd5e0', boxSizing: 'border-box', borderRadius: '6px', fontSize: '14px', fontFamily: 'Poppins', },
    passwordInputContainer: { position: 'relative', width: '100%', },
    eyeButton: { position: 'absolute', top: '50%', right: '10px', transform: 'translateY(-50%)', background: 'none', border: 'none', padding: '5px', cursor: 'pointer', color: '#a0aec0', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: '1', },
    button: { width: "100%", height: "42px", backgroundColor: "#4a5568", color: "#ffffff", fontSize: "14px", fontWeight: "600", borderRadius: "8px", border: "none", cursor: "pointer", padding: '0 15px', margin: "5px 0", transition: 'background-color 0.2s, opacity 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' },
    buttonDisabled: { backgroundColor: '#a0aec0', cursor: 'not-allowed', opacity: 0.7 },
    editButton: { backgroundColor: '#4a5568'}, passwordButton: { backgroundColor: '#dd6b20'}, saveButton: { backgroundColor: '#38a169'}, cancelButton: { backgroundColor: '#a0aec0', color: '#1a202c'}, logoutButton: { backgroundColor: "#e53e3e", fontSize: "15px", fontWeight: "700", height: "44px", marginTop: "25px", width: '100%' },
    buttonGroup: { display: "flex", gap: "12px", marginTop: "10px", width: '100%' },
    buttonContainer: { display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', maxWidth: '350px', marginTop: '15px' },
    loadingText: { color: '#718096', fontStyle: 'italic', padding: '20px 0'},
    errorMessage: { color: '#c53030', backgroundColor: '#fed7d7', border: '1px solid #fbb6ce', borderRadius: '6px', padding: '10px 12px', fontSize: '13px', textAlign: 'center', width: '100%', boxSizing: 'border-box', marginTop: '10px', marginBottom: '10px' },
    errorMessageSubtle: { color: '#c53030', fontSize: '12px', marginTop: '5px' },
    successMessage: { color: '#2f855a', backgroundColor: '#c6f6d5', border: '1px solid #9ae6b4', borderRadius: '6px', padding: '10px 12px', fontSize: '13px', textAlign: 'center', width: '100%', boxSizing: 'border-box', marginBottom: '15px'},
    card: { width: '100%', backgroundColor: '#f7fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '20px', marginTop: '20px', boxSizing: 'border-box'},
    cardTitle: { fontSize: '18px', fontWeight: '600', color: '#2d3748', margin: '0 0 15px 0', paddingBottom: '10px', borderBottom: '1px solid #e2e8f0', textAlign: 'left' },
    // Admin styles
    adminUserList: { marginTop: "12px", width: '100%', },
    adminUserItem: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 4px", borderBottom: "1px solid #eee", gap: '10px'},
    adminUserInfo: { flexGrow: 1, textAlign: 'left'},
    adminUserName: { fontWeight: '600', marginRight: '5px'},
    adminUserRole: { fontSize: '12px', color: '#718096'},
    adminUserActions: { display: 'flex', gap: '5px'},
    adminButton: { padding: "5px 8px", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "14px", lineHeight: '1' },
    adminEditBtn: { backgroundColor: '#4299e1', color: 'white'},
    adminPassBtn: { backgroundColor: '#ed8936', color: 'white'},
    adminDeleteBtn: { backgroundColor: '#f56565', color: 'white'},
    adminActionButton: { backgroundColor: '#667eea', width: 'auto', padding: '0 20px' },
    // Switch styles
    switchContainer: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px", width: '100%', maxWidth: '400px', padding: '5px 0'},
    text: { fontSize: "14px", color: '#333' },
    switchBase: (isToggled) => ({ width: "48px", height: "24px", borderRadius: "40px", backgroundColor: isToggled ? "#38a169" : "#cbd5e0", position: "relative", cursor: "pointer", transition: 'background-color 0.3s ease' }),
    toggleCircle: (isToggled) => ({ position: "absolute", top: "2px", left: isToggled ? "26px" : "2px", width: "20px", height: "20px", borderRadius: "50%", backgroundColor: "white", transition: "left 0.3s ease", boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }),
    disabledText: { color: '#a0aec0' },
    disabledControl: { opacity: 0.6, cursor: 'not-allowed' },
    infoText: { fontSize: '12px', color: '#718096', marginTop: '5px', textAlign: 'left', width: '100%'},
     // Modal styles genéricos
    modalOverlay: { position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", backgroundColor: "rgba(0,0,0,0.6)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 },
    modalContent: { backgroundColor: "#fff", borderRadius: "8px", width: "90%", maxWidth: "400px", padding: "25px", boxShadow: "0px 5px 15px rgba(0,0,0,0.2)", display: 'flex', flexDirection: 'column', gap: '15px' },
    modalTitle: { fontSize: "18px", fontWeight: 700, marginBottom: "10px", textAlign: 'center', color: '#333' },
};

// Placeholder Screen si no está definido
if (typeof Screen === 'undefined') { const Screen = ({ children }) => <div style={{backgroundColor: '#f0f2f5', minHeight: '100vh'}}>{children}</div>; }