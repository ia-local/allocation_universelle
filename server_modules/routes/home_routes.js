// server_modules/routes/home_routes.js
const express = require('express');
const router = express.Router();
const { logApiCall } = require('../utils/api_logger'); // Assure-toi que ce chemin est correct
const aiService = require('../services/ai_integration_service'); // Chemin vers ton service d'intégration IA

/**
 * @route POST /api/generate-ai-response
 * @description Gère les requêtes de génération de réponse IA depuis l'interface utilisateur.
 * @access Public (ou authentifié si tu ajoutes un middleware d'auth)
 */
router.post('/api/generate-ai-response', async (req, res) => {
    const { userPrompt } = req.body; // Récupère le prompt de l'utilisateur envoyé dans le corps de la requête

    // Log l'appel API
    logApiCall('home_routes.js', 'POST /api/generate-ai-response', 'info', { userPrompt });

    // 1. Vérification du prompt
    if (!userPrompt) {
        logApiCall('home_routes.js', 'POST /api/generate-ai-response', 'warn', { message: 'Prompt utilisateur manquant' }, 400);
        return res.status(400).json({ message: 'Le prompt utilisateur est requis.' });
    }

    try {
        // 2. Appel au service d'intégration IA
        // Assure-toi que ton service `ai_integration_service` a une méthode `generateResponse`
        // qui prend le prompt et renvoie une chaîne de caractères ou un objet avec la réponse.
        const aiResponse = await aiService.generateResponse(userPrompt);

        // 3. Envoi de la réponse au client
        // Assure-toi que la réponse est bien au format JSON attendu par le client.
        logApiCall('home_routes.js', 'POST /api/generate-ai-response', 'success', { aiResponse }, 200);
        return res.status(200).json({
            message: 'Réponse IA générée avec succès',
            aiResponse: aiResponse // Envoie la réponse de l'IA
        });

    } catch (error) {
        console.error('Erreur lors de la génération de la réponse IA:', error);
        logApiCall('home_routes.js', 'POST /api/generate-ai-response', 'error', { message: error.message, stack: error.stack }, 500);

        // En cas d'erreur interne, renvoie une réponse JSON d'erreur
        return res.status(500).json({
            message: 'Erreur interne du serveur lors de la génération de la réponse IA.',
            error: error.message // Pour le débogage, tu peux inclure le message d'erreur réel
        });
    }
});

module.exports = router;