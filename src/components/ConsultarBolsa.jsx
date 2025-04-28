// src/components/ConsultarBolsa.jsx
// VERSIÓN MEJORADA CON CARGA ESPECÍFICA, TOKEN CHECK, Y SUBCOMPONENTES

import React, { useState, useEffect, useCallback } from "react";
import QRScanner from "../components/QRScanner";
import Screen from "../components/Screen"; // Asume layout base

import { API_URL } from '../utils/api'

const BASE_URL = API_URL;

// --- Constantes y Helpers (Restaurado diccionario completo) ---
const ClubStatusMeanings = {
  "ACTIVE": "Activo - Sin Crédito", "ACTIVE-CB": "Activo - Con CreditBook", "ACTIVE-CC": "Activo - Con Crédito",
  "ACTIVE-FR": "Activo - Foráneo Sin Crédito", "ACTIVE-FRB": "Activo - Foráneo Con CreditBook", "ACTIVE-FRC": "Activo - Foráneo Con Crédito",
  "ACTIVE-MAR": "Activo - Casado Sin Crédito", "ACTIVE-MRB": "Activo - Casado Con CreditBook", "ACTIVE-MRC": "Activo - Casado Con Crédito",
  "ACTIVE-OWN": "Activo - Dueño VIP", "ACTIVE-Z": "Activo - Sin Estados De Cuenta", "CASH": "Cash - CreditCard",
  "DECEASED": "Fallecido", "EMPLEADO": "Empleado", "INACTIVE": "Inactivo - Residente", "INACTIVE-S": "Inactivo - Suspensión",
  "NO CREDENC": "Sin Credencial", "RESIGNED": "Renunció", "SUSPEND4": "Suspendido Incobrables", "SUSPENDED": "Suspendido"
};
// --- Fin Diccionario ---

// --- Helpers Originales ---
function formatName(first, last, code) {
    const validFirst = first && String(first).toLowerCase() !== "null" ? String(first).trim() : "";
    const validLast = last && String(last).toLowerCase() !== "null" ? String(last).trim() : "";
    const fullName = `${validFirst} ${validLast}`.trim();
    return fullName || (code ? String(code) : '') || "Desconocido";
}
function getStatusColor(statusCode) {
  if (statusCode && String(statusCode).trim().toUpperCase().startsWith("ACTIVE")) return "#008000"; return "#FF0000";
}
// --- Helper formatDate Modificado para Robustez ---
function formatDate(dateString) {
    if (!dateString) return "No disponible";
    try {
        // Intenta parsear como ISO 8601 primero
        const dt = new Date(String(dateString).replace('Z', '+00:00'));
        if(isNaN(dt.getTime())) throw new Error("Invalid ISO date");
        return dt.toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' });
    } catch {
        // Intenta parsear formato 'DD/MM/YYYY, HH:MM:SS' como fallback
        try {
            const parts = String(dateString).split(', ');
            const dateParts = parts[0].split('/');
            const timeParts = parts[1].split(':');
            // Asume UTC si no hay zona horaria en este formato
            const dt = new Date(Date.UTC(parseInt(dateParts[2]), parseInt(dateParts[1]) - 1, parseInt(dateParts[0]), parseInt(timeParts[0]), parseInt(timeParts[1]), parseInt(timeParts[2])));
            if(isNaN(dt.getTime())) throw new Error("Invalid locale date");
            return dt.toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' });
        } catch (e) {
            console.warn("Could not parse date:", dateString, e);
            return dateString; // Devuelve original si falla todo
        }
    }
}
// --- Fin Helpers ---


// --- Subcomponentes (MemberInfoDisplay y ItemListDisplay originales) ---
function MemberInfoDisplay({ memberInfo, clienteAsignado, memberErrorMsg, loadingMember }) {
    // --- Código Original ---
    if (loadingMember) { return <p style={{...styles.detailText, ...styles.subtleText}}>Buscando detalles del miembro...</p>; }
    if (memberInfo) { return ( <div style={styles.memberCard}> <div style={styles.memberTextTitle}>Cliente Asignado:</div> <div>{formatName(memberInfo.FirstName, memberInfo.LastName, memberInfo.ClubMemberCode)}</div> <div style={styles.memberText}><strong>Código:</strong> {memberInfo.ClubMemberCode}</div> <div style={styles.memberText}><strong>Edad:</strong> {memberInfo.Age != null ? memberInfo.Age : "---"}</div> <div style={{ ...styles.memberText, color: getStatusColor(memberInfo.ClubStatusRuleCode), fontWeight: 'bold' }}> <strong>Estado Miembro:</strong>{' '} {ClubStatusMeanings[String(memberInfo.ClubStatusRuleCode || '').trim().toUpperCase()] || memberInfo.ClubStatusRuleCode || "---"} </div> </div> ); }
    if (clienteAsignado) { return ( <p style={styles.detailText}> <strong>Cliente Asignado:</strong> {clienteAsignado} {memberErrorMsg && <span style={styles.subtleErrorText}> ({memberErrorMsg})</span>} {!memberErrorMsg && <span style={styles.subtleText}> (Detalles no encontrados o error)</span>} </p> ); }
    return <p style={styles.detailText}><strong>Cliente Asignado:</strong> No asignado</p>;
    // --- Fin Código Original ---
}
function ItemListDisplay({ items, onImageClick }) {
    // --- Código Original ---
    if (!Array.isArray(items) || items.length === 0) { return <p style={styles.detailText}>No hay ítems registrados.</p>; }
    return ( <> <h4 style={styles.subTitle}>Ítems en la Bolsa</h4> {items.map((item, idx) => { const photoFilename = item.photo_filename; let itemPhotoUrl = null; if (photoFilename) { const baseUrlClean = BASE_URL.endsWith('/') ? BASE_URL.slice(0, -1) : BASE_URL; itemPhotoUrl = `${baseUrlClean}/static/item_photos/${photoFilename}?t=${Date.now()}`; } return ( <div key={idx} style={styles.itemCard}> <div style={styles.itemContentWrapper}> <div style={styles.itemTextContainer}> <p style={styles.itemText}><strong>Descripción:</strong> {item.descripcion || "---"}</p> <p style={styles.itemText}><strong>Cantidad:</strong> {item.cantidad != null ? item.cantidad : "---"}</p> <p style={styles.itemText}><strong>Estado Ítem:</strong> {item.estado || "---"}</p> {item.comentario && <p style={styles.itemText}><strong>Comentario:</strong> {item.comentario}</p>} </div> {itemPhotoUrl && ( <img src={itemPhotoUrl} alt={`Foto ${item.descripcion || `ítem ${idx + 1}`}`} style={styles.itemPhotoStyle} onClick={() => onImageClick(itemPhotoUrl)} /> )} </div> </div> ); })} </> );
    // --- Fin Código Original ---
}


// --- >>> INICIO: HistoryDisplay Modificado (Usa nombre_usuario_accion) <<< ---
function HistoryDisplay({ historial, userInfo }) { // Mantenemos userInfo como fallback
    if (!Array.isArray(historial) || historial.length === 0) {
        return <p style={styles.detailText}>Sin historial de movimientos.</p>;
    }

    // Ordenar por fecha (sin cambios)
    const sortedHistorial = [...historial].sort((a, b) => {
        const parseDate = (str) => { try { const dt=new Date(String(str).replace('Z','+00:00')); if(isNaN(dt.getTime())) throw Error(); return dt.getTime(); } catch { try { const p=String(str).split(', '); const dP=p[0].split('/'); const tP=p[1].split(':'); const dt=new Date(Date.UTC(parseInt(dP[2]),parseInt(dP[1])-1,parseInt(dP[0]),parseInt(tP[0]),parseInt(tP[1]),parseInt(tP[2]))); if(isNaN(dt.getTime())) throw Error(); return dt.getTime(); } catch { return NaN; } } };
        const dateA = parseDate(a?.fecha); const dateB = parseDate(b?.fecha);
        return (isNaN(dateB) ? -Infinity : dateB) - (isNaN(dateA) ? -Infinity : dateA);
    });

    return (
        <>
            <h4 style={styles.subTitle}>Historial Reciente</h4>
            {sortedHistorial.slice(0, 10).map((h, index) => {
                 let displayAction = h.accion || "Acción no registrada";

                 // --- Lógica para Mostrar Nombre (CORREGIDA) ---
                 // 1. Prioridad: Usar nombre_usuario_accion si existe en la entrada h
                 if (h.nombre_usuario_accion) {
                     const match = displayAction.match(/^(.* por )(\S+)(\s*.*)$/i);
                     if (match && match[2]) { // Si la acción tiene formato "Acción por [username]"
                         // Reemplaza '[username]' con el nombre/username del backend
                         displayAction = `${match[1]}${h.nombre_usuario_accion}${match[3] || ''}`;
                     }
                     // Podrías añadir un else aquí para simplemente añadir el nombre al final si el patrón no coincide:
                     // else { displayAction = `${displayAction} (${h.nombre_usuario_accion})`; }
                 }
                 // 2. Fallback: Si no vino nombre del backend Y la acción coincide con el usuario actual logueado
                 else if (userInfo?.username && displayAction.includes(`por ${userInfo.username}`)) {
                     const regex = new RegExp(`(por\\s+)${userInfo.username}(\\s|$)`, 'i');
                     displayAction = displayAction.replace(regex, `$1${userInfo.name || userInfo.username}$2`);
                 }
                 // 3. Si no, se muestra la acción como viene (con el username original)
                 // --- Fin Lógica Nombre ---

                 return (
                    <div key={`hist-${index}-${h?.fecha || index}`} style={styles.histCard}>
                      <p style={styles.histText}>
                         <span style={styles.subtleText}>{formatDate(h.fecha)}</span><br/>
                         {displayAction}
                      </p>
                    </div>
                 );
            })}
            {sortedHistorial.length > 10 && <p style={styles.subtleText}>(Mostrando últimos 10 de {sortedHistorial.length})</p>}
        </>
    );
}
// --- >>> FIN: HistoryDisplay Modificado <<< ---


// --- BolsaDetailsCard Modificado (Pasa userInfo) ---
function BolsaDetailsCard({ bolsa, memberInfo, memberErrorMsg, loadingMember, onImageClick, userInfo }) {
    const getEstadoStyle = (estado) => { let bC="#6c757d"; if(estado==="Disponible")bC="#28a745"; else if(estado==="En tránsito")bC="#ffc107"; return{borderLeft:`4px solid ${bC}`,paddingLeft:"10px",marginLeft:"-10px",backgroundColor:"#f8f9fa"}; };
    /* <<< NUEVO >>>  – preferimos la ruta completa enviada por backend  */
    const ubicacionCompleta =
    (bolsa?.ubicacion_completa ??
      [bolsa?.area_general, bolsa?.pasillo, bolsa?.estante_nivel, bolsa?.anden]
        .filter(Boolean)
        .join(" / ")) || "Sin ubicación";

    return (
        <div style={styles.detailCard}>
            <h3 style={styles.detailTitle}>Detalle de la Bolsa</h3>
            <p style={{ ...styles.detailText, ...getEstadoStyle(bolsa?.estado) }}>
              <strong>Estado:</strong> {bolsa?.estado || "---"}
            </p>
            <p style={styles.detailText}>
              <strong>Ubicación:</strong> {ubicacionCompleta}
            </p>
            <MemberInfoDisplay
              memberInfo={memberInfo}
              clienteAsignado={bolsa?.cliente_asignado}
              memberErrorMsg={memberErrorMsg}
              loadingMember={loadingMember}
            />
            <p style={styles.detailText}>
              <strong>Notas Internas:</strong> {bolsa?.notas_internas || "---"}
            </p>
            <p
              style={{
                ...styles.detailText,
                borderLeft: "4px solid #ffc107",
                paddingLeft: "10px",
                marginLeft: "-10px",
                backgroundColor: "#fff9e6",
              }}
            >
              <strong>Próx. Mantenimiento:</strong>{" "}
              {formatDate(bolsa?.fecha_mantenimiento)}
            </p>
            <p
              style={{
                ...styles.detailText,
                borderLeft: "4px solid #17a2b8",
                paddingLeft: "10px",
                marginLeft: "-10px",
                backgroundColor: "#e2f3f5",
              }}
            >
              <strong>Devolución Estimada:</strong>{" "}
              {formatDate(bolsa?.fecha_devolucion)}
            </p>
            <ItemListDisplay
              items={Array.isArray(bolsa?.items) ? bolsa.items : []}
              onImageClick={onImageClick}
            />
            {/* Pasar userInfo a HistoryDisplay */}
            <HistoryDisplay
              historial={Array.isArray(bolsa?.historial) ? bolsa.historial : []}
              userInfo={userInfo}
            />
        </div>
    );
}
// --- Fin BolsaDetailsCard Modificado ---


// Visor Fullscreen (Original)
function FullscreenImageViewer({ imageUrl, onClose }) { if(!imageUrl)return null; useEffect(()=>{document.body.style.overflow="hidden"; return()=>{document.body.style.overflow="unset"}},[]); const oS={position:"fixed",top:0,left:0,width:"100vw",height:"100vh",backgroundColor:"rgba(0,0,0,.85)",zIndex:10001,display:"flex",justifyContent:"center",alignItems:"center",backdropFilter:"blur(5px)"}; const iS={maxWidth:"95%",maxHeight:"90%",display:"block",objectFit:"contain"}; const cBS={position:"absolute",top:"15px",right:"15px",background:"rgba(255,255,255,.2)",border:"none",color:"white",fontSize:"24px",cursor:"pointer",borderRadius:"50%",width:"35px",height:"35px",display:"flex",justifyContent:"center",alignItems:"center",lineHeight:"1"}; return(<div style={oS} onClick={onClose}><img src={imageUrl} alt="Vista completa" style={iS} onClick={e=>e.stopPropagation()}/><button style={cBS} onClick={onClose} title="Cerrar">×</button></div>); }

// --- Componente Principal Modificado ---
function ConsultarBolsa() {
  // Estados originales + userInfo
  const [showQR, setShowQR] = useState(false);
  const [bolsa, setBolsa] = useState(null);
  const [memberInfo, setMemberInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMember, setLoadingMember] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [memberErrorMsg, setMemberErrorMsg] = useState("");
  const [token, setToken] = useState(null);
  const [fullscreenImageUrl, setFullscreenImageUrl] = useState(null);
  const [showFullscreenViewer, setShowFullscreenViewer] = useState(false);
  const [userInfo, setUserInfo] = useState({ name: null, username: null }); // Estado para usuario logueado

  // Cargar token y perfil inicial
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (!storedToken) { setErrorMsg("Se requiere iniciar sesión."); }
    else {
        setToken(storedToken);
        const fetchUserProfile = async () => { try { const res = await fetch(`${BASE_URL}/usuarios/me`, { headers: { Authorization: `Bearer ${storedToken}` } }); if (res.ok) { const data = await res.json(); setUserInfo({ name: data.name || data.username, username: data.username }); } else { setUserInfo({ name: 'Usuario', username: null }); } } catch (error) { setUserInfo({ name: 'Usuario (Error)', username: null }); } };
        fetchUserProfile();
    }
  }, []);

  // Buscar bolsa (Original)
  const handleFetchBolsa = useCallback(async (idParam) => {
    setBolsa(null); setMemberInfo(null); setErrorMsg(""); setMemberErrorMsg(""); setLoadingMember(false);
    if(!idParam||!token){setErrorMsg(!token?"Se requiere sesión.":"ID inválido."); return} setLoading(true);
    try{const tID=String(idParam).trim(); if(!tID)throw new Error("ID inválido."); const eID=encodeURIComponent(tID); console.log(`Fetching bolsa: ${tID}`); const r=await fetch(`${BASE_URL}/bolsas/${eID}`,{headers:{Authorization:`Bearer ${token}`}}); if(!r.ok){let d=`Error ${r.status}`; if(r.status===401)d="Acceso no autorizado."; else if(r.status===404)d=`Bolsa ID '${tID}' no encontrada.`; else try{d=(await r.json()).detail||d}catch(e){} throw new Error(d);} const d=await r.json(); if(!d||typeof d !== 'object'||!d.id){throw new Error("Respuesta inválida.")} console.log("Bolsa data recibida:",d); setBolsa(d)}catch(e){console.error("Err fetch bolsa:",e); setErrorMsg(e.message||"Error"); setBolsa(null)}finally{setLoading(false)}
  }, [token]);

  // Buscar miembro (Original)
  useEffect(()=>{const f=async()=>{if(!bolsa||!bolsa.cliente_asignado||!token){setMemberInfo(null); if(!bolsa?.cliente_asignado) setMemberErrorMsg(""); return} if(memberInfo?.ClubMemberCode===bolsa.cliente_asignado) return; setMemberInfo(null); setMemberErrorMsg(""); setLoadingMember(!0); try{const c=String(bolsa.cliente_asignado).trim(); if(!c)return; const e=encodeURIComponent(c); console.log(`Fetching member: ${c}`); const r=await fetch(`${BASE_URL}/miembros?q=${e}`,{headers:{Authorization:`Bearer ${token}`}}); if(!r.ok)throw new Error(`Error ${r.status}`); const d=await r.json(); const m=Array.isArray(d)?d.find(i=>i.ClubMemberCode?.trim().toUpperCase()===c.toUpperCase()):null; if(m){setMemberInfo(m)}else{setMemberErrorMsg("Detalles no encontrados.")}}catch(e){console.error("Err fetch member:",e); setMemberErrorMsg(e.message||"Error detalles.")}finally{setLoadingMember(!1)}}; f()},[bolsa,token,memberInfo]);

  // Handlers QR (Originales)
  const handleOpenQR=()=>{setShowQR(!0); setErrorMsg(""); setMemberErrorMsg("")}; const handleCloseQR=()=>setShowQR(!1); const handleQRResult=s=>{handleCloseQR(); const t=s?String(s).trim():""; if(t)handleFetchBolsa(t); else setErrorMsg("QR no detectado.")};

  // Handlers Fullscreen (Originales)
  const handleShowFullscreen=(i)=>{setFullscreenImageUrl(i); setShowFullscreenViewer(!0)}; const handleCloseFullscreen=()=>{setShowFullscreenViewer(!1); setFullscreenImageUrl(null)};

  // --- Renderizado ---
  const canScan = !!token;

  return (
    <Screen>
        <div style={styles.container}>
          <h2 style={styles.title}>Consultar Bolsa (Solo Lectura)</h2>
          <button style={{...styles.qrButton,...((loading||!canScan)?styles.buttonDisabled:{})}} onClick={handleOpenQR} disabled={loading||!canScan}>
            {!canScan?"Iniciar sesión":loading?"Buscando...":"Escanear QR"}
          </button>

          {/* Mensajes */}
          {loading&&<div style={styles.loadingIndicator}>Buscando información...</div>}
          {errorMsg&&<div style={styles.errorIndicator}>{errorMsg}</div>}

          {/* Detalles */}
          {!loading && !errorMsg && bolsa && (
            <BolsaDetailsCard
              bolsa={bolsa}
              memberInfo={memberInfo}
              memberErrorMsg={memberErrorMsg}
              loadingMember={loadingMember}
              onImageClick={handleShowFullscreen}
              userInfo={userInfo} // <-- Pasar userInfo
            />
          )}

          {/* Modal QR */}
          {showQR && ( <div style={styles.overlay}><div style={styles.qrModal}><h4 style={{marginTop:0,marginBottom:"16px",textAlign:"center"}}>Escanear QR</h4><QRScanner onResult={handleQRResult} onClose={handleCloseQR}/><button onClick={handleCloseQR} style={{...styles.button,...styles.btnClear,width:"100%",marginTop:"16px"}}>Cancelar</button></div></div> )}

          {/* Visor Fullscreen */}
          {showFullscreenViewer && <FullscreenImageViewer imageUrl={fullscreenImageUrl} onClose={handleCloseFullscreen} />}

        </div>
    </Screen>
  );
}

// --- Estilos (Originales) ---
const styles = { container:{width:"100%",maxWidth:"768px",margin:"16px auto",padding:"16px",fontFamily:"'Poppins', sans-serif",backgroundColor:"#f0f4f8",minHeight:"100vh",boxSizing:"border-box"}, title:{textAlign:"center",fontSize:"22px",fontWeight:"700",marginBottom:"24px",color:"#333"}, qrButton:{width:"100%",height:"45px",borderRadius:"8px",border:"none",backgroundColor:"#007bff",color:"#fff",fontSize:"16px",fontWeight:"700",fontFamily:"'Poppins', sans-serif",cursor:"pointer",marginBottom:"24px",boxShadow:"0 2px 4px rgba(0,0,0,.15)",transition:"background-color .2s ease, opacity .2s ease"}, buttonDisabled:{opacity:.65,cursor:"not-allowed",backgroundColor:"#5a6268"}, detailCard:{backgroundColor:"#fff",borderRadius:"8px",padding:"20px",boxShadow:"0 4px 8px rgba(0,0,0,.1)",marginBottom:"24px"}, detailTitle:{fontSize:"18px",fontWeight:"700",marginBottom:"16px",color:"#2c3e50",borderBottom:"1px solid #eee",paddingBottom:"8px"}, detailText:{fontSize:"14px",marginBottom:"10px",color:"#34495e",padding:"6px 8px",borderRadius:"4px"}, subTitle:{fontSize:"16px",fontWeight:"700",marginTop:"20px",marginBottom:"12px",color:"#2c3e50",borderBottom:"1px dashed #ddd",paddingBottom:"6px"}, itemCard:{backgroundColor:"#f8f9fa",border:"1px solid #e9ecef",borderRadius:"4px",padding:"10px 12px",marginBottom:"10px"}, itemContentWrapper:{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:"10px"}, itemTextContainer:{flexGrow:1}, itemText:{fontSize:"13px",marginBottom:"4px",color:"#2c3e50"}, itemPhotoStyle:{width:"60px",height:"60px",objectFit:"cover",borderRadius:"4px",border:"1px solid #ddd",cursor:"pointer",flexShrink:0}, histCard:{backgroundColor:"#f8f9fa",border:"1px solid #e9ecef",borderRadius:"4px",padding:"8px 12px",marginBottom:"8px", width: '100%', boxSizing: 'border-box'}, histText:{fontSize:"13px",margin:0,color:"#2c3e50",lineHeight:"1.5"}, overlay:{position:"fixed",top:0,left:0,width:"100vw",height:"100vh",backgroundColor:"rgba(0,0,0,.6)",zIndex:9999,display:"flex",justifyContent:"center",alignItems:"center"}, qrModal:{backgroundColor:"#fff",borderRadius:"8px",padding:"24px",width:"340px",maxWidth:"95%",boxShadow:"0 4px 8px rgba(0,0,0,.2)"}, memberCard:{width:"auto",margin:"10px 0",backgroundColor:"#eaf6ff",border:"1px solid #b8daff",borderRadius:"8px",padding:"12px 15px",color:"#004085",fontFamily:"Poppins, sans-serif"}, memberTextTitle:{fontSize:"15px",fontWeight:"bold",marginBottom:"8px",color:"#00356e"}, memberText:{fontSize:"14px",marginBottom:"5px",lineHeight:"1.5"}, button:{margin:"8px 0",padding:"10px 20px",borderRadius:6,border:"none",fontWeight:600,cursor:"pointer",fontSize:14,transition:"background-color .2s ease, opacity .2s ease"}, btnClear:{backgroundColor:"#6c757d",color:"#fff"}, loadingIndicator:{width:"100%",textAlign:"center",padding:"20px",fontSize:"16px",color:"#007bff",boxSizing:"border-box"}, errorIndicator:{width:"100%",boxSizing:"border-box",textAlign:"center",padding:"10px 15px",fontSize:"14px",color:"#721c24",backgroundColor:"#f8d7da",border:"1px solid #f5c6cb",borderRadius:"8px",marginTop:"10px"}, subtleText:{fontSize:"11px",color:"#666",display:"inline-block",marginLeft:"5px"}, subtleErrorText:{fontSize:"11px",color:"#856404",display:"inline-block",marginLeft:"5px",fontWeight:"bold"}, fullscreenOverlay:{position:"fixed",top:0,left:0,width:"100vw",height:"100vh",backgroundColor:"rgba(0,0,0,.85)",zIndex:10001,display:"flex",justifyContent:"center",alignItems:"center",backdropFilter:"blur(5px)"}, fullscreenImage:{maxWidth:"95%",maxHeight:"90%",display:"block",objectFit:"contain"}, fullscreenCloseButton:{position:"absolute",top:"15px",right:"15px",background:"rgba(255,255,255,.2)",border:"none",color:"white",fontSize:"24px",cursor:"pointer",borderRadius:"50%",width:"35px",height:"35px",display:"flex",justifyContent:"center",alignItems:"center",lineHeight:"1"} };

// Placeholder Screen
if (typeof Screen === 'undefined') { const Screen = ({ children }) => <div>{children}</div>; }

export default ConsultarBolsa;