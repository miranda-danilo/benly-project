import { signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";
import { auth } from "./conexion_firebase.js";
import { showMessage } from "./notificaciones.js";
// Importamos la nueva lógica centralizada
import { syncUserProfile } from "./setup_roles.js";

const $signinForm = document.getElementById("signin-form");
export const $signinModal = document.getElementById("signin-modal");

export function setupSignInForm() {
    if ($signinForm) {
        $signinForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const emailInput = $signinForm["signin-email"].value.trim().toLowerCase();
            const password = $signinForm["signin-password"].value;

            try {
                const response = await signInWithEmailAndPassword(auth, emailInput, password);
                const user = response.user;

                if (!user.email.toLowerCase().endsWith("@unesum.edu.ec")) {
                    await signOut(auth);
                    showMessage("Acceso denegado. Use su correo institucional.", "error");
                    return;
                }

                if (!user.emailVerified) {
                    await signOut(auth);
                    showMessage("Por favor, verifique su correo antes de ingresar.", "error");
                    return;
                }

                // Sincronizamos el perfil de forma centralizada
                const userData = await syncUserProfile(user);

                if ($signinModal) $signinModal.close();
                $signinForm.reset();

                showMessage(`¡Bienvenido, ${userData.name}!`, "success");

            } catch (error) {
                showMessage("Credenciales incorrectas o error de conexión", "error");
            }
        });
    }
}