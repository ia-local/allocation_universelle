// server_modules/routes/home_routes.js
const express = require('express');
const router = express.Router();
const groqService = require('../services/groq_service'); // Assurez-vous d'importer le service Groq
const { logApiCall } = require('../utils/api_logger');

// Route pour générer du texte via l'IA
router.post('/generate', async (req, res) => {
    logApiCall('home_routes.js', 'POST /api/generate', 'info', 'Requête reçue pour la génération de texte.');
    const { prompt } = req.body; // Récupère le prompt envoyé par le frontend

    if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
        logApiCall('home_routes.js', 'POST /api/generate', 'warn', 'Prompt manquant, vide ou invalide dans la requête.', 400);
        return res.status(400).json({ status: 'error', message: 'Le prompt est requis et doit être une chaîne de caractères non vide.' });
    }

    try {
        // Préparer les messages au format attendu par Groq
        // Chaque message doit être un objet { role: "user" ou "assistant", content: "texte" }
        const messagesForGroq = [
            {
                role: "user",
                content: prompt, // Le contenu est le prompt de l'utilisateur
            },
        ];
        // Note: Si vous aviez un historique de conversation, vous l'ajouteriez ici aussi.

        // Appeler le service Groq avec le tableau de messages
        // Ceci correspond à la ligne 69 dans votre stack trace
        const generatedText = await groqService.getGroqChatCompletion(messagesForGroq);

        logApiCall('home_routes.js', 'POST /api/generate', 'success', 'Texte généré avec succès.', 200);
        res.status(200).json({ status: 'success', data: { generatedText } });
    } catch (error) {
        logApiCall('home_routes.js', 'POST /api/generate', 'error', `Erreur lors de la génération de la réponse IA: ${error.message}`, 500);
        res.status(500).json({ status: 'error', message: `Erreur lors de la génération de la réponse IA: ${error.message}` });
    }
});

// Route pour générer un CV (exemple)
router.post('/generate-cv', async (req, res) => {
    logApiCall('home_routes.js', 'POST /api/generate-cv', 'info', 'Requête reçue pour la génération de CV.');
    const { userData } = req.body; // Données de l'utilisateur pour le CV

    if (!userData || Object.keys(userData).length === 0) {
        logApiCall('home_routes.js', 'POST /api/generate-cv', 'warn', 'Données utilisateur manquantes ou vides pour le CV.', 400);
        return res.status(400).json({ status: 'error', message: 'Les données utilisateur sont requises pour générer un CV.' });
    }

    try {
        const cvPrompt = `Génère un CV professionnel basé sur les données suivantes : ${JSON.stringify(userData)}. Inclure les sections suivantes : Expérience, Éducation, Compétences.`;

        // Préparer les messages au format attendu par Groq
        const messagesForGroq = [
            {
                role: "user",
                content: cvPrompt,
            },
        ];

        // Appeler le service Groq avec le tableau de messages
        const generatedCvContent = await groqService.getGroqChatCompletion(messagesForGroq, 'llama3-8b-8192'); // ou un modèle plus grand si nécessaire

        logApiCall('home_routes.js', 'POST /api/generate-cv', 'success', 'CV généré avec succès.', 200);
        res.status(200).json({ status: 'success', data: { cvContent: generatedCvContent } });
    } catch (error) {
        logApiCall('home_routes.js', 'POST /api/generate-cv', 'error', `Erreur lors de la génération du CV: ${error.message}`, 500);
        res.status(500).json({ status: 'error', message: `Erreur lors de la génération du CV: ${error.message}` });
    }
});

module.exports = router;