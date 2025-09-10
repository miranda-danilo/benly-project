import { auth, db } from "./conexion_firebase.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";
import { showMessage } from "./notificaciones.js";

// Datos de ejemplo para la práctica de habla
const speakingData = {
    'greetings': {
        title: "Saludos Básicos",
        phrases: [
            "Hello, how are you?",
            "Nice to meet you.",
            "Good morning.",
            "Goodbye, see you later.",
            "How's it going?"
        ]
    },
    'introductions': {
        title: "Presentaciones",
        phrases: [
            "My name is Joe.",
            "I am from Ecuador.",
            "I like to play soccer.",
            "How old are you?",
            "What do you do for a living?"
        ]
    },
    'questions': {
        title: "Preguntas Frecuentes",
        phrases: [
            "Where are you from?",
            "What is your name?",
            "What time is it?",
            "How do you spell that?",
            "Can you help me, please?"
        ]
    }
};

let recognition = null;
let isRecording = false;
let utterance = null;
let textToSpeak = "";

// Inicializa el SpeechRecognition API
const initSpeechRecognition = () => {
    // Si ya existe una instancia, la retorna
    if (recognition) {
        return recognition;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        showMessage("Tu navegador no soporta la API de reconocimiento de voz. Por favor, usa Chrome.", "error");
        return null;
    }

    recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;

    return recognition;
};


/**
 * Calcula un puntaje de similitud entre dos textos.
 * @param {string} reference - El texto de referencia.
 * @param {string} userText - El texto del usuario.
 * @returns {number} - El puntaje de similitud (0-10).
 */
function calculateScore(reference, userText) {
    const refWords = reference.toLowerCase().split(/\s+/);
    const userWords = userText.toLowerCase().split(/\s+/);
    let correctWords = 0;
    
    // Contar las palabras correctas
    userWords.forEach(userWord => {
        if (refWords.includes(userWord)) {
            correctWords++;
        }
    });

    const score = (correctWords / refWords.length) * 10;
    return Math.min(score, 10); // Asegura que el puntaje no sea mayor a 10
}


/**
 * Maneja la lógica de la sección de speaking.
 * @param {HTMLElement} unitSection - La sección de la unidad en el DOM.
 * @param {function} playSound - La función para reproducir sonidos.
 * @param {object} userScores - El objeto de puntajes del usuario.
 */
export const setupSpeakingExercise = (unitSection, playSound, userScores) => {
    const content = `
        <h2 class="titulo-user">Práctica de Habla y Pronunciación</h2>
        <p class="descripcion">Mejora tu pronunciación repitiendo frases en inglés.</p>
        
        <div class="speaking-section">
            <div class="opciones-speaking">
                <select id="speakingTopicSelect" class="select-field">
                    <option value="">-- Selecciona un tema --</option>
                    <option value="greetings">Saludos Básicos</option>
                    <option value="introductions">Presentaciones</option>
                    <option value="questions">Preguntas Frecuentes</option>
                </select>
            </div>
            
            <div id="speaking-area" class="speaking-area">
                <div class="speaking-card">
                    <p class="speaking-phrase-title">Frase a Practicar:</p>
                    <p id="phraseTextSpeaking" class="speaking-phrase">Selecciona un tema para comenzar.</p>
                </div>
                
                <div class="audio-controls-speaking">
                    <button id="audio-play-speaking" class="boton-audio-player disabled-speaking" disabled>▶️ Reproducir</button>
                    <button id="audio-pause-speaking" class="boton-audio boton-audio--pause hidden">⏸️ Pausar</button>
                    <button id="audio-stop-speaking" class="boton-audio boton-audio--stop hidden">⏹️ Parar</button>
                </div>

                <div class="speaking-buttons">
                    <button id="recordBtnSpeaking" class="action-button record-button disabled-speaking" disabled>
                        <i class="fas fa-microphone"></i> Grabar
                    </button>
                    <button id="submitBtnSpeaking" class="action-button next-button hidden">
                        Enviar Audio
                    </button>
                    <button id="nextPhraseBtnSpeaking" class="action-button next-button hidden">Siguiente</button>
                </div>

                <div id="feedbackContainerSpeaking" class="feedback-container hidden">
                    <div id="loadingIndicatorSpeaking" class="loading-indicator hidden">
                        <div class="loading-spinner"></div>
                        <span class="loading-text">Evaluando...</span>
                    </div>
                    <div id="feedbackContentSpeaking"></div>
                </div>
            </div>
            <div id="speakingScoreDisplay" class="score-display"></div>
        </div>
    `;

    unitSection.innerHTML = content;

    const topicSelect = document.getElementById('speakingTopicSelect');
    const phraseTextEl = document.getElementById('phraseTextSpeaking');
    const recordBtn = document.getElementById('recordBtnSpeaking');
    const submitBtn = document.getElementById('submitBtnSpeaking');
    const nextPhraseBtn = document.getElementById('nextPhraseBtnSpeaking');
    const feedbackContainer = document.getElementById('feedbackContainerSpeaking');
    const loadingIndicator = document.getElementById('loadingIndicatorSpeaking');
    const feedbackContent = document.getElementById('feedbackContentSpeaking');
    const scoreDisplay = document.getElementById('speakingScoreDisplay');
    const audioPlayBtn = document.getElementById('audio-play-speaking');
    const audioPauseBtn = document.getElementById('audio-pause-speaking');
    const audioStopBtn = document.getElementById('audio-stop-speaking');
    
    let currentPhrases = [];
    let currentPhraseIndex = 0;
    let recognition = initSpeechRecognition();
    let recordedText = '';


    const displayCurrentScore = () => {
        const speakingScore = userScores.scores?.SPEAKING;
        const score = speakingScore ? speakingScore.score : 0;
       /*  scoreDisplay.innerHTML = `<h3 class="font-bold text-lg">Tu puntaje: ${score.toFixed(1)}/10</h3>`; */
       scoreDisplay.innerHTML = `
                <b style="color:#2563eb;">Tu puntaje mayor es de:</b> ${score.toFixed(1)}/10
                ${score.toFixed(1) >= 10 ? '<br><span style="color:green;font-weight:bold;">¡Felicidades, has completado la sección de Speaking!</span>' : ''}
            `;


    };

    displayCurrentScore();

    topicSelect.addEventListener('change', () => {
        const selectedTopic = topicSelect.value;
        if (selectedTopic && speakingData[selectedTopic]) {
            currentPhrases = speakingData[selectedTopic].phrases;
            currentPhraseIndex = 0;
            phraseTextEl.textContent = currentPhrases[currentPhraseIndex];
            
            // Habilita los botones de grabación y reproducción
            recordBtn.disabled = false;
            audioPlayBtn.disabled = false;
            
            // Elimina la clase disabled para mostrar los colores originales
            recordBtn.classList.remove('disabled-speaking');
            audioPlayBtn.classList.remove('disabled-speaking');

            // Oculta los demás botones y contenedores
            nextPhraseBtn.classList.add('hidden');
            submitBtn.classList.add('hidden');
            feedbackContainer.classList.add('hidden');
        } else {
            // Limpia la frase y deshabilita los botones si no se selecciona un tema válido
            phraseTextEl.textContent = "Selecciona un tema para comenzar.";
            recordBtn.disabled = true;
            audioPlayBtn.disabled = true;
            recordBtn.classList.add('disabled-speaking');
            audioPlayBtn.classList.add('disabled-speaking');
        }
    });

    recordBtn.addEventListener('click', () => {
        if (!recognition) return;
        
        if (!isRecording) {
            recognition.start();
            isRecording = true;
            recordBtn.textContent = "Escuchando...";
            recordBtn.disabled = true;
            submitBtn.classList.add('hidden');
            nextPhraseBtn.classList.add('hidden');
            feedbackContainer.classList.add('hidden');
            loadingIndicator.classList.remove('hidden');

            // Timeout para detener la grabación después de unos segundos
            setTimeout(() => {
                if(isRecording) {
                    recognition.stop();
                    isRecording = false;
                }
            }, 5000); // 5 segundos de grabación máximo
        }
    });

    recognition.onresult = (event) => {
        recordedText = event.results[0][0].transcript;
        recordBtn.textContent = "Grabar";
        recordBtn.disabled = false;
        loadingIndicator.classList.add('hidden');
        submitBtn.classList.remove('hidden');
    };

    recognition.onerror = (event) => {
        loadingIndicator.classList.add('hidden');
        showMessage(`Error en el reconocimiento de voz: ${event.error}`, "error");
        recordBtn.textContent = "Grabar";
        recordBtn.disabled = false;
        isRecording = false;
    };

    submitBtn.addEventListener('click', () => {
        const phrase = currentPhrases[currentPhraseIndex];
        const score = calculateScore(phrase, recordedText);
        
        feedbackContainer.classList.remove('hidden');

        let feedbackMessage = '';

        if (score >= 7) {
            feedbackMessage = `
                <p class="feedback-message--correct">¡Muy bien! ✅</p>
                <p class="feedback-explanation">Tu pronunciación fue excelente.</p>
                <p class="feedback-explanation">Tu puntaje en esta frase: ${score.toFixed(1)}/10</p>
            `;
            playSound("win");
        } else if (score >= 4) {
            feedbackMessage = `
                <p class="feedback-message--warning">¡Casi! 🤔</p>
                <p class="feedback-explanation">Tu pronunciación es buena, pero puedes mejorar. Intenta de nuevo.</p>
                <p class="feedback-explanation">Tu puntaje en esta frase: ${score.toFixed(1)}/10</p>
            `;
            playSound("wrong");
        } else {
            feedbackMessage = `
                <p class="feedback-message--incorrect">¡Inténtalo de nuevo! ❌</p>
                <p class="feedback-explanation">La pronunciación no fue la esperada. Escucha la frase y repite.</p>
                <p class="feedback-explanation">Tu puntaje en esta frase: ${score.toFixed(1)}/10</p>
            `;
            playSound("fail");
        }
        
        feedbackContent.innerHTML = feedbackMessage;

        const user = auth.currentUser;
        if (user) {
            saveSpeakingScore(user.uid, score);
        }
        
        submitBtn.classList.add('hidden');
        nextPhraseBtn.classList.remove('hidden');
        displayCurrentScore();
    });

    nextPhraseBtn.addEventListener('click', () => {
        currentPhraseIndex = (currentPhraseIndex + 1) % currentPhrases.length;
        phraseTextEl.textContent = currentPhrases[currentPhraseIndex];
        feedbackContainer.classList.add('hidden');
        nextPhraseBtn.classList.add('hidden');
        submitBtn.classList.add('hidden');
        recordBtn.disabled = false;
    });



    // Lógica para el reproductor de audio
 audioPlayBtn.addEventListener('click', () =>  {
        window.speechSynthesis.cancel();
        textToSpeak = phraseTextEl.textContent;
        utterance = new SpeechSynthesisUtterance(textToSpeak);
        utterance.lang = 'en-US';
        console.log("reproduciendo:", textToSpeak);
        window.speechSynthesis.speak(utterance);
        console.log("reproducido:", textToSpeak);

    });





};

/**
 * Guarda el puntaje de la unidad SPEAKING en Firestore.
 * @param {string} userId - ID del usuario.
 * @param {number} score - Puntaje obtenido.
 */
async function saveSpeakingScore(userId, score) {
    if (!userId) {
        showMessage("No se pudo guardar el puntaje. Usuario no autenticado.", "error");
        return;
    }

    try {
        const docRef = doc(db, `usuarios/${userId}`);
        const docSnap = await getDoc(docRef);
        const currentData = docSnap.exists() ? docSnap.data() : {};
        const currentScores = currentData.scores || {};
        const prevScore = currentScores['SPEAKING']?.score || 0;
        
        if (score > prevScore) {
             const newScoreEntry = {
                score: score,
                completada: score >= 7,
            };
            
            await setDoc(docRef, {
                ...currentData,
                scores: {
                    ...currentScores,
                    ['SPEAKING']: newScoreEntry
                }
            }, { merge: true });

            showMessage("Puntaje de habla guardado con éxito.", "success");
        }
    } catch (error) {
        console.error("Error al guardar el puntaje de habla:", error);
        showMessage("Error al guardar el puntaje de habla.", "error");
    }
}
