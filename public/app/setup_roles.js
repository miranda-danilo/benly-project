import { doc, setDoc, getDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";
import { db } from "./conexion_firebase.js";

/**
 * Esta función se encarga de asegurar que el usuario tenga un perfil en Firestore.
 * NO asigna "admin" por defecto a menos que sea el primer registro o una lista muy controlada.
 */
export async function syncUserProfile(user) {
    const docRef = doc(db, "usuarios", user.uid);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
        console.log("Primer ingreso del usuario. Creando perfil...");

        // Definimos los datos iniciales. 
        // El ROL siempre debe ser "user" por seguridad.
        const userData = {
            uid: user.uid,
            email: user.email.toLowerCase(),
            name: user.displayName || "Usuario Unesum",
            role: "user", // Rol por defecto seguro
            createdAt: serverTimestamp(),
            lastLogin: serverTimestamp()
        };

        // OPCIONAL: Si es un despliegue inicial y conoces el UID del dueño, 
        // podrías poner una lógica aquí, pero lo mejor es cambiarlo en la consola de Firebase.
        
        await setDoc(docRef, userData);
        return userData;
    } else {
        // Si ya existe, solo actualizamos la última vez que entró
        await setDoc(docRef, { lastLogin: serverTimestamp() }, { merge: true });
        return docSnap.data();
    }
}