// server_modules/routes/wallet_routes.js
const express = require('express');
const router = express.Router();
const walletService = require('../services/wallet_service');
const { logApiCall } = require('../utils/api_logger');

/**
 * @swagger
 * tags:
 * name: Wallet
 * description: API pour la gestion du portefeuille utilisateur et des transactions UTMi.
 */

/**
 * @swagger
 * /api/wallet/balance:
 * get:
 * summary: Récupère le solde du portefeuille UTMi de l'utilisateur
 * tags: [Wallet]
 * description: |
 * Ce endpoint retourne le solde total des UTMi (Universal Talent Monetization Index)
 * détenus dans le portefeuille de l'utilisateur, ainsi que le solde disponible
 * et les UTMi en attente.
 * parameters:
 * - in: query
 * name: userId
 * required: true
 * schema:
 * type: string
 * description: L'ID de l'utilisateur dont on veut le solde.
 * example: "user123"
 * responses:
 * 200:
 * description: Solde du portefeuille récupéré avec succès.
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
 * example: Solde du portefeuille récupéré.
 * totalBalance:
 * type: number
 * format: float
 * description: Le solde total d'UTMi de l'utilisateur.
 * example: 1500.00
 * availableBalance:
 * type: number
 * format: float
 * description: Le solde d'UTMi disponible pour les transactions.
 * example: 1200.00
 * pendingBalance:
 * type: number
 * format: float
 * description: Le solde d'UTMi en attente de validation ou de réclamation.
 * example: 300.00
 * 400:
 * description: userId manquant.
 * 404:
 * description: Portefeuille non trouvé pour cet utilisateur.
 * 500:
 * description: Erreur interne du serveur lors de la récupération du solde.
 */
router.get('/balance', async (req, res) => {
    logApiCall('wallet_routes.js', 'GET /api/wallet/balance', 'info', `Received request for wallet balance for user: ${req.query.userId}`);
    const { userId } = req.query;

    if (!userId) {
        logApiCall('wallet_routes.js', 'GET /api/wallet/balance', 'warn', 'userId is required for balance.', 400);
        return res.status(400).json({ status: 'error', message: 'L\'ID utilisateur est requis pour récupérer le solde.' });
    }

    try {
        const balance = await walletService.getWalletBalance(userId);
        if (balance) {
            logApiCall('wallet_routes.js', 'GET /api/wallet/balance', 'success', `Wallet balance retrieved for user ${userId}.`, 200);
            res.status(200).json({
                status: 'success',
                message: 'Solde du portefeuille récupéré.',
                totalBalance: balance.total,
                availableBalance: balance.available,
                pendingBalance: balance.pending
            });
        } else {
            logApiCall('wallet_routes.js', 'GET /api/wallet/balance', 'info', `No wallet found for user ${userId}.`, 404);
            res.status(404).json({ status: 'error', message: 'Portefeuille non trouvé pour cet utilisateur.' });
        }
    } catch (error) {
        logApiCall('wallet_routes.js', 'GET /api/wallet/balance', 'error', { message: error.message, stack: error.stack }, 500);
        res.status(500).json({ status: 'error', message: 'Erreur lors de la récupération du solde.', error: error.message });
    }
});

/**
 * @swagger
 * /api/wallet/claim-utmi:
 * post:
 * summary: Permet à l'utilisateur de réclamer des UTMi en attente
 * tags: [Wallet]
 * description: |
 * Permet à l'utilisateur de réclamer des UTMi qui ont été générés
 * et sont en attente (par exemple, après une période de validation).
 * Ces UTMi sont déplacés du solde "en attente" vers le solde "disponible".
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * required:
 * - userId
 * - amount
 * properties:
 * userId:
 * type: string
 * description: L'ID de l'utilisateur qui réclame les UTMi.
 * example: "user123"
 * amount:
 * type: number
 * format: float
 * description: Le montant d'UTMi à réclamer.
 * example: 50.00
 * responses:
 * 200:
 * description: UTMi réclamés et transférés vers le solde disponible.
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
 * example: UTMi réclamés avec succès.
 * newAvailableBalance:
 * type: number
 * format: float
 * description: Le nouveau solde disponible de l'utilisateur.
 * example: 1250.00
 * newPendingBalance:
 * type: number
 * format: float
 * description: Le nouveau solde en attente de l'utilisateur.
 * example: 250.00
 * 400:
 * description: Requête invalide (ex: montant manquant ou invalide, solde en attente insuffisant).
 * 500:
 * description: Erreur interne du serveur lors de la réclamation des UTMi.
 */
router.post('/claim-utmi', async (req, res) => {
    logApiCall('wallet_routes.js', 'POST /api/wallet/claim-utmi', 'info', 'Received request to claim UTMi.');
    const { userId, amount } = req.body;

    if (!userId || typeof amount !== 'number' || amount <= 0) {
        logApiCall('wallet_routes.js', 'POST /api/wallet/claim-utmi', 'warn', 'Invalid parameters for claiming UTMi.', 400);
        return res.status(400).json({ status: 'error', message: 'ID utilisateur et montant positif sont requis.' });
    }

    try {
        const result = await walletService.claimUtmi(userId, amount);
        logApiCall('wallet_routes.js', 'POST /api/wallet/claim-utmi', 'success', `User ${userId} claimed ${amount} UTMi.`, 200);
        res.status(200).json({
            status: 'success',
            message: 'UTMi réclamés avec succès.',
            newAvailableBalance: result.newAvailable,
            newPendingBalance: result.newPending
        });
    } catch (error) {
        logApiCall('wallet_routes.js', 'POST /api/wallet/claim-utmi', 'error', { message: error.message, stack: error.stack }, 500);
        res.status(500).json({ status: 'error', message: 'Erreur lors de la réclamation des UTMi.', error: error.message });
    }
});

/**
 * @swagger
 * /api/wallet/transfer:
 * post:
 * summary: Transfère des UTMi à un autre utilisateur
 * tags: [Wallet]
 * description: |
 * Permet de transférer un certain montant d'UTMi du portefeuille
 * de l'utilisateur vers le portefeuille d'un autre utilisateur spécifié.
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * required:
 * - senderId
 * - recipientId
 * - amount
 * properties:
 * senderId:
 * type: string
 * description: L'ID de l'utilisateur qui envoie les UTMi.
 * example: "user123"
 * recipientId:
 * type: string
 * description: L'ID de l'utilisateur qui reçoit les UTMi.
 * example: "user456"
 * amount:
 * type: number
 * format: float
 * description: Le montant d'UTMi à transférer.
 * example: 25.00
 * responses:
 * 200:
 * description: Transfert d'UTMi réussi.
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
 * example: Transfert d'UTMi réussi.
 * senderNewBalance:
 * type: number
 * format: float
 * description: Le nouveau solde du portefeuille de l'expéditeur.
 * example: 1175.00
 * recipientNewBalance:
 * type: number
 * format: float
 * description: Le nouveau solde du portefeuille du destinataire.
 * example: 1275.00
 * 400:
 * description: Requête invalide (ex: solde insuffisant, destinataire invalide, montant négatif).
 * 500:
 * description: Erreur interne du serveur lors du transfert des UTMi.
 */
router.post('/transfer', async (req, res) => {
    logApiCall('wallet_routes.js', 'POST /api/wallet/transfer', 'info', 'Received request to transfer UTMi.');
    const { senderId, recipientId, amount } = req.body;

    if (!senderId || !recipientId || typeof amount !== 'number' || amount <= 0) {
        logApiCall('wallet_routes.js', 'POST /api/wallet/transfer', 'warn', 'Invalid parameters for UTMi transfer.', 400);
        return res.status(400).json({ status: 'error', message: 'ID expéditeur, ID destinataire et montant positif sont requis.' });
    }

    try {
        const result = await walletService.transferUtmi(senderId, recipientId, amount);
        logApiCall('wallet_routes.js', 'POST /api/wallet/transfer', 'success', `Transfer of ${amount} UTMi from ${senderId} to ${recipientId} successful.`, 200);
        res.status(200).json({
            status: 'success',
            message: 'Transfert d\'UTMi réussi.',
            senderNewBalance: result.senderNewBalance,
            recipientNewBalance: result.recipientNewBalance
        });
    } catch (error) {
        logApiCall('wallet_routes.js', 'POST /api/wallet/transfer', 'error', { message: error.message, stack: error.stack }, 500);
        res.status(500).json({ status: 'error', message: 'Erreur lors du transfert d\'UTMi.', error: error.message });
    }
});

/**
 * @swagger
 * /api/wallet/convert:
 * post:
 * summary: Convertit des UTMi en une autre monnaie ou jeton
 * tags: [Wallet]
 * description: |
 * Permet de convertir des UTMi en une autre monnaie fictive ou un autre jeton
 * au sein de l'écosystème. Cela simule un échange ou une utilisation des UTMi.
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * required:
 * - userId
 * - amount
 * - targetCurrency
 * properties:
 * userId:
 * type: string
 * description: L'ID de l'utilisateur qui effectue la conversion.
 * example: "user123"
 * amount:
 * type: number
 * format: float
 * description: Le montant d'UTMi à convertir.
 * example: 100.00
 * targetCurrency:
 * type: string
 * description: La monnaie ou le jeton cible (ex: 'points_fidelite', 'token_x').
 * example: "points_fidelite"
 * responses:
 * 200:
 * description: Conversion d'UTMi réussie.
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
 * example: Conversion d'UTMi réussie.
 * convertedAmount:
 * type: number
 * format: float
 * description: Le montant de la monnaie cible obtenu.
 * example: 1000.00
 * newUtmiBalance:
 * type: number
 * format: float
 * description: Le nouveau solde UTMi de l'utilisateur.
 * example: 1100.00
 * 400:
 * description: Requête invalide (ex: montant insuffisant, type de conversion non supporté).
 * 500:
 * description: Erreur interne du serveur lors de la conversion des UTMi.
 */
router.post('/convert', async (req, res) => {
    logApiCall('wallet_routes.js', 'POST /api/wallet/convert', 'info', 'Received request to convert UTMi.');
    const { userId, amount, targetCurrency } = req.body;

    if (!userId || typeof amount !== 'number' || amount <= 0 || !targetCurrency) {
        logApiCall('wallet_routes.js', 'POST /api/wallet/convert', 'warn', 'Invalid parameters for UTMi conversion.', 400);
        return res.status(400).json({ status: 'error', message: 'ID utilisateur, montant positif et devise cible sont requis.' });
    }

    try {
        const result = await walletService.convertUtmi(userId, amount, targetCurrency);
        logApiCall('wallet_routes.js', 'POST /api/wallet/convert', 'success', `User ${userId} converted ${amount} UTMi to ${targetCurrency}.`, 200);
        res.status(200).json({
            status: 'success',
            message: 'Conversion d\'UTMi réussie.',
            convertedAmount: result.convertedAmount,
            newUtmiBalance: result.newUtmiBalance
        });
    } catch (error) {
        logApiCall('wallet_routes.js', 'POST /api/wallet/convert', 'error', { message: error.message, stack: error.stack }, 500);
        res.status(500).json({ status: 'error', message: 'Erreur lors de la conversion des UTMi.', error: error.message });
    }
});

module.exports = router;