// src/components/Screen.jsx
import React from "react";

const styles = {
  Screen: {
    backgroundColor: "#ffffff",
    minHeight: "100vh",
    paddingBottom: "70px",      // Espacio extra para el Footer fijo
    paddingLeft: "16px",        // Padding horizontal para evitar que el contenido toque el borde
    paddingRight: "16px",
    boxSizing: "border-box",
    width: "100%",              // Ocupa todo el ancho disponible
    margin: 0,
    overflowX: "hidden",        // Evita scroll horizontal
  },
};

const Screen = (props) => {
  return <div style={styles.Screen}>{props.children}</div>;
};

export default Screen;
