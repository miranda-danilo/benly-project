import { setupRegistrationForm } from "./app/registro.js";
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
    

     const burgerMenu = document.querySelector('.header__burger-menu');
    const headerNav = document.querySelector('.header__nav');
    const headerLinks = document.querySelectorAll('.header__link');
    
    const loginButton = document.querySelector('.header__button--login');
    const registerButton = document.querySelector('.header__button--register');
    
    const signInModal = document.getElementById('signin-modal');
    const signUpModal = document.getElementById('signup-modal');

    const closeLoginButton = document.querySelector('.close-modal-login');
    const closeSignupButton = document.querySelector('.close-modal-signup');
    

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

     // --- Lógica para los Modales ---
    
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


/* document.addEventListener('DOMContentLoaded', () => {

   
}); */


