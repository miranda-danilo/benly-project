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
        /* const prompt = JSON.stringify({
            instruction: "Actua como un corrector de oraciones en inglés.",
            input_sentence: sentence,
            output_format: {
                status: "Correcta o Incorrecta",
                corrected_sentence: "string",
                explanation: "string"
            }
        }); */

        const prompt = `
RESPONDE ÚNICAMENTE con un JSON válido.
Sin texto adicional. Sin arrays. Sin repetir el input.

Formato OBLIGATORIO:
{
  "status": "Correcta" | "Incorrecta",
  "corrected_sentence": "string",
  "explanation": "string"
}

Actua como un corrector de oraciones en inglés. Corrige la siguiente oración y proporciona una explicación si es incorrecta. Además, si la oración o palabra usa un termino formal indica una sugerencia en inglés informal. Responde solamente en inglés. Oración:
"${sentence}"
`;


        // EL FORMATO CORRECTO DEL SDK NUEVO (2025)
        const result = await model.generateContent([
            { text: prompt }
        ]);


        const text = result.response.text();

        

        // Como le pedimos JSON puro, ahora sí podemos parsear
        const parsed = JSON.parse(text);

       // Si devuelve un array, extraemos el objeto real
let finalObj = parsed;

// Si vino como array
if (Array.isArray(parsed)) {
    const item = parsed[0];

    if (item.output_format) {
        finalObj = item.output_format;
    } else {
        finalObj = item;
    }
}

return {
    statusCode: 200,
    body: JSON.stringify(finalObj)
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