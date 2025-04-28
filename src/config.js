// Configuración de la API
// Variable para almacenar la IP del servidor
let serverIP = '10.0.0.49'; // IP fija del servidor

// Función para obtener la URL base de la API
export function getApiUrl() {
    return `http://${serverIP}:7734`;
}

// Función para obtener la URL completa de la API con un endpoint
export function getApiEndpoint(endpoint) {
    return `${getApiUrl()}${endpoint}`;
}

// Función para obtener la URL de imágenes
export function getImageUrl(imagePath) {
    return `${getApiUrl()}/static/${imagePath}`;
}
