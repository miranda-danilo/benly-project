// Importaciones de Firebase y de tus módulos locales
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";
import { showMessage } from "./notificaciones.js";
import { auth, db } from "./conexion_firebase.js";
import { setupUserPanelLogic } from "./user_interface.js";
import { setupAdminPanelLogic } from "./docente_interface.js";
import { sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";



// Asumiendo que `getHTML` carga contenido dinámicamente
// Esta es la versión de la función que hemos optimizado antes
const getHTML = async (options) => {
    const { url, success, error } = options;
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText || "Recurso no encontrado"}`);
        }
        const htmlText = await response.text();
        success(htmlText);
    } catch (err) {
        error(err.message);
    }
};

// Referencias a elementos del DOM
/* const mainContent = document.querySelector("main"); */
const mainContent = document.getElementById("main");
const loginLink = document.getElementById("login-link");
const registerLink = document.getElementById("register-link");
const logoutLink = document.getElementById("logout-link");
const headerNav = document.querySelector(".header__nav");
const header = document.querySelector(".header");
const footer = document.querySelector(".footer");

// Referencias a los modales de la página principal
const loginModal = document.getElementById('signin-modal');
const signupModal = document.getElementById('signup-modal');
const forgotPasswordLink = document.getElementById('forgot-password-link'); // Nueva referencia

// Rutas a los paneles de usuario
const userPanelUrl = './pages/panel_estudiante.html';
const adminPanelUrl = './pages/panel_docente.html';
const homePageUrl = './pages/home.html'; // Asegúrate de tener un archivo home.html



/**
 * Función para obtener el rol del usuario desde Firestore.
 * @param {string} uid El ID del usuario.
 * @returns {Promise<string|null>} El rol del usuario o null si ocurre un error.
 */
const fetchUserRole = async (uid) => {
    try {
        const userDocRef = doc(db, `usuarios/${uid}`);
        const userDocSnap = await getDoc(userDocRef);
        return userDocSnap.exists() ? userDocSnap.data().role : null;
    } catch (error) {
        console.error("Error al obtener el rol del usuario:", error);
        return null;
    }
};

/**
 * Actualiza la interfaz de usuario basándose en el estado de autenticación.
 * Esta función es exportada para que pueda ser utilizada por otros módulos,
 * como en el caso de que quieras recargar la UI después de otra acción.
 * @param {object|null} user El objeto de usuario de Firebase, o null si no hay usuario.
 */
export const updateUI = async (user) => {

    if (user && user.emailVerified) {
        // Usuario autenticado y verificado: muestra el enlace de cerrar sesión
        loginLink.classList.add("d-none");
        registerLink.classList.add("d-none");
        logoutLink.classList.remove("d-none");
        headerNav.classList.add("d-none");
        footer.classList.add("d-none");
     /*    header.classList.add("d-none"); */

        // Determina el rol y carga el contenido del panel
        const role = await fetchUserRole(user.uid);
        const panelUrl = (role === "admin") ? adminPanelUrl : userPanelUrl;

        getHTML({
            url: panelUrl,
            success: (res) => {
                mainContent.innerHTML = res;
                // --- AQUÍ ES DONDE DEBES LLAMAR A LA FUNCIÓN ---
                // Le pasamos el elemento principal para que la función pueda
                // buscar sus propios elementos hijos (como #user-email)

                // Llama a la lógica correspondiente según el rol del usuario
                if (role === 'admin') {
                    const adminPanel = mainContent.querySelector("#admin-panel");
                    if (adminPanel) {
                        setupAdminPanelLogic(adminPanel, role);
                    }
                } else {
                    const userPanel = mainContent.querySelector("#user-panel");
                    if (userPanel) {
                        setupUserPanelLogic(userPanel, role);
                    }
                }


            },
            error: (err) => {
                mainContent.innerHTML = `<p>Error al cargar el panel: ${err}</p>`;
                console.error(err);
            }
        });

    } else {
        // Usuario no autenticado: muestra los enlaces de registro e inicio de sesión
        loginLink.classList.remove("d-none");
        registerLink.classList.remove("d-none");
        logoutLink.classList.add("d-none");
        headerNav.classList.remove("d-none");
        footer.classList.remove("d-none");
     /*      header.classList.remove("d-none"); */


        // Carga la página de inicio
        getHTML({
            url: homePageUrl,
            success: (res) => mainContent.innerHTML = res,
            error: (err) => {
                mainContent.innerHTML = `<p>Error al cargar la página de inicio: ${err}</p>`;
                console.error(err);
            }
        });
    }
};

/**
 * Escucha los cambios en el estado de autenticación de Firebase
 * y actualiza la UI. Esta es la función principal que inicia la lógica.
 * Es exportada para que se pueda llamar desde index.js.
 */
export const stateChanged = () => {
    onAuthStateChanged(auth, async (user) => {


        if (user && !user.emailVerified) {
            // Si el usuario existe pero no está verificado, cierra la sesión
            /*       await signOut(auth); */
            /*   showMessage("CORREO NO VERIFICADO. CHECK", "error"); */
            await signOut(auth);

        } else {
            updateUI(user);
            console.log("Sesion activa STATE CHANGED CHECK", user)
        }




    });





    // Añade el manejador de eventos para el botón de cerrar sesión
    if (logoutLink) {
        logoutLink.addEventListener("click", async (e) => {
            e.preventDefault();
            try {
                console.log("cumple el try de logout")

                await signOut(auth);

                const menuAdmin = document.getElementById("mobile-hamburger-btn");
               /* menuAdmin.style.background = "red"; */
                menuAdmin.style.display = "none";
                // Asegúrate de que los modales están cerrados
                if (loginModal) {
                    loginModal.close();
                }

                if (signupModal) {
                    signupModal.close();
                }
                showMessage("Sesión cerrada correctamente", "success");
            } catch (error) {
                console.error("Error al cerrar sesión:", error);
                showMessage("Error al cerrar sesión", "error");
            }
        });
    }

     // NUEVA LÓGICA: Manejar el clic en el enlace de "Olvidaste tu contraseña"
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener("click", async (e) => {
            e.preventDefault();
            const email = document.getElementById('signin-email').value;

            if (email) {
                try {
                    await sendPasswordResetEmail(auth, email);
                    showMessage(`Se ha enviado un correo electrónico de restablecimiento a ${email}.`, "success");
                    // Opcional: cierra el modal después de enviar el correo
                    if (loginModal) {
                      loginModal.close();
                    }
                } catch (error) {
                    console.error("Error al enviar el correo de restablecimiento:", error);
                    showMessage(`Error: ${error.message}`, "error");
                }
            } else {
                showMessage("Por favor, introduce tu correo electrónico para restablecer la contraseña.", "warning");
            }
        });
    }

    // Añade el manejador de eventos para el botón de cerrar sesión
    /*   if (logoutLink) {
          logoutLink.addEventListener("click", async (e) => {
              e.preventDefault();
              await signOut(auth);
              showMessage("Sesión cerrada correctamente", "success");
          });
      } */
};
