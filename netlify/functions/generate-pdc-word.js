require('dotenv').config();
const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');

/* =================================================================
   FUNCIÓN NETLIFY: generate-pdc-word.js
   Genera el documento Word (.docx) usando plantilla (docxtemplater)
   ================================================================= */

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Método no permitido' }) };
    }

    let pdcData;
    try {
        pdcData = JSON.parse(event.body);
    } catch (e) {
        return { statusCode: 400, body: JSON.stringify({ error: 'JSON inválido' }) };
    }

    const f = pdcData.formData || {};
    const gc = pdcData.generatedContent || {};

    try {
        let isSignificativa = f.categoriaAdaptacion === 'significativa';
        let docName = 'secundaria_1.docx';
        if (f.totalSemanas === 5) {
            docName = isSignificativa ? 'secundaria_5.docx' : 'secundaria_3.docx';
        } else if (isSignificativa) {
            docName = 'secundaria_2.docx';
        }
        
        let docPath = path.resolve(process.cwd(), docName);
        if (!fs.existsSync(docPath)) {
            docPath = path.join(__dirname, docName);
        }
        if (!fs.existsSync(docPath)) {
            docPath = path.join(__dirname, '../../' + docName);
        }
        if (!fs.existsSync(docPath)) {
            throw new Error(`No se encontró la plantilla ${docName} en el servidor.`);
        }

        const templateContent = fs.readFileSync(docPath, 'binary');
        const zip = new PizZip(templateContent);

        // La funcíon generate-pdc-tabla.js ahora retorna contenido JSON
        let tablaContent = {};
        if (gc.tabla) {
            try {
                // If it is string, parse it.
                tablaContent = typeof gc.tabla === 'string' ? JSON.parse(gc.tabla) : gc.tabla;
            } catch (e) {
                console.error("Error al parsear el JSON de la IA:", e);
                throw new Error("El contenido generado por IA no tiene el formato JSON esperado. " + gc.tabla);
            }
        }

        let adaptacionesStr = gc.adaptaciones || '';
        let adaptacionesData = {};

        if (isSignificativa) {
            try {
                // Ensure adaptacionesStr is processed properly even if there is markdown or text outside
                if (typeof adaptacionesStr === 'string' && adaptacionesStr) {
                    const jsonMatch = adaptacionesStr.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        adaptacionesData = JSON.parse(jsonMatch[0]);
                    } else {
                        adaptacionesData = JSON.parse(adaptacionesStr);
                    }
                } else {
                    adaptacionesData = adaptacionesStr || {};
                }
            } catch (e) {
                console.error("Error al parsear el JSON de la IA para adaptaciones:", e);
                adaptacionesData = {};
            }
        }

        // Remover asteriscos markdown que pudiera haber dejado la IA
        const cleanStr = (str) => {
            if (!str) return '';
            return str.replace(/\*\*/g, '').trim();
        };

        const doc = new Docxtemplater(zip, {
            paragraphLoop: true,
            linebreaks: true,
            delimiters: { start: '{{', end: '}}' }
        });

        const replaceData = {
            numero_pdc: (f.numeroPDC || '01').toUpperCase(),
            distrito_educativo: (f.distrito || '').toUpperCase(),
            unidad_educativa: (f.ue || '').toUpperCase(),
            año_de_escolaridad: (f.escolaridad || '').toUpperCase(),
            maestro: (f.maestro || '').toUpperCase(),
            area: (f.area || '').toUpperCase(),
            trimestre: (f.trimestre || '').toUpperCase(),
            duracion: (f.duracion || '').toUpperCase(),

            objetivo_aprendizaje: cleanStr(tablaContent.objetivo_aprendizaje),
            ser: cleanStr(tablaContent.ser),
            saber: cleanStr(tablaContent.saber),
            hacer: cleanStr(tablaContent.hacer),

            contenido_semana_1: cleanStr(f.semanas?.[0]),
            contenido_semana_2: cleanStr(f.semanas?.[1]),
            contenido_semana_3: cleanStr(f.semanas?.[2]),
            contenido_semana_4: cleanStr(f.semanas?.[3]),
            contenido_semana_5: cleanStr(f.semanas?.[4]),

            momentos_formativos_semana_1: cleanStr(tablaContent.momentos_formativos_semana_1),
            momentos_formativos_semana_2: cleanStr(tablaContent.momentos_formativos_semana_2),
            momentos_formativos_semana_3: cleanStr(tablaContent.momentos_formativos_semana_3),
            momentos_formativos_semana_4: cleanStr(tablaContent.momentos_formativos_semana_4),
            momentos_formativos_semana_5: cleanStr(tablaContent.momentos_formativos_semana_5),

            recursos_semana_1: cleanStr(tablaContent.recursos_semana_1),
            recursos_semana_2: cleanStr(tablaContent.recursos_semana_2),
            recursos_semana_3: cleanStr(tablaContent.recursos_semana_3),
            recursos_semana_4: cleanStr(tablaContent.recursos_semana_4),
            recursos_semana_5: cleanStr(tablaContent.recursos_semana_5),

            condicion: cleanStr(f.tipoAdaptacion),

            // Marcadores para secundaria_1.docx
            adaptaciones: isSignificativa ? '' : cleanStr(typeof adaptacionesStr === 'string' ? adaptacionesStr : ''),

            // Marcadores para secundaria_2.docx
            ser_condicion: cleanStr(adaptacionesData.ser_condicion),
            saber_condicion: cleanStr(adaptacionesData.saber_condicion),
            hacer_condicion: cleanStr(adaptacionesData.hacer_condicion),

            adaptaciones_contenido_semana_1: cleanStr(adaptacionesData.adaptaciones_contenido_semana_1),
            adaptaciones_contenido_semana_2: cleanStr(adaptacionesData.adaptaciones_contenido_semana_2),
            adaptaciones_contenido_semana_3: cleanStr(adaptacionesData.adaptaciones_contenido_semana_3),
            adaptaciones_contenido_semana_4: cleanStr(adaptacionesData.adaptaciones_contenido_semana_4),
            adaptaciones_contenido_semana_5: cleanStr(adaptacionesData.adaptaciones_contenido_semana_5)
        };

        doc.render(replaceData);

        // Aplicar formato azul (#002060) al apartado complementario de fortalecimiento
        const triggerPattern = /Actividades relacionadas con el fortalecimiento de los aprendizajes fundamentales/i;
        let xml = doc.getZip().file('word/document.xml').asText();
        if (triggerPattern.test(xml)) {
            xml = xml.replace(/(<w:tc[\s\S]*?<\/w:tc>)/g, (cellXml) => {
                const match = cellXml.match(triggerPattern);
                if (!match) return cellXml;

                const triggerIdx = match.index;
                const beforeTrigger = cellXml.substring(0, triggerIdx);
                const r1 = beforeTrigger.lastIndexOf('<w:r>');
                const r2 = beforeTrigger.lastIndexOf('<w:r ');
                const runStartIdx = Math.max(r1, r2);
                if (runStartIdx === -1) return cellXml;

                const before = cellXml.substring(0, runStartIdx);
                let after = cellXml.substring(runStartIdx);

                let isTitle = true;
                after = after.replace(/<w:r\b([\s\S]*?)<\/w:r>/g, (runXml) => {
                    if (runXml.includes('<w:br/>') && !runXml.includes('<w:t')) {
                        return runXml;
                    }

                    const currentIsTitle = isTitle;
                    isTitle = false;

                    const colorAttr = '<w:color w:val="002060"/>';
                    const boldAttr = currentIsTitle ? '<w:b/><w:bCs/>' : '';

                    if (runXml.includes('<w:rPr>')) {
                        return runXml.replace(/<w:rPr>([\s\S]*?)<\/w:rPr>/, (m, innerPr) => {
                            let cleaned = innerPr.replace(/<w:color\b[^>]*\/>/g, '');
                            if (currentIsTitle) {
                                cleaned = cleaned.replace(/<w:b\b[^>]*\/>/g, '').replace(/<w:bCs\b[^>]*\/>/g, '');
                            }
                            return `<w:rPr>${boldAttr}${colorAttr}${cleaned}</w:rPr>`;
                        });
                    } else {
                        return runXml.replace(/<w:r(\b[^>]*)>/, `<w:r$1><w:rPr>${boldAttr}${colorAttr}</w:rPr>`);
                    }
                });

                return before + after;
            });
            doc.getZip().file('word/document.xml', xml);
        }

        const buf = doc.getZip().generate({
            type: 'nodebuffer',
            compression: 'DEFLATE',
        });

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'Content-Disposition': `attachment; filename="PDC-${(f.area || 'Plan').replace(/\s+/g, '_')}-${(f.trimestre || 'T1').replace(/\s+/g, '_')}.docx"`,
                'Access-Control-Allow-Origin': '*',
            },
            body: buf.toString('base64'),
            isBase64Encoded: true,
        };

    } catch (error) {
        console.error('[generate-pdc-word] Error:', error);
        return {
            statusCode: 500,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: 'No se pudo generar el documento Word.', details: error.message })
        };
    }
};
