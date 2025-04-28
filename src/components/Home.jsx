// src/components/Home.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Screen from "../components/Screen"; // Asumiendo layout base

import { API_URL } from '../utils/api'

const BASE_URL = API_URL;

// --- Componente de Tarjetas de Estadísticas ---
function CardsRow({ onAlertClick, available, borrowed, alertCount, loading }) {
    // Mostrar '...' si está cargando, o el número/valor
    const displayValue = (value) => loading ? "..." : (value ?? "0");

    return (
        <div style={styles.cardsRowContainer}>
            {/* Tarjeta Disponibles */}
            <div style={{ ...styles.cardBase, ...styles.cardAvailable }}>
                <div style={styles.cardTitle}>Bolsas Disponibles</div>
                <div style={styles.cardNumber}>{displayValue(available)}</div>
            </div>

            {/* Tarjeta En Préstamo */}
            <div style={{ ...styles.cardBase, ...styles.cardBorrowed }}>
                <div style={styles.cardTitle}>Bolsas en Préstamo</div>
                <div style={styles.cardNumber}>{displayValue(borrowed)}</div>
            </div>

            {/* Tarjeta Alerta */}
            <div
                style={{ ...styles.cardBase, ...styles.cardAlert, ...(loading ? {} : styles.cardClickable) }} // Solo clickable si no carga
                onClick={!loading ? onAlertClick : undefined} // Solo onClick si no carga
                role={!loading ? "button" : undefined} // Semántica
                tabIndex={!loading ? 0 : undefined} // Accesibilidad teclado
                aria-label={`Alerta: ${displayValue(alertCount)} bolsas retrasadas. Click para ver detalles.`}
            >
                <div style={styles.cardTitleAlert}>ALERTA</div>
                <div style={styles.cardTextAlert}>
                    <span style={{...styles.cardNumber, fontSize: '24px', color: '#dc3545'}}>{displayValue(alertCount)}</span>
                    {' '}Bolsas Retrasadas
                    <span style={styles.cardSubtextAlert}>(+8 horas)</span>
                </div>
            </div>
        </div>
    );
}

// --- Componente Principal Home ---
const Home = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({ available: 0, borrowed: 0, alert: 0 });
    const [loadingStats, setLoadingStats] = useState(true);
    const [errorStats, setErrorStats] = useState("");
    const [token, setToken] = useState(localStorage.getItem("token"));

    useEffect(() => {
        // Si no hay token, redirigir a login inmediatamente
        if (!token) {
            navigate('/login');
            return;
        }

        const fetchStats = async () => {
            setLoadingStats(true);
            setErrorStats("");

            try {
                const headers = { Authorization: `Bearer ${token}` };

                // Ejecutar ambas peticiones en paralelo
                const [resAll, resOverdue] = await Promise.allSettled([
                    fetch(`${BASE_URL}/bolsas`, { headers }),
                    fetch(`${BASE_URL}/bolsas?retrasadas=true`, { headers })
                ]);

                let availableCount = 0;
                let borrowedCount = 0;
                let alertCount = 0;
                let fetchError = null;

                // Procesar respuesta de /bolsas
                if (resAll.status === 'fulfilled' && resAll.value.ok) {
                    const dataAll = await resAll.value.json();
                    availableCount = dataAll.filter((b) => b.estado === "Disponible").length;
                    borrowedCount = dataAll.filter((b) => b.estado === "En tránsito").length;
                } else {
                    const status = resAll.status === 'fulfilled' ? resAll.value.status : 'Fetch Failed';
                    console.error(`Error fetching /bolsas: Status ${status}`, resAll.reason || '');
                    fetchError = `Error al cargar estadísticas generales (${status}).`;
                    // No lanzar error aquí para intentar obtener las retrasadas
                }

                // Procesar respuesta de /bolsas?retrasadas=true
                if (resOverdue.status === 'fulfilled' && resOverdue.value.ok) {
                    const dataOverdue = await resOverdue.value.json();
                    alertCount = dataOverdue.length;
                } else {
                     const status = resOverdue.status === 'fulfilled' ? resOverdue.value.status : 'Fetch Failed';
                    console.error(`Error fetching /bolsas?retrasadas=true: Status ${status}`, resOverdue.reason || '');
                    // Si ya hubo un error antes, no lo sobrescribas, solo añade info si es útil
                    if (!fetchError) {
                         fetchError = `Error al cargar bolsas retrasadas (${status}).`;
                    }
                }

                // Actualizar estado
                setStats({ available: availableCount, borrowed: borrowedCount, alert: alertCount });
                if (fetchError) {
                    setErrorStats(fetchError); // Mostrar el primer error encontrado
                }

            } catch (error) { // Captura errores inesperados (ej. red)
                console.error("Unexpected error fetching stats:", error);
                setErrorStats("Error de red al cargar estadísticas.");
                setStats({ available: 0, borrowed: 0, alert: 0 }); // Resetear stats en caso de error grave
            } finally {
                setLoadingStats(false);
            }
        };

        fetchStats();
        // Refrescar cada 5 minutos, por ejemplo
        const intervalId = setInterval(fetchStats, 5 * 60 * 1000);
        return () => clearInterval(intervalId); // Limpiar intervalo al desmontar

    }, [token, navigate]); // Depender de token y navigate

    const handleAlertClick = () => {
        navigate("/alerta"); // Asume que tienes una ruta para esto
    };

    // Renderizado
    return (
        <Screen>
            <div style={styles.container}>
                {/* Botones de Navegación */}
                {/* --- CORRECCIÓN AQUÍ --- */}
                <button style={{...styles.buttonBase, ...styles.buttonGreen}} onClick={() => navigate("/crearmodificarbolsa")}>
                    Crear / Modificar Bolsa
                </button>
                {/* ----------------------- */}
                <button style={{...styles.buttonBase, ...styles.buttonGreen}} onClick={() => navigate("/prestamo-devolucion")}>
                    Prestar / Devolver Bolsa
                </button>
                <button style={{...styles.buttonBase, ...styles.buttonGray}} onClick={() => navigate("/reportes")}>
                    Reportes
                </button>
                 <button style={{...styles.buttonBase, ...styles.buttonGreen}} onClick={() => navigate("/consultar-bolsa")}>
                    Consultar Bolsa
                </button>
                <button style={{...styles.buttonBase, ...styles.buttonGray}} onClick={() => navigate("/mantenimientos")}>
                    Mantenimientos
                </button>
                <button style={{...styles.buttonBase, ...styles.buttonGreen}} onClick={() => navigate("/shelf-to-sheet")}>
                    Auditoría
                </button>

                {/* Mensaje de Error para Estadísticas */}
                {errorStats && <p style={styles.errorIndicator}>{errorStats}</p>}

                {/* Tarjetas de Estadísticas */}
                <CardsRow
                    onAlertClick={handleAlertClick}
                    available={stats.available}
                    borrowed={stats.borrowed}
                    alertCount={stats.alert}
                    loading={loadingStats}
                />
            </div>
        </Screen>
    );
};

// --- Estilos Mejorados ---
const styles = {
    container: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center", // Centra los botones horizontalmente
        padding: "20px 15px 80px 15px", // Padding (espacio para footer)
        fontFamily: "'Poppins', sans-serif",
        width: "100%",
        maxWidth: "600px", // Ancho máximo para mejor lectura en desktop
        margin: "0 auto", // Centrado de página
        boxSizing: "border-box",
        gap: '12px', // Espacio entre botones
    },
    buttonBase: {
        width: "95%",        // Ocupa casi todo el ancho del contenedor
        maxWidth: "400px",   // Un máximo razonable
        height: "50px",      // Ligeramente más altos
        border: "none",
        borderRadius: "8px",
        color: "#fff",
        fontSize: "16px",
        fontFamily: "'Poppins', sans-serif",
        fontWeight: '600', // Semi-bold
        cursor: "pointer",
        textAlign: 'center',
        textDecoration: 'none', // Por si se usa Link
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
        transition: 'transform 0.1s ease, box-shadow 0.2s ease',
        // Estilos hover/active (mejor con clases CSS)
        // '&:hover': { transform: 'translateY(-1px)', boxShadow: '0 4px 8px rgba(0,0,0,0.15)' },
        // '&:active': { transform: 'translateY(0px)', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' },
    },
    buttonGreen: {
        backgroundColor: "#16c76c", // Verde original
    },
    buttonGray: {
        backgroundColor: "#adb5bd", // Un gris más agradable
        color: "#ffffff",
    },
    cardsRowContainer: {
        display: "flex",
        gap: "12px", // Espacio entre tarjetas
        justifyContent: "center", // Centra las tarjetas si hay espacio
        flexWrap: "wrap",      // Permite que las tarjetas bajen en pantallas pequeñas
        marginTop: "30px",     // Espacio sobre las tarjetas
        width: '100%',         // Ocupar ancho del contenedor
    },
    cardBase: {
        flex: "1 1 140px", // Permite crecer, encoger, base de 140px
        maxWidth: 'calc(33.33% - 10px)', // Max 3 por fila (ajustar gap)
        height: "160px", // Altura reducida
        borderRadius: "8px", // Bordes más redondeados
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "15px", // Padding interno
        boxSizing: "border-box",
        textAlign: "center",
        boxShadow: '0 3px 6px rgba(0,0,0,0.08)',
        transition: 'transform 0.2s ease',
    },
    cardAvailable: { backgroundColor: "#d1e7dd", border: '1px solid #a3cfbb' }, // Verde pastel
    cardBorrowed: { backgroundColor: "#cfe2ff", border: '1px solid #a6c5f0' }, // Azul pastel
    cardAlert: { backgroundColor: "#f8d7da", border: '1px solid #f1aeae' }, // Rojo pastel
    cardClickable: { cursor: 'pointer', '&:hover': { transform: 'scale(1.03)' } }, // Efecto hover
    cardTitle: { color: "#495057", fontSize: "14px", fontWeight: 600, marginBottom: "10px" },
    cardNumber: { color: "#212529", fontSize: "30px", fontWeight: 700, lineHeight: '1.1' },
    cardTitleAlert: { color: "#721c24", fontSize: "16px", fontWeight: 700, marginBottom: "8px", textTransform: 'uppercase' },
    cardTextAlert: { color: "#721c24", fontSize: "13px", lineHeight: "1.4" },
    cardSubtextAlert: { display: 'block', fontSize: '11px', opacity: 0.8, marginTop: '4px' },
    loadingIndicator: { width: '100%', textAlign: 'center', padding: '20px', fontSize: '16px', color: '#6c757d', boxSizing: 'border-box' },
    errorIndicator: { width: '100%', boxSizing: 'border-box', textAlign: 'center', padding: '10px 15px', fontSize: '14px', color: '#721c24', backgroundColor: '#f8d7da', border: '1px solid #f5c6cb', borderRadius: '8px', marginTop: '15px' },
};

// Placeholders si los componentes no se importan
// Comentado o eliminado si Screen se importa correctamente
// if (typeof Screen === 'undefined') { const Screen = ({ children }) => <div>{children}</div>; }
// if (typeof QRScanner === 'undefined') { const QRScanner = () => <div>QRScanner Placeholder</div>; }

export default Home;