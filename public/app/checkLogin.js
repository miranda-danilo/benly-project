import { onAuthStateChanged, signOut, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";
import { showMessage } from "./notificaciones.js";
import { auth, db } from "./conexion_firebase.js";
import { setupUserPanelLogic } from "./user_interface.js";
import { setupAdminPanelLogic } from "./docente_interface.js";
// Importamos la nueva lógica centralizada
import { syncUserProfile } from "./setup_roles.js";

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

const mainContent = document.getElementById("main");
const loginLink = document.getElementById("login-link");
const registerLink = document.getElementById("register-link");
const logoutLink = document.getElementById("logout-link");
const headerNav = document.querySelector(".header__nav");
const footer = document.querySelector(".footer");

const loginModal = document.getElementById('signin-modal');
const signupModal = document.getElementById('signup-modal');
const forgotPasswordLink = document.getElementById('forgot-password-link');

const userPanelUrl = './pages/panel_estudiante.html';
const adminPanelUrl = './pages/panel_docente.html';
const homePageUrl = './pages/home.html';

export const updateUI = async (user) => {
    if (user && user.emailVerified) {
        loginLink.classList.add("d-none");
        registerLink.classList.add("d-none");
        logoutLink.classList.remove("d-none");
        headerNav.classList.add("d-none");
        footer.classList.add("d-none");

        // Usamos syncUserProfile para obtener los datos actualizados del usuario (incluyendo el rol)
        const userData = await syncUserProfile(user);
        const role = userData.role;
        const panelUrl = (role === "admin") ? adminPanelUrl : userPanelUrl;

        getHTML({
            url: panelUrl,
            success: (res) => {
                mainContent.innerHTML = res;
                if (role === 'admin') {
                    const adminPanel = mainContent.querySelector("#admin-panel");
                    if (adminPanel) setupAdminPanelLogic(adminPanel, role);
                } else {
                    const userPanel = mainContent.querySelector("#user-panel");
                    if (userPanel) setupUserPanelLogic(userPanel, role);
                }
            },
            error: (err) => {
                mainContent.innerHTML = `<p>Error al cargar el panel: ${err}</p>`;
            }
        });
    } else {
        loginLink.classList.remove("d-none");
        registerLink.classList.remove("d-none");
        logoutLink.classList.add("d-none");
        headerNav.classList.remove("d-none");
        footer.classList.remove("d-none");

        getHTML({
            url: homePageUrl,
            success: (res) => mainContent.innerHTML = res,
            error: (err) => {
                mainContent.innerHTML = `<p>Error al cargar la página de inicio: ${err}</p>`;
            }
        });
    }
};

export const stateChanged = () => {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            if (!user.email.toLowerCase().endsWith("@unesum.edu.ec")) {
                await signOut(auth);
                showMessage("Acceso restringido a correos institucionales.", "error");
                return;
            }

            if (!user.emailVerified) {
                await signOut(auth);
            } else {
                updateUI(user);
            }
        } else {
            updateUI(null);
        }
    });
    // ... (resto del código de logout y forgotPassword se mantiene igual)
     if (logoutLink) {
        logoutLink.addEventListener("click", async (e) => {
            e.preventDefault();
            try {
                await signOut(auth);
                const menuBtn = document.getElementById("mobile-hamburger-btn");
                if (menuBtn) menuBtn.style.display = "none";
                if (loginModal) loginModal.close();
                if (signupModal) signupModal.close();
                showMessage("Sesión cerrada correctamente", "success");
            } catch (error) {
                showMessage("Error al cerrar sesión", "error");
            }
        });
    }

    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener("click", async (e) => {
            e.preventDefault();
            const email = document.getElementById('signin-email').value;
            if (email) {
                try {
                    await sendPasswordResetEmail(auth, email);
                    showMessage(`Correo de restablecimiento enviado a ${email}.`, "success");
                    if (loginModal) loginModal.close();
                } catch (error) {
                    showMessage(`Error: ${error.message}`, "error");
                }
            } else {
                showMessage("Introduce tu correo electrónico primero.", "warning");
            }
        });
    }
};
