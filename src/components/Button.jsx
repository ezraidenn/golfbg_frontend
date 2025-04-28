// Button.jsx
import React from "react";

const styles = {
  button: {
    cursor: "pointer",
    width: "100%",        // El 100% del contenedor (o cámbialo según prefieras)
    height: "44px",
    padding: "0px 8px",
    border: "0",
    boxSizing: "border-box",
    borderRadius: "2px",
    backgroundColor: "#ff2d55",
    color: "#000000",
    fontSize: "18px",
    fontFamily: "Poppins",
    fontWeight: 700,
    lineHeight: "28px",
    outline: "none",
    marginTop: "10px",    // Pequeño margen superior
  },
};

const Button = ({ label, onClick }) => {
  return (
    <button style={styles.button} onClick={onClick}>
      {label ?? "Registrar Devolución"}
    </button>
  );
};

export default Button;
