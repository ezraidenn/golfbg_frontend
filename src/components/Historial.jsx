// src/components/Historial.jsx
import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import Screen from "../components/Screen";
import { API_URL } from '../utils/api';

const BASE_URL = API_URL;
const PAGE_SIZE = 25;

/* ------------------ ESTILOS (Ajustados para filtros) ------------------ */
const styles = {
    container: {
        padding: '20px',
        maxWidth: '1200px',
        margin: '0 auto'
    },
    filters: {
        marginBottom: '20px',
        padding: '15px',
        backgroundColor: '#f5f5f5',
        borderRadius: '8px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
    },
    filterRow: {
        display: 'flex',
        gap: '10px',
        alignItems: 'center',
        flexWrap: 'wrap'
    },
    filterGroup: {
        display: 'flex',
        alignItems: 'center',
        gap: '5px'
    },
    input: {
        padding: '8px',
        borderRadius: '4px',
        border: '1px solid #ddd'
    },
    select: {
        padding: '8px',
        borderRadius: '4px',
        border: '1px solid #ddd'
    },
    cardContainer: {
        marginBottom: '10px',
        padding: '15px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    },
    cardPrestada: {
        backgroundColor: '#e3f2fd'  // Azul claro
    },
    cardDevuelta: {
        backgroundColor: '#e8f5e9'  // Verde claro
    },
    cardRetrasada: {
        backgroundColor: '#ffebee'  // Rojo claro
    },
    cardModificada: {
        backgroundColor: '#fff3e0'  // Naranja claro
    },
    cardOtro: {
        backgroundColor: '#f5f5f5'  // Gris claro
    }
};

// **********************************************
// Función para calcular retraso (COPIADA DE Alerta.jsx)
// NOTA: Útil si los datos del historial futuro incluyen 'fecha_devolucion_esperada'.
// ***********************************************/
const calcularRetraso = (fechaDevolucionStr) => {
    if (!fechaDevolucionStr) return 0;
    
    const fechaDevolucion = new Date(fechaDevolucionStr);
    const ahora = new Date();
    
    // Si la fecha de devolución es futura, no hay retraso
    if (fechaDevolucion > ahora) return 0;
    
    const diferencia = ahora - fechaDevolucion;
    const diasRetraso = Math.floor(diferencia / (1000 * 60 * 60 * 24));
    
    return diasRetraso;
};

// Constantes y Helpers
const ACTION_TYPES = {
    PRESTADA: 'PRESTADA',
    DEVUELTA: 'DEVUELTA',
    RETRASADA: 'RETRASADA',
    MODIFICADA: 'MODIFICADA',
    OTRO: 'OTRO'
};

const getActionType = (actionText) => {
    if (actionText.includes('prestó')) return ACTION_TYPES.PRESTADA;
    if (actionText.includes('devolvió')) return ACTION_TYPES.DEVUELTA;
    if (actionText.includes('modificó')) return ACTION_TYPES.MODIFICADA;
    if (actionText.includes('retrasada')) return ACTION_TYPES.RETRASADA;
    return ACTION_TYPES.OTRO;
};

const actionCardStyles = {
    [ACTION_TYPES.PRESTADA]: styles.cardPrestada,
    [ACTION_TYPES.DEVUELTA]: styles.cardDevuelta,
    [ACTION_TYPES.RETRASADA]: styles.cardRetrasada,
    [ACTION_TYPES.MODIFICADA]: styles.cardModificada,
    [ACTION_TYPES.OTRO]: styles.cardOtro,
};

const formatName = (first, last, code) => {
    const fullName = [first, last].filter(Boolean).join(' ');
    return code ? `${fullName} (${code})` : fullName;
};

const buildSentence = (m, memberMap) => {
    let sentence = '';
    const member = memberMap[m.member_id];
    const memberName = member ? formatName(member.first_name, member.last_name, member.code) : 'Usuario desconocido';
    
    if (m.action_type === 'LOAN') {
        sentence = `${memberName} prestó la bolsa`;
    } else if (m.action_type === 'RETURN') {
        sentence = `${memberName} devolvió la bolsa`;
    } else if (m.action_type === 'MODIFICATION') {
        sentence = `${memberName} modificó la bolsa`;
    } else {
        sentence = `${memberName} realizó una acción: ${m.action_type}`;
    }
    
    if (m.details) {
        sentence += ` - ${m.details}`;
    }
    
    return sentence;
};

const MovementCard = ({ movimiento, memberMap }) => {
    const actionType = getActionType(buildSentence(movimiento, memberMap));
    const cardStyle = { ...styles.cardContainer, ...actionCardStyles[actionType] };
    return (
        <div style={cardStyle}>
            <p>{buildSentence(movimiento, memberMap)}</p>
            <small>Fecha: {new Date(movimiento.timestamp).toLocaleString()}</small>
        </div>
    );
};

const Historial = () => {
    // Estados
    const [movements, setMovements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [memberMap, setMemberMap] = useState({});
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        memberCode: '',
        actionType: ''
    });
    
    // Refs
    const observer = useRef();
    const lastMovementElementRef = useCallback(node => {
        if (loading) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                setPage(prevPage => prevPage + 1);
            }
        });
        if (node) observer.current.observe(node);
    }, [loading, hasMore]);

    // Efectos
    useEffect(() => {
        const fetchMembers = async () => {
            try {
                const response = await fetch(`${BASE_URL}/miembros`);
                const data = await response.json();
                const map = {};
                data.forEach(member => {
                    map[member.id] = member;
                });
                setMemberMap(map);
            } catch (err) {
                console.error('Error fetching members:', err);
                setError('Error al cargar los miembros');
            }
        };
        
        fetchMembers();
    }, []);

    useEffect(() => {
        const fetchMovements = async () => {
            try {
                setLoading(true);
                setError(null);
                
                let url = `${BASE_URL}/auditoria?page=${page}&limit=${PAGE_SIZE}`;
                
                // Añadir filtros a la URL si están presentes
                if (filters.startDate) url += `&start_date=${filters.startDate}`;
                if (filters.endDate) url += `&end_date=${filters.endDate}`;
                if (filters.memberCode) url += `&member_code=${filters.memberCode}`;
                if (filters.actionType) url += `&action_type=${filters.actionType}`;
                
                const response = await fetch(url);
                const data = await response.json();
                
                setMovements(prevMovements => {
                    if (page === 1) return data;
                    return [...prevMovements, ...data];
                });
                
                setHasMore(data.length === PAGE_SIZE);
            } catch (err) {
                console.error('Error fetching movements:', err);
                setError('Error al cargar el historial');
            } finally {
                setLoading(false);
            }
        };
        
        fetchMovements();
    }, [page, filters]);

    // Handlers
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({
            ...prev,
            [name]: value
        }));
        setPage(1); // Resetear la página al cambiar filtros
    };

    const handleClearFilters = () => {
        setFilters({
            startDate: '',
            endDate: '',
            memberCode: '',
            actionType: ''
        });
        setPage(1);
    };

    // Estilos para botones
    const buttonStyle = {
        padding: '8px 16px',
        borderRadius: '4px',
        border: 'none',
        backgroundColor: '#1976d2',
        color: 'white',
        cursor: 'pointer'
    };

    const buttonClearStyle = {
        ...buttonStyle,
        backgroundColor: '#f44336'
    };

    return (
        <Screen>
            <div style={styles.container}>
                {/* --- Sección de Filtros Reorganizada --- */}
                <div style={styles.filters}>
                    <h3>Filtros</h3>
                    <div style={styles.filterRow}>
                        <div style={styles.filterGroup}>
                            <label>Desde:</label>
                            <input
                                type="date"
                                name="startDate"
                                value={filters.startDate}
                                onChange={handleFilterChange}
                                style={styles.input}
                            />
                        </div>
                        <div style={styles.filterGroup}>
                            <label>Hasta:</label>
                            <input
                                type="date"
                                name="endDate"
                                value={filters.endDate}
                                onChange={handleFilterChange}
                                style={styles.input}
                            />
                        </div>
                    </div>
                    <div style={styles.filterRow}>
                        <div style={styles.filterGroup}>
                            <label>Código de Miembro:</label>
                            <input
                                type="text"
                                name="memberCode"
                                value={filters.memberCode}
                                onChange={handleFilterChange}
                                placeholder="Código"
                                style={styles.input}
                            />
                        </div>
                        <div style={styles.filterGroup}>
                            <label>Tipo de Acción:</label>
                            <select
                                name="actionType"
                                value={filters.actionType}
                                onChange={handleFilterChange}
                                style={styles.select}
                            >
                                <option value="">Todas</option>
                                <option value="LOAN">Préstamo</option>
                                <option value="RETURN">Devolución</option>
                                <option value="MODIFICATION">Modificación</option>
                            </select>
                        </div>
                        <button style={buttonClearStyle} onClick={handleClearFilters} disabled={loading}>
                            Limpiar Filtros
                        </button>
                    </div>
                </div>
                {/* --- Fin Sección de Filtros Reorganizada --- */}

                {/* --- Resultados (sin cambios) --- */}
                {error && <div style={{ color: 'red', marginBottom: '20px' }}>{error}</div>}
                
                {movements.map((movement, index) => {
                    if (movements.length === index + 1) {
                        return (
                            <div ref={lastMovementElementRef} key={movement.id}>
                                <MovementCard movimiento={movement} memberMap={memberMap} />
                            </div>
                        );
                    } else {
                        return (
                            <div key={movement.id}>
                                <MovementCard movimiento={movement} memberMap={memberMap} />
                            </div>
                        );
                    }
                })}
                
                {loading && <div>Cargando...</div>}
                {!hasMore && movements.length > 0 && (
                    <div style={{ textAlign: 'center', marginTop: '20px' }}>
                        No hay más movimientos para mostrar
                    </div>
                )}
                {!loading && movements.length === 0 && (
                    <div style={{ textAlign: 'center', marginTop: '20px' }}>
                        No se encontraron movimientos
                    </div>
                )}
            </div>
        </Screen>
    );
};

export default Historial;