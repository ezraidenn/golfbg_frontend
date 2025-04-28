import React, { useEffect } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";

const ScannerQR = ({ onResult, onClose }) => {
  useEffect(() => {
    const scanner = new Html5QrcodeScanner("reader", {
      fps: 10,
      qrbox: 250,
    });

    scanner.render(
      (decodedText) => {
        scanner.clear().then(() => {
          onResult(decodedText);
        });
      },
      (error) => {
        console.warn("Escaneo fallido:", error);
      }
    );

    return () => {
      scanner.clear().catch((e) => console.error("Error limpiando scanner:", e));
    };
  }, [onResult]);

  return (
    <div style={{ zIndex: 9999 }}>
      <div id="reader" />
      <button onClick={onClose}>Cancelar</button>
    </div>
  );
};

export default ScannerQR;
