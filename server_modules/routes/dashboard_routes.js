// server_modules/routes/dashboard_routes.js
const express = require('express');
const router = express.Router();
const dashboardService = require('../services/dashboard_service');
const { logApiCall } = require('../utils/api_logger');

/**
 * @swagger
 * tags:
 * name: Dashboard
 * description: API pour les statistiques et insights du tableau de bord
 */

/**
 * @swagger
 * /api/dashboard-insights:
 * get:
 * summary: Récupère les insights et statistiques pour le tableau de bord
 * tags: [Dashboard]
 * description: |
 * Ce endpoint fournit un ensemble complet de données analytiques
 * pour le tableau de bord, incluant les totaux des UTMi, les répartitions
 * par type et par modèle, les ratios coût/UTMi, les axes cognitifs,
 * les sujets les plus valorisés et les taux de change.
 * responses:
 * 200:
 * description: Insights du tableau de bord récupérés avec succès.
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
 * example: Données du tableau de bord récupérées.
 * data:
 * type: object
 * properties:
 * totalUtmi:
 * type: number
 * format: float
 * description: Le total cumulé des UTMi générés.
 * example: 1500.75
 * totalInteractionCount:
 * type: integer
 * description: Le nombre total d'interactions (messages).
 * example: 250
 * averageUtmiPerInteraction:
 * type: number
 * format: float
 * description: La moyenne des UTMi par interaction.
 * example: 6.003
 * utmiByType:
 * type: object
 * description: Répartition des UTMi par type d'activité (ex: chat, CV, génération de texte).
 * additionalProperties:
 * type: number
 * format: float
 * example:
 * chat: 800.5
 * cv_parsing: 300.25
 * text_generation: 400
 * utmiByModel:
 * type: object
 * description: Répartition des UTMi par modèle d'IA utilisé.
 * additionalProperties:
 * type: number
 * format: float
 * example:
 * groq-llama3-8b: 700
 * groq-mixtral-8x7b: 800.75
 * utmiPerCostRatioByModel:
 * type: object
 * description: Ratio UTMi générés par coût pour chaque modèle d'IA.
 * additionalProperties:
 * type: number
 * format: float
 * example:
 * groq-llama3-8b: 10.5
 * groq-mixtral-8x7b: 8.2
 * utmiByCognitiveAxis:
 * type: object
 * description: |
 * Répartition des UTMi par axe cognitif (ex: marketing, affiliation, économie fiscale).
 * Ceci est une estimation basée sur la catégorisation des requêtes.
 * additionalProperties:
 * type: number
 * format: float
 * example:
 * marketing: 600
 * affiliation: 450.75
 * fiscal_economic: 450
 * mostValuableTopics:
 * type: array
 * items:
 * type: object
 * properties:
 * topic:
 * type: string
 * description: Le sujet identifié.
 * example: "Optimisation Fiscale PME"
 * utmi:
 * type: number
 * format: float
 * description: Les UTMi générés pour ce sujet.
 * example: 120.5
 * description: Les sujets qui ont généré le plus d'UTMi.
 * example:
 * - topic: "Optimisation Fiscale PME"
 * utmi: 120.5
 * - topic: "Stratégies de Marketing Digital"
 * utmi: 95.2
 * mostCommonActivities:
 * type: array
 * items:
 * type: object
 * properties:
 * activity:
 * type: string
 * description: Le type d'activité fréquent.
 * example: "Analyse de données"
 * count:
 * type: integer
 * description: Le nombre d'occurrences.
 * example: 50
 * description: Les activités les plus fréquemment demandées.
 * example:
 * - activity: "Analyse de données"
 * count: 50
 * - activity: "Rédaction de contenu"
 * count: 45
 * exchangeRates:
 * type: object
 * description: Taux de change actuels de l'UTMi vers les devises clés (EUR, USD).
 * additionalProperties:
 * type: number
 * format: float
 * example:
 * UTMI_TO_EUR: 0.001
 * UTMI_TO_USD: 0.0011
 * 500:
 * description: Erreur interne du serveur lors de la récupération des insights.
 */
router.get('/dashboard-insights', async (req, res) => {
    logApiCall('dashboard_routes.js', 'GET /api/dashboard-insights', 'info', 'Received request for dashboard insights.');
    try {
        const insights = await dashboardService.getDashboardInsights();
        logApiCall('dashboard_routes.js', 'GET /api/dashboard-insights', 'success', 'Dashboard insights retrieved successfully.', 200);
        res.status(200).json({
            status: 'success',
            message: 'Données du tableau de bord récupérées.',
            data: insights
        });
    } catch (error) {
        logApiCall('dashboard_routes.js', 'GET /api/dashboard-insights', 'error', { message: error.message, stack: error.stack }, 500);
        res.status(500).json({ status: 'error', message: 'Erreur lors de la récupération des insights du tableau de bord.', error: error.message });
    }
});

module.exports = router;