// src/components/QRManagementModal.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import QRCode from 'qrcode'; // <--- Importar librería para generar QR

// Asume BASE_URL, componentes, etc.
import { API_URL } from '../utils/api'

const BASE_URL = API_URL;
// Ya no se necesita DEBOUNCE_DELAY

// --- Mock/Placeholder ---
const ClubStatusMeanings = { /* ... */ };
function getStatusColor(statusCode) { /* ... */ return '#ccc'; }
function InputFieldBuscarCliente({ value, onChange, disabled, placeholder }) { const style = { width: "100%", height: "40px", padding: "0px 8px", border: "1px solid #cbd5e1", boxSizing: "border-box", borderRadius: "6px", backgroundColor: disabled ? "#e9ecef" : "#ffffff", color: value ? "#333" : "#94a3b8", fontSize: "14px", fontFamily: "Poppins, sans-serif", lineHeight: "40px", outline: "none", marginBottom: "8px", cursor: disabled ? "not-allowed" : "text" }; return <input style={style} placeholder={placeholder || "Buscar..."} value={value} onChange={onChange} disabled={disabled} />; }
// --- Fin Mock/Placeholder ---


// --- Estilos (Incluyendo los necesarios para descarga) ---
const modalOverlayStyles = { position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", backgroundColor: "rgba(0,0,0,0.6)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 10000, fontFamily: "'Poppins', sans-serif" };
const modalContentStyles = { width: "95%", maxWidth: "600px", maxHeight: "90vh", backgroundColor: "#ffffff", borderRadius: "8px", padding: "20px", boxSizing: "border-box", display: "flex", flexDirection: "column", gap: "16px", overflow: "hidden" };
const modalHeaderStyles = { fontSize: "20px", fontWeight: "700", color: "#333", margin: 0, paddingBottom: '10px', borderBottom: '1px solid #eee' };
const filterSectionStyles = { display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', paddingBottom: '16px', borderBottom: '1px solid #eee' };
const inputGroupStyle = { flexGrow: 1, minWidth: '150px' };
const labelStyle = { fontSize: '12px', fontWeight: 600, color: '#555', display: 'block', marginBottom: '4px' };
const inputStyle = { width: '100%', height: '36px', padding: '0 8px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box', fontSize: '14px' };
const selectStyle = { ...inputStyle, cursor: 'pointer' };
const buttonStyleBase = { height: "36px", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: 600, fontFamily: "'Poppins', sans-serif", padding: "0 14px", fontSize: '14px', transition: 'background-color 0.2s ease, opacity 0.2s ease' };
const buttonPrimary = { ...buttonStyleBase, backgroundColor: "#007bff", color: "#fff" };
const buttonSecondary = { ...buttonStyleBase, backgroundColor: "#6c757d", color: "#fff" };
const buttonDanger = { ...buttonStyleBase, backgroundColor: "#dc3545", color: "#fff" };
const buttonDownload = { ...buttonStyleBase, backgroundColor: "#17a2b8", color: "#fff" }; // Estilo Descarga
const buttonDisabled = { opacity: 0.65, cursor: 'not-allowed' };
const qrListContainerStyles = { flexGrow: 1, overflowY: 'auto', border: '1px solid #eee', borderRadius: '4px', padding: '8px', backgroundColor: '#f8f9fa' };
const qrItemStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', padding: '10px', borderBottom: '1px solid #ddd', backgroundColor: '#fff', borderRadius: '4px', marginBottom: '8px' };
const qrItemActionsStyle = { display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }; // Contenedor botones acción
const qrInfoStyle = { flexGrow: 1, fontSize: '14px', lineHeight: '1.4', minWidth: 0 };
const qrCodeStyle = { fontWeight: 700, color: '#333', wordBreak: 'break-all' };
const qrStatusStyle = (usado) => ({ fontWeight: 600, color: usado ? '#dc3545' : '#28a745' });
const qrAssigneeStyle = { fontSize: '12px', color: '#555', marginTop: '4px', fontStyle: 'italic' };
const noResultsStyle = { textAlign: 'center', color: '#777', padding: '20px' };
const loadingStyle = { ...noResultsStyle, color: '#007bff' };
const errorStyle = { color: 'red', fontSize: '13px', marginTop: '5px', fontWeight: 'bold' };
const addSectionStyles = { display: 'flex', gap: '10px', alignItems: 'flex-end', paddingBottom: '16px', borderBottom: '1px solid #eee' };
const autocompleteDropdown = { position: 'absolute', width: 'calc(100% - 2px)', top: '100%', maxHeight: '150px', overflowY: 'auto', backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '0 0 6px 6px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', zIndex: 101, marginTop: '-1px', boxSizing: 'border-box' };
const autocompleteItem = { padding: '8px 10px', cursor: 'pointer', fontSize: '13px', borderBottom: '1px solid #eee', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' };
const autocompleteHint = { padding: '6px 10px', fontSize: '11px', color: '#666', fontStyle: 'italic', textAlign: 'center', borderTop: '1px solid #eee' };
// --- Fin Estilos ---


// --- Componente Modal ---
function QRManagementModal({ isOpen, onClose }) {
    const [qrCodes, setQrCodes] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [memberSearchTerm, setMemberSearchTerm] = useState("");
    const [memberOptions, setMemberOptions] = useState([]);
    const [selectedMemberCode, setSelectedMemberCode] = useState(null);
    const [newQrCodeInput, setNewQrCodeInput] = useState("");
    const [isAdding, setIsAdding] = useState(false);
    const [addError, setAddError] = useState(null);
    const [deletingStates, setDeletingStates] = useState({});

    const token = useRef(localStorage.getItem("token"));

    // --- Fetch QR Codes (depende de searchTerm, pero sólo se llama manualmente o por otros filtros) ---
    const fetchQrCodes = useCallback(async () => {
        if (!token.current) { setError("No autenticado."); return; }
        setIsLoading(true); setError(null);
        // Considerar NO limpiar qrCodes aquí para evitar parpadeo si la búsqueda manual falla
        // setQrCodes([]);

        const params = new URLSearchParams();
        if (searchTerm) params.append("search", searchTerm); // Usa el valor actual de searchTerm
        if (statusFilter !== 'all') params.append("status", statusFilter);
        if (selectedMemberCode) params.append("clienteAsignado", selectedMemberCode);
        params.append("limit", "500");

        const requestUrl = `${BASE_URL}/qrcodes?${params.toString()}`;
        console.log("Fetching:", requestUrl);

        try {
            const response = await fetch(requestUrl, { headers: { Authorization: `Bearer ${token.current}` } });
             if (!response.ok) { let eDetail = `Error ${response.status}`; try { const d = await response.json(); eDetail = d.detail || eDetail } catch(e){} throw new Error(eDetail); }
            const data = await response.json(); setQrCodes(data || []);
        } catch (err) { console.error("Error fetching:", err); setError(err.message); setQrCodes([]); }
        finally { setIsLoading(false); }
    }, [searchTerm, statusFilter, selectedMemberCode]); // Depende de searchTerm, pero no se llama automáticamente por él


    // useEffect Principal: Se llama al abrir y al cambiar statusFilter o selectedMemberCode.
    // YA NO depende de fetchQrCodes (que dependía de searchTerm), rompiendo el ciclo del foco.
    useEffect(() => {
        if (isOpen) {
            // Llama fetch solo cuando cambian filtros estables o al abrir
            fetchQrCodes();
        } else {
            // Resetear estado al cerrar
            setQrCodes([]); setIsLoading(false); setError(null);
            setSearchTerm(""); setStatusFilter("all"); setMemberSearchTerm("");
            setMemberOptions([]); setSelectedMemberCode(null); setNewQrCodeInput("");
            setIsAdding(false); setAddError(null); setDeletingStates({});
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, statusFilter, selectedMemberCode]); // Quitamos fetchQrCodes/searchTerm de las dependencias


    // --- Búsqueda Autocomplete Miembros (Sin cambios) ---
    useEffect(() => {
        if (selectedMemberCode && memberSearchTerm.includes(`(${selectedMemberCode})`)) { setMemberOptions([]); return; }
        if (!memberSearchTerm && selectedMemberCode) { setSelectedMemberCode(null); /* El useEffect principal se disparará */ }
        if (!memberSearchTerm || !token.current) { setMemberOptions([]); return; }
        const timeout = setTimeout(async () => {
            try {
                const query = encodeURIComponent(memberSearchTerm.trim().toUpperCase()); if (!query) return;
                const res = await fetch(`${BASE_URL}/miembros?q=${query}`, { headers: { Authorization: `Bearer ${token.current}` } });
                if (!res.ok) throw new Error("Error buscando miembros");
                const data = await res.json(); setMemberOptions(data || []);
            } catch (err) { setMemberOptions([]); console.error("Error buscando miembros:", err); }
        }, 400);
        return () => clearTimeout(timeout);
    }, [memberSearchTerm, selectedMemberCode]);

    const handleSelectMember = (member) => {
        setSelectedMemberCode(member.ClubMemberCode);
        setMemberSearchTerm(`${member.FirstName || ''} ${member.LastName || ''} (${member.ClubMemberCode})`);
        setMemberOptions([]);
        // El useEffect principal llamará a fetchQrCodes
    };

    const handleClearMemberFilter = () => {
         setSelectedMemberCode(null);
         setMemberSearchTerm("");
         setMemberOptions([]);
         // El useEffect principal llamará a fetchQrCodes
    };

    // --- Añadir QR Code (Sin cambios) ---
    const handleAddQrCode = async () => {
        const codigo = newQrCodeInput.trim(); if (!codigo || !token.current) return;
        setIsAdding(true); setAddError(null); setError(null);
        try {
            const response = await fetch(`${BASE_URL}/admin/qrcodes`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token.current}`, }, body: JSON.stringify({ codigos: [codigo] }), });
             if (!response.ok) { let d = `Error ${response.status}`; try { d = (await response.json()).detail || d; } catch(e){} throw new Error(d); }
            setNewQrCodeInput("");
            await fetchQrCodes(); // Recarga explícita
        } catch (err) { console.error("Error adding:", err); setAddError(err.message); }
        finally { setIsAdding(false); }
    };

    // --- Eliminar QR Code (Sin cambios) ---
    const handleDeleteQrCode = async (codigo) => {
        if (!codigo || !token.current || deletingStates[codigo]) return;
        if (!window.confirm(`¿Seguro de eliminar QR "${codigo}"?`)) return;
        setDeletingStates(prev => ({ ...prev, [codigo]: true })); setError(null); setAddError(null);
        try {
            const response = await fetch(`${BASE_URL}/admin/qrcodes/${encodeURIComponent(codigo)}`, { method: "DELETE", headers: { Authorization: `Bearer ${token.current}` }, });
             if (!response.ok) { let d = `Error ${response.status}`; try { d = (await response.json()).detail || d; } catch(e){} throw new Error(d); }
            await fetchQrCodes(); // Recarga explícita
        } catch (err) { console.error(`Error deleting ${codigo}:`, err); setError(err.message); }
        finally { setDeletingStates(prev => { const n = { ...prev }; delete n[codigo]; return n; }); }
    };

    // --- Descargar QR (Reintegrado) ---
    const handleDownloadQrCode = async (qrValue) => {
        const codeToDownload = String(qrValue).trim(); if (!codeToDownload) { alert("No hay código QR válido."); return; }
        try {
            const dataUrl = await QRCode.toDataURL(codeToDownload, { errorCorrectionLevel: 'H', type: 'image/png', quality: 0.92, margin: 1, width: 300 });
            const link = document.createElement('a'); link.href = dataUrl; link.download = `QR_${codeToDownload}.png`;
            document.body.appendChild(link); link.click(); document.body.removeChild(link);
        } catch (err) { console.error('Error generando QR:', err); alert(`No se pudo generar QR para "${codeToDownload}".\n${err.message}`); }
    };

    // --- Render ---
    if (!isOpen) return null;

    const qrCodesToDisplay = qrCodes;

    return (
        <div style={modalOverlayStyles} onClick={onClose}>
            <div style={modalContentStyles} onClick={(e) => e.stopPropagation()}>
                <h3 style={modalHeaderStyles}>Gestionar Códigos QR</h3>

                {/* Sección de Filtros */}
                <div style={filterSectionStyles}>
                    {/* Input searchTerm (Sin cambios en el render) */}
                    <div style={inputGroupStyle}>
                        <label htmlFor="qrSearch" style={labelStyle}>Buscar Código</label>
                        <input id="qrSearch" type="text" style={inputStyle} placeholder="Buscar por código..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} disabled={isLoading} />
                    </div>
                    {/* Select statusFilter (Sin cambios en el render) */}
                    <div style={inputGroupStyle}>
                        <label htmlFor="qrStatus" style={labelStyle}>Filtrar Estado</label>
                        <select id="qrStatus" style={selectStyle} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} disabled={isLoading}> <option value="all">Todos</option> <option value="usado">Usado</option> <option value="no_usado">No Usado</option> </select>
                    </div>
                    {/* Input memberSearchTerm y Autocomplete (Sin cambios en el render) */}
                    <div style={{ ...inputGroupStyle, position: 'relative' }}>
                        <label htmlFor="qrMemberSearch" style={labelStyle}>Filtrar por Miembro</label>
                        <InputFieldBuscarCliente placeholder="Buscar miembro..." value={memberSearchTerm} onChange={(e) => setMemberSearchTerm(e.target.value)} disabled={isLoading} />
                        {!isLoading && memberSearchTerm && memberOptions.length > 0 && ( <div style={autocompleteDropdown}> {memberOptions.slice(0, 10).map((m) => ( <div key={m.ClubMemberCode} style={autocompleteItem} onClick={() => handleSelectMember(m)} onMouseEnter={(e)=>e.currentTarget.style.backgroundColor = '#f0f0f0'} onMouseLeave={(e)=>e.currentTarget.style.backgroundColor = '#fff'} >{m.FirstName || ''} {m.LastName || ''} ({m.ClubMemberCode})</div> ))} {memberOptions.length > 10 && <div style={autocompleteHint}>...más resultados</div>} </div> )}
                        {selectedMemberCode && ( <button onClick={handleClearMemberFilter} style={{ position: 'absolute', top: '25px', right: '5px', background: 'none', border: 'none', fontSize: '16px', cursor: 'pointer', color: '#888' }} title="Limpiar filtro" disabled={isLoading}>×</button> )}
                    </div>
                     {/* Botón Aplicar Filtros (Llama a fetchQrCodes manualmente) */}
                     <button style={isLoading ? {...buttonSecondary, ...buttonDisabled} : buttonSecondary} onClick={fetchQrCodes} disabled={isLoading}> {isLoading ? 'Buscando...' : 'Aplicar Filtros'} </button>
                </div>

                 {/* Sección Añadir Nuevo (Con botón Descargar) */}
                <div style={addSectionStyles}>
                     <div style={{ flexGrow: 1 }}>
                         <label htmlFor="newQrCode" style={labelStyle}>Nuevo Código QR</label>
                         <input id="newQrCode" type="text" style={inputStyle} placeholder="Ingresa el nuevo código" value={newQrCodeInput} onChange={(e) => setNewQrCodeInput(e.target.value)} disabled={isAdding || isLoading} />
                         {addError && <div style={errorStyle}>{addError}</div>}
                     </div>
                     <button style={(!newQrCodeInput.trim() || isLoading || isAdding) ? {...buttonDownload, ...buttonDisabled} : buttonDownload} onClick={() => handleDownloadQrCode(newQrCodeInput)} disabled={!newQrCodeInput.trim() || isLoading || isAdding} title="Generar y Descargar QR" > Descargar QR </button>
                     <button style={(isAdding || isLoading || !newQrCodeInput.trim()) ? {...buttonPrimary, ...buttonDisabled} : buttonPrimary} onClick={handleAddQrCode} disabled={isAdding || isLoading || !newQrCodeInput.trim()}> {isAdding ? 'Añadiendo...' : 'Añadir a BD'} </button>
                </div>

                {/* Mensaje de Error General (Sin cambios) */}
                {error && !isLoading && <div style={{...errorStyle, textAlign: 'center', padding: '10px', backgroundColor: '#f8d7da', borderRadius: '4px'}}>{error}</div>}

                {/* Lista de Códigos QR (Con botón Descargar) */}
                <div style={qrListContainerStyles}>
                    {isLoading && qrCodesToDisplay.length === 0 && <div style={loadingStyle}>Cargando códigos...</div>}
                    {!isLoading && qrCodesToDisplay.length === 0 && !error && ( <div style={noResultsStyle}>No se encontraron códigos QR.</div> )}
                    {qrCodesToDisplay.length > 0 && (
                        qrCodesToDisplay.map(qr => {
                            const isDeleting = deletingStates[qr.codigo] || false;
                            const canDelete = !qr.usado && !isDeleting;
                            return (
                                <div key={qr.codigo} style={qrItemStyle}>
                                    <div style={qrInfoStyle}>
                                        <div style={qrCodeStyle}>{qr.codigo}</div>
                                        <div style={qrStatusStyle(qr.usado)}> {qr.usado ? 'Usado' : 'No Usado'} </div>
                                        {qr.usado && qr.cliente_asignado && ( <div style={qrAssigneeStyle}>Asignado a: {qr.cliente_asignado} (Bolsa: {qr.bolsa_id})</div> )}
                                        {qr.usado && !qr.cliente_asignado && qr.bolsa_id && ( <div style={qrAssigneeStyle}>Asignado a bolsa: {qr.bolsa_id} (sin cliente)</div> )}
                                    </div>
                                    <div style={qrItemActionsStyle}>
                                        <button style={isLoading ? {...buttonDownload, ...buttonDisabled} : buttonDownload} onClick={() => handleDownloadQrCode(qr.codigo)} disabled={isLoading || isDeleting} title="Descargar Imagen QR" > Descargar </button>
                                        <button style={canDelete ? buttonDanger : {...buttonDanger, ...buttonDisabled}} onClick={() => handleDeleteQrCode(qr.codigo)} disabled={!canDelete || isLoading} title={qr.usado ? "No eliminar (en uso)" : "Eliminar QR"}> {isDeleting ? 'Elim...' : 'Eliminar'} </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                    {isLoading && qrCodesToDisplay.length > 0 && <div style={{...loadingStyle, fontSize: '12px', padding: '5px'}}>Actualizando...</div>}
                </div>

                {/* Botón de Cerrar (Sin cambios) */}
                <div style={{ textAlign: 'right', marginTop: '10px' }}> <button style={buttonSecondary} onClick={onClose}> Cerrar </button> </div>
            </div>
        </div>
    );
}

export default QRManagementModal;