// src/components/EditarAlmacen.jsx

import React, { useEffect, useState, useCallback, useRef } from "react"; // <--- Añadido useRef
import { useLocation, useNavigate } from "react-router-dom";
import styles from './EditarAlmacen.module.css';
import Screen from "../components/Screen"; // <--- Re-asegurar importación

import { API_URL } from '../utils/api'

const BASE_URL = API_URL;

// --- Componente Recursivo para Niveles (Movido fuera y con estilos aplicados) ---
function NivelItem({ nivel, indent = 0, onUpdateName, onAddSubnivel, onRemoveSubnivel, isSaving }) {
    const plusIconPath = "M12 4.75a.75.75 0 0 1 .75.75v6.5h6.5a.75.75 0 0 1 0 1.5h-6.5v6.5a.75.75 0 0 1-1.5 0v-6.5h-6.5a.75.75 0 0 1 0-1.5h6.5v-6.5a.75.75 0 0 1 .75-.75Z";
    const minusIconPath = "M5.75 12a.75.75 0 0 1 .75-.75h11a.75.75 0 0 1 0 1.5h-11a.75.75 0 0 1-.75-.75Z";

    return (
      <div
        className={styles.nivelWrapper}
        style={{ paddingLeft: `${10 + indent * 20}px` }}
        data-indent={indent + 1}
      >
        <div className={styles.nivelContent}>
          <input
            className={styles.nivelInput}
            value={nivel.nombre}
            onChange={(e) => onUpdateName(nivel.id, e.target.value)}
            placeholder="Nombre subnivel"
            disabled={isSaving}
          />
          <button
             className={`${styles.nivelIconButton} ${styles.add}`}
             onClick={() => onAddSubnivel(nivel.id)}
             disabled={isSaving}
             title="Añadir subnivel aquí"
          >
             <svg viewBox="0 0 24 24" aria-hidden="true"><path d={plusIconPath}></path></svg>
          </button>
          <button
             className={`${styles.nivelIconButton} ${styles.remove}`}
             onClick={() => onRemoveSubnivel(nivel.id, nivel.nombre)}
             disabled={isSaving}
             title="Eliminar este subnivel"
          >
             <svg viewBox="0 0 24 24" aria-hidden="true"><path d={minusIconPath}></path></svg>
          </button>
        </div>
        {Array.isArray(nivel.subniveles) && nivel.subniveles.map((sub) => (
          <NivelItem
            key={sub.id}
            nivel={sub}
            indent={indent + 1}
            onUpdateName={onUpdateName}
            onAddSubnivel={onAddSubnivel}
            onRemoveSubnivel={onRemoveSubnivel}
            isSaving={isSaving}
          />
        ))}
      </div>
    );
}


export default function EditarAlmacen() {
  const navigate = useNavigate();
  const location = useLocation();
  const almacenID = location.state?.almacenID;

  // --- Estados (Restaurados y completos) ---
  const [almacenName, setAlmacenName] = useState("");
  const [originalName, setOriginalName] = useState(""); // <--- Para comparar si hubo cambios
  const [estructura, setEstructura] = useState([]);
  const [originalEstructura, setOriginalEstructura] = useState([]);
  const [loading, setLoading] = useState(true); // Carga inicial
  const [isSaving, setIsSaving] = useState(false); // Guardado/Eliminación
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState({ message: null, type: null });
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState("");
  const [confirmAction, setConfirmAction] = useState(() => {});
  const [token] = useState(localStorage.getItem("token"));

  // --- Limpiar Feedback (Función Helper) ---
  const clearFeedback = useCallback(() => setFeedback({ message: null, type: null }), []);
  const showFeedback = useCallback((message, type = 'info') => {
      setFeedback({ message, type });
      // Autocierre del mensaje después de 3.5 segundos
      const timer = setTimeout(clearFeedback, 3500);
      return () => clearTimeout(timer); // Limpieza si el componente se desmonta
  }, []);


  // --- ***** RESTAURADO: Cargar datos del almacén al montar ***** ---
  const fetchAlmacen = useCallback(async (id) => {
    if (!id) {
      setError("No se proporcionó ID de almacén.");
      setLoading(false);
      return;
    }
    if (!token) { // Verificar token antes de hacer fetch
        setError("No autenticado. No se puede cargar el almacén.");
        setLoading(false);
        return;
    }
    setLoading(true); setError(null); clearFeedback();
    try {
      const res = await fetch(`${BASE_URL}/auditoria/${id}`, {
          headers: { Authorization: `Bearer ${token}` } // Enviar token
      });
      if (res.status === 404) throw new Error("Almacén no encontrado.");
      if (res.status === 401) throw new Error("No autorizado para ver este almacén.");
      if (!res.ok) throw new Error(`Error al obtener almacén (${res.status})`);

      const data = await res.json();
      const nombreCargado = data.nombre || "";
      const estructuraCargada = Array.isArray(data.estructura) ? data.estructura : [];

      setAlmacenName(nombreCargado);
      setOriginalName(nombreCargado); // Guardar nombre original
      setEstructura(structuredClone(estructuraCargada));
      setOriginalEstructura(structuredClone(estructuraCargada)); // Guardar copia original

    } catch (error) {
      console.error("Error fetchAlmacen:", error);
      setError(error.message || "No se pudo cargar el almacén");
      setAlmacenName(""); setEstructura([]); setOriginalEstructura([]);
    } finally {
      setLoading(false); // <<--- ASEGURARSE QUE SIEMPRE SE EJECUTE
    }
  }, [token]); // Depender del token

  useEffect(() => {
    fetchAlmacen(almacenID);
  }, [almacenID, fetchAlmacen]); // Ejecutar si cambia el ID o la función fetch
  // --- ***** FIN RESTAURADO ***** ---


  // --- Guardar Cambios (con estado de carga, feedback y token) ---
  const handleGuardarCambios = async () => {
    if (!almacenName.trim()) { showFeedback("El nombre no puede estar vacío.", 'error'); return; }
    if (!token) { showFeedback("No autenticado.", 'error'); return; }

    // Opcional: Comparar si realmente hay cambios
    // if (almacenName.trim() === originalName && JSON.stringify(estructura) === JSON.stringify(originalEstructura)) {
    //     showFeedback("No hay cambios para guardar.", 'info');
    //     return;
    // }

    setIsSaving(true); setError(null); clearFeedback();
    try {
      const payload = { nombre: almacenName.trim(), estructura: estructura };
      const res = await fetch(`${BASE_URL}/auditoria/${almacenID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      if (!res.ok) { /* ... manejo de error fetch ... */ }
      showFeedback("Cambios guardados.", 'success');
      // Actualizar estado original tras guardar exitosamente
      setOriginalName(almacenName.trim());
      setOriginalEstructura(structuredClone(estructura));
      // setTimeout(() => navigate("/shelf-to-sheet"), 1500); // Opcional: navegar
    } catch (error) { /* ... manejo de error catch ... */ }
    finally { setIsSaving(false); }
  };

  // --- Eliminar Almacén (con estado de carga, feedback y token) ---
  const handleEliminarAlmacen = () => {
    if (!token) { showFeedback("No autenticado.", 'error'); return; }
    setConfirmMessage(`¿Eliminar almacén "${almacenName}" y su contenido?`);
    setConfirmAction(() => async () => {
      setIsSaving(true); setError(null); clearFeedback(); setShowConfirm(false);
      try {
        const res = await fetch(`${BASE_URL}/auditoria/${almacenID}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) { /* ... manejo de error fetch ... */ }
        showFeedback("Almacén eliminado.", 'success');
        setTimeout(() => navigate("/shelf-to-sheet"), 1000);
      } catch (error) { /* ... manejo de error catch ... */ setIsSaving(false); }
    });
    setShowConfirm(true);
  };

  // --- Cancelar (SIN CAMBIOS) ---
  const handleCancelar = () => { navigate(-1); };

  // --- Funciones Estructura (SIN CAMBIOS EN LÓGICA, pero con useCallback) ---
  const updateNivelName = useCallback((nivelId, newName) => {
     setEstructura(prev => { const nE = structuredClone(prev); const find = (nodes) => { for (const node of nodes){ if(node.id===nivelId){node.nombre=newName;return true;} if(node.subniveles&&find(node.subniveles))return true;} return false; }; find(nE); return nE; });
  }, []);
  const agregarSubnivel = useCallback((parentId) => {
     setEstructura(prev => { const nE = structuredClone(prev); const nN = { id: -(Date.now() + Math.random()), nombre: "Nuevo Subnivel", subniveles: [] }; const find = (nodes) => { for(const node of nodes){ if(node.id===parentId){if(!Array.isArray(node.subniveles))node.subniveles=[];node.subniveles.push(nN);return true;} if(node.subniveles&&find(node.subniveles))return true;} return false; }; if(parentId===null||!find(nE)){nE.push(nN);} return nE; });
  }, []);
  const handleEliminarSubnivel = useCallback((nivelId, nivelName) => {
    setConfirmMessage(`¿Eliminar subnivel "${nivelName || 'este subnivel'}"?`);
    setConfirmAction(() => () => {
        setEstructura(prev => { const nE = structuredClone(prev); const find = (nodes) => { for(let i=0;i<nodes.length;i++){ if(nodes[i].id===nivelId){nodes.splice(i,1);return true;} if(nodes[i].subniveles&&find(nodes[i].subniveles))return true;} return false; }; find(nE); return nE; });
        setShowConfirm(false);
        showFeedback(`Subnivel eliminado localmente.`, 'info');
    });
    setShowConfirm(true);
  }, [showFeedback]); // Dependencia correcta

  // --- Renderizado (Aplicando clases CSS) ---
  if (loading) return <div className={styles.loadingIndicator}>Cargando almacén...</div>;
  // Mostrar error de carga principal si existe
  if (error && !loading) return <div className={styles.errorIndicator}>{error}</div>;
  // Mostrar mensaje si no se encontró ID (aunque no debería llegar aquí si se valida antes)
  if (!almacenID) return <div className={styles.errorIndicator}>ID de almacén no especificado.</div>;


  return (
    // Envolver en Screen si es necesario
    // <Screen>
      <div className={styles.wrapper}>
        {/* Contenido principal scrollable */}
        <div className={styles.scrollableContent}>
          <div className={styles.card}>
            <h3 className={styles.title}>Editar Almacén</h3>

            {/* Mensajes de Feedback */}
             {feedback.message && (
                 <div className={`${styles.feedbackMessage} ${styles[feedback.type] || 'info'}`}>
                     {feedback.message}
                 </div>
             )}

            <label className={styles.label}>Nombre del Almacén*</label>
            <input
              className={styles.input}
              value={almacenName}
              onChange={(e) => setAlmacenName(e.target.value)}
              disabled={isSaving}
              maxLength={100}
            />

            <h4 className={styles.structureTitle}>Estructura</h4>
            <div className={styles.structureContainer}>
                {estructura.length === 0 ? (
                    <p className={styles.noSublevels}>Este almacén está vacío.</p>
                ) : (
                    estructura.map((nivel) => (
                        <NivelItem
                            key={nivel.id}
                            nivel={nivel}
                            onUpdateName={updateNivelName}
                            onAddSubnivel={agregarSubnivel}
                            onRemoveSubnivel={handleEliminarSubnivel}
                            isSaving={isSaving}
                            indent={0}
                        />
                    ))
                )}
                 {/* Botón para añadir nivel raíz */}
                 <button
                    className={styles.btnAddRoot}
                    onClick={() => agregarSubnivel(null)}
                    disabled={isSaving}
                    title="Añadir Nivel Principal"
                 >
                     + Añadir Nivel Principal
                 </button>
            </div>

            {/* Botón Eliminar Almacén */}
            <button
              className={`${styles.button} ${styles.btnRed}`}
              style={{ width: '100%', marginTop: '24px' }}
              onClick={handleEliminarAlmacen}
              disabled={isSaving}
            >
              {isSaving ? "Eliminando..." : "Eliminar Almacén Completo"}
            </button>
          </div>
        </div>

        {/* Footer Fijo */}
        <div className={styles.footer}>
          <button className={`${styles.footerButton} ${styles.cancel}`} onClick={handleCancelar} disabled={isSaving}>
            Cancelar
          </button>
          <button className={`${styles.footerButton} ${styles.save}`} onClick={handleGuardarCambios} disabled={isSaving}>
            {isSaving ? "Guardando..." : "Guardar Cambios"}
          </button>
        </div>

        {/* Modal de confirmación */}
        {showConfirm && (
          <div className={styles.confirmOverlay} onClick={() => setShowConfirm(false)}>
            <div className={styles.confirmModal} onClick={e => e.stopPropagation()}>
              <p className={styles.confirmMessage}>{confirmMessage}</p>
              <div className={styles.confirmButtonRow}>
                <button className={`${styles.confirmButton} ${styles.yes}`} onClick={confirmAction}>
                  Sí, Eliminar
                </button>
                <button className={`${styles.confirmButton} ${styles.no}`} onClick={() => setShowConfirm(false)}>
                  No, Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    // </Screen>
  );
}