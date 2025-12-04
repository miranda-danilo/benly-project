// netlify/functions/correctWriting.js

const { GoogleGenAI } = require("@google/genai");

exports.handler = async (event, context) => {
    
    const apiKey = process.env.GEMINI_API_KEY; 

    console.log(apiKey)

    // *** VERIFICACIÓN CRÍTICA ***
    if (!apiKey) {
        // Este error DEBE aparecer si la clave está faltando
        console.error("ERROR CRÍTICO: Clave GEMINI_API_KEY no configurada.");
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Configuration Error: API Key Missing." }),
        };
    }
    
    // *** INICIALIZACIÓN: Usando el constructor por defecto y el apiKey como opción ***
    // (Tu código es correcto, pero lo repetimos para asegurar)
    const ai = new GoogleGenAI({ apiKey });
    
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Método no permitido" };
    }

    try {
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
                // ...
            }
        };

        // 5. Llamada segura a la API de Gemini
        // Si el error 500 ocurre aquí, es un problema de autenticación (401/403)
        const genaiResponse = await ai.models.generateContent(payload);
        const parsedResult = JSON.parse(genaiResponse.text);

        return {
            statusCode: 200,
            body: JSON.stringify(parsedResult),
        };

    } catch (error) {
        // Asegúrate de que el error 500 no sea causado por un error de autenticación 401/403
        console.error("Error en Netlify Function:", error.message);
        
        // Si el error es una falla de autenticación, devuelve un mensaje específico.
        const errorBody = error.message.includes('API key') || error.message.includes('403') ? 
                          "Error de autenticación: Verifica la validez y restricciones de la clave de Gemini." :
                          "Error interno del servidor al procesar la corrección.";

        return {
            statusCode: 500,
            body: JSON.stringify({ error: errorBody, originalError: error.message }),
        };
    }
};