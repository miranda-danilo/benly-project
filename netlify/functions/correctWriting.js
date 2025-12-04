const { GoogleGenerativeAI } = require("@google/generative-ai");

exports.handler = async (event) => {
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Método no permitido" };
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return { statusCode: 500, body: JSON.stringify({ error: "API Key missing" }) };
    }

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

    const client = new GoogleGenerativeAI(apiKey);
    const model = client.getGenerativeModel({
        model: "gemini-2.0-flash-lite",
        generationConfig: { responseMimeType: "application/json" }
    });

    async function generateWithRetry(retries = 3, delay = 800) {
        try {
            const prompt = `
RESPOND ONLY WITH VALID JSON.

{
 "status":"Correcta"|"Incorrecta",
 "corrected_sentence":"string",
 "explanation":"string"
}

Correct the following English sentence and explain why if incorrect:
"${sentence}"
`;

            const result = await model.generateContent([{ text: prompt }]);
            const text = result.response.text();

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
