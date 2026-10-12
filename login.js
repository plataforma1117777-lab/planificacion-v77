
document.addEventListener('DOMContentLoaded', () => {
    // Comprobar si ya está logueado en esta sesión
    if (sessionStorage.getItem('isLoggedIn') === 'true') {
        mostrarApp();
    } else {
        document.getElementById('login-screen').style.display = 'flex';
        document.getElementById('main-app').style.display = 'none';
    }

    // Toggle de visibilidad de contraseña
    const toggleBtn = document.getElementById('toggle-password');
    const passInput = document.getElementById('login-password');

    if (toggleBtn && passInput) {
        toggleBtn.addEventListener('click', () => {
            if (passInput.type === 'password') {
                passInput.type = 'text';
                toggleBtn.textContent = '🔒';
                toggleBtn.title = 'Ocultar contraseña';
            } else {
                passInput.type = 'password';
                toggleBtn.textContent = '👁️';
                toggleBtn.title = 'Mostrar contraseña';
            }
        });
    }

    // Permitir ingreso con tecla Enter
    if (passInput) {
        passInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                verificarLogin();
            }
        });
    }
});

async function verificarLogin() {
    const passInput = document.getElementById('login-password');
    const errorDiv = document.getElementById('login-error');
    const password = passInput.value.trim();

    // Resetear mensaje de error
    errorDiv.style.color = '#f87171';
    errorDiv.textContent = '';

    if (!password) {
        errorDiv.textContent = 'Por favor, ingrese una contraseña.';
        passInput.focus();
        return;
    }

    try {
        errorDiv.textContent = 'Verificando...';
        
        const response = await fetch('/.netlify/functions/verify-login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ password })
        });

        if (!response.ok) {
            throw new Error('Error en la comunicación con el servidor');
        }

        const data = await response.json();

        if (data.valid) {
            // Acceso correcto
            errorDiv.style.color = 'var(--accent-light)';
            errorDiv.textContent = '¡Acceso correcto! Ingresando...';

            // Guardar estado en sesión
            sessionStorage.setItem('isLoggedIn', 'true');

            // Transición de salida
            const loginScreen = document.getElementById('login-screen');
            setTimeout(() => {
                loginScreen.style.opacity = '0';
                setTimeout(() => {
                    mostrarApp();
                    loginScreen.style.display = 'none';
                    loginScreen.style.opacity = '1'; // Reset para futuro
                }, 500);
            }, 500);
        } else {
            // Acceso denegado
            errorDiv.style.color = '#f87171';
            errorDiv.textContent = 'Contraseña incorrecta. Intente nuevamente.';
            passInput.value = '';
            passInput.focus();
        }
    } catch (error) {
        console.error('Error al verificar login:', error);
        errorDiv.style.color = '#f87171';
        errorDiv.textContent = 'Error al verificar la contraseña. Intente más tarde.';
    }
}

function mostrarApp() {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('main-app').style.display = 'block';

    // Opcional: enfocar en el primer campo de la app si lo desea
    // const primerInput = document.getElementById('distrito');
    // if(primerInput) primerInput.focus();
}
