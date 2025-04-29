// src/components/CrearModificarBolsa.jsx
// Ruta: /crear-modificar-bolsa

import React, { useState, useEffect, useRef } from "react";
import QRScanner from "./QRScanner"; // Asegúrate de que este componente exista y funcione
import { toast } from 'react-toastify'; // Para notificaciones mejoradas

// URL base del backend
import { API_URL } from '../utils/api'

const BASE_URL = API_URL;

// --- >>> INICIO: Diccionario Restaurado <<< ---
const ClubStatusMeanings = {
    ACTIVE: "Activo - Sin Crédito",
    "ACTIVE-CB": "Activo - Con CreditBook",
    "ACTIVE-CC": "Activo - Con Crédito",
    "ACTIVE-FR": "Activo - Foráneo Sin Crédito",
    "ACTIVE-FRB": "Activo - Foráneo Con CreditBook",
    "ACTIVE-FRC": "Activo - Foráneo Con Crédito",
    "ACTIVE-MAR": "Activo - Casado Sin Crédito",
    "ACTIVE-MRB": "Activo - Casado Con CreditBook",
    "ACTIVE-MRC": "Activo - Casado Con Crédito",
    "ACTIVE-OWN": "Activo - Dueño VIP",
    "ACTIVE-Z": "Activo - Sin Estados De Cuenta",
    CASH: "Cash - CreditCard",
    DECEASED: "Fallecido",
    EMPLEADO: "Empleado",
    INACTIVE: "Inactivo - Residente",
    "INACTIVE-S": "Inactivo - Suspensión",
    "NO CREDENC": "Sin Credencial",
    RESIGNED: "Renunció",
    SUSPEND4: "Suspendido Incobrables",
    SUSPENDED: "Suspendido",
};
// --- >>> FIN: Diccionario Restaurado <<< ---

// Helper para determinar el color del estado del miembro
function getStatusColor(statusCode) {
    if (statusCode && String(statusCode).trim().toUpperCase().startsWith("ACTIVE")) {
        return "#008000"; // Verde
    }
    return "#FF0000"; // Rojo
}

// Estilos mejorados
const containerStyle = { 
    width: "375px", 
    margin: "0 auto", 
    backgroundColor: "#f8fafc", 
    fontFamily: "Poppins, sans-serif", 
    minHeight: "100vh", 
    paddingBottom: "80px",
    position: 'relative'
};

const sectionStyle = {
    backgroundColor: '#fff',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '16px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    border: '1px solid #e5e7eb'
};

const btnPrimary = {
    width: "100%",
    height: "40px",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    fontWeight: 700,
    fontFamily: "Poppins, sans-serif",
    transition: 'all 0.3s ease',
    background: 'linear-gradient(45deg, #16c76c, #14b864)',
    boxShadow: '0 2px 4px rgba(22, 199, 108, 0.2)',
    '&:hover': {
        transform: 'translateY(-1px)',
        boxShadow: '0 4px 8px rgba(22, 199, 108, 0.3)'
    }
};

const btnSecondary = {
    width: "100%",
    height: "40px",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    fontWeight: 700,
    fontFamily: "Poppins, sans-serif",
    transition: 'all 0.3s ease',
    background: 'linear-gradient(45deg, #0077cc, #0066b2)',
    boxShadow: '0 2px 4px rgba(0, 119, 204, 0.2)'
};

const loadingOverlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000
};

const loadingSpinnerStyle = {
    width: '40px',
    height: '40px',
    border: '4px solid #f3f3f3',
    borderTop: '4px solid #16c76c',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
};

// --- Estilos (Sin Cambios) ---
const innerPadding = { padding: "16px" };
const textLabelStyles = { color: "#030303", fontSize: "18px", fontFamily: "Poppins, sans-serif", fontWeight: 700, lineHeight: "28px", marginBottom: "4px", };
const itemRowStyle = { border: "1px solid #ddd", borderRadius: "6px", padding: "12px", marginBottom: "12px", backgroundColor: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" };
const itemLabelStyle = { display: "block", fontSize: "14px", fontFamily: "Poppins, sans-serif", fontWeight: 600, marginBottom: "4px", color: '#333', };
const itemInputBaseStyle = { width: "100%", padding: "8px", marginBottom: "10px", borderRadius: "4px", border: "1px solid #ccc", boxSizing: "border-box", fontSize: "14px", fontFamily: "Poppins, sans-serif", outline: "none", };
const getItemInputStyle = (disabled) => ({ ...itemInputBaseStyle, height: "36px", backgroundColor: disabled ? '#e9ecef' : '#fff', cursor: disabled ? 'not-allowed' : 'text', });
const getItemTextareaStyle = (disabled) => ({ ...itemInputBaseStyle, height: "60px", lineHeight: 1.4, resize: disabled ? 'none' : 'vertical', backgroundColor: disabled ? '#e9ecef' : '#fff', cursor: disabled ? 'not-allowed' : 'text', });
const getItemSelectStyle = (disabled) => ({ ...itemInputBaseStyle, height: '36px', backgroundColor: disabled ? '#e9ecef' : '#fff', cursor: disabled ? 'not-allowed' : 'pointer', });
const itemButtonStyle = { width: "100%", height: "36px", color: "#fff", border: "none", borderRadius: "4px", fontWeight: 700, fontFamily: "Poppins, sans-serif", transition: 'opacity 0.2s ease, background-color 0.2s ease', };
const getItemDeleteButtonStyle = (disabled) => ({ ...itemButtonStyle, backgroundColor: disabled ? "#ff99aa" : "#ff2d55", cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.6 : 1, marginTop: '20px', });
const photoSectionStyle = { marginTop: '12px', paddingTop: '12px', borderTop: '1px dashed #eee' };
const photoPreviewContainerStyle = { display: 'flex', alignItems: 'center', gap: '10px', minHeight: '50px', marginBottom: '10px' };
const photoPreviewStyle = { maxWidth: '80px', maxHeight: '80px', height: 'auto', borderRadius: '4px', border: '1px solid #ccc', objectFit: 'cover' };
const noPhotoDivStyle = { width: '80px', height: '80px', backgroundColor: '#eee', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', fontSize: '12px', textAlign: 'center' };
const photoButtonsContainerStyle = { display: 'flex', flexDirection: 'column', gap: '8px', flexGrow: 1 };
const fileInputHiddenStyle = { display: 'none' };
const fileInputLabelBaseStyle = { display: 'inline-block', padding: '8px 12px', color: 'white', borderRadius: '4px', fontSize: '13px', fontWeight: 600, transition: 'background-color 0.2s ease, opacity 0.2s ease', textAlign: 'center', border: 'none', };
const getFileInputLabelStyle = (disabled) => ({ ...fileInputLabelBaseStyle, backgroundColor: disabled ? '#b0c4de' : '#0077cc', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.7 : 1, });
const photoActionButtonBaseStyle = { padding: '6px 10px', fontSize: '12px', fontWeight: 500, border: 'none', borderRadius: '4px', transition: 'background-color 0.2s ease, opacity 0.2s ease', };
const getDeletePhotoButton = (disabled) => ({ ...photoActionButtonBaseStyle, backgroundColor: disabled ? '#f8d7da' : '#ffcccc', color: disabled ? '#b38fa0' : '#dc3545', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.7 : 1, marginLeft: '10px', });
const photoStatusStyle = { fontSize: '12px', fontStyle: 'italic', marginTop: '5px', color: '#666' };
const photoErrorStyle = { ...photoStatusStyle, color: 'red', fontWeight: 'bold' };
const modalOverlayStyles = { position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999, };
const modalContentStyles = { width: "90%", maxWidth: "380px", maxHeight: "80vh", overflowY: "auto", backgroundColor: "#ffffff", borderRadius: "8px", padding: "16px", boxSizing: "border-box", fontFamily: "Poppins, sans-serif", };
const buttonBase = { height: "40px", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: 700, fontFamily: "Poppins, sans-serif", padding: "0 16px", };
const btnGrey = { ...buttonBase, backgroundColor: "#ccc", color: "#000" };
const btnGreen = { ...buttonBase, backgroundColor: "#16c76c", color: "#fff", marginBottom: "12px" };
const cardHistorialStyle = { width: "343px", minHeight: "52px", marginBottom: "8px", backgroundColor: "#ffffff", borderRadius: "4px", boxShadow: "0px 2px 4px rgba(0,0,0,.08)", display: "flex", alignItems: "center", padding: "8px 12px", boxSizing: 'border-box', };
const getButtonGuardarStyle = (disabled) => ({ cursor: disabled ? "not-allowed" : "pointer", width: "150px", height: "42px", border: "0", boxSizing: "border-box", borderRadius: "6px", backgroundColor: disabled ? "#a0d8b8" : "#16c76c", color: "#ffffff", fontSize: "15px", fontFamily: "Poppins, sans-serif", fontWeight: 700, lineHeight: "20px", outline: "none", transition: "all 0.2s ease", opacity: disabled ? 0.6 : 1, });
const getButtonEliminarStyle = (disabled) => ({ cursor: disabled ? "not-allowed" : "pointer", width: "150px", height: "42px", border: "0", boxSizing: "border-box", borderRadius: "6px", backgroundColor: disabled ? "#ff99aa" : "#ff2d55", color: "#ffffff", fontSize: "15px", fontFamily: "Poppins, sans-serif", fontWeight: 700, lineHeight: "20px", outline: "none", transition: "all 0.2s ease", opacity: disabled ? 0.6 : 1, });
const styles = { memberCard: { width: "100%", boxSizing: 'border-box', backgroundColor: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: "8px", padding: "12px 16px", marginBottom: "16px", color: "#065f46", fontFamily: "Poppins, sans-serif", position: 'relative' }, memberTextTitle: { fontSize: "16px", fontWeight: "bold", marginBottom: "6px", color: '#047857' }, memberText: { fontSize: "14px", marginBottom: "4px", lineHeight: '1.5' }, deleteButton: { position: "absolute", top: 8, right: 8, border: "none", backgroundColor: "transparent", color: "#ef4444", fontSize: "20px", cursor: "pointer", padding: "0 4px", lineHeight: '1', fontWeight: 'bold' }, autocompleteDropdown: { position: 'absolute', left: 0, width: '307px', top: '100%', maxHeight: '200px', overflowY: 'auto', backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '0 0 6px 6px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', zIndex: 100, marginTop: '-1px', boxSizing: 'border-box' }, autocompleteItem: { padding: '10px 12px', cursor: 'pointer', fontSize: '14px', fontFamily: 'Poppins, sans-serif', borderBottom: '1px solid #eee', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }, autocompleteHint: { padding: '8px 12px', fontSize: '12px', color: '#666', fontStyle: 'italic', textAlign: 'center', borderTop: '1px solid #eee' } };
const warningOverlayStyle = { position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", backgroundColor: "rgba(0,0,0,0.6)", zIndex: 10000, display: "flex", justifyContent: "center", alignItems: "center" };
const warningModalStyle = { backgroundColor: "#fff", borderRadius: "8px", padding: "24px", width: "320px", maxWidth: "90%", boxShadow: "0 4px 8px rgba(0,0,0,0.2)", textAlign: "center", fontFamily: "Poppins, sans-serif" };
const warningTitleStyle = { fontSize: "20px", fontWeight: "700", marginBottom: "16px", color: "#FF0000" };
const warningButtonContainerStyle = { display: "flex", gap: "12px", justifyContent: "center", marginTop: "24px", flexWrap: "wrap" };
const warningIgnoreButtonStyle = { ...buttonBase, backgroundColor: "#16c76c", color: "#fff", padding: '8px 16px', height: 'auto' };
const warningCancelButtonStyle = { ...buttonBase, backgroundColor: "#ff2d55", color: "#fff", padding: '8px 16px', height: 'auto' };
// --- Fin Estilos ---


// --- Componentes de Texto (Sin Cambios) ---
function TextEstadoBolsa() { return <div style={textLabelStyles}>Estado de la Bolsa</div>; }
function TextMiembroAsignado() { return <div style={textLabelStyles}>Miembro asignado</div>; }
function TextAsignarNuevoMiembro() { return <div style={textLabelStyles}>Asignar nuevo miembro</div>; }
function TextHistorialUso() { return <div style={textLabelStyles}>Historial de Uso</div>; }
function TextFechaProximoMantenimiento() { return <div style={textLabelStyles}>Próximo mantenimiento</div>; }
function TextFechaDevolucion() { return <div style={textLabelStyles}>¿Cuándo se debe devolver?</div>; }
function TextItemsEnLaBolsa() { return <div style={textLabelStyles}>Ítems en la Bolsa</div>; }
// --- Fin Componentes de Texto ---


// --- Inputs Principales (Sin Cambios) ---
function InputFieldEstadoBolsa({ value }) { let b="#f5f5f5"; value==="Disponible"&&(b="#ccffcc"); value==="En tránsito"&&(b="#ffcccc"); const s={width:"343px",height:"40px",padding:"0 8px",border:0,boxSizing:"border-box",borderRadius:"6px",boxShadow:"0 1px 2px rgba(0,0,0,.05)",backgroundColor:b,color:"#333",fontSize:"16px",fontFamily:"Poppins, sans-serif",lineHeight:"40px",outline:"none",marginBottom:"16px"}; return <input style={s} value={value} readOnly placeholder="Estado"/>; }
function InputFieldBuscarCliente({ value, onChange, disabled }) { const s={width:"307px",height:"40px",padding:"0 8px",border:"1px solid #cbd5e1",boxSizing:"border-box",borderRadius:"6px",boxShadow:"0 1px 2px rgba(0,0,0,.05)",backgroundColor:disabled?"#e9ecef":"#fff",color:value?"#333":"#94a3b8",fontSize:"16px",fontFamily:"Poppins, sans-serif",lineHeight:"40px",outline:"none",marginBottom:"16px",cursor:disabled?"not-allowed":"text"}; return <input style={s} placeholder="Buscar miembro (código o nombre)" value={value} onChange={onChange} disabled={disabled}/>; }
function InputFieldNotasInternas({ value, onChange, disabled }) { const s={width:"343px",minHeight:"64px",padding:"8px",border:"1px solid #cbd5e1",boxSizing:"border-box",borderRadius:"6px",boxShadow:"0 1px 2px rgba(0,0,0,.05)",backgroundColor:disabled?"#e9ecef":"#fff",color:value?"#333":"#94a3b8",fontSize:"16px",fontFamily:"Poppins, sans-serif",lineHeight:"1.5",outline:"none",marginBottom:"16px",resize:disabled?"none":"vertical",cursor:disabled?"not-allowed":"text"}; return <textarea style={s} placeholder="Notas Internas" value={value} onChange={onChange} disabled={disabled}/>; }
function InputFieldFechaProximoMantenimiento({ value, onChange, disabled }) { const s={width:"343px",height:"42px",padding:"0 8px",border:"1px solid #cbd5e1",boxSizing:"border-box",borderRadius:"6px",boxShadow:"0 1px 2px rgba(0,0,0,.05)",backgroundColor:disabled?"#e9ecef":"#fff",color:value?"#333":"#94a3b8",fontSize:"16px",fontFamily:"Poppins, sans-serif",lineHeight:"42px",outline:"none",marginBottom:"16px",cursor:disabled?"not-allowed":"text"}; return <input type="date" style={s} value={value||""} onChange={e=>onChange(e.target.value)} disabled={disabled}/>; }
function InputFieldFechaDevolucion({ value, onChange, disabled }) { const s={width:"343px",height:"42px",padding:"0 8px",border:"1px solid #cbd5e1",boxSizing:"border-box",borderRadius:"6px",boxShadow:"0 1px 2px rgba(0,0,0,.05)",backgroundColor:disabled?"#e9ecef":"#fff",color:value?"#333":"#94a3b8",fontSize:"16px",fontFamily:"Poppins, sans-serif",lineHeight:"42px",outline:"none",marginBottom:"16px",cursor:disabled?"not-allowed":"text"}; return <input type="datetime-local" style={s} value={value||""} onChange={e=>onChange(e.target.value)} disabled={disabled}/>; }
// --- Fin Inputs Principales ---


// --- Modal Selección Almacén (Sin Cambios Funcionales) ---
function SubnivelItem({ pathSoFar, nivel, selectedPath, setSelectedPath }) { const cP=[...pathSoFar,nivel.nombre]; const pS=cP.join(" / "); const hC=()=>setSelectedPath(pS); const iS=pS===selectedPath; const iSt={margin:"8px 0",padding:"6px 8px",border:"1px solid #ccc",borderRadius:"4px",cursor:"pointer",backgroundColor:iS?"#bdf7ce":"#f5f5f5",fontWeight:iS?700:400,transition:"all .2s ease"}; return(<div style={{marginLeft:12,marginBottom:8}}><div style={iSt} onClick={hC}>{nivel.nombre}</div>{nivel.subniveles?.map(sub=>(<SubnivelItem key={sub.id} pathSoFar={cP} nivel={sub} selectedPath={selectedPath} setSelectedPath={setSelectedPath}/>))}</div>); }
function ModalSeleccionAlmacen({ isOpen, onClose, almacenes, onSeleccionUbicacion }) { const[s,setS]=useState(1); const[sA,setSA]=useState(null); const[e,setE]=useState([]); const[sP,setSP]=useState(""); const[t]=useState(localStorage.getItem("token")); useEffect(()=>{isOpen&&(setS(1),setSA(null),setE([]),setSP(""))},[isOpen]); const hK=()=>onClose(); const vE=async a=>{try{const r=await fetch(`${BASE_URL}/auditoria/${a.id}`,{headers:{Authorization:`Bearer ${t}`}}); if(!r.ok)throw new Error("Error"); const d=await r.json(); setSA(a); setSP(a.nombre); setE(d.estructura||[]); setS(2)}catch(r){console.error(r); alert("Error carga estructura")};}; const hV=()=>{setS(1); setSA(null); setE([]); setSP("")}; const hGU=()=>{if(!sP)return alert("No seleccionado."); onSeleccionUbicacion(sP); onClose()}; if(!isOpen)return null; return(<div style={modalOverlayStyles} onClick={hK}><div style={modalContentStyles} onClick={e=>e.stopPropagation()}>{s===1&&(<> <h3 style={{marginBottom:12}}>Selecciona Almacén</h3> {almacenes.length===0?<p>No hay</p>:almacenes.map(a=>(<button key={a.id} style={{...btnGreen,width:"100%"}} onClick={()=>vE(a)}>{a.nombre}</button>))} <button style={{...btnGrey,width:"100%"}} onClick={hK}>Cancelar</button></>)}{s===2&&(<> <h3 style={{marginBottom:8}}>Estructura: {sA?.nombre}</h3> <div style={{fontSize:14,marginBottom:12,color:"#666"}}>Subniveles</div> <div style={{marginBottom:16}}>{e.length===0?<p style={{color:"#999"}}>Vacío.</p>:e.map(n=>(<SubnivelItem key={n.id} pathSoFar={[sA?.nombre||""]} nivel={n} selectedPath={sP} setSelectedPath={setSP}/>))}</div> <button style={{...btnGreen,width:"100%"}} onClick={hGU}>Guardar Ubicación</button> <div style={{display:"flex",gap:8}}> <button style={{...btnGrey,flex:1}} onClick={hV}>Volver</button> <button style={{...btnGrey,flex:1}} onClick={hK}>Cancelar</button></div></>)}</div></div>); }
// --- Fin Modal Selección Almacén ---


// --- Historial Card (Sin Cambios) ---
function CardHistorial({ children }) { return <div style={cardHistorialStyle}>{children}</div>; }
// --- Fin Historial Card ---


// --- Botones Guardar/Eliminar (Sin Cambios) ---
function ButtonGuardarBolsa({ onClick, disabled }) { return <button style={getButtonGuardarStyle(disabled)} onClick={onClick} disabled={disabled}>Guardar Bolsa</button>; }
function ButtonEliminarBolsa({ onClick, disabled }) { return <button style={getButtonEliminarStyle(disabled)} onClick={onClick} disabled={disabled}>Eliminar Bolsa</button>; }
// --- Fin Botones Guardar/Eliminar ---


// --- Fila de Ítem (ItemRow) (Sin Cambios Funcionales Internos) ---
function ItemRow({ item, index, onChange, onRemove, onPhotoFileSelected, onPhotoAPIDelete, isUploading, uploadError, disabled, }) { const fIR=useRef(null); const[pU,setPU]=useState(null); useEffect(()=>{let cPU=null; if(item.photo_file){cPU=URL.createObjectURL(item.photo_file); setPU(cPU); console.log(`[Item ${index}] Created preview: ${cPU}`)}else{setPU(null)} return()=>{if(cPU){URL.revokeObjectURL(cPU); console.log(`[Item ${index}] Revoked preview: ${cPU}`)}}},[item.photo_file,index]); const gPS=()=>{if(pU)return pU; if(item.photo_filename){const bUC=BASE_URL.endsWith("/")?BASE_URL.slice(0,-1):BASE_URL; return`${bUC}/static/item_photos/${item.photo_filename}?t=${Date.now()}`} return null}; const pS=gPS(); const hFC=e=>{const f=e.target.files?e.target.files[0]:null; if(!f)return; if(!f.type.startsWith("image/")){alert("Solo imágenes."); e.target.value=null; return} if(f.size>5*1024*1024){alert("Máx 5MB."); e.target.value=null; return} onPhotoFileSelected(index,f); if(fIR.current)fIR.current.value=""}; const hTFI=()=>{fIR.current?.click()}; const hDP=()=>{if(item.photo_filename){onPhotoAPIDelete(index,item.photo_filename)}else{onPhotoFileSelected(index,null)}}; const pAD=isUploading||disabled; return(<div style={itemRowStyle}><label style={itemLabelStyle}>Descripción</label><input style={getItemInputStyle(disabled)} placeholder="Descripción" value={item.descripcion} onChange={e=>onChange(index,{...item,descripcion:e.target.value})} disabled={disabled}/><label style={itemLabelStyle}>Cantidad</label><input type="number" style={getItemInputStyle(disabled)} placeholder="0" min="0" value={item.cantidad} onChange={e=>{const v=e.target.value; const n=v===""?"":parseInt(v,10); if(v===""||(!isNaN(n)&&n>=0)){onChange(index,{...item,cantidad:n})}}} disabled={disabled}/><label style={itemLabelStyle}>Estado</label><select style={getItemSelectStyle(disabled)} value={item.estado} onChange={e=>onChange(index,{...item,estado:e.target.value})} disabled={disabled}><option value="Buen estado">Buen estado</option><option value="Regular">Regular</option><option value="Mal estado">Mal estado</option><option value="Requiere Mantenimiento">Requiere Mantenimiento</option></select><label style={itemLabelStyle}>Comentario</label><textarea style={getItemTextareaStyle(disabled)} placeholder="Observaciones..." value={item.comentario} onChange={e=>onChange(index,{...item,comentario:e.target.value})} disabled={disabled}/><div style={photoSectionStyle}><label style={itemLabelStyle}>Foto Ítem</label><div style={photoPreviewContainerStyle}>{pS?<img src={pS} alt={`Ítem ${index+1}`} style={photoPreviewStyle}/>:<div style={noPhotoDivStyle}>Sin foto</div>}<div style={photoButtonsContainerStyle}><input ref={fIR} type="file" accept="image/*" capture="environment" style={fileInputHiddenStyle} onChange={hFC} disabled={pAD}/><button type="button" style={getFileInputLabelStyle(pAD)} onClick={hTFI} disabled={pAD}>{pS?"Cambiar Foto":"Añadir Foto"}</button>{pS&&(<button type="button" style={getDeletePhotoButton(pAD)} onClick={hDP} disabled={pAD}>Eliminar Foto</button>)}</div></div>{isUploading&&<div style={photoStatusStyle}>Subiendo...</div>}{uploadError&&<div style={photoErrorStyle}>{uploadError}</div>}</div><button style={getItemDeleteButtonStyle(disabled)} onClick={()=>onRemove(index)} disabled={disabled}>Eliminar Ítem</button></div>); }
// --- Fin Fila de Ítem ---


// --- Modal Advertencia (Sin Cambios) ---
function WarningModal({ memberName, memberStatus, onIgnore, onCancel }) { return(<div style={warningOverlayStyle} onClick={onCancel}><div style={warningModalStyle} onClick={e=>e.stopPropagation()}><h3 style={warningTitleStyle}>ATENCIÓN</h3><p style={{fontSize:"16px",lineHeight:"1.6"}}>El miembro <strong>{memberName}</strong> tiene estado: <strong style={{color:getStatusColor(memberStatus)}}>{ClubStatusMeanings[memberStatus?.trim().toUpperCase()]||memberStatus||"Desconocido"}</strong>.<br/><br/>¿Continuar y guardar?</p><div style={warningButtonContainerStyle}><button style={warningIgnoreButtonStyle} onClick={onIgnore}>Sí, Guardar</button><button style={warningCancelButtonStyle} onClick={onCancel}>No, Cancelar</button></div></div></div>); }
// --- Fin Modal Advertencia ---


// --- Componente Principal: CrearModificarBolsa ---
export default function CrearModificarBolsa() {
    // Estados Principales
    const [idBolsaNuevo, setIdBolsaNuevo] = useState("");
    const [estadoBolsa, setEstadoBolsa] = useState("Disponible");
    const [ubicacion, setUbicacion] = useState("");
    const [clienteAsignado, setClienteAsignado] = useState("");
    const [notasInternas, setNotasInternas] = useState("");
    const [fechaMantenimiento, setFechaMantenimiento] = useState("");
    const [historial, setHistorial] = useState([]); // Array de objetos {fecha: string, accion: string}
    const [fechaDevolucion, setFechaDevolucion] = useState("");
    const [items, setItems] = useState([]); // Array de objetos item

    // Estados UI y Carga
    const [modalOpen, setModalOpen] = useState(false);
    const [almacenes, setAlmacenes] = useState([]);
    const [userInfo, setUserInfo] = useState({ name: "Usuario Desconocido", username: null });
    const [token, setToken] = useState(localStorage.getItem("token"));
    const [isNewCreation, setIsNewCreation] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingBag, setIsFetchingBag] = useState(false);

    // Estados QR
    const [showQRScanner, setShowQRScanner] = useState(false);
    const [qrMode, setQrMode] = useState("new");
    const [msgNewID, setMsgNewID] = useState("");
    const [msgRecovery, setMsgRecovery] = useState("");

    // Estados Búsqueda Miembro
    const [memberQuery, setMemberQuery] = useState("");
    const [memberOptions, setMemberOptions] = useState([]);
    const [selectedMember, setSelectedMember] = useState(null);

    // Estado Modal Advertencia
    const [showWarning, setShowWarning] = useState(false);

    // Handler para agregar un nuevo ítem
    const handleAgregarItem = () => {
        const newItem = {
            tempId: Date.now(), // ID temporal para React keys
            descripcion: "",
            cantidad: 1,
            estado: "Buen estado",
            comentario: "",
            photo_filename: null,
            photo_file: null,
            is_uploading: false,
            upload_error: null
        };
        setItems(prevItems => [...prevItems, newItem]);
    };

    // Handler para cambiar un ítem
    const handleItemChange = (index, updatedItem) => {
        setItems(prevItems => {
            const newItems = [...prevItems];
            newItems[index] = updatedItem;
            return newItems;
        });
    };

    // Handler para eliminar un ítem
    const handleRemoveItem = (index) => {
        setItems(prevItems => prevItems.filter((_, idx) => idx !== index));
    };

    // Handler para seleccionar foto
    const handlePhotoFileSelected = (index, file) => {
        setItems(prevItems => {
            const newItems = [...prevItems];
            newItems[index] = {
                ...newItems[index],
                photo_file: file,
                is_uploading: false,
                upload_error: null
            };
            return newItems;
        });
    };

    // Handler para eliminar foto
    const handlePhotoAPIDelete = async (index, filename) => {
        if (!filename || !idBolsaNuevo) return;
        
        try {
            const response = await fetch(`${BASE_URL}/bolsas/${idBolsaNuevo}/items/${index}/photo`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Error al eliminar foto');

            setItems(prevItems => {
                const newItems = [...prevItems];
                newItems[index] = {
                    ...newItems[index],
                    photo_filename: null,
                    photo_file: null,
                    is_uploading: false,
                    upload_error: null
                };
                return newItems;
            });

            showNotification('Foto eliminada con éxito', 'success');
        } catch (error) {
            console.error('Error eliminar foto:', error);
            showNotification('Error al eliminar la foto', 'error');
        }
    };

    // Mostrar loading overlay durante operaciones
    const LoadingOverlay = () => (
        isLoading || isFetchingBag ? (
            <div style={loadingOverlayStyle}>
                <div style={loadingSpinnerStyle} />
                <p style={{marginLeft: '12px', color: '#666'}}>
                    {isFetchingBag ? 'Cargando datos...' : 'Guardando cambios...'}
                </p>
            </div>
        ) : null
    );

    // Función mejorada para mostrar notificaciones
    const showNotification = (message, type = 'info') => {
        toast[type](message, {
            position: "top-right",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true
        });
    };

    // Validación mejorada antes de guardar
    const validateForm = () => {
        const errors = [];
        
        if (!idBolsaNuevo.trim()) {
            errors.push("Se requiere un Código QR / ID para guardar");
        }
        
        if (items.length === 0) {
            errors.push("Debe agregar al menos un ítem a la bolsa");
        }

        if (items.some(item => !item.descripcion.trim())) {
            errors.push("Todos los ítems deben tener una descripción");
        }

        if (items.some(item => item.cantidad === "" || isNaN(Number(item.cantidad)))) {
            errors.push("Todos los ítems deben tener una cantidad válida");
        }

        return errors;
    };

    // Handler guardar mejorado
    const doGuardarBolsa = async () => {
        const errors = validateForm();
        if (errors.length > 0) {
            showNotification(errors.join("\n"), 'error');
            return;
        }

        if (!userInfo.username) {
            showNotification("No se pudo obtener información del usuario. Recarga la página.", 'error');
            return;
        }

        setIsLoading(true);

        try {
            // 1. Preparar Payload
            const nuevaEntradaHistorial = {
                fecha: new Date().toISOString(), // Usar formato ISO estándar
                accion: `${isNewCreation ? 'Creado' : 'Modificado'} por ${userInfo.username}` // <-- Guarda el username
            };
            const updatedHistorial = [nuevaEntradaHistorial, ...(Array.isArray(historial) ? historial : [])];

            const itemsForPayload = items.map(it => ({
                descripcion: it.descripcion || "",
                cantidad: it.cantidad === "" || isNaN(Number(it.cantidad)) ? 0 : Number(it.cantidad),
                estado: it.estado || "Buen estado",
                comentario: it.comentario || "",
                photo_filename: it.photo_filename || null,
            }));

            const payload = {
                id: idBolsaNuevo.trim(),
                estado: estadoBolsa,
                ubicacion_completa: ubicacion,
                cliente_asignado: clienteAsignado.trim() || null,
                notas_internas: notasInternas,
                fecha_mantenimiento: fechaMantenimiento.trim() || null,
                items: itemsForPayload,
                fecha_devolucion: fechaDevolucion || null,
                historial: updatedHistorial, // Enviar el historial actualizado
            };

            // 2. Determinar Método y URL
            const encodedId = encodeURIComponent(idBolsaNuevo.trim());
            let method = 'PUT';
            let url = `${BASE_URL}/bolsas/${encodedId}`;
            let isActuallyCreating = false;

            try { // Verificar si existe antes de decidir método
                const checkRes = await fetch(`${BASE_URL}/bolsas/${encodedId}`, { headers: { Authorization: `Bearer ${token}` } });
                if (checkRes.status === 404 && isNewCreation) { method = 'POST'; url = `${BASE_URL}/bolsas`; isActuallyCreating = true; }
                else if (!checkRes.ok && checkRes.status !== 404) { throw new Error(`Error (${checkRes.status}) verificando ID ${idBolsaNuevo}.`); }
                else if (checkRes.ok && isNewCreation) { throw new Error(`Error Crítico: Código "${idBolsaNuevo}" ya existe.`); }
            } catch (checkError) { throw checkError; }

            // 3. Realizar Petición Guardar
            const response = await fetch(url, { method: method, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) });
            if (!response.ok) {
                let errorMsg = `Error ${response.status} al guardar.`;
                try { const d = await response.json(); errorMsg += ` ${d.detail || JSON.stringify(d)}`; } catch(e){}
                if (method === 'PUT' && response.status === 404) { errorMsg = `Error: Bolsa "${idBolsaNuevo}" no encontrada para modificar.`; }
                throw new Error(errorMsg);
            }

            const savedBolsaData = await response.json();
            const savedBolsaId = savedBolsaData.id || idBolsaNuevo;

            // 4. Subir Fotos Pendientes si se creó
            if (isActuallyCreating) {
                const fotosParaSubir = items.map((item, index) => ({ file: item.photo_file, index })).filter(info => info.file);
                if (fotosParaSubir.length > 0) {
                    console.log(`Bolsa ${savedBolsaId} creada. Subiendo ${fotosParaSubir.length} fotos...`);
                    const uploadPromises = fotosParaSubir.map(info => uploadItemPhotoAPI(savedBolsaId, info.index, info.file));
                    await Promise.allSettled(uploadPromises);
                    console.log("Subida inicial fotos completada.");
                }
            }

            // 5. Actualizar Estado Local
            setHistorial(savedBolsaData.historial || updatedHistorial);
            setIsNewCreation(false);
            const serverItems = Array.isArray(savedBolsaData.items) ? savedBolsaData.items : [];
            setItems(prevItems => prevItems.map((localItem, idx) => {
                const serverItem = serverItems[idx];
                if (serverItem) {
                    return { ...localItem, ...serverItem, photo_file: null, is_uploading: false, upload_error: null, };
                }
                return localItem;
            }));

            showNotification(`¡Bolsa "${savedBolsaId}" ${method === 'POST' ? 'creada' : 'actualizada'} con éxito!`, 'success');

        } catch (error) {
            console.error("Error al guardar bolsa:", error);
            showNotification(`Error al guardar: ${error.message}`, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    // Wrapper Guardar con Advertencia
    const handleGuardarBolsa = async () => { if(selectedMember?.ClubStatusRuleCode&&getStatusColor(selectedMember.ClubStatusRuleCode)==="#FF0000"){setShowWarning(!0); return} await doGuardarBolsa() }; const handleIgnoreWarning = async () => { setShowWarning(!1); await doGuardarBolsa() }; const handleCancelWarning = () => setShowWarning(!1);

    // Handler Eliminar Bolsa
    const handleEliminarBolsa=async()=>{if(!idBolsaNuevo.trim()||isNewCreation)return alert("No se puede eliminar."); const c=window.confirm(`¿Seguro eliminar bolsa "${idBolsaNuevo}"?`); if(!c)return; setIsLoading(!0); try{const e=encodeURIComponent(idBolsaNuevo.trim()); const r=await fetch(`${BASE_URL}/bolsas/${e}`,{method:"DELETE",headers:{Authorization:`Bearer ${token}`}}); if(!r.ok&&r.status!==404){let t=`Error ${r.status}.`; try{const o=await r.json(); t+=` ${o.detail||""}`}catch(r){}throw new Error(t)} showNotification(`Bolsa "${idBolsaNuevo}" ${r.status===404?"no encontrada":"eliminada"}.`, 'info'); resetFormFields(); setIdBolsaNuevo(""); setMsgNewID(""); setMsgRecovery("")}catch(r){console.error("Error eliminar:",r); showNotification(`Error: ${r.message}`, 'error')}finally{setIsLoading(!1)}};

    // Handlers Modal Ubicación
    const handleOpenModal=async()=>{if(isLoading||isFetchingBag)return; try{const r=await fetch(`${BASE_URL}/auditoria`,{headers:{Authorization:`Bearer ${token}`}}); if(!r.ok)throw new Error("Err almacenes"); const d=await r.json(); setAlmacenes(Array.isArray(d)?d:[]); setModalOpen(!0)}catch(r){console.error("Err almacenes:",r); showNotification("Error cargando.", 'error')}}; const handleSeleccionUbicacion=(pS)=>{setUbicacion(pS); setModalOpen(!1)};

    // Handler para el escáner QR
    const handleOpenQRScanner = (mode) => {
        setQrMode(mode);
        setShowQRScanner(true);
    };

    // Handler para cerrar el escáner QR
    const handleCloseQRScanner = () => {
        setShowQRScanner(false);
    };

    // Handler para el resultado del escaneo QR
    const handleQRCodeScanned = (data) => {
        if (qrMode === "new") {
            setIdBolsaNuevo(data);
            setMsgNewID("ID de bolsa establecido desde QR");
        } else if (qrMode === "recovery") {
            setMsgRecovery("Buscando bolsa...");
            setIsFetchingBag(true);
            fetchBolsaById(data);
        }
        setShowQRScanner(false);
    };

    // Función para buscar una bolsa por ID
    const fetchBolsaById = async (id) => {
        try {
            const response = await fetch(`${BASE_URL}/bolsas/${id}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Error al buscar la bolsa');
            }

            const data = await response.json();
            
            // Actualizar todos los estados con la información de la bolsa
            setIdBolsaNuevo(data.id);
            setEstadoBolsa(data.estado || "Disponible");
            setUbicacion(data.ubicacion || "");
            setClienteAsignado(data.cliente_asignado || "");
            setNotasInternas(data.notas_internas || "");
            setFechaMantenimiento(data.fecha_mantenimiento || "");
            setFechaDevolucion(data.fecha_devolucion || "");
            setHistorial(data.historial || []);
            setItems(data.items || []);
            
            setIsNewCreation(false);
            setMsgRecovery("Bolsa encontrada");
        } catch (error) {
            console.error('Error:', error);
            setMsgRecovery("Error al buscar la bolsa");
            toast.error("Error al buscar la bolsa");
        } finally {
            setIsFetchingBag(false);
        }
    };

    // Handler para deseleccionar un miembro
    const handleDeselectMember = () => {
        setSelectedMember(null);
        setClienteAsignado("");
        setMemberQuery("");
        setMemberOptions([]);
    };

    // --- Render (Sin Cambios Estructurales) ---
    const isFormDisabled = isLoading || isFetchingBag;

    return (
        <div style={containerStyle}>
            <LoadingOverlay />
            <div style={innerPadding}>
                {/* Sección QR */}
                <div style={sectionStyle}>
                    <h2 style={{ ...textLabelStyles, fontSize: '20px', marginBottom: '12px', color: '#1f2937' }}>
                        1. Código QR
                    </h2>
                    <button 
                        style={{ ...btnSecondary, width: "100%", marginBottom: '8px' }} 
                        onClick={() => handleOpenQRScanner("new")} 
                        disabled={isFormDisabled}
                    >
                        Escanear para NUEVA Bolsa
                    </button>
                    {msgNewID && (
                        <div style={{ 
                            marginTop: "4px", 
                            padding: "8px",
                            borderRadius: "4px",
                            backgroundColor: msgNewID.includes("Error") ? "#fee2e2" : "#dcfce7",
                            color: msgNewID.includes("Error") ? "#dc2626" : "#16a34a",
                            fontSize: "14px"
                        }}>
                            {msgNewID}
                        </div>
                    )}
                    
                    <div style={{
                        textAlign: 'center', 
                        margin: '10px 0', 
                        color: '#6b7280',
                        position: 'relative'
                    }}>
                        <span style={{
                            backgroundColor: '#fff',
                            padding: '0 10px',
                            position: 'relative',
                            zIndex: 1
                        }}>
                            O
                        </span>
                        <div style={{
                            position: 'absolute',
                            top: '50%',
                            left: 0,
                            right: 0,
                            height: '1px',
                            backgroundColor: '#e5e7eb',
                            zIndex: 0
                        }} />
                    </div>
                    
                    <button 
                        style={{ ...btnPrimary, width: "100%", marginBottom: '8px' }} 
                        onClick={() => handleOpenQRScanner("recovery")} 
                        disabled={isFormDisabled}
                    >
                        Escanear para RECUPERAR Bolsa
                    </button>
                    
                    {msgRecovery && (
                        <div style={{ 
                            marginTop: "4px", 
                            padding: "8px",
                            borderRadius: "4px",
                            backgroundColor: msgRecovery.includes("Error") ? "#fee2e2" : "#dcfce7",
                            color: msgRecovery.includes("Error") ? "#dc2626" : "#16a34a",
                            fontSize: "14px"
                        }}>
                            {msgRecovery}
                        </div>
                    )}
                </div>

                {/* Estado Bolsa */}
                <TextEstadoBolsa /> <InputFieldEstadoBolsa value={estadoBolsa} />

                {/* Ubicación */}
                <div style={textLabelStyles}>Ubicación</div>
                <input style={{ ...getItemInputStyle(true), width: '343px', height: '40px', marginBottom: '8px' }} value={ubicacion} readOnly placeholder="Selecciona..." />
                <button style={{ ...btnPrimary, width: "343px", height: '40px', opacity: isFormDisabled ? 0.6 : 1, cursor: isFormDisabled ? 'not-allowed' : 'pointer', marginBottom: '16px' }} onClick={handleOpenModal} disabled={isFormDisabled}> Seleccionar / Cambiar </button>

                {/* Miembro Asignado */}
                <TextMiembroAsignado />
                {selectedMember ? ( <div style={styles.memberCard}> <button onClick={handleDeselectMember} style={{...styles.deleteButton, cursor: isFormDisabled ? 'not-allowed' : 'pointer'}} title="Desasignar" disabled={isFormDisabled}> × </button> <div style={styles.memberTextTitle}>{selectedMember.FirstName} {selectedMember.LastName}</div> <div style={styles.memberText}>Código: {selectedMember.ClubMemberCode}</div> <div style={styles.memberText}>Edad: {selectedMember.Age ?? "N/D"}</div> <div style={styles.memberText}>Estado: <span style={{ color: getStatusColor(selectedMember.ClubStatusRuleCode), fontWeight: 'bold' }}>{ClubStatusMeanings[selectedMember.ClubStatusRuleCode?.trim().toUpperCase()] || selectedMember.ClubStatusRuleCode || "N/D"}</span></div> </div> )
                 : clienteAsignado ? ( <div style={{ ...styles.memberCard, backgroundColor: '#fffbe6', borderColor: '#fde68a', color: '#92400e'}}> <button onClick={handleDeselectMember} style={{...styles.deleteButton, color: '#d97706', cursor: isFormDisabled ? 'not-allowed' : 'pointer'}} title="Desasignar" disabled={isFormDisabled}> × </button> <div style={styles.memberText}>Código Asignado: {clienteAsignado}</div> <div style={{fontSize: '12px', marginTop: '4px'}}>(Detalles no cargados)</div> </div> )
                 : <div style={{ marginBottom: "16px", fontSize: "14px", color: "#6b7280", padding: '10px', backgroundColor: '#f3f4f6', borderRadius: '4px', textAlign:'center' }}>Ningún miembro asignado.</div> }

                {/* Buscar/Asignar Miembro */}
                <TextAsignarNuevoMiembro />
                <div style={{ position: 'relative' }}>
                    <InputFieldBuscarCliente value={memberQuery} onChange={(e) => setMemberQuery(e.target.value)} disabled={isFormDisabled} />
                    {!isFormDisabled && memberQuery && memberOptions.length > 0 && (
                        <div style={styles.autocompleteDropdown}>
                            {memberOptions.slice(0, 10).map((m) => ( <div key={m.ClubMemberCode} style={styles.autocompleteItem} onClick={() => handleSelectMember(m)} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f0f0'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fff'} >{m.FirstName} {m.LastName} ({m.ClubMemberCode})</div> ))}
                            {memberOptions.length > 10 && <div style={styles.autocompleteHint}>...más resultados</div>}
                        </div>
                    )}
                </div>

                {/* Notas, Mantenimiento, Devolución */}
                <InputFieldNotasInternas value={notasInternas} onChange={(e) => setNotasInternas(e.target.value)} disabled={isFormDisabled} />
                <TextFechaProximoMantenimiento /> <InputFieldFechaProximoMantenimiento value={fechaMantenimiento} onChange={setFechaMantenimiento} disabled={isFormDisabled} />
                <TextFechaDevolucion /> <InputFieldFechaDevolucion value={fechaDevolucion} onChange={setFechaDevolucion} disabled={isFormDisabled} />

                {/* Lista de Ítems */}
                <TextItemsEnLaBolsa />
                {items.map((item, idx) => ( <ItemRow key={item.tempId || `item-${idx}`} item={item} index={idx} onChange={handleItemChange} onRemove={handleRemoveItem} onPhotoFileSelected={handlePhotoFileSelected} onPhotoAPIDelete={handlePhotoAPIDelete} isUploading={item.is_uploading||false} uploadError={item.upload_error||null} disabled={isFormDisabled} /> ))}
                <button style={{ ...itemButtonStyle, width: '100%', height: '40px', backgroundColor: isFormDisabled ? '#a0aec0' : '#0077cc', cursor: isFormDisabled ? 'not-allowed' : 'pointer', opacity: isFormDisabled ? 0.6 : 1, marginBottom: '16px' }} onClick={handleAgregarItem} disabled={isFormDisabled}> + Agregar Ítem </button>

                {/* Botones Acción Principal */}
                <div style={{ display: "flex", justifyContent: 'center', gap: "16px", marginTop: "24px", marginBottom: "24px", borderTop: '1px solid #eee', paddingTop: '24px' }}>
                    <ButtonGuardarBolsa onClick={handleGuardarBolsa} disabled={isFormDisabled || !idBolsaNuevo} />
                    <ButtonEliminarBolsa onClick={handleEliminarBolsa} disabled={isFormDisabled || !idBolsaNuevo || isNewCreation} />
                </div>
                {isLoading && <div style={{textAlign: 'center', color: '#0077cc', marginBottom: '16px'}}>Guardando...</div>}

                {/* --- Mostrar Historial --- */}
                <TextHistorialUso />
                {historial.length === 0 ? <div style={{ color: "#666", marginBottom: "16px", textAlign: 'center', padding: '10px', backgroundColor: '#f3f4f6', borderRadius: '4px' }}>Sin historial.</div>
                 : <div style={{maxHeight: '300px', overflowY: 'auto', border: '1px solid #eee', borderRadius: '4px', padding: '8px', marginBottom: '16px'}}>
                     {historial.map((h, idx) => {
                         let displayAction = h.accion || "Acción no registrada";
                         
                         // --- Lógica para Mostrar Nombre (MEJORADA) ---
                         // 1. Prioridad: Usar nombre_usuario_accion si existe en la entrada h
                         if (h.nombre_usuario_accion) {
                             const match = displayAction.match(/^(.* por )(\S+)(\s*.*)$/i);
                             if (match && match[2]) { // Si la acción tiene formato "Acción por [username]"
                                 // Reemplaza '[username]' con el nombre completo
                                 displayAction = `${match[1]}${h.nombre_usuario_accion}${match[3] || ''}`;
                             }
                         }
                         // 2. Fallback: Si no vino nombre del backend Y la acción coincide con el usuario actual logueado
                         else if (userInfo?.username) {
                             const regex = new RegExp(`(por\\s+)${userInfo.username}(\\s|$)`, 'i');
                             if (displayAction.match(regex)) {
                                 displayAction = displayAction.replace(regex, `$1${userInfo.name || userInfo.username}$2`);
                             }
                         }
                         // --- Fin Lógica Nombre ---
                         
                         return (
                            <CardHistorial key={idx}>
                                <div style={{ padding: "4px 8px", fontSize: "13px", color: '#333', lineHeight: '1.5' }}>
                                    <strong>{new Date(h.fecha).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })}:</strong><br/>
                                    {displayAction}
                                </div>
                            </CardHistorial>
                         );
                     })}
                   </div>
                }
                {/* --- Fin Mostrar Historial --- */}

            </div> {/* Fin innerPadding */}

            {/* Modales */}
            {modalOpen && <ModalSeleccionAlmacen isOpen={modalOpen} onClose={() => setModalOpen(false)} almacenes={almacenes} onSeleccionUbicacion={handleSeleccionUbicacion} />}
            {showQRScanner && ( <div style={modalOverlayStyles}> <div style={{ backgroundColor: "#fff", borderRadius: "8px", padding: "16px", width: "340px", maxWidth: "95%", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}> <h3 style={{marginTop: 0, marginBottom: '16px', textAlign: 'center'}}>Escanear Código QR</h3> <QRScanner onResult={handleQRCodeScanned} onClose={handleCloseQRScanner} /> <button onClick={handleCloseQRScanner} style={{...btnGrey, width: '100%', marginTop: '16px'}}>Cancelar</button> </div> </div> )}
            {showWarning && selectedMember && <WarningModal memberName={`${selectedMember.FirstName} ${selectedMember.LastName}`} memberStatus={selectedMember.ClubStatusRuleCode} onIgnore={handleIgnoreWarning} onCancel={handleCancelWarning} />}

        </div> // Fin containerStyle
    );
}