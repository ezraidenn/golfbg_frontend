// src/screens/PrestamoDevolucion.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import QRScanner from "../components/QRScanner";
// import Screen from "../components/Screen";

// URL base del backend
import { API_URL } from '../utils/api'

const BASE_URL = API_URL;

// Diccionario (Completo y Original)
const ClubStatusMeanings = { ACTIVE: "Activo - Sin Crédito", "ACTIVE-CB": "Activo - Con CreditBook", "ACTIVE-CC": "Activo - Con Crédito", "ACTIVE-FR": "Activo - Foráneo Sin Crédito", "ACTIVE-FRB": "Activo - Foráneo Con CreditBook", "ACTIVE-FRC": "Activo - Foráneo Con Crédito", "ACTIVE-MAR": "Activo - Casado Sin Crédito", "ACTIVE-MRB": "Activo - Casado Con CreditBook", "ACTIVE-MRC": "Activo - Casado Con Crédito", "ACTIVE-OWN": "Activo - Dueño VIP", "ACTIVE-Z": "Activo - Sin Estados De Cuenta", CASH: "Cash - CreditCard", DECEASED: "Fallecido", EMPLEADO: "Empleado", INACTIVE: "Inactivo - Residente", "INACTIVE-S": "Inactivo - Suspensión", "NO CREDENC": "Sin Credencial", RESIGNED: "Renunció", SUSPEND4: "Suspendido Incobrables", SUSPENDED: "Suspendido", };

// Helpers (Originales)
function getStatusColor(statusCode) { if (statusCode && statusCode.trim().toUpperCase().startsWith("ACTIVE")) return "#008000"; return "#FF0000"; }
function formatDate(dateString) { if(!dateString) return "N/A"; try { const dt = new Date(String(dateString).replace('Z', '+00:00')); if(isNaN(dt.getTime())) throw Error(); return dt.toLocaleString('es-MX',{dateStyle:'short', timeStyle:'short'}); } catch { try { const p=String(dateString).split(', '); const dP=p[0].split('/'); const tP=p[1].split(':'); const dt=new Date(Date.UTC(parseInt(dP[2]),parseInt(dP[1])-1,parseInt(dP[0]),parseInt(tP[0]),parseInt(tP[1]),parseInt(tP[2]))); if(isNaN(dt.getTime())) throw Error(); return dt.toLocaleString('es-MX',{dateStyle:'short', timeStyle:'short'}); } catch { return dateString; } } }


// --- Estilos Base Globales ---
const buttonBase = { border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: 700, fontFamily: "Poppins", fontSize: "14px", padding: "8px 16px", };
const btnGrey = { ...buttonBase, backgroundColor: "#ccc", color: "#000" };
const btnGreen = { ...buttonBase, backgroundColor: "#16c76c", color: "#fff", marginBottom: "12px" };
const modalOverlayStyles = { position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999, };
const modalContentStyles = { width: "90%", maxWidth: "380px", maxHeight: "80vh", overflowY: "auto", backgroundColor: "#ffffff", borderRadius: "8px", padding: "16px", boxSizing: "border-box", fontFamily: "Poppins", };
const warningOverlayStyle = { position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", backgroundColor: "rgba(0,0,0,0.6)", zIndex: 10000, display: "flex", justifyContent: "center", alignItems: "center" };
const warningModalStyle = { backgroundColor: "#fff", borderRadius: "8px", padding: "24px", width: "320px", maxWidth: "90%", boxShadow: "0 4px 8px rgba(0,0,0,0.2)", textAlign: "center", fontFamily: "Poppins, sans-serif" };
const warningTitleStyle = { fontSize: "20px", fontWeight: "700", marginBottom: "16px", color: "#FF0000" };
const warningButtonContainerStyle = { display: "flex", gap: "12px", justifyContent: "center", marginTop: "24px", flexWrap: "wrap" };
const warningIgnoreButtonStyle = { ...buttonBase, backgroundColor: "#16c76c", color: "#fff", padding: '8px 16px', height: 'auto' };
const warningCancelButtonStyle = { ...buttonBase, backgroundColor: "#ff2d55", color: "#fff", padding: '8px 16px', height: 'auto' };
// --- Fin Estilos Base ---

// Componente MainCard (Original)
function MainCard({ children }) { const style = { position:"relative", width:"100%", maxWidth:"343px", minHeight:"400px", margin:"24px auto", backgroundColor:"#fff", borderRadius:"2px", boxShadow:"0 4px 6px rgba(0,0,0,.1)", paddingBottom:"20px" }; return <div style={style}>{children}</div>; }

// Componentes Texto (Originales)
function TextEstadoBolsa() { const s={margin:"16px 0 4px 32px",color:"#030303",fontSize:"14px",fontFamily:"Poppins",fontWeight:700,lineHeight:"20px"}; return <div style={s}>Estado de la Bolsa</div>; }
function TextClienteAsignado() { const s={margin:"16px 0 4px 32px",color:"#030303",fontSize:"14px",fontFamily:"Poppins",fontWeight:700,lineHeight:"20px"}; return <div style={s}>Miembro Asignado</div>; }
function TextUbicacionActual() { const s={margin:"16px 0 4px 32px",color:"#030303",fontSize:"14px",fontFamily:"Poppins",fontWeight:700,lineHeight:"20px"}; return <div style={s}>Ubicación Actual</div>; }
function TextNuevaUbicacion() { const s={margin:"16px 0 4px 32px",color:"#030303",fontSize:"14px",fontFamily:"Poppins",fontWeight:700,lineHeight:"20px"}; return <div style={s}>Nueva Ubicación</div>; }
function TextNotasInternas() { const s={margin:"16px 0 4px 32px",color:"#030303",fontSize:"14px",fontFamily:"Poppins",fontWeight:700,lineHeight:"20px"}; return <div style={s}>Notas Internas</div>; }
function TextFechaMantenimiento() { const s={margin:"16px 0 4px 32px",color:"#030303",fontSize:"14px",fontFamily:"Poppins",fontWeight:700,lineHeight:"20px"}; return <div style={s}>Fecha Mantenimiento</div>; }
function TextFechaDevolucion() { const s={margin:"16px 0 4px 32px",color:"#030303",fontSize:"14px",fontFamily:"Poppins",fontWeight:700,lineHeight:"20px"}; return <div style={s}>Fecha Devolución</div>; }
function TextItemsEnLaBolsa() { const s={margin:"16px 0 4px 32px",color:"#030303",fontSize:"14px",fontFamily:"Poppins",fontWeight:700,lineHeight:"20px"}; return <div style={s}>Ítems en la Bolsa</div>; }
function TextHistorialMovimientos() { const s={color:"#030303",fontSize:"18px",fontFamily:"Poppins",fontWeight:700,lineHeight:"28px",marginTop:"16px",marginBottom:"8px",textAlign:"center"}; return <div style={s}>Historial de Movimientos</div>; }
function TextSinTransacciones() { const s={color:"#94a3b8",fontSize:"14px",fontFamily:"Poppins",lineHeight:"20px",textAlign:"center",marginTop:"8px"}; return <div style={s}>No hay transacciones previas</div>; }

// Componentes Input (Originales)
function InputEstadoBolsa({ value }) { let b="#f5f5f5"; value==="Disponible"&&(b="#ccffcc"); value==="En tránsito"&&(b="#ffcccc"); const s={display:"block",margin:"0 auto",width:"311px",height:"36px",padding:"0 8px",border:"1px solid #ddd",boxSizing:"border-box",borderRadius:"6px",backgroundColor:b,color:"#333",fontSize:"14px",fontFamily:"Poppins",lineHeight:"36px",outline:"none"}; return <input style={s} value={value} readOnly/>; }
function InputClienteAsignado({ value, onChange, disabled }) { const s={display:"block",margin:"0 auto",width:"311px",height:"36px",padding:"0 8px",border:"1px solid #ddd",boxSizing:"border-box",borderRadius:"6px",backgroundColor:disabled?'#e9ecef':"#fff",color:"#94a3b8",fontSize:"14px",fontFamily:"Poppins",lineHeight:"36px",outline:"none", cursor:disabled?'not-allowed':'text'}; return <input style={s} placeholder="Buscar miembro..." value={value} onChange={onChange} disabled={disabled}/>; }
function InputUbicacionActual({ value }) { const s={display:"block",margin:"0 auto",width:"311px",height:"36px",padding:"0 8px",border:"1px solid #ddd",boxSizing:"border-box",borderRadius:"6px",backgroundColor:"#f5f5f5",color:"#333",fontSize:"14px",fontFamily:"Poppins",lineHeight:"36px",outline:"none"}; return <input style={s} value={value} readOnly/>; }
function InputNuevaUbicacion({ value, onChange, disabled }) { const s={display:"block",margin:"0 auto",width:"311px",height:"36px",padding:"0 8px",border:disabled?"1px solid #ddd":"1px solid #007700",boxSizing:"border-box",borderRadius:"6px",backgroundColor:disabled?"#f5f5f5":"#fff",color:"#94a3b8",fontSize:"14px",fontFamily:"Poppins",lineHeight:"36px",outline:"none", cursor:disabled?'not-allowed':'text'}; return <input style={s} placeholder="Ej. Bodega / Rack 5 / Nivel 2" value={value} onChange={onChange} disabled={disabled}/>; }
function InputNotasInternas({ value, onChange, disabled }) { const s={display:"block",margin:"0 auto",width:"311px",height:"56px",padding:"8px",border:"1px solid #ddd",boxSizing:"border-box",borderRadius:"6px",backgroundColor:"#fff",color:"#94a3b8",fontSize:"14px",fontFamily:"Poppins",lineHeight:"20px",outline:"none", resize: disabled ? "none" : "vertical", cursor: disabled ? "not-allowed" : "text"}; return <textarea style={s} placeholder="Notas internas..." value={value} onChange={onChange} disabled={disabled}/>; }
function InputFechaMantenimiento({ value, onChange, disabled }) { const s={display:"block",margin:"8px auto 0 auto",width:"311px",height:"38px",padding:"0 8px",border:"1px solid #ddd",boxSizing:"border-box",borderRadius:"6px",backgroundColor:"#fff",color:"#94a3b8",fontSize:"14px",fontFamily:"Poppins",lineHeight:"38px",outline:"none", cursor: disabled ? "not-allowed" : "text"}; return <input style={s} type="date" value={value||""} onChange={e=>onChange(e.target.value)} disabled={disabled}/>; }
function InputFechaDevolucion({ value, onChange, disabled }) { const s={display:"block",margin:"0 auto",width:"311px",height:"36px",padding:"0 8px",border:"1px solid #ddd",boxSizing:"border-box",borderRadius:"6px",backgroundColor:"#fff",color:"#94a3b8",fontSize:"14px",fontFamily:"Poppins",lineHeight:"36px",outline:"none", cursor: disabled ? "not-allowed" : "text"}; return <input type="datetime-local" style={s} value={value||""} onChange={e=>onChange(e.target.value)} disabled={disabled}/>; }

// --- Modal Selección Almacén (Original) ---
function SubnivelItem({ pathSoFar, nivel, selectedPath, setSelectedPath }) { const cP=[...pathSoFar,nivel.nombre]; const pS=cP.join(" / "); const hC=()=>setSelectedPath(pS); const iS=pS===selectedPath; const iSt={margin:"8px 0",padding:"6px 8px",border:"1px solid #ccc",borderRadius:"4px",cursor:"pointer",backgroundColor:iS?"#bdf7ce":"#f5f5f5",fontWeight:iS?700:400,transition:"all .2s ease"}; return(<div style={{marginLeft:12,marginBottom:8}}><div style={iSt} onClick={hC}>{nivel.nombre}</div>{nivel.subniveles?.map(sub=>(<SubnivelItem key={sub.id} pathSoFar={cP} nivel={sub} selectedPath={selectedPath} setSelectedPath={setSelectedPath}/>))}</div>); }
function ModalSeleccionAlmacen({ isOpen, onClose, almacenes, onSeleccionUbicacion }) { const[s,setS]=useState(1); const[sA,setSA]=useState(null); const[e,setE]=useState([]); const[sP,setSP]=useState(""); const[t]=useState(localStorage.getItem("token")); useEffect(()=>{isOpen&&(setS(1),setSA(null),setE([]),setSP(""))},[isOpen]); const hK=()=>onClose(); const vE=async a=>{try{const r=await fetch(`${BASE_URL}/auditoria/${a.id}`,{headers:{Authorization:`Bearer ${t}`}}); if(!r.ok)throw new Error("Error"); const d=await r.json(); setSA(a); setSP(a.nombre); setE(d.estructura||[]); setS(2)}catch(r){console.error(r); alert("Error carga estructura")};}; const hV=()=>{setS(1); setSA(null); setE([]); setSP("")}; const hGU=()=>{if(!sP)return alert("No seleccionado."); onSeleccionUbicacion(sP); onClose()}; if(!isOpen)return null; return(<div style={modalOverlayStyles} onClick={hK}><div style={modalContentStyles} onClick={e=>e.stopPropagation()}>{s===1&&(<> <h3 style={{marginBottom:12}}>Selecciona Almacén</h3> {almacenes.length===0?<p>No hay</p>:almacenes.map(a=>(<button key={a.id} style={{...btnGreen,width:"100%"}} onClick={()=>vE(a)}>{a.nombre}</button>))} <button style={btnGrey} onClick={hK}>Cancelar</button></>)}{s===2&&(<> <h3 style={{marginBottom:8}}>Estructura: {sA?.nombre}</h3> <div style={{fontSize:14,marginBottom:12,color:"#666"}}>Subniveles</div> <div style={{marginBottom:16}}>{e.length===0?<p style={{color:"#999"}}>Vacío.</p>:e.map(n=>(<SubnivelItem key={n.id} pathSoFar={[sA?.nombre||""]} nivel={n} selectedPath={sP} setSelectedPath={setSP}/>))}</div> <div style={{display:"flex",flexDirection:"column",gap:8}}> <button style={{...btnGreen,width:"100%"}} onClick={hGU}>Guardar Ubicación</button> <div style={{display:"flex",gap:8}}> <button style={{...btnGrey,flex:1}} onClick={hV}>Volver</button> <button style={{...btnGrey,flex:1}} onClick={hK}>Cancelar</button></div></div></>)}</div></div>); }

// --- Historial Card y Textos (Originales) ---
function CardHistorial({ children }) { const style = { width: "311px", margin:"0 auto", minHeight: "52px", backgroundColor: "#ffffff", borderRadius: "2px", boxShadow: "0px 4px 6px rgba(0,0,0,0.1)", marginBottom: "12px", padding:"8px" }; return <div style={style}>{children}</div>; }
function TextHistorial({ text }) { const style = { color: "#030303", fontSize: "14px", fontFamily: "Poppins", lineHeight: "20px", margin: "8px" }; return <div style={style}>{text}</div>; }

// --- ItemRow Modificado (con fotos) ---
function ItemRow({
    item, index, onChange, onRemove,
    onPhotoFileSelected, onPhotoAPIDelete, isUploading, uploadError, disabled,
    onImageClick
}) {
    const fileInputRef = useRef(null);
    const [previewUrl, setPreviewUrl] = useState(null);

    useEffect(() => {
        let currentPreviewUrl = null;
        if (item.photo_file) { currentPreviewUrl = URL.createObjectURL(item.photo_file); setPreviewUrl(currentPreviewUrl); }
        else { setPreviewUrl(null); }
        return () => { if (currentPreviewUrl) URL.revokeObjectURL(currentPreviewUrl); };
    }, [item.photo_file]);

    const getPhotoSource = () => { if(previewUrl)return previewUrl; if(item.photo_filename){const bUC=BASE_URL.endsWith('/')?BASE_URL.slice(0,-1):BASE_URL; return`${bUC}/static/item_photos/${item.photo_filename}?t=${Date.now()}`; } return null; };
    const photoSource = getPhotoSource();
    const handleFileChange = (e)=>{const f=e.target.files?.[0]; if(!f)return; if(!f.type.startsWith("image/")){alert("Solo imágenes.");e.target.value=null;return} if(f.size > 5*1024*1024){alert("Máx 5MB.");e.target.value=null;return} onPhotoFileSelected(index,f); if(fileInputRef.current)fileInputRef.current.value="";};
    const handleTriggerFileInput = () => { fileInputRef.current?.click(); };
    const handleDeletePhoto = () => { if(item.photo_filename){onPhotoAPIDelete(index,item.photo_filename);}else{onPhotoFileSelected(index,null);} };
    const photoActionsDisabled = isUploading || disabled;

    // Estilos locales
    const rowStyle = { border:"1px solid #ddd", borderRadius:"6px", padding:"12px", marginBottom:"12px", backgroundColor:"#fff" };
    const labelStyle = { display:"block", fontSize:"14px", fontFamily:"Poppins", fontWeight:600, marginBottom:"4px", color:'#333' };
    const inputBaseStyle = { width:"100%", padding:"8px", marginBottom:"10px", borderRadius:"4px", border:"1px solid #ccc", boxSizing:"border-box", fontSize:"14px", fontFamily:"Poppins", outline:"none", };
    const inputStyle = (isDisabled) => ({ ...inputBaseStyle, height:"36px", backgroundColor:isDisabled?'#e9ecef':'#fff', cursor:isDisabled?'not-allowed':'text' });
    const textareaStyle = (isDisabled) => ({ ...inputBaseStyle, height:"60px", lineHeight:1.4, resize:isDisabled?'none':'vertical', backgroundColor:isDisabled?'#e9ecef':'#fff', cursor:isDisabled?'not-allowed':'text' });
    const selectStyle = (isDisabled) => ({ ...inputBaseStyle, height:'36px', backgroundColor:isDisabled?'#e9ecef':'#fff', cursor:isDisabled?'not-allowed':'pointer' });
    const deleteItemButtonStyle = (isDisabled) => ({ width:"100%", height:"36px", backgroundColor:isDisabled?"#ff99aa":"#ff2d55", color:"#fff", border:"none", borderRadius:"4px", cursor:isDisabled?"not-allowed":"pointer", fontWeight:700, fontFamily:"Poppins", opacity:isDisabled?0.6:1, marginTop:'20px' });
    const photoSectionStyle = { marginTop:'12px', paddingTop:'12px', borderTop:'1px dashed #eee' };
    const photoPreviewContainerStyle = { display:'flex', alignItems:'center', gap:'10px', minHeight:'50px', marginBottom:'10px' };
    const photoPreviewStyle = { maxWidth:'80px', maxHeight:'80px', height:'auto', borderRadius:'4px', border:'1px solid #ccc', objectFit:'cover', cursor:'pointer' };
    const noPhotoDivStyle = { width:'80px', height:'80px', backgroundColor:'#eee', borderRadius:'4px', display:'flex', alignItems:'center', justifyContent:'center', color:'#999', fontSize:'12px', textAlign:'center' };
    const photoButtonsContainerStyle = { display:'flex', flexDirection:'column', gap:'8px', flexGrow:1 };
    const fileInputHiddenStyle = { display:'none' };
    const fileInputLabelBaseStyle = { display:'inline-block', padding:'8px 12px', color:'white', borderRadius:'4px', fontSize:'13px', fontWeight:600, transition:'background-color .2s ease, opacity .2s ease', textAlign:'center', border:'none', };
    const getFileInputLabelStyle = (isDisabled) => ({ ...fileInputLabelBaseStyle, backgroundColor:isDisabled?'#b0c4de':'#0077cc', cursor:isDisabled?'not-allowed':'pointer', opacity:isDisabled?0.7:1, });
    const photoActionButtonBaseStyle = { padding:'6px 10px', fontSize:'12px', fontWeight:500, border:'none', borderRadius:'4px', transition:'background-color .2s ease, opacity .2s ease', };
    const getDeletePhotoButton = (isDisabled) => ({ ...photoActionButtonBaseStyle, backgroundColor:isDisabled?'#f8d7da':'#ffcccc', color:isDisabled?'#b38fa0':'#dc3545', cursor:isDisabled?'not-allowed':'pointer', opacity:isDisabled?0.7:1, });
    const photoStatusStyle = { fontSize:'12px', fontStyle:'italic', marginTop:'5px', color:'#666' };
    const photoErrorStyle = { ...photoStatusStyle, color:'red', fontWeight:'bold' };

    return ( <div style={rowStyle}> <label style={labelStyle}>Descripción</label> <input style={inputStyle(disabled)} placeholder="Descripción" value={item.descripcion||""} onChange={(e)=>onChange(index,{...item,descripcion:e.target.value})} disabled={disabled}/> <label style={labelStyle}>Cantidad</label> <input type="number" style={inputStyle(disabled)} placeholder="0" min="0" value={item.cantidad??""} onChange={(e)=>{const v=e.target.value; const n=v===""?"":parseInt(v,10); if(v===""||(!isNaN(n)&&n>=0))onChange(index,{...item,cantidad:n})}} disabled={disabled}/> <label style={labelStyle}>Estado</label> <select style={selectStyle(disabled)} value={item.estado||"Buen estado"} onChange={(e)=>onChange(index,{...item,estado:e.target.value})} disabled={disabled}> <option value="Buen estado">Buen estado</option> <option value="Regular">Regular</option> <option value="Mal estado">Mal estado</option> <option value="Requiere Mantenimiento">Req. Mant.</option> </select> <label style={labelStyle}>Comentario</label> <textarea style={textareaStyle(disabled)} placeholder="Observaciones..." value={item.comentario||""} onChange={(e)=>onChange(index,{...item,comentario:e.target.value})} disabled={disabled}/> <div style={photoSectionStyle}> <label style={labelStyle}>Foto Ítem</label> <div style={photoPreviewContainerStyle}> {photoSource?<img src={photoSource} alt={`Ítem ${index+1}`} style={photoPreviewStyle} onClick={()=>photoSource&&onImageClick(photoSource)}/>:<div style={noPhotoDivStyle}>Sin foto</div>} <div style={photoButtonsContainerStyle}> <input ref={fileInputRef} type="file" accept="image/*" capture="environment" style={fileInputHiddenStyle} onChange={handleFileChange} disabled={photoActionsDisabled}/> <button type="button" style={getFileInputLabelStyle(photoActionsDisabled)} onClick={handleTriggerFileInput} disabled={photoActionsDisabled}>{photoSource?'Cambiar':'Añadir Foto'}</button> {photoSource&&(<button type="button" style={getDeletePhotoButton(photoActionsDisabled)} onClick={handleDeletePhoto} disabled={photoActionsDisabled}>Eliminar</button>)} </div> </div> {isUploading&&<div style={photoStatusStyle}>Subiendo...</div>} {uploadError&&<div style={photoErrorStyle}>{uploadError}</div>} </div> <button style={deleteItemButtonStyle(disabled)} onClick={()=>onRemove(index)} disabled={disabled}> Eliminar Ítem </button> </div> );
}

// Modal Advertencia (Original)
function WarningModal({ memberName, memberStatus, onIgnore, onCancel }) { /* ... (usa estilos globales) ... */ return(<div style={warningOverlayStyle}><div style={warningModalStyle}><h3 style={warningTitleStyle}>ATENCIÓN</h3><p style={{fontFamily:"Poppins",fontSize:"16px"}}>El miembro <strong>{memberName}</strong> tiene estado <span style={{color:getStatusColor(memberStatus)}}>{ClubStatusMeanings[memberStatus?.trim().toUpperCase()]||memberStatus}</span></p><div style={warningButtonContainerStyle}><button style={warningIgnoreButtonStyle} onClick={onIgnore}>Ignorar y Prestar</button><button style={warningCancelButtonStyle} onClick={onCancel}>Cancelar</button></div></div></div>); }

// Visor Fullscreen (Añadido)
function FullscreenImageViewer({ imageUrl, onClose }) { if(!imageUrl)return null; useEffect(()=>{document.body.style.overflow="hidden"; return()=>{document.body.style.overflow="unset"}},[]); const oS={position:"fixed",top:0,left:0,width:"100vw",height:"100vh",backgroundColor:"rgba(0,0,0,.85)",zIndex:10001,display:"flex",justifyContent:"center",alignItems:"center",backdropFilter:"blur(5px)"}; const iS={maxWidth:"95%",maxHeight:"90%",display:"block",objectFit:"contain"}; const cBS={position:"absolute",top:"15px",right:"15px",background:"rgba(255,255,255,.2)",border:"none",color:"white",fontSize:"24px",cursor:"pointer",borderRadius:"50%",width:"35px",height:"35px",display:"flex",justifyContent:"center",alignItems:"center",lineHeight:"1"}; return(<div style={oS} onClick={onClose}><img src={imageUrl} alt="Vista completa" style={iS} onClick={e=>e.stopPropagation()}/><button style={cBS} onClick={onClose} title="Cerrar">×</button></div>); }


// --- Componente Principal Modificado ---
export default function PrestamoDevolucion() {
  // Estados originales
  const [bolsa, setBolsa] = useState(null);
  const [memberInfo, setMemberInfo] = useState(null);
  const [nuevaUbicacion, setNuevaUbicacion] = useState("");
  const [fechaDevolucion, setFechaDevolucion] = useState("");
  const [memberQuery, setMemberQuery] = useState("");
  const [memberOptions, setMemberOptions] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [almacenes, setAlmacenes] = useState([]);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showWarning, setShowWarning] = useState(false);

  // --- Estados Añadidos/Modificados ---
  const [userInfo, setUserInfo] = useState({ name: "Usuario", username: null }); // Guarda name y username
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [isLoading, setIsLoading] = useState(false); // Carga Prestar/Devolver
  const [isFetchingBag, setIsFetchingBag] = useState(false); // Carga inicial
  const [items, setItems] = useState([]); // Estado local para items
  const [fullscreenImageUrl, setFullscreenImageUrl] = useState(null); // Visor fotos
  // --- Fin Estados Añadidos/Modificados ---

  // Cargar perfil de usuario (Modificado para userInfo)
  useEffect(() => {
    const fetchUserProfile = async () => {
        const storedToken = localStorage.getItem("token");
        if (!storedToken) { setUserInfo({ name: "Desconocido", username: null }); return; }
        setToken(storedToken);
        try {
            const res = await fetch(`${BASE_URL}/usuarios/me`, { headers: { Authorization: `Bearer ${storedToken}` } });
            if (res.ok) { const data = await res.json(); setUserInfo({ name: data.name || data.username, username: data.username }); }
            else { setUserInfo({ name: "Usuario (Error)", username: null }); }
        } catch (error) { setUserInfo({ name: "Usuario (Error Red)", username: null }); }
    };
    fetchUserProfile();
  }, []);

  // Recuperar bolsa por ID (modificado para poblar estado 'items')
  const handleFetchBolsa = useCallback(async (bolsaId) => {
      setBolsa(null); setMemberInfo(null); setItems([]); setNuevaUbicacion(""); setFechaDevolucion("");
      if (!bolsaId || !token) return alert(!token ? "Se requiere sesión" : "ID inválido");
      setIsFetchingBag(true);
      try {
          const encodedID = encodeURIComponent(bolsaId);
          const res = await fetch(`${BASE_URL}/bolsas/${encodedID}`, { headers: { Authorization: `Bearer ${token}` } });
          if (!res.ok) throw new Error(`Error ${res.status}: Bolsa no encontrada o error.`);
          const data = await res.json();
          if (!data || typeof data !== 'object') throw new Error("Respuesta inválida.");
          setBolsa(data);
          // Poblar estado 'items'
          const processedItems = (Array.isArray(data.items) ? data.items : []).map((it, idx) => ({ tempId: `server-${idx}-${Date.now()}`, descripcion: it.descripcion || "", cantidad: it.cantidad ?? "", estado: it.estado || "Buen estado", comentario: it.comentario || "", photo_filename: it.photo_filename || null, photo_file: null, is_uploading: false, upload_error: null, }));
          setItems(processedItems);
          setFechaDevolucion(data.fecha_devolucion ? data.fecha_devolucion.substring(0, 16) : "");
          // Reconstruir ubicación original
          setNuevaUbicacion([data.area_general, data.pasillo, data.estante_nivel, data.anden].filter(Boolean).join(' / '));
          if (data.cliente_asignado) { fetchMemberInfo(data.cliente_asignado); } else { setMemberInfo(null); }
      } catch (error) { console.error(error); alert(error.message); setBolsa(null); setItems([]); }
      finally { setIsFetchingBag(false); }
  }, [token]); // fetchMemberInfo se llama desde useEffect [bolsa]

  // Buscar info miembro (modificado para usar loading general)
  const fetchMemberInfo = useCallback(async (memberCode) => {
    setMemberInfo(null); if (!memberCode || !token) return; setIsLoading(true); // Usa isLoading general
    try { const eC=encodeURIComponent(memberCode); const r=await fetch(`${BASE_URL}/miembros?q=${eC}`,{headers:{Authorization:`Bearer ${token}`}}); if(!r.ok)throw new Error(`Err ${r.status}`); const d=await r.json(); const m=d.find(i=>i.ClubMemberCode?.trim().toUpperCase()===memberCode.trim().toUpperCase()); setMemberInfo(m||null)}
    catch(e){console.error("Err fetch member:",e)} finally{setIsLoading(false)} // Usa isLoading general
  }, [token]);

   // Efecto para buscar miembro cuando 'bolsa' cambia (Original)
   useEffect(() => {
      if (bolsa?.cliente_asignado) {
          fetchMemberInfo(bolsa.cliente_asignado);
      } else {
          setMemberInfo(null);
      }
      // Actualizar campos relacionados con la bolsa cargada (Original)
      setNuevaUbicacion([bolsa?.area_general, bolsa?.pasillo, bolsa?.estante_nivel, bolsa?.anden].filter(Boolean).join(' / ') || '');
      setFechaDevolucion(bolsa?.fecha_devolucion ? bolsa.fecha_devolucion.substring(0, 16) : "");
      // Poblar items si la bolsa cambió (Original)
      const processedItems = (Array.isArray(bolsa?.items) ? bolsa.items : []).map((it, idx) => ({ tempId: `server-${idx}-${Date.now()}`, descripcion: it.descripcion || "", cantidad: it.cantidad ?? "", estado: it.estado || "Buen estado", comentario: it.comentario || "", photo_filename: it.photo_filename || null, photo_file: null, is_uploading: false, upload_error: null, }));
      setItems(processedItems);

  }, [bolsa, fetchMemberInfo]);


  // --- Handlers Items y Fotos (Reutilizados) ---
  const handleItemChange = (index, updatedItemData) => { if(isLoading||isFetchingBag)return; setItems(p=>p.map((t,i)=>i===index?{...t,...updatedItemData}:t)); };
  const handleAgregarItem = () => { if(isLoading||isFetchingBag)return; const nI={tempId:`new-${Date.now()}-${Math.random()}`,descripcion:"",cantidad:"",estado:"Buen estado",comentario:"",photo_filename:null,photo_file:null,is_uploading:!1,upload_error:null}; setItems(p=>[...p,nI]); };
  const handleRemoveItem = (index) => { if(isLoading||isFetchingBag)return; const iTR=items[index]; if(!iTR)return; if(iTR.photo_filename&&!window.confirm(`¿Eliminar ítem "${iTR.descripcion||index+1}" y su foto?`))return; setItems(p=>p.filter((_,i)=>i!==index)); if(bolsa?.id&&iTR.photo_filename){deleteItemPhotoAPI(bolsa.id,index,iTR.photo_filename).catch(e=>console.error("Fallo borrado bg:",e)); }};
  const handlePhotoFileSelected = (index, file) => { setItems(p=>p.map((t,i)=>i===index?{...t,photo_file:file,photo_filename:file?null:t.photo_filename,is_uploading:!1,upload_error:null}:t)); if(bolsa?.id&&file){uploadItemPhotoAPI(bolsa.id,index,file);} };
  const handlePhotoAPIDelete = (index, filename) => { if(bolsa?.id){deleteItemPhotoAPI(bolsa.id,index,filename);}else{handlePhotoFileSelected(index,null);} };
  const uploadItemPhotoAPI = async(bolsaId, itemIndex, file) => { const itemExists=items.some((_,i)=>i===itemIndex); if(!itemExists)return; setItems(p=>p.map((t,i)=>i===itemIndex?{...t,is_uploading:!0,upload_error:null}:t)); const fD=new FormData(); fD.append("file",file); try{const r=await fetch(`${BASE_URL}/bolsas/${encodeURIComponent(bolsaId)}/items/${itemIndex}/photo`,{method:"POST",headers:{Authorization:`Bearer ${token}`},body:fD}); if(!r.ok){let e=`Err ${r.status}`; try{e=(await r.json()).detail||e}catch(_){}throw new Error(e)} const uB=await r.json(); setItems(p=>{const sI=Array.isArray(uB.items)?uB.items:[]; return p.map((li,idx)=>idx===itemIndex?{...li,...(sI[idx]||{}),photo_file:null,is_uploading:!1,upload_error:null}:li);}); }catch(e){console.error(`Err upload foto ${itemIndex}:`,e); setItems(p=>p.map((t,i)=>i===itemIndex?{...t,is_uploading:!1,upload_error:e.message}:t));}};
  const deleteItemPhotoAPI = async(bolsaId, itemIndex, filename) => { const itemExists=items.some((_,i)=>i===itemIndex); if(!itemExists)return; setItems(p=>p.map((t,i)=>i===itemIndex?{...t,photo_filename:null,photo_file:null,is_uploading:!1,upload_error:null}:t)); try{const r=await fetch(`${BASE_URL}/bolsas/${encodeURIComponent(bolsaId)}/items/${itemIndex}/photo`,{method:"DELETE",headers:{Authorization:`Bearer ${token}`}}); if(!r.ok&&r.status!==404){let e=`Err ${r.status}`; try{e=(await r.json()).detail||e}catch(_){}throw new Error(e)} console.log(`Borrado API foto ${filename} ${r.status===404?"no encontrada":"OK"}.`);}catch(e){console.error(`Err delete API foto ${itemIndex}:`,e); alert(`Error borrando foto servidor: ${e.message}.`); setItems(p=>p.map((t,i)=>i===itemIndex?{...t,upload_error:"Error borrando servidor"}:t));}};
  const handleImageClick = (imageUrl) => { setFullscreenImageUrl(imageUrl); }; // Para visor

  // --- Funciones Prestar/Devolver Modificadas (con username y items) ---
   const actualizarBolsaAPI = async (accion, nuevoEstado, fechaDevolucionPayload) => {
    if (!bolsa || !bolsa.id || !userInfo.username) { alert("Bolsa no cargada o usuario no identificado."); return; }
    setIsLoading(true);

    // Historial con USERNAME
    const nuevaEntrada = { fecha: new Date().toISOString(), accion: `${accion} por ${userInfo.username}` }; // <-- USERNAME
    const currentHistorial = Array.isArray(bolsa.historial) ? bolsa.historial : [];
    const validCurrentHistorial = currentHistorial.filter(h => typeof h === 'object' && h !== null && typeof h.fecha === 'string' && typeof h.accion === 'string'); // Filtrar inválidos
    const updatedHistorial = [nuevaEntrada, ...validCurrentHistorial];

    // Extraer ubicación si se devuelve
    let area_general_p=bolsa.area_general, pasillo_p=bolsa.pasillo, estante_p=bolsa.estante_nivel, anden_p=bolsa.anden;
    const ubicacionActualJoin = [bolsa.area_general, bolsa.pasillo, bolsa.estante_nivel, bolsa.anden].filter(Boolean).join(' / ');
    if (accion === 'devuelto' && nuevaUbicacion && nuevaUbicacion !== ubicacionActualJoin) {
        const partes = nuevaUbicacion.split(' / ').map(p => p.trim());
        area_general_p = partes[1] || null; pasillo_p = partes[2] || null; estante_p = partes[3] || null; anden_p = partes[4] || null;
    } else if (accion === 'prestado') { /* No cambia ubicación */ }

     // Items del estado local 'items'
     const itemsForPayload = items.map(it => ({ descripcion:it.descripcion||"", cantidad:it.cantidad===""||isNaN(Number(it.cantidad))?0:Number(it.cantidad), estado:it.estado||"Buen estado", comentario:it.comentario||"", photo_filename:it.photo_filename||null, }));

    const payload = {
      id: bolsa.id.trim(), estado: nuevoEstado, area_general: area_general_p, pasillo: pasillo_p, estante_nivel: estante_p, anden: anden_p,
      cliente_asignado: bolsa.cliente_asignado || null, notas_internas: bolsa.notas_internas || null, fecha_mantenimiento: bolsa.fecha_mantenimiento || null,
      fecha_devolucion: fechaDevolucionPayload, items: itemsForPayload, historial: updatedHistorial,
    };

    try {
      const encodedID = encodeURIComponent(bolsa.id.trim());
      const res = await fetch(`${BASE_URL}/bolsas/${encodedID}`, { method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(payload), });
      if (!res.ok) { let e=`Err ${res.status}`; try{e=(await res.json()).detail||e}catch(_){} throw new Error(e); }
      const data = await res.json();
      alert(`¡Bolsa ${accion} exitosamente!`);
      setBolsa(data); // Actualiza bolsa
      // Sincroniza items
      const serverItems = Array.isArray(data.items) ? data.items : [];
      setItems(prevItems => serverItems.map((serverItem, idx) => ({ ...(prevItems[idx] || {}), ...serverItem, photo_file: null, is_uploading: false, upload_error: null, })));
      // Actualiza form
      if (accion === 'devuelto') { setNuevaUbicacion([data.area_general,data.pasillo,data.estante_nivel,data.anden].filter(Boolean).join(' / ')); setFechaDevolucion(""); }
      else { setFechaDevolucion(data.fecha_devolucion ? data.fecha_devolucion.substring(0, 16) : ""); }
    } catch (error) { console.error(error); alert(`Error al ${accion} la bolsa: ${error.message}`); }
    finally { setIsLoading(false); }
  };

  const doPrestar = () => actualizarBolsaAPI('prestado', 'En tránsito', fechaDevolucion || null);
  const handlePrestar = async () => { if (memberInfo?.ClubStatusRuleCode && getStatusColor(memberInfo.ClubStatusRuleCode)==="#FF0000") { setShowWarning(true); return; } await doPrestar(); };
  const handleDevolver = () => actualizarBolsaAPI('devuelto', 'Disponible', null);
  const handleIgnoreWarning = async () => { setShowWarning(false); await doPrestar(); };
  const handleCancelWarning = () => setShowWarning(false);

  // Modal Ubicación (Original)
  async function handleOpenModal(){if(isLoading||isFetchingBag)return; try{const r=await fetch(`${BASE_URL}/auditoria`,{headers:{Authorization:`Bearer ${token}`}}); if(!r.ok)throw new Error("Err almacenes"); const d=await r.json(); setAlmacenes(Array.isArray(d)?d:[]); setModalOpen(!0)}catch(r){console.error("Err almacenes:",r); alert("Error cargando.")}}; function handleSeleccionUbicacion(pS){setNuevaUbicacion(pS); setModalOpen(!1)};

  // Búsqueda Miembros (Original)
  useEffect(()=>{if(!memberQuery){setMemberOptions([]); return} const t=localStorage.getItem("token"); const tm=setTimeout(async()=>{try{const u=`${BASE_URL}/miembros?q=${encodeURIComponent(memberQuery)}`; const r=await fetch(u,{headers:{Authorization:`Bearer ${t}`}}); if(!r.ok)throw new Error("Err buscar"); const d=await r.json(); setMemberOptions(d)}catch(e){setMemberOptions([]); console.error(e)}},300); return()=>clearTimeout(tm)},[memberQuery]); function handleSelectMember(m){if(!bolsa)return; const u={...bolsa,cliente_asignado:m.ClubMemberCode}; setBolsa(u); setMemberInfo(m); setMemberQuery(`${m.FirstName} ${m.LastName} (${m.ClubMemberCode})`)};

  // QR Handlers (Original)
  function handleQRResult(sV){setShowQRScanner(!1); const t=sV.trim(); if(t)handleFetchBolsa(t)};

  // --- Render principal ---
  const isFormDisabled = isLoading || isFetchingBag;

  return (
    // <Screen>
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", width:"100%", minHeight:"100vh", backgroundColor:"#f5f5f5", paddingBottom:"80px", fontFamily:"Poppins" }}>
      <MainCard>
        <div style={{ textAlign: "center", marginTop: "16px" }}>
          <button style={{ width: "311px", height: "40px", backgroundColor: "#0077cc", color: "#fff", border: "none", borderRadius: "6px", fontFamily: "Poppins", fontWeight: 700, cursor: isFormDisabled ? 'not-allowed' : 'pointer', opacity: isFormDisabled ? 0.6 : 1 }} onClick={() => !isFormDisabled && setShowQRScanner(true)} disabled={isFormDisabled}>
            {isFetchingBag ? 'Cargando...' : 'Escanear ID de Bolsa'}
          </button>
        </div>

        {isFetchingBag && !bolsa && <div style={{textAlign:'center', padding: '20px', color:'#555'}}>Buscando bolsa...</div>}

        {bolsa && !isFetchingBag && (
          <>
            <TextEstadoBolsa />
            <InputEstadoBolsa value={bolsa.estado || ""} />

            {/* Miembro Asignado (Original) */}
            <TextClienteAsignado />
            {memberInfo || bolsa.cliente_asignado ? ( <div style={styles.memberCard}> <div style={styles.memberHeader}> Miembro asignado: <button style={styles.deleteButton} onClick={()=>{const u={...bolsa,cliente_asignado:""}; setBolsa(u); setMemberInfo(null); setMemberQuery("");}} disabled={isFormDisabled}> X </button> </div> {memberInfo?(<> <div style={styles.memberTextTitle}>{memberInfo.FirstName} {memberInfo.LastName}</div> <div style={styles.memberText}><strong>Código:</strong> {memberInfo.ClubMemberCode}</div> <div style={styles.memberText}><strong>Edad:</strong> {memberInfo.Age??"N/A"}</div> <div style={{...styles.memberText,color:getStatusColor(memberInfo.ClubStatusRuleCode)}}><strong>Estado:</strong> {ClubStatusMeanings[memberInfo.ClubStatusRuleCode?.trim().toUpperCase()]||memberInfo.ClubStatusRuleCode||"N/A"}</div> </>):(<div style={{textAlign:"center",fontSize:"14px",color:"#999"}}>Código: {bolsa.cliente_asignado} (cargando...)</div>)} </div> ):( <div style={{marginBottom:"16px",fontSize:"14px",color:"#999",textAlign:"center"}}>Ningún miembro asignado.</div> )}

            {/* Búsqueda para reasignar (Original) */}
            <TextClienteAsignado />
            <InputClienteAsignado value={memberQuery} onChange={(e)=>setMemberQuery(e.target.value)} disabled={isFormDisabled}/>
            {memberQuery&&memberOptions.length>0&&(<div style={{border:"1px solid #ccc",maxHeight:150,overflowY:"auto",marginBottom:16,margin:"0 auto",width:"311px"}}>{memberOptions.map(m=>(<div key={m.ClubMemberCode} style={{padding:8,cursor:"pointer",backgroundColor:memberInfo?.ClubMemberCode===m.ClubMemberCode?"#eef":"#fff"}} onClick={()=>handleSelectMember(m)}>{m.FirstName} {m.LastName} ({m.ClubMemberCode})</div>))}</div>)}

            {/* Ubicación (Original + Input Restaurado) */}
            <TextUbicacionActual />
            <InputUbicacionActual value={[bolsa.area_general, bolsa.pasillo, bolsa.estante_nivel, bolsa.anden].filter(Boolean).join(' / ') || 'Sin ubicación'} />
            <TextNuevaUbicacion />
            <InputNuevaUbicacion value={nuevaUbicacion} onChange={(e) => setNuevaUbicacion(e.target.value)} disabled={isFormDisabled} /> {/* <-- Input Restaurado */}
             <div style={{ textAlign: "center", marginTop: "8px" }}>
              <button style={{ width:"311px", height:"40px", border:"none", borderRadius:"6px", backgroundColor:"#16c76c", color:"#fff", fontWeight:700, fontFamily:"Poppins", cursor:isFormDisabled?'not-allowed':'pointer', opacity: isFormDisabled?0.6:1 }} onClick={handleOpenModal} disabled={isFormDisabled}>
                Seleccionar Ubicación Bodega
              </button>
             </div>
             {nuevaUbicacion && nuevaUbicacion !== [bolsa.area_general, bolsa.pasillo, bolsa.estante_nivel, bolsa.anden].filter(Boolean).join(' / ') &&
                <p style={{fontSize: '12px', color: '#555', textAlign:'center', marginTop: '5px'}}>Nueva ubicación: {nuevaUbicacion}</p>
             }


            {/* Notas y Fechas (Originales) */}
            <TextNotasInternas />
            <InputNotasInternas value={bolsa.notas_internas || ""} onChange={(e) => setBolsa({ ...bolsa, notas_internas: e.target.value })} disabled={isFormDisabled}/>
            <TextFechaMantenimiento />
            <InputFechaMantenimiento value={bolsa.fecha_mantenimiento ? bolsa.fecha_mantenimiento.split('T')[0] : ""} onChange={(val) => setBolsa({ ...bolsa, fecha_mantenimiento: val })} disabled={isFormDisabled}/>
            <TextFechaDevolucion />
            <InputFechaDevolucion value={fechaDevolucion} onChange={setFechaDevolucion} disabled={isFormDisabled}/>

            {/* --- Renderizado Items con Fotos --- */}
            <TextItemsEnLaBolsa />
            {items.map((item, idx) => (
              <ItemRow
                key={item.tempId || `item-${idx}`}
                item={item}
                index={idx}
                onChange={handleItemChange}
                onRemove={handleRemoveItem}
                onPhotoFileSelected={handlePhotoFileSelected}
                onPhotoAPIDelete={handlePhotoAPIDelete}
                isUploading={item.is_uploading || false}
                uploadError={item.upload_error || null}
                disabled={isFormDisabled}
                onImageClick={handleImageClick}
              />
            ))}
            <button style={{ width:"311px", height:"40px", margin:"16px auto", display:"block", backgroundColor:isFormDisabled?'#a0aec0':"#0077cc", color:"#fff", border:"none", borderRadius:"6px", fontFamily:"Poppins", fontWeight:700, cursor:isFormDisabled?'not-allowed':"pointer", opacity: isFormDisabled?0.6:1 }} onClick={handleAgregarItem} disabled={isFormDisabled}> Agregar ítem </button>
            {/* --- Fin Renderizado Items --- */}

            {/* Botones de Acción (Sin lógica de disabled por estado) */}
            <div style={{ textAlign: "center", marginTop: "16px" }}>
              <ButtonAccion onClick={handlePrestar} text="Prestar Bolsa" bgColor="#16c76c" disabled={isFormDisabled}/>
              <ButtonAccion onClick={handleDevolver} text="Devolver Bolsa" bgColor="#ff2d55" disabled={isFormDisabled}/>
            </div>
             {isLoading && <div style={{textAlign: 'center', color: '#0077cc', marginTop: '10px'}}>Procesando...</div>}
          </>
        )}
      </MainCard>

      {/* --- Visualización del Historial con Nombres --- */}
      {bolsa && !isFetchingBag && (
        <div style={{ width: "311px", margin: "24px auto 0 auto" }}>
          <TextHistorialMovimientos />
           <HistoryDisplay historial={bolsa.historial} userInfo={userInfo} />
        </div>
      )}
      {/* --- Fin Visualización Historial --- */}


      {/* Modales */}
      {modalOpen && (<ModalSeleccionAlmacen isOpen={modalOpen} onClose={()=>setModalOpen(!1)} almacenes={almacenes} onSeleccionUbicacion={handleSeleccionUbicacion}/>)}
      {/* --- Usa estilos globales --- */}
      {showQRScanner && (<div style={styles.modalOverlayStyles}><div style={styles.modalContentStylesQR}><h3 style={{marginTop:0,marginBottom:"16px",textAlign:"center"}}>Escanear QR</h3><QRScanner onResult={handleQRResult} onClose={()=>setShowQRScanner(!1)}/><button onClick={()=>setShowQRScanner(!1)} style={{...styles.btnGreyPD, width:"100%",marginTop:"16px"}}>Cancelar</button></div></div>)}
      {showWarning && memberInfo && (<WarningModal memberName={`${memberInfo.FirstName} ${memberInfo.LastName}`} memberStatus={memberInfo.ClubStatusRuleCode} onIgnore={handleIgnoreWarning} onCancel={handleCancelWarning}/>)}
      {fullscreenImageUrl && <FullscreenImageViewer imageUrl={fullscreenImageUrl} onClose={() => setFullscreenImageUrl(null)} />} {/* Visor */}

    </div>
    // </Screen>
  );
}

// --- Botón Acción (Modificado) ---
function ButtonAccion({ onClick, text, bgColor, disabled }) { // Mantiene disabled
  const style = { display:"block", margin:"16px auto", width:"311px", height:"52px", border:"none", boxSizing:"border-box", borderRadius:"2px", backgroundColor:disabled?'#ccc':bgColor, color:"#fff", fontSize:"18px", fontFamily:"Poppins", fontWeight:700, lineHeight:"28px", cursor:disabled?'not-allowed':"pointer", opacity: disabled?0.6:1 };
  return ( <button style={style} onClick={onClick} disabled={disabled}> {text} </button> );
}

// --- Estilos Completos (Restaurados) ---
const styles = {
  memberCard:{width:"311px",backgroundColor:"#ecfdf5",border:"1px solid #d1fae5",borderRadius:"8px",padding:"12px",marginBottom:"16px",color:"#065f46",fontFamily:"Poppins",position:"relative",margin:"0 auto"},
  memberHeader:{display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:"14px",fontWeight:"700",marginBottom:"6px"},
  deleteButton:{backgroundColor:"transparent",border:"none",color:"#ff2d55",fontWeight:"bold",cursor:"pointer",fontSize:"14px"},
  memberTextTitle:{fontSize:"16px",fontWeight:"bold",marginBottom:"6px"},
  memberText:{fontSize:"14px",marginBottom:"4px"},
  histCard:{backgroundColor:"#f8f9fa",border:"1px solid #e9ecef",borderRadius:"4px",padding:"8px 12px",marginBottom:"8px", width: '100%', boxSizing: 'border-box'},
  histText:{fontSize:"13px",margin:0,color:"#2c3e50",lineHeight:"1.5"},
  subtleText:{fontSize:"11px",color:"#666",display:"inline-block",marginRight:"5px"},
  itemRowStyle:{border:"1px solid #ddd",borderRadius:"6px",padding:"12px",marginBottom:"12px",backgroundColor:"#fff",boxShadow:"0 1px 3px rgba(0,0,0,0.05)"},
  itemLabelStyle:{display:"block",fontSize:"14px",fontFamily:"Poppins, sans-serif",fontWeight:600,marginBottom:"4px",color:"#333"},
  itemInputBaseStyle:{width:"100%",padding:"8px",marginBottom:"10px",borderRadius:"4px",border:"1px solid #ccc",boxSizing:"border-box",fontSize:"14px",fontFamily:"Poppins, sans-serif",outline:"none"},
  photoSectionStyle:{marginTop:"12px",paddingTop:"12px",borderTop:"1px dashed #eee"},
  photoPreviewContainerStyle:{display:"flex",alignItems:"center",gap:"10px",minHeight:"50px",marginBottom:"10px"},
  photoPreviewStyle:{maxWidth:"80px",maxHeight:"80px",height:"auto",borderRadius:"4px",border:"1px solid #ccc",objectFit:"cover",cursor:"pointer"},
  noPhotoDivStyle:{width:"80px",height:"80px",backgroundColor:"#eee",borderRadius:"4px",display:"flex",alignItems:"center",justifyContent:"center",color:"#999",fontSize:"12px",textAlign:"center"},
  photoButtonsContainerStyle:{display:"flex",flexDirection:"column",gap:"8px",flexGrow:1},
  fileInputHiddenStyle:{display:"none"},
  fileInputLabelBaseStyle:{display:"inline-block",padding:"8px 12px",color:"white",borderRadius:"4px",fontSize:"13px",fontWeight:600,transition:"background-color .2s ease, opacity .2s ease",textAlign:"center",border:"none"},
  photoActionButtonBaseStyle:{padding:"6px 10px",fontSize:"12px",fontWeight:500,border:"none",borderRadius:"4px",transition:"background-color .2s ease, opacity .2s ease"},
  photoStatusStyle:{fontSize:"12px",fontStyle:"italic",marginTop:"5px",color:"#666"},
  photoErrorStyle:{fontSize:"12px",fontStyle:"italic",marginTop:"5px",color:"red",fontWeight:"bold"},
  modalOverlayStyles: { position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999, },
  modalContentStyles: { width: "90%", maxWidth: "380px", maxHeight: "80vh", overflowY: "auto", backgroundColor: "#ffffff", borderRadius: "8px", padding: "16px", boxSizing: "border-box", fontFamily: "Poppins, sans-serif", },
  modalContentStylesQR: { backgroundColor: "#fff", borderRadius: "8px", padding: "16px", width: "320px", maxWidth: "90%", boxShadow: "0 4px 8px rgba(0,0,0,0.2)", },
  buttonBase: { border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: 700, fontFamily: "Poppins", fontSize: "14px", padding: "8px 16px", },
  btnGreyPD: { ...buttonBase, backgroundColor: "#ccc", color: "#000" },
  btnGreen: { ...buttonBase, backgroundColor: "#16c76c", color: "#fff", marginBottom: "12px" },
  fullscreenOverlay: { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0, 0, 0, 0.85)', zIndex: 10001, display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(5px)' },
  fullscreenImage: { maxWidth: '95%', maxHeight: '90%', display: 'block', objectFit: 'contain' },
  fullscreenCloseButton: { position: 'absolute', top: '15px', right: '15px', background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', fontSize: '24px', cursor: 'pointer', borderRadius: '50%', width: '35px', height: '35px', display: 'flex', justifyContent: 'center', alignItems: 'center', lineHeight: '1' }
};
// --- Fin Estilos ---

// --- Componente Auxiliar para Historial (Modificado para usar nombre_usuario_accion) ---
function HistoryDisplay({ historial, userInfo }) { // userInfo se mantiene por si el backend no envía nombre
  if (!Array.isArray(historial) || historial.length === 0) { return <TextSinTransacciones />; }
  // Ordenación (asumiendo fechas ISO o locale)
  const sortedHistorial = [...historial].sort((a, b) => { const parseDate=(s)=>{try{return new Date(String(s).replace('Z','+00:00')).getTime()}catch{try{const p=String(s).split(', '); const dP=p[0].split('/'); const tP=p[1].split(':'); return new Date(Date.UTC(parseInt(dP[2]),parseInt(dP[1])-1,parseInt(dP[0]),parseInt(tP[0]),parseInt(tP[1]),parseInt(tP[2]))).getTime()}catch{return NaN}}}; const dA=parseDate(a?.fecha); const dB=parseDate(b?.fecha); return(isNaN(dB)?-Infinity:dB)-(isNaN(dA)?-Infinity:dA); });

  return (
    <>
      {sortedHistorial.map((h, index) => {
        let displayAction = h.accion || "Acción no registrada";
        // --- >>> USA nombre_usuario_accion si existe <<< ---
        if (h.nombre_usuario_accion) {
            const match = displayAction.match(/^(.* por )(\S+)(\s*.*)$/i);
            if (match && match[2]) { // Reemplaza el username por el nombre recibido
                displayAction = `${match[1]}${h.nombre_usuario_accion}${match[3] || ''}`;
            }
        } else if (userInfo?.username && displayAction.includes(`por ${userInfo.username}`)) {
            // Fallback si el backend no envió nombre, pero coincide con user actual
            const regex = new RegExp(`(por\\s+)${userInfo.username}(\\s|$)`, 'i');
            displayAction = displayAction.replace(regex, `$1${userInfo.name || userInfo.username}$2`);
        }
        // --- >>> FIN <<< ---
        return (
          <CardHistorial key={`hist-${index}-${h.fecha || index}`}>
            <TextHistorial text={`${formatDate(h.fecha)} | ${displayAction}`} />
          </CardHistorial>
        );
      })}
    </>
  );
}
// --- Fin Componente Auxiliar ---

// Placeholder Screen
// if (typeof Screen === 'undefined') { const Screen = ({ children }) => <div style={{backgroundColor: '#f0f2f5', minHeight: '100vh'}}>{children}</div>; }