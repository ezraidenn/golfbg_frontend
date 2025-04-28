// src/App.jsx
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  Navigate,
} from "react-router-dom";

import Header from "./components/Header";
import Footer from "./components/Footer";

// Pantallas / componentes
import Login from "./components/Login";
import Home from "./components/Home";
import ConsultarBolsa from "./components/ConsultarBolsa";
import Historial from "./components/Historial";
import Configuracion from "./components/Configuracion";
import PrestamoDevolucion from "./components/PrestamoDevolucion";
import Reportes from "./components/Reportes";
import Mantenimientos from "./components/Mantenimientos";
import MiPerfil from "./components/MiPerfil";
import Alerta from "./components/Alerta";
import CrearModificarBolsa from "./components/CrearModificarBolsa";
import ShelfToSheet from "./components/ShelfToSheet";
import EditarAlmacen from "./components/EditarAlmacen";

import ProtectedRoute from "./ProtectedRoute";        // ← usa el nuevo
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

/* -------------------------------------------------
 *  Layout principal con Header / Footer
 * -------------------------------------------------*/
function AppContent() {
  const location = useLocation();
  const showHF   = location.pathname.toLowerCase() !== "/login";

  const containerStyle = {
    margin     : "0 auto",
    width      : "100%",
    maxWidth   : "375px",
    minHeight  : "100vh",
    position   : "relative",
    overflowX  : "hidden",
  };

  const contentStyle = {
    paddingTop    : showHF ? "64px" : 0,
    paddingBottom : showHF ? "64px" : 0,
  };

  return (
    <div style={containerStyle}>
      {showHF && <Header />}

      <div style={contentStyle}>
        <Routes>
          {/* ---------- pública ---------- */}
          <Route path="/login" element={<Login />} />

          {/* ---------- protegidas ---------- */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />
          <Route
            path="/consultar-bolsa"
            element={
              <ProtectedRoute>
                <ConsultarBolsa />
              </ProtectedRoute>
            }
          />
          <Route
            path="/historial"
            element={
              <ProtectedRoute>
                <Historial />
              </ProtectedRoute>
            }
          />
          <Route
            path="/configuracion"
            element={
              <ProtectedRoute>
                <Configuracion />
              </ProtectedRoute>
            }
          />
          <Route
            path="/prestamo-devolucion"
            element={
              <ProtectedRoute>
                <PrestamoDevolucion />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reportes"
            element={
              <ProtectedRoute>
                <Reportes />
              </ProtectedRoute>
            }
          />
          <Route
            path="/mantenimientos"
            element={
              <ProtectedRoute>
                <Mantenimientos />
              </ProtectedRoute>
            }
          />
          <Route
            path="/miperfil"
            element={
              <ProtectedRoute>
                <MiPerfil />
              </ProtectedRoute>
            }
          />
          <Route
            path="/alerta"
            element={
              <ProtectedRoute>
                <Alerta />
              </ProtectedRoute>
            }
          />
          <Route
            path="/crearmodificarbolsa"
            element={
              <ProtectedRoute>
                <CrearModificarBolsa />
              </ProtectedRoute>
            }
          />
          <Route
            path="/shelf-to-sheet"
            element={
              <ProtectedRoute>
                <ShelfToSheet />
              </ProtectedRoute>
            }
          />
          <Route
            path="/editar-almacen"
            element={
              <ProtectedRoute>
                <EditarAlmacen />
              </ProtectedRoute>
            }
          />
          {/* Fallback 404 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>

      {showHF && <Footer />}
    </div>
  );
}

/* -------------------------------------------------
 *  Enrutador raíz
 * -------------------------------------------------*/
function App() {
  return (
    <>
      <ToastContainer position="top-right" />
      <Router>
        <AppContent />
      </Router>
    </>
  );
}

export default App;
