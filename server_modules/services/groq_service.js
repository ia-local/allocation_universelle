// server_modules/services/ai_integration_service.js
const groqService = require('./groq_service'); // Importe ton service Groq dédié

/**
 * @function generateResponse
 * @description Génère une réponse textuelle pour un prompt utilisateur en utilisant un modèle IA.
 * @param {string} userPrompt - Le prompt textuel de l'utilisateur.
 * @returns {Promise<string>} La réponse textuelle générée par l'IA.
 */
async function generateResponse(userPrompt) {
    try {
        // Préparer les messages au format attendu par l'API Groq
        const messages = [
            {
                role: 'system',
                content: 'Tu es un assistant utile spécialisé dans l\'Allocation Universelle du Capital et la monétisation des talents. Réponds de manière concise et pertinente.'
            },
            {
                role: 'user',
                content: userPrompt
            }
        ];

        // Appeler le service Groq pour obtenir la complétion
        const aiResponse = await groqService.generateGroqCompletion(messages);

        return aiResponse;
    } catch (error) {
        console.error('Erreur dans le service d\'intégration IA:', error);
        throw new Error(`Impossible de générer la réponse IA: ${error.message}`);
    }
}

module.exports = {
    generateResponse,
};