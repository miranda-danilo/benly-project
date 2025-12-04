// listening.js

import { auth, db } from "./conexion_firebase.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";
import { showMessage } from "./notificaciones.js";

// Datos de ejemplo para la actividad de listening
// Con rutas de archivos de audio locales
const listeningData = {
    'pets': {
        title: "My Favorite Pet",
        text: "My favorite animal is a cat. It's a small, fluffy animal that loves to play. Cats are very good pets for people who live in apartments.",
        audioUrl: 'assets/my-favorite-animal.wav'
    },
    'food': {
        title: "Healthy Eating",
        text: "Eating a balanced diet is very important for our health. We should eat a lot of fruits and vegetables every day. Remember to drink water too.",
        audioUrl: 'assets/balanced-diet.wav'
    },
    'travel': {
        title: "Summer Vacation",
        text: "Last summer, I went to the beach. The weather was sunny and hot. I swam in the ocean and built sandcastles. It was a very relaxing trip.",
        audioUrl: 'assets/summer.wav'
    },
    'technology': {
        title: "The Internet",
        text: "The internet is a vast network that connects millions of computers worldwide. We use it for communication, work, and entertainment. It has changed our lives in many ways.",
        audioUrl: 'assets/internet.wav'
    },
    'art': {
        title: "Modern Art",
        text: "Modern art often challenges traditional ideas about what art should be. It includes many different styles and movements, like cubism and surrealism. It is a very exciting field.",
        audioUrl: 'assets/art.wav'
    }
};

/**
 * Genera el texto del quiz con palabras faltantes (espacios en blanco).
 * @param {string} originalText - El texto completo del audio.
 * @returns {{quizHtml: string, correctAnswers: string[]}} - El HTML del quiz y las respuestas correctas.
 */
function generateFillInTheBlanks(originalText) {
    const words = originalText.split(/\s+/);
    const blanks = [];
    let quizHtml = '';
    const correctAnswers = [];

    // Lógica para quitar una palabra de cada 5
    words.forEach((word, index) => {
        const sanitizedWord = word.replace(/[.,?!]/g, '').toLowerCase();
        if (index % 5 === 0 && sanitizedWord.length > 2) {
            quizHtml += `<input type="text" class="input-blank" data-index="${index}" placeholder="..." /> `;
            correctAnswers.push(sanitizedWord);
            blanks.push(index);
        } else {
            quizHtml += `${word} `;
        }
    });

    return { quizHtml, correctAnswers };
}

/**
 * Maneja la lógica de la sección de listening.
 * @param {HTMLElement} unitSection - La sección de la unidad en el DOM.
 * @param {function} playSound - La función para reproducir sonidos.
 * @param {object} userScores - El objeto de puntajes del usuario.
 */
export const setupListeningExercise = (unitSection, playSound, userScores) => {
    const content = `
        <h2 class="titulo-user">Práctica de Escucha</h2>
        <p class="descripcion">Escoge un tema para practicar tu habilidad de escucha.</p>
        <div class="opciones-listening">
            <select id="listeningTopicSelect" class="select-field">
                <option value="">-- Selecciona un tema --</option>
                <option value="pets">My Favorite Pet</option>
                <option value="food">Healthy Eating</option>
                <option value="travel">Summer Vacation</option>
                <option value="technology">The Internet</option>
                <option value="art">Modern Art</option>
            </select>
            <button id="loadAudioBtn" class="boton-primario">Cargar Audio</button>
        </div>

        <div id="listening-area" class="listening-area">
            <div id="loadingIndicator" class="loading-indicator hidden">
                <div class="loading-bar"></div>
                <span class="loading-text">Generando audio...</span>
            </div>
            <div id="scoreDisplay" class="score-display"></div>
            <div id="audioPlayerContainer"></div>
            <div id="quizContainer" class="quiz-container hidden">
                <p id="quizText" class="quiz-text"></p>
                <button id="verifyBtn" class="boton-secundario" style="display: none;">Verificar Respuestas</button>
                <button id="repeatBtn" class="boton-secundario" style="display: none;">Repetir</button>
            </div>
        </div>
    `;

    unitSection.innerHTML = content;

    const topicSelect = document.getElementById('listeningTopicSelect');
    const loadAudioBtn = document.getElementById('loadAudioBtn');
    const audioPlayerContainer = document.getElementById('audioPlayerContainer');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const quizContainer = document.getElementById('quizContainer');
    const quizTextEl = document.getElementById('quizText');
    const verifyBtn = document.getElementById('verifyBtn');
    const repeatBtn = document.getElementById('repeatBtn');
    const scoreDisplay = document.getElementById('scoreDisplay');
    
    let currentCorrectAnswers = [];

    // Carga el puntaje inicial si existe
    const displayInitialScore = () => {
        const topicScore = userScores.scores?.LISTENING;
        const score = topicScore ? topicScore.score : 0;
      /*   scoreDisplay.innerHTML = `<b style="color:#2563eb;>Tu puntaje mayor es de:</b> ${score.toFixed(1)}/10 ${score.toFixed(10) >= 10  ? '<br><span style="color:green;font-weight:bold;">¡Felicidades, has completado la sección de listening!</span>' : ''}` */

        scoreDisplay.innerHTML = `
                <b style="color:#2563eb;">Tu puntaje mayor es de:</b> ${score.toFixed(1)}/10
                ${score.toFixed(1) >= 10 ? '<br><span style="color:green;font-weight:bold;">¡Felicidades, has completado la sección de listening!</span>' : ''}
            `

/* `
                <b style="color:#2563eb;">Tu puntaje mayor es de:</b> ${highestScore}/10 ${highestScore >= 10 ? '<br><span style="color:green;font-weight:bold;">¡Felicidades, has completado la sección de escritura!</span>' : ''}
            ` */

    };
    displayInitialScore();

    const resetUI = () => {
        audioPlayerContainer.innerHTML = '';
        quizContainer.classList.add('hidden');
        verifyBtn.style.display = 'none';
        repeatBtn.style.display = 'none';
        scoreDisplay.innerHTML = '';
    };

    topicSelect.addEventListener('change', () => {
        resetUI();
        displayInitialScore();
    });

    loadAudioBtn.addEventListener('click', async () => {
        const selectedTopic = topicSelect.value;
        if (!selectedTopic) {
            showMessage("Por favor, selecciona un tema preestablecido.", "warning");
            return;
        }

        resetUI();
        loadingIndicator.classList.remove('hidden');
        
        try {
            const data = listeningData[selectedTopic];
            
            // Carga el audio desde la ruta preestablecida
            const audioUrl = data.audioUrl;
            
            audioPlayerContainer.innerHTML = `
                <audio id="audioPlayer" class="w-full" controls src="${audioUrl}"></audio>
            `;
            
            const { quizHtml, correctAnswers } = generateFillInTheBlanks(data.text);
            quizTextEl.innerHTML = quizHtml;
            currentCorrectAnswers = correctAnswers;
            quizContainer.classList.remove('hidden');
            verifyBtn.style.display = 'block';

        } catch (error) {
            showMessage("Ocurrió un error al cargar el audio. Por favor, inténtalo de nuevo.", "error");
            console.error(error);
        } finally {
            loadingIndicator.classList.add('hidden');
        }
    });

    // Manejador del botón de verificación
    verifyBtn.addEventListener('click', () => {
        const userInputs = Array.from(document.querySelectorAll('.input-blank')).map(input => input.value.trim().toLowerCase());
        let correctCount = 0;
        let scoreHtml = '';
        
        userInputs.forEach((input, index) => {
            const correctAnswer = currentCorrectAnswers[index];
            const inputEl = document.querySelectorAll('.input-blank')[index];
            if (input === correctAnswer) {
                correctCount++;
                inputEl.style.color = 'green';
            } else {
                inputEl.style.color = 'red';
            }
            inputEl.value = correctAnswer; // Muestra la respuesta correcta
            inputEl.disabled = true; // Deshabilita el campo
        });

        const totalQuestions = currentCorrectAnswers.length;
        const score = (correctCount / totalQuestions) * 10;
        scoreHtml = `
            <h3 class="font-bold text-lg">Tu puntaje: ${score.toFixed(1)}/10</h3>
            <p>Respuestas correctas: ${correctCount} de ${totalQuestions}</p>
        `;

        if (score >= 7) {
            playSound("win");
            showMessage("¡Excelente trabajo! Has pasado el ejercicio de listening.", "success");
        } else {
            playSound("fail");
            showMessage("Sigue practicando. Puedes intentarlo de nuevo.", "info");
        }

        scoreDisplay.innerHTML = scoreHtml;
        saveListeningScore(auth.currentUser.uid, score);
        verifyBtn.style.display = 'none';
        repeatBtn.style.display = 'block';
    });

    // Manejador del botón de repetir
    repeatBtn.addEventListener('click', () => {
        quizContainer.classList.add('hidden');
        displayInitialScore();
        audioPlayerContainer.innerHTML = '';
        quizTextEl.innerHTML = '';
        verifyBtn.style.display = 'none';
        repeatBtn.style.display = 'none';
        scoreDisplay.innerHTML = '';
        topicSelect.value = '';
    });
};

/**
 * Guarda el puntaje del ejercicio de listening en Firestore.
 * @param {string} userId - ID del usuario.
 * @param {number} score - Puntaje obtenido.
 */
async function saveListeningScore(userId, score) {
    if (!userId) {
        showMessage("No se pudo guardar el puntaje. Usuario no autenticado.", "error");
        return;
    }

    try {
        const docRef = doc(db, `usuarios/${userId}`);
        const docSnap = await getDoc(docRef);
        const currentData = docSnap.exists() ? docSnap.data() : {};
        const currentScores = currentData.scores || {};
        const prevScore = currentScores['LISTENING']?.score || 0;

        if (score > prevScore) {
             const newScoreEntry = {
                score: score,
                completada: score >= 7,
            };
            
            await setDoc(docRef, {
                ...currentData,
                scores: {
                    ...currentScores,
                    ['LISTENING']: newScoreEntry
                }
            }, { merge: true });

            showMessage("Puntaje de listening guardado con éxito.", "success");
        }
    } catch (error) {
        console.error("Error al guardar el puntaje de listening:", error);
        showMessage("Error al guardar el puntaje de listening.", "error");
    }
}
