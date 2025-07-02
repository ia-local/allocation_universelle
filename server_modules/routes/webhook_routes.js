// server_modules/routes/webhook_routes.js
const express = require('express');
const router = express.Router();
// IMPORTANT: Assurez-vous d'importer webhookService ici si vous l'utilisez réellement
// const webhookService = require('../services/webhook_service'); // <-- Décommentez et ajustez si nécessaire
const { logApiCall } = require('../utils/api_logger');

/**
 * @swagger
 * tags:
 * name: Webhooks
 * description: API pour la gestion et la réception des webhooks externes
 */

/**
 * @swagger
 * /api/webhooks/github:
 * post:
 * summary: Gère les événements de webhook GitHub
 * tags: [Webhooks]
 * description: |
 * Ce endpoint reçoit les payloads de webhook de GitHub.
 * Il peut être configuré pour déclencher des actions spécifiques
 * en fonction des événements (push, pull_request, etc.).
 * Note: En production, une validation de signature de webhook est essentielle.
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * description: Le payload JSON envoyé par GitHub.
 * example:
 * ref: "refs/heads/main"
 * before: "a1b2c3d4..."
 * after: "e5f6g7h8..."
 * repository:
 * name: "my-repo"
 * full_name: "user/my-repo"
 * pusher:
 * name: "github-user"
 * responses:
 * 200:
 * description: Webhook GitHub traité avec succès.
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
 * example: Webhook GitHub reçu et traité.
 * eventType:
 * type: string
 * description: Le type d'événement GitHub identifié.
 * example: "push"
 * 400:
 * description: Requête invalide (ex: payload manquant ou mal formé).
 * 401:
 * description: Non autorisé (signature de webhook invalide - non implémenté dans cet exemple).
 * 500:
 * description: Erreur interne du serveur lors du traitement du webhook.
 */
router.post('/github', async (req, res) => {
    // Dans une implémentation réelle, vous vérifieriez la signature du webhook GitHub
    // const githubSignature = req.headers['x-hub-signature-256'];
    // const secret = process.env.GITHUB_WEBHOOK_SECRET;
    // if (!verifySignature(req.rawBody, githubSignature, secret)) {
    //     logApiCall('webhook_routes.js', 'POST /api/webhooks/github', 'warn', 'Signature GitHub invalide.', 401);
    //     return res.status(401).json({ status: 'error', message: 'Signature de webhook invalide.' });
    // }

    const eventType = req.headers['x-github-event'];
    logApiCall('webhook_routes.js', 'POST /api/webhooks/github', 'info', `Webhook GitHub reçu. Type d'événement: ${eventType}`);

    // Si webhookService n'est pas importé, cette ligne va causer une erreur
    // Assurez-vous d'importer webhookService ou de remplacer cette logique
    try {
        // const result = await webhookService.handleGithubWebhook(eventType, req.body);
        logApiCall('webhook_routes.js', 'POST /api/webhooks/github', 'success', `Webhook GitHub traité: ${eventType}.`, 200);
        res.status(200).json({
            status: 'success',
            message: `Webhook GitHub reçu et traité pour l'événement '${eventType}'.`,
            eventType: eventType,
            // data: result // Décommentez si webhookService est utilisé
        });
    } catch (error) {
        logApiCall('webhook_routes.js', 'POST /api/webhooks/github', 'error', { message: error.message, stack: error.stack }, 500);
        res.status(500).json({ status: 'error', message: 'Erreur lors du traitement du webhook GitHub.', error: error.message });
    }
});

/**
 * @swagger
 * /api/webhooks/stripe:
 * post:
 * summary: Gère les événements de webhook Stripe
 * tags: [Webhooks]
 * description: |
 * Ce endpoint reçoit les événements de webhook de Stripe (paiements, abonnements, etc.).
 * Il est essentiel pour synchroniser l'état des transactions financières.
 * Note: Une vérification de signature Stripe est cruciale pour la sécurité.
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * description: Le payload JSON envoyé par Stripe.
 * example:
 * id: "evt_123abc..."
 * object: "event"
 * type: "checkout.session.completed"
 * data:
 * object:
 * id: "cs_test_abc123..."
 * amount_total: 1000
 * responses:
 * 200:
 * description: Webhook Stripe traité avec succès.
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
 * example: Webhook Stripe reçu et traité.
 * eventType:
 * type: string
 * description: Le type d'événement Stripe identifié.
 * example: "checkout.session.completed"
 * 400:
 * description: Requête invalide (payload manquant ou mal formé).
 * 401:
 * description: Non autorisé (signature de webhook Stripe invalide - non implémenté dans cet exemple).
 * 500:
 * description: Erreur interne du serveur lors du traitement du webhook.
 */
router.post('/stripe', async (req, res) => {
    // Dans une implémentation réelle, vous vérifieriez la signature du webhook Stripe
    // const stripeSignature = req.headers['stripe-signature'];
    // try {
    //     const event = await stripe.webhooks.constructEvent(req.rawBody, stripeSignature, process.env.STRIPE_WEBHOOK_SECRET);
    //     // req.body est déjà un objet parsé, mais Stripe recommande d'utiliser le `rawBody` pour la vérification
    //     // et de laisser constructEvent parser le corps.
    //     // event.type serait alors le eventType
    // } catch (err) {
    //     logApiCall('webhook_routes.js', 'POST /api/webhooks/stripe', 'warn', `Signature Stripe invalide: ${err.message}`, 400);
    //     return res.status(400).send(`Webhook Error: ${err.message}`);
    // }

    const eventType = req.body.type; // Assumant que le type est dans le corps du payload Stripe
    logApiCall('webhook_routes.js', 'POST /api/webhooks/stripe', 'info', `Webhook Stripe reçu. Type d'événement: ${eventType}`);

    // Si webhookService n'est pas importé, cette ligne va causer une erreur
    // Assurez-vous d'importer webhookService ou de remplacer cette logique
    try {
        // const result = await webhookService.handleStripeWebhook(eventType, req.body);
        logApiCall('webhook_routes.js', 'POST /api/webhooks/stripe', 'success', `Webhook Stripe traité: ${eventType}.`, 200);
        res.status(200).json({
            status: 'success',
            message: `Webhook Stripe reçu et traité pour l'événement '${eventType}'.`,
            eventType: eventType,
            // data: result // Décommentez si webhookService est utilisé
        });
    } catch (error) {
        logApiCall('webhook_routes.js', 'POST /api/webhooks/stripe', 'error', { message: error.message, stack: error.stack }, 500);
        res.status(500).json({ status: 'error', message: 'Erreur lors du traitement du webhook Stripe.', error: error.message });
    }
});

module.exports = router;