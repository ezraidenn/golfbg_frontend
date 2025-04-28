import React, { useEffect, useState, useCallback } from "react"; // useCallback añadido aunque no se use mucho aquí
import { useNavigate } from "react-router-dom";
import Screen from "../components/Screen";
import styles from './ShelfToSheet.module.css'; // <--- Importar CSS Module

import { API_URL } from '../utils/api'

const BASE_URL = API_URL;

export default function ShelfToSheet() {
  const navigate = useNavigate();

  // --- Estados ---
  const [currentUser, setCurrentUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true); // <--- Nuevo: Estado de carga del usuario
  const [almacenes, setAlmacenes] = useState([]);
  const [loadingAlmacenes, setLoadingAlmacenes] = useState(true); // <--- Nuevo: Estado de carga de almacenes
  const [error, setError] = useState(null); // <--- Nuevo: Estado para errores generales
  const [feedback, setFeedback] = useState({ message: null, type: null }); // <--- Nuevo: Para mensajes de éxito/error
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); // <--- Nuevo: Estado para creación/eliminación
  const [nuevoAlm, setNuevoAlm] = useState({
    almacenName: "",
    categoryName: "", // Considerar si realmente se necesita o el backend lo infiere
    categoryCount: 0,
  });

  // --- Derivados ---
  const isAdmin = currentUser?.rol === "admin";

  // --- Limpiar Feedback ---
  const clearFeedback = () => setFeedback({ message: null, type: null });

  // --- Cargar Usuario Actual ---
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoadingUser(false); // No hay token, no hay usuario
      // Podrías redirigir al login aquí si es requerido
      // navigate('/login');
      return;
    }
    setLoadingUser(true);
    fetch(`${BASE_URL}/usuarios/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        if (!res.ok) {
             if (res.status === 401) localStorage.removeItem("token"); // Limpiar token inválido
             throw new Error("No autorizado o sesión expirada.");
        }
        return res.json();
      })
      .then((data) => setCurrentUser(data))
      .catch((err) => {
           console.error("Error fetching user:", err);
           setCurrentUser(null); // Asegurar que no quede un usuario inválido
           setError("Error al cargar perfil de usuario."); // Mostrar error
      })
      .finally(() => setLoadingUser(false));
  }, []); // Corre solo una vez al montar

  // --- Cargar Almacenes ---
  const fetchAlmacenes = useCallback(async () => {
    setLoadingAlmacenes(true);
    setError(null); // Limpiar error anterior
    clearFeedback(); // Limpiar mensajes anteriores
    try {
      const res = await fetch(`${BASE_URL}/auditoria`); // Asume GET /auditoria lista almacenes
      if (!res.ok) throw new Error(`Error ${res.status} al cargar almacenes`);
      const data = await res.json();
      setAlmacenes(Array.isArray(data) ? data : []); // Asegurar que es un array
    } catch (error) {
      console.error(error);
      setError(error.message || "Error al cargar la lista de almacenes");
      setAlmacenes([]); // Limpiar en caso de error
    } finally {
      setLoadingAlmacenes(false);
    }
  }, []); // useCallback con dependencias vacías

  useEffect(() => {
    fetchAlmacenes();
  }, [fetchAlmacenes]); // Cargar al montar

  // --- Handlers ---

  // Ver Detalles (Mejorado para consola, o preparar para navegación)
  const handleVerDetalles = (alm) => {
    console.log("Detalles del Almacén:", alm);
    // TODO: Implementar navegación a vista detallada o modal
    // navigate(`/almacen/${alm.id}`);
    setFeedback({ message: `Acción 'Ver Detalles' para "${alm.nombre}" no implementada. Ver consola.`, type: 'info' });
    setTimeout(clearFeedback, 3000); // Limpiar mensaje
  };

  // Editar (Navegación)
  const handleEditar = (almacenID) => {
    // La comprobación de isAdmin se hace en el botón disabled, pero una doble verificación no daña
    if (!isAdmin) {
        setFeedback({ message: "No tienes permisos para editar.", type: 'error' });
        setTimeout(clearFeedback, 3000);
        return;
    }
    navigate("/editar-almacen", { state: { almacenID } });
  };

  // Eliminar (con feedback y estado de carga)
  const handleEliminar = async (almacenID, almacenName) => {
    if (!isAdmin) return; // El botón ya debería estar deshabilitado
    const confirmDel = window.confirm(`¿Seguro que deseas eliminar el almacén "${almacenName}" y TODO su contenido? Esta acción no se puede deshacer.`);
    if (confirmDel) {
      setIsSubmitting(true); // Indicar carga
      clearFeedback();
      try {
        const token = localStorage.getItem("token"); // Necesario para acciones de admin
        const res = await fetch(`${BASE_URL}/auditoria/${almacenID}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` }, // <-- Añadir token
        });
        if (!res.ok) {
            let errorMsg = `Error ${res.status} al eliminar almacén`;
            try { const errData = await res.json(); errorMsg += `: ${errData.detail || ''}`; } catch(e){}
            throw new Error(errorMsg);
        }
        setFeedback({ message: `Almacén "${almacenName}" eliminado exitosamente.`, type: 'success' });
        fetchAlmacenes(); // Recargar la lista
      } catch (error) {
        console.error("Error eliminando almacen:", error);
        setFeedback({ message: error.message || "Error al eliminar almacén.", type: 'error' });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // Exportar (con feedback y placeholder)
  const handleExportar = async () => {
    setIsSubmitting(true); // Reusar estado de carga
    clearFeedback();
    // TODO: Implementar lógica real de exportación (llamar backend, descargar archivo)
    console.log("Intentando exportar auditoría...");
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simular espera
    setFeedback({ message: "Funcionalidad de exportación aún no implementada.", type: 'info' });
    setIsSubmitting(false);
    // try {
    //   const res = await fetch(`${BASE_URL}/auditoria/export`); // Asume endpoint GET para exportar
    //   if (!res.ok) throw new Error("Error al exportar auditoría");
    //   // Lógica para descargar el archivo (ej. blob)
    //   const blob = await res.blob();
    //   const url = window.URL.createObjectURL(blob);
    //   const a = document.createElement('a');
    //   a.style.display = 'none';
    //   a.href = url;
    //   a.download = 'auditoria_almacenes.xlsx'; // o .csv, .json etc.
    //   document.body.appendChild(a);
    //   a.click();
    //   window.URL.revokeObjectURL(url);
    //   a.remove();
    //   setFeedback({ message: "Auditoría exportada.", type: 'success' });
    // } catch (error) {
    //   console.error(error);
    //   setFeedback({ message: "Error al exportar auditoría.", type: 'error' });
    // } finally {
    //   setIsSubmitting(false);
    // }
  };

  // --- Modal Nuevo Almacén ---
  const handleNuevoAlmacen = () => {
    if (!isAdmin) return; // Botón ya deshabilitado
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setNuevoAlm({ almacenName: "", categoryName: "", categoryCount: 0 }); // Resetear form
  };

  const confirmarNuevoAlmacen = async () => {
    if (!isAdmin) return;

    // Validación básica
    const nombre = nuevoAlm.almacenName.trim();
    if (!nombre) {
        setFeedback({ message: "El nombre del almacén no puede estar vacío.", type: 'error' });
        setTimeout(clearFeedback, 3000);
        return;
    }
    // Validar categoryCount si se usa para generar estructura
    // const count = parseInt(nuevoAlm.categoryCount, 10);
    // if (isNaN(count) || count < 0) {
    //     setFeedback({ message: "La cantidad debe ser un número positivo.", type: 'error' });
    //     return;
    // }

    setIsSubmitting(true);
    clearFeedback();

    try {
      // --- IMPORTANTE: Ajusta este payload según lo que espere tu API ---
      // Si la API genera la estructura, envía solo el nombre:
      const payload = { nombre: nombre };

      // Si necesitas enviar la estructura generada (REVISA SI ES CORRECTO):
      // const baseName = nuevoAlm.categoryName.trim() || "Subnivel";
      // const structure = Array.from({ length: count }, (_, i) => ({
      //   // El backend debería generar IDs, no el frontend
      //   // id: `${Date.now()}-${i}`, // Ejemplo ID no robusto
      //   nombre: `${baseName} ${i + 1}`,
      //   subniveles: [],
      // }));
      // const payload = { nombre: nombre, estructura: structure };
      // ---------------------------------------------------------------

      const token = localStorage.getItem("token");
      const res = await fetch(`${BASE_URL}/auditoria`, { // Asume POST a /auditoria crea almacén
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
          let errorMsg = `Error ${res.status} al crear almacén`;
          try { const errData = await res.json(); errorMsg += `: ${errData.detail || ''}`; } catch(e){}
          throw new Error(errorMsg);
      }
      const data = await res.json(); // Obtener datos del almacén creado
      setFeedback({ message: `Almacén "${data.nombre || nombre}" creado exitosamente.`, type: 'success' });
      closeModal();
      fetchAlmacenes(); // Recargar lista
    } catch (error) {
      console.error("Error creando almacen:", error);
      setFeedback({ message: error.message || "Error al crear almacén.", type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Render ---
  return (
    <Screen>
      <div className={styles.wrapper}>
        <h2 className={styles.title}>Gestión de Almacenes</h2>

        {/* --- Mensajes de Feedback --- */}
        {feedback.message && (
            <div className={`${styles.feedbackMessage} ${styles[feedback.type] || 'info'}`}>
                {feedback.message}
            </div>
        )}
        {error && <div className={styles.errorIndicator}>{error}</div>}

        {/* --- Botón Nuevo Almacén --- */}
        {/* Deshabilitado mientras carga usuario o si no es admin */}
        <button
            className={`${styles.button} ${styles.btnFullWidth} ${styles.green}`}
            onClick={handleNuevoAlmacen}
            disabled={loadingUser || !isAdmin || isSubmitting}
            title={!isAdmin ? "Solo administradores pueden crear almacenes" : ""}
        >
            + Nuevo Almacén
        </button>

        {/* --- Lista de Almacenes --- */}
        {loadingAlmacenes && <div className={styles.loadingIndicator}>Cargando almacenes...</div>}
        {!loadingAlmacenes && almacenes.length === 0 && !error && (
            <p className={styles.noAlmacenes}>No hay almacenes definidos.</p>
        )}
        {!loadingAlmacenes && almacenes.map((alm) => {
          const numSubniveles = Array.isArray(alm.estructura) ? alm.estructura.length : 0;
          return (
            <div key={alm.id} className={styles.card}>
              <div className={styles.topRow}>
                <img
                  // Considera un icono genérico o permitir subir imágenes por almacén
                  src="https://assets.api.uizard.io/api/cdn/stream/502a4928-978b-416d-9858-b2d139ffb9d2.png"
                  alt="icono almacen"
                  className={styles.image}
                />
                <div className={styles.infoColumn}>
                  <div className={styles.title}>{alm.nombre || `Almacén ${alm.id}`}</div>
                  <div className={styles.subtitle}>
                    {numSubniveles} {numSubniveles === 1 ? 'subnivel principal' : 'subniveles principales'}
                  </div>
                </div>
              </div>

              <div className={styles.buttonsRow}>
                <button className={`${styles.button} ${styles.btnGreen}`} onClick={() => handleVerDetalles(alm)}>
                  Ver Detalles
                </button>
                <button
                  className={`${styles.button} ${styles.btnLightGreen}`}
                  onClick={() => handleEditar(alm.id)}
                  disabled={loadingUser || !isAdmin || isSubmitting} // Deshabilitar si carga, no admin o enviando
                  title={!isAdmin ? "Solo Admin" : "Editar Estructura"}
                >
                  Editar
                </button>
                <button
                  className={`${styles.button} ${styles.btnRed}`}
                  onClick={() => handleEliminar(alm.id, alm.nombre)}
                  disabled={loadingUser || !isAdmin || isSubmitting}
                  title={!isAdmin ? "Solo Admin" : "Eliminar Almacén"}
                >
                  Eliminar
                </button>
              </div>
            </div>
          );
        })}

        {/* --- Botón Exportar --- */}
        <button
            className={`${styles.button} ${styles.btnFullWidth}`}
            onClick={handleExportar}
            disabled={isSubmitting || loadingAlmacenes} // Deshabilitar si carga o procesa algo
        >
          Exportar Auditoría (Simulado)
        </button>
      </div>

      {/* --- Modal "Nuevo Almacén" --- */}
      {showModal && isAdmin && ( // Mostrar solo si showModal es true y es admin
        <div className={styles.overlay}>
          <div className={styles.modal}>
            <h3 className={styles.modalTitle}>Nuevo Almacén</h3>

            <label className={styles.modalLabel}>Nombre del almacén*</label>
            <input
              className={styles.modalInput}
              value={nuevoAlm.almacenName}
              onChange={(e) => setNuevoAlm({ ...nuevoAlm, almacenName: e.target.value })}
              placeholder="Ej. Bodega Principal"
              disabled={isSubmitting}
              maxLength={100} // Limitar longitud
            />

            {/* --- Opcional: Inputs para estructura inicial (si el backend lo requiere) ---
            <label className={styles.modalLabel}>Nombre de categoría inicial (ej. 'Pasillo')</label>
            <input
              className={styles.modalInput}
              value={nuevoAlm.categoryName}
              onChange={(e) => setNuevoAlm({ ...nuevoAlm, categoryName: e.target.value })}
              placeholder="Ej. Pasillo"
              disabled={isSubmitting}
            />
            <label className={styles.modalLabel}>Cantidad inicial de categorías</label>
            <input
              className={styles.modalInput}
              type="number"
              min="0" // Evitar negativos
              value={nuevoAlm.categoryCount}
              onChange={(e) => setNuevoAlm({ ...nuevoAlm, categoryCount: e.target.value })}
              placeholder="0"
              disabled={isSubmitting}
            />
             --- Fin Opcional --- */}

            {/* Mostrar error específico del modal si lo hubiera */}
            {feedback.message && feedback.type === 'error' && (
                 <div className={`${styles.feedbackMessage} ${styles.error}`} style={{marginBottom: '12px'}}>
                     {feedback.message}
                 </div>
            )}

            <div className={styles.modalButtonRow}>
              <button
                className={`${styles.modalButton} ${styles.confirm}`}
                onClick={confirmarNuevoAlmacen}
                disabled={isSubmitting} // Deshabilitar mientras se crea
              >
                {isSubmitting ? "Creando..." : "Crear Almacén"}
              </button>
              <button
                className={`${styles.modalButton} ${styles.cancel}`}
                onClick={closeModal}
                disabled={isSubmitting} // Deshabilitar mientras se crea
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </Screen>
  );
}