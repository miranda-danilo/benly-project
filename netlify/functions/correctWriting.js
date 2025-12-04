const { GoogleGenerativeAI } = require("@google/generative-ai");

exports.handler = async (event) => {

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "API Key missing" })
        };
    }

    const client = new GoogleGenerativeAI(apiKey);

    // 🔥 MODELO ACTUALIZADO — MÁS SOLICITUDES POR MINUTO
    const model = client.getGenerativeModel({
        model: "gemini-2.0-flash-lite",
        generationConfig: {
            responseMimeType: "application/json"
        }
    });

    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Método no permitido" };
    }

    try {

        const { sentence } = JSON.parse(event.body);

        // obligatorio: JSON.stringify dentro del prompt
        const prompt = JSON.stringify({
            instruction: "Actua como un corrector de oraciones en inglés.",
            input_sentence: sentence,
            output_format: {
                status: "Correcta o Incorrecta",
                corrected_sentence: "string",
                explanation: "string"
            }
        });

        // SDK NUEVO (2025)
        const result = await model.generateContent([
            { text: prompt }
        ]);

        const text = result.response.text();

        // como pedimos JSON puro, ahora sí se puede parsear
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
