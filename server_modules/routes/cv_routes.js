// server_modules/routes/cv_routes.js
const express = require('express');
const router = express.Router();
const cvService = require('../services/cv_service');
const { logApiCall } = require('../utils/api_logger');

/**
 * @swagger
 * tags:
 * name: CV Management
 * description: API pour la gestion et l'analyse de CV
 */

/**
 * @swagger
 * /api/cv/parse-and-structure:
 * post:
 * summary: Analyse et structure un CV téléchargé
 * tags: [CV Management]
 * description: |
 * Ce endpoint accepte un fichier CV (PDF, DOCX, TXT) et utilise l'IA
 * pour en extraire les informations clés (expérience, éducation, compétences, etc.)
 * et les structurer au format JSON.
 * requestBody:
 * required: true
 * content:
 * multipart/form-data:
 * schema:
 * type: object
 * properties:
 * cvFile:
 * type: string
 * format: binary
 * description: Le fichier CV à télécharger.
 * responses:
 * 200:
 * description: Structure JSON du CV analysé avec succès.
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * status:
 * type: string
 * example: success
 * message:
 * type: string
 * example: CV analysé et structuré avec succès.
 * data:
 * type: object
 * description: La structure JSON complète du CV.
 * properties:
 * personalInfo:
 * type: object
 * properties:
 * name: { type: string, example: "John Doe" }
 * email: { type: string, example: "john.doe@example.com" }
 * phone: { type: string, example: "+33612345678" }
 * linkedin: { type: string, example: "linkedin.com/in/johndoe" }
 * github: { type: string, example: "github.com/johndoe" }
 * experience:
 * type: array
 * items:
 * type: object
 * properties:
 * title: { type: string, example: "Développeur Senior" }
 * company: { type: string, example: "Tech Solutions Inc." }
 * startDate: { type: string, format: date, example: "2020-01-01" }
 * endDate: { type: string, format: date, example: "2023-12-31" }
 * description: { type: string, example: "Développement de logiciels, gestion d'équipes." }
 * education:
 * type: array
 * items:
 * type: object
 * properties:
 * degree: { type: string, example: "Master en Informatique" }
 * institution: { type: string, example: "Université de Paris" }
 * startDate: { type: string, format: date, example: "2015-09-01" }
 * endDate: { type: string, format: date, example: "2019-06-30" }
 * skills:
 * type: array
 * items:
 * type: string
 * example: "JavaScript, Python, React, Node.js"
 * summary:
 * type: string
 * example: "Développeur passionné avec 5 ans d'expérience."
 * 400:
 * description: Requête invalide ou fichier manquant.
 * 500:
 * description: Erreur interne du serveur lors de l'analyse du CV.
 */
router.post('/parse-and-structure', async (req, res) => {
    logApiCall('cv_routes.js', 'POST /api/cv/parse-and-structure', 'info', 'Received request to parse CV.');
    if (!req.files || !req.files.cvFile) {
        logApiCall('cv_routes.js', 'POST /api/cv/parse-and-structure', 'warn', 'No CV file uploaded.', 400);
        return res.status(400).json({ status: 'error', message: 'No CV file uploaded.' });
    }

    try {
        const cvFile = req.files.cvFile;
        const structuredData = await cvService.parseAndStructureCV(cvFile);
        logApiCall('cv_routes.js', 'POST /api/cv/parse-and-structure', 'success', 'CV parsed and structured successfully.', 200);
        res.status(200).json({
            status: 'success',
            message: 'CV analysé et structuré avec succès.',
            data: structuredData
        });
    } catch (error) {
        logApiCall('cv_routes.js', 'POST /api/cv/parse-and-structure', 'error', { message: error.message, stack: error.stack }, 500);
        res.status(500).json({ status: 'error', message: 'Erreur lors de l\'analyse et de la structuration du CV.', error: error.message });
    }
});

/**
 * @swagger
 * /api/cv/render-html:
 * post:
 * summary: Génère un rendu HTML d'un CV structuré
 * tags: [CV Management]
 * description: |
 * Prend une structure JSON de CV et génère une représentation HTML stylisée.
 * Utile pour prévisualiser le CV avant l'export ou l'affichage.
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * cvData:
 * type: object
 * description: La structure JSON complète du CV à rendre.
 * example:
 * personalInfo: { name: "Jane Doe" }
 * experience: [{ title: "Designer" }]
 * example:
 * cvData:
 * personalInfo:
 * name: "Jane Doe"
 * email: "jane.doe@example.com"
 * experience:
 * - title: "UX Designer"
 * company: "Creative Studio"
 * startDate: "2021-03-01"
 * endDate: "2024-01-31"
 * description: "Conception d'interfaces utilisateur."
 * responses:
 * 200:
 * description: Rendu HTML du CV généré avec succès.
 * content:
 * text/html:
 * schema:
 * type: string
 * format: html
 * example: "<h1>Jane Doe</h1><p>Email: jane.doe@example.com</p>..."
 * 400:
 * description: Données CV manquantes ou invalides.
 * 500:
 * description: Erreur interne du serveur lors du rendu HTML.
 */
router.post('/render-html', async (req, res) => {
    logApiCall('cv_routes.js', 'POST /api/cv/render-html', 'info', 'Received request to render CV to HTML.');
    const { cvData } = req.body;
    if (!cvData) {
        logApiCall('cv_routes.js', 'POST /api/cv/render-html', 'warn', 'CV data is missing for HTML rendering.', 400);
        return res.status(400).json({ status: 'error', message: 'CV data is required for HTML rendering.' });
    }

    try {
        const htmlContent = await cvService.renderCvToHtml(cvData);
        logApiCall('cv_routes.js', 'POST /api/cv/render-html', 'success', 'CV rendered to HTML successfully.', 200);
        res.status(200).send(htmlContent);
    } catch (error) {
        logApiCall('cv_routes.js', 'POST /api/cv/render-html', 'error', { message: error.message, stack: error.stack }, 500);
        res.status(500).json({ status: 'error', message: 'Erreur lors du rendu HTML du CV.', error: error.message });
    }
});

/**
 * @swagger
 * /api/cv/last-structured-data:
 * get:
 * summary: Récupère la dernière structure JSON de CV analysée
 * tags: [CV Management]
 * description: |
 * Retourne la dernière structure JSON de CV qui a été analysée avec succès
 * et stockée par le système. Utile pour les opérations subséquentes
 * sans avoir à re-parser le CV.
 * responses:
 * 200:
 * description: Dernière structure JSON de CV récupérée avec succès.
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * status:
 * type: string
 * example: success
 * message:
 * type: string
 * example: Dernière structure de CV récupérée.
 * data:
 * type: object
 * description: La structure JSON complète du dernier CV analysé.
 * example:
 * personalInfo: { name: "Jane Doe" }
 * experience: [{ title: "Designer" }]
 * 404:
 * description: Aucune donnée de CV structurée trouvée.
 * 500:
 * description: Erreur interne du serveur.
 */
router.get('/last-structured-data', async (req, res) => {
    logApiCall('cv_routes.js', 'GET /api/cv/last-structured-data', 'info', 'Received request for last structured CV data.');
    try {
        const lastCvData = cvService.getLastStructuredCVData();
        if (lastCvData) {
            logApiCall('cv_routes.js', 'GET /api/cv/last-structured-data', 'success', 'Last structured CV data retrieved.', 200);
            res.status(200).json({
                status: 'success',
                message: 'Dernière structure de CV récupérée.',
                data: lastCvData
            });
        } else {
            logApiCall('cv_routes.js', 'GET /api/cv/last-structured-data', 'warn', 'No structured CV data found.', 404);
            res.status(404).json({ status: 'error', message: 'Aucune donnée de CV structurée trouvée.' });
        }
    } catch (error) {
        logApiCall('cv_routes.js', 'GET /api/cv/last-structured-data', 'error', { message: error.message, stack: error.stack }, 500);
        res.status(500).json({ status: 'error', message: 'Erreur interne du serveur lors de la récupération des données de CV.', error: error.message });
    }
});

/**
 * @swagger
 * /api/cv/calculate-value:
 * post:
 * summary: Calcule la valeur monétaire potentielle d'un CV
 * tags: [CV Management]
 * description: |
 * Analyse les compétences, l'expérience et le profil général d'un CV structuré
 * pour estimer sa valeur monétaire potentielle sur le marché du travail
 * (par exemple, un salaire annuel estimé).
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * required:
 * - cvData
 * properties:
 * cvData:
 * type: object
 * description: La structure JSON complète du CV à évaluer.
 * example:
 * personalInfo: { name: "John Doe" }
 * experience: [{ title: "Développeur Senior" }]
 * responses:
 * 200:
 * description: Estimation de la valeur du CV calculée avec succès.
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * status:
 * type: string
 * example: success
 * message:
 * type: string
 * example: Valeur du CV calculée.
 * estimatedValue:
 * type: number
 * format: float
 * description: L'estimation de la valeur monétaire (ex: salaire annuel potentiel).
 * example: 75000.00
 * currency:
 * type: string
 * description: La devise de l'estimation (ex: "EUR", "USD").
 * example: "EUR"
 * 400:
 * description: Données CV manquantes ou invalides.
 * 500:
 * description: Erreur interne du serveur lors du calcul de la valeur.
 */
router.post('/calculate-value', async (req, res) => {
    logApiCall('cv_routes.js', 'POST /api/cv/calculate-value', 'info', 'Received request to calculate CV value.');
    const { cvData } = req.body;
    if (!cvData) {
        logApiCall('cv_routes.js', 'POST /api/cv/calculate-value', 'warn', 'CV data is missing for value calculation.', 400);
        return res.status(400).json({ status: 'error', message: 'CV data is required for value calculation.' });
    }

    try {
        const valueEstimation = await cvService.calculateCvValue(cvData);
        logApiCall('cv_routes.js', 'POST /api/cv/calculate-value', 'success', 'CV value calculated successfully.', 200);
        res.status(200).json({
            status: 'success',
            message: 'Valeur du CV calculée.',
            estimatedValue: valueEstimation.estimatedValue,
            currency: valueEstimation.currency
        });
    } catch (error) {
        logApiCall('cv_routes.js', 'POST /api/cv/calculate-value', 'error', { message: error.message, stack: error.stack }, 500);
        res.status(500).json({ status: 'error', message: 'Erreur lors du calcul de la valeur du CV.', error: error.message });
    }
});

/**
 * @swagger
 * /api/conversations/{id}/cv-professional-summary:
 * get:
 * summary: Génère un résumé professionnel pour un CV à partir d'une conversation.
 * tags: [CV Management]
 * description: |
 * Utilise l'historique d'une conversation spécifique avec l'IA pour générer
 * un résumé professionnel pertinent pour un CV, en se basant sur les informations
 * discutées ou les objectifs exprimés dans la conversation.
 * parameters:
 * - in: path
 * name: id
 * required: true
 * schema:
 * type: string
 * description: L'ID de la conversation pour laquelle générer le résumé.
 * responses:
 * 200:
 * description: Résumé professionnel généré avec succès.
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * status:
 * type: string
 * example: success
 * message:
 * type: string
 * example: Résumé professionnel généré.
 * professionalSummary:
 * type: string
 * description: Le résumé professionnel généré par l'IA.
 * example: "Développeur full-stack expérimenté, spécialisé en applications web performantes..."
 * 400:
 * description: ID de conversation manquant ou invalide.
 * 404:
 * description: Conversation non trouvée.
 * 500:
 * description: Erreur interne du serveur lors de la génération du résumé.
 */
router.get('/conversations/:id/cv-professional-summary', async (req, res) => {
    logApiCall('cv_routes.js', 'GET /api/conversations/:id/cv-professional-summary', 'info', `Received request for professional summary for conversation ID: ${req.params.id}`);
    const { id } = req.params;
    if (!id) {
        logApiCall('cv_routes.js', 'GET /api/conversations/:id/cv-professional-summary', 'warn', 'Conversation ID is missing.', 400);
        return res.status(400).json({ status: 'error', message: 'Conversation ID is required.' });
    }

    try {
        const summary = await cvService.generateProfessionalSummaryFromConversation(id);
        if (summary) {
            logApiCall('cv_routes.js', 'GET /api/conversations/:id/cv-professional-summary', 'success', `Professional summary generated for conversation ${id}.`, 200);
            res.status(200).json({
                status: 'success',
                message: 'Résumé professionnel généré.',
                professionalSummary: summary
            });
        } else {
            logApiCall('cv_routes.js', 'GET /api/conversations/:id/cv-professional-summary', 'warn', `Conversation ${id} not found for summary generation.`, 404);
            res.status(404).json({ status: 'error', message: 'Conversation non trouvée ou incapable de générer un résumé.' });
        }
    } catch (error) {
        logApiCall('cv_routes.js', 'GET /api/conversations/:id/cv-professional-summary', 'error', { message: error.message, stack: error.stack }, 500);
        res.status(500).json({ status: 'error', message: 'Erreur lors de la génération du résumé professionnel.', error: error.message });
    }
});

module.exports = router;