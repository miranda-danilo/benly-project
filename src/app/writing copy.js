// writing_logic.js

import { auth, db } from "./conexion_firebase.js";
import { getDoc, setDoc, doc } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";
import { showMessage } from "./notificaciones.js";

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
 * @returns {Promise<{correctCount: number, score: number}>} - El progreso de escritura.
 */
export async function loadWritingProgress(userId) {
    try {
        const docRef = doc(db, `usuarios/${userId}`);
        const docSnap = await getDoc(docRef);
        const userScoresData = (docSnap.exists() && docSnap.data().scores) ? docSnap.data().scores : {};
        const writing = userScoresData["WRITING"];
        return {
            correctCount: writing && writing.score ? Math.floor(writing.score / 2) : 0,
            score: writing && writing.score ? writing.score : 0
        };
    } catch (e) {
        console.error("Error loading writing progress:", e);
        return { correctCount: 0, score: 0 };
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
        console.error("Error al guardar WRITING:", error);
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
        const prompt = `Actúa como un corrector de oraciones en inglés. Analiza la siguiente oración y determina si es gramaticalmente correcta. Si es correcta, devuelve un JSON con el estado "Correcta". Si es incorrecta, devuelve un JSON con el estado "Incorrecta", la versión corregida de la oración y una explicación clara y concisa de los errores en español.
            Oración: "${sentence}"
            Ejemplo de JSON correcto:
            {
                "status": "Correcta"
            }
            Ejemplo de JSON incorrecto:
            {
                "status": "Incorrecta",
                "corrected_sentence": "The man goes to the store.",
                "explanation": "El verbo 'go' debe estar en su forma 'goes' para concordar con el sujeto 'the man' en tercera persona del singular."
            }`;

        const payload = {
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: "OBJECT",
                    properties: {
                        status: { type: "STRING" },
                        corrected_sentence: { type: "STRING", description: "Only required if status is 'Incorrecta'" },
                        explanation: { type: "STRING", description: "Only required if status is 'Incorrecta'" }
                    },
                    required: ["status"]
                }
            }
        };

        const apiKey = "AIzaSyBSiRh6-xffCLQt7v6Kj0GlLAMBYIYN3ig";
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

        const response = await fetchWithRetry(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = response.candidates[0].content.parts[0].text;
        const parsedResult = JSON.parse(result);

        let outputHtml = '';
        const user = auth.currentUser;
        let writingProgress = user ? await loadWritingProgress(user.uid) : { correctCount: 0, score: 0 };

        if (parsedResult.status === 'Correcta') {
            playSound("correct");
            writingProgress.correctCount = Math.min(writingProgress.correctCount + 1, 5);
            writingProgress.score = Math.min(writingProgress.correctCount * 2, 10);

            if (user) await saveWritingScore(user.uid, writingProgress.score);

            outputHtml = `
                <p class="feedback-message feedback-message--correct">
                    <svg class="feedback-message__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2l4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    ¡Correcta!
                </p>
                <p class="feedback-explanation">Tu oración es gramaticalmente correcta.</p>
            `;
        } else {
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
            `;
        }

        if (writingProgressDiv) {
            writingProgressDiv.innerHTML = `
                <b style="color:#2563eb;">Oraciones correctas:</b> ${writingProgress.correctCount}/5<br>
                <b style="color:#2563eb;">Puntaje:</b> ${writingProgress.score}/10
                ${writingProgress.correctCount >= 5 ? '<br><span style="color:green;font-weight:bold;">¡Completaste la sección de escritura!</span>' : ''}
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
