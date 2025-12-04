// netlify/functions/correctWriting.js - VERSIÓN CORREGIDA

// Importa el SDK de Gemini
const { GoogleGenAI } = require("@google/genai");

// La función principal que maneja las solicitudes HTTP
exports.handler = async (event, context) => {
    
    // *** 1. OBTENER LA CLAVE DE FORMA SEGURA DENTRO DEL HANDLER ***
    const apiKey = process.env.GEMINI_API_KEY; 

    // *** 2. VERIFICACIÓN CRÍTICA ***
    if (!apiKey) {
        console.error("ERROR CRÍTICO: La clave GEMINI_API_KEY no está configurada en Netlify.");
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Configuration Error: API Key Missing. Check Netlify Environment Variables." }),
        };
    }
    
    // *** 3. INICIALIZACIÓN DENTRO DEL HANDLER ***
    // La inicialización del SDK DEBE hacerse aquí.
    const ai = new GoogleGenAI({ apiKey });
    
    // 4. Verificar el método (solo POST)
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Método no permitido" };
    }

    try {
        // ... (El resto de tu código de lógica de API sigue igual)
        const { sentence } = JSON.parse(event.body);

        if (!sentence) {
            return { statusCode: 400, body: "Falta la oración (sentence)." };
        }

        const prompt = `Actúa como un corrector de oraciones...`; // (tu prompt)

        const payload = {
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            config: {
                model: "gemini-2.5-flash", 
                responseMimeType: "application/json",
                responseSchema: {
                   // ... (tu schema)
                }
            }
        };

        // 5. Llamada segura a la API de Gemini
        const genaiResponse = await ai.models.generateContent(payload);
        const parsedResult = JSON.parse(genaiResponse.text);

        // 6. Devolver el JSON limpio al frontend
        return {
            statusCode: 200,
            body: JSON.stringify(parsedResult),
        };

    } catch (error) {
        console.error("Error en Netlify Function:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Error interno del servidor al procesar la corrección." }),
        };
    }
};