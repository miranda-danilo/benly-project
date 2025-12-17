import { auth, db } from "./conexion_firebase.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";
import { showMessage } from "./notificaciones.js";

// Color de resaltado deseado: #f9fab1
const HIGHLIGHT_COLOR = '#f9fab1';

// Datos para la actividad de lectura.
// El texto se usa para el ejercicio y las palabras clave se marcan para el crucigrama.
// Datos para el crucigrama, con las palabras reubicadas para evitar cualquier superposición.
const readingData = {
    'story1': {
        title: "A Trip to the Market",
        audioUrl: "assets/audios-reading/story1.mp3", // <-- NUEVO: URL del audio de la historia
        text: "Luis needs to buy tomatoes and onions today. He takes his small red bicycle from the garage now. He rides slowly to the market on the sunny street. When he returns home, his mom gives him a big smile. She thanks him and says, 'Good job, Luis!'",
        placedWords: [
            { word: "sunny", startRow: 2, startCol: 1, orientation: "vertical", color: "hsla(0, 0%, 100%, 1.00)", pronunciation: "assets/audios-reading/sunny.mp3" }, // <-- NUEVO: Pronunciación
            { word: "home", startRow: 3, startCol: 9, orientation: "vertical", color: "hsla(0, 0%, 100%, 1.00)", pronunciation: "assets/audios-reading/home.mp3" },
            { word: "onions", startRow: 5, startCol: 0, orientation: "horizontal", color: "hsla(0, 0%, 100%, 1.00)", pronunciation: "assets/audios-reading/onions.mp3" },
            { word: "smile", startRow: 5, startCol: 5, orientation: "vertical", color: "hsla(0, 0%, 100%, 1.00)", pronunciation: "assets/audios-reading/smile.mp3" },
            { word: "market", startRow: 6, startCol: 5, orientation: "horizontal", color: "hsla(0, 0%, 100%, 1.00)", pronunciation: "assets/audios-reading/market.mp3" },
        ]
    },
    'story2': {
        title: "The Rainy Afternoon Game",
        audioUrl: "assets/audios-reading/story2.mp3",
        text: "It is a cold, rainy Saturday afternoon, and the kids are inside. Sarah and her brother Ben cannot go outside to play in the park. They decide to sit on the floor and play a video game with small blue cars. Sarah wins the game one time, but Ben manages to win three times quickly. They laugh together because the game is fun, even when it rains.",
        placedWords: [
            { word: "small", startRow: 2, startCol: 1, orientation: "horizontal", color: "hsla(0, 0%, 100%, 1.00)", pronunciation: "assets/audios-reading/small.mp3" },
            { word: "laugh", startRow: 2, startCol: 5, orientation: "vertical", color: "hsla(0, 0%, 100%, 1.00)", pronunciation: "assets/audios-reading/laugh.mp3" },
            { word: "floor", startRow: 2, startCol: 7, orientation: "vertical", color: "hsla(0, 0%, 100%, 1.00)", pronunciation: "assets/audios-reading/floor.mp3" },
            { word: "cold", startRow: 5, startCol: 3, orientation: "vertical", color: "hsla(0, 0%, 100%, 1.00)", pronunciation: "assets/audios-reading/cold.mp3" },
            { word: "brother", startRow: 6, startCol: 1, orientation: "horizontal", color: "hsla(0, 0%, 100%, 1.00)", pronunciation: "assets/audios-reading/brother.mp3" },
        ]
    },
    'story3': {
        title: "Homework Before Sleep",
        audioUrl: "assets/audios-reading/story3.mp3",
        text: "Maria is tired after dinner, but she must finish her school homework. She needs to write about three animals: her favorite cat, a fish, and a small bird. She opens her book to find the words and uses a big blue pen to write them down. When she finishes, she puts the book and the pen safely in her large school bag. She is happy because now she can go to bed and sleep.",
        placedWords: [
            { word: "happy", startRow: 2, startCol: 2, orientation: "vertical", color: "hsla(0, 0%, 100%, 1.00)", pronunciation: "assets/audios-reading/happy.mp3" },
            { word: "bag", startRow: 3, startCol: 1, orientation: "horizontal", color: "hsla(0, 0%, 100%, 1.00)", pronunciation: "assets/audios-reading/bag.mp3" },
            { word: "opens", startRow: 5, startCol: 1, orientation: "horizontal", color: "hsla(0, 0%, 100%, 1.00)", pronunciation: "assets/audios-reading/opens.mp3" },
            { word: "school", startRow: 5, startCol: 5, orientation: "vertical", color: "hsla(0, 0%, 100%, 1.00)", pronunciation: "assets/audios-reading/school.mp3" },
            { word: "book", startRow: 8, startCol: 3, orientation: "horizontal", color: "hsla(0, 0%, 100%, 1.00)", pronunciation: "assets/audios-reading/book.mp3" },
        ]
    },
    'story4': {
        title: "Coffee and the Dog",
        audioUrl: "assets/audios-reading/story4.mp3",
        text: "Ms. Helen wakes up and wants her morning hot coffee. She goes to the kitchen and turns on the machine right away. Her dog, Sparky, follows her, waiting for his food. Ms. Helen gives Sparky his breakfast first in his red bowl. Then, she finally sits down and drinks her hot coffee slowly.",
        placedWords: [
            { word: "coffee", startRow: 2, startCol: 2, orientation: "vertical", color: "hsla(0, 0%, 100%, 1.00)", pronunciation: "assets/audios-reading/coffee.mp3" },
            { word: "slowly", startRow: 2, startCol: 4, orientation: "vertical", color: "hsla(0, 0%, 100%, 1.00)", pronunciation: "assets/audios-reading/slowly.mp3" },
            { word: "bowl", startRow: 3, startCol: 1, orientation: "horizontal", color: "hsla(0, 0%, 100%, 1.00)", pronunciation: "assets/audios-reading/bowl.mp3" },
            { word: "goes", startRow: 3, startCol: 7, orientation: "vertical", color: "hsla(0, 0%, 100%, 1.00)", pronunciation: "assets/audios-reading/goes.mp3" },
            { word: "wakes", startRow: 5, startCol: 4, orientation: "horizontal", color: "hsla(0, 0%, 100%, 1.00)", pronunciation: "assets/audios-reading/wakes.mp3" },
        ]
    },
};




function playSoundHd(audioUrl) {
    if (audioUrl) {
        try {
            // Detenemos cualquier audio que se esté reproduciendo actualmente
            if (window.currentAudio) {
                window.currentAudio.pause();
                window.currentAudio.currentTime = 0;
            }
            
            // Creamos y guardamos la nueva instancia de Audio
            const audio = new Audio(audioUrl);
            window.currentAudio = audio; // Lo guardamos globalmente para poder detenerlo

            audio.play().catch(error => {
                console.error("Error al intentar reproducir el audio:", error);
                // Si falla (a menudo por políticas de navegadores que requieren interacción previa),
                // puedes mostrar un mensaje alternativo si es necesario.
            });
        } catch (e) {
            console.error("Error al crear el objeto Audio:", e);
        }
    }
}



/**
 * Genera el HTML del texto con las palabras clave subrayadas.
 * @param {string} text - El texto original.
 * @param {object[]} placedWords - Las palabras clave para resaltar.
 * @returns {string} - El HTML con el texto formateado.
 */
function highlightKeywords(text, placedWords) {
    // Usamos Map para asociar la palabra con su URL de audio (manejo de duplicados en placedWords)
    const keywordsMap = new Map();
    placedWords.forEach(w => {
        if (!keywordsMap.has(w.word.toLowerCase())) {
            // Guarda la URL de pronunciación o una cadena vacía si no existe
            keywordsMap.set(w.word.toLowerCase(), w.pronunciation || '');
        }
    });

    const highlightedWords = new Set();

    return text.replace(/\b(\w+)\b/g, (match, word) => {
        const lowerCaseWord = word.toLowerCase();

        // 1. Debe ser una palabra clave.
        // 2. NO debe haber sido resaltada antes (para evitar duplicidad en el texto).
        if (keywordsMap.has(lowerCaseWord) && !highlightedWords.has(lowerCaseWord)) {
            highlightedWords.add(lowerCaseWord);
            const audioUrl = keywordsMap.get(lowerCaseWord);

            // Agrega el atributo data-audio y la clase 'keyword' para el clic.
            return `<span class="keyword" data-keyword="${lowerCaseWord}" data-audio="${audioUrl}">${match}</span>`;
        }
        return match;
    });
}

/**
 * Genera el HTML para el crucigrama y devuelve la cuadrícula con las respuestas.
 * @param {object[]} placedWords - Las palabras preestablecidas y su ubicación.
 * @returns {string} - El HTML del crucigrama.
 */
function generateCrosswordHtml(placedWords) {
    // Generar una cuadrícula vacía
    const gridRows = 12;
    const gridCols = 12;
    const grid = Array.from({ length: gridRows }, () => Array(gridCols).fill(''));

    // 1. Crear un mapa para identificar la celda inicial de cada palabra y asignarle un número.
    const startCellNumberMap = new Map();
    let wordIndex = 1;

    // Llenar la cuadrícula con las palabras y el mapa de números
    placedWords.forEach(wordData => {
        const word = wordData.word.toUpperCase();
        const startKey = `${wordData.startRow}-${wordData.startCol}`;

        // Asignar número solo si la celda no ha sido marcada como inicio por otra palabra (cruce)
        if (!startCellNumberMap.has(startKey)) {
            startCellNumberMap.set(startKey, wordIndex++);
        }

        for (let i = 0; i < word.length; i++) {
            const r = wordData.orientation === 'horizontal' ? wordData.startRow : wordData.startRow + i;
            const c = wordData.orientation === 'horizontal' ? wordData.startCol + i : wordData.startCol;
            grid[r][c] = word.charAt(i);
        }
    });

    // 2. Generar el HTML
    let crosswordHtml = `<div class="crossword-grid">`;
    for (let r = 0; r < gridRows; r++) {
        for (let c = 0; c < gridCols; c++) {
            const letter = grid[r][c];
            const cellClass = letter ? "filled" : "empty";
            const cellKey = `${r}-${c}`;

            let cellStyle = '';
            let wordData = null; // Para obtener el color correcto

            // Buscar si esta celda corresponde a alguna palabra (para el color)
            if (letter) {
                wordData = placedWords.find(w => {
                    const word = w.word.toUpperCase();
                    if (w.orientation === 'horizontal') {
                        return r === w.startRow && c >= w.startCol && c < w.startCol + word.length;
                    } else {
                        return c === w.startCol && r >= w.startRow && r < w.startRow + word.length;
                    }
                });
            }

            if (wordData) {
                // Usar el color de la palabra que la contiene
                cellStyle = `style="background-color: ${wordData.color};"`;
            }

            // Inicia la celda HTML
            crosswordHtml += `<div class="crossword-cell ${cellClass}" data-row="${r}" data-col="${c}" ${cellStyle}>`;

            // 3. Agregar el número de índice si es una celda de inicio
            if (startCellNumberMap.has(cellKey)) {
                const number = startCellNumberMap.get(cellKey);
                crosswordHtml += `<span class="crossword-number">${number}</span>`;
            }

            // Agregar el input si la celda está llena
            if (letter) {
                crosswordHtml += `<input type="text" maxlength="1" data-row="${r}" data-col="${c}" class="crossword-input" />`;
            }

            crosswordHtml += `</div>`;
        }
    }
    crosswordHtml += `</div>`;
    return crosswordHtml;
}

// ------------------------------------------------
// NUEVA FUNCIÓN DE UTILIDAD: Obtener las celdas de la palabra
// ------------------------------------------------

/**
 * Encuentra todas las celdas (filas y columnas) que forman parte de la palabra
 * a la que pertenece la celda (r, c).
 * @param {number} r - Fila de la celda.
 * @param {number} c - Columna de la celda.
 * @param {object[]} placedWords - Las palabras del crucigrama.
 * @returns {Array<HTMLElement>} - Un array de elementos <div> (celdas).
 */
function getWordCells(r, c, placedWords) {
    const currentWordData = placedWords.find(w => {
        const word = w.word.toUpperCase();
        const len = word.length;

        if (w.orientation === 'horizontal') {
            return r === w.startRow && c >= w.startCol && c < w.startCol + len;
        } else {
            return c === w.startCol && r >= w.startRow && r < w.startRow + len;
        }
    });

    if (!currentWordData) return [];

    const cells = [];
    const word = currentWordData.word.toUpperCase();
    const len = word.length;

    for (let i = 0; i < len; i++) {
        const row = currentWordData.orientation === 'horizontal' ? currentWordData.startRow : currentWordData.startRow + i;
        const col = currentWordData.orientation === 'horizontal' ? currentWordData.startCol + i : currentWordData.startCol;

        // Usar querySelector para obtener el elemento DIV de la celda
        const cell = document.querySelector(`.crossword-cell[data-row="${row}"][data-col="${col}"]`);
        if (cell) {
            cells.push(cell);
        }
    }
    return cells;
}


// ------------------------------------------------
// CÓDIGO setupReadingExercise MODIFICADO
// ------------------------------------------------

/**
 * Maneja la lógica de la sección de lectura.
 * @param {HTMLElement} unitSection - La sección de la unidad en el DOM.
 * @param {function} playSound - La función para reproducir sonidos.
 * @param {object} userScores - El objeto de puntajes del usuario.
 */
export const setupReadingExercise = (unitSection, playSound, userScores) => {
    const content = `
        <h2 class="titulo-user">READING PRACTICE AND CROSSWORD PUZZLE 🤩🧩</h2>
        <p class="descripcion">Read the text and find the keywords. Then, place them in the crossword puzzle.</p>

        <div class="opciones-reading">
            <select id="readingTopicSelect" class="select-field">
                <option value="">-- SELECT A STORY 👆 --</option>
                <option value="story1">A Trip to the Market</option>
                <option value="story2">The Rainy Afternoon Game</option>
                <option value="story3">Homework Before Sleep</option>
                <option value="story4">Coffee and the Dog</option>
            </select>
            <button id="loadReadingBtn" class="boton-primario">Load puzzle crossword</button>
        </div>


                <div id="scoreDisplayReading" class="score-display"></div>

        <div id="reading-area" class="reading-area hidden">
            <h3 id="storyTitle" class="story-title"></h3>

<button id="playStoryAudioBtn" class="boton-secundario mb-4 hidden">🎧 Reproducir Historia Completa</button>

            <div class="reading-card">
                <p id="readingText" class="reading-text"></p>
            </div>
            <div class="crossword-container">
                <div class="crossword-header">
                    <h4 class="crossword-title">Crucigrama</h4>
                </div>
                <div id="crosswordGrid" class="crossword-grid-container"></div>
            </div>
            <div class="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 mt-4">
                <button id="checkCrosswordBtn" class="action-button">Verificar Crucigrama</button>
                <button id="repeatCrosswordBtn" class="boton-quiz--repeat hidden">Repetir Crucigrama</button>
            </div>
            <div id="reading-score-display" class="mt-4 text-center font-bold text-lg"></div>
            <div id="highest-score-display" class="mt-2 text-center text-sm"></div>
        </div>
    `;

    unitSection.innerHTML = content;

    const topicSelect = document.getElementById('readingTopicSelect');
    const loadReadingBtn = document.getElementById('loadReadingBtn');
    const readingArea = document.getElementById('reading-area');
    const storyTitleEl = document.getElementById('storyTitle');
    const readingTextEl = document.getElementById('readingText');
    const crosswordGridEl = document.getElementById('crosswordGrid');
    const playStoryAudioBtn = document.getElementById('playStoryAudioBtn'); // <-- NUEVA REFERENCIA
    const checkCrosswordBtn = document.getElementById('checkCrosswordBtn');
    const repeatCrosswordBtn = document.getElementById('repeatCrosswordBtn');
    const readingScoreDisplayEl = document.getElementById('reading-score-display');
    const highestScoreDisplayEl = document.getElementById('highest-score-display');
    const scoreDisplayReading = document.getElementById('scoreDisplayReading');

    let currentLayout = null;
    let originalColors = {};
    let selectedTopic = null; // Variable para almacenar el tópico seleccionado

    // Carga inicial del puntaje de lectura si existe
    const displayInitialScore = async () => {
        const user = auth.currentUser;
        if (user) {
            const scoreData = await getReadingScore(user.uid);
            if (scoreData) {
                scoreDisplayReading.innerHTML = `
                    <b style="color:#2563eb;">Tu puntaje mayor es de:</b> ${scoreData.score.toFixed(1)}/10
                    ${scoreData.score >= 10 ? '<br><span style="color:green;font-weight:bold;">¡Felicidades, has completado la sección de lectura!</span>' : ''}
                `;
            } else {
                scoreDisplayReading.innerHTML = '';
            }
        }
    };

    displayInitialScore();

    // Manejador del botón de cargar historia
    loadReadingBtn.addEventListener('click', async () => {
        selectedTopic = topicSelect.value;
        if (!selectedTopic) {
            showMessage("Por favor, selecciona una historia.", "warning");
            return;
        }

        try {
            const data = readingData[selectedTopic];
            if (data) {
                readingArea.classList.remove('hidden');
                storyTitleEl.textContent = data.title;

                currentLayout = data.placedWords;
// ------------------------------------------------
                // 1. MANEJO DEL AUDIO DE LA HISTORIA
                // ------------------------------------------------
                if (data.audioUrl) {
                    playStoryAudioBtn.classList.remove('hidden');
                    playStoryAudioBtn.onclick = () => {
                        playSoundHd(data.audioUrl);
                    };
                } else {
                    playStoryAudioBtn.classList.add('hidden');
                }
                // Genera el crucigrama y el texto con palabras resaltadas
                readingTextEl.innerHTML = highlightKeywords(data.text, currentLayout);
                crosswordGridEl.innerHTML = generateCrosswordHtml(readingData[selectedTopic].placedWords);

// ------------------------------------------------
                // 2. MANEJO DEL AUDIO DE PRONUNCIACIÓN DE PALABRAS (Event Listeners)
                // ------------------------------------------------
                document.querySelectorAll('.keyword').forEach(keywordSpan => {
                    // Establecer cursor para indicar que es clickeable
                    keywordSpan.style.cursor = 'pointer'; 
                    keywordSpan.title = 'Haz clic para escuchar la pronunciación';

                    keywordSpan.addEventListener('click', (e) => {
                        const audioUrl = e.currentTarget.dataset.audio;
                        if (audioUrl) {
                            playSoundHd(audioUrl); 
                        } else {
                            showMessage("Audio de pronunciación no disponible.", "warning");
                        }
                    });
                });


                // Guarda los colores originales para poder restaurarlos
                originalColors = {};
                document.querySelectorAll('.crossword-cell.filled').forEach(cell => {
                    originalColors[cell.dataset.row + '-' + cell.dataset.col] = cell.style.backgroundColor || 'transparent'; // Guarda el color
                });


                // Muestra los botones
                checkCrosswordBtn.classList.remove('hidden');
                repeatCrosswordBtn.classList.add('hidden');

                // Limpia el puntaje del intento anterior
                readingScoreDisplayEl.innerHTML = '';

                document.querySelectorAll('.crossword-input').forEach(input => {
                    input.disabled = false;
                    input.value = '';

                    // Manejador del evento de ENTRADA (Input) - ELIMINADO: retroalimentación de color inmediato
                    input.addEventListener('input', (e) => {
                        // NO HACEMOS NADA DE VERDE/ROJO AQUÍ

                        // Navegación automática según la orientación de la palabra
                        const row = parseInt(e.target.dataset.row);
                        const col = parseInt(e.target.dataset.col);

                        // Obtenemos solo la primera palabra a la que pertenece (simplificación para el movimiento)
                        const placedWord = readingData[selectedTopic].placedWords.find(w => {
                            const word = w.word.toUpperCase();
                            if (w.orientation === 'horizontal') {
                                return row === w.startRow && col >= w.startCol && col < w.startCol + word.length;
                            } else {
                                return col === w.startCol && row >= w.startRow && row < w.startRow + word.length;
                            }
                        });

                        if (e.target.value.length === e.target.maxLength && placedWord) {
                            let nextInput;
                            if (placedWord.orientation === 'horizontal') {
                                nextInput = document.querySelector(`.crossword-input[data-row="${row}"][data-col="${col + 1}"]`);
                            } else {
                                nextInput = document.querySelector(`.crossword-input[data-row="${row + 1}"][data-col="${col}"]`);
                            }
                            if (nextInput) {
                                nextInput.focus();
                            }
                        }
                    });


                    // ------------------------------------------------
                    // NUEVO MANEJADOR: FOCUS (Resaltar la palabra completa)
                    // ------------------------------------------------
                    input.addEventListener('focus', (e) => {
                        const row = parseInt(e.target.dataset.row);
                        const col = parseInt(e.target.dataset.col);

                        const cellsToHighlight = getWordCells(row, col, readingData[selectedTopic].placedWords);

                        cellsToHighlight.forEach(cell => {
                            // Usar una clase o style para el resaltado
                            cell.style.backgroundColor = HIGHLIGHT_COLOR;
                            cell.classList.add('highlighted');
                        });
                    });

                    // ------------------------------------------------
                    // NUEVO MANEJADOR: BLUR (Restaurar el color original)
                    // ------------------------------------------------
                    input.addEventListener('blur', (e) => {
                        const allHighlightedCells = document.querySelectorAll('.crossword-cell.highlighted');
                        allHighlightedCells.forEach(cell => {
                            const cellKey = cell.dataset.row + '-' + cell.dataset.col;
                            // Restaurar al color original guardado
                            cell.style.backgroundColor = originalColors[cellKey] || 'transparent';
                            cell.classList.remove('highlighted');
                        });
                    });

                    // Manejador del evento de presionar tecla (keydown)
                    input.addEventListener('keydown', (e) => {
                        if (e.key === 'Backspace') {
                            const inputs = Array.from(document.querySelectorAll('.crossword-input'));
                            const currentIndex = inputs.indexOf(e.target);

                            if (e.target.value.length === 0) {
                                e.preventDefault();
                                if (currentIndex > 0) {
                                    inputs[currentIndex - 1].focus();
                                }
                            }
                        }
                    });
                });
            } else {
                showMessage("Datos de historia no encontrados.", "error");
            }
        } catch (error) {
            console.error("Error al cargar la historia:", error);
            showMessage("Ocurrió un error al cargar la historia.", "error");
        }
    });

    // Manejador del botón de verificar crucigrama
    checkCrosswordBtn.addEventListener('click', async () => {
        let correctWords = 0;
        const totalWords = currentLayout.length;

        currentLayout.forEach(wordData => {
            let isWordCorrect = true;
            const word = wordData.word.toUpperCase();

            for (let i = 0; i < word.length; i++) {
                const r = wordData.orientation === 'horizontal' ? wordData.startRow : wordData.startRow + i;
                const c = wordData.orientation === 'horizontal' ? wordData.startCol + i : wordData.startCol;

                const input = document.querySelector(`.crossword-input[data-row="${r}"][data-col="${c}"]`);
                const cell = document.querySelector(`.crossword-cell[data-row="${r}"][data-col="${c}"]`);

                if (!input || input.value.toUpperCase() !== word.charAt(i)) {
                    isWordCorrect = false;

                    // Retroalimentación de color (ROJO) al verificar
                    if (cell) cell.style.backgroundColor = 'var(--incorrect-color)';

                } else {
                    // Retroalimentación de color (VERDE) al verificar
                    if (cell) cell.style.backgroundColor = 'var(--correct-color)';
                }
            }
            if (isWordCorrect) {
                correctWords++;
            }
        });

        const score = (correctWords / totalWords) * 10;

        // Muestra el puntaje del intento actual
        readingScoreDisplayEl.innerHTML = `Puntaje de este intento: ${score.toFixed(1)}/10`;

        const user = auth.currentUser;
        if (user) {
            await saveReadingScore(user.uid, score);
            // Vuelve a cargar y mostrar el puntaje más alto después de guardar
            displayInitialScore();
        }

        if (score >= 7) {
            playSound("win");
            showMessage("¡Excelente! Has completado el crucigrama con éxito.", "success");
        } else {
            playSound("fail");
            showMessage("Sigue practicando, puedes intentarlo de nuevo.", "warning");
        }

        document.querySelectorAll('.crossword-input').forEach(input => input.disabled = true);
        checkCrosswordBtn.classList.add('hidden');
        repeatCrosswordBtn.classList.remove('hidden');
    });

    // Manejador del botón de repetir
    repeatCrosswordBtn.addEventListener('click', () => {
        readingArea.classList.add('hidden');
        topicSelect.value = '';
        readingScoreDisplayEl.innerHTML = '';
        checkCrosswordBtn.classList.remove('hidden');
        repeatCrosswordBtn.classList.add('hidden');
    });
};


/**
 * Guarda el puntaje del ejercicio de lectura en Firestore.
 * @param {string} userId - ID del usuario.
 * @param {number} score - Puntaje obtenido.
 */
async function saveReadingScore(userId, score) {
    if (!userId) {
        showMessage("No se pudo guardar el puntaje. Usuario no autenticado.", "error");
        return;
    }

    try {
        const docRef = doc(db, `usuarios/${userId}`);
        const docSnap = await getDoc(docRef);
        const currentData = docSnap.exists() ? docSnap.data() : {};
        const currentScores = currentData.scores || {};
        const prevScore = currentScores['READING']?.score || 0;

        if (score > prevScore) {
            const newScoreEntry = {
                score: score,
                completada: score >= 7,
            };

            await setDoc(docRef, {
                ...currentData,
                scores: {
                    ...currentScores,
                    ['READING']: newScoreEntry
                }
            }, { merge: true });

            showMessage("Puntaje de lectura guardado con éxito.", "success");
        }
    } catch (error) {
        console.error("Error al guardar el puntaje de lectura:", error);
        showMessage("Error al guardar el puntaje de lectura.", "error");
    }
}

/**
 * Obtiene el puntaje del ejercicio de lectura de Firestore.
 * @param {string} userId - ID del usuario.
 */
async function getReadingScore(userId) {
    try {
        const docRef = doc(db, `usuarios/${userId}`);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().scores && docSnap.data().scores['READING']) {
            return docSnap.data().scores['READING'];
        }
        return null;
    } catch (error) {
        console.error("Error al obtener el puntaje de lectura:", error);
        return null;
    }
}