import { auth, db } from "./conexion_firebase.js";
import { signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";
import { collection, doc, getDoc, getDocs, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

// Los módulos con imágenes y contenido
const modules = [
    {
        id: 'UT1',
        title: 'Introduction and Basic Greetings',
        icon: '👋',
        img: 'assets/vocab_hello.png',
        vocabulario: [
            { word: 'Hello', translation: 'Hola', img: 'https://img.freepik.com/foto-gratis/retrato-amigable-joven-feliz-que-despide-mano-decir-hola-saludandote-gesto-saludo-diciendo-adios-pie-sobre-pared-blanca_176420-39098.jpg?t=st=1756572182~exp=1756575782~hmac=2f8801a7a0dc2db3277d3cb2911074a2d58cb6dbf6b3517f1290eea4efae0b8f&w=740' },
            { word: 'Goodbye', translation: 'Adiós', img: 'https://img.freepik.com/vector-gratis/dibujado-mano-gente-diseno-plano-agitando-ilustracion_23-2149195759.jpg?t=st=1756572484~exp=1756576084~hmac=94a5846474760eceaeb5a0df044380855a91c3d2cfc107b86fd60afbe2542b77&w=740' },
            { word: 'Morning', translation: 'Buenos días', img: 'https://img.freepik.com/fotos-premium/buenas-mananas-desayuno-cafe-jugo-vista-increible_1000823-79557.jpg?w=740' },
        ],
        ejemplos: [
            { sentence: 'Hello! How are you?', img: 'https://o.quizlet.com/gwCKeJ1nuXqyzkGS5EBWPg.png' },
            { sentence: 'Good morning, teacher.', img: 'https://st3.depositphotos.com/27811286/32131/v/450/depositphotos_321311754-stock-illustration-happy-cute-kid-give-flower.jpg' },
            { sentence: 'Goodbye, friends!', img: 'https://www.thesingingwalrus.com/wp-content/uploads/2022/02/Goodbye-Friends-thumb-541x305-1.jpeg' }
        ],
        dialogo: {
            text: "A: Hello! Good morning.\nB: Good morning! How are you?\nA: I am fine, thank you.",
            img: "https://img.freepik.com/vector-premium/dos-personas-hablando-reunion-amigos-o-colegas-ilustracion-vectorial_1014921-830.jpg"
        }
    },
    {
        id: 'UT2',
        title: 'People and Places',
        icon: '🏠',
        img: 'assets/vocab_father.png',
        vocabulario: [
            { word: 'Father', translation: 'Padre', img: 'https://cdn.pixabay.com/photo/2017/08/05/21/23/people-2585733_1280.jpg' },
            { word: 'City', translation: 'Ciudad', img: 'https://cdn.pixabay.com/photo/2018/09/06/18/30/sofia-3658934_1280.jpg' },
            { word: 'Home', translation: 'Casa', img: 'https://cdn.pixabay.com/photo/2012/11/19/16/26/house-66627_1280.jpg' }
        ],
        ejemplos: [
            { sentence: 'My father is at home.', img: 'https://cdn.pixabay.com/photo/2017/08/06/12/59/baby-2592302_1280.jpg' },
            { sentence: 'We live in the city.', img: 'https://cdn.pixabay.com/photo/2013/11/27/06/17/hanam-city-219143_1280.jpg' },
            { sentence: 'Welcome home!', img: 'https://cdn.pixabay.com/photo/2016/02/07/23/42/home-1185860_1280.jpg' }
        ],
        dialogo: {
            text: "A: Where is your father?\nB: He is at home.\nA: Do you live in this city?\nB: Yes, I do.",
            img: "https://img.freepik.com/foto-gratis/hembras-felices-descansan-pausa-cafe-discuten-su-proyecto-futuro-usan-computadora-portatil-moderna-mejores-amigos-encuentran-cafeteria-miran-alegria-tienen-conversacion-agradable_273609-2620.jpg?t=st=1756573395~exp=1756576995~hmac=13c456264783482026c40758fddfdcf4e25f1032a34e3649e421d9586964c4dc&w=1480"
        }
    },
    {
        id: 'UT3',
        title: 'Daily Life',
        icon: '⏰',
        img: 'assets/vocab_wakeup.png',
        vocabulario: [
            { word: 'Wake up', translatxion: 'Despertarse', img: 'https://cdn.pixabay.com/photo/2016/03/31/19/19/alarm-1294909_1280.png' },
            { word: 'Breakfast', translation: 'Desayuno', img: 'https://img.freepik.com/fotos-premium/plato-desayuno-fresco-saludable-huevos-tocino-tostadas-salchichas-comenzar-dia_817921-2778.jpg?w=740' },
            { word: 'Never', translation: 'Nunca', img: 'https://img.freepik.com/foto-gratis/mujer-joven-da-retroalimentacion-negativa-muestra-pulgar-abajo-desaprueba-producto-no-gusta-algo-malo-esta_1258-218639.jpg?t=st=1756575023~exp=1756578623~hmac=01d016325a8afb4bf9dbeb6e4fe5cac30968670ad93f15538bf5d676603163ba&w=740' }
        ],
        ejemplos: [
            { sentence: 'I always eat breakfast.', img: 'https://img.freepik.com/foto-gratis/imagen-mujer-encantadora-que-huele-croissant_197531-33948.jpg?t=st=1756575084~exp=1756578684~hmac=25b3116d479caf4e2c2db92b14ca79e87887575fa74a7374f20f097f069af150&w=740' },
            { sentence: 'She wakes up early.', img: 'https://img.freepik.com/foto-gratis/bella-dama-satisfecha-buen-sueno-habitacion-hotel_1163-5175.jpg?t=st=1756575155~exp=1756578755~hmac=562878c17a444dafaf173801541d565d1941bf63d4e4f691e44417d60bc40c7d&w=740' },
            { sentence: 'He never goes to bed late.', img: 'https://images.pexels.com/photos/3771069/pexels-photo-3771069.jpeg' }
        ],
        dialogo: {
            text: "A: What do you do in the morning?\nB: I wake up and eat breakfast.\nA: Do you ever skip breakfast?\nB: Never!",
            img: "https://img.freepik.com/foto-gratis/captura-recortada-pareja-sonriente-desayunando-manana_171337-4939.jpg?t=st=1756575483~exp=1756579083~hmac=465faf2ce8c1e342134495f57ff42bfcb41bbe136834de79b943523b943d75a0&w=740"
        }
    },
    {
        id: 'UT4',
        title: 'Foods and Drinks',
        icon: '🍎',
        img: 'assets/vocab_fruit.png',
        vocabulario: [
            { word: 'Fruit', translation: 'Fruta', img: 'https://images.pexels.com/photos/1132047/pexels-photo-1132047.jpeg' },
            { word: 'Bread', translation: 'Pan', img: 'https://images.pexels.com/photos/209206/pexels-photo-209206.jpeg' },
            { word: 'Juice', translation: 'Jugo', img: 'https://images.pexels.com/photos/158053/fresh-orange-juice-squeezed-refreshing-citrus-158053.jpeg' }
        ],
        ejemplos: [
            { sentence: 'I like fruit juice.', img: 'https://img.freepik.com/psd-gratis/jugos-frutas-refrescantes-deliciosa-mezcla-citricos-opcion-estilo-vida-saludable_191095-90526.jpg?t=st=1756575826~exp=1756579426~hmac=7173db0ebb01b453fe2e08245607af259df849c8cf40fc2f40b5d0fdfef22832&w=740https://img.freepik.com/foto-gratis/variedad-batidos-coloridos-ingredientes-frescos_23-2151989778.jpg?t=st=1756575905~exp=1756579505~hmac=7a9de9167f2f5b86af50109e71af4958673f2816bcd0dd23651dd67b4c38d53c&w=740' },
            { sentence: 'She eats bread.', img: 'https://img.freepik.com/foto-gratis/persona-autentica-comiendo-queso-fresco_23-2150220460.jpg?t=st=1756575951~exp=1756579551~hmac=920b6f2f78b747052f399a4f3012476e16ab91f521eb87dcb79d0a5106ea2274&w=740' },
            { sentence: 'Banana is a fruit.', img: 'https://img.freepik.com/vector-gratis/vector-racimo-platano-amarillo-maduro-aislado-sobre-fondo-blanco_1284-45456.jpg?t=st=1756576112~exp=1756579712~hmac=e7c17da13c56311cc3fed7378ca1f09da26b4d3054e84d4847ff65ecac528b2d&w=740' }
        ],
        dialogo: {
            text: "A: What do you eat for breakfast?\nB: Bread and fruit.\nA: Do you drink juice?\nB: Yes, I do.",
            img: "https://images.pexels.com/photos/33674442/pexels-photo-33674442.jpeg"
        }
    },
    {
        id: 'UT5',
        title: 'Things I Have',
        icon: '📱',
        img: 'assets/vocab_phone.png',
        vocabulario: [
            { word: 'Phone', translation: 'Teléfono', img: 'https://images.pexels.com/photos/607812/pexels-photo-607812.jpegg' },
            { word: 'Bag', translation: 'Bolsa', img: 'https://images.pexels.com/photos/1152077/pexels-photo-1152077.jpeg' },
            { word: 'Keys', translation: 'Llaves', img: 'https://images.pexels.com/photos/14721/pexels-photo.jpg' }
        ],
        ejemplos: [
            { sentence: 'I have a phone.', img: 'https://img.freepik.com/foto-gratis/retrato-mujer-hermosa-sosteniendo-celda-moderna-aislada-sobre-pared-gris_114579-59392.jpg?t=st=1756576511~exp=1756580111~hmac=9d0c799c299bd1b013ee2c7550d65eafe0040cad8979c193f0e1ab31fa116499&w=740' },
            { sentence: 'My keys are in my bag.', img: 'https://img.freepik.com/foto-gratis/detalle-peluquero-herramientas_23-2148108837.jpg?t=st=1756576555~exp=1756580155~hmac=7135e63a1a65308a76e3a08169972ac191c20b60fef164e05328ec5932d70f71&w=740' },
            { sentence: 'She has a new bag.', img: 'https://img.freepik.com/fotos-premium/hermosa-mujer-cabello-afro-sonriendo-espacio-libre-anuncios-texto-publicidad_432566-14049.jpg?w=740' }
        ],
        dialogo: {
            text: "A: Do you have your keys?\nB: Yes, they are in my bag.\nA: And your phone?\nB: I have it too.",
            img: "https://img.freepik.com/fotos-premium/bolso-cuero-elegante-telefono-inteligente-llaves-banco_638202-11192.jpg?w=740"
        }
    },
    {
        id: 'UT6',
        title: 'Around Town - Free Time',
        icon: '🏞️',
        img: 'assets/vocab_park.png',
        vocabulario: [
            { word: 'Park', translation: 'Parque', img: 'https://img.freepik.com/psd-premium/renderizacion-3d-patio-recreo_23-2150659735.jpg' },
            { word: 'Cinema', translation: 'Cine', img: 'https://images.pexels.com/photos/109669/pexels-photo-109669.jpeg' },
            { word: 'Bank', translation: 'Banco', img: 'https://img.freepik.com/vector-premium/edificio-banco-ilustraciones-billetes-monedas-concepto-ahorro-dinero-banco-vectorial-aislado_338371-1874.jpg?w=1480' }
        ],
        ejemplos: [
            { sentence: 'I go to the park.', img: 'https://img.freepik.com/foto-gratis/mujer-joven-relajada-descansando-cerca-arbol-sentado-parque-cesped-sombra-sonriendo-luciendo-feliz_1258-126100.jpg?t=st=1756660711~exp=1756664311~hmac=7adf021cf090e7fcafd84b35f016810cae9f267b0a6677ac50e30a66bc14a77e&w=1480' },
            { sentence: 'She works at the bank.', img: 'https://img.freepik.com/foto-gratis/vista-frontal-joven-bella-dama-camisa-gris-trabajando-documentos-computadora-portatil-sentado-dentro-su-oficina-dia-actividad-laboral-edificio_140725-15140.jpg?t=st=1756660788~exp=1756664388~hmac=6fe0484f80ec777485ad0b43e4b32ed3bd4a527ff73e6ac2865a24a12f0949ee&w=1480' },
            { sentence: 'We watch movies at the cinema.', img: 'https://img.freepik.com/fotos-premium/concepto-cine-entretenimiento-personas-amigos-felices-viendo-peliculas-teatro_380164-91585.jpg?w=1480' }
        ],
        dialogo: {
            text: "A: Where do you go in your free time?\nB: I go to the cinema or the park.\nA: Do you work at the bank?\nB: Yes, I do.",
            img: "https://img.freepik.com/foto-gratis/senora-rubia-refinada-pantalones-cortos-negros-riendo-parque-magnifica-chica-europea-taza-cafe-jugando-fin-semana-verano_197531-19992.jpg?t=st=1756661519~exp=1756665119~hmac=1400e9f32c71adc562bb0f90cc19f2b7f7e215d2d386b64892e14a7261040036&w=1480"
        }
    }
];

export function setupAdminPanelLogic(panelElement, adminRole) {
    // DOM refs
    const moduleList = document.getElementById('module-list-admin');
    const moduloContent = document.getElementById('modulo-content-admin');
    const estudiantesContent = document.getElementById('estudiantes-content-admin');
    const progresoContent = document.getElementById('progreso-content-admin');
    const moduloSection = document.getElementById('modulo-section-admin');
    const estudiantesSection = document.getElementById('estudiantes-section-admin');
    const progresoSection = document.getElementById('progreso-section-admin');
    const logoutBtn = document.getElementById('logout-btn-admin');
    const adminNameSpan = document.getElementById("admin-name");
    const adminRoleSpan = document.getElementById("admin-role");
    const adminPhoto = document.getElementById("admin-photo");

    // ----------- MENÚ HAMBURGUESA MOBILE ----------
    const hamburgerBtn = document.getElementById('mobile-hamburger-btn');
    const hamburgerMenu = document.getElementById('mobile-hamburger-menu');
    const mobileMenuList = document.getElementById('mobile-menu-list');

    function renderMobileMenu() {
        mobileMenuList.innerHTML = '';
        [
            { id: 'modulos', label: 'Módulos', section: moduloSection },
            { id: 'estudiantes', label: 'Gestión de Estudiantes', section: estudiantesSection },
            { id: 'progreso', label: 'Monitorear Progreso', section: progresoSection }
        ].forEach(opt => {
            const li = document.createElement('li');
            li.innerHTML = `<button class="mobile-menu-link">${opt.label}</button>`;
            mobileMenuList.appendChild(li);
            li.querySelector('button').onclick = () => {
                if (opt.id === 'modulos') { renderModulosGrid(); }
                if (opt.id === 'estudiantes') { renderEstudiantesContent(); }
                if (opt.id === 'progreso') { renderProgresoContent(); }
                showSection(opt.section);
                hamburgerMenu.style.display = "none";
                hamburgerBtn.style.display = "flex";
            };
        });
    }
    if (hamburgerBtn && hamburgerMenu) {
        hamburgerBtn.addEventListener('click', () => {
            renderMobileMenu();
            hamburgerMenu.style.display = "flex";
            hamburgerBtn.style.display = "none";
        });
        hamburgerMenu.addEventListener('click', (e) => {
            if (e.target === hamburgerMenu) {
                hamburgerMenu.style.display = "none";
                hamburgerBtn.style.display = "flex";
            }
        });
    }
    // ----------- MENÚ LATERAL DESKTOP -----------
    function renderMenu() {
        moduleList.innerHTML = '';
        // Módulos
        const liModulos = document.createElement('li');
        liModulos.innerHTML = `<a href="#" class="modulo-link-admin" id="admin-modulos-link">Módulos</a>`;
        moduleList.appendChild(liModulos);
        liModulos.querySelector('a').addEventListener('click', (e) => {
            e.preventDefault();
            renderModulosGrid();
            showSection(moduloSection);
            moduleList.querySelectorAll('.modulo-link-admin').forEach(lnk => lnk.classList.remove('modulo-link-admin--activo'));
            liModulos.querySelector('a').classList.add('modulo-link-admin--activo');
        });

        // Gestión de estudiantes
        const liEstudiantes = document.createElement('li');
        liEstudiantes.innerHTML = `<a href="#" class="modulo-link-admin" id="admin-estudiantes-link">Gestión de Estudiantes</a>`;
        moduleList.appendChild(liEstudiantes);
        liEstudiantes.querySelector('a').addEventListener('click', (e) => {
            e.preventDefault();
            renderEstudiantesContent();
            showSection(estudiantesSection);
            moduleList.querySelectorAll('.modulo-link-admin').forEach(lnk => lnk.classList.remove('modulo-link-admin--activo'));
            liEstudiantes.querySelector('a').classList.add('modulo-link-admin--activo');
        });

        // Monitorear progreso
        const liProgreso = document.createElement('li');
        liProgreso.innerHTML = `<a href="#" class="modulo-link-admin" id="admin-progreso-link">Monitorear Progreso</a>`;
        moduleList.appendChild(liProgreso);
        liProgreso.querySelector('a').addEventListener('click', (e) => {
            e.preventDefault();
            renderProgresoContent();
            showSection(progresoSection);
            moduleList.querySelectorAll('.modulo-link-admin').forEach(lnk => lnk.classList.remove('modulo-link-admin--activo'));
            liProgreso.querySelector('a').classList.add('modulo-link-admin--activo');
        });
    }

    // Solo la sección activa
    function showSection(section) {
        [moduloSection, estudiantesSection, progresoSection].forEach(sec => sec.classList.add('seccion-admin--hidden'));
        section.classList.remove('seccion-admin--hidden');
    }

    // ----------- GRID DE MÓDULOS -----------
    function renderModulosGrid() {
        moduloContent.innerHTML = `<div class="modulos-grid-admin">` +
         /*   <img src="${mod.img}" alt="${mod.title}" class="modulo-card-admin__img"/>  */   
        modules.map(mod => `
                <div class="modulo-card-admin" data-module-id="${mod.id}">
                    
                    <div class="modulo-card-admin__icon">${mod.icon}</div>
                    <div class="modulo-card-admin__title">${mod.title}</div>
                    <div class="modulo-card-admin__desc">${mod.desc}</div>
                    <button class="boton-accion" data-module-id="${mod.id}">Ver módulo</button>
                </div>
            `).join('') +
            `</div>`;
        moduloContent.querySelectorAll('.boton-accion').forEach(btn => {
            btn.onclick = () => renderModuloDetalle(btn.dataset.moduleId);
        });
    }

    // ----------- DETALLE DE MÓDULO -----------
    function renderModuloDetalle(moduleId) {
        const mod = modules.find(m => m.id === moduleId);
        if (!mod) {
            moduloContent.innerHTML = `<p>Módulo no encontrado.</p>`;
            return;
        }
        moduloContent.innerHTML = `
            <div class="modulo-detalle-admin">
                <div class="modulo-detalle__tema">${mod.title}</div>
                <div class="modulo-detalle__apartado">
                    <h3>Vocabulario</h3>
                    <div class="vocabulario-grid-admin">
                        ${mod.vocabulario.map((v, i) => `
                            <div class="vocab-card-admin">
                                <img src="${v.img}" alt="${v.word}" class="vocab-img-admin"/>
                                <div class="vocab-word-admin">${v.word}</div>
                                <div class="vocab-translation-admin">${v.translation}</div>
                            </div>
                        `).join('')}
                    </div>
                    <button class="vocab-audio-btn-admin" id="vocab-audio-btn-all-${mod.id}">🔊 Reproducir Vocabulario</button>
                    <button class="vocab-audio-btn-admin" id="vocab-audio-btn-stop-${mod.id}">⏹️ Detener</button>
                </div>
                <div class="modulo-detalle__apartado">
                    <h3>Ejemplos</h3>
                    <div class="ejemplo-grid-admin">
                        ${mod.ejemplos.map((e, i) => `
                            <div class="ejemplo-card-admin">
                                <img src="${e.img}" alt="Ejemplo" class="ejemplo-img-admin"/>
                                <div class="ejemplo-text-admin">${e.sentence}</div>
                            </div>
                        `).join('')}
                    </div>
                    <button class="ejemplo-audio-btn-admin" id="ejemplo-audio-btn-all-${mod.id}">🔊 Reproducir Ejemplos</button>
                    <button class="ejemplo-audio-btn-admin" id="ejemplo-audio-btn-stop-${mod.id}">⏹️ Detener</button>
                </div>
                <div class="modulo-detalle__apartado">
                    <h3>Diálogo</h3>
                    <img src="${mod.dialogo.img}" alt="Diálogo" class="dialogo-img-admin">
                    <span class="dialogo-text-admin" style="display:block; margin-bottom:8px; white-space:pre-line;">${mod.dialogo.text}</span>
                    <button class="dialogo-audio-btn-admin" id="dialogo-audio-btn-${mod.id}">🔊 Reproducir Diálogo</button>
                    <button class="dialogo-audio-btn-admin" id="dialogo-audio-btn-stop-${mod.id}">⏹️ Detener</button>
                </div>
                <button class="boton-accion" id="volver-modulos">Volver</button>
            </div>
        `;
        document.getElementById('volver-modulos').onclick = renderModulosGrid;

        // --- AUDIO VOCABULARIO ---
        let vocabUtter;
        document.getElementById(`vocab-audio-btn-all-${mod.id}`).onclick = () => {
            vocabUtter = new window.SpeechSynthesisUtterance(mod.vocabulario.map(v => v.word).join('. '));
            vocabUtter.lang = 'en-US';
            window.speechSynthesis.speak(vocabUtter);
        };
        document.getElementById(`vocab-audio-btn-stop-${mod.id}`).onclick = () => window.speechSynthesis.cancel();

        // --- AUDIO EJEMPLOS ---
        let ejemplosUtter;
        document.getElementById(`ejemplo-audio-btn-all-${mod.id}`).onclick = () => {
            ejemplosUtter = new window.SpeechSynthesisUtterance(mod.ejemplos.map(e => e.sentence).join('. '));
            ejemplosUtter.lang = 'en-US';
            window.speechSynthesis.speak(ejemplosUtter);
        };
        document.getElementById(`ejemplo-audio-btn-stop-${mod.id}`).onclick = () => window.speechSynthesis.cancel();

        // --- AUDIO DIÁLOGO ---
        let dialogoUtter;
        document.getElementById(`dialogo-audio-btn-${mod.id}`).onclick = () => {
            dialogoUtter = new window.SpeechSynthesisUtterance(mod.dialogo.text.replace(/\n/g, '. '));
            dialogoUtter.lang = 'en-US';
            window.speechSynthesis.speak(dialogoUtter);
        };
        document.getElementById(`dialogo-audio-btn-stop-${mod.id}`).onclick = () => window.speechSynthesis.cancel();
    }

    // ----------- GESTIÓN DE ESTUDIANTES -----------
    async function renderEstudiantesContent() {
        estudiantesContent.innerHTML = '<p style="color:#2563eb;">Cargando estudiantes...</p>';
        const usuariosRef = collection(db, 'usuarios');
        const snapshot = await getDocs(usuariosRef);
        let html = `<div style="overflow-x:auto;"><table class="admin-table">
            <thead>
                <tr>
                    <th>Nombre</th>
                    <th>Email</th>
                    <th>Curso</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody>`;
        snapshot.forEach(docu => {
            const data = docu.data();
            html += `<tr>
                <td>${data.name || '-'}</td>
                <td>${data.email || '-'}</td>
                <td>
                    <select class="curso-select" data-uid="${docu.id}">
                        <option value="">Sin curso</option>
                        <option value="Primero A"${data.curso === 'Primero A' ? ' selected' : ''}>Primero A</option>
                        <option value="Primero B"${data.curso === 'Primero B' ? ' selected' : ''}>Primero B</option>
                    </select>
                </td>
                <td>
                    <button class="boton-eliminar-estudiante" data-uid="${docu.id}">Eliminar</button>
                </td>
            </tr>`;
        });
        html += '</tbody></table></div>';
        estudiantesContent.innerHTML = html;
        estudiantesContent.querySelectorAll('.curso-select').forEach(select => {
            select.addEventListener('change', async () => {
                const uid = select.dataset.uid;
                const curso = select.value;
                await updateDoc(doc(db, 'usuarios', uid), { curso });
                select.style.background = "#d1fae5";
            });
        });
        estudiantesContent.querySelectorAll('.boton-eliminar-estudiante').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (confirm('¿Eliminar estudiante? Esta acción no se puede deshacer.')) {
                    await deleteDoc(doc(db, 'usuarios', btn.dataset.uid));
                    renderEstudiantesContent();
                }
            });
        });
    }

    // ----------- MONITOREAR PROGRESO -----------
    async function renderProgresoContent() {
        progresoContent.innerHTML = `
            <label for="curso-progreso" style="font-weight:700;color:#2563eb;">Selecciona curso:</label>
            <select id="curso-progreso" style="border:1px solid #58CC02;">
                <option value="Primero A">Primero A</option>
                <option value="Primero B">Primero B</option>
            </select>
            <div id="progreso-lista-estudiantes"></div>
            <div id="progreso-detalle-admin"></div>
        `;
        const selectCurso = document.getElementById('curso-progreso');
        async function cargarEstudiantesProgreso(curso) {
            const usuariosRef = collection(db, 'usuarios');
            const snapshot = await getDocs(usuariosRef);
            let lista = `<div style="overflow-x:auto;"><table class="admin-table">
                <thead>
                    <tr>
                        <th>Nombre</th>
                        <th>Email</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>`;
            snapshot.forEach(docu => {
                const data = docu.data();
                if (data.curso === curso) {
                    lista += `<tr>
                        <td>${data.name || '-'}</td>
                        <td>${data.email || '-'}</td>
                        <td>
                            <button class="boton-ver-detalle" data-uid="${docu.id}">Ver progreso</button>
                        </td>
                    </tr>`;
                }
            });
            lista += '</tbody></table></div>';
            document.getElementById('progreso-lista-estudiantes').innerHTML = lista;
            document.querySelectorAll('.boton-ver-detalle').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const docSnap = await getDoc(doc(db, 'usuarios', btn.dataset.uid));
                    if (!docSnap.exists()) return;
                    const data = docSnap.data();
                    const scores = data.scores || {};
                    let detalle = `<h3 style="color:#2563eb;">Calificaciones de ${data.name || data.email}</h3>
                        <div style="overflow-x:auto;"><table class="admin-table">
                        <thead><tr><th>Unidad</th><th>Puntaje</th><th>Estado</th></tr></thead><tbody>`;
                    Object.entries(scores).forEach(([unidad, obj]) => {
                        detalle += `<tr>
                            <td>${unidad}</td>
                            <td>${obj.score ?? '-'}</td>
                            <td class="${obj.completada ? 'estado-aprobado' : 'estado-reprobado'}">
                                ${obj.completada ? 'Completada' : 'Pendiente'}
                            </td>
                        </tr>`;
                    });
                    detalle += '</tbody></table></div><button id="cerrar-detalle-progreso" class="boton-accion" style="background:#2563eb;color:#fff;">Cerrar</button>';
                    document.getElementById('progreso-detalle-admin').innerHTML = detalle;
                    document.getElementById('cerrar-detalle-progreso').onclick = () => document.getElementById('progreso-detalle-admin').innerHTML = "";
                });
            });
        }
        selectCurso.addEventListener('change', () => cargarEstudiantesProgreso(selectCurso.value));
        cargarEstudiantesProgreso(selectCurso.value);
    }

    // ----------- INICIALIZACIÓN y perfil -----------
    onAuthStateChanged(auth, (user) => {
        if (user) {
            if (adminNameSpan) adminNameSpan.textContent = user.displayName || user.email || "Docente";
            if (adminPhoto) adminPhoto.src = user.photoURL || "https://placehold.co/64x64/E2E8F0/A0AEC0?text=D";
            if (adminRoleSpan) adminRoleSpan.textContent = adminRole || "admin";
            renderMenu();
            renderModulosGrid();
            showSection(moduloSection);
            // Activar menú "Módulos" por defecto visualmente
            moduleList.querySelectorAll('.modulo-link-admin').forEach(lnk => lnk.classList.remove('modulo-link-admin--activo'));
            const modulosLink = document.getElementById('admin-modulos-link');
            if (modulosLink) modulosLink.classList.add('modulo-link-admin--activo');
        }
    });

    // ----------- Cerrar sesión -----------
    if (logoutBtn) {
        logoutBtn.addEventListener("click", async () => {
            await signOut(auth);
            window.location.reload();
        });
    }
}