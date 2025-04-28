// src/screens/Alerta.jsx

import React, { useState, useEffect, useCallback } from "react";
// import Screen from "../components/Screen"; // Descomentar si usas Screen

import { API_URL } from '../utils/api'

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
// Tarjeta de Alerta (Sin Cambios Internos)
// ***********************************************/
function AlertCard({
    bolsa,
    memberDetailsMap, // Mapa completo miembro_code -> detalles
    onSendReminder,
    isSendingReminder
}) {
    const retraso = calcularRetraso(bolsa.fecha_devolucion);
    const memberDetails = memberDetailsMap[bolsa.cliente_asignado] || null;

    const cardStyle = {
        backgroundColor: "#FFFFFF",
        borderRadius: "8px",
        padding: "16px",
        marginBottom: "16px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        border: "1px solid #E5E7EB"
    };

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

    return (
        <div style={cardStyle}>
            <div style={headerStyle}>
                <div>
                    <div style={titleStyle}>Bolsa {bolsa.id}</div>
                    <div style={subtitleStyle}>
                        {memberDetails ? `${memberDetails.FirstName} ${memberDetails.LastName}` : bolsa.cliente_asignado}
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
  const [sendingStatus, setSendingStatus] = useState({});
  const token = localStorage.getItem("token");

  // --- Cargar bolsas retrasadas ---
  const fetchBolsasRetrasadas = useCallback(async () => {
    if (!token) return;

    try {
      const response = await fetch(`${BASE_URL}/bolsas/retrasadas/`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) throw new Error(`Error ${response.status}`);

      const data = await response.json();
      setBolsasRetrasadas(data);

      // Extraer códigos de cliente únicos
      const clienteCodes = [...new Set(data.map(b => b.cliente_asignado))];
      
      // Cargar detalles de miembros
      await fetchMemberDetails(clienteCodes);

    } catch (error) {
      console.error("Error cargando bolsas retrasadas:", error);
      alert("Error cargando bolsas retrasadas");
    }
  }, [token]);

  // --- Cargar detalles de miembros ---
  const fetchMemberDetails = async (clienteCodes) => {
    if (!token || !clienteCodes.length) return;

    try {
      const response = await fetch(`${BASE_URL}/miembros/details`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ codes: clienteCodes })
      });

      if (!response.ok) throw new Error(`Error ${response.status}`);

      const details = await response.json();
      setMemberDetailsMap(details);

    } catch (error) {
      console.error("Error cargando detalles de miembros:", error);
    }
  };

  // --- Efecto para cargar datos iniciales ---
  useEffect(() => {
    fetchBolsasRetrasadas();
  }, [fetchBolsasRetrasadas]);

  // --- Handler para enviar notificación CORREGIDO ---
  const handleSendNotification = async (bolsaId, responsibleUserCode) => {
      if (!token) { alert("Error: No autenticado."); return; }
      if (!responsibleUserCode) { alert("Error: No se pudo identificar al usuario responsable."); return; }

      setSendingStatus(prev => ({ ...prev, [bolsaId]: 'sending' }));
      console.log(`Enviando recordatorio para bolsa ${bolsaId} a usuario ${responsibleUserCode}...`);

      const notificationUrl = `${BASE_URL}/notifications/recordatorio`;
      const bolsa = bolsasRetrasadas.find(b => b.id === bolsaId);
      const memberDetails = memberDetailsMap[responsibleUserCode];
      const memberName = memberDetails ? `${memberDetails.FirstName} ${memberDetails.LastName}` : responsibleUserCode;

      try {
          const response = await fetch(notificationUrl, {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`
              },
              body: JSON.stringify({
                  mensaje: `⚠️ Recordatorio: La bolsa ${bolsaId} asignada a ${memberName} está retrasada.`,
                  usuarios: [responsibleUserCode],
                  tipo: "recordatorio_bolsa",
                  link: `/bolsas/${bolsaId}`
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
          console.log(`Recordatorio enviado exitosamente para bolsa ${bolsaId} a ${responsibleUserCode}`);

      } catch (error) {
          console.error("Error enviando notificación:", error);
          alert(`Error al enviar recordatorio a ${responsibleUserCode}: ${error.message}`);
          setSendingStatus(prev => ({ ...prev, [bolsaId]: 'error' }));
      }
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Bolsas Retrasadas</h1>
      {bolsasRetrasadas.length === 0 ? (
        <div style={styles.emptyState}>No hay bolsas retrasadas</div>
      ) : (
        bolsasRetrasadas.map(bolsa => (
          <AlertCard
            key={bolsa.id}
            bolsa={bolsa}
            memberDetailsMap={memberDetailsMap}
            onSendReminder={handleSendNotification}
            isSendingReminder={sendingStatus[bolsa.id]}
          />
        ))
      )}
    </div>
  );
}

// --- Estilos (Originales) ---
const styles = {
  container: { margin: "0 auto", maxWidth: "420px", minHeight: "100vh", backgroundColor: "#f5f5f5", padding: "16px", paddingBottom: "80px", fontFamily: "Poppins, sans-serif", boxSizing: "border-box", },
  title: { fontSize: "20px", fontWeight: "bold", marginBottom: "20px", textAlign: "center", color: '#333', },
  emptyState: { textAlign: "center", color: "#666", marginTop: "32px", fontSize: "16px", },
  loadingState: { textAlign: "center", color: "#666", marginTop: "32px", fontSize: "16px", },
  errorState: { textAlign: "center", color: "#dc2626", marginTop: "32px", fontSize: "16px", },
};

function Screen({ children }) {
  return <div style={styles.container}>{children}</div>;
}