// listening.js

import { auth, db } from "./conexion_firebase.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";
import { showMessage } from "./notificaciones.js";

// Datos de ejemplo para la actividad de listening
// Con rutas de archivos de audio locales
const listeningData = {
     'anna': {
        title: "Anna's Story",
        text: "Anna lives with her parents in Marrickville. Every morning she studies English at the TAFE college in Petersham. In the evening she usually helps her mother with the cooking and the housework, but on Wednesday evening she goes to an Italian cooking class. On Saturday night she goes to the movies with her boyfriend. On Sunday she goes by train to Parramatta to see her aunt and uncle.",
        targetIndices: [1, 10, 23, 31, 37, 50, 58],
        audioUrl: 'assets/anna.wav'
    },
    'family': {
        title: "My Family",
        text: "My family lives in Melbourne. There are six people in my family. My mother and father live in a large house. The house has four bedrooms and a big backyard. There are flowers in the front yard. My older brother, Alan, is married with two children. My younger brother, Bill, and my sister, Sue, live at home. My father works in an office in Belmore. He is a manager. My mother works at home and looks after the house. I am very lucky to have a wonderful family.",
        targetIndices: [2, 6, 19, 25, 32, 42, 55, 59, 68, 75],
        audioUrl: 'assets/my-family.wav'
    },
    'university': {
        title: "At the University",
        text: "I'm Mark. I am a student of Information Technology. Today was a good day for me. The weather was very nice. It was sunny and warm. My bus was on time. It was fast. My teacher was very happy because I was on time for my class. He was friendly. My first class was Databases. It was at 8:00 AM. I learned to save information. Then I had my Programming class. My laptop was good. I typed my code. The program was okay. I finished my work. I checked my email too. At 12 o'clock, my classes finished. I left the university. The sun was still shining. I walked home. It was a great day.",
        targetIndices: [5, 17, 24, 36, 44, 49, 54, 69, 88, 108],
        audioUrl: 'assets/at-university.wav'
    },
    'office': {
        title: "At the Office",
        text: "Yesterday wasn't a good day. The weather wasn't very nice. It was cold and raining. The bus wasn't on time. It was late. My boss wasn't very happy because I was late for work. He was angry. At 1 o'clock I went to a cafe for lunch but the food wasn't hot and the coffee was cold. I wasn't very happy. Then I went back to work but my papers weren't on my desk. They were missing. I looked everywhere but I couldn't find them. Later someone gave them back to me. I left work at 5 o'clock and it started to rain again. I got very wet. Yesterday was a bad day for me.",
        targetIndices: [6, 16, 24, 36, 44, 49, 54, 73, 83, 107],
        audioUrl: 'assets/at-the-office.wav'
    },
    'weekend': {
        title: "Next Weekend",
        text: "Next weekend I'm going to have a great time. On Saturday morning, I'm going to buy some new jeans and a pair of shoes. In the afternoon, I'm going to visit a friend in Punchbowl. At 8 o'clock, I'm going to go to a French restaurant with five friends. On Sunday, I'm going to have an interesting day. I'm going to go to the museum with a friend. After that, I'm going to eat out at an Indian restaurant. I'm going to go to bed late.",
        targetIndices: [1, 10, 13, 30, 41, 49, 54, 73, 83, 107],
        audioUrl: 'assets/next-weekend.wav'
    }
};

/**
 * Genera el texto del quiz convirtiendo palabras específicas por índice en espacios en blanco.
 * @param {string} originalText - El texto completo del audio.
 * @param {number[]} targetIndices - Array de índices (posiciones) de las palabras a omitir.
 * @returns {{quizHtml: string, correctAnswers: string[]}} - El HTML del quiz y las respuestas correctas.
 */
function generateFillInTheBlanks(originalText, targetIndices) {
    const words = originalText.split(/\s+/);
    let quizHtml = '';
    const correctAnswers = [];
    
    // Convertimos el array de índices en un Set para búsquedas rápidas
    const targetSet = new Set(targetIndices); 
    // Variable para llevar la cuenta de qué número de espacio en blanco estamos generando (1 a 10)
    let blankCount = 0; 

    words.forEach((word, index) => {
        const sanitizedWord = word.replace(/[.,?!]/g, '').toLowerCase();

        // **NUEVA LÓGICA:** Comprueba si el índice actual está en nuestra lista de objetivos.
        if (targetSet.has(index)) {
            
            // 1. Incrementamos el contador para obtener el número del espacio (1, 2, 3...)
            blankCount++;
            
            // 2. Creamos el espacio en blanco con el número visible
            quizHtml += `(${blankCount})<input type="text" class="input-blank" data-index="${index}" placeholder="..." /> `;
            
            // 3. Guardamos la palabra correcta.
            correctAnswers.push(sanitizedWord);
            
        } else {
            // Si la palabra no está en la lista, se mantiene en el texto.
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
                <option value="anna">Anna's Story</option>
                <option value="family">My Family</option>
                <option value="university">At the University</option>
                <option value="office">At the office</option>
                <option value="weekend">Next weekend</option>
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
            
            const { quizHtml, correctAnswers } = generateFillInTheBlanks(data.text, data.targetIndices);
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
