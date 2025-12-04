const { GoogleGenerativeAI } = require("@google/generative-ai");

exports.handler = async (event) => {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "API Key missing" })
        };
    }

    const ai = new GoogleGenerativeAI(apiKey);
    const model = ai.getGenerativeModel({
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

        const promptJSON = {
            instruction: "Corrige la oración y responde SOLO en JSON.",
            input_sentence: sentence,
            format: {
                status: "Correcta o Incorrecta",
                corrected_sentence: "string",
                explanation: "string"
            }
        };

        const result = await model.generateContent([
            {
                role: "user",
                parts: [
                    { text: JSON.stringify(promptJSON) }
                ]
            }
        ]);

        const text = result.response.text();

        // AHORA SÍ: Gemini RETORNA JSON PURO
        const parsed = JSON.parse(text);

        return {
            statusCode: 200,
            body: JSON.stringify(parsed)
        };

    } catch (err) {
        console.error("ERROR EN FUNCTION:", err);

        return {
            statusCode: 500,
            body: JSON.stringify({
                error: "Error interno",
                details: err.message
            })
        };
    }
};
