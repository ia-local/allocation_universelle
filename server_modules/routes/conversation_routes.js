// server_modules/routes/conversation_routes.js
const express = require('express');
const router = express.Router();
const conversationService = require('../services/conversation_service');
const { logApiCall } = require('../utils/api_logger');

/**
 * @swagger
 * tags:
 * name: Conversations
 * description: API pour la gestion des conversations avec l'IA
 */

/**
 * @swagger
 * /api/conversations:
 * get:
 * summary: Récupère toutes les conversations de l'utilisateur
 * tags: [Conversations]
 * description: |
 * Ce endpoint retourne une liste de toutes les conversations initiées
 * par l'utilisateur, triées par date de dernière activité.
 * Chaque conversation inclut un ID, un titre (auto-généré ou défini),
 * et la date de la dernière mise à jour.
 * responses:
 * 200:
 * description: Liste des conversations récupérée avec succès.
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
 * example: Conversations récupérées.
 * data:
 * type: array
 * items:
 * type: object
 * properties:
 * id:
 * type: string
 * example: "conv_123abc"
 * title:
 * type: string
 * example: "Discussion sur l'optimisation fiscale"
 * lastUpdated:
 * type: string
 * format: date-time
 * example: "2024-07-01T10:30:00Z"
 * 500:
 * description: Erreur interne du serveur.
 */
router.get('/', async (req, res) => {
    logApiCall('conversation_routes.js', 'GET /api/conversations', 'info', 'Received request for all conversations.');
    try {
        const conversations = await conversationService.getAllConversations();
        logApiCall('conversation_routes.js', 'GET /api/conversations', 'success', 'Conversations retrieved successfully.', 200);
        res.status(200).json({
            status: 'success',
            message: 'Conversations récupérées.',
            data: conversations
        });
    } catch (error) {
        logApiCall('conversation_routes.js', 'GET /api/conversations', 'error', { message: error.message, stack: error.stack }, 500);
        res.status(500).json({ status: 'error', message: 'Erreur lors de la récupération des conversations.', error: error.message });
    }
});

/**
 * @swagger
 * /api/conversations/{id}:
 * get:
 * summary: Récupère une conversation spécifique par ID
 * tags: [Conversations]
 * description: |
 * Ce endpoint retourne les détails complets d'une conversation,
 * y compris tous les messages échangés, basés sur son ID unique.
 * parameters:
 * - in: path
 * name: id
 * required: true
 * schema:
 * type: string
 * description: L'ID de la conversation à récupérer.
 * example: "conv_123abc"
 * responses:
 * 200:
 * description: Conversation récupérée avec succès.
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
 * example: Conversation récupérée.
 * data:
 * type: object
 * properties:
 * id:
 * type: string
 * example: "conv_123abc"
 * title:
 * type: string
 * example: "Discussion sur l'optimisation fiscale"
 * messages:
 * type: array
 * items:
 * type: object
 * properties:
 * sender:
 * type: string
 * enum: [user, ai]
 * example: "user"
 * text:
 * type: string
 * example: "Comment puis-je réduire mes impôts ?"
 * timestamp:
 * type: string
 * format: date-time
 * example: "2024-07-01T10:25:00Z"
 * 404:
 * description: Conversation non trouvée.
 * 500:
 * description: Erreur interne du serveur.
 */
router.get('/:id', async (req, res) => {
    logApiCall('conversation_routes.js', 'GET /api/conversations/:id', 'info', `Received request for conversation ID: ${req.params.id}`);
    try {
        const conversation = await conversationService.getConversationById(req.params.id);
        if (conversation) {
            logApiCall('conversation_routes.js', 'GET /api/conversations/:id', 'success', `Conversation ${req.params.id} retrieved.`, 200);
            res.status(200).json({
                status: 'success',
                message: 'Conversation récupérée.',
                data: conversation
            });
        } else {
            logApiCall('conversation_routes.js', 'GET /api/conversations/:id', 'warn', `Conversation ${req.params.id} not found.`, 404);
            res.status(404).json({ status: 'error', message: 'Conversation non trouvée.' });
        }
    } catch (error) {
        logApiCall('conversation_routes.js', 'GET /api/conversations/:id', 'error', { message: error.message, stack: error.stack }, 500);
        res.status(500).json({ status: 'error', message: 'Erreur lors de la récupération de la conversation.', error: error.message });
    }
});

/**
 * @swagger
 * /api/conversations:
 * post:
 * summary: Démarre une nouvelle conversation ou ajoute un message
 * tags: [Conversations]
 * description: |
 * Ce endpoint permet de démarrer une nouvelle conversation avec l'IA
 * ou de continuer une conversation existante en ajoutant un nouveau message.
 * Si un `conversationId` est fourni, le message est ajouté à cette conversation.
 * Sinon, une nouvelle conversation est créée.
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * required:
 * - message
 * properties:
 * conversationId:
 * type: string
 * description: ID de la conversation existante (optionnel). Si omis, une nouvelle conversation est créée.
 * example: "conv_123abc"
 * message:
 * type: string
 * description: Le message de l'utilisateur à envoyer à l'IA.
 * example: "Bonjour, j'ai une question sur les cryptomonnaies."
 * responses:
 * 200:
 * description: Message ajouté et réponse de l'IA reçue.
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
 * example: Réponse de l'IA générée et ajoutée à la conversation.
 * conversation:
 * type: object
 * description: L'objet conversation mis à jour avec le nouveau message et la réponse de l'IA.
 * properties:
 * id: { type: string, example: "conv_123abc" }
 * title: { type: string, example: "Discussion sur les cryptomonnaies" }
 * messages:
 * type: array
 * items:
 * type: object
 * properties:
 * sender: { type: string, example: "user" }
 * text: { type: string, example: "Bonjour, j'ai une question sur les cryptomonnaies." }
 * timestamp: { type: string, format: date-time, example: "2024-07-01T10:35:00Z" }
 * 400:
 * description: Message manquant dans le corps de la requête.
 * 500:
 * description: Erreur interne du serveur lors du traitement du message ou de la génération de la réponse.
 */
router.post('/', async (req, res) => {
    logApiCall('conversation_routes.js', 'POST /api/conversations', 'info', 'Received request to add message to conversation.');
    const { conversationId, message } = req.body;

    if (!message) {
        logApiCall('conversation_routes.js', 'POST /api/conversations', 'warn', 'Message is missing.', 400);
        return res.status(400).json({ status: 'error', message: 'Message est requis.' });
    }

    try {
        const updatedConversation = await conversationService.addMessageToConversation(conversationId, message);
        logApiCall('conversation_routes.js', 'POST /api/conversations', 'success', `Message added to conversation ${updatedConversation.id}.`, 200);
        res.status(200).json({
            status: 'success',
            message: 'Réponse de l\'IA générée et ajoutée à la conversation.',
            conversation: updatedConversation
        });
    } catch (error) {
        logApiCall('conversation_routes.js', 'POST /api/conversations', 'error', { message: error.message, stack: error.stack }, 500);
        res.status(500).json({ status: 'error', message: 'Erreur lors de l\'ajout du message à la conversation.', error: error.message });
    }
});

/**
 * @swagger
 * /api/conversations/{id}:
 * delete:
 * summary: Supprime une conversation par ID
 * tags: [Conversations]
 * description: |
 * Supprime une conversation spécifique ainsi que tous ses messages.
 * Cette opération est irréversible.
 * parameters:
 * - in: path
 * name: id
 * required: true
 * schema:
 * type: string
 * description: L'ID de la conversation à supprimer.
 * example: "conv_123abc"
 * responses:
 * 200:
 * description: Conversation supprimée avec succès.
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
 * example: Conversation supprimée.
 * 404:
 * description: Conversation non trouvée.
 * 500:
 * description: Erreur interne du serveur.
 */
router.delete('/:id', async (req, res) => {
    logApiCall('conversation_routes.js', 'DELETE /api/conversations/:id', 'info', `Received request to delete conversation ID: ${req.params.id}`);
    try {
        const success = await conversationService.deleteConversation(req.params.id);
        if (success) {
            logApiCall('conversation_routes.js', 'DELETE /api/conversations/:id', 'success', `Conversation ${req.params.id} deleted.`, 200);
            res.status(200).json({ status: 'success', message: 'Conversation supprimée.' });
        } else {
            logApiCall('conversation_routes.js', 'DELETE /api/conversations/:id', 'warn', `Conversation ${req.params.id} not found for deletion.`, 404);
            res.status(404).json({ status: 'error', message: 'Conversation non trouvée.' });
        }
    } catch (error) {
        logApiCall('conversation_routes.js', 'DELETE /api/conversations/:id', 'error', { message: error.message, stack: error.stack }, 500);
        res.status(500).json({ status: 'error', message: 'Erreur lors de la suppression de la conversation.', error: error.message });
    }
});

module.exports = router;