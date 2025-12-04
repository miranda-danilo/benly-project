import { auth, db } from "./conexion_firebase.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";
import { showMessage } from "./notificaciones.js";

// Datos para la actividad de lectura.
// El texto se usa para el ejercicio y las palabras clave se marcan para el crucigrama.
// Datos para el crucigrama, con las palabras reubicadas para evitar cualquier superposición.
const readingData = {
    'story1': {
        title: "The Little Red Hen",
        text: "Once upon a time, there lived a little red hen who lived on a farm. She found a grain of wheat and asked her friends for help to plant it, but they all said no. She planted the grain herself. When the wheat was ready, she asked for help to cut it and take it to the mill, but her friends said no. The hen did it all by herself. When the bread was baked, she asked her friends if they wanted to eat it. This time, they all said yes! But the little red hen said, 'No, I did it all by myself, so I will eat it all by myself.' And she did.",
        placedWords: [
            { word: "hen", startRow: 10, startCol: 3, orientation: "horizontal", color: "hsla(10, 70%, 50%, 0.8)" },
            { word: "farm", startRow: 4, startCol: 5, orientation: "horizontal", color: "hsla(40, 70%, 50%, 0.8)" },
            { word: "wheat", startRow: 0, startCol: 9, orientation: "vertical", color: "hsla(70, 70%, 50%, 0.8)" },
            { word: "mill", startRow: 8, startCol: 2, orientation: "horizontal", color: "hsla(120, 70%, 50%, 0.8)" },
            { word: "bread", startRow: 1, startCol: 1, orientation: "horizontal", color: "hsla(180, 70%, 50%, 0.8)" },
            { word: "eat", startRow: 6, startCol: 0, orientation: "horizontal", color: "hsla(220, 70%, 50%, 0.8)" },
            { word: "friends", startRow: 5, startCol: 1, orientation: "horizontal", color: "hsla(260, 70%, 50%, 0.8)" },
            { word: "cut", startRow: 3, startCol: 0, orientation: "horizontal", color: "hsla(300, 70%, 50%, 0.8)" }
        ]
    },
    'story2': {
        title: "The Tortoise and the Hare",
        text: "A boastful hare once challenged a slow tortoise to a race. The hare was so fast that he ran far ahead and decided to take a nap. The tortoise, who was slow but persistent, continued to walk without stopping. While the hare was sleeping, the tortoise passed him by. When the hare woke up, he saw the tortoise was already at the finish line and had won the race. This story teaches us that being slow and steady can win the race.",
        placedWords: [
            { word: "slow", startRow: 0, startCol: 2, orientation: "horizontal", color: "hsla(10, 70%, 50%, 0.8)" },
            { word: "race", startRow: 2, startCol: 2, orientation: "horizontal", color: "hsla(40, 70%, 50%, 0.8)" },
            { word: "fast", startRow: 5, startCol: 1, orientation: "horizontal", color: "hsla(70, 70%, 50%, 0.8)" },
            { word: "won", startRow: 8, startCol: 2, orientation: "horizontal", color: "hsla(120, 70%, 50%, 0.8)" },
            { word: "steady", startRow: 10, startCol: 2, orientation: "horizontal", color: "hsla(180, 70%, 50%, 0.8)" },
            { word: "hare", startRow: 1, startCol: 8, orientation: "vertical", color: "hsla(220, 70%, 50%, 0.8)" },
            { word: "finish", startRow: 6, startCol: 7, orientation: "vertical", color: "hsla(260, 70%, 50%, 0.8)" },
            { word: "wake", startRow: 0, startCol: 11, orientation: "vertical", color: "hsla(300, 70%, 50%, 0.8)" }
        ]
    },
    'story3': {
        title: "A Day at the Park",
        text: "Today is a beautiful day. I go to the park with my friends. The sun is warm and bright. We see a big tree and many small flowers. We like to play games and run with a ball. It is a lot of fun.",
        placedWords: [
            { word: "park", startRow: 0, startCol: 1, orientation: "vertical", color: "hsla(10, 70%, 50%, 0.8)" },
            { word: "run", startRow: 2, startCol: 5, orientation: "horizontal", color: "hsla(40, 70%, 50%, 0.8)" },
            { word: "flowers", startRow: 5, startCol: 0, orientation: "horizontal", color: "hsla(70, 70%, 50%, 0.8)" },
            { word: "ball", startRow: 1, startCol: 5, orientation: "horizontal", color: "hsla(120, 70%, 50%, 0.8)" },
            { word: "tree", startRow: 7, startCol: 3, orientation: "horizontal", color: "hsla(180, 70%, 50%, 0.8)" },
            { word: "day", startRow: 9, startCol: 1, orientation: "horizontal", color: "hsla(220, 70%, 50%, 0.8)" },
            { word: "sun", startRow: 0, startCol: 7, orientation: "horizontal", color: "hsla(260, 70%, 50%, 0.8)" },
            { word: "fun", startRow: 6, startCol: 7, orientation: "horizontal", color: "hsla(300, 70%, 50%, 0.8)" }
        ]
    },
    'story4': {
        title: "My Family",
        text: "I have a big family. I live in a big house with my mom, my dad, and my brother. We also have a dog. My sister lives in another city, but we visit her. We love our family very much.",
        placedWords: [
            { word: "family", startRow: 1, startCol: 0, orientation: "horizontal", color: "hsla(10, 70%, 50%, 0.8)" },
            { word: "house", startRow: 7, startCol: 0, orientation: "horizontal", color: "hsla(40, 70%, 50%, 0.8)" },
            { word: "mom", startRow: 3, startCol: 3, orientation: "horizontal", color: "hsla(70, 70%, 50%, 0.8)" },
            { word: "sister", startRow: 0, startCol: 7, orientation: "horizontal", color: "hsla(120, 70%, 50%, 0.8)" },
            { word: "brother", startRow: 6, startCol: 1, orientation: "horizontal", color: "hsla(180, 70%, 50%, 0.8)" },
            { word: "dog", startRow: 8, startCol: 7, orientation: "horizontal", color: "hsla(220, 70%, 50%, 0.8)" },
            { word: "live", startRow: 2, startCol: 12, orientation: "vertical", color: "hsla(260, 70%, 50%, 0.8)" },
            { word: "city", startRow: 4, startCol: 9, orientation: "vertical", color: "hsla(300, 70%, 50%, 0.8)" }
        ]
    },
    'story5': {
        title: "At School",
        text: "I like to go to school. My friends are in my class. We have a good teacher. We learn to read and write. I have a book and a pencil in my bag.",
        placedWords: [
            { word: "school", startRow: 0, startCol: 4, orientation: "horizontal", color: "hsla(10, 70%, 50%, 0.8)" },
            { word: "friends", startRow: 2, startCol: 3, orientation: "horizontal", color: "hsla(40, 70%, 50%, 0.8)" },
            { word: "teacher", startRow: 4, startCol: 1, orientation: "horizontal", color: "hsla(70, 70%, 50%, 0.8)" },
            { word: "read", startRow: 6, startCol: 1, orientation: "horizontal", color: "hsla(120, 70%, 50%, 0.8)" },
            { word: "book", startRow: 8, startCol: 0, orientation: "horizontal", color: "hsla(180, 70%, 50%, 0.8)" },
            { word: "write", startRow: 10, startCol: 1, orientation: "horizontal", color: "hsla(220, 70%, 50%, 0.8)" },
            { word: "pencil", startRow: 9, startCol: 3, orientation: "horizontal", color: "hsla(260, 70%, 50%, 0.8)" },
            { word: "class", startRow: 0, startCol: 10, orientation: "vertical", color: "hsla(300, 70%, 50%, 0.8)" }
        ]
    },
};


/**
 * Genera el HTML del texto con las palabras clave subrayadas.
 * @param {string} text - El texto original.
 * @param {object[]} placedWords - Las palabras clave para resaltar.
 * @returns {string} - El HTML con el texto formateado.
 */
function highlightKeywords(text, placedWords) {
    const keywordsToHighlight = new Set(placedWords.map(word => word.word.toLowerCase()));

    return text.replace(/\b(\w+)\b/g, (match, word) => {
        if (keywordsToHighlight.has(word.toLowerCase())) {
            return `<span class="keyword" data-keyword="${word.toLowerCase()}">${match}</span>`;
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

    // Llenar la cuadrícula con las palabras
    placedWords.forEach(wordData => {
        const word = wordData.word.toUpperCase();
        for (let i = 0; i < word.length; i++) {
            const r = wordData.orientation === 'horizontal' ? wordData.startRow : wordData.startRow + i;
            const c = wordData.orientation === 'horizontal' ? wordData.startCol + i : wordData.startCol;
            grid[r][c] = word.charAt(i);
        }
    });

    // Generar el HTML
    let crosswordHtml = `<div class="crossword-grid">`;
    for (let r = 0; r < gridRows; r++) {
        for (let c = 0; c < gridCols; c++) {
            const letter = grid[r][c];
            const cellClass = letter ? "filled" : "empty";
            
            let cellStyle = '';
            let isStartCell = false;
            let startColor = '';

            const wordData = placedWords.find(w => {
                const word = w.word.toUpperCase();
                if (w.orientation === 'horizontal') {
                    if (r === w.startRow && c >= w.startCol && c < w.startCol + word.length) {
                        if (c === w.startCol) isStartCell = true;
                        startColor = w.color;
                        return true;
                    }
                } else {
                    if (c === w.startCol && r >= w.startRow && r < w.startRow + word.length) {
                        if (r === w.startRow) isStartCell = true;
                        startColor = w.color;
                        return true;
                    }
                }
                return false;
            });
            
            if (letter) {
                cellStyle = `style="background-color: ${wordData.color};"`;
            }

            crosswordHtml += `<div class="crossword-cell ${cellClass}" data-row="${r}" data-col="${c}" ${cellStyle}>`;
            if (letter) {
                crosswordHtml += `<input type="text" maxlength="1" data-row="${r}" data-col="${c}" class="crossword-input" />`;
            }
            crosswordHtml += `</div>`;
        }
    }
    crosswordHtml += `</div>`;
    return crosswordHtml;
}


/**
 * Maneja la lógica de la sección de lectura.
 * @param {HTMLElement} unitSection - La sección de la unidad en el DOM.
 * @param {function} playSound - La función para reproducir sonidos.
 * @param {object} userScores - El objeto de puntajes del usuario.
 */
export const setupReadingExercise = (unitSection, playSound, userScores) => {
    const content = `
        <h2 class="titulo-user">Práctica de Lectura y Crucigrama</h2>
        <p class="descripcion">Lee el texto y encuentra las palabras clave. Luego, úbicalas en el crucigrama.</p>

        <div class="opciones-reading">
            <select id="readingTopicSelect" class="select-field">
                <option value="">-- Selecciona una historia --</option>
                <option value="story1">The Little Red Hen</option>
                <option value="story2">The Tortoise and the Hare</option>
                <option value="story3">A Day at the Park</option>
                <option value="story4">My Family</option>
                <option value="story5">At School</option>
            </select>
            <button id="loadReadingBtn" class="boton-primario">Cargar Crucigrama</button>
        </div>

        <div id="reading-area" class="reading-area hidden">
            <h3 id="storyTitle" class="story-title"></h3>
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
        </div>
    `;

    unitSection.innerHTML = content;

    const topicSelect = document.getElementById('readingTopicSelect');
    const loadReadingBtn = document.getElementById('loadReadingBtn');
    const readingArea = document.getElementById('reading-area');
    const storyTitleEl = document.getElementById('storyTitle');
    const readingTextEl = document.getElementById('readingText');
    const crosswordGridEl = document.getElementById('crosswordGrid');
    const checkCrosswordBtn = document.getElementById('checkCrosswordBtn');
    const repeatCrosswordBtn = document.getElementById('repeatCrosswordBtn');
    const scoreDisplayEl = document.getElementById('reading-score-display');
    
    let currentLayout = null;
    let originalColors = {};

    // Manejador del botón de cargar historia
    loadReadingBtn.addEventListener('click', async () => {
        const selectedTopic = topicSelect.value;
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

                // Genera el crucigrama y el texto con palabras resaltadas
                readingTextEl.innerHTML = highlightKeywords(data.text, currentLayout);
                crosswordGridEl.innerHTML = generateCrosswordHtml(readingData[selectedTopic].placedWords);

                originalColors = {};
                document.querySelectorAll('.crossword-cell.filled').forEach(cell => {
                    originalColors[cell.dataset.row + '-' + cell.dataset.col] = cell.style.backgroundColor;
                });
                
                // Muestra los botones
                checkCrosswordBtn.classList.remove('hidden');
                repeatCrosswordBtn.classList.add('hidden');
                
                // Obtiene el puntaje y lo muestra si existe
                const user = auth.currentUser;
                if (user) {
                    const scoreData = await getReadingScore(user.uid);
                    if (scoreData) {
                        scoreDisplayEl.innerHTML = `Tu último puntaje: ${scoreData.score.toFixed(1)}/10`;
                    } else {
                        scoreDisplayEl.innerHTML = '';
                    }
                }

                document.querySelectorAll('.crossword-input').forEach(input => {
                    input.disabled = false;
                    
                    // Manejador del evento de entrada (input)
                    input.addEventListener('input', (e) => {
                        const cell = e.target.parentElement;
                        const row = parseInt(cell.dataset.row);
                        const col = parseInt(cell.dataset.col);
                        const userLetter = e.target.value.toUpperCase();
                        
                        let correctLetter = '';
                        const placedWord = readingData[selectedTopic].placedWords.find(w => {
                            const word = w.word.toUpperCase();
                            if (w.orientation === 'horizontal') {
                                return row === w.startRow && col >= w.startCol && col < w.startCol + word.length;
                            } else {
                                return col === w.startCol && row >= w.startRow && row < w.startRow + word.length;
                            }
                        });

                        if (placedWord) {
                            const index = placedWord.orientation === 'horizontal' ? col - placedWord.startCol : row - placedWord.startRow;
                            correctLetter = placedWord.word.toUpperCase().charAt(index);
                        }
                        
                        if (userLetter === correctLetter) {
                            cell.style.backgroundColor = 'var(--correct-color)';
                            cell.classList.remove('incorrect');
                            cell.classList.add('correct');
                        } else {
                            cell.style.backgroundColor = 'var(--incorrect-color)';
                            cell.classList.remove('correct');
                            cell.classList.add('incorrect');
                        }

                        // Navegación automática según la orientación de la palabra
                        if (e.target.value.length === e.target.maxLength) {
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
    checkCrosswordBtn.addEventListener('click', () => {
        let correctWords = 0;
        const totalWords = currentLayout.length;
        
        currentLayout.forEach(wordData => {
            let isWordCorrect = true;
            const word = wordData.word.toUpperCase();
            
            for (let i = 0; i < word.length; i++) {
                const r = wordData.orientation === 'horizontal' ? wordData.startRow : wordData.startRow + i;
                const c = wordData.orientation === 'horizontal' ? wordData.startCol + i : wordData.startCol;
                
                const input = document.querySelector(`.crossword-input[data-row="${r}"][data-col="${c}"]`);
                if (!input || input.value.toUpperCase() !== word.charAt(i)) {
                    isWordCorrect = false;
                    break;
                }
            }

            if (isWordCorrect) {
                correctWords++;
            }
        });

        const score = (correctWords / totalWords) * 10;
        
        scoreDisplayEl.innerHTML = `Tu puntaje: ${score.toFixed(1)}/10`;

        const user = auth.currentUser;
        if (user) {
            saveReadingScore(user.uid, score);
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
        scoreDisplayEl.innerHTML = '';
        checkCrosswordBtn.classList.remove('hidden');
        repeatCrosswordBtn.classList.add('hidden');
    });

    // Carga inicial del puntaje de lectura
    const user = auth.currentUser;
    if (user) {
        getReadingScore(user.uid).then(scoreData => {
            if (scoreData) {
                scoreDisplayEl.innerHTML = `Tu último puntaje: ${scoreData.score.toFixed(1)}/10`;
            }
        });
    }
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
