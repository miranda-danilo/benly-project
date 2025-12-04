// =======================================================
// INICIALIZACIÓN (Fuera del handler para Cold Start)
// =======================================================
const { GoogleGenAI } = require("@google/genai"); 

const apiKey = process.env.GEMINI_API_KEY;

// Verifica la clave API al inicio del módulo
if (!apiKey) {
    throw new Error("GEMINI_API_KEY no está definida. La función no puede iniciarse.");
}

const client = new GoogleGenAI({ apiKey }); // Inicializa el cliente con la nueva clase

// Inicializa el modelo una sola vez, especificando la respuesta JSON
const model = client.getGenerativeModel({
    model: "gemini-2.5-flash",
    config: { // Nota: se usa 'config' o 'generationConfig'
        responseMimeType: "application/json",
        responseSchema: {
             type: "object",
             properties: {
                 status: { type: "string", description: "Correcta o Incorrecta" },
                 corrected_sentence: { type: "string", description: "Oración corregida en inglés" },
                 explanation: { type: "string", description: "Explicación de la corrección" }
             },
             required: ["status", "corrected_sentence", "explanation"]
        }
    }
});


// =======================================================
// HANDLER (El código que se ejecuta en cada llamada)
// =======================================================
exports.handler = async (event) => {

    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Método no permitido" };
    }

    try {
        const { sentence } = JSON.parse(event.body);

        if (!sentence) {
             return { statusCode: 400, body: JSON.stringify({ error: "Falta la 'sentence' en el cuerpo de la solicitud." }) };
        }
        
        // **Optimización del Prompt:** El modelo ya sabe que debe responder en JSON
        // gracias a la configuración inicial. Puedes simplificar el prompt.
        const prompt = `Actúa como un corrector de oraciones en inglés. Analiza la siguiente oración y genera el JSON de salida con el estado, la corrección y la explicación: ${sentence}`;

        // El formato de la llamada es **generateContent**
        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }]
        });
        
        // El resultado ya viene como un objeto que contiene el texto JSON
        const text = result.response.text; // Usamos .text directamente sin ()
        
        // Intentamos parsear el JSON
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