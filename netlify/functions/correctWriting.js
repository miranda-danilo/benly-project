// Nuevo SDK recomendado por Google (2025)
const { GoogleGenAI } = require("@google/genai");

exports.handler = async (event) => {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "API Key missing" })
        };
    }

    // Cliente oficial actualizado
    const client = new GoogleGenAI({ apiKey });

    // Carga del modelo
    const model = client.getGenerativeModel({
        model: "gemini-2.5-flash",
        generationConfig: {
            responseMimeType: "application/json"
        }
    });

    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Método no permitido" };
    }

    try {
        const { sentence } = JSON.parse(event.body);

        // IMPORTANTE: siempre stringify cuando esperas JSON puro
        const prompt = JSON.stringify({
            instruction: "Actúa como un corrector de oraciones en inglés.",
            input_sentence: sentence,
            output_format: {
                status: "Correcta o Incorrecta",
                corrected_sentence: "string",
                explanation: "string"
            }
        });

        // Nuevo método del SDK
        const result = await model.generateContent([
            { text: prompt }
        ]);

        const text = result.response.text();

        // Parseamos porque pedimos JSON explícito
        const parsed = JSON.parse(text);

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
                details: error.message
            })
        };
    }
};
