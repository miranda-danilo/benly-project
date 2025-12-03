import { setupRegistrationForm } from "./app/registro.js";
import { showMessage } from "./app/notificaciones.js";
import { setupGoogleLogin } from "./app/inicio_sesion_google.js";
import { setupSignInForm } from "./app/inicio_sesion_correo.js";
import { stateChanged } from "./app/checkLogin.js";

const functions = require('firebase-functions');
const { GoogleGenAI } = require("@google/genai");



document.addEventListener("DOMContentLoaded", () => {
    // Llama a la función que configura el formulario de registro.
    // Esto asegura que el listener se añade una vez que el formulario existe en el DOM.
    setupRegistrationForm();
    setupGoogleLogin()
    setupSignInForm()
    stateChanged()
    
});


document.addEventListener('DOMContentLoaded', () => {

    const burgerMenu = document.querySelector('.header__burger-menu');
    const headerNav = document.querySelector('.header__nav');
    const headerLinks = document.querySelectorAll('.header__link');

    // Toggle para el menú de hamburguesa
    burgerMenu.addEventListener('click', () => {
        burgerMenu.classList.toggle('active');
        headerNav.classList.toggle('active');
        document.body.classList.toggle('no-scroll'); // Opcional: para evitar scroll en mobile
    });

    // Cerrar el menú al hacer clic en un enlace (en móvil)
    headerLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (headerNav.classList.contains('active')) {
                burgerMenu.classList.remove('active');
                headerNav.classList.remove('active');
                document.body.classList.remove('no-scroll');
            }
        });
    });

    // Animaciones al hacer scroll
    const animatedElements = document.querySelectorAll('.animate__animated');

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.visibility = 'visible';
                const delay = entry.target.dataset.delay || '0s';
                entry.target.style.animationDelay = delay;
                entry.target.classList.add('visible'); // Clase para activar la animación
                observer.unobserve(entry.target);
            }
        });
    }, {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    });

    animatedElements.forEach(element => {
        element.style.visibility = 'hidden';
        element.classList.add('animate__fadeInUp'); // Ejemplo de animación
        // Puedes asignar diferentes animaciones a diferentes elementos si lo deseas
        // element.classList.add('animate__fadeInLeft');
        // element.classList.add('animate__fadeInRight');
        observer.observe(element);
    });
});


// Agrega este código al final de tu archivo index.js
document.addEventListener('DOMContentLoaded', () => {

    const burgerMenu = document.querySelector('.header__burger-menu');
    const headerNav = document.querySelector('.header__nav');
    const headerLinks = document.querySelectorAll('.header__link');

    // ... (Tu código existente aquí) ...

    // --- Lógica para los Modales ---

    const loginButton = document.querySelector('.header__button--login');
    const registerButton = document.querySelector('.header__button--register');
    
    const signInModal = document.getElementById('signin-modal');
    const signUpModal = document.getElementById('signup-modal');

    const closeLoginButton = document.querySelector('.close-modal-login');
    const closeSignupButton = document.querySelector('.close-modal-signup');
    




 










    
    // Abrir modal de inicio de sesión
    loginButton.addEventListener('click', (e) => {
        e.preventDefault();
        signInModal.showModal();
    });

    // Abrir modal de registro
    registerButton.addEventListener('click', (e) => {
        e.preventDefault();
        signUpModal.showModal();
    });

    // Cerrar modal de inicio de sesión
    closeLoginButton.addEventListener('click', () => {
        signInModal.close();
    });

    // Cerrar modal de registro
    closeSignupButton.addEventListener('click', () => {
        signUpModal.close();
    });

    // Opcional: Cerrar el modal haciendo clic fuera de él
    signInModal.addEventListener('click', (e) => {
        if (e.target === signInModal) {
            signInModal.close();
        }
    });

    signUpModal.addEventListener('click', (e) => {
        if (e.target === signUpModal) {
            signUpModal.close();
        }
    });
});




// La clave de API se obtiene de forma segura de las variables de entorno de Firebase.
// Ejecuta: firebase functions:config:set gemini.key="TU_NUEVA_API_KEY_AQUI"
const apiKey = functions.config().gemini.key; 

if (!apiKey) {
    functions.logger.error("La clave de API de Gemini no está configurada en las variables de entorno.");
}

const ai = new GoogleGenAI({ apiKey });

/**
 * Endpoint HTTP para corregir la escritura utilizando la API de Gemini.
 * Se ejecuta de forma segura en el lado del servidor.
 */
exports.correctWriting = functions.https.onRequest(async (request, response) => {
    // 1. Configuración de CORS (si tu frontend está en un dominio diferente)
    response.set('Access-Control-Allow-Origin', '*'); 
    if (request.method === 'OPTIONS') {
        response.set('Access-Control-Allow-Methods', 'POST');
        response.set('Access-Control-Allow-Headers', 'Content-Type');
        response.set('Access-Control-Max-Age', '3600');
        return response.status(204).send('');
    }

    if (request.method !== 'POST') {
        return response.status(405).send({ error: "Método no permitido" });
    }

    const { sentence } = request.body;

    if (!sentence) {
        return response.status(400).send({ error: "Falta la oración (sentence)." });
    }

    const prompt = `Actúa como un corrector de oraciones en inglés. Analiza la siguiente oración y determina si es gramaticalmente correcta. Si es correcta, devuelve un JSON con el estado "Correcta". Si es incorrecta, devuelve un JSON con el estado "Incorrecta", la versión corregida de la oración y una explicación clara y concisa de los errores en español.
        Oración: "${sentence}"
        Ejemplo de JSON correcto:
        {
            "status": "Correcta"
        }
        Ejemplo de JSON incorrecto:
        {
            "status": "Incorrecta",
            "corrected_sentence": "The man goes to the store.",
            "explanation": "El verbo 'go' debe estar en su forma 'goes' para concordar con el sujeto 'the man' en tercera persona del singular."
        }`;

    const payload = {
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: { // Usar 'config' en el SDK de JS, no 'generationConfig'
            responseMimeType: "application/json",
            responseSchema: {
                type: "OBJECT",
                properties: {
                    status: { type: "STRING" },
                    corrected_sentence: { type: "STRING", description: "Only required if status is 'Incorrecta'" },
                    explanation: { type: "STRING", description: "Only required if status is 'Incorrecta'" }
                },
                required: ["status"]
            }
        }
    };

    try {
        const genaiResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash", // Modelo estable
            ...payload // Incluye contents y config
        });
        
        // 3. Parsear y devolver el resultado limpio al frontend
        const rawResult = genaiResponse.text;
        const parsedResult = JSON.parse(rawResult);
        
        // Devolver el JSON directamente al frontend
        return response.status(200).json(parsedResult);

    } catch (error) {
        functions.logger.error("Error al llamar a la API de Gemini:", error);
        // Devolver un error 500 al frontend si falla la llamada a la API
        return response.status(500).send({ error: "Error interno del servidor al procesar la corrección.", details: error.message });
    }
});
