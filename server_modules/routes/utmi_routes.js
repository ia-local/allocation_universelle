// server_modules/routes/utmi_routes.js
const express = require('express');
const router = express.Router();
const utmiService = require('../services/utmi_service');
const { logApiCall } = require('../utils/api_logger');

/**
 * @swagger
 * tags:
 * name: UTMi
 * description: API pour la gestion et le calcul des Universal Talent Monetization Index (UTMi)
 */

/**
 * @swagger
 * /api/utmi/calculate:
 * post:
 * summary: Calcule les UTMi générés pour une interaction
 * tags: [UTMi]
 * description: |
 * Calcule et enregistre les UTMi générés par une interaction spécifique de l'utilisateur avec l'IA.
 * Les UTMi sont basés sur des paramètres comme la complexité de la requête, la longueur de la réponse,
 * et la pertinence.
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * required:
 * - interactionType
 * - complexityScore
 * - responseLength
 * properties:
 * interactionType:
 * type: string
 * description: Le type d'interaction (ex: 'chat', 'cv_creation', 'text_generation').
 * example: "chat"
 * complexityScore:
 * type: number
 * format: float
 * description: Un score représentant la complexité ou la valeur ajoutée de l'interaction (0.1 à 10.0).
 * example: 7.5
 * responseLength:
 * type: integer
 * description: La longueur de la réponse de l'IA en caractères ou mots.
 * example: 500
 * userId:
 * type: string
 * description: L'ID de l'utilisateur qui a initié l'interaction (optionnel).
 * example: "user456"
 * responses:
 * 200:
 * description: UTMi calculés et enregistrés avec succès.
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
 * example: UTMi calculés et enregistrés.
 * calculatedUtmi:
 * type: number
 * format: float
 * description: Le montant d'UTMi calculé pour cette interaction.
 * example: 12.5
 * totalUserUtmi:
 * type: number
 * format: float
 * description: Le total cumulé d'UTMi pour l'utilisateur (si userId fourni).
 * example: 1250.75
 * 400:
 * description: Paramètres de requête manquants ou invalides.
 * 500:
 * description: Erreur interne du serveur lors du calcul des UTMi.
 */
router.post('/calculate', async (req, res) => {
    logApiCall('utmi_routes.js', 'POST /api/utmi/calculate', 'info', 'Received request to calculate UTMi.');
    const { interactionType, complexityScore, responseLength, userId } = req.body;

    if (!interactionType || typeof complexityScore !== 'number' || typeof responseLength !== 'number') {
        logApiCall('utmi_routes.js', 'POST /api/utmi/calculate', 'warn', 'Missing or invalid parameters for UTMi calculation.', 400);
        return res.status(400).json({ status: 'error', message: 'Paramètres manquants ou invalides (interactionType, complexityScore, responseLength sont requis).' });
    }

    try {
        const result = await utmiService.calculateAndRecordUtmi(interactionType, complexityScore, responseLength, userId);
        logApiCall('utmi_routes.js', 'POST /api/utmi/calculate', 'success', `UTMi calculated: ${result.calculatedUtmi}`, 200);
        res.status(200).json({
            status: 'success',
            message: 'UTMi calculés et enregistrés.',
            calculatedUtmi: result.calculatedUtmi,
            totalUserUtmi: result.totalUserUtmi // Peut être undefined si userId non fourni
        });
    } catch (error) {
        logApiCall('utmi_routes.js', 'POST /api/utmi/calculate', 'error', { message: error.message, stack: error.stack }, 500);
        res.status(500).json({ status: 'error', message: 'Erreur lors du calcul des UTMi.', error: error.message });
    }
});

/**
 * @swagger
 * /api/utmi/history:
 * get:
 * summary: Récupère l'historique des gains UTMi d'un utilisateur
 * tags: [UTMi]
 * description: |
 * Retourne la liste des transactions d'UTMi générés ou consommés par un utilisateur.
 * Utile pour l'audit et la visualisation de l'activité.
 * parameters:
 * - in: query
 * name: userId
 * required: true
 * schema:
 * type: string
 * description: L'ID de l'utilisateur dont on veut l'historique.
 * example: "user456"
 * - in: query
 * name: limit
 * schema:
 * type: integer
 * description: Nombre maximum d'entrées à retourner.
 * example: 10
 * - in: query
 * name: offset
 * schema:
 * type: integer
 * description: Nombre d'entrées à sauter (pour la pagination).
 * example: 0
 * responses:
 * 200:
 * description: Historique des UTMi récupéré avec succès.
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
 * example: Historique des UTMi récupéré.
 * data:
 * type: array
 * items:
 * type: object
 * properties:
 * id:
 * type: string
 * description: ID unique de l'entrée d'historique.
 * example: "utmi_tx_789"
 * userId:
 * type: string
 * description: L'ID de l'utilisateur concerné par l'entrée.
 * example: "user456"
 * amount:
 * type: number
 * format: float
 * description: Montant d'UTMi gagné ou perdu (positif pour gain, négatif pour consommation).
 * example: 12.5
 * transactionType: # CHANGEMENT ICI : Renommé de 'type' à 'transactionType'
 * type: string
 * description: Type de transaction (ex: 'gain', 'transfer', 'conversion').
 * example: "gain"
 * date:
 * type: string
 * format: date-time
 * description: Date et heure de la transaction.
 * example: "2024-07-02T10:00:00Z"
 * reason:
 * type: string
 * description: Détails de l'interaction ou de la raison du gain/de la perte.
 * example: "Calcul pour interaction chat"
 * 400:
 * description: userId manquant.
 * 404:
 * description: Historique non trouvé pour cet utilisateur.
 * 500:
 * description: Erreur interne du serveur.
 */
router.get('/history', async (req, res) => {
    logApiCall('utmi_routes.js', 'GET /api/utmi/history', 'info', `Received request for UTMi history for user: ${req.query.userId}`);
    const { userId, limit, offset } = req.query;

    if (!userId) {
        logApiCall('utmi_routes.js', 'GET /api/utmi/history', 'warn', 'userId is required for UTMi history.', 400);
        return res.status(400).json({ status: 'error', message: 'L\'ID utilisateur est requis pour récupérer l\'historique UTMi.' });
    }

    try {
        const history = await utmiService.getUtmiHistory(userId, parseInt(limit), parseInt(offset));
        if (history && history.length > 0) {
            logApiCall('utmi_routes.js', 'GET /api/utmi/history', 'success', `UTMi history retrieved for user ${userId}.`, 200);
            res.status(200).json({
                status: 'success',
                message: 'Historique des UTMi récupéré.',
                data: history
            });
        } else {
            logApiCall('utmi_routes.js', 'GET /api/utmi/history', 'info', `No UTMi history found for user ${userId}.`, 404);
            res.status(404).json({ status: 'error', message: 'Aucun historique UTMi trouvé pour cet utilisateur.' });
        }
    } catch (error) {
        logApiCall('utmi_routes.js', 'GET /api/utmi/history', 'error', { message: error.message, stack: error.stack }, 500);
        res.status(500).json({ status: 'error', message: 'Erreur lors de la récupération de l\'historique UTMi.', error: error.message });
    }
});

module.exports = router;