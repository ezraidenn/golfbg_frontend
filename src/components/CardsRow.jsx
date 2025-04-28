import React from "react";

const containerStyle = {
  display: "flex",
  gap: "8px",
  justifyContent: "center", // para centrar las 3 tarjetas horizontalmente
  marginTop: "20px",
};

const cardStyle = {
  width: "104px",
  height: "180px",
  borderRadius: "2px",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: "8px",
  boxSizing: "border-box",
};

const titleSmallStyle = {
  color: "#030303",
  fontSize: "14px",
  fontFamily: "Poppins",
  fontWeight: 700,
  lineHeight: "18px",
  textAlign: "center",
  marginBottom: "8px",
};

const numberStyle = {
  color: "#030303",
  fontSize: "24px",
  fontFamily: "Poppins",
  fontWeight: 700,
  lineHeight: "32px",
  textAlign: "center",
};

const alertTitleStyle = {
  color: "#030303",
  fontSize: "20px",
  fontFamily: "Poppins",
  fontWeight: 700,
  lineHeight: "28px",
  textAlign: "center",
  marginBottom: "8px",
};

const alertTextStyle = {
  color: "#030303",
  fontSize: "14px",
  fontFamily: "Poppins",
  lineHeight: "20px",
  textAlign: "center",
};

// Este componente renderiza las 3 tarjetas
function CardsRow() {
  return (
    <div style={containerStyle}>
      {/* Tarjeta 1 */}
      <div style={{ ...cardStyle, backgroundColor: "#7cd6a7" }}>
        <div style={titleSmallStyle}>Bolsas Disponibles</div>
        <div style={numberStyle}>15</div>
      </div>

      {/* Tarjeta 2 */}
      <div style={{ ...cardStyle, backgroundColor: "#7cd6a7" }}>
        <div style={titleSmallStyle}>Bolsas en Préstamo</div>
        <div style={numberStyle}>8</div>
      </div>

      {/* Tarjeta 3 (Alerta) */}
      <div style={{ ...cardStyle, backgroundColor: "#ffcccb" }}>
        <div style={alertTitleStyle}>Alerta</div>
        <div style={alertTextStyle}>
          2 Bolsas debieron devolverse
          <br />
          hace más de 8 horas
        </div>
      </div>
    </div>
  );
}

export default CardsRow;
