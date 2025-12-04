// writing_logic.js (OPTIMIZADO SIN CAMBIAR TUS FUNCIONES)

import { auth, db } from "./conexion_firebase.js";
import { getDoc, setDoc, doc } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";
import { showMessage } from "./notificaciones.js";



/* ============================================================
    OPTIMIZACIÓN: speechSynthesis.getVoices() a veces viene vacío.
    Se asegura que haya voces cargadas antes de elegir.
============================================================ */
/* ============================================================
    CONFIG: voz primaria + fallback ordenado
============================================================ */
const MAIN_VOICE = "Microsoft Andrew Online (Natural) - English (United States)";

const FALLBACK_INDEXES = [3, 5, 6, 8, 9, 10, 15, 18, 19]; 
// (corrección por base 0)

/* ============================================================
    Cargar voces (esperar si aún no están disponibles)
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

/* ============================================================
    Selección automática de la mejor voz
============================================================ */
async function getBestVoice() {
    const voices = await loadVoices();
    const usVoices = voices.filter(v => v.lang === "en-US");

    // 1) SÍ EXISTE ANDREW → usarlo
    const andrew = usVoices.find(v => v.name === MAIN_VOICE);
    if (andrew) return andrew;

    // 2) Fallback en el orden especificado
    for (const index of FALLBACK_INDEXES) {
        if (usVoices[index]) return usVoices[index];
    }

    // 3) Último recurso si nada coincide
    return usVoices[0] || voices[0];
}

/* ============================================================
    Función speak() usando la voz seleccionada automáticamente
============================================================ */
export async function speak(text) {
    const utterance = new SpeechSynthesisUtterance(text);
    const bestVoice = await getBestVoice();

    utterance.voice = bestVoice;
    utterance.rate = 1;
    utterance.pitch = 1;

    console.log("🔊 Usando voz:", bestVoice.name);

    speechSynthesis.cancel();
    speechSynthesis.speak(utterance);
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
        const response = await fetch("/.netlify/functions/correctWriting", {
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
