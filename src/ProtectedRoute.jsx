// src/ProtectedRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";

/* -------------------------------------------------
 *  Utilidad local para decodificar el payload JWT
 * -------------------------------------------------*/
function decodeJwt(token) {
  if (!token) return null;
  try {
    const payload = token.split(".")[1];
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/* -------------------------------------------------
 *  Hook-less componente de ruta protegida
 * -------------------------------------------------*/
function ProtectedRoute({ children }) {
  const token   = localStorage.getItem("token");
  const logged  = localStorage.getItem("loggedIn") === "true";
  const payload = decodeJwt(token);
  const expired = payload?.exp && Date.now() / 1000 > payload.exp;

  // Si no hay token o está vencido → cerrar sesión
  if (!token || expired) {
    localStorage.removeItem("token");
    localStorage.removeItem("loggedIn");
    if (expired) alert("Tu sesión expiró. Inicia sesión nuevamente.");
    return <Navigate to="/login" replace />;
  }

  // (back‑compat) si alguien borró loggedIn manualmente
  if (!logged) localStorage.setItem("loggedIn", "true");

  // Autenticado y con token válido → renderiza
  return children;
}

export default ProtectedRoute;
