// writing_logic.js

import { auth, db } from "./conexion_firebase.js";
import { getDoc, setDoc, doc } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";
import { showMessage } from "./notificaciones.js";

// La API Key ha sido ELIMINADA y ahora vive en el backend (Firebase Function)

// Usaremos un punto final fijo para la función de corrección:
// (Asegúrate de reemplazar esta URL con la URL de tu Firebase Function después de desplegarla)
const CORRECTION_FUNCTION_URL = "../netlify_functions/correctWriting";


/**
 * Realiza una llamada a la API con reintentos y retroceso exponencial.
 * @param {string} url - La URL de la API.
 * @param {object} options - Opciones para la llamada fetch.
 * @param {number} retries - Número de reintentos.
 * @param {number} delay - Retraso inicial entre reintentos.
 * @returns {Promise<object>} - La respuesta JSON de la API.
 */
async function fetchWithRetry(url, options, retries = 3, delay = 1000) {
    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        if (retries > 0) {
            await new Promise(res => setTimeout(res, delay));
            return fetchWithRetry(url, options, retries - 1, delay * 2);
        } else {
            throw error;
        }
    }
}

/**
 * Carga el progreso de la unidad WRITING desde Firestore.
 * @param {string} userId - ID del usuario.
 * @returns {Promise<{score: number}>} - El puntaje de escritura.
 */
export async function loadWritingProgress(userId) {
    try {
        const docRef = doc(db, `usuarios/${userId}`);
        const docSnap = await getDoc(docRef);
        const userScoresData = (docSnap.exists() && docSnap.data().scores) ? docSnap.data().scores : {};
        const writing = userScoresData["WRITING"];
        return {
            score: writing && writing.score ? writing.score : 0
        };
    } catch (e) {
        console.error("Error loading writing progress:", e);
        return { score: 0 };
    }
}

/**
 * Guarda el puntaje de la unidad WRITING en Firestore, solo si es mayor al previo.
 * @param {string} userId - ID del usuario.
 * @param {number} score - Puntaje de escritura.
 */
async function saveWritingScore(userId, score) {
    try {
        const docRef = doc(db, `usuarios/${userId}`);
        const docSnap = await getDoc(docRef);
        const currentData = docSnap.exists() ? docSnap.data() : {};
        const currentScores = currentData.scores || {};
        const prevScore = currentScores["WRITING"]?.score || 0;
        if (score > prevScore) {
            const newScores = {
                ...currentScores,
                ["WRITING"]: {
                    score: score,
                    completada: score >= 10
                }
            };
            await setDoc(docRef, { ...currentData, scores: newScores }, { merge: true });
            showMessage("¡Puntaje WRITING guardado!", "success");
        }
    } catch (error) {
        console.gerror("Error al guardar WRITING:", error);
        showMessage("Error al guardar WRITING.", "error");
    }
}

/**
 * Maneja la lógica de corrección de una oración de escritura.
 * @param {string} sentence - La oración a corregir.
 * @param {HTMLElement} feedbackContainer - El contenedor para mostrar los resultados.
 * @param {HTMLElement} feedbackContent - El elemento donde se mostrará el contenido.
 * @param {HTMLElement} loadingIndicator - El indicador de carga.
 * @param {HTMLElement} writingProgressDiv - El div para el progreso de escritura.
 * @param {function} playSound - Función para reproducir sonidos.
 */
export const handleWritingCorrection = async (sentence, feedbackContainer, feedbackContent, loadingIndicator, writingProgressDiv, playSound) => {
    feedbackContainer?.classList.remove('hidden');
    feedbackContent?.classList.add('hidden');
    loadingIndicator?.classList.remove('hidden');

    try {
        // En lugar de construir el payload de la API de Gemini, enviamos la oración al backend
        // AHORA (Llamada a tu Función Segura)
        const response = await fetchWithRetry(CORRECTION_FUNCTION_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            // Envías solo la oración, el resto del prompt se construye en el backend
            body: JSON.stringify({ sentence: sentence })
        });

        // La respuesta JSON que viene de la función ya es el resultado parseado
        const parsedResult = response;

        let outputHtml = '';
        // ... el resto del código es igual.
        const user = auth.currentUser;
        let currentScore = 0;

        // ... (El resto de tu lógica de scoring y UI permanece IGUAL)
        // Determina el puntaje del intento actual
        if (parsedResult.status === 'Correcta') {
            playSound("correct");
            currentScore = 10;
            if (user) await saveWritingScore(user.uid, currentScore);

            outputHtml = `
                <p class="feedback-message feedback-message--correct">
                    <svg class="feedback-message__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2l4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    ¡Correcta!
                </p>
                <p class="feedback-explanation">Tu oración es gramaticalmente correcta. Has obtenido <b>${currentScore}</b> puntos.</p>
            `;
        } else {
            playSound("incorrect");
            currentScore = 0;
            outputHtml = `
                <p class="feedback-message feedback-message--incorrect">
                    <svg class="feedback-message__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    ¡Incorrecta!
                </p>
                <div class="corrected-section">
                    <h3 class="input-label">Versión corregida:</h3>
                    <p class="corrected-text">"${parsedResult.corrected_sentence}"</p>
                </div>
                <div class="explanation-section">
                    <h3 class="input-label">Explicación:</h3>
                    <p class="explanation-text">${parsedResult.explanation}</p>
                </div>
                <p class="feedback-score">Puntaje obtenido en este intento: <b>${currentScore}</b> puntos.</p>
            `;
        }

        // Obtener el puntaje más alto para mostrarlo en pantalla
        const userProgress = user ? await loadWritingProgress(user.uid) : { score: 0 };
        const highestScore = userProgress.score;

        if (writingProgressDiv) {
            writingProgressDiv.innerHTML = `
                <b style="color:#2563eb;">Tu puntaje mayor es de:</b> ${highestScore}/10
                ${highestScore >= 10 ? '<br><span style="color:green;font-weight:bold;">¡Felicidades, has completado la sección de escritura!</span>' : ''}
            `;
        }

        if (feedbackContent) feedbackContent.innerHTML = outputHtml;
    } catch (error) {
        console.error("Error during writing correction:", error);
        if (feedbackContent) {
            feedbackContent.innerHTML = `
                <p class="error-message">Ocurrió un error al procesar la solicitud. Por favor, inténtalo de nuevo.</p>
                <p class="error-detail">Detalles del error: ${error.message}</p>
            `;
        }
    } finally {
        loadingIndicator?.classList.add('hidden');
        feedbackContent?.classList.remove('hidden');
    }
};