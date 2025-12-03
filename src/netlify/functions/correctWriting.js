// netlify/functions/correctWriting.js

// Importa el SDK de Gemini
const { GoogleGenAI } = require("@google/genai");

// *** OBTENER LA CLAVE DE FORMA SEGURA ***
// process.env accede a las variables de entorno configuradas en Netlify
const apiKey = process.env.GEMINI_API_KEY; 

if (!apiKey) {
    console.error("GEMINI_API_KEY no está configurada.");
}

const ai = new GoogleGenAI({ apiKey });

// La función principal que maneja las solicitudes HTTP
exports.handler = async (event, context) => {
    // 1. Verificar el método (solo POST)
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Método no permitido" };
    }

    try {
        // 2. Parsear la oración enviada desde el frontend
        const { sentence } = JSON.parse(event.body);

        if (!sentence) {
            return { statusCode: 400, body: "Falta la oración (sentence)." };
        }

        const prompt = `Actúa como un corrector de oraciones en inglés. Analiza la siguiente oración y determina si es gramaticalmente correcta. Si es correcta, devuelve un JSON con el estado "Correcta". Si es incorrecta, devuelve un JSON con el estado "Incorrecta", la versión corregida de la oración y una explicación clara y concisa de los errores en español.
            Oración: "${sentence}"
            Ejemplo de JSON correcto:
            { "status": "Correcta" }
            Ejemplo de JSON incorrecto:
            { "status": "Incorrecta", "corrected_sentence": "The man goes to the store.", "explanation": "..." }`;

        const payload = {
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            config: {
                model: "gemini-2.5-flash", 
                responseMimeType: "application/json",
                responseSchema: {
                    type: "OBJECT",
                    properties: {
                        status: { type: "STRING" },
                        corrected_sentence: { type: "STRING" },
                        explanation: { type: "STRING" }
                    },
                    required: ["status"]
                }
            }
        };

        // 3. Llamada segura a la API de Gemini
        const genaiResponse = await ai.models.generateContent(payload);
        const parsedResult = JSON.parse(genaiResponse.text);

        // 4. Devolver el JSON limpio al frontend
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