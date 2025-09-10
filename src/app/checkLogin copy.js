import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";

/* import { mostrarPanel } from "./contentUserRole.js"; */
import { showMessage } from "./notificaciones.js";
import { auth, db } from "./conexion_firebase.js";
import { collection, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js"

/* import { incluirContenido } from "./include-html.js"; */
/* import { getHTML } from "./getHTML.js"; */




const
    $body = document.body,
    $menuHome = document.querySelectorAll(".stateHome"),
    $menuLogOut = document.querySelector(".header__button--logout")

const $contentRole = document.getElementById("contentRole");

export const stateChanged = () => {

    async function getRole(uid) {
        const docRef = await doc(db, `usuarios/${uid}`);
        const infoCifrada = await getDoc(docRef);
        const infoFinal = infoCifrada.data().role;
        return infoFinal;
    }



    onAuthStateChanged(auth, async (user) => {

        // $menuLogOut.style.display = "none";

        console.log("Sesion activa STATE CHANGED", user)


        if (user) {

            //$menuHome.forEach(el => el.style.display = "none")

            if (user.emailVerified) {

                console.log("CHANGED -> EXISTE USUARIO REGISTRADO ", user)

                const role = await getRole(user.uid);

                const userData = {
                    email: user.email,
                    uid: user.uid,
                    role: role
                }

                console.log("RETURN DATA: ", userData)
     /* const $title = document.querySelector("h1"); */
            console.log("titulo ", $title)
                //CHECKLOGIN
                
                mostrarPanel(user, userData.role)
                console.log("entro a verificacion de rol. exito")


                

           


            } else {

                await signOut(auth)

                showMessage("CORREO NO VERIFICADO", "error")
            }
        } else {

            //Mostar home




/*             $menuHome.forEach(el => {
                el.style.display = "block";
            })

            

            getHTML({
                url: "./pages/home.html",
                success: (res) => $main.innerHTML = res,
                error: (err) => $main.innerHTML = `${err}`
            }) */

            console.warn("SESION NO INICIADA. ESTAS EN INDEX")
        }
    })
}