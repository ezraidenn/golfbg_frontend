// Card.jsx
import React from "react";

const styles = {
  card: {
    // Eliminamos 'top' y 'left'
    // y dejamos que el Card se adapte al ancho de su contenedor
    width: "100%",
    backgroundColor: "#7cd6a7",
    borderRadius: "2px",
    boxShadow: "0px 10px 15px rgba(0,0,0,0.1)",
    padding: "16px",       // Espacio interno
    marginBottom: "16px",  // Separación con otros elementos
  },
};

const Card = ({ children }) => {
  return <div style={styles.card}>{children}</div>;
};

export default Card;
