import { createUserWithEmailAndPassword, sendEmailVerification, updateProfile } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";
import { auth, db } from "./conexion_firebase.js";
import { showMessage } from "../app/notificaciones.js";
import { signOut } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";


const d = document;
const $signupModal = d.getElementById("signup-modal");
const $signupForm = d.getElementById("signup-form");
const $signupName = d.getElementById("signup-name"); // Asegúrate de que tu formulario tenga un campo con este ID.

export function setupRegistrationForm() {
    d.addEventListener("submit", async (e) => {
        if (e.target === $signupForm) {
            e.preventDefault();

            const email = $signupForm["signup-email"].value;
            const password = $signupForm["signup-password"].value;
            const name = $signupForm["signup-name"].value; // Obtener el nombre del formulario

            try {
                // Paso 1: Crea el usuario en Authentication
                const response = await createUserWithEmailAndPassword(auth, email, password);

                const user = response.user;

                // Paso 2: Guarda el nombre en el perfil del usuario de Auth
                await updateProfile(user, {
                    displayName: name
                });

                // Paso 3: Crea un documento en Firestore con el UID como ID
                const uid = user.uid;
                const docRef = doc(db, "usuarios", uid);

                // Define el rol inicial y los datos que quieres guardar
                const userData = {
                    email: email,
                    role: "user", // Asignar un rol por defecto
                    name: name // <-- Aquí se agrega el nombre al documento de Firestore
                };


                
                // Guarda los datos en Firestore
                await setDoc(docRef, userData, { merge: true }); // <-- Esto mantiene los puntajes y otros campos existentes

                // Paso 4: Envía el email de verificación
                await sendEmailVerification(user);

                $signupModal.close();
                $signupForm.reset();

                showMessage("¡Registro exitoso! Por favor, verifica tu correo.");

            } catch (error) {
                // Manejo de errores
                const errorCode = error.code;
                if (errorCode === "auth/weak-password") {
                    showMessage("CONTRASEÑA MUY DÉBIL", "error");
                } else if (errorCode === "auth/invalid-email") {
                    showMessage("CORREO INVÁLIDO", "error");
                } else if (errorCode === "auth/email-already-in-use") {
                    showMessage("CORREO YA REGISTRADO", "error");
                } else {
                    showMessage("OCURRIÓ UN ERROR INESPERADO", "error");
                    console.error("Error completo:", error);
                }
            }
        }
    });
}