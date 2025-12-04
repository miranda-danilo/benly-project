// writing_logic.js (OPTIMIZADO SIN CAMBIAR TUS FUNCIONES)

import { auth, db } from "./conexion_firebase.js";
import { getDoc, setDoc, doc } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";
import { showMessage } from "./notificaciones.js";



/* ============================================================
    OPTIMIZACIÓN: speechSynthesis.getVoices() a veces viene vacío.
    Se asegura que haya voces cargadas antes de elegir.
============================================================ */
function loadVoices() {
    return new Promise(resolve => {
        const voices = speechSynthesis.getVoices();
        if (voices.length) return resolve(voices);

        speechSynthesis.onvoiceschanged = () => {
            resolve(speechSynthesis.getVoices());
        };
    });
}

async function speak(text) {
    const utterance = new SpeechSynthesisUtterance(text);

    const voices = await loadVoices();

    const selectedVoice = voices.find(v =>
        v.name.includes("Natural") ||
        v.name.includes("Neural") ||
        v.name.includes("Jenny") ||
        (v.lang === "en-US" && v.name.includes("Microsoft") === false)
    );

    if (selectedVoice) utterance.voice = selectedVoice;

    console.warn("Using voice:", utterance.voice ? utterance.voice.name : "default");

    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;

    speechSynthesis.cancel(); // evitar solapamientos
    speechSynthesis.speak(utterance);
}

/* ============================================================
    fetchWithRetry — Optimizado
============================================================ */
async function fetchWithRetry(url, options, retries = 3, delay = 800) {
    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        if (retries > 0) {
            await new Promise(r => setTimeout(r, delay));
            return fetchWithRetry(url, options, retries - 1, delay * 1.8);
        }
        throw error;
    }
}

/* ============================================================
    Cargar progreso WRITING
============================================================ */
export async function loadWritingProgress(userId) {
    try {
        const docRef = doc(db, `usuarios/${userId}`);
        const docSnap = await getDoc(docRef);

        const scores = docSnap.exists() && docSnap.data().scores
            ? docSnap.data().scores
            : {};

        const writing = scores["WRITING"];

        return {
            score: writing?.score || 0
        };
    } catch (e) {
        console.error("Error loading writing progress:", e);
        return { score: 0 };
    }
}

/* ============================================================
    Guardar puntaje WRITING
============================================================ */
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
                    score,
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

/* ============================================================
    LÓGICA PRINCIPAL DE CORRECCIÓN WRITING
============================================================ */
let isProcessingWriting = false; // evita doble click / spam
export const handleWritingCorrection = async    (
    sentence,
    feedbackContainer,
    feedbackContent,
    loadingIndicator,
    writingProgressDiv,
    playSound
) => {

     if (isProcessingWriting) return;   // ⬅ anti spam
    isProcessingWriting = true;

    feedbackContainer?.classList.remove("hidden");
    feedbackContent?.classList.add("hidden");
    loadingIndicator?.classList.remove("hidden");

    try {
        // Llamada segura al backend
        const response = await fetchWithRetry("/.netlify/functions/correctWriting", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sentence })
        });

        let parsedResult = await response.json();

        // si hay error del server, mostrar fallback
        if (!response.ok && parsedResult.fallback) {
            parsedResult = parsedResult.fallback;
        }

        const user = auth.currentUser;
        let currentScore = parsedResult.status === "Correcta" ? 10 : 0;

        let outputHtml = "";

        if (parsedResult.status === "Correcta") {
            playSound("correct");

            speak(`Correct. Your sentence is correct. You obtained ${currentScore} points.`);

            if (user) await saveWritingScore(user.uid, currentScore);

            outputHtml = `
                <p class="feedback-message feedback-message--correct">
                    <svg class="feedback-message__icon" ... ></svg>
                    ¡Correct!
                </p>
                <p class="feedback-explanation">
                    Your sentence '${sentence}' is grammatically correct.
                    You have obtained <b>${currentScore}</b> points.
                </p>`;
        } else {
            playSound("wrong");

            speak(`Incorrect. The corrected version is: ${parsedResult.corrected_sentence}. Explanation: ${parsedResult.explanation}`);

            outputHtml = `
                <p class="feedback-message feedback-message--incorrect">
                    <svg class="feedback-message__icon" ... ></svg>
                    ¡Incorrect!
                </p>
                <div class="corrected-section">
                    <h3 class="input-label">Corrected version:</h3>
                    <p class="corrected-text">"${parsedResult.corrected_sentence}"</p>
                </div>
                <div class="explanation-section">
                    <h3 class="input-label">Explanation:</h3>
                    <p class="explanation-text">${parsedResult.explanation}</p>
                </div>
                <p class="feedback-score">Score obtained: <b>${currentScore}</b> points.</p>
            `;
        }

        // Mostrar puntaje
        const progress = user ? await loadWritingProgress(user.uid) : { score: 0 };

        if (writingProgressDiv) {
            writingProgressDiv.innerHTML = `
                <b style="color:#2563eb;">Your highest score is:</b> ${progress.score}/10
                ${progress.score >= 10
                    ? '<br><span style="color:green;font-weight:bold;">Congratulations, you completed the writing section!</span>'
                    : ''
                }
            `;
        }

        feedbackContent.innerHTML = outputHtml;

    } catch (error) {
        console.error("Error during writing correction:", error);

        feedbackContent.innerHTML = `
            <p class="error-message">An error occurred while processing the request. Try again.</p>
            <p class="error-detail">Details: ${error.message}</p>
        `;
    } finally {
        loadingIndicator?.classList.add("hidden");
        feedbackContent?.classList.remove("hidden");
        isProcessingWriting = false;   // ⬅ vuelve a permitir el uso
    }
};
