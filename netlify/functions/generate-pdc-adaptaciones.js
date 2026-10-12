require('dotenv').config();
/* =================================================================
   FUNCIÓN NETLIFY: generate-pdc-adaptaciones.js
   Genera la sección de Adaptaciones Curriculares del PDC
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

    if (!formData.tipoAdaptacion?.trim()) {
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ content: 'No se requieren adaptaciones curriculares para el presente PDC.' })
        };
    }

    const esCurricular = formData.categoriaAdaptacion === 'curricular';

    const contenidosPorSemana = formData.semanas
        .map((s, index) => `Semana ${index + 1}: ${s}`)
        .join('\n');

    const promptCurricular = `Eres un experto en educación inclusiva boliviana. Genera la sección de ADAPTACIONES CURRICULARES para un PDC de ${formData.area}.

Condición/estudiante: ${formData.tipoAdaptacion}
Área: ${formData.area}
Semanas: ${formData.totalSemanas}

CONTENIDOS REGISTRADOS POR EL USUARIO PARA CADA SEMANA:
${contenidosPorSemana}

INSTRUCCIONES OBLIGATORIAS:
- Debes generar una lista de actividades de adaptaciones curriculares generales pertinentes para la condición indicada.
- OBLIGATORIO: Debes generar como MÁXIMO 9 actividades (menos de 10 actividades en total). ¡Está ESTRICTAMENTE PROHIBIDO crear 10 o más actividades!
- Cada actividad debe comenzar con un guion corto o viñeta.
- Usa saltos de línea '\\n' para separar cada actividad en formato texto plano.
- Asegúrate de enfocar las adaptaciones estrictamente en los CONTENIDOS REGISTRADOS POR EL USUARIO indicados arriba. ¡Prohibido inventar temas nuevos!

Si la condición está vacía o no es relevante, escribe solo: "No se requieren adaptaciones curriculares para el presente PDC."

Responde ÚNICAMENTE con la lista de actividades. Sin texto adicional ni formato Markdown.`;

    const promptSignificativa = `Eres un experto en educación inclusiva boliviana. Genera adaptaciones curriculares SIGNIFICATIVAS para un PDC de ${formData.area}.

Condiciones/estudiantes registrados: ${formData.tipoAdaptacion}
Área: ${formData.area}
Total de semanas: ${formData.totalSemanas}

CONTENIDOS REGISTRADOS POR EL USUARIO PARA CADA SEMANA:
${contenidosPorSemana}

INSTRUCCIONES OBLIGATORIAS:
Genera las adaptaciones curriculares significativas y los criterios de evaluación. 
Si el usuario registra dos o más condiciones, DEBES generar las adaptaciones de forma conjunta considerando TODAS las condiciones registradas para cada semana.

Debes responder ÚNICAMENTE con un objeto JSON válido, sin delimitadores de código (como \`\`\`json), asegurándote de escapar correctamente las comillas.

Estructura requerida del JSON:
{
    "adaptaciones_contenido_semana_1": "Actividades adaptadas para la semana 1 considerando Momentos del Proceso Formativo...",
    "adaptaciones_contenido_semana_2": "...",
    "adaptaciones_contenido_semana_3": "...",
    "adaptaciones_contenido_semana_4": "...",
    "adaptaciones_contenido_semana_5": "...",
    "ser_condicion": "Criterios de evaluación para el SER adaptados a estas condiciones...",
    "saber_condicion": "Criterios de evaluación para el SABER adaptados a estas condiciones...",
    "hacer_condicion": "Criterios de evaluación para el HACER adaptados a estas condiciones..."
}

REGLAS DE FORMATO Y CONTENIDO (MOMENTOS FORMATIVOS):
- Utiliza saltos de línea '\\n' para separar los elementos en formato de texto plano.
- Para cada semana, organiza las actividades adaptadas considerando los MOMENTOS DEL PROCESO FORMATIVO (PRÁCTICA, TEORÍA, VALORACIÓN Y PRODUCCIÓN).
- Las actividades no deben ser genéricas: deben estar adaptadas ESPECÍFICAMENTE a las necesidades de la/s condición(es) y estar relacionadas con los contenidos de la semana respectiva.
- Cada actividad o criterio debe comenzar con un guion corto o viñeta.
- RESTRICCIÓN DE SEMANAS: Genera información solo para las ${formData.totalSemanas} semanas registradas. Para semanas vacías, el valor en JSON debe ser "".
- Cuando existen varias condiciones, los criterios deberán considerar conjuntamente las necesidades educativas derivadas de dichas condiciones.
- OBLIGATORIO: Debes generar EXACTAMENTE 2 criterios de evaluación para cada dimensión (2 para SER, 2 para SABER y 2 para HACER), sin agregar criterios adicionales.
- Los criterios deben evaluar:
    SER: Actitudes, inclusión, dignidad, solidaridad, respeto y responsabilidad.
    SABER: Conocimientos adquiridos y reflexión crítica.
    HACER: Habilidades, destrezas, experimentación.

Responde ÚNICAMENTE con el objeto JSON válido. NO incluyas formato Markdown ni texto adicional fuera de las llaves del JSON.`;

    const prompt = esCurricular ? promptCurricular : promptSignificativa;

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
                            console.warn(`[generate-pdc-adaptaciones] Error temporal en ${currentProvider.name} (${response.status}). Reintento ${retryCount}/${maxRetries}...`);
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
                    console.log(`[generate-pdc-adaptaciones] Éxito con ${providerUsed}`);

                } catch (error) {
                    clearTimeout(timeoutId);
                    lastError = error;
                    
                    if (error.name === 'AbortError') {
                        console.warn(`[generate-pdc-adaptaciones] Timeout en ${currentProvider.name}.`);
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

                    console.warn(`[generate-pdc-adaptaciones] Falló clave ${currentProvider.name}, rotando a la siguiente... Error:`, error.message);
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
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({
                content: contentResponse.replace(/```(json|markdown)/gi, '').replace(/```/g, '').trim(),
                provider: providerUsed
            })
        };
    } catch (error) {
        console.error('[generate-pdc-adaptaciones] Error en generación con IA:', error);
        return {
            statusCode: 500,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: 'Error al contactar IA (Gemini y Groq fallaron)', details: error.message })
        };
    }
};
