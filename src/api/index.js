// src/api/index.js
import { getApiEndpoint } from '../config';

const BASE_URL = getApiEndpoint('');

export async function loginUser(username, password) {
  console.log("En loginUser, username:", username, "password:", password); // DEBUG
  try {
    const response = await fetch(getApiEndpoint('/usuarios/login'), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();
    console.log("Respuesta del servidor:", JSON.stringify(data, null, 2)); // Mejor formato

    if (!response.ok) {
      if (data.detail && Array.isArray(data.detail)) {
        throw new Error(data.detail[0]?.msg || "Error en el login");
      }
      throw new Error(data.detail || "Error en el login");
    }

    return data;
  } catch (error) {
    console.error("Error completo:", error.message);
    throw error;
  }
}

export async function fetchNotifications(limit = 20) {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No hay token");

  console.log("Fetching notifications with token:", token); // Debug

  const response = await fetch(getApiEndpoint(`/notifications/my?limit=${limit}`), {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    }
  });

  console.log("Response status:", response.status); // Debug

  if (!response.ok) {
    if (response.status === 401) {
      console.warn("Token inválido/expirado");
      localStorage.removeItem("token");
      localStorage.removeItem("loggedIn");
      window.location.href = "/login";
      throw new Error("Sesión expirada");
    }
    throw new Error(`Error ${response.status}`);
  }

  const data = await response.json();
  console.log("Notifications data:", data); // Debug
  return data;
}

// Función para obtener el perfil del usuario
export async function fetchUserProfile() {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No hay token");

  const response = await fetch(getApiEndpoint('/usuarios/me'), {
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("loggedIn");
      window.location.href = "/login";
      throw new Error("Sesión expirada");
    }
    throw new Error(`Error ${response.status}`);
  }

  return response.json();
}

// Función para actualizar el perfil del usuario
export async function updateUserProfile(data) {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No hay token");

  const response = await fetch(getApiEndpoint('/usuarios/profile'), {
    method: "PUT",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("loggedIn");
      window.location.href = "/login";
      throw new Error("Sesión expirada");
    }
    throw new Error(`Error ${response.status}`);
  }

  return response.json();
}
