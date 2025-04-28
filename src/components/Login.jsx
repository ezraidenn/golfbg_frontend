// src/components/Login.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// Asegúrate que la ruta a tu función API sea correcta
// Si loginUser no está definida o importada, descomenta y adapta el placeholder
import { loginUser } from '../api';

/*
// --- Placeholder de la función API (si no se importa) ---
// ¡Reemplaza esto con tu importación real desde '../api'!
const loginUser = async (username, password) => {
    console.log("Simulando login con:", username, password);
    // Simula una llamada API con delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    // Simula respuesta del backend
    if (username === "admin" && password === "12345") {
        return { access_token: "simulated-jwt-token-" + Date.now() };
    } else {
        // Simula error de credenciales incorrectas
        const error = new Error("Credenciales incorrectas (simulado)");
        error.response = { // Simula estructura de error de fetch o axios
            status: 401,
            json: async () => ({ detail: "Credenciales incorrectas (simulado)" }) // Simula método json
        };
        throw error;
    }
};
// --- Fin Placeholder ---
*/

// --- Componente Principal: Login ---
const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    // Limpiar error al escribir
    useEffect(() => {
        if (username || password) setError('');
    }, [username, password]);

    const handleUsernameChange = (e) => setUsername(e.target.value);
    const handlePasswordChange = (e) => setPassword(e.target.value);
    const toggleShowPassword = () => setShowPassword(!showPassword);

    // Manejar envío del formulario (login)
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!username || !password) {
            setError("Ingresa usuario y contraseña.");
            return;
        }
        setLoading(true);

        try {
            // Llama a la función API importada
            const data = await loginUser(username, password);
            console.log('Respuesta del backend (login):', data);

            if (data && data.access_token) {
                localStorage.setItem("token", data.access_token);
                localStorage.setItem("loggedIn", "true"); // Opcional
                navigate("/"); // Redirigir a la ruta principal (o dashboard)
            } else {
                // Si la API responde OK pero sin token (inesperado)
                throw new Error("Respuesta inesperada del servidor.");
            }
        } catch (err) {
            console.error('Error al iniciar sesión:', err);
            let errorMessage = 'Error de conexión o credenciales inválidas.';
            // Intentar obtener el mensaje 'detail' del backend si está disponible
            if (err.response && typeof err.response.json === 'function') {
                try {
                    const errorData = await err.response.json();
                    errorMessage = errorData.detail || errorMessage;
                } catch (parseError) {
                    // Mantener mensaje genérico si no se puede parsear el error JSON
                }
            } else if (err.message) {
                 errorMessage = err.message; // Usar mensaje del error JS si existe
            }
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Placeholder "Olvidé contraseña"
    const handleForgotPassword = () => {
        alert('Funcionalidad "Olvidé mi contraseña" no implementada.');
    };

    return (
        <div style={styles.page}>
            <div style={styles.card}>
                {/* Logo */}
                <img
                    // Usa una URL válida o importa la imagen
                    src="https://assets.api.uizard.io/api/cdn/stream/af632d60-8040-4a59-9e5b-974783d719a7.svg"
                    alt="Logo Empresa"
                    style={styles.logo}
                />

                <h2 style={styles.title}>Inicio de sesión</h2>

                <form onSubmit={handleSubmit} style={styles.form}>
                    {/* Grupo Usuario */}
                    <div style={styles.formGroup}>
                        <label htmlFor="login-username" style={styles.label}>
                            Nombre de usuario
                        </label>
                        <input
                            type="text"
                            id="login-username"
                            style={styles.input}
                            placeholder="Tu nombre de usuario"
                            value={username}
                            onChange={handleUsernameChange}
                            disabled={loading}
                            autoComplete="username"
                            required // Campo requerido
                        />
                    </div>

                    {/* Grupo Contraseña */}
                    <div style={styles.formGroup}>
                        <label htmlFor="login-password" style={styles.label}>
                            Contraseña
                        </label>
                        <div style={styles.passwordInputContainer}>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                id="login-password"
                                style={styles.input}
                                placeholder="Tu contraseña"
                                value={password}
                                onChange={handlePasswordChange}
                                disabled={loading}
                                autoComplete="current-password"
                                required // Campo requerido
                            />
                            <button
                                type="button"
                                onClick={toggleShowPassword}
                                style={styles.eyeButton}
                                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                                disabled={loading}
                                title={showPassword ? "Ocultar" : "Mostrar"} // Tooltip
                            >
                                {/* Ícono SVG */}
                                <svg style={styles.eyeIcon} viewBox="0 0 576 512">
                                    {/* Path original del ojo */}
                                    <path fill="currentColor" d="M572.52 241.4C518.29 135.59 410.93 64 288 64S57.68 135.64 3.48 241.41a32.35 32.35 0 0 0 0 29.19C57.71 376.41 165.07 448 288 448s230.32-71.64 284.52-177.41a32.35 32.35 0 0 0 0-29.19zM288 400a144 144 0 1 1 144-144 143.93 143.93 0 0 1-144 144zm0-240a95.31 95.31 0 0 0-25.31 3.79 47.85 47.85 0 0 1-66.9 66.9A95.78 95.78 0 1 0 288 160z"/>
                                    {/* Opcional: Añadir línea diagonal si showPassword es true para simular "tachado" */}
                                    {/* Esto requeriría otro path SVG o lógica adicional */}
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Mensaje de Error */}
                    {error && (
                        <p role="alert" style={styles.errorMessage}>
                            {error}
                        </p>
                    )}

                    {/* Botón de Login */}
                    <button
                        type="submit"
                        style={styles.loginButton}
                        disabled={loading}
                    >
                        {loading ? 'Ingresando...' : 'Login'}
                    </button>
                </form>

                {/* Enlace Olvidé Contraseña */}
                <div style={styles.forgotPasswordContainer}>
                    <button onClick={handleForgotPassword} style={styles.forgotPasswordButton} disabled={loading}>
                        ¿Olvidaste tu contraseña?
                    </button>
                    {/* No hay botón de Crear Cuenta */}
                </div>
            </div>
        </div>
    );
};

// --- Estilos (Flexbox y mejorados) ---
const styles = {
    page: {
        margin: 0, padding: '20px', width: '100%', minHeight: '100vh',
        backgroundColor: '#f0f2f5', display: 'flex', justifyContent: 'center',
        alignItems: 'center', fontFamily: "'Poppins', sans-serif", boxSizing: 'border-box',
    },
    card: {
        width: '100%', maxWidth: '400px', backgroundColor: '#ffffff',
        borderRadius: '10px', boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
        padding: '35px 30px', display: 'flex', flexDirection: 'column',
        gap: '20px', boxSizing: 'border-box',
    },
    logo: {
        width: '150px', height: 'auto', alignSelf: 'center', marginBottom: '15px',
    },
    title: {
        textAlign: 'center', color: '#2d3748', fontSize: '22px',
        fontWeight: '600', marginBottom: '10px',
    },
    form: {
        width: '100%', display: 'flex', flexDirection: 'column', gap: '15px',
    },
    formGroup: {
        display: 'flex', flexDirection: 'column', gap: '5px',
    },
    label: {
        color: '#4a5568', fontSize: '13px', fontWeight: '500',
    },
    input: {
        width: '100%', height: '42px', padding: '0 12px',
        border: '1px solid #cbd5e0', boxSizing: 'border-box',
        borderRadius: '6px', backgroundColor: '#ffffff', color: '#2d3748',
        fontSize: '14px', outline: 'none', transition: 'border-color 0.2s ease',
    },
    passwordInputContainer: {
        position: 'relative', width: '100%',
    },
    eyeButton: {
        position: 'absolute', top: '50%', right: '10px', transform: 'translateY(-50%)',
        background: 'none', border: 'none', padding: '5px', cursor: 'pointer',
        color: '#a0aec0', // Icono gris claro
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        lineHeight: '1', '&:hover': { color: '#4a5568'}, // Oscurecer al pasar mouse (CSS real)
    },
    eyeIcon: {
        width: '18px', height: '18px',
    },
    errorMessage: {
        color: '#c53030', // Rojo oscuro
        backgroundColor: '#fed7d7', border: '1px solid #fbb6ce',
        borderRadius: '6px', padding: '10px 12px', fontSize: '13px',
        textAlign: 'center', marginTop: '5px', // Espacio arriba
    },
    loginButton: {
        width: '100%', height: '42px', padding: '0 8px', border: '0',
        boxSizing: 'border-box', borderRadius: '6px',
        backgroundColor: '#2b6cb0', // Azul corporativo
        color: '#ffffff', fontSize: '15px', fontWeight: '600',
        lineHeight: '20px', outline: 'none', cursor: 'pointer',
        transition: 'background-color 0.2s ease, opacity 0.2s ease',
        // Simulación hover/disabled (mejor con clases CSS)
        // '&:hover': { backgroundColor: '#2c5282' },
        // '&:disabled': { backgroundColor: '#a0aec0', cursor: 'not-allowed', opacity: 0.7 },
    },
    forgotPasswordContainer: {
        textAlign: 'center', marginTop: '15px',
    },
    forgotPasswordButton: {
        background: 'none', border: 'none', color: '#4299e1', // Azul enlace
        fontSize: '13px', cursor: 'pointer', padding: '5px',
        // '&:hover': { textDecoration: 'underline' }, // Simulación hover
    },
};

export default Login;