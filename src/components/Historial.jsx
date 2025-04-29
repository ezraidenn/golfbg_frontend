// src/components/Historial.jsx
import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import Screen from "../components/Screen"; // Asegúrate que la ruta sea correcta

const BASE_URL = "http://10.0.0.49:7734";
const PAGE_SIZE = 25; // Número de elementos a mostrar por página

/* ------------------ ESTILOS (Asumiendo un CSS Module en styles) ------------------ */
// Crear un archivo Historial.module.css si no existe y pegar los estilos allí
const styles = {
    wrapper: { margin: "16px auto", padding: "0 16px", width: "100%", maxWidth: "768px", minHeight: "100vh", backgroundColor: "#f5f5f5", fontFamily: "Poppins, sans-serif", display: "flex", flexDirection: "column", alignItems: "center", boxSizing: 'border-box', },
    title: { fontSize: 20, fontWeight: 700, marginBottom: 20, textAlign: "center", color: '#333' },
    filterSection: { width: '100%', backgroundColor: '#fff', padding: '16px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginBottom: '16px', boxSizing: 'border-box', },
    input: { flex: 1, minWidth: '150px', height: 38, padding: "0 10px", borderRadius: 6, border: "1px solid #ccc", backgroundColor: "#fff", fontSize: 14, outline: 'none', boxSizing: 'border-box', },
    inputDisabled: { backgroundColor: '#e9ecef', cursor: 'not-allowed', },
    flexRow: { width: "100%", display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 12 },
    checkboxContainer: { display: "flex", gap: 16, marginBottom: 12, flexWrap: "wrap", justifyContent: 'center' },
    label: { display: "flex", alignItems: "center", gap: 6, fontSize: 14, cursor: 'pointer' },
    dropdown: { flex: 1, minWidth: '150px', height: 38, padding: "0 10px", borderRadius: 6, border: "1px solid #ccc", backgroundColor: "#fff", fontSize: 14, cursor: "pointer", outline: 'none', boxSizing: 'border-box', },
    dropdownDisabled: { backgroundColor: '#e9ecef', cursor: 'not-allowed', color: '#6c757d', },
    card: { width: "100%", backgroundColor: "#fff", borderRadius: 8, padding: 16, marginBottom: 12, boxShadow: "0 2px 5px rgba(0,0,0,0.08)", fontSize: 14, lineHeight: "1.6", borderLeft: '4px solid #6c757d', boxSizing: 'border-box', },
    cardPrestada: { borderLeftColor: '#ffc107' }, cardDevuelta: { borderLeftColor: '#28a745' }, cardRetrasada: { borderLeftColor: '#dc3545' }, cardModificada: { borderLeftColor: '#17a2b8' }, cardOtro: { borderLeftColor: '#6c757d' },
    bold: { fontWeight: "bold" },
    subtleText: { fontSize: '12px', color: '#666', marginTop: '4px'},
    noResults: { width: '100%', marginTop: 32, color: "#555", fontSize: 16, textAlign: 'center', padding: '20px', backgroundColor: '#fff', borderRadius: '8px', boxSizing: 'border-box' },
    button: { margin: "8px 0", padding: "10px 20px", borderRadius: 6, border: "none", fontWeight: 600, cursor: "pointer", fontSize: 14, transition: 'background-color 0.2s ease, opacity 0.2s ease', },
    buttonDisabled: { opacity: 0.6, cursor: 'not-allowed', },
    btnMore: { backgroundColor: "#0077cc", color: "#fff", display: 'block', margin: '20px auto', },
    btnClear: { backgroundColor: '#6c757d', color: '#fff', },
    loadingIndicator: { width: '100%', textAlign: 'center', padding: '20px', fontSize: '16px', color: '#0077cc', boxSizing: 'border-box' },
    errorIndicator: { width: '100%', textAlign: 'center', padding: '20px', fontSize: '16px', color: '#dc3545', backgroundColor: '#f8d7da', border: '1px solid #f5c6cb', borderRadius: '8px', boxSizing: 'border-box' },
    // Autocomplete
    autocompleteContainer: { position: 'relative', flex: 1, minWidth: '200px', },
    autocompleteDropdown: { position: 'absolute', left: 0, right: 0, top: '100%', maxHeight: '250px', overflowY: 'auto', backgroundColor: '#fff', border: '1px solid #ccc', borderTop: 'none', borderRadius: '0 0 6px 6px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', zIndex: 1000, marginTop: '-1px', },
    autocompleteItem: { padding: '10px 12px', cursor: 'pointer', fontSize: '14px', borderBottom: '1px solid #eee', },
    autocompleteItemLast: { borderBottom: 'none' },
    suggestionHighlight: { fontWeight: 'bold' },
};
/* --------------------------------------------- */

// Constantes y Helpers
const ACTION_TYPES = { PRESTADA: 'PRESTADA', DEVUELTA: 'DEVUELTA', RETRASADA: 'RETRASADA', MODIFICADA: 'MODIFICADA', OTRO: 'OTRO' };

function getActionType(actionText) {
    const text = (actionText || "").toLowerCase();
    if (/prestó|prestado|asignad|activad|entregad/i.test(text)) return ACTION_TYPES.PRESTADA;
    if (/devolvió|devuelt|retornad|recibid/i.test(text)) return ACTION_TYPES.DEVUELTA;
    if (/retrasad/i.test(text)) return ACTION_TYPES.RETRASADA;
    if (/modificó|modificad|actualizad|creado/i.test(text)) return ACTION_TYPES.MODIFICADA;
    return ACTION_TYPES.OTRO;
}
const actionCardStyles = { [ACTION_TYPES.PRESTADA]: styles.cardPrestada, [ACTION_TYPES.DEVUELTA]: styles.cardDevuelta, [ACTION_TYPES.RETRASADA]: styles.cardRetrasada, [ACTION_TYPES.MODIFICADA]: styles.cardModificada, [ACTION_TYPES.OTRO]: styles.cardOtro,};

function formatName(first, last, code) {
    const validFirst = first && String(first).toLowerCase() !== "null" ? String(first).trim() : "";
    const validLast = last && String(last).toLowerCase() !== "null" ? String(last).trim() : "";
    const fullName = `${validFirst} ${validLast}`.trim();
    return fullName || (code ? String(code) : '') || "Desconocido";
}

// --- buildSentence MEJORADO ---
function buildSentence(m, memberMap) {
    const usuario = m.usuario || "Sistema";
    const accionRaw = m.accion || "realizó una acción desconocida";
    // Extraer el ID de la bolsa si está en _internalId (para el fallback)
    const bolsaIdFromInternal = m._internalId ? String(m._internalId).split('-')[0] : '';
    const bolsaId = m.bolsa_id || bolsaIdFromInternal || 'Bolsa Desconocida'; // <-- Añadir ID Bolsa
    const actionType = getActionType(accionRaw);

    const clienteCode = m.cliente ? String(m.cliente).trim() : "";
    const clienteName = clienteCode ? (memberMap[clienteCode] || clienteCode) : "N/A";

    let sentence = null;

    // Incluir ID de la Bolsa en la oración
    switch (actionType) {
        case ACTION_TYPES.PRESTADA: sentence = (<><span style={styles.bold}>{usuario}</span> prestó la bolsa <span style={styles.bold}>{bolsaId}</span>{clienteCode && <> al cliente <span style={styles.bold}>{clienteName}</span></>}</>); break;
        case ACTION_TYPES.DEVUELTA: sentence = (<><span style={styles.bold}>{usuario}</span> devolvió la bolsa <span style={styles.bold}>{bolsaId}</span>{clienteCode && <> del cliente <span style={styles.bold}>{clienteName}</span></>}</>); break;
        case ACTION_TYPES.RETRASADA: sentence = (<><span style={styles.bold}>{usuario}</span> marcó retrasada la bolsa <span style={styles.bold}>{bolsaId}</span>{clienteCode && <> del cliente <span style={styles.bold}>{clienteName}</span></>}</>); break;
        case ACTION_TYPES.MODIFICADA: sentence = (<><span style={styles.bold}>{usuario}</span> modificó la bolsa <span style={styles.bold}>{bolsaId}</span>{clienteCode && <> (Cliente: <span style={styles.bold}>{clienteName}</span>)</>}</>); break;
        default: sentence = (<><span style={styles.bold}>{usuario}</span> {accionRaw} en bolsa <span style={styles.bold}>{bolsaId}</span>{clienteCode && <> (Cliente: <span style={styles.bold}>{clienteName}</span>)</>}</>);
    }

    let fechaStr = ""; if (m._dt instanceof Date && !isNaN(m._dt)) { try { fechaStr = m._dt.toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' }); } catch (e) { fechaStr = m._dt.toString(); } }
    return (<>{sentence}{fechaStr && <div style={styles.subtleText}>{fechaStr}</div>}</>);
}

// --- MovementCard (Usa buildSentence actualizado) ---
function MovementCard({ movimiento, memberMap }) {
    const actionType = getActionType(movimiento.accion);
    const cardStyle = { ...styles.card, ...(actionCardStyles[actionType] || styles.cardOtro) };
    return ( <div style={cardStyle}> {buildSentence(movimiento, memberMap)} </div> );
}

// --- Componente Principal ---
export default function Historial() {
    // Estados
    const [movimientos, setMovimientos] = useState([]);
    const [memberMap, setMemberMap] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [token, setToken] = useState(localStorage.getItem("token"));
    const [desde, setDesde] = useState("");
    const [hasta, setHasta] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [fPrestada, setFPrestada] = useState(false);
    const [fDevuelta, setFDevuelta] = useState(false);
    const [fRetrasada, setFRetrasada] = useState(false);
    const [fModificada, setFModificada] = useState(false);
    const [days, setDays] = useState(null);
    const [orderAsc, setOrderAsc] = useState(false);
    const [page, setPage] = useState(1);
    const [searchSuggestions, setSearchSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);
    const searchInputRef = useRef(null);

    const lastDaysOptions = [ { label: "Últimos X días", value: null }, { label: "Hoy", value: 0 }, { label: "Ayer", value: 1 }, { label: "3 días", value: 3 }, { label: "7 días", value: 7 }, { label: "15 días", value: 15 }, { label: "30 días", value: 30 }, ];

    // --- Carga Inicial ---
    useEffect(() => {
        (async () => {
            setLoading(true); setError(null);
            const currentToken = localStorage.getItem("token"); setToken(currentToken);
            if (!currentToken) { setError("No autenticado."); setLoading(false); return; }
            let data = [];
            try { const resHistorial = await fetch(`${BASE_URL}/bolsas/historial`, { headers: { Authorization: `Bearer ${currentToken}` } }); if (resHistorial.ok) { data = await resHistorial.json(); if (!Array.isArray(data)) data = []; } else if (resHistorial.status !== 404) { throw new Error(`Error ${resHistorial.status} historial`); } } catch (histError) { console.warn("/bolsas/historial error:", histError.message); }
            if (data.length === 0) { console.log("Fallback: Obteniendo historial desde /bolsas"); try { const resBolsas = await fetch(`${BASE_URL}/bolsas`, { headers: { Authorization: `Bearer ${currentToken}` } }); if (!resBolsas.ok) throw new Error(`Error ${resBolsas.status} bolsas`); const bolsas = await resBolsas.json(); bolsas.forEach((b) => { (b.historial || []).forEach((h, index) => { const orig = h.accion || ""; let accionText=orig, usuarioText=""; const porIndex = orig.lastIndexOf(" por "); if(porIndex>-1){accionText=orig.substring(0,porIndex).trim(); usuarioText=orig.substring(porIndex+5).trim();}else{accionText=orig.trim();} const fechaHistorial=h.fecha||new Date(0).toISOString(); data.push({...h, _internalId:`${b.id||'bolsa'}-${fechaHistorial}-${index}`, cliente:b.cliente_asignado, bolsa_id: b.id, accion:accionText, usuario:usuarioText||'Desconocido', fecha:fechaHistorial }); }); }); } catch (bolsaError) { console.error("ERROR Fallback:", bolsaError); setError(bolsaError.message || "Error cargando historial"); setLoading(false); return; } }
            const normalized = data.map((m) => { let dt = new Date(0); try { const pd = new Date(m.fecha); if (!isNaN(pd.getTime())) dt = pd; } catch (e) {} return { ...m, _dt: dt, _key: m.id || m._internalId || `hist-${Math.random()}` }; });
            setMovimientos(normalized);
            const uniqueClientCodes = Array.from(new Set(normalized.map(m => m.cliente).filter(c => c && String(c).trim()))); const map = {};
            if (uniqueClientCodes.length > 0) { console.log(`MAP: Fetching ${uniqueClientCodes.length} codes...`); await Promise.all(uniqueClientCodes.map(async(code) => { const tc=String(code).trim(); if(map[tc]||!tc)return; try { const ec=encodeURIComponent(tc); const mr=await fetch(`${BASE_URL}/miembros?q=${ec}`,{headers:{Authorization:`Bearer ${currentToken}`}}); if(mr.ok){ const md=await mr.json(); const m=md.find(mem => mem.ClubMemberCode && String(mem.ClubMemberCode).trim().toUpperCase() === tc.toUpperCase()); if(m){map[tc]=formatName(m.FirstName,m.LastName,m.ClubMemberCode);}else{map[tc]=tc;}}else{map[tc]=tc;}}catch(fe){map[tc]=tc;}})); console.log("MAP Final:", map); }
            setMemberMap(map);
        })().catch(e => { console.error("ERROR fetchInitialData:", e); setError(e.message || "Error cargando historial"); }).finally(() => { setLoading(false); });
    }, []); // Vacío para correr solo al montar

    // --- Efecto Autocompletado (SIN CAMBIOS) ---
    useEffect(() => {
        if (!searchTerm || searchTerm.length < 1 || !token) { setSearchSuggestions([]); setShowSuggestions(false); return; } setLoadingSuggestions(true);
        const debounceTimeout = setTimeout(async () => { try { const eq=encodeURIComponent(searchTerm); const res=await fetch(`${BASE_URL}/miembros?q=${eq}`,{headers:{Authorization:`Bearer ${token}`}}); if(res.ok){const data=await res.json(); const suggestions=data.map(m=>({value:`${m.FirstName||''} ${m.LastName||''} (${m.ClubMemberCode})`.replace(/\(\)/,'').trim(), display:`${m.FirstName||''} ${m.LastName||''}`.trim(), code:m.ClubMemberCode})).filter(s=>s.value); setSearchSuggestions(suggestions.slice(0,8)); setShowSuggestions(suggestions.length>0);}else{setSearchSuggestions([]);setShowSuggestions(false);}}catch(err){setSearchSuggestions([]);setShowSuggestions(false); console.error("Suggest Error:", err);}finally{setLoadingSuggestions(false);}}, 350);
        return () => clearTimeout(debounceTimeout);
    }, [searchTerm, token]);

    // --- Filtrado y Ordenación - ¡FILTRO SEARCHTERM CORREGIDO! ---
    const filtrados = useMemo(() => {
        let dateFiltered = movimientos;
        // Filtro Fecha (SIN CAMBIOS)
        if (days != null) { const iH=new Date(); iH.setHours(0,0,0,0); const iM=new Date(iH); iM.setDate(iH.getDate()+1); if(days===0){dateFiltered=movimientos.filter(m=>m._dt>=iH&&m._dt<iM)}else if(days===1){const iA=new Date(iH); iA.setDate(iH.getDate()-1); dateFiltered=movimientos.filter(m=>m._dt>=iA&&m._dt<iH)}else{const iP=new Date(iH); iP.setDate(iH.getDate()-(days-1)); dateFiltered=movimientos.filter(m=>m._dt>=iP&&m._dt<iM)} }
        else if (desde || hasta) { const sD=desde?new Date(desde+"T00:00:00"):null; const eD=hasta?new Date(hasta+"T23:59:59"):null; dateFiltered=movimientos.filter(m=>{if(!(m._dt instanceof Date&&!isNaN(m._dt)))return false;if(sD&&m._dt<sD)return false;if(eD&&m._dt>eD)return false;return true;}) }

        return dateFiltered
            .filter(m => { // Filtro Checkboxes (SIN CAMBIOS)
                const noneChecked = !fPrestada && !fDevuelta && !fRetrasada && !fModificada; if (noneChecked) return true;
                const actionType = getActionType(m.accion);
                if (fPrestada && actionType === ACTION_TYPES.PRESTADA) return true; if (fDevuelta && actionType === ACTION_TYPES.DEVUELTA) return true;
                if (fRetrasada && actionType === ACTION_TYPES.RETRASADA) return true; if (fModificada && actionType === ACTION_TYPES.MODIFICADA) return true;
                return false;
            })
            // --- FILTRO SEARCHTERM CORREGIDO ---
            .filter(m => {
                if (!searchTerm) return true;
                const lowerSearch = searchTerm.toLowerCase().trim();
                if (!lowerSearch) return true;

                const usuario = (m.usuario || "").toLowerCase();
                const clienteCode = m.cliente ? String(m.cliente).trim().toLowerCase() : "";
                const clienteName = clienteCode && memberMap[String(m.cliente).trim()] ? memberMap[String(m.cliente).trim()].toLowerCase() : clienteCode;
                const accion = m.accion ? String(m.accion).toLowerCase() : "";
                const bolsaId = m.bolsa_id ? String(m.bolsa_id).toLowerCase() : (m._internalId ? String(m._internalId).split('-')[0].toLowerCase() : "");

                return (
                    usuario.includes(lowerSearch) ||
                    clienteCode.includes(lowerSearch) ||
                    clienteName.includes(lowerSearch) ||
                    accion.includes(lowerSearch) ||
                    (bolsaId && bolsaId.includes(lowerSearch))
                );
            })
            // --- FIN FILTRO SEARCHTERM ---
            .sort((a, b) => { // Ordenación (SIN CAMBIOS)
                const dtA = a._dt instanceof Date && !isNaN(a._dt) ? a._dt.getTime() : 0; const dtB = b._dt instanceof Date && !isNaN(b._dt) ? b._dt.getTime() : 0;
                if (dtA === dtB) return 0; return orderAsc ? dtA - dtB : dtB - dtA;
            });
    }, [movimientos, fPrestada, fDevuelta, fRetrasada, fModificada, searchTerm, desde, hasta, days, orderAsc, memberMap]); // Dependencias correctas

    // Paginación (SIN CAMBIOS)
    const itemsToShow = filtrados.slice(0, page * PAGE_SIZE);
    const totalFilteredCount = filtrados.length;
    const canLoadMore = itemsToShow.length < totalFilteredCount;
    const handleLoadMore = () => { if (canLoadMore) { setPage(prev => prev + 1); } };

    // Limpiar Filtros (SIN CAMBIOS)
    const handleClearFilters = useCallback(() => { setDesde(""); setHasta(""); setSearchTerm(""); setFPrestada(false); setFDevuelta(false); setFRetrasada(false); setFModificada(false); setDays(null); setOrderAsc(false); setPage(1); setSearchSuggestions([]); setShowSuggestions(false); }, []);

    // Exclusión mutua filtros fecha (SIN CAMBIOS)
    useEffect(() => { if (days != null) { setDesde(""); setHasta(""); } }, [days]);
    useEffect(() => { if (desde || hasta) { setDays(null); } }, [desde, hasta]);

    // Selección de sugerencia (SIN CAMBIOS)
    const handleSelectSuggestion = (suggestionValue) => { setSearchTerm(suggestionValue); setShowSuggestions(false); setPage(1); };

    // Estilos dinámicos (SIN CAMBIOS)
    const dateInputStyle = { ...styles.input, ...(loading || days != null ? styles.inputDisabled : {}) };
    const daysDropdownStyle = { ...styles.dropdown, ...(loading ? styles.dropdownDisabled : {}) };
    const searchInputStyle = { ...styles.input, ...(loading ? styles.inputDisabled : {}) };
    const buttonClearStyle = { ...styles.button, ...styles.btnClear, ...(loading ? styles.buttonDisabled : {}) };
    const buttonMoreStyle = { ...styles.button, ...styles.btnMore, ...(loading || !canLoadMore ? styles.buttonDisabled : {}) };

    /* ---------- Renderizado (SIN CAMBIOS) ---------- */
    return (
        <Screen>
            <div style={styles.wrapper}>
                <h3 style={styles.title}>Historial de movimientos</h3>
                <div style={styles.filterSection}>
                     {/* ... JSX Filtros ... */}
                     <div style={styles.flexRow}> <div style={styles.autocompleteContainer}> <input ref={searchInputRef} style={searchInputStyle} placeholder="Buscar cliente, código, usuario..." value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setPage(1); if (!e.target.value) setShowSuggestions(false); }} onFocus={() => searchTerm && searchSuggestions.length > 0 && setShowSuggestions(true)} onBlur={() => setTimeout(() => setShowSuggestions(false), 250)} disabled={loading} autoComplete="off" /> {loadingSuggestions && <span style={{ position: 'absolute', right: 10, top: 10, fontSize: 12, color: '#888' }}>...</span>} {showSuggestions && ( <div style={styles.autocompleteDropdown}> {searchSuggestions.length > 0 ? ( searchSuggestions.map((suggestion, index) => ( <div key={suggestion.code || index} style={{...styles.autocompleteItem, ...(index === searchSuggestions.length - 1 ? styles.autocompleteItemLast : {})}} onMouseDown={(e) => e.preventDefault()} onClick={() => handleSelectSuggestion(suggestion.value)} title={`Seleccionar: ${suggestion.value}`}> {suggestion.display} ({suggestion.code}) </div> )) ) : ( !loadingSuggestions && <div style={{...styles.autocompleteItem, color: '#888', cursor: 'default'}}>No hay sugerencias</div> )} </div> )} </div> <select style={daysDropdownStyle} value={days ?? ""} onChange={e => { const value = e.target.value; setDays(value === "" ? null : Number(value)); setPage(1); }} disabled={loading}> {lastDaysOptions.map(o => ( <option key={o.label} value={o.value ?? ""}>{o.label}</option> ))} </select> </div>
                     <div style={styles.flexRow}> <input type="date" style={dateInputStyle} value={desde} onChange={e => { setDesde(e.target.value); setPage(1); }} disabled={loading || days != null} title={days != null ? "Deshabilitado" : "Fecha Desde"} /> <input type="date" style={dateInputStyle} value={hasta} onChange={e => { setHasta(e.target.value); setPage(1); }} disabled={loading || days != null} title={days != null ? "Deshabilitado" : "Fecha Hasta"} /> </div>
                     <div style={styles.checkboxContainer}> {[ { lbl: "Prestada", chk: fPrestada, set: setFPrestada }, { lbl: "Devuelta", chk: fDevuelta, set: setFDevuelta }, { lbl: "Retrasada", chk: fRetrasada, set: setFRetrasada }, { lbl: "Modificada", chk: fModificada, set: setFModificada } ].map(c => ( <label key={c.lbl} style={styles.label}> <input type="checkbox" checked={c.chk} onChange={e => {c.set(e.target.checked); setPage(1);}} disabled={loading}/> {c.lbl} </label> ))} </div>
                     <div style={{...styles.flexRow, justifyContent: 'space-between', alignItems: 'center', marginTop: '16px'}}> <label style={{ ...styles.label }}> <input type="checkbox" checked={orderAsc} onChange={e => { setOrderAsc(e.target.checked); setPage(1); }} disabled={loading}/> Orden Ascendente </label> <button style={buttonClearStyle} onClick={handleClearFilters} disabled={loading}> Limpiar Filtros </button> </div>
                </div>
                {/* --- Resultados --- */}
                {loading && <div style={styles.loadingIndicator}>Cargando historial...</div>}
                {error && <div style={styles.errorIndicator}>{error}</div>}
                {!loading && !error && itemsToShow.length === 0 && ( <p style={styles.noResults}>No se encontraron movimientos.</p> )}
                {!loading && !error && itemsToShow.map(movimiento => ( <MovementCard key={movimiento._key} movimiento={movimiento} memberMap={memberMap}/> ))}
                {!loading && canLoadMore && ( <button style={buttonMoreStyle} onClick={handleLoadMore} disabled={loading}> Ver más ({totalFilteredCount - itemsToShow.length} restantes) </button> )}
            </div>
        </Screen>
    );
}