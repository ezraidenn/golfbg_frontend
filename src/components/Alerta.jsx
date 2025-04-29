// src/screens/Alerta.jsx

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useLocation, useNavigate } from 'react-router-dom';
// import Screen from "../components/Screen"; // Descomentar si usas Screen

import { API_URL } from '../utils/api'
import styles from './Alerta.module.css';

const BASE_URL = API_URL;

// **********************************************
// Icono Alerta (Sin Cambios)
// ***********************************************/
function AlertIcon() {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#FF6B6B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 8V12" stroke="#FF6B6B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 16H12.01" stroke="#FF6B6B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    );
}

// **********************************************
// Función para calcular retraso (Sin Cambios)
// ***********************************************/
function calcularRetraso(fechaDevolucionStr) {
    if (!fechaDevolucionStr) return { dias: 0, horas: 0, minutos: 0 };

    const fechaDevolucion = new Date(fechaDevolucionStr);
    const ahora = new Date();
    
    // Si la fecha de devolución es futura, retornar 0
    if (fechaDevolucion > ahora) return { dias: 0, horas: 0, minutos: 0 };

    const diferencia = ahora - fechaDevolucion;
    const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));
    const horas = Math.floor((diferencia % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutos = Math.floor((diferencia % (1000 * 60 * 60)) / (1000 * 60));

    return { dias, horas, minutos };
}

// **********************************************
// Tarjeta de Alerta (Con efecto de destello)
// ***********************************************/
function AlertCard({
    bolsa,
    memberDetailsMap, // Mapa completo miembro_code -> detalles
    usuariosMap, // Mapa username -> nombre completo
    onSendReminder,
    isSendingReminder,
    isHighlighted,
    userInfo
}) {
    const retraso = calcularRetraso(bolsa.fecha_devolucion);
    const memberDetails = memberDetailsMap[bolsa.cliente_asignado] || null;
    const cardRef = useRef(null);

    // Efecto para el destello cuando se resalta una bolsa
    useEffect(() => {
        if (isHighlighted && cardRef.current) {
            // Scroll hacia la tarjeta
            cardRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
            console.log(`Tarjeta de bolsa ${bolsa.id} resaltada: ${isHighlighted}`);
        }
    }, [isHighlighted, bolsa.id]);

    // Estilos inline para la tarjeta resaltada
    const cardStyle = isHighlighted ? {
        backgroundColor: '#fee2e2',
        border: '2px solid #f87171'
    } : {};

    const headerStyle = {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: "12px"
    };

    const titleStyle = {
        fontSize: "18px",
        fontWeight: "bold",
        color: "#1F2937",
        marginBottom: "4px"
    };

    const subtitleStyle = {
        fontSize: "14px",
        color: "#6B7280",
        marginBottom: "8px"
    };

    const buttonStyle = {
        padding: "8px 16px",
        backgroundColor: isSendingReminder === 'sending' ? "#A0AEC0" :
                       isSendingReminder === 'sent' ? "#68D391" :
                       isSendingReminder === 'error' ? "#FC8181" : "#3B82F6",
        color: "#FFFFFF",
        border: "none",
        borderRadius: "6px",
        cursor: isSendingReminder === 'sending' ? "not-allowed" : "pointer",
        fontSize: "14px",
        fontWeight: "500",
        transition: "all 0.2s"
    };

    const buttonText = isSendingReminder === 'sending' ? "Enviando..." :
                      isSendingReminder === 'sent' ? "✓ Enviado" :
                      isSendingReminder === 'error' ? "Error" : "Enviar Recordatorio";

    // Obtener el nombre completo del responsable si está disponible
    let responsableNombre = "No disponible";
    let responsableUsername = "No disponible";
    
    // Verificar todos los posibles campos que podrían contener el username del responsable
    if (bolsa.ultimo_usuario) {
        responsableUsername = bolsa.ultimo_usuario;
        responsableNombre = bolsa.ultimo_usuario;
    } else if (bolsa.ultimo_usuario_historial) {
        responsableUsername = bolsa.ultimo_usuario_historial;
        responsableNombre = bolsa.ultimo_usuario_historial;
    }
    
    // Buscar en el historial la última acción de préstamo para obtener el nombre completo
    if (bolsa.historial && Array.isArray(bolsa.historial) && bolsa.historial.length > 0) {
        // Buscar la última acción de préstamo con nombre_usuario_accion
        for (const entrada of bolsa.historial) {
            if (entrada.accion && 
                entrada.accion.toLowerCase().includes('prestado') && 
                entrada.nombre_usuario_accion) {
                responsableNombre = entrada.nombre_usuario_accion;
                break;
            }
        }
    }
    
    // Si el usuario actual es el responsable, usar su nombre
    if (userInfo && 
        userInfo.username && 
        userInfo.nombre && 
        (userInfo.username === responsableUsername)) {
        responsableNombre = userInfo.nombre;
    }
    
    console.log(`[Alerta] Responsable para bolsa ${bolsa.id}: ${responsableUsername} (Nombre: ${responsableNombre})`);

    return (
        <div 
            ref={cardRef} 
            className={`${styles.card} ${isHighlighted ? styles.highlightedCard : ''}`}
            style={cardStyle}
        >
            <div style={headerStyle}>
                <div>
                    <div style={titleStyle}>
                        {memberDetails ? `${memberDetails.FirstName} ${memberDetails.LastName}` : bolsa.cliente_asignado}
                    </div>
                    <div style={subtitleStyle}>
                        Bolsa asignada
                    </div>
                </div>
                <AlertIcon />
            </div>
            <div style={{ marginBottom: "12px" }}>
                <div style={{ fontSize: "14px", color: "#374151" }}>
                    Retraso: {retraso.dias} días, {retraso.horas} horas, {retraso.minutos} minutos
                </div>
                <div style={{ fontSize: "14px", color: "#6B7280", marginTop: "4px" }}>
                    Fecha devolución: {new Date(bolsa.fecha_devolucion).toLocaleString()}
                </div>
                <div style={{ fontSize: "14px", color: "#6B7280", marginTop: "4px" }}>
                    Responsable: {responsableNombre}
                </div>
            </div>
            <button 
                style={buttonStyle} 
                onClick={() => onSendReminder(bolsa.id, bolsa.cliente_asignado)}
                disabled={isSendingReminder === 'sending'}
            >
                {buttonText}
            </button>
        </div>
    );
}

// **********************************************
// Pantalla principal (Handler de notificación CORREGIDO)
// ***********************************************/
export default function Alerta() {
  const [bolsasRetrasadas, setBolsasRetrasadas] = useState([]);
  const [memberDetailsMap, setMemberDetailsMap] = useState({});
  const [usuariosMap, setUsuariosMap] = useState({});
  const [sendingStatus, setSendingStatus] = useState({});
  const [highlightedBolsaId, setHighlightedBolsaId] = useState(null);
  const [userInfo, setUserInfo] = useState({ name: null, username: null }); // Estado para usuario logueado
  const [cacheUsuarios, setCacheUsuarios] = useState({}); // Caché de información de usuarios
  const token = localStorage.getItem("token");
  const location = useLocation();
  const navigate = useNavigate();

  // Cargar perfil del usuario actual
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!token) return;
      
      try {
        const response = await fetch(`${BASE_URL}/usuarios/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          setUserInfo({
            name: data.name || data.username,
            username: data.username
          });
          
          // Guardar en caché
          setCacheUsuarios(prev => ({
            ...prev,
            [data.username]: data.name || data.username
          }));
          
          console.log("[Alerta] Perfil de usuario cargado:", data.username);
        }
      } catch (error) {
        console.error("Error cargando perfil de usuario:", error);
      }
    };
    
    fetchUserProfile();
  }, [token]);

  // Extraer el ID de la bolsa de los parámetros de URL
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const bolsaId = searchParams.get('highlight');
    if (bolsaId) {
      const bolsaIdInt = parseInt(bolsaId, 10);
      setHighlightedBolsaId(bolsaIdInt);
      console.log(`Resaltando bolsa ID: ${bolsaIdInt}`);
    } else {
      setHighlightedBolsaId(null);
    }
  }, [location]);

  // Cargar bolsas retrasadas
  const cargarBolsasRetrasadas = useCallback(async () => {
    if (!token) return;

    try {
      const response = await fetch(`${BASE_URL}/bolsas/retrasadas/`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error(`Error ${response.status}`);

      const data = await response.json();
      console.log("[Alerta] Bolsas retrasadas recibidas:", data);
      
      // Imprimir un ejemplo de bolsa para ver su estructura
      if (data && data.length > 0) {
        console.log("[Alerta] Ejemplo de estructura de bolsa:", JSON.stringify(data[0], null, 2));
      }
      
      // Simplemente usar los datos tal como vienen
      setBolsasRetrasadas(data);

      // Extraer códigos de cliente únicos
      const clienteCodes = [...new Set(data.map(b => b.cliente_asignado))];
      
      // Llamar a las funciones para obtener detalles
      if (clienteCodes.length > 0) {
        // Usar el endpoint correcto para miembros
        fetchMemberDetails(clienteCodes);
      }

    } catch (error) {
      console.error("Error cargando bolsas retrasadas:", error);
      alert("Error cargando bolsas retrasadas");
    }
  }, [token]);

  // --- Obtener información de usuarios ---
  const obtenerInformacionUsuarios = async (username, token) => {
    console.log(`[Alerta] Buscando información para el usuario: ${username}`);
    
    // Si ya tenemos el nombre en caché, lo usamos
    if (cacheUsuarios[username]) {
      console.log(`[Alerta] Usando nombre en caché para ${username}: ${cacheUsuarios[username]}`);
      return cacheUsuarios[username];
    }
    
    try {
      // Intentar obtener el usuario actual
      const userResponse = await fetch(`${BASE_URL}/usuarios/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (userResponse.ok) {
        const userData = await userResponse.json();
        if (userData && userData.nombre) {
          console.log(`[Alerta] Perfil de usuario actual obtenido: ${userData.nombre}`);
          cacheUsuarios[username] = userData.nombre;
          return userData.nombre;
        }
      }
      
      // Si no se encuentra el nombre, usar el username como fallback
      console.log(`[Alerta] No se encontró nombre para ${username}, usando username como fallback`);
      return username;
    } catch (error) {
      console.log(`[Alerta] Error obteniendo información del usuario ${username}:`, error);
      return username;
    }
  };

  // --- Cargar detalles de miembros ---
  const fetchMemberDetails = async (clienteCodes) => {
    if (!token || !clienteCodes.length) return;

    try {
      const response = await fetch(`${BASE_URL}/miembros?q=${clienteCodes[0]}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error(`Error ${response.status}`);

      const details = await response.json();
      
      // Crear un mapa de código -> detalles
      const detailsMap = {};
      if (Array.isArray(details)) {
        details.forEach(member => {
          if (member && member.ClubMemberCode) {
            detailsMap[member.ClubMemberCode] = member;
          }
        });
      }
      
      setMemberDetailsMap(detailsMap);

    } catch (error) {
      console.error("Error cargando detalles de miembros:", error);
    }
  };
  
  // --- Cargar todos los usuarios ---
  const fetchAllUsers = async () => {
    if (!token) return;
    
    try {
      const response = await fetch(`${BASE_URL}/usuarios/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!response.ok) {
        console.error(`Error al obtener usuarios: ${response.status}`);
        // Si falla, usar al menos el usuario actual
        if (userInfo && userInfo.username) {
          const fallbackMap = { [userInfo.username]: userInfo.name || userInfo.username };
          setUsuariosMap(fallbackMap);
        }
        return;
      }
      
      const usuarios = await response.json();
      
      // Crear un mapa de username -> nombre completo
      const map = {};
      if (Array.isArray(usuarios)) {
        usuarios.forEach(usuario => {
          if (usuario && usuario.username) {
            // Usar el campo name como nombre completo
            map[usuario.username] = usuario.name || usuario.username;
          }
        });
        console.log("[Alerta] Mapa de usuarios cargado:", map);
        setUsuariosMap(map);
      } else {
        console.error("Datos de usuarios no válidos:", usuarios);
        // Usar al menos el usuario actual
        if (userInfo && userInfo.username) {
          const fallbackMap = { [userInfo.username]: userInfo.name || userInfo.username };
          setUsuariosMap(fallbackMap);
        }
      }
    } catch (error) {
      console.error("Error cargando todos los usuarios:", error);
      // Usar al menos el usuario actual
      if (userInfo && userInfo.username) {
        const fallbackMap = { [userInfo.username]: userInfo.name || userInfo.username };
        setUsuariosMap(fallbackMap);
      }
    }
  };

  // --- Efecto para cargar datos iniciales ---
  useEffect(() => {
    cargarBolsasRetrasadas();
  }, [cargarBolsasRetrasadas]);

  // --- Handler para enviar notificación CORREGIDO ---
  const handleSendNotification = async (bolsaId, clienteCode) => {
      if (!token) { alert("Error: No autenticado."); return; }
      
      setSendingStatus(prev => ({ ...prev, [bolsaId]: 'sending' }));
      console.log(`Enviando recordatorio para bolsa ${bolsaId} a cliente ${clienteCode}...`);

      const notificationUrl = `${BASE_URL}/notifications/recordatorio`;
      const bolsa = bolsasRetrasadas.find(b => b.id === bolsaId);
      const memberDetails = memberDetailsMap[clienteCode];
      const memberName = memberDetails ? `${memberDetails.FirstName} ${memberDetails.LastName}` : clienteCode;

      try {
          // Obtener el usuario actual (admin u otro)
          const userResponse = await fetch(`${BASE_URL}/usuarios/me`, {
              headers: { Authorization: `Bearer ${token}` }
          });
          
          if (!userResponse.ok) throw new Error(`Error ${userResponse.status} al obtener usuario actual`);
          
          const userData = await userResponse.json();
          const currentUsername = userData.username;
          
          // Enviar notificación a todos los administradores y al usuario actual
          const response = await fetch(notificationUrl, {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`
              },
              body: JSON.stringify({
                  mensaje: `⚠️ Recordatorio: La bolsa asignada a ${memberName} está retrasada.`,
                  usuarios: ["admin", currentUsername], // Notificar al admin y al usuario actual
                  tipo: "recordatorio_bolsa",
                  link: `/alerta?highlight=${bolsaId}` // Link que llevará a la pantalla de alertas con la bolsa resaltada
              })
          });

          if (!response.ok) {
              let errorDetail = `Error ${response.status}`;
              try {
                  const errData = await response.json();
                  if (response.status === 422 && errData.detail) {
                       if (Array.isArray(errData.detail)) { errorDetail = errData.detail.map(d => `${d.loc.join('.')}: ${d.msg}`).join('; '); }
                       else { errorDetail = errData.detail; }
                       errorDetail = `Datos inválidos: ${errorDetail}`;
                  } else { errorDetail = errData.detail || errorDetail; }
              } catch (e) { errorDetail = `${errorDetail} (${response.statusText})`; }
              throw new Error(errorDetail);
          }

          setSendingStatus(prev => ({ ...prev, [bolsaId]: 'sent' }));
          console.log(`Recordatorio enviado exitosamente para bolsa ${bolsaId}`);

      } catch (error) {
          console.error("Error enviando notificación:", error);
          alert(`Error al enviar recordatorio: ${error.message}`);
          setSendingStatus(prev => ({ ...prev, [bolsaId]: 'error' }));
      }
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Bolsas Retrasadas</h1>
      {bolsasRetrasadas.length === 0 ? (
        <div className={styles.emptyState}>No hay bolsas retrasadas</div>
      ) : (
        bolsasRetrasadas.map(bolsa => (
          <AlertCard
            key={bolsa.id}
            bolsa={bolsa}
            memberDetailsMap={memberDetailsMap}
            usuariosMap={usuariosMap}
            onSendReminder={handleSendNotification}
            isSendingReminder={sendingStatus[bolsa.id]}
            isHighlighted={bolsa.id === highlightedBolsaId}
            userInfo={userInfo}
          />
        ))
      )}
    </div>
  );
}

function Screen({ children }) {
  return <div className={styles.container}>{children}</div>;
}