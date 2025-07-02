// server_modules/services/groq_service.js
const Groq = require('groq-sdk');
const { logApiCall } = require('../utils/api_logger');
const dotenv = require('dotenv');

// Charger les variables d'environnement si ce n'est pas déjà fait au niveau global
dotenv.config();

// Vérifier si la clé API est définie
if (!process.env.GROQ_API_KEY) {
    console.warn("ATTENTION : La variable d'environnement GROQ_API_KEY n'est pas définie. L'intégration Groq ne fonctionnera pas.");
    // Vous pouvez choisir de jeter une erreur ici ou de simplement logguer un avertissement
    // throw new Error("GROQ_API_KEY is not defined in .env file.");
}

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

/**
 * Récupère une complétion de chat via l'API Groq.
 * @param {Array<Object>} messages Un tableau d'objets messages au format Groq (e.g., [{ role: "user", content: "..." }]).
 * @param {string} [model='llama3-8b-8192'] Le modèle Groq à utiliser.
 * @returns {Promise<string>} Le contenu textuel de la réponse de l'IA.
 * @throws {Error} Si l'appel à l'API Groq échoue.
 */
async function getGroqChatCompletion(messages, model = 'llama3-8b-8192') {
    // Vérifier si 'messages' est bien un tableau et n'est pas vide
    if (!Array.isArray(messages) || messages.length === 0) {
        logApiCall('groq_service.js', 'getGroqChatCompletion', 'error', "'messages' : value must be an array and not empty.", 400);
        throw new Error("Les messages fournis à l'API Groq doivent être un tableau non vide.");
    }

    logApiCall('groq_service.js', 'getGroqChatCompletion', 'info', `Appel à l'API Groq avec le modèle: ${model}.`);

    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: messages, // C'est ici que le format est crucial
            model: model,
            // Autres options peuvent être ajoutées ici (temperature, max_tokens, etc.)
        });

        const aiResponse = chatCompletion.choices[0]?.message?.content;

        if (!aiResponse) {
            logApiCall('groq_service.js', 'getGroqChatCompletion', 'error', 'Réponse IA vide ou invalide de Groq.', 500);
            throw new Error("Réponse vide ou invalide reçue de l'API Groq.");
        }

        logApiCall('groq_service.js', 'getGroqChatCompletion', 'success', 'Réponse de l\'IA Groq reçue.', 200);
        return aiResponse;
    } catch (error) {
        logApiCall('groq_service.js', 'getGroqChatCompletion', 'error', `Erreur lors de l'appel à l'API Groq: ${error.message}`, error.response ? error.response.status : 500);
        // Tenter d'extraire des détails d'erreur si disponibles
        let errorMessage = "Échec de la communication avec le modèle Groq";
        if (error.response && error.response.data && error.response.data.error && error.response.data.error.message) {
            errorMessage += `: ${error.response.data.error.message}`;
        } else if (error.message) {
            errorMessage += `: ${error.message}`;
        }
        throw new Error(errorMessage);
    }
}

module.exports = {
    getGroqChatCompletion
};