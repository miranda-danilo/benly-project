import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";
import { auth, db } from "./conexion_firebase.js";
import { showMessage } from "./notificaciones.js";

// Obtiene los elementos del DOM una sola vez
const $signinForm = document.getElementById("signin-form");
export const $signinModal = document.getElementById("signin-modal");

/**
 * Configura el listener del formulario para el inicio de sesión de usuarios.
 * Esta función debe ser llamada una vez que el DOM esté cargado.
 */
export function setupSignInForm() {
    // Si el formulario existe, configura el listener
    if ($signinForm) {
        $signinForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const email = $signinForm["signin-email"].value;
            const password = $signinForm["signin-password"].value;

            try {
                // Paso 1: Inicia sesión con email y contraseña
                const response = await signInWithEmailAndPassword(auth, email, password);
                const user = response.user;

                $signinModal.close();
                $signinForm.reset();

                // --- ⚠️ Lógica para la verificación de correo ---
                if (!user.emailVerified) {
                    await auth.signOut();
                    showMessage("CORREO NO VERIFICADO. LOGIN", "error");
                    return;
                }
                // --------------------------------------------------------



                /*   const uid = user.uid;
                                const docRef = doc(db, "usuarios", uid);
                                // Define el rol inicial y los datos que quieres guardar
                                const userData = {
                                    email: email,
                                    role: "user", // Asignar un rol por defecto
                                    name: name // <-- Aquí se agrega el nombre al documento de Firestore
                                };
                
                                // Guarda los datos en Firestore
                                await setDoc(docRef, userData, { merge: true }); */




                // Paso 2: Obtén el documento del usuario desde Firestore
                const uid = user.uid;
                const docRef = doc(db, "usuarios", uid);
                const docSnap = await getDoc(docRef);



            

                // Si el documento NO existe, lo creamos AHORA que la sesión está estable.
                if (!docSnap.exists()) {
                    console.log("Perfil de usuario no encontrado. Creando inicialización...");

                    let roldeuser = null;
                    if(user.email === "miranda-roberth0691@unesum.edu.ec" || user.email === "marlon.barcia@unesum.edu.ec") {
                        roldeuser = "admin";
                    }

                    const userData = {
                        email: user.email,
                        name: user.displayName || 'Sin Nombre', // Usamos el nombre de Auth
                        // 2. Nos aseguramos de devolver un valor en todos los casos.
                        role: roldeuser || "user" // Asignar un rol por defecto
                        }
    

                        console.log("myrol ",userData.role)
                        await setDoc(docRef, userData);
                        console.log("Perfil de usuario creado exitosamente.");

                    } else {
                        console.log("El perfil de usuario ya existe en Firestore.");

                }

          /*       const userData = docSnap.data();
                const userName = userData.name;

                showMessage(`¡Bienvenido, ${userName}!`); */

                /* if (docSnap.exists()) {
                    const userData = docSnap.data();
                    const userName = userData.name;
                    // Ahora puedes usar userName en tu aplicación
                    showMessage(`¡Bienvenido, ${userName}!`);
                } else {
                    showMessage("¡Bienvenido! (Datos de perfil no encontrados)", "info");
                }
 */

            } catch (error) {
                const errorCode = error.code;
                const errorMessage = error.message;
                console.error("Error al iniciar sesión:", errorCode, errorMessage);

                if (errorCode === "auth/wrong-password" || errorCode === "auth/user-not-found") {
                    showMessage("Credenciales incorrectas", "error");
                    console.log(errorCode)
                } else if (errorCode === "auth/invalid-email") {
                    showMessage("Correo inválido", "error");
                } else {
                    showMessage(`Error: ${errorMessage}`, "error");
                }
            }
        });
    }
}