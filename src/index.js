import { setupRegistrationForm } from "./app/registro.js";
import { showMessage } from "./app/notificaciones.js";
import { setupGoogleLogin } from "./app/inicio_sesion_google.js";
import { setupSignInForm } from "./app/inicio_sesion_correo.js";
import { stateChanged } from "./app/checkLogin.js";



document.addEventListener("DOMContentLoaded", () => {
    // Llama a la función que configura el formulario de registro.
    // Esto asegura que el listener se añade una vez que el formulario existe en el DOM.
    setupRegistrationForm();
    setupGoogleLogin()
    setupSignInForm()
    stateChanged()
    
  




   
 /*    cerrarSesion() */



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
