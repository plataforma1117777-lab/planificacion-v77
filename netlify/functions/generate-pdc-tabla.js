require('dotenv').config();
/* =================================================================
   FUNCIÓN NETLIFY: generate-pdc-tabla.js
   Genera la tabla principal del PDC (Objetivo + Contenidos +
   Momentos + Recursos + Criterios) usando Gemini
   ================================================================= */

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Método no permitido' }) };
    }

    let formData;
    try {
        ({ formData } = JSON.parse(event.body));
    } catch (e) {
        return { statusCode: 400, body: JSON.stringify({ error: 'JSON inválido' }) };
    }

    const geminiKeys = [
        process.env.GEMINI_API_KEY_1,
        process.env.GEMINI_API_KEY_2,
        process.env.GEMINI_API_KEY_3,
        process.env.GEMINI_API_KEY_4,
        process.env.GEMINI_API_KEY_5,
        process.env.GEMINI_API_KEY_6
    ].filter(Boolean);

    if (geminiKeys.length === 0) {
        return { statusCode: 500, body: JSON.stringify({ error: 'API Keys de Gemini no configuradas' }) };
    }

    // Construir contenidos por semana
    let contenidosTexto = '';
    for (let i = 0; i < formData.totalSemanas; i++) {
        const val = formData.semanas[i]?.trim() || 'Pendiente';
        contenidosTexto += `Semana ${i + 1}:\n${val}\n\n`;
    }



    const vPractica = 'Conversamos, Exploramos, Observamos, Participamos, Narramos, Interpretamos, Modelamos, Realizamos, Construimos, Elaboramos, Recolectamos';
    const vTeoria = 'Analizamos, Identificamos, Describimos, Clasificamos, Explicamos, Conceptualizamos, Sistematizamos, Comparamos, Investigamos, Comprendemos';
    const vProduccion = 'Exponemos, Dramatizamos, Representamos gráficamente, Interpretamos, Ejecutamos, Demostramos, Elaboramos, Aplicamos, Preparamos, Componemos, Socializamos';
    const objNivel = 'Conoce, Identifica, Describe, Explica, Interpreta, Comprende, Clasifica, Organiza, Relaciona, Analiza, Compara, Argumenta, Justifica, Infiere, Aplica, Utiliza, Representa, Demuestra, Redacta, Desarrolla';

    const prompt = `Eres un experto pedagogo boliviano. Genera el desarrollo de un PDC (Plan de Desarrollo Curricular) para Educación Secundaria 2026 siguiendo ESTRICTAMENTE estas instrucciones.

DATOS DEL DOCENTE:
- Área: ${formData.area}
- Grado/Paralelo: ${formData.escolaridad}
- Trimestre: ${formData.trimestre}
- Total de semanas: ${formData.totalSemanas}

CONTENIDOS POR SEMANA:
${contenidosTexto}

INSTRUCCIONES PARA GENERAR EL DESARROLLO DEL PDC:

Debes responder ÚNICAMENTE con un objeto JSON válido, sin delimitadores de código (como \`\`\`json), asegurándote de escapar correctamente las comillas. No agregues texto adicional fuera del JSON.

Estructura requerida del JSON:
{
    "objetivo_aprendizaje": "Texto del objetivo aquí...",
    "momentos_formativos_semana_1": "Texto con los momentos metodológicos (Práctica, Teoría, etc.) y a continuación el apartado 'Actividades relacionadas con el fortalecimiento de los aprendizajes fundamentales' para la semana 1...",
    "recursos_semana_1": "Texto con recursos para la semana 1...",
    "momentos_formativos_semana_2": "...",
    "recursos_semana_2": "...",
    "momentos_formativos_semana_3": "...",
    "recursos_semana_3": "...",
    "momentos_formativos_semana_4": "...",
    "recursos_semana_4": "...",
    "momentos_formativos_semana_5": "...",
    "recursos_semana_5": "...",
    "ser": "Texto de evaluación (SER)...",
    "saber": "Texto de evaluación (SABER)...",
    "hacer": "Texto de evaluación (HACER)..."
}

⚠️ FORMATO DE TEXTO: Utiliza saltos de línea '\\n' para separar los elementos (actividades, recursos, criterios) en formato texto plano en lugar de usar etiquetas HTML.
⚠️ Cada elemento dentro de las listas debe iniciar con un guion corto o viñeta.

⚠️ RESTRICCIÓN DE SEMANAS: Genera información considerando únicamente las ${formData.totalSemanas} semanas registradas. Para las semanas no registradas (ej. semana 3 y 4 si solo se enviaron 2), los valores en el JSON deben ser cadenas vacías "". NO inventes información.
⚠️ REQUISITO OBLIGATORIO: NO GENERAR IMÁGENES. Entrega solo texto técnico e informativo.
⚠️ ORGANIZACIÓN DE CONTENIDOS: Los TÍTULOS se identifican únicamente por estar escritos en MAYÚSCULAS y los subtítulos se presentan en formato oración (primera letra en mayúscula y el resto en minúsculas).

- OBJETIVOS DE APRENDIZAJE:
Redacta los objetivos de aprendizaje a partir de los contenidos registrados para el mes.
Sigue obligatoriamente la estructura: VERBO + CONTENIDO + CÓMO + PARA QUÉ. 
Cada objetivo debe iniciar exclusivamente con uno de los verbos permitidos: ${objNivel}.
Ejemplo: - Comprende la organización de la tabla periódica...

- MOMENTOS DEL PROCESO FORMATIVO (ACTIVIDADES SEMANALES SEGÚN LOS CUATRO MOMENTOS METODOLÓGICOS):
A partir de los contenidos para las ${formData.totalSemanas} semanas registradas, genera para cada semana en "momentos_formativos_semana_X" lo siguiente:

1. ACTIVIDADES METODOLÓGICAS ORIGINALES:
- Redactar 2 o 3 actividades por semana que inicien obligatoriamente con uno de estos verbos: ${vPractica}. Ejemplo: - Conversamos sobre las experiencias... (Práctica).
- Redactar 2 actividades por semana que inicien con estos verbos: ${vTeoria}. Ejemplo: - Analizamos de manera crítica... (Teoría).
- Redactar 2 actividades por semana que inicien con estos verbos: ${vProduccion}. Ejemplo: - Elaboramos un mapa... (Producción).
- Reflexión metacognitiva. Plantear preguntas: ¿Qué propiedad considero más importante...? (Valoración).
– El nombre del momento metodológico deberá colocarse al final de cada texto entre paréntesis.

2. APARTADO COMPLEMENTARIO DE FORTALECIMIENTO DE APRENDIZAJES FUNDAMENTALES (OBLIGATORIO EN CADA SEMANA):
Inmediatamente después de las actividades metodológicas de cada semana, añade un salto de línea e incluye el siguiente título EXACTO:
Actividades relacionadas con el fortalecimiento de los aprendizajes fundamentales:

🎯 PROPÓSITO PEDAGÓGICO CENTRAL (REDUCCIÓN DE BRECHAS Y PREVENCIÓN DEL REZAGO ESCOLAR):
Este apartado debe diseñarse con el propósito principal de REDUCIR LAS BRECHAS DE APRENDIZAJE, ATENDER Y PREVENIR EL REZAGO ESCOLAR (entendido como la diferencia entre los aprendizajes que posee el estudiante y los esperados para su año de escolaridad: ${formData.escolaridad}) y asegurar la continuidad de las trayectorias educativas.
- NO plantees ejercicios complementarios genéricos ni simples repeticiones del contenido desarrollado en clase.
- Orienta las actividades específicamente a REFORZAR LOS APRENDIZAJES FUNDAMENTALES QUE LOS ESTUDIANTES AÚN NO HAN CONSOLIDADO, recuperar conocimientos previos necesarios, superar dificultades frecuentes de aprendizaje y fortalecer las habilidades esenciales correspondientes al año de escolaridad.
- Cada actividad debe ser concreta, práctica, pertinente al nivel educativo (${formData.escolaridad}), adecuada a las necesidades reales de los estudiantes, integrada al contenido semanal del PDC y orientada a que alcancen progresivamente los aprendizajes esperados.

⚠️ REGLA ESTRICTA DE FORMATO: NO incluyas ni muestres las categorías o etiquetas de los momentos metodológicos (Práctica, Teoría, Valoración, Producción) dentro de este apartado. Cada actividad debe presentar ÚNICAMENTE el área de fortalecimiento correspondiente y su descripción.

ÁREAS DE APRENDIZAJES FUNDAMENTALES:
- Lectura: comprender, interpretar, evaluar y utilizar información de diversos tipos de textos.
- Escritura: producir textos y contenidos multimodales con coherencia, cohesión y revisión.
- Pensamiento lógico-matemático: resolver problemas, identificar relaciones, modelizar situaciones y argumentar razonamientos.
- Indagación científica: formular preguntas investigables, plantear hipótesis, analizar evidencias y comunicar conclusiones.
- Comunicación oral: expresar ideas de manera clara y respetuosa, fundamentar posiciones y responder a objeciones.

PAUTAS DE SELECCIÓN Y FORMATO OBLIGATORIO:
- Selecciona para cada semana entre 2 a 4 propuestas de fortalecimiento pertinentes, priorizando las áreas que guarden relación directa con los contenidos planificados y el área (${formData.area}).
- Estructura obligatoria de cada propuesta (iniciando con guion, nombre del área en formato exacto, dos puntos y actividad concreta de nivelación/refuerzo):
- [Área de Aprendizaje Fundamental]: [Estrategia o actividad concreta de nivelación adaptada al contenido].
  Ejemplos del formato requerido:
  - Pensamiento lógico-matemático: resolver ejercicios guiados paso a paso para identificar y corregir errores frecuentes en el cálculo de magnitudes.
  - Lectura: aplicar técnicas de subrayado y parafraseo de ideas centrales en textos breves del tema para superar dificultades de comprensión lectora.
  - Comunicación oral: participar en dinámicas de preguntas dirigidas en parejas para expresar dudas y fundamentar respuestas con apoyo mutuo.
  - Escritura: completar organizadores gráficos y redactar oraciones de síntesis estructuradas para consolidar la redacción clara de conclusiones.
- Las actividades deben ser específicas, prácticas, aplicables en el aula y responder a las necesidades de nivelación de los estudiantes.
- No repetir automáticamente las mismas propuestas en todas las semanas; genera estrategias variadas y coherentes con los contenidos de cada semana.

- RECURSOS:
Los recursos deben ser generados para cada semana.
Ejemplo: - Video Proyector.\\n- Textos de apoyo.

- CRITERIOS DE EVALUACIÓN (2 indicadores observables por dimensión):
Genera los criterios de evaluación separados en tres atributos clave: "ser", "saber" y "hacer".
Deben guardar relación directa y estrecha con los aprendizajes fundamentales trabajados en las actividades metodológicas y con los contenidos específicos del PDC.
Genera criterios observables, específicos y coherentes con el contenido, evitando formulaciones genéricas.

Criterios de referencia para articular los aprendizajes fundamentales:
- Lectura: interpreta información de textos, consignas, tablas o ejemplos relacionados con el contenido.
- Escritura: redacta procedimientos, explicaciones y conclusiones con claridad y precisión.
- Pensamiento lógico-matemático: resuelve problemas, establece relaciones y justifica procedimientos.
- Indagación científica: formula preguntas, analiza evidencias y comunica conclusiones, cuando corresponda.
- Comunicación oral: explica ideas, fundamenta respuestas y participa respetuosamente en intercambios académicos.

Articulación por dimensión (2 indicadores con guion por dimensión):
- SER: Valora actitudes, convivencia armónica, responsabilidad, honestidad académica y participación respetuosa durante los intercambios y el trabajo colaborativo (articulado especialmente con Comunicación oral y actitudes frente al aprendizaje).
- SABER: Evalúa la comprensión conceptual, análisis crítico, interpretación de información y razonamiento de los contenidos (articulado con Lectura, Pensamiento lógico-matemático e Indagación científica).
- HACER: Evalúa la aplicación práctica, resolución de situaciones problemáticas, ejecución de procedimientos, elaboración de textos, informes y producciones tangibles (articulado con Escritura, Pensamiento lógico-matemático e Indagación científica).

IMPORTANTE Y OBLIGATORIO:
- Responde ÚNICAMENTE con el objeto JSON válido. NO escribas NADA FUERA DEL JSON.`;

    try {
        let contentResponse = '';
        let providerUsed = 'Desconocido';
        let lastError = null;

        // Función de delay para reintentos
        const delay = (ms) => new Promise(res => setTimeout(res, ms));

        const providers = [];
        if (process.env.DEEPSEEK_API_KEY) {
            providers.push({ type: 'deepseek', key: process.env.DEEPSEEK_API_KEY, name: 'ds' });
        }
        geminiKeys.forEach((key, index) => {
            providers.push({ type: 'gemini', key: key, name: `gm${index + 1}` });
        });

        if (providers.length === 0) {
            throw new Error('No hay API Keys configuradas (ni DeepSeek ni Gemini).');
        }

        let success = false;
        const maxCycles = 3; // Límite de 3 ciclos completos para evitar loops infinitos
        let globalAttempt = 0;
        const maxGlobalAttempts = providers.length * maxCycles;
        let providerIndex = 0;

        while (!success && globalAttempt < maxGlobalAttempts) {
            const currentProvider = providers[providerIndex];
            let retryCount = 0;
            const maxRetries = 2; // Reintentos por proveedor si es error temporal
            let successWithKey = false;

            while (retryCount <= maxRetries && !successWithKey) {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s timeout por request

                try {
                    let response;
                    if (currentProvider.type === 'deepseek') {
                        response = await fetch('https://api.deepseek.com/chat/completions', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${currentProvider.key}`
                            },
                            body: JSON.stringify({
                                model: 'deepseek-chat',
                                messages: [{ role: 'user', content: prompt }],
                                temperature: 0.2
                            }),
                            signal: controller.signal
                        });
                    } else if (currentProvider.type === 'gemini') {
                        response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${currentProvider.key}`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                contents: [{ parts: [{ text: prompt }] }],
                                generationConfig: { temperature: 0.2, maxOutputTokens: 8192 }
                            }),
                            signal: controller.signal
                        });
                    }

                    clearTimeout(timeoutId);

                    if (!response.ok) {
                        const errorText = await response.text();
                        // Errores temporales o de demanda
                        if ([500, 502, 503, 504].includes(response.status) && retryCount < maxRetries) {
                            retryCount++;
                            console.warn(`[generate-pdc-tabla] Error temporal en ${currentProvider.name} (${response.status}). Reintento ${retryCount}/${maxRetries}...`);
                            await delay(2000);
                            continue;
                        }
                        throw new Error(`Error API ${currentProvider.type}: ${response.status} ${errorText}`);
                    }

                    const data = await response.json();
                    
                    if (currentProvider.type === 'deepseek') {
                        contentResponse = data?.choices?.[0]?.message?.content || '';
                    } else {
                        contentResponse = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
                    }

                    if (!contentResponse) throw new Error(`Respuesta vacía de ${currentProvider.type}`);

                    providerUsed = currentProvider.name;
                    success = true;
                    successWithKey = true;
                    console.log(`[generate-pdc-tabla] Éxito con ${providerUsed}`);

                } catch (error) {
                    clearTimeout(timeoutId);
                    lastError = error;
                    
                    if (error.name === 'AbortError') {
                        console.warn(`[generate-pdc-tabla] Timeout en ${currentProvider.name}.`);
                        if (retryCount < maxRetries) {
                            retryCount++;
                            await delay(1000);
                            continue;
                        }
                    } else if (error.message.includes('500') || error.message.includes('502') || error.message.includes('503') || error.message.includes('504')) {
                        if (retryCount < maxRetries) {
                            retryCount++;
                            await delay(2000);
                            continue;
                        }
                    }

                    console.warn(`[generate-pdc-tabla] Falló clave ${currentProvider.name}, rotando a la siguiente... Error:`, error.message);
                    break; // Salir del bucle de reintentos e intentar con el siguiente proveedor
                }
            }
            
            if (success) break;
            
            providerIndex = (providerIndex + 1) % providers.length; // Ciclar al siguiente
            globalAttempt++;
        }

        if (!success) {
            throw new Error(`Fallaron todas las API Keys después de varios ciclos. Último error: ${lastError?.message}`);
        }

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({
                content: contentResponse.replace(/```json/gi, '').replace(/```/g, '').trim(),
                provider: providerUsed
            })
        };
    } catch (error) {
        console.error('[generate-pdc-tabla] Error en generación con IA:', error);
        return {
            statusCode: 500,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: 'Error al contactar IA (Gemini y Groq fallaron)', details: error.message })
        };
    }
};
