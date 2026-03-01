import { GoogleAuthProvider, signInWithPopup, signOut } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";
import { auth } from "./conexion_firebase.js";
import { showMessage } from "./notificaciones.js";
import { $signinModal } from "./inicio_sesion_correo.js";
// Importamos la nueva lógica centralizada
import { syncUserProfile } from "./setup_roles.js";

const $googleBtn = document.querySelectorAll(".googleBtn");
const $signupModal = document.getElementById("signup-modal");
const $signupForm = document.getElementById("signup-form");

export const setupGoogleLogin = () => {
    if ($googleBtn) {
        $googleBtn.forEach(btn => {
            btn.addEventListener("click", async (e) => {
                e.preventDefault();
                const provider = new GoogleAuthProvider();

                try {
                    const result = await signInWithPopup(auth, provider);
                    const user = result.user;

                    if (!user.email.toLowerCase().endsWith("@unesum.edu.ec")) {
                        await signOut(auth);
                        showMessage("Acceso denegado. Use su correo @unesum.edu.ec", "error");
                        return;
                    }

                    // Sincronizamos el perfil (crea el documento si no existe)
                    await syncUserProfile(user);

                    if ($signinModal) $signinModal.close();
                    if ($signupModal) $signupModal.close();
                    if ($signupForm) $signupForm.reset();

                    showMessage(`¡Bienvenido, ${user.displayName}!`, "success");

                } catch (error) {
                    showMessage(`Error: ${error.message}`, "error");
                }
            });
        });
    }
};