// server_modules/routes/chat_routes.js

const express = require('express');
const router = express.Router();
const chatService = require('../services/chat_service');
const { logApiCall } = require('../utils/api_logger');

/**
 * @swagger
 * tags:
 * name: Chat
 * description: Gestion des conversations et des messages de chat
 */

/**
 * @swagger
 * /api/chat:
 * post:
 * summary: Envoie un nouveau message et reçoit une réponse de l'IA
 * tags: [Chat]
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * required:
 * - message
 * - conversationId
 * properties:
 * message:
 * type: string
 * description: Le message de l'utilisateur.
 * conversationId:
 * type: string
 * nullable: true
 * description: L'ID de la conversation existante, ou null/omis pour une nouvelle conversation.
 * responses:
 * 200:
 * description: Réponse de l'IA et détails de la conversation.
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * conversationId:
 * type: string
 * description: L'ID de la conversation.
 * response:
 * type: string
 * description: La réponse générée par l'IA.
 * fullConversation:
 * type: array
 * items:
 * type: object
 * properties:
 * sender:
 * type: string
 * text:
 * type: string
 * description: L'historique complet de la conversation.
 * 400:
 * description: Requête invalide (message manquant).
 * 500:
 * description: Erreur serveur.
 */
router.post('/', async (req, res) => {
    const { message, conversationId } = req.body;
    logApiCall('chat_routes.js', 'POST /api/chat', 'info', { message, conversationId });

    if (!message) {
        logApiCall('chat_routes.js', 'POST /api/chat', 'error', 'Missing message in request body.', 400);
        return res.status(400).json({ error: 'Le message est requis.' });
    }

    try {
        const { id, newMessage, aiResponse, fullConversation } = await chatService.sendMessage(message, conversationId);
        logApiCall('chat_routes.js', 'POST /api/chat', 'success', `Chat response for conversation ${id}`, 200);
        res.json({ conversationId: id, response: aiResponse.text, fullConversation });
    } catch (error) {
        logApiCall('chat_routes.js', 'POST /api/chat', 'error', { message: error.message, stack: error.stack }, 500);
        console.error('Erreur lors de l\'envoi du message de chat:', error);
        res.status(500).json({ error: 'Erreur interne du serveur lors du traitement du message.' });
    }
});

/**
 * @swagger
 * /api/conversations:
 * get:
 * summary: Récupère toutes les conversations
 * tags: [Chat]
 * responses:
 * 200:
 * description: Une liste d'objets de conversation.
 * content:
 * application/json:
 * schema:
 * type: array
 * items:
 * type: object
 * properties:
 * id:
 * type: string
 * description: L'ID unique de la conversation.
 * title:
 * type: string
 * description: Titre généré pour la conversation.
 * lastMessage:
 * type: string
 * description: Le dernier message envoyé dans la conversation.
 * updatedAt:
 * type: string
 * format: date-time
 * description: Horodatage de la dernière mise à jour.
 * 500:
 * description: Erreur serveur.
 */
router.get('/conversations', async (req, res) => {
    logApiCall('chat_routes.js', 'GET /api/conversations', 'info', 'Fetching all conversations');
    try {
        const conversations = await chatService.getAllConversations();
        logApiCall('chat_routes.js', 'GET /api/conversations', 'success', `Fetched ${conversations.length} conversations`, 200);
        res.json(conversations);
    } catch (error) {
        logApiCall('chat_routes.js', 'GET /api/conversations', 'error', { message: error.message, stack: error.stack }, 500);
        console.error('Erreur lors de la récupération des conversations:', error);
        res.status(500).json({ error: 'Erreur interne du serveur lors de la récupération des conversations.' });
    }
});

/**
 * @swagger
 * /api/conversations/{id}:
 * get:
 * summary: Récupère une conversation spécifique par ID
 * tags: [Chat]
 * parameters:
 * - in: path
 * name: id
 * schema:
 * type: string
 * required: true
 * description: L'ID de la conversation à récupérer.
 * responses:
 * 200:
 * description: L'objet de conversation demandé.
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * id:
 * type: string
 * title:
 * type: string
 * messages:
 * type: array
 * items:
 * type: object
 * properties:
 * sender:
 * type: string
 * text:
 * type: string
 * timestamp:
 * type: string
 * format: date-time
 * updatedAt:
 * type: string
 * format: date-time
 * 404:
 * description: Conversation non trouvée.
 * 500:
 * description: Erreur serveur.
 */
router.get('/conversations/:id', async (req, res) => {
    const { id } = req.params;
    logApiCall('chat_routes.js', `GET /api/conversations/${id}`, 'info', `Fetching conversation with ID: ${id}`);
    try {
        const conversation = await chatService.getConversationById(id);
        if (conversation) {
            logApiCall('chat_routes.js', `GET /api/conversations/${id}`, 'success', `Conversation ${id} found`, 200);
            res.json(conversation);
        } else {
            logApiCall('chat_routes.js', `GET /api/conversations/${id}`, 'error', `Conversation ${id} not found`, 404);
            res.status(404).json({ error: 'Conversation non trouvée.' });
        }
    } catch (error) {
        logApiCall('chat_routes.js', `GET /api/conversations/${id}`, 'error', { message: error.message, stack: error.stack }, 500);
        console.error('Erreur lors de la récupération de la conversation:', error);
        res.status(500).json({ error: 'Erreur interne du serveur lors de la récupération de la conversation.' });
    }
});

/**
 * @swagger
 * /api/conversations/{id}:
 * delete:
 * summary: Supprime une conversation spécifique par ID
 * tags: [Chat]
 * parameters:
 * - in: path
 * name: id
 * schema:
 * type: string
 * required: true
 * description: L'ID de la conversation à supprimer.
 * responses:
 * 204:
 * description: Conversation supprimée avec succès.
 * 404:
 * description: Conversation non trouvée.
 * 500:
 * description: Erreur serveur.
 */
router.delete('/conversations/:id', async (req, res) => {
    const { id } = req.params;
    logApiCall('chat_routes.js', `DELETE /api/conversations/${id}`, 'info', `Deleting conversation with ID: ${id}`);
    try {
        const success = await chatService.deleteConversation(id);
        if (success) {
            logApiCall('chat_routes.js', `DELETE /api/conversations/${id}`, 'success', `Conversation ${id} deleted`, 204);
            res.status(204).send(); // No Content
        } else {
            logApiCall('chat_routes.js', `DELETE /api/conversations/${id}`, 'error', `Conversation ${id} not found for deletion`, 404);
            res.status(404).json({ error: 'Conversation non trouvée.' });
        }
    } catch (error) {
        logApiCall('chat_routes.js', `DELETE /api/conversations/${id}`, 'error', { message: error.message, stack: error.stack }, 500);
        console.error('Erreur lors de la suppression de la conversation:', error);
        res.status(500).json({ error: 'Erreur interne du serveur lors de la suppression de la conversation.' });
    }
});

module.exports = router;