// src/utils/api.js
import { getApiUrl, getApiEndpoint } from '../config';

// Exportar la URL base para compatibilidad con el código existente
export const API_URL = getApiUrl();

// Función para obtener la URL completa de un endpoint
export function getFullUrl(endpoint) {
    return getApiEndpoint(endpoint);
}

// Función para obtener la URL base
export function getBaseUrl() {
    return API_URL;
}
