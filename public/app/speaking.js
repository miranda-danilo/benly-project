import { auth, db } from "./conexion_firebase.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";
import { showMessage } from "./notificaciones.js";

const speakingData = {
    'greetings': {
        title: "Saludos Básicos",
        phrases: ["Hello, how are you?", "Nice to meet you.", "Good morning.", "Goodbye, see you later.", "How's it going?"]
    },
    'introductions': {
        title: "Presentaciones",
        phrases: ["My name is Joe.", "I am from Ecuador.", "I like to play soccer.", "How old are you?", "What do you do for a living?"]
    },
    'questions': {
        title: "Preguntas Frecuentes",
        phrases: ["Where are you from?", "What is your name?", "What time is it?", "How do you spell that?", "Can you help me, please?"]
    }
};

let recognition = null;
let isRecording = false;

// --- UTILIDADES ---
function normalizarParaComparacion(texto) {
    return texto.toLowerCase()
        .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?'"¡¿]/g, "")
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, ' ').trim();
}

function calculateScore(reference, userText) {
    const refNormalizado = normalizarParaComparacion(reference);
    const userNormalizado = normalizarParaComparacion(userText);
    if (!refNormalizado || !userNormalizado) return 0;

    const refWords = refNormalizado.split(/\s+/);
    const userWords = userNormalizado.split(/\s+/);
    const refWordsSet = new Set(refWords);
    
    let correctWords = 0;
    userWords.forEach(word => {
        if (refWordsSet.has(word)) correctWords++;
    });

    return Math.min((correctWords / refWords.length) * 10, 10);
}

const initSpeechRecognition = () => {
    if (recognition) return recognition;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        showMessage("Tu navegador no soporta el reconocimiento de voz. Usa Chrome.", "error");
        return null;
    }
    recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = false; 
    recognition.interimResults = false;
    return recognition;
};

// --- LÓGICA PRINCIPAL ---
export const setupSpeakingExercise = (unitSection, playSound, userScores) => {
    unitSection.innerHTML = `
        <h2 class="titulo-user">SPEAKING PRACTICE 😎🗣️</h2>
         <p class="descripcion">Improve your pronunciation by repeating common phrases in English.</p>
        <div class="speaking-section">
            <select id="speakingTopicSelect" class="select-field select-field--speaking">
                <option value="">-- SELECT A TOPIC 👆 --</option>
                <option value="greetings">Basic Greetings</option>
                <option value="introductions">Introductions</option>
                <option value="questions">Frequent Questions</option>
            </select>
            <div id="speaking-area" class="speaking-area">
                <div class="speaking-card">
                    <p id="phraseTextSpeaking" class="speaking-phrase">Select a topic to begin.</p>
                </div>
                <div class="audio-controls-speaking">
                    <button id="audio-play-speaking" class="boton-audio-player disabled-speaking" disabled>▶️ Listen</button>
                </div>
                <div class="speaking-buttons">
                    <button id="recordBtnSpeaking" class="action-button record-button disabled-speaking" disabled>
                        <i class="fas fa-microphone"></i> Record
                    </button>
                    <button id="submitBtnSpeaking" class="action-button next-button hidden">Submit Audio</button>
                    <button id="nextPhraseBtnSpeaking" class="action-button next-button hidden">Next</button>
                </div>
                <div id="feedbackContainerSpeaking" class="feedback-container hidden">
                    <div id="loadingIndicatorSpeaking" class="loading-indicator hidden">
                        <div class="loading-spinner"></div>
                        <span>Listening...</span>
                    </div>
                    <div id="feedbackContentSpeaking"></div>
                </div>
            </div>
            <div id="speakingScoreDisplay" class="score-display"></div>
        </div>
    `;

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

    let currentPhrases = [];
    let currentPhraseIndex = 0;
    let recordedText = '';
    const recognition = initSpeechRecognition();

    const updateScoreUI = () => {
        const score = userScores.scores?.SPEAKING?.score || 0;
        scoreDisplay.innerHTML = `<b style="color:#2563eb;">Highest Score:</b> ${score.toFixed(1)}/10`;
    };
    updateScoreUI();

    // --- CONFIGURACIÓN RECOGNITION (Eventos optimizados) ---
    if (recognition) {
        recognition.onstart = () => {
            isRecording = true;
            recordBtn.classList.add('recording-active');
            recordBtn.innerHTML = '<i class="fas fa-stop"></i> Listening...';
            loadingIndicator.classList.remove('hidden');
        };

        recognition.onresult = (event) => {
            recordedText = event.results[0][0].transcript;
            submitBtn.classList.remove('hidden');
        };

        recognition.onerror = (event) => {
            console.error("Speech Error:", event.error);
            if(event.error !== 'no-speech') showMessage(`Error: ${event.error}`, "error");
            resetRecordButton();
        };

        recognition.onend = () => {
            isRecording = false;
            resetRecordButton();
            loadingIndicator.classList.add('hidden');
        };
    }

    function resetRecordButton() {
        recordBtn.disabled = false;
        recordBtn.innerHTML = '<i class="fas fa-microphone"></i> Record';
        recordBtn.classList.remove('recording-active');
    }

    // --- EVENTOS ---
    topicSelect.addEventListener('change', () => {
        const selected = speakingData[topicSelect.value];
        if (selected) {
            currentPhrases = selected.phrases;
            currentPhraseIndex = 0;
            phraseTextEl.textContent = currentPhrases[0];
            recordBtn.disabled = false;
            audioPlayBtn.disabled = false;
            recordBtn.classList.remove('disabled-speaking');
            audioPlayBtn.classList.remove('disabled-speaking');
        }
    });

    recordBtn.addEventListener('click', () => {
        if (!recognition || isRecording) return;
        recordedText = '';
        feedbackContainer.classList.add('hidden');
        submitBtn.classList.add('hidden');
        try {
            recognition.start();
        } catch (e) {
            recognition.stop();
        }
    });

    submitBtn.addEventListener('click', async () => {
        const phrase = currentPhrases[currentPhraseIndex];
        const score = calculateScore(phrase, recordedText);
        
        feedbackContainer.classList.remove('hidden');
        let style = score >= 7 ? 'correct' : score >= 4 ? 'warning' : 'incorrect';
        let icon = score >= 7 ? '✅' : score >= 4 ? '🤔' : '❌';

        feedbackContent.innerHTML = `
            <p class="feedback-message--${style}">${icon} Score: ${score.toFixed(1)}/10</p>
            <p class="feedback-explanation">You said: "<i>${recordedText || "(nothing detected)"}</i>"</p>
        `;

        playSound(score >= 7 ? "win" : score >= 4 ? "wrong" : "fail");

        const user = auth.currentUser;
        if (user) await saveSpeakingScore(user.uid, score);
        
        submitBtn.classList.add('hidden');
        nextPhraseBtn.classList.remove('hidden');
        updateScoreUI();
    });

    nextPhraseBtn.addEventListener('click', () => {
        currentPhraseIndex = (currentPhraseIndex + 1) % currentPhrases.length;
        phraseTextEl.textContent = currentPhrases[currentPhraseIndex];
        feedbackContainer.classList.add('hidden');
        nextPhraseBtn.classList.add('hidden');
        recordBtn.disabled = false;
    });

    audioPlayBtn.addEventListener('click', () => {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(phraseTextEl.textContent);
        utterance.lang = 'en-US';
        utterance.rate = 0.9;
        window.speechSynthesis.speak(utterance);
    });
};

async function saveSpeakingScore(userId, score) {
    try {
        const docRef = doc(db, `usuarios/${userId}`);
        const docSnap = await getDoc(docRef);
        const currentData = docSnap.exists() ? docSnap.data() : {};
        const currentScores = currentData.scores || {};
        const prevScore = currentScores['SPEAKING']?.score || 0;

        if (score > prevScore) {
            await setDoc(docRef, {
                ...currentData,
                scores: { ...currentScores, 'SPEAKING': { score, completada: score >= 7 } }
            }, { merge: true });
        }
    } catch (e) { console.error("Save error:", e); }
}