import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";
import { auth, db } from "./conexion_firebase.js";
import { showMessage } from "./notificaciones.js";
import { handleWritingCorrection, loadWritingProgress } from "./writing.js";
import { setupListeningExercise } from "./listening.js";
import { setupReadingExercise } from "./reading.js";
import { setupSpeakingExercise } from "./speaking.js";

// --- Datos de Unidades y Quizzes ---
export const units = [
    { id: 'UT1', title: 'INTRODUCTION AND BASIC GREETINGS', quiz: 'true_false' },
    { id: 'UT2', title: 'PEOPLE AND PLACES', quiz: 'true_false' },
    { id: 'UT3', title: 'DAILY LIFE', quiz: 'true_false' },
    { id: 'UT4', title: 'FOODS AND DRINKS', quiz: 'true_false' },
    { id: 'UT5', title: 'THINGS I HAVE', quiz: 'true_false' },
    { id: 'UT6', title: 'AROUND TOWN | FREE TIME', quiz: 'true_false' },
    { id: 'WRITING', title: 'WRITING PRACTICE', quiz: 'none' },
    { id: 'LISTENING', title: 'LISTENING PRACTICE', quiz: 'listening' },
    { id: 'READING', title: 'READING PRACTICE', quiz: 'reading' },
    { id: 'SPEAKING', title: 'SPEAKING PRACTICE', quiz: 'speaking' },
    { id: 'EXAM1', title: 'FIRST TERM EXAMEN', quiz: 'true_false' },
    { id: 'EXAM2', title: 'SECOND TERM EXAMEN', quiz: 'true_false' },
];

const quizData = {
    'UT1': [
        { question: "The phrase 'How are you?' is used to ask about someone's name.", answer: "false" },
        { question: "It is normal to say 'Nice to meet you' when you meet someone for the first time.", answer: "true" },
        { question: "The greeting 'Bye' is usually said when people meet.", answer: "false" },
        { question: "You use 'He is' when you talk about one boy or man.", answer: "true" }, // <- Ajustada para máxima claridad A1
        { question: "'They are' is the correct verb form for one person.", answer: "false" },
        { question: "Hello is a way to start a conversation.", answer: "true" },
        { question: "You say 'Good afternoon' in the morning.", answer: "false" },
        { question: "Asking 'What's your name?' is a common way to introduce yourself.", answer: "true" }
    ],
    'UT2': [
        { question: "The word 'Mother' is a girl.", answer: "true" },
        { question: "Brother and Sister are family.", answer: "true" },
        { question: "The word 'My' means something belongs to you.", answer: "true" },
        { question: "You say 'Her book' if the book belongs to a boy.", answer: "false" },
        { question: "A 'School' is a place where you sleep.", answer: "false" },
        { question: "The word 'Live' is about where you are.", answer: "true" },
        { question: "If you have a 'Family', you are alone.", answer: "false" },
        { question: "'Home' is a type of house.", answer: "true" }
    ],
    'UT3': [
        { question: "The phrase 'Go to bed' means you wake up.", answer: "false" },
        { question: "The word 'Always' means you do something 0% of the time.", answer: "false" },
        { question: "You use 'There are' to talk about one thing (singular).", answer: "false" },
        { question: "The word 'Next to' is used to talk about a location.", answer: "true" },
        { question: "'Eat breakfast' is the last meal of the day.", answer: "false" },
        { question: "You use 'O'clock' to talk about the time.", answer: "true" },
        { question: "The word 'Sometimes' means 'a few times'.", answer: "true" },
        { question: "When you 'Wake up', you leave your bed.", answer: "true" }
    ],
    'UT4': [
        { question: "The word 'Water' is a type of drink.", answer: "true" },
        { question: "You ask for the 'Menu' when you want to see what food they have.", answer: "true" },
        { question: "A 'Sandwich' is usually two pieces of bread with food inside.", answer: "true" },
        { question: "If food is 'Delicious', it means it tastes bad.", answer: "false" },
        { question: "A 'Salad' is usually made with meat and bread.", answer: "false" }, // <-- NUEVA PREGUNTA DE REEMPLAZO (SALAD)
        { question: "The word 'Bread' is a food made with vegetables.", answer: "false" },
        { question: "To ask for the check means you want to pay.", answer: "true" },
        { question: "An 'Appetizer' is a large main meal.", answer: "false" }
    ],
    'UT5': [
        { question: "The 'Keys' are used to open a door.", answer: "true" },
        { question: "If you want to know the price of something, you ask 'How much is it?'.", answer: "true" },
        { question: "An 'old phone' is newer than a 'new phone'.", answer: "false" },
        { question: "The word 'Bag' is a container to carry things.", answer: "true" },
        { question: "The 'Shoes' are more expensive than a pencil.", answer: "true" }, // <-- NUEVA PREGUNTA DE LÓGICA (Reemplazo)
        { question: "A 'Phone' is usually used for cooking.", answer: "false" },
        { question: "'Shoes' are something you wear on your hands.", answer: "false" },
        { question: "A 'light box' is heavier than a 'heavy box'.", answer: "false" }
    ],
    'UT6': [
        { question: "The word 'Hobby' is something you do in your free time for fun.", answer: "true" },
        { question: "You use 'Turn right' to go left.", answer: "false" },
        { question: "A 'Library' is a place where you can watch movies.", answer: "false" },
        { question: "You can find many books at the 'Library'.", answer: "true" }, // <-- REEMPLAZO 1 (Vocabulario)
        { question: "The phrase 'Free time' means you are busy working.", answer: "false" },
        { question: "The word 'Cinema' is a place where you borrow books.", answer: "false" },
        { question: "When you go 'Straight', you do not turn.", answer: "true" },
        { question: "A 'Park' is a good place to do some exercise.", answer: "true" } // <-- REEMPLAZO 2 (Lógica de Lugares)
    ],
    // =========================================================
    // EXAMEN 1: UNIDADES 1, 2 Y 3 (Saludos, Familia, Rutinas)
    // =========================================================
    'EXAM1': [
        { question: "You use 'O'clock' to talk about the time.", answer: "true" },
        { question: "The greeting 'Bye' is usually said when people meet.", answer: "false" },
        { question: "If you have a 'Family', you are alone.", answer: "false" },
        { question: "The phrase 'Go to bed' means you wake up.", answer: "false" },
        { question: "'Home' is a type of house.", answer: "true" },
        { question: "It is normal to say 'Nice to meet you' when you meet someone for the first time.", answer: "true" },
        { question: "Asking 'What's your name?' is a common way to introduce yourself.", answer: "true" },
        { question: "You say 'Her book' if the book belongs to a boy.", answer: "false" },
        { question: "The word 'Mother' is a girl.", answer: "true" },
        { question: "The word 'Sometimes' means 'a few times'.", answer: "true" }
    ],

    // =========================================================
    // EXAMEN 2: UNIDADES 4, 5 Y 6 (Comida, Objetos, Lugares)
    // =========================================================
    'EXAM2': [
        { question: "A 'Salad' is usually made with meat and bread.", answer: "false" },
        { question: "The 'Keys' are used to open a door.", answer: "true" },
        { question: "If you want to know the price of something, you ask 'How much is it?'.", answer: "true" },
        { question: "The word 'Hobby' is something you do in your free time for fun.", answer: "true" },
        { question: "A 'Phone' is usually used for cooking.", answer: "false" },
        { question: "If food is 'Delicious', it means it tastes bad.", answer: "false" },
        { question: "A 'light box' is heavier than a 'heavy box'.", answer: "false" },
        { question: "To ask for the check means you want to pay.", answer: "true" },
        { question: "A 'Library' is a place where you can watch movies.", answer: "false" },
        { question: "The word 'Water' is a type of drink.", answer: "true" }
    ]
};

export const moduleInfo = [
    { id: 'UT1', title: 'UNIT 1', desc: 'INTRODUCTION AND BASIC GREETINGS', icon: '👋', img: 'https://img.freepik.com/foto-gratis/retrato-amigable-joven-feliz-que-despide-mano-decir-hola-saludandote-gesto-saludo-diciendo-adios-pie-sobre-pared-blanca_176420-39098.jpg?t=st=1756572182~exp=1756575782~hmac=2f8801a7a0dc2db3277d3cb2911074a2d58cb6dbf6b3517f1290eea4efae0b8f&w=740' },
    { id: 'UT2', title: 'UNIT 2', desc: 'PEOPLE AND PLACES', icon: '🏠', img: 'https://cdn.pixabay.com/photo/2018/09/06/18/30/sofia-3658934_1280.jpg' },
    { id: 'UT3', title: 'UNIT 3', desc: 'DAILY LIFE', icon: '⏰', img: 'https://images.pexels.com/photos/3771069/pexels-photo-3771069.jpeg' },
    { id: 'UT4', title: 'UNIT 4', desc: 'FOODS AND DRINKS', icon: '🍎', img: 'https://images.pexels.com/photos/1132047/pexels-photo-1132047.jpeg' },
    { id: 'UT5', title: 'UNIT 5', desc: 'THINGS I HAVE', icon: '📱', img: 'https://images.pexels.com/photos/607812/pexels-photo-607812.jpegg' },
    { id: 'UT6', title: 'UNIT 6', desc: 'AROUND TWON | FREE TIME', icon: '🏞️', img: 'https://img.freepik.com/psd-premium/renderizacion-3d-patio-recreo_23-2150659735.jpg' },
];



// --- Variables Globales (o de ámbito superior) ---
export let userScores = {}; // Para almacenar los puntajes del usuario


// --- NUEVA FUNCIÓN GLOBAL PARA REPRODUCIR AUDIOS DE LAS TARJETAS ---
// Esta función se llama desde el atributo 'onclick' en el HTML de las tarjetas.
window.playAudio = (audioUrl) => {
    // Asegúrate de que el audio actual se detenga antes de iniciar uno nuevo
    if (window.currentAudio) {
        window.currentAudio.pause();
        window.currentAudio.currentTime = 0;
    }

    // Asume que los archivos de audio están en una carpeta 'assets/audios/'
    const fullPath = `assets/audios-vocabulario/${audioUrl}`;
    window.currentAudio = new Audio(fullPath);
    window.currentAudio.play().catch(error => {
        console.error("Error al reproducir el audio:", error);
        showMessage("No se pudo reproducir el audio. Verifica la URL.", "error");
    });
};
// ----------------------------------------------------------------------

/**
     * Reproduce un sonido según el tipo especificado.
     * @param {'correct'|'wrong'|'win'|'fail'} type - Tipo de sonido a reproducir.
     */
export const playSound = (type) => {
    let audio;
    switch (type) {
        case "correct":
            audio = new Audio("assets/correct-ding.mp3");
            break;
        case "wrong":
            audio = new Audio("assets/chicharra-error-incorrecto-.mp3");
            break;
        case "win":
            audio = new Audio("assets/win.mp3");
            break;
        case "fail":
            audio = new Audio("assets/fail.mp3");
            break;
    }
    if (audio) audio.play();
};


export const setupUserPanelLogic = (panelElement, userRole) => {
    // --- Referencias a Elementos del DOM (Declaración Única) ---
    // Elementos comunes para WRITING y el panel general
    const sentenceInput = document.getElementById('sentenceInput');
    const correctButton = document.getElementById('correctButton');
    const feedbackContainer = document.getElementById('feedbackContainer');
    const feedbackContent = document.getElementById('feedbackContent');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const alertPlaceholder = document.getElementById('alertPlaceholder');

    // Elementos específicos del panel de usuario
    const userEmailSpan = panelElement?.querySelector("#user-email");
    const userRoleSpan = panelElement?.querySelector("#user-role");
    const userPhoto = panelElement?.querySelector("#user-photo");
    const logoutBtn = document.getElementById("logout-btn");
    const unitList = document.getElementById('unit-list');
    const unitSections = document.querySelectorAll('.seccion-unidad');
    const MobileUnitList = document.getElementById('mobile-unit-list');
    const gradesSection = document.getElementById('grades-section');
    const modulesSection = document.getElementById('modules-section');
    const modulesGrid = document.getElementById('modules-grid');

    // Elementos del menú móvil
    const hamburgerBtn = document.getElementById('mobile-hamburger-btn');
    const hamburgerMenu = document.getElementById('mobile-hamburger-menu');

    // --- Funciones de Utilidad ---

    /**
     * Muestra mensajes de alerta en el placeholder.
     * @param {string} message - El mensaje a mostrar.
     */
    const showAlert = (message) => {
        if (alertPlaceholder) {
            alertPlaceholder.innerHTML = `<div class="alert-message">${message}</div>`;
        }
    };

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
     * Actualiza la interfaz de usuario del perfil del usuario.
     * @param {object} user - Objeto de usuario de Firebase.
     */
    const updateProfileUI = (user) => {
        if (user) {
            const displayName = user.displayName || user.email || "Inglés A1";
            const photoURL = user.photoURL;
            const initials = user.email ? user.email.charAt(0).toUpperCase() : 'U';
            const sidebarPlaceholderPhoto = `https://placehold.co/48x48/E2E8F0/A0AEC0?text=${initials}`;

            const sidebarName = document.getElementById("sidebar-student-name");
            const sidebarRole = document.getElementById("sidebar-student-role");
            const sidebarPhoto = document.getElementById("sidebar-photo");

            if (sidebarName) sidebarName.textContent = displayName;
            if (sidebarRole) sidebarRole.textContent = userRole ? `STUDENT 🧑‍🎓📚` : "";
            if (sidebarPhoto) sidebarPhoto.src = photoURL || sidebarPlaceholderPhoto;
        } else {
            // Estado no autenticado
            const sidebarName = document.getElementById("sidebar-student-name");
            const sidebarRole = document.getElementById("sidebar-student-role");
            if (sidebarName) sidebarName.textContent = "Inglés A1";
            if (sidebarRole) sidebarRole.textContent = "";
            const sidebarPhoto = document.getElementById("sidebar-photo");
            if (sidebarPhoto) sidebarPhoto.src = "https://placehold.co/48x48/E2E8F0/A0AEC0?text=U";
        }
    };

    /**
     * Muestra una sección específica y oculta las demás.
     * @param {HTMLElement} sectionToShow - La sección que se va a mostrar.
     */
    const showSection = (sectionToShow) => {
        // Oculta todas las secciones
        unitSections.forEach(section => section.classList.add('seccion-unidad--oculta'));

        // Muestra la sección correcta
        if (sectionToShow) {
            sectionToShow.classList.remove('seccion-unidad--oculta');
        }

        // Actualiza la clase activa en el menú
        document.querySelectorAll('.unidad-link').forEach(link => link.classList.remove('unidad-link--activo'));
        const activeLink = document.querySelector(`[data-section-id="${sectionToShow.id}"]`);
        if (activeLink) activeLink.classList.add('unidad-link--activo');
    };

    /**
     * Renderiza el grid de tarjetas de módulos.
     */
    const renderModulesGrid = () => {
        if (!modulesGrid) return;
        modulesGrid.innerHTML = '';
        const learningUnits = units.filter(unit => unit.id.startsWith('UT'));

        learningUnits.forEach(unit => {
            const info = moduleInfo.find(m => m.id === unit.id) || {};
            const card = document.createElement('div');
            card.className = 'modulo-card';

            // ✨ NO INCLUYE EL BOTÓN 'boton-accion'
            card.innerHTML = `
            <div class="modulo-card__title">${info.title || unit.title}</div>
            <div class="modulo-card__icon">${info.icon}</div>
            <div class="modulo-card__desc">${info.desc || ''}</div>
        `;

            modulesGrid.appendChild(card);

            // 🚀 El click listener en la tarjeta hace la acción principal
            card.addEventListener('click', () => {
                renderUnitContent(unit.id);
            });
        });
        showSection(modulesSection);
    };

    /**
     * Actualiza el estado de completado de las unidades en la interfaz.
     * @param {HTMLElement} container - El contenedor de la lista de unidades (ej. unitList o MobileUnitList).
     */
    function updateUnitCompletionStatus(container) {
        if (!container) {
            console.error("Container for unit completion status is null.");
            return;
        }
        const links = container.querySelectorAll('.unidad-link');
        links.forEach(link => {
            const unitId = link.dataset.unitId;
            let isCompleted = false;
            const scoreData = userScores.scores?.[unitId];
            if (scoreData && scoreData.completada) {
                isCompleted = true;
            }

            if (isCompleted) {
                link.classList.add('unidad-link--completada');
            } else {
                link.classList.remove('unidad-link--completada');
            }
        });
    }

    /**
     * Guarda el puntaje de un test en Firestore, solo si es mayor al previo.
     * @param {string} userId - ID del usuario.
     * @param {string} unitId - ID de la unidad/examen.
     * @param {number} score - Puntaje obtenido.
     */
    const saveTestScore = async (userId, unitId, score) => {
        try {
            const docRef = doc(db, `usuarios/${userId}`);
            const docSnap = await getDoc(docRef);
            const currentData = docSnap.exists() ? docSnap.data() : {};
            const currentScores = currentData.scores || {};
            const prevScore = currentScores[unitId]?.score || 0;

            if (score > prevScore) {
                const newScores = {
                    ...currentScores,
                    [unitId]: {
                        score: score,
                        completada: score >= 10 // Asume que 10 es la nota de aprobación
                    }
                };
                await setDoc(docRef, { ...currentData, scores: newScores }, { merge: true });
                showMessage("¡Puntaje guardado con éxito!", "success");
            }
        } catch (error) {
            console.error("Error al guardar el puntaje:", error);
            showMessage("Error al guardar el puntaje.", "error");
        }
    };

    /**
     * Carga el progreso de la unidad WRITING desde Firestore.
     * @param {string} userId - ID del usuario.
     * @returns {Promise<{correctCount: number, score: number}>} - El progreso de escritura.
     */
    async function loadWritingProgress(userId) {
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
     * Configura el quiz interactivo de Verdadero/Falso para una unidad.
     * @param {string} unitId - ID de la unidad.
     */
    const setupTrueFalseQuiz = (unitId) => {
        let currentQuestionIndex = 0;
        let correctAnswers = 0;
        const questions = quizData[unitId];
        const totalQuestions = questions.length;

        const questionEl = document.getElementById(`question-${unitId}`);
        
        const feedbackEl = document.getElementById(`feedback-${unitId}`);
        const quizBtns = document.querySelectorAll(`#quiz-container-${unitId} .boton-quiz`);
        const progressBar = document.getElementById(`quiz-progress-${unitId}`);
        const repeatBtn = document.getElementById(`repeat-quiz-${unitId}`);

        const isExam = unitId === 'EXAM1' || unitId === 'EXAM2';

        /**
         * Muestra una notificación animada en la pantalla.
         * @param {string} message - Mensaje a mostrar.
         * @param {boolean} success - Si la notificación es de éxito o fallo.
         */
        const showAnimatedNotification = (message, success = true) => {
            let notif = document.getElementById('quiz-notification');
            if (!notif) {
                notif = document.createElement('div');
                notif.id = 'quiz-notification';
                notif.className = 'quiz-notification';
                document.body.appendChild(notif);
            }
            notif.innerHTML = message;
            notif.classList.remove('quiz-notification--hide', 'quiz-notification--success', 'quiz-notification--fail');
            notif.classList.add(success ? 'quiz-notification--success' : 'quiz-notification--fail');
            setTimeout(() => {
                notif.classList.add('quiz-notification--hide');
            }, 3500);
        };

        function showQuestion() {
            if (progressBar) progressBar.style.width = `${(currentQuestionIndex / totalQuestions) * 100}%`;

            if (currentQuestionIndex < totalQuestions) {
                questionEl.textContent = questions[currentQuestionIndex].question;
                feedbackEl.textContent = '';
                feedbackEl.classList.remove('contenedor-quiz__retroalimentacion--sucesso', 'contenedor-quiz__retroalimentacion--error');
                quizBtns.forEach(btn => btn.disabled = false);
            } else {
                const score = (correctAnswers / totalQuestions) * 10;


                questionEl.classList.toggle('contenedor-quiz__retroalimentacion--sucesso', score >= 10);
                questionEl.classList.toggle('contenedor-quiz__retroalimentacion--error', score < 10);
                questionEl.textContent = `YOUR SCORE IS: ${score.toFixed(1)}/10`;




                feedbackEl.textContent = isExam ? 'EXAMEN REALIZADO.' : (score >= 10 ? 'Congratulations!' : 'You can improve your score.');


                feedbackEl.classList.toggle('contenedor-quiz__retroalimentacion--sucesso', score >= 10);


                feedbackEl.classList.toggle('contenedor-quiz__retroalimentacion--error', score < 10);


                quizBtns.forEach(btn => btn.disabled = true);

                if (repeatBtn) repeatBtn.style.display = isExam ? "none" : "inline-block";

                if (score >= 10) {
                    playSound("win");
                    showAnimatedNotification('YOU DID IT!! 🎉🥳<br><span style="font-size:2rem;">✅</span>', true);
                } else {
                    playSound("fail");
                    showAnimatedNotification('KEEP TRYING! 😢<br><span style="font-size:2rem;">🚫</span>', false);
                }

                const user = auth.currentUser;
                if (user) saveTestScore(user.uid, unitId, score);
            }
        }

        quizBtns.forEach(btn => {
            btn.onclick = () => {
                if (btn.disabled) return;
                const userAnswer = btn.dataset.answer;
                const correctAnswer = questions[currentQuestionIndex].answer;

                if (userAnswer === correctAnswer) {
                    correctAnswers++;
                    feedbackEl.textContent = "Correct!";
                    feedbackEl.classList.add('contenedor-quiz__retroalimentacion--sucesso');
                    feedbackEl.classList.remove('contenedor-quiz__retroalimentacion--error');
                    playSound("correct");
                } else {
                    feedbackEl.textContent = `Incorrect. The correct answer was: ${correctAnswer === "true" ? "TRUE" : "FALSE"}`;
                    feedbackEl.classList.add('contenedor-quiz__retroalimentacion--error');
                    feedbackEl.classList.remove('contenedor-quiz__retroalimentacion--sucesso');
                    playSound("wrong");
                }
                quizBtns.forEach(b => b.disabled = true);
                setTimeout(() => {
                    currentQuestionIndex++;
                    showQuestion();
                }, 900);
            };
        });

        if (repeatBtn) {
            repeatBtn.onclick = () => {
                questionEl.classList.remove('contenedor-quiz__retroalimentacion--sucesso');
                questionEl.classList.remove('contenedor-quiz__retroalimentacion--error');
                currentQuestionIndex = 0;
                correctAnswers = 0;
                quizBtns.forEach(btn => btn.disabled = false);
                repeatBtn.style.display = "none";
                showQuestion();
            };
        }

        // Cargar estado previo del quiz si existe
        const scoreData = userScores.scores?.[unitId];
        if (scoreData) {

            if(scoreData.score.toFixed(1) >=10){
                questionEl.classList.add('contenedor-quiz__retroalimentacion--sucesso');
            } else {
                questionEl.classList.add('contenedor-quiz__retroalimentacion--error');
            }

            questionEl.textContent = `YOUR CURRENT SCORE IS: ${scoreData.score.toFixed(1)}/10`;

            feedbackEl.textContent = isExam ? 'EXAMEN REALIZADO.' : (scoreData.completada ? 'CONGRATULATIONS!' : 'YOU CAN IMPROVE YOUR SCORE.');
           
            feedbackEl.classList.toggle('contenedor-quiz__retroalimentacion--sucesso', scoreData.completada);
           
            feedbackEl.classList.toggle('contenedor-quiz__retroalimentacion--error', !scoreData.completada);
           
            quizBtns.forEach(btn => btn.disabled = true);
           
           
           
            if (repeatBtn) repeatBtn.style.display = isExam ? "none" : "inline-block";
        } else {
            showQuestion();
        }
    };

    /**
     * Renderiza el contenido de una unidad específica.
     * @param {string} unitId - ID de la unidad a renderizar.
     */
    const renderUnitContent = async (unitId) => {
        showSection(document.getElementById(`unit-${unitId}`));

        const unitSection = document.getElementById(`unit-${unitId}`);


        // Lógica específica para la unidad WRITING
        if (unitId === 'WRITING') {

            let writingProgressDiv = document.getElementById("writingProgressDiv");
            if (!writingProgressDiv && feedbackContainer) {
                writingProgressDiv = document.createElement("div");
                writingProgressDiv.id = "writingProgressDiv";
                writingProgressDiv.style.margin = "1.2rem 0";
                writingProgressDiv.classList.add("score-display");
                feedbackContainer.parentNode.insertBefore(writingProgressDiv, feedbackContainer);
            }

            const user = auth.currentUser;
            // La función loadWritingProgress ya no devuelve 'correctCount'
            const { score } = user ? await loadWritingProgress(user.uid) : { score: 0 };

            if (writingProgressDiv) {
                writingProgressDiv.innerHTML = `
            <b style="color:#2563eb;">Your highest score is:</b> ${score}/10
            ${score >= 10 ? '<br><span style="color:green;font-weight:bold;">Congratulations, you have completed the writing section!</span>' : ''}
        `;
            }
        } else if (unitId === 'LISTENING') {
            setupListeningExercise(unitSection, playSound, userScores); // Llama a la nueva función y le pasa los puntajes
        } else if (unitId === 'READING') {
            setupReadingExercise(unitSection, playSound, userScores);
        } else if (unitId === 'SPEAKING') { // <-- AGREGAR ESTA LÓGICA

            const user = auth.currentUser;
            if (user) {
                const docRef = doc(db, `usuarios/${user.uid}`);
                const docSnap = await getDoc(docRef);
                userScores = {
                    scores: docSnap.exists() ? docSnap.data().scores : {},
                };
            }

            setupSpeakingExercise(unitSection, playSound, userScores);
        }


        else {
            // Elimina quiz anterior si existe y crea uno nuevo para unidades no-WRITING
            const oldQuiz = unitSection.querySelector('.tarjeta-actividad');
            if (oldQuiz) oldQuiz.remove();

            const quizDiv = document.createElement('div');
            quizDiv.className = 'tarjeta-actividad';
            const isExam = unitId === 'EXAM1' || unitId === 'EXAM2';
            const infoText = isExam ? 'THE EXAM CAN ONLY BE TAKEN ONCE...‼️‼️' : 'You can repeat the quiz to improve your score.';

            let unitTitle = '';
            const unitInfoObj = units.find(m => m.id === unitId);
            if (unitInfoObj) {
                unitTitle = unitInfoObj.title;
            }
            quizDiv.innerHTML = `
                <h3 class="tarjeta-actividad__subtitulo">📗 ${unitId} - ${unitTitle}</h3>
                <div class="quiz-progress-bar"><div id="quiz-progress-${unitId}" class="quiz-progress-bar-fill"></div></div>
                <div id="quiz-container-${unitId}" class="contenedor-quiz">
                    <p class="contenedor-quiz__pregunta" id="question-${unitId}"></p>
                    <div class="contenedor-quiz__botones">
                        <button class="boton-quiz boton-quiz--verdadero" data-answer="true">TRUE</button>
                        <button class="boton-quiz boton-quiz--falso" data-answer="false">FALSE</button>
                    </div>
                    <p id="feedback-${unitId}" class="contenedor-quiz__retroalimentacion"></p>
                    <button id="repeat-quiz-${unitId}" class="boton-quiz--repeat" style="display:none;">REPEAT QUIZ</button>
                    <p style="margin-top:1rem;font-weight:bold;"><b>${infoText}</b></p>
                </div>
            `;
            console.log("Agregando quiz para la unidad:", unitId, unitSection.getElementsByClassName('titulo-unidad').textContent);
            unitSection.appendChild(quizDiv);
            setupTrueFalseQuiz(unitId);
        }
    };

    /**
     * Renderiza la sección de calificaciones del usuario.
     */
    const renderGradesSection = () => {
        showSection(gradesSection);

        // Rellena la tabla de calificaciones
        const tbody = document.getElementById("grades-table-body");
        if (tbody) {
            tbody.innerHTML = "";
            units.forEach(unit => {
                let scoreData = userScores.scores?.[unit.id];
                const score = scoreData ? scoreData.score : "-";
                const estado = scoreData && scoreData.completada ? "Completada" : "Pendiente";
                const estadoClass = scoreData && scoreData.completada ? "estado-aprobado" : "estado-reprobado";
                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td>${unit.title}</td>
                    <td><b>${score !== "-" ? score.toFixed(1) : "-"}</b></td>
                    <td class="${estadoClass}">${score !== "-" ? estado : "-"}</td>
                `;
                tbody.appendChild(tr);
            });
        }
    };

    /**
     * Inicializa el dashboard del usuario, incluyendo la lista de unidades y la escucha de puntajes.
     * @param {string} userId - ID del usuario actual.
     */
    const initializeDashboardUI = (userId) => {
        if (!unitList) return;

        unitList.innerHTML = '';

        // Renderiza el botón "Módulos"
        const modulesLi = document.createElement('li');
        modulesLi.innerHTML = `<a href="#" data-section-id="modules-section" class="unidad-link">ENGLISH A1 - UNITS</a>`;
        unitList.appendChild(modulesLi);
        modulesLi.querySelector('a')?.addEventListener('click', (e) => {
            e.preventDefault();
            renderModulesGrid();
        });

        // Agrega las demás opciones de menú
        const otherUnits = units.filter(unit => unit.id === 'WRITING' || unit.id === 'LISTENING' || unit.id === 'READING' || unit.id === 'SPEAKING' || unit.id.startsWith('EXAM')); // <-- AGREGAR SPEAKING AQUÍ
        otherUnits.forEach(unit => {
            const li = document.createElement('li');
            li.innerHTML = `<a href="#" data-section-id="unit-${unit.id}" class="unidad-link">${unit.title}</a>`;
            /* li.innerHTML = `<a href="#" data-section-id="unit-${unit.id}" class="unidad-link">
                                <span class="unidad-link__id">${unit.id}:</span> ${unit.title}
                            </a>`; */
            unitList.appendChild(li);
            li.querySelector('a')?.addEventListener('click', (e) => {
                e.preventDefault();
                renderUnitContent(unit.id);
            });
        });

        // Agrega opción de calificaciones al final del menú principal
        const gradesLi = document.createElement('li');
        gradesLi.innerHTML = `<a href="#" data-section-id="grades-section" class="unidad-link unidad-link--calificaciones" id="grades-tab">
            <span class="unidad-link__id">GRADES</span>
        </a>`;
        unitList.appendChild(gradesLi);

        const gradesTab = document.getElementById('grades-tab');
        if (gradesTab) {
            gradesTab.addEventListener('click', (e) => {
                e.preventDefault();
                renderGradesSection();
            });
        }

        // Escucha los cambios en los puntajes del usuario en Firestore
        const userRef = doc(db, `usuarios/${userId}`);
        onSnapshot(userRef, (docSnap) => {
            userScores = {
                scores: docSnap.exists() ? docSnap.data().scores : {},
            };
            updateUnitCompletionStatus(unitList);
            updateUnitCompletionStatus(MobileUnitList); // Actualiza también el menú móvil
        });
    };

    // --- Lógica de la Unidad WRITING (Manejador de Eventos) ---
    // Este bloque se ejecuta una vez cuando se carga la lógica del panel,
    // y el listener se adjunta al botón `correctButton`.
    if (correctButton) {
        correctButton.addEventListener('click', async () => {
            const sentence = sentenceInput?.value.trim();
            if (!sentence) {
                showAlert('Por favor, escribe una oración para verificar.');
                return;
            }
            const writingProgressDiv = document.getElementById("writingProgressDiv");

            await handleWritingCorrection(
                sentence,
                feedbackContainer,
                feedbackContent,
                loadingIndicator,
                writingProgressDiv,
                playSound
            );

        });
    }

    // --- Autenticación y Eventos Iniciales ---
    onAuthStateChanged(auth, (user) => {
        updateProfileUI(user);
        if (user) {
            initializeDashboardUI(user.uid);
            // Mostrar los módulos por defecto
            renderModulesGrid();
        }
    });

    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                await signOut(auth);
                showMessage("Sesión cerrada correctamente", "success");
                window.location.reload();
            } catch (error) {
                console.error("Error al cerrar sesión:", error);
                showMessage("Error al cerrar sesión.", "error");
            }
        });
    }

    // --- Menú Móvil Hamburguesa ---
    function renderHamburgerMenu() {
        if (!MobileUnitList) return; // Asegurarse de que MobileUnitList existe

        MobileUnitList.innerHTML = '';
        const menuItems = [
            { id: 'modules', title: 'ENGLISH A1 – UNITS', sectionId: 'modules-section' },
            { id: 'WRITING', title: 'WRITING PRACTICE', sectionId: 'unit-WRITING' },
            { id: 'LISTENING', title: 'LISTENING PRACTICE', sectionId: 'unit-LISTENING' },
            { id: 'READING', title: 'READING PRACTICE', sectionId: 'unit-READING' },
            { id: 'SPEAKING', title: 'SPEAKING PRACTICE', sectionId: 'unit-SPEAKING' },
            { id: 'EXAM1', title: 'FIRST TERM EXAM', sectionId: 'unit-EXAM1' },
            { id: 'EXAM2', title: 'SECOND TERM EXAM', sectionId: 'unit-EXAM2' },
            { id: 'grades', title: 'GRADES', sectionId: 'grades-section' }
        ];

        menuItems.forEach(item => {
            const li = document.createElement('li');

            // NUEVO CAMBIO: Agregamos el enlace
            const link = document.createElement('a');
            link.href = "#";
            link.setAttribute("data-section-id", item.sectionId);
            link.classList.add("unidad-link");
            link.textContent = item.title;

            // NUEVO CAMBIO: Agregamos la clase de estilo si es el botón de calificaciones
            if (item.id === 'grades') {
                link.classList.add('unidad-link--calificaciones'); // Agrega la clase CSS
                link.innerHTML = `<span class="unidad-link__id">${item.title}</span>`;
            }

            li.appendChild(link);
            MobileUnitList.appendChild(li);

            link.addEventListener('click', (e) => {
                e.preventDefault();
                if (hamburgerMenu) hamburgerMenu.style.display = "none";
                if (hamburgerBtn) hamburgerBtn.style.display = "flex";
                if (item.id === 'modules') {
                    renderModulesGrid();
                } else if (item.id === 'grades') {
                    renderGradesSection();
                } else {
                    renderUnitContent(item.id);
                }
            });
        });



        updateUnitCompletionStatus(MobileUnitList);
    }

    if (hamburgerBtn) {
        hamburgerBtn.addEventListener('click', () => {
            renderHamburgerMenu();
            if (hamburgerMenu) hamburgerMenu.style.display = "flex";
            if (hamburgerBtn) hamburgerBtn.style.display = "none";
        });
    }

    if (hamburgerMenu) {
        hamburgerMenu.addEventListener('click', (e) => {
            if (e.target === hamburgerMenu) {
                hamburgerMenu.style.display = "none";
                if (hamburgerBtn) hamburgerBtn.style.display = "flex";
            }
        });
    }

    return {
        renderUnitContent: renderUnitContent,
        renderModulesGrid: renderModulesGrid,
        showSection: showSection
    }

};
