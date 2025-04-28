// Reportes.jsx
import React, { useState } from "react";
import Screen from "../components/Screen";

const styles = {
  container: {
    padding: "16px",
    fontFamily: "Poppins",
    textAlign: "center",
  },
  title: {
    fontSize: "20px",
    fontWeight: "700",
    marginBottom: "10px",
  },
  input: {
    width: "100%",
    height: "38px",
    padding: "0px 8px",
    borderRadius: "6px",
    border: "1px solid #d3d3d3",
    backgroundColor: "#ffffff",
    fontSize: "14px",
    marginBottom: "10px",
  },
  button: {
    width: "100%",
    height: "36px",
    backgroundColor: "#16c76c",
    color: "#ffffff",
    fontSize: "14px",
    fontWeight: "700",
    borderRadius: "5px",
    border: "none",
    cursor: "pointer",
    marginTop: "10px",
  },
  reportCard: {
    backgroundColor: "#ffffff",
    borderRadius: "8px",
    padding: "16px",
    marginBottom: "16px",
    boxShadow: "0px 4px 6px rgba(0,0,0,0.1)",
    cursor: "pointer",
    textAlign: "left",
  },
  reportImage: {
    width: "100%",
    height: "160px",
    backgroundColor: "#e0e0e0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "14px",
    color: "#777",
    marginTop: "10px",
  },
  exportButtons: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: "20px",
  },
  filterGroup: {
    marginBottom: "16px",
  },
};

const ReportCard = ({ title, description, date }) => (
  <div
    style={styles.reportCard}
    onClick={() => alert(`Abriendo detalle de ${title} (simulado)`)}
  >
    <h3 style={styles.title}>{title}</h3>
    <div style={{ fontSize: "12px", color: "#555" }}>{date}</div>
    <div style={{ fontSize: "14px", marginTop: "4px" }}>{description}</div>
    <div style={styles.reportImage}>
      📊 Gráfico aquí (pendiente integración)
    </div>
  </div>
);

const Reportes = () => {
  // Estados de filtros
  const [periodType, setPeriodType] = useState("Día"); // "Día", "Mes" o "Año"
  const [period, setPeriod] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  // Lista simulada de reportes
  const initialReports = [
    { id: 1, title: "Uso Mensual", description: "Resumen del uso mensual", date: "2023-11-01" },
    { id: 2, title: "Tendencias de Uso Anual", description: "Análisis anual de tendencias", date: "2023-10-15" },
    { id: 3, title: "Uso por Ubicación", description: "Reporte de uso según ubicación", date: "2023-09-30" },
    { id: 4, title: "Usuarios Destacados", description: "Principales usuarios del mes", date: "2023-08-20" },
  ];
  const [reports, setReports] = useState(initialReports);
  const [filteredReports, setFilteredReports] = useState(initialReports);

  // Función para aplicar filtros según el tipo de período y búsqueda
  const handleApplyFilters = () => {
    let filtered = reports;

    if (period) {
      if (periodType === "Día") {
        // Se requiere coincidencia exacta
        filtered = filtered.filter((r) => r.date === period);
      } else if (periodType === "Mes") {
        // El input tipo month retorna "YYYY-MM"
        filtered = filtered.filter((r) => r.date.startsWith(period));
      } else if (periodType === "Año") {
        // Se espera solo el año, p.ej "2023"
        filtered = filtered.filter((r) => r.date.startsWith(period));
      }
    }
    if (searchTerm) {
      filtered = filtered.filter(
        (r) =>
          r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredReports(filtered);
  };

  const handleExportPDF = () => {
    alert("Exportando reportes en PDF (simulado)!");
  };

  const handleExportExcel = () => {
    alert("Exportando reportes en Excel (simulado)!");
  };

  return (
    <Screen>
      <div style={styles.container}>
        <h3 style={styles.title}>Reportes</h3>

        {/* Filtro: Tipo de período */}
        <div style={styles.filterGroup}>
          <select
            style={styles.input}
            value={periodType}
            onChange={(e) => {
              setPeriodType(e.target.value);
              setPeriod(""); // Limpiar el campo cuando se cambie el tipo
            }}
          >
            <option value="Día">Día</option>
            <option value="Mes">Mes</option>
            <option value="Año">Año</option>
          </select>
        </div>

        {/* Filtro: Período según tipo */}
        <div style={styles.filterGroup}>
          {periodType === "Día" && (
            <input
              style={styles.input}
              placeholder="Seleccionar fecha"
              type="date"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
            />
          )}
          {periodType === "Mes" && (
            <input
              style={styles.input}
              placeholder="Seleccionar mes"
              type="month"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
            />
          )}
          {periodType === "Año" && (
            <input
              style={styles.input}
              placeholder="Ingresar año (YYYY)"
              type="number"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
            />
          )}
        </div>

        {/* Filtro: Búsqueda */}
        <input
          style={styles.input}
          placeholder="Buscar cliente o bolsa"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <button style={styles.button} onClick={handleApplyFilters}>
          Aplicar Filtros
        </button>

        {/* Listado de Report Cards */}
        {filteredReports.length > 0 ? (
          filteredReports.map((report) => (
            <ReportCard
              key={report.id}
              title={report.title}
              description={report.description}
              date={report.date}
            />
          ))
        ) : (
          <div style={{ marginTop: "16px", color: "#94a3b8" }}>
            No se encontraron reportes
          </div>
        )}

        {/* Botones de Exportación */}
        <div style={styles.exportButtons}>
          <button style={styles.button} onClick={handleExportPDF}>
            Exportar en PDF
          </button>
          <button style={styles.button} onClick={handleExportExcel}>
            Exportar en Excel
          </button>
        </div>
      </div>
    </Screen>
  );
};

export default Reportes;
