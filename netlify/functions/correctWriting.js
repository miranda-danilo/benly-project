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
    const model = ai.getGenerativeModel({ model: "gemini-2.5-flash" });

    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Método no permitido" };
    }

    try {
        const { sentence } = JSON.parse(event.body);

        const prompt = `
            Actúa como un corrector...
            Texto del usuario: "${sentence}"
        `;

        const result = await model.generateContent(prompt);

        // Gemini devuelve un objeto -> debes obtener el texto así:
        const text = result.response.text();
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
