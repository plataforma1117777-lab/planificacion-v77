/* =================================================================
   PDC Secundaria 3.1 - SCRIPT.JS
   Sistema de Planificación 2026 — Generación directa con IA
   Desarrollador: Prof. Israel Condori Gonzales
   Adaptado al sistema de generación directa (sin prompt manual)
   ================================================================= */

// Estado global del PDC generado
let pdcData = { formData: {}, generatedContent: {} };
let semanasVisibles = 4;

// ─────────────────────────────────────────────
// INICIALIZACIÓN DEL DOM
// ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function () {

    // Generar campos de semanas dinámicamente
    const contenedorSemanas = document.getElementById('contenedor-semanas');
    if (contenedorSemanas) {
        let htmlSemanas = '';
        for (let i = 1; i <= 5; i++) {
            htmlSemanas += `
                <div class="week-card" id="week-card-${i}" style="${i > 4 ? 'display: none;' : ''}">
                    <label class="label-style !text-primary-light">Contenido Semana ${i}</label>
                    <textarea id="cont_sem${i}" class="input-style auto-expand" rows="3"
                        placeholder="Ej: LOS NÚMEROS REALES\nSistemas numéricos..."></textarea>
                </div>`;
        }
        contenedorSemanas.innerHTML = htmlSemanas;
    }

    // Auto-expand en textareas
    document.querySelectorAll('.auto-expand').forEach(textarea => {
        textarea.addEventListener('input', function () {
            this.style.height = 'auto';
            this.style.height = this.scrollHeight + 'px';
        });
    });

    // Cargar datos guardados
    cargarDatosGuardados();

    // Guardar al cambiar cualquier campo
    document.querySelectorAll('#pdcForm input, #pdcForm select, #pdcForm textarea').forEach(el => {
        el.addEventListener('change', guardarDatos);
        if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') {
            el.addEventListener('input', guardarDatos);
        }
    });

    const catSelect = document.getElementById('categoriaAdaptacion');
    if (catSelect) {
        catSelect.addEventListener('change', function () {
            const btn = document.getElementById('btn-add-student');
            if (btn) btn.style.display = this.value === 'significativa' ? 'inline-flex' : 'none';
        });
        setTimeout(() => catSelect.dispatchEvent(new Event('change')), 100);
    }

    // Lógica para fechas de duración
    const fechaInicio = document.getElementById('fechaInicio');
    const fechaFin = document.getElementById('fechaFin');
    const duracion = document.getElementById('duracion');
    const meses = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];

    function actualizarDuracion() {
        if (fechaInicio && fechaFin && duracion) {
            if (fechaInicio.value && fechaFin.value) {
                // Agregar T00:00:00 para evitar desajustes de zona horaria local
                const dateInicio = new Date(fechaInicio.value + "T00:00:00");
                const dateFin = new Date(fechaFin.value + "T00:00:00");

                const diaInicio = String(dateInicio.getDate()).padStart(2, '0');
                const mesInicio = meses[dateInicio.getMonth()];

                const diaFin = String(dateFin.getDate()).padStart(2, '0');
                const mesFin = meses[dateFin.getMonth()];

                if (mesInicio === mesFin) {
                    duracion.value = `DEL ${diaInicio} AL ${diaFin} DE ${mesFin}`;
                } else {
                    duracion.value = `DEL ${diaInicio} DE ${mesInicio} AL ${diaFin} DE ${mesFin}`;
                }
            } else {
                duracion.value = '';
            }
            guardarDatos();
        }
    }

    if (fechaInicio) fechaInicio.addEventListener('change', actualizarDuracion);
    if (fechaFin) fechaFin.addEventListener('change', actualizarDuracion);
});

// ─────────────────────────────────────────────
// PERSISTENCIA EN LOCALSTORAGE
// ─────────────────────────────────────────────
function guardarDatos() {
    const datos = {
        numeroPDC: document.getElementById('numeroPDC')?.value || '01',
        distrito: document.getElementById('distrito')?.value || '',
        nivel: document.getElementById('nivel')?.value || '',
        maestro: document.getElementById('maestro')?.value || '',
        area: document.getElementById('area')?.value || '',
        trimestre: document.getElementById('trimestre')?.value || '',
        fechaInicio: document.getElementById('fechaInicio')?.value || '',
        fechaFin: document.getElementById('fechaFin')?.value || '',
        duracion: document.getElementById('duracion')?.value || '',
        ue: document.getElementById('ue')?.value || '',
        escolaridad: document.getElementById('escolaridad')?.value || '',
        categoriaAdaptacion: document.getElementById('categoriaAdaptacion')?.value || '',
        adaptacionesArray: Array.from(document.querySelectorAll('#estudiantes-container textarea')).map(el => el.value),
        semanas: []
    };
    for (let i = 1; i <= 5; i++) {
        datos.semanas[i - 1] = document.getElementById(`cont_sem${i}`)?.value || '';
    }
    localStorage.setItem('pdcFormData', JSON.stringify(datos));
}

function cargarDatosGuardados() {
    const saved = localStorage.getItem('pdcFormData');
    if (!saved) return;
    try {
        const datos = JSON.parse(saved);
        const set = (id, val) => { const el = document.getElementById(id); if (el && val) el.value = val; };
        set('numeroPDC', datos.numeroPDC);
        set('distrito', datos.distrito);
        set('nivel', datos.nivel);
        set('maestro', datos.maestro);
        set('area', datos.area);
        set('trimestre', datos.trimestre);
        set('fechaInicio', datos.fechaInicio);
        set('fechaFin', datos.fechaFin);
        set('duracion', datos.duracion);
        set('ue', datos.ue);
        set('escolaridad', datos.escolaridad);
        set('categoriaAdaptacion', datos.categoriaAdaptacion);
        if (datos.adaptacionesArray && datos.adaptacionesArray.length > 0) {
            const container = document.getElementById('estudiantes-container');
            if (container) {
                document.getElementById('tipoAdaptacion').value = datos.adaptacionesArray[0];
                for (let j = 1; j < datos.adaptacionesArray.length; j++) {
                    agregarEstudiante();
                    const textareas = container.querySelectorAll('textarea');
                    if (textareas[j]) textareas[j].value = datos.adaptacionesArray[j];
                }
            }
        }
        if (datos.semanas) {
            datos.semanas.forEach((val, i) => {
                setTimeout(() => {
                    const el = document.getElementById(`cont_sem${i + 1}`);
                    if (el && val) {
                        if (i + 1 > semanasVisibles) {
                            while (semanasVisibles < i + 1) {
                                agregarSemana();
                            }
                        }
                        el.value = val;
                        el.style.height = 'auto';
                        el.style.height = el.scrollHeight + 'px';
                    }
                }, 100);
            });
        }
    } catch (e) { localStorage.removeItem('pdcFormData'); }
}



// ─────────────────────────────────────────────
// AGREGAR SEMANA
// ─────────────────────────────────────────────
function agregarSemana() {
    if (semanasVisibles < 5) {
        semanasVisibles++;
        const card = document.getElementById(`week-card-${semanasVisibles}`);
        if (card) {
            card.style.display = 'block';
        }
    }

    if (semanasVisibles >= 5) {
        const btn = document.getElementById('btn-agregar-semana');
        if (btn) btn.style.display = 'none';
    }
}

// ─────────────────────────────────────────────
// AGREGAR ESTUDIANTE (ADAPTACIONES)
// ─────────────────────────────────────────────
function agregarEstudiante() {
    const container = document.getElementById('estudiantes-container');
    if (!container) return;
    const row = document.createElement('div');
    row.className = 'estudiante-row';
    row.style.display = 'flex';
    row.style.gap = '8px';
    row.style.alignItems = 'start';

    const textarea = document.createElement('textarea');
    textarea.className = 'input-style auto-expand';
    textarea.rows = 1;
    textarea.placeholder = 'Ej: Estudiante adicional';
    textarea.style.flex = '1';

    textarea.addEventListener('input', function () {
        this.style.height = 'auto';
        this.style.height = this.scrollHeight + 'px';
        guardarDatos();
    });
    textarea.addEventListener('change', guardarDatos);

    const btnRemove = document.createElement('button');
    btnRemove.type = 'button';
    btnRemove.innerHTML = '✖';
    btnRemove.title = 'Eliminar estudiante';
    btnRemove.style.padding = '0 10px';
    btnRemove.style.backgroundColor = 'transparent';
    btnRemove.style.border = 'none';
    btnRemove.style.color = 'var(--accent)';
    btnRemove.style.fontSize = '1.2rem';
    btnRemove.style.cursor = 'pointer';
    btnRemove.style.marginTop = '10px';
    btnRemove.onclick = function () {
        container.removeChild(row);
        guardarDatos();
    };

    row.appendChild(textarea);
    row.appendChild(btnRemove);
    container.appendChild(row);
}

// ─────────────────────────────────────────────
// RECOLECCIÓN DE DATOS DEL FORMULARIO
// ─────────────────────────────────────────────
function recolectarFormData() {
    const semanas = [];
    let totalSemanas = 0;
    for (let i = 1; i <= semanasVisibles; i++) {
        const val = document.getElementById(`cont_sem${i}`)?.value?.trim() || '';
        semanas.push(val);
        if (val !== '') totalSemanas = i;
    }



    return {
        numeroPDC: document.getElementById('numeroPDC')?.value || '01',
        distrito: document.getElementById('distrito')?.value || '',
        nivel: document.getElementById('nivel')?.value || 'Secundario',
        maestro: document.getElementById('maestro')?.value || '',
        area: document.getElementById('area')?.value || '',
        trimestre: document.getElementById('trimestre')?.value || '',
        duracion: document.getElementById('duracion')?.value || '',
        ue: document.getElementById('ue')?.value || '',
        escolaridad: document.getElementById('escolaridad')?.value || '',
        categoriaAdaptacion: document.getElementById('categoriaAdaptacion')?.value || 'curricular',
        tipoAdaptacion: Array.from(document.querySelectorAll('#estudiantes-container textarea')).map(el => el.value.trim()).filter(Boolean).join('; '),
        semanas,
        totalSemanas: totalSemanas === 0 ? 1 : totalSemanas,
    };
}

// ─────────────────────────────────────────────
// HELPER: LLAMADA A LA FUNCIÓN NETLIFY CON REINTENTO
// ─────────────────────────────────────────────
async function fetchWithRetry(url, options, retries = 3, delay = 2500) {
    for (let i = 1; i <= retries; i++) {
        try {
            const response = await fetch(url, options);
            if (response.ok) return response;

            let errText = `Error ${response.status}: ${response.statusText}`;
            try {
                const errTextRaw = await response.text();
                try {
                    const errJson = JSON.parse(errTextRaw);
                    if (errJson.error) {
                        errText += ` - ${errJson.error}`;
                        if (errJson.details) errText += ` (${errJson.details})`;
                    }
                } catch (e) {
                    // Not JSON, append the raw text instead (up to 200 chars)
                    errText += ` - ${errTextRaw.substring(0, 200)}`;
                }
            } catch (e) {
                // Ignore text read error
            }
            throw new Error(errText);
        } catch (error) {
            if (i === retries) throw error;
            await new Promise(r => setTimeout(r, delay));
        }
    }
}

// ─────────────────────────────────────────────
// LOG DE GENERACIÓN EN LA UI
// ─────────────────────────────────────────────
function log(mensaje, tipo = 'info') {
    const logEl = document.getElementById('generation-log');
    if (!logEl) return;
    const iconos = { info: '🧠', ok: '✅', error: '❌', writing: '✍️' };
    logEl.innerHTML += `<div class="log-${tipo}">${iconos[tipo] || '•'} ${mensaje}</div>`;
    logEl.scrollTop = logEl.scrollHeight;
}

function actualizarProgreso(porcentaje, texto) {
    const container = document.getElementById('progress-container');
    const bar = document.getElementById('progress-bar');
    const textEl = document.getElementById('progress-text');
    const percentEl = document.getElementById('progress-percent');

    if (container) container.style.display = 'block';
    if (bar) bar.style.width = porcentaje + '%';
    if (textEl && texto) textEl.textContent = texto;
    if (percentEl) percentEl.textContent = porcentaje + '%';
}

function mostrarProveedor(proveedor) {
    const badge = document.getElementById('api-provider-badge');
    if (badge && proveedor) {
        badge.textContent = `Usando ${proveedor}`;
        badge.style.display = 'inline-block';
        log(`Motor de IA detectado: ${proveedor}`, 'info');
    }
}

// ─────────────────────────────────────────────
// FUNCIÓN PRINCIPAL: GENERAR PDC
// ─────────────────────────────────────────────
async function generarPDC() {
    const formData = recolectarFormData();

    // Validación básica
    if (!formData.area || formData.semanas.every(s => s === '')) {
        alert('¡Aviso! Debes agregar el área y al menos un contenido en alguna semana para generar el PDC.');
        return;
    }

    pdcData.formData = formData;
    pdcData.generatedContent = {};

    // Mostrar panel de resultados
    const resultsPanel = document.getElementById('results-panel');
    resultsPanel.style.display = 'block';
    resultsPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // Resetear bloques
    document.getElementById('generation-log').innerHTML = '';
    document.getElementById('action-buttons').style.display = 'none';
    const badge = document.getElementById('api-provider-badge');
    if (badge) badge.style.display = 'none';
    actualizarProgreso(5, 'Iniciando proceso...');

    // Deshabilitar botón
    const btnGenerar = document.getElementById('btn-generar');
    btnGenerar.disabled = true;
    btnGenerar.textContent = 'Generando...';

    try {
        // ── PASO 1: DATOS REFERENCIALES ──────────────────
        actualizarProgreso(15, 'Construyendo Datos Referenciales...');
        log('Construyendo Datos Referenciales...');
        const datosHTML = construirTablaDataReferencial(formData);
        pdcData.generatedContent.datos = datosHTML;
        log('Datos Referenciales procesados internamente', 'ok');

        // ── PASO 2: OBJETIVO HOLÍSTICO ───────────────────
        actualizarProgreso(30, 'Redactando Objetivo Holístico...');
        log('Redactando Objetivo Holístico de Nivel...');
        const objFijo = "Formamos integralmente a las y los estudiantes con identidad cultural, valores sociocomunitarios, espiritualidad y consciencia crítica, articulando la educación científica, humanística, técnica, tecnológica y artística a través de procesos productivos de acuerdo a las vocaciones y potencialidades de las regiones en el marco de la descolonización, interculturalidad y plurilingüismo, para que contribuyan a la conservación y protección de la Madre Tierra y la salud comunitaria, así como a la construcción de una sociedad democrática, inclusiva y libre de violencia.";
        const objetivoHTML = `<p class="objetivo-texto">${objFijo}</p>`;
        pdcData.generatedContent.objetivo = objetivoHTML;
        log('Objetivo Holístico procesado internamente', 'ok');

        // ── PASO 3: TABLA PRINCIPAL DEL PDC ─────────────
        actualizarProgreso(50, 'Generando PDC con IA (este proceso es extenso y puede demorar)...');
        log('Procesando tabla principal del PDC con IA...', 'writing');

        const tablaPDCResponse = await fetchWithRetry('/.netlify/functions/generate-pdc-tabla', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ formData })
        });
        const tablaPDCData = await tablaPDCResponse.json();
        pdcData.generatedContent.tabla = tablaPDCData.content || '';

        if (tablaPDCData.provider) {
            mostrarProveedor(tablaPDCData.provider);
        }

        // Debug: Log del contenido recibido
        console.log('Contenido tabla recibido y almacenado en memoria.');

        log('Tabla principal del PDC procesada internamente', 'ok');
        actualizarProgreso(80, 'Desarrollo del PDC completado.');

        // ── PASO 4: ADAPTACIONES CURRICULARES ────────────
        if (formData.tipoAdaptacion) {
            actualizarProgreso(85, 'Generando Adaptaciones Curriculares con IA...');
            log('Procesando Adaptaciones Curriculares con IA...', 'writing');

            const adaptResponse = await fetchWithRetry('/.netlify/functions/generate-pdc-adaptaciones', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ formData })
            });
            const adaptData = await adaptResponse.json();
            pdcData.generatedContent.adaptaciones = adaptData.content || '';
            log('Adaptaciones Curriculares procesadas internamente', 'ok');
        }

        log('¡PDC completo generado con éxito!', 'ok');
        actualizarProgreso(100, '¡Documento listo para descargar!');
        document.getElementById('action-buttons').style.display = 'flex';
        document.getElementById('action-buttons').scrollIntoView({ behavior: 'smooth', block: 'center' });

    } catch (error) {
        console.error('Error en generación:', error);
        log(`Error: ${error.message}. Por favor intenta de nuevo.`, 'error');
        actualizarProgreso(0, 'Error en la generación.');
    } finally {
        btnGenerar.disabled = false;
        btnGenerar.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg> Generar PDC con IA`;
    }
}

// ─────────────────────────────────────────────
// CONSTRUIR TABLA HTML DE DATOS REFERENCIALES
// ─────────────────────────────────────────────
function construirTablaDataReferencial(f) {
    return `
    <table class="tabla-datos">
        <thead>
            <tr>
                <th>Campo</th><th>Datos</th>
                <th>Campo</th><th>Datos</th>
            </tr>
        </thead>
        <tbody>
            <tr><td>Distrito Educativo</td><td>${f.distrito || '—'}</td><td>Unidad Educativa</td><td>${f.ue || '—'}</td></tr>
            <tr><td>Nivel</td><td>${f.nivel || '—'}</td><td>Año de Escolaridad / Paralelo</td><td>${f.escolaridad || '—'}</td></tr>
            <tr><td>Maestra/o</td><td>${f.maestro || '—'}</td><td></td><td></td></tr>
            <tr><td>Área</td><td>${f.area || '—'}</td><td></td><td></td></tr>
            <tr><td>Trimestre</td><td>${f.trimestre || '—'}</td><td></td><td></td></tr>
            <tr><td>Tiempo</td><td>${f.duracion || '—'}</td><td></td><td></td></tr>
        </tbody>
    </table>`;
}



// ─────────────────────────────────────────────
// DESCARGAR WORD
// ─────────────────────────────────────────────
async function descargarWord() {
    const btnWord = document.getElementById('btn-word');
    const textoOriginal = btnWord.innerHTML;
    btnWord.disabled = true;
    btnWord.textContent = 'Generando documento...';

    try {
        const response = await fetchWithRetry('/.netlify/functions/generate-pdc-word', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(pdcData)
        });

        if (!response.ok) throw new Error(`Error del servidor: ${response.status}`);

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `PDC-${(pdcData.formData.area || 'Plan').replace(/\s+/g, '_')}-${pdcData.formData.trimestre || 'Trimestre'}.docx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();

    } catch (error) {
        console.error('Error al generar Word:', error);
        alert('Hubo un error al crear el documento Word. Inténtalo de nuevo.');
    } finally {
        btnWord.disabled = false;
        btnWord.innerHTML = textoOriginal;
    }
}

// ─────────────────────────────────────────────
// NUEVO PDC (RESET)
// ─────────────────────────────────────────────
function nuevoPDC() {
    if (!confirm('¿Seguro que deseas iniciar un nuevo PDC? Se perderá el PDC actual si no lo descargaste.')) return;

    pdcData = { formData: {}, generatedContent: {} };

    document.getElementById('results-panel').style.display = 'none';
    document.getElementById('generation-log').innerHTML = '';
    document.getElementById('progress-container').style.display = 'none';
    document.getElementById('action-buttons').style.display = 'none';
    const badge = document.getElementById('api-provider-badge');
    if (badge) badge.style.display = 'none';

    // Reset form
    document.getElementById('pdcForm').reset();

    // Clear dynamic students
    const estContainer = document.getElementById('estudiantes-container');
    if (estContainer) {
        const rows = estContainer.querySelectorAll('.estudiante-row');
        for (let i = 1; i < rows.length; i++) estContainer.removeChild(rows[i]);
    }
    for (let i = 1; i <= 6; i++) {
        const el = document.getElementById(`cont_sem${i}`);
        if (el) { el.value = ''; el.style.height = 'auto'; }
        const card = document.getElementById(`week-card-${i}`);
        if (card) {
            card.style.display = i <= 4 ? 'block' : 'none';
        }
    }
    semanasVisibles = 4;
    const btn = document.getElementById('btn-agregar-semana');
    if (btn) btn.style.display = 'inline-block';


    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ─────────────────────────────────────────────
// PROTECCIONES BÁSICAS
// ─────────────────────────────────────────────
document.addEventListener('contextmenu', e => {
    if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') e.preventDefault();
});
document.addEventListener('keydown', e => {
    if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key.toUpperCase())) ||
        (e.ctrlKey && ['U', 'S', 'P'].includes(e.key.toUpperCase()))) {
        e.preventDefault();
    }
});
document.addEventListener('selectstart', e => {
    if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') e.preventDefault();
});
document.addEventListener('dragstart', e => {
    if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') e.preventDefault();
});
