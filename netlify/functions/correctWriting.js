// netlify/functions/correctWriting.js
const { GoogleGenerativeAI } = require("@google/generative-ai");

// ---- LIMITADOR DE CARGA POR SEGUNDO ----
let lastCall = 0;

exports.handler = async (event) => {
    // Solo permitir POST
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Método no permitido" };
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return { statusCode: 500, body: "API Key missing" };
    }

    // ---- ANTI-SPAM SERVERLESS ----
    const now = Date.now();
    const diff = now - lastCall;

    if (diff < 1000) {
        // aseguramos 1 request por segundo
        await new Promise(res => setTimeout(res, 1000 - diff));
    }
    lastCall = Date.now();

    // ---- Leer la oración ----
    let sentence;
    try {
        ({ sentence } = JSON.parse(event.body));
        if (!sentence || typeof sentence !== "string") {
            throw new Error("Invalid sentence");
        }
    } catch (e) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: "Invalid JSON body", details: e.message })
        };
    }

    // ---- Configurar Gemini ----
    const client = new GoogleGenerativeAI(apiKey);
    const model = client.getGenerativeModel({
        model: "gemini-2.0-flash", // ⬅ mucho más estable que flash-lite
        generationConfig: {
            responseMimeType: "application/json"
        },
        safetySettings: [
            // Seguridad mínima requerida por Google (sin causar errores)
            { category: "HARM_CATEGORY_HARASSMENT", threshold: 4 },
            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: 4 },
            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: 4 },
            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: 4 },
            { category: "HARM_CATEGORY_CIVIC_INTEGRITY", threshold: 4 }
        ]
    });

    // ---- Fun. de generación con 1 retry máximo ----
    async function generateWithRetry(retries = 1, delay = 800) {
        try {
            const prompt = `
RESPONDE ÚNICAMENTE con un JSON válido y sin texto extra.

Formato obligatorio:
{
  "status": "Correcta" | "Incorrecta",
  "corrected_sentence": "string",
  "explanation": "string"
}

Corrige la siguiente oración en inglés:
"${sentence.replace(/"/g, '\\"')}"
`;

            const result = await model.generateContent([{ text: prompt }]);
            const text = result.response.text().trim();

            // limpiar basura como ```json
            const clean = text.replace(/```json|```/g, "").trim();

            return JSON.parse(clean);

        } catch (err) {
            if (retries > 0) {
                await new Promise(res => setTimeout(res, delay));
                return generateWithRetry(retries - 1, delay * 2);
            }
            throw err;
        }
    }

    // ---- Ejecutar la generación ----
    try {
        const parsed = await generateWithRetry();

        return {
            statusCode: 200,
            body: JSON.stringify(parsed)
        };
    } catch (error) {
        console.error("ERROR EN FUNCTION:", error);

        return {
            statusCode: 500,
            body: JSON.stringify({
                error: "Internal Server Error",
                details: error.message,
                fallback: {
                    status: "Incorrecta",
                    corrected_sentence: sentence,
                    explanation: "An error occurred while processing the sentence."
                }
            })
        };
    }
};
