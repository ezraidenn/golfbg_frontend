import { decodeJwt } from "./jwtUtils";
import { API_URL } from '../utils/api';

const BASE_URL = API_URL;          // usa tu base global

function handleSessionExpired(message) {
  if (localStorage.getItem("token")) {             // evita bucle infinito
    localStorage.removeItem("token");
    alert(message);                                // o tu sistema de toast
    window.location.replace("/login");
  }
}

export async function authFetch(endpoint, options = {}) {
  const token = localStorage.getItem("token");
  const headers = { "Content-Type": "application/json", ...options.headers };
  if (token) headers.Authorization = `Bearer ${token}`;

  /* ---------- Comprobación en el cliente ---------- */
  if (token) {
    const payload = decodeJwt(token);
    if (payload?.exp && Date.now() / 1000 > payload.exp) {
      handleSessionExpired("Tu sesión expiró. Inicia sesión nuevamente.");
      throw new Error("JWT expirado (cliente)");
    }
  }

  /* ---------- Llamada real ---------- */
  const res = await fetch(endpoint.startsWith("http") ? endpoint
                                                      : `${BASE_URL}${endpoint}`,
                         { ...options, headers });

  /* ---------- Comprobación en el servidor ---------- */
  if (res.status === 401 || res.status === 403) {
    handleSessionExpired("Tu sesión expiró. Inicia sesión nuevamente.");
    throw new Error("JWT expirado (server)");
  }

  return res;
}
