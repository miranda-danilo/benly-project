// app/google-login.js

import { GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";
import { auth, db } from "./conexion_firebase.js";
import { showMessage } from "./notificaciones.js";

// Obtiene los elementos del DOM una sola vez
const $googleBtn = document.querySelector(".googleBtn");
const $signupModal = document.getElementById("signup-modal");
const $signupForm = document.getElementById("signup-form");

/**
 * Configura el listener para el botón de inicio de sesión con Google.
 * Esta función debe ser llamada una vez que el DOM esté cargado.
 */
export const setupGoogleLogin = () => {
    // Verifica que el botón exista antes de agregar el listener
    if ($googleBtn) {
        $googleBtn.addEventListener("click", async (e) => {
            e.preventDefault();

            const provider = new GoogleAuthProvider();

            try {
                const result = await signInWithPopup(auth, provider);
                
                $signupModal.close();
                $signupForm.reset();
                
                const user = result.user;

             

                const uid = user.uid;
                const email = user.email;
                const name = user.displayName;
           

                // ⚠️ Tu lógica para asignar el rol
                let roleUser = "user";
                if (email === "miranda-roberth0691@unesum.edu.ec") {
                    roleUser = "admin";
                }

                // Crea la referencia al documento en Firestore
                const docRef = doc(db, `usuarios/${uid}`);

                // Guarda la información del usuario en Firestore
                await setDoc(docRef, {
                    email: email,
                    role: roleUser,
                    name: name
                }, { merge: true }); // <-- Esto mantiene los puntajes y otros campos existentes



  

                // Cierra el modal de registro después del inicio de sesión
                // Asegúrate de que tu función 'closeModal' esté definida en tu index.js
                // Por ahora, usamos una lógica simple.

                // Muestra un mensaje de éxito
                showMessage(`¡Bienvenido, ${user.displayName}!`);
                console.log("Usuario autenticado y guardado en Firestore:", user);

            } catch (error) {
                const errorCode = error.code;
                const errorMessage = error.message;

                // Muestra un mensaje de error detallado
                showMessage(`Error: ${errorMessage}`, "error");
                console.error("Error en autenticación de Google:", errorCode, errorMessage);
            }
        });
    }
};