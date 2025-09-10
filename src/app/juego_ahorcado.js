/* export function setupHangmanGame() {
  const unitWords = {
                UT1: ['hello', 'bye', 'morning', 'night', 'teacher', 'student'],
                UT2: ['mother', 'father', 'sister', 'brother', 'family', 'home', 'city', 'town'],
                UT3: ['always', 'never', 'sometimes', 'schedule', 'morning', 'evening'],
                UT4: ['apple', 'banana', 'orange', 'grape', 'sandwich', 'water', 'juice', 'coffee'],
                UT5: ['phone', 'laptop', 'bag', 'wallet', 'keys', 'notebook', 'shoe'],
                UT6: ['town', 'bank', 'store', 'park', 'movies', 'sports', 'reading', 'cooking']
            };

            const wordDisplay = document.getElementById('hangman-word');
            const messageDisplay = document.getElementById('hangman-message');
            const lettersContainer = document.getElementById('hangman-letters');
            const subtitulo = document.getElementById('subtitulo');
            const restartButton = document.getElementById('hangman-restart-button');
            const unitSelector = document.getElementById('unit-selector');
            const hangmanParts = document.querySelectorAll('.parte-ahorcado');

            let secretWord = '';
            let guessedLetters = [];
            let mistakesLeft = 6;
            let currentScore = 0;

            function updateWordDisplay() {
                let display = '';
                for (const letter of secretWord) {
                    if (guessedLetters.includes(letter)) {
                        display += letter + ' ';
                    } else {
                        display += '_ ';
                    }
                }
                wordDisplay.textContent = display.trim();
            }

            function updateHangman() {
                const partsToDisplay = 8 - mistakesLeft;
                hangmanParts.forEach((part, index) => {
                    part.style.display = index < partsToDisplay ? 'block' : 'none';
                });
            }

            function checkWin() {
                if (!wordDisplay.textContent.includes('_')) {
                    currentScore = 10;
                    messageDisplay.textContent = `¡Ganaste! 🎉 Calificación: ${currentScore}`;
                    messageDisplay.className = 'juego-ahorcado__mensaje juego-ahorcado__mensaje--ganador';
                    disableLetters();
                }
            }

            function checkLose() {
                if (mistakesLeft <= 0) {
                    currentScore = 0;
                    messageDisplay.textContent = `¡Perdiste! 😭 La palabra era: ${secretWord}. Calificación: ${currentScore}`;
                    messageDisplay.className = 'juego-ahorcado__mensaje juego-ahorcado__mensaje--perdedor';
                    updateHangman();
                    disableLetters();
                }
            }

            function disableLetter(letterButton, correct) {
                letterButton.disabled = true;
                letterButton.classList.add(correct ? 'juego-ahorcado__letra--correcta' : 'juego-ahorcado__letra--incorrecta');
            }

            function disableLetters() {
                document.querySelectorAll('.juego-ahorcado__letras button').forEach(button => {
                    button.disabled = true;
                });
            }
            
            function enableLetters() {
                document.querySelectorAll('.juego-ahorcado__letras button').forEach(button => {
                    button.disabled = false;
                    button.className = 'juego-ahorcado__letra';
                });
            }

            function handleGuess(event) {
                if (unitSelector.value === 'none') return;
                
                const letter = event.target.textContent;
                if (guessedLetters.includes(letter)) {
                    return;
                }
                guessedLetters.push(letter);
                const correctGuess = secretWord.includes(letter);
                disableLetter(event.target, correctGuess);

                if (correctGuess) {
                    updateWordDisplay();
                    checkWin();
                } else {
                    mistakesLeft--;
                    updateHangman();
                    checkLose();
                }
            }

            function generateLetters() {
                lettersContainer.innerHTML = '';
                const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
                for (const letter of alphabet) {
                    const button = document.createElement('button');
                    button.textContent = letter;
                    button.className = 'juego-ahorcado__letra';
                    button.addEventListener('click', handleGuess);
                    lettersContainer.appendChild(button);
                }
            }

            function resetGame() {
                // Siempre restablecer los colores y el estado de los botones
                enableLetters();
                
                const selectedUnit = unitSelector.value;
                if (selectedUnit === 'none') {
                    subtitulo.textContent = 'Selecciona una opción para empezar.';
                    wordDisplay.textContent = '';
                    messageDisplay.textContent = '';
                    disableLetters();
                    hangmanParts.forEach(part => part.style.display = 'none');
                    return;
                }
                
                subtitulo.textContent = '¡Adivina la palabra!';
                const wordsForUnit = unitWords[selectedUnit] || [];
                secretWord = wordsForUnit[(Math.random() * wordsForUnit.length) | 0].toUpperCase();
                guessedLetters = [];
                mistakesLeft = 6;
                currentScore = 0;
                messageDisplay.textContent = '';
                messageDisplay.className = 'juego-ahorcado__mensaje';
                updateWordDisplay();
                updateHangman();
                enableLetters();
            }

            if (restartButton) {
                restartButton.addEventListener('click', () => {
                    unitSelector.value = 'none';
                    resetGame();
                });
            }

            if (unitSelector) {
                unitSelector.addEventListener('change', resetGame);
            }

            // Inicializar el juego en estado de espera
            generateLetters();
            resetGame();
     

}
 */