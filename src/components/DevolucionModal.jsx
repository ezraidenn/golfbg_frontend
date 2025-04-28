import React from "react";

/**
 * Este componente es un modal de confirmación.
 * Recibe dos props:
 *   - onConfirm: función que se ejecuta cuando se confirma la devolución.
 *   - onCancel: función que se ejecuta cuando se cancela la acción.
 */
function DevolucionModal({ onConfirm, onCancel }) {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(0,0,0,0.5)", // Fondo semitransparente
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
      }}
    >
      {/* Contenedor principal del modal */}
      <div
        style={{
          backgroundColor: "#fff",
          padding: "20px",
          borderRadius: "4px",
          minWidth: "300px",
          textAlign: "center",
        }}
      >
        <h2>¿Estás seguro de devolver la bolsa?</h2>

        <div
          style={{
            marginTop: "20px",
            display: "flex",
            gap: "20px",
            justifyContent: "center",
          }}
        >
          <button
            onClick={onConfirm}
            style={{
              cursor: "pointer",
              width: "120px",
              height: "40px",
              backgroundColor: "#16c76c",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              fontWeight: "bold",
            }}
          >
            Confirmar
          </button>

          <button
            onClick={onCancel}
            style={{
              cursor: "pointer",
              width: "120px",
              height: "40px",
              backgroundColor: "#ff2d55",
              color: "#000",
              border: "none",
              borderRadius: "4px",
              fontWeight: "bold",
            }}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

export default DevolucionModal;
