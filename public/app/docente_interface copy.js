import { auth, db } from "./conexion_firebase.js";
import { signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";
import { collection, doc, getDoc, getDocs, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";
import { moduleInfo, playSound, units, userScores } from "./user_interface.js";
import { showMessage } from "./notificaciones.js";
import { setupUserPanelLogic } from "./user_interface.js";
import { setupSpeakingExercise } from "./speaking.js";
import { setupReadingExercise } from "./reading.js";
import { setupListeningExercise } from "./listening.js";

// Los módulos con imágenes y contenido modules [{id},]

// Los módulos con imágenes y contenido
const modules = [
    {
        id: 'WRITING',
        title: 'WRITING PRACTICE WITH AI',
        urlHtml: 'modules/writing_practices.html',
        icon: '✏️',
        img: 'assets/vocab_hello.png',
    },
    {
        id: 'LISTENING',
        title: 'LISTENING PRACTICE WITH STORIES',
        urlHtml: 'modules/listening_practices.html',
        icon: '🧏‍♂️',
        img: 'assets/vocab_hello.png',
    },
    {
        id: 'READING',
        title: 'READIGN PRACTICES WITH GAMES',
        urlHtml: 'modules/reading_practices.html',
        icon: '📖',
        img: 'assets/vocab_hello.png',
    },
    {
        id: 'SPEAKING',
        title: 'SPEAKING PRACTICE WITH EVERYDAY PHRASES',
        urlHtml: 'modules/speaking_practices.html',
        icon: '🗣️',
        img: 'assets/vocab_hello.png',
    }]

/**
 * [ELIMINADA LA FUNCIÓN DE EXPORTACIÓN A EXCEL/CSV]
 */
// La función exportToExcelCSV ha sido eliminada.


export function setupAdminPanelLogic(panelElement, adminRole) {

    // PASO 1: Obtener la referencia a las funciones del panel de usuario
    const userPanelAPI = setupUserPanelLogic(null, 'null'); // Puedes pasar `null` para el panel si no es relevante aquí
    const renderUnitContentForAdmin = userPanelAPI.renderUnitContent; // Obtenemos la función clave


    // DOM refs
    const moduleList = document.getElementById('module-list-admin');
    const moduloContent = document.getElementById('modules-grid-admin');
    const skillsContent = document.getElementById('skills-content-admin');
    const estudiantesContent = document.getElementById('estudiantes-content-admin');
    const progresoContent = document.getElementById('progreso-content-admin');

    const moduloSection = document.getElementById('modulo-section-admin');
    const unidadWritingSection = document.getElementById('unit-WRITING');
    const skillsSection = document.getElementById('skills-section-admin');
    const estudiantesSection = document.getElementById('estudiantes-section-admin');
    const progresoSection = document.getElementById('progreso-section-admin');
    const adminNameSpan = document.getElementById("admin-name");
    const adminRoleSpan = document.getElementById("admin-role");
    const adminPhoto = document.getElementById("admin-photo");
    const unitSections = document.querySelectorAll('.seccion-unidad');
    //  ----------- MENÚ HAMBURGUESA MOBILE ----------
    const hamburgerBtn = document.getElementById('mobile-hamburger-btn');
    const hamburgerMenu = document.getElementById('mobile-hamburger-menu');
    const mobileMenuList = document.getElementById('mobile-menu-list');
    const skillsInjectSection = document.getElementById('skills-inject');


    function renderMobileMenu() {
        mobileMenuList.innerHTML = '';
        [
            { id: 'modulos', label: 'INTERACTIVE MODULES', section: moduloSection },
            { id: 'skills', label: 'LANGUAGE SKILLS PRACTICE', section: skillsSection },
            { id: 'estudiantes', label: 'STUDENT MANAGEMENT', section: estudiantesSection },
            { id: 'progreso', label: 'PROGRESS MONITORING', section: progresoSection }
        ].forEach(opt => {
            const li = document.createElement('li');
            li.innerHTML = `<button class="mobile-menu-link">${opt.label}</button>`;
            mobileMenuList.appendChild(li);
            li.querySelector('button').onclick = () => {
                if (opt.id === 'modulos') { renderModulosGrid(); }
                if (opt.id === 'skills') { renderSkillsContent(); }
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
        liModulos.innerHTML = `<a href="#" class="modulo-link-admin" id="admin-modulos-link">INTERACTIVE MODULES</a>`;
        moduleList.appendChild(liModulos);
        liModulos.querySelector('a').addEventListener('click', (e) => {
            e.preventDefault();
            renderModulosGrid();
            showSection(moduloSection);
            moduleList.querySelectorAll('.modulo-link-admin').forEach(lnk => lnk.classList.remove('modulo-link-admin--activo'));
            liModulos.querySelector('a').classList.add('modulo-link-admin--activo');
        });
        // SKILLS

        const liSkills = document.createElement('li');
        liSkills.innerHTML = `<a href="#" class="modulo-link-admin" id="admin-skills-link">LANGUAGE SKILLS PRACTICE</a>`;
        moduleList.appendChild(liSkills);
        liSkills.querySelector('a').addEventListener('click', (e) => {
            e.preventDefault();
            renderSkillsContent();
            showSection(skillsSection);
            moduleList.querySelectorAll('.modulo-link-admin').forEach(lnk => lnk.classList.remove('modulo-link-admin--activo'));
            liSkills.querySelector('a').classList.add('modulo-link-admin--activo');
        });

        // Gestión de estudiantes
        const liEstudiantes = document.createElement('li');
        liEstudiantes.innerHTML = `<a href="#" class="modulo-link-admin" id="admin-estudiantes-link">STUDENT MANAGEMENT</a>`;
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
        liProgreso.innerHTML = `<a href="#" class="modulo-link-admin" id="admin-progreso-link">PROGRESS MONITORING</a>`;
        moduleList.appendChild(liProgreso);
        liProgreso.querySelector('a').addEventListener('click', (e) => {
            e.preventDefault();
            renderProgresoContent();
            showSection(progresoSection);
            moduleList.querySelectorAll('.modulo-link-admin').forEach(lnk => lnq.classList.remove('modulo-link-admin--activo'));
            liProgreso.querySelector('a').classList.add('modulo-link-admin--activo');
        });
    }

    // Solo la sección activa
    /**
        * Muestra una sección específica y oculta las demás.
        * @param {HTMLElement} sectionToShow - La sección que se va a mostrar.
        */
    const showSection = (sectionToShow) => {



        [moduloSection, skillsSection, estudiantesSection, progresoSection, unidadWritingSection, skillsInjectSection].forEach(sec => sec.classList.add('seccion-admin--hidden'));

        sectionToShow.classList.remove('seccion-admin--hidden');



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
    const renderModulosGrid = () => {
        if (!moduloContent) return;
        moduloContent.innerHTML = '';
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

            moduloContent.appendChild(card);

            // 🚀 El click listener en la tarjeta hace la acción principal
            card.addEventListener('click', () => {
                renderUnitContentForAdmin(unit.id);

            });
        });
        showSection(moduloSection);
    };

    async function renderSkillsContent() {


        let html = `<div class="modulos-grid-admin">` + modules.map(mod => `
             <div class="modulo-card-admin" data-module-id="${mod.id}">
                 <div class="modulo-card-admin__icon">${mod.icon}</div>
                 <div class="modulo-card-admin__title">${mod.title}</div>
                 <button class="boton-accion" data-module-id="${mod.id}">Ver módulo</button>
             </div>
        `).join('') +
            `</div>`





        skillsContent.innerHTML = html;

        const skillsBtns = document.querySelectorAll('.modulo-card-admin');

        skillsBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const moduleId = e.currentTarget.dataset.moduleId;
                console.log("Módulo seleccionado:", moduleId);


                if (moduleId !== "null") {
                    console.log("es diferente de null")
                    skillsSection.classList.add('seccion-admin--hidden');
                }
                if (moduleId === 'READING') {
                    console.log("READING")
                    setupReadingExercise(skillsInjectSection, playSound, userScores); // true indica modo admin
                    console.warn("userScores en admin_interface:", userScores);
                    skillsInjectSection.dataset.skill = "READING"; // Marcar como cargado

                    skillsInjectSection.classList.remove('seccion-admin--hidden');
                } else if (moduleId === 'LISTENING') {
                    console.log("LISTENING")
                    setupListeningExercise(skillsInjectSection, playSound, userScores); // Llama a la nueva función y le pasa los puntajes
                    skillsInjectSection.classList.remove('seccion-admin--hidden');
                } else if (moduleId === 'WRITING') {
                    console.log("WRITING")
                    unidadWritingSection.classList.remove('seccion-admin--hidden');

                } else if (moduleId === 'SPEAKING') {
                    console.log("SPEAKING")
                    setupSpeakingExercise(skillsInjectSection, playSound, userScores);
                    skillsInjectSection.classList.remove('seccion-admin--hidden');
                }
            })


        })
    }

    // ----------- GESTIÓN DE ESTUDIANTES (MODIFICADO) -----------
    async function renderEstudiantesContent() {
        estudiantesContent.innerHTML = `
            <input type="text" id="search-student-input" placeholder="Buscar estudiante por nombre..." 
                   style="padding: 10px; margin-bottom: 20px; width: 100%; border: 1px solid #ccc; border-radius: 5px;">
            <p style="color:#2563eb;">Cargando estudiantes...</p>
        `;

        const usuariosRef = collection(db, 'usuarios');
        const snapshot = await getDocs(usuariosRef);
        const estudiantesData = []; // Array para guardar los datos y usarlos en la búsqueda
        snapshot.forEach(docu => {
            estudiantesData.push({ id: docu.id, ...docu.data() });
        });

        // Función para renderizar la tabla con los datos filtrados
        const renderTable = (filteredData) => {
            let html = `<div style="overflow-x:auto;"><table class="admin-table" id="student-table">
                <thead>
                    <tr>
                        <th>Nombre</th>
                        <th>Email</th>
                        <th>Curso</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>`;
            
            filteredData.forEach(data => {
                html += `<tr data-name="${(data.name || '').toLowerCase()}">
                    <td>${data.name || '-'}</td>
                    <td>${data.email || '-'}</td>
                    <td>
                        <select class="curso-select" data-uid="${data.id}">
                            <option value="">Sin curso</option>
                            <option value="Primero A"${data.curso === 'Primero A' ? ' selected' : ''}>Primero A</option>
                            <option value="Primero B"${data.curso === 'Primero B' ? ' selected' : ''}>Primero B</option>
                        </select>
                    </td>
                    <td>
                        <button class="boton-eliminar-estudiante" data-uid="${data.id}">Eliminar</button>
                    </td>
                </tr>`;
            });
            html += '</tbody></table></div>';
            
            // Reemplazar solo la tabla, manteniendo el input
            const existingTable = document.getElementById('student-table');
            if (existingTable) {
                existingTable.parentElement.remove(); // Elimina el div overflow y la tabla
            }
            
            // El placeholder de carga se reemplaza por la tabla renderizada
            const loadingP = estudiantesContent.querySelector('p');
            if (loadingP && loadingP.textContent === 'Cargando estudiantes...') {
                loadingP.remove();
            }
            estudiantesContent.insertAdjacentHTML('beforeend', html);


            // Re-adjuntar listeners de actualización de curso y eliminación
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
                        renderEstudiantesContent(); // Recargar la lista
                    }
                });
            });
        };
        
        // Renderizado inicial
        renderTable(estudiantesData);

        // Lógica de filtrado dinámico
        const searchInput = document.getElementById('search-student-input');
        searchInput.addEventListener('input', (e) => {
            const searchText = e.target.value.toLowerCase().trim();
            const filteredStudents = estudiantesData.filter(student => 
                (student.name || '').toLowerCase().includes(searchText)
            );
            renderTable(filteredStudents);
        });
    }

    // ----------- MONITOREAR PROGRESO (MODIFICADO SIN EXPORTACIÓN) -----------
    async function renderProgresoContent() {
        progresoContent.innerHTML = `
            <div style="display:flex; align-items: center; margin-bottom: 20px;">
                <label for="curso-progreso" style="font-weight:700; color:#2563eb; margin-right: 10px;">Selecciona curso:</label>
                <select id="curso-progreso" style="border:1px solid #58CC02; padding: 5px;">
                    <option value="Primero A">Primero A</option>
                    <option value="Primero B">Primero B</option>
                </select>
            </div>
            <div id="progreso-lista-estudiantes"></div>
            <div id="progreso-detalle-admin"></div>
        `;
        const selectCurso = document.getElementById('curso-progreso');


        /**
         * [FUNCIÓN DE RECOPILACIÓN ELIMINADA PORQUE YA NO SE EXPORTA]
         */
        

        // Función para cargar la lista de estudiantes de progreso (con barra de búsqueda)
        async function cargarEstudiantesProgreso(curso) {
            const usuariosRef = collection(db, 'usuarios');
            const snapshot = await getDocs(usuariosRef);
            
            // Filtrar y preparar datos de estudiantes del curso actual
            const estudiantesProgreso = [];
            snapshot.forEach(docu => {
                const data = docu.data();
                if (data.curso === curso) {
                    estudiantesProgreso.push({ id: docu.id, ...data });
                }
            });

            const progresoListaElement = document.getElementById('progreso-lista-estudiantes');
            progresoListaElement.innerHTML = `
                <input type="text" id="search-progreso-input" placeholder="Buscar estudiante por nombre..." 
                       style="padding: 10px; margin-bottom: 10px; width: 100%; border: 1px solid #ccc; border-radius: 5px;">
            `;


            const renderProgresoTable = (filteredStudents) => {
                let htmlTable = `<div style="overflow-x:auto;"><table class="admin-table" id="progreso-table">
                    <thead><tr><th>Nombre</th><th>Email</th><th>Acciones</th></tr></thead><tbody>`;

                filteredStudents.forEach(data => {
                    htmlTable += `<tr>
                        <td>${data.name || '-'}</td>
                        <td>${data.email || '-'}</td>
                        <td><button class="boton-ver-detalle" data-uid="${data.id}">Ver progreso</button></td>
                    </tr>`;
                });
                htmlTable += '</tbody></table></div>';
                
                // Reemplazar solo la tabla
                const existingProgresoTable = document.getElementById('progreso-table');
                if (existingProgresoTable) {
                    existingProgresoTable.parentElement.remove();
                }
                progresoListaElement.insertAdjacentHTML('beforeend', htmlTable);

                // Re-adjuntar listeners para "Ver progreso"
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
                            // Aplicar color de fondo verde claro para el estado 'Completada'
                            const rowStyle = obj.completada ? 'style="background-color:#d1fae5;"' : '';
                            detalle += `<tr ${rowStyle}>
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
            };
            
            renderProgresoTable(estudiantesProgreso);

            // Lógica de filtrado dinámico para la lista de progreso
            const searchInputProgreso = document.getElementById('search-progreso-input');
            if (searchInputProgreso) {
                searchInputProgreso.addEventListener('input', (e) => {
                    const searchText = e.target.value.toLowerCase().trim();
                    const filteredStudents = estudiantesProgreso.filter(student => 
                        (student.name || '').toLowerCase().includes(searchText)
                    );
                    renderProgresoTable(filteredStudents);
                });
            }

        } // Fin de cargarEstudiantesProgreso

        selectCurso.addEventListener('change', () => {
            document.getElementById('progreso-detalle-admin').innerHTML = ""; // Limpiar detalle al cambiar curso
            cargarEstudiantesProgreso(selectCurso.value);
        });
        cargarEstudiantesProgreso(selectCurso.value);
    } // Fin de renderProgresoContent

    // ----------- INICIALIZACIÓN y perfil -----------
    onAuthStateChanged(auth, (user) => {
        if (user) {
            if (adminNameSpan) adminNameSpan.textContent = user.displayName || user.email || "Docente";
            let sidebarPlaceholderPhoto = "https://placehold.co/64x64/E2E8F0/A0AEC0?text=D"

            if (user.email === "marlon.barcia@unesum.edu.ec") {
                if (adminPhoto) adminPhoto.src = user.photoURL || "https://lh3.googleusercontent.com/a-/ALV-UjV8qdhf0AchL-VaxvxWKN80VdYcHq29ZBxgjCzaTSS_--Edh8xZ=s300-p-k-rw-no";
            } else {
                adminPhoto.src = user.photoURL || sidebarPlaceholderPhoto;
            }

            if (adminRoleSpan) adminRoleSpan.textContent = "TEACHER ✏️📗" || "admin";



            renderMenu();
            renderModulosGrid();
            showSection(moduloSection);
            // Activar menú "Módulos" por defecto visualmente
            moduleList.querySelectorAll('.modulo-link-admin').forEach(lnk => lnk.classList.remove('modulo-link-admin--activo'));
            const modulosLink = document.getElementById('admin-modulos-link');
            if (modulosLink) modulosLink.classList.add('modulo-link-admin--activo');
        }
    });


}