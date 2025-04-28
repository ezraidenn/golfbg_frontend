// src/components/Mantenimientos.jsx
import React, { useState } from "react";

const Mantenimientos = () => {
  // Estado para la búsqueda
  const [searchTerm, setSearchTerm] = useState("");
  // Estado para el filtro de estado
  const [statusFilter, setStatusFilter] = useState("Pendiente");
  // Estado para los mantenimientos
  const [mantenimientos, setMantenimientos] = useState([
    { id: "12345", fecha: "2023-10-15", ubicacion: "Almacén A1", estado: "Pendiente" },
    { id: "67890", fecha: "2023-10-20", ubicacion: "Almacén B2", estado: "En Proceso" },
    { id: "11223", fecha: "2023-09-30", ubicacion: "Almacén C3", estado: "Completado" },
  ]);

  // Estado para detalles de mantenimiento
  const detalleMantenimiento = {
    historial: "Mantenimiento completo el 2023-09-15",
    notas: "Revisar el desgaste de las ruedas",
  };

  // Función para actualizar el estado de mantenimiento
  const marcarComoCompletado = (id) => {
    setMantenimientos((prev) =>
      prev.map((m) => (m.id === id ? { ...m, estado: "Completado" } : m))
    );
  };

  // Filtrar mantenimientos por búsqueda y estado
  const mantenimientosFiltrados = mantenimientos.filter(
    (m) =>
      (m.id.includes(searchTerm) || m.ubicacion.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (statusFilter === "" || m.estado === statusFilter)
  );

  return (
    <div style={styles.container}>
      {/* Barra de búsqueda */}
      <input
        type="text"
        style={styles.input}
        placeholder="Buscar por ID o ubicación"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {/* Dropdown de filtro */}
      <select
        style={styles.dropdown}
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
      >
        <option value="Pendiente">Pendiente</option>
        <option value="En Proceso">En Proceso</option>
        <option value="Completado">Completado</option>
      </select>

      {/* Tarjetas de mantenimiento */}
      {mantenimientosFiltrados.map((mantenimiento) => (
        <div key={mantenimiento.id} style={styles.card}>
          <div style={styles.boldText}>ID: {mantenimiento.id}</div>
          <div style={styles.text}>Fecha: {mantenimiento.fecha}</div>
          <div style={styles.text}>Ubicación: {mantenimiento.ubicacion}</div>
          <div style={styles.text}>{mantenimiento.estado}</div>

          {/* Botón "Marcar como Completado" solo si no está completado */}
          {mantenimiento.estado !== "Completado" && (
            <button style={styles.button} onClick={() => marcarComoCompletado(mantenimiento.id)}>
              Marcar como Completado
            </button>
          )}
        </div>
      ))}

      {/* Sección de Detalle de Mantenimiento */}
      <div style={styles.detailCard}>
        <div style={styles.boldText}>Detalle de Mantenimiento</div>
        <div style={styles.text}>Historial: {detalleMantenimiento.historial}</div>
        <div style={styles.text}>Notas: {detalleMantenimiento.notas}</div>
        <button style={styles.button}>Programar Próximo Mantenimiento</button>
      </div>
    </div>
  );
};

// Estilos en línea
const styles = {
  container: {
    padding: "16px",
  },
  input: {
    width: "100%",
    height: "36px",
    padding: "0 8px",
    border: "0",
    borderRadius: "6px",
    backgroundColor: "#ffffff",
    color: "#94a3b8",
    fontSize: "14px",
    fontFamily: "Poppins",
    lineHeight: "36px",
    outline: "none",
    marginBottom: "10px",
  },
  dropdown: {
    width: "100%",
    height: "39px",
    border: "0",
    borderRadius: "6px",
    backgroundColor: "#ffffff",
    color: "#030303",
    fontSize: "14px",
    fontFamily: "Poppins",
    marginBottom: "10px",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: "6px",
    boxShadow: "0px 4px 6px rgba(0,0,0,0.1)",
    padding: "12px",
    marginBottom: "10px",
  },
  detailCard: {
    backgroundColor: "#ffffff",
    borderRadius: "6px",
    boxShadow: "0px 4px 6px rgba(0,0,0,0.1)",
    padding: "12px",
    marginTop: "10px",
  },
  text: {
    color: "#030303",
    fontSize: "14px",
    fontFamily: "Poppins",
    lineHeight: "20px",
  },
  boldText: {
    color: "#030303",
    fontSize: "14px",
    fontFamily: "Poppins",
    fontWeight: "700",
    lineHeight: "20px",
  },
  button: {
    width: "100%",
    height: "36px",
    borderRadius: "6px",
    backgroundColor: "#16c76c",
    color: "#ffffff",
    fontSize: "14px",
    fontFamily: "Poppins",
    lineHeight: "20px",
    border: "none",
    cursor: "pointer",
    marginTop: "10px",
  },
};

export default Mantenimientos;
