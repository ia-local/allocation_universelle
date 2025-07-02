// server_modules/services/conversation_service.js
const { v4: uuidv4 } = require('uuid');
const { logApiCall } = require('../utils/api_logger');
const AiIntegrationService = require('./ai_integration_service'); // Assurez-vous que ce service existe

// Cette simulation remplace une base de données.
// En production, vous utiliseriez une base de données réelle (MongoDB, PostgreSQL, etc.).
let conversations = [];

/**
 * Récupère toutes les conversations existantes.
 * @returns {Array} Une liste de toutes les conversations.
 */
async function getAllConversations() {
    logApiCall('conversation_service.js', 'getAllConversations', 'info', 'Récupération de toutes les conversations.');
    // En production, ce serait une requête à votre base de données.
    // Simuler un tri par date de dernière mise à jour
    const sortedConversations = [...conversations].sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated));
    logApiCall('conversation_service.js', 'getAllConversations', 'success', `Nombre de conversations trouvées : ${sortedConversations.length}.`);
    return sortedConversations.map(conv => ({
        id: conv.id,
        title: conv.title,
        lastUpdated: conv.lastUpdated
    }));
}

/**
 * Récupère une conversation spécifique par son ID.
 * @param {string} conversationId L'ID de la conversation.
 * @returns {object|null} La conversation ou null si non trouvée.
 */
async function getConversationById(conversationId) {
    logApiCall('conversation_service.js', 'getConversationById', 'info', `Tentative de récupération de la conversation : ${conversationId}.`);
    // En production, ce serait une requête à votre base de données.
    const conversation = conversations.find(conv => conv.id === conversationId);
    if (conversation) {
        logApiCall('conversation_service.js', 'getConversationById', 'success', `Conversation ${conversationId} trouvée.`);
    } else {
        logApiCall('conversation_service.js', 'getConversationById', 'warn', `Conversation ${conversationId} non trouvée.`);
    }
    return conversation;
}

/**
 * Ajoute un message à une conversation existante ou en crée une nouvelle.
 * Interagit avec le service d'intégration IA pour obtenir une réponse.
 * @param {string|null} conversationId L'ID de la conversation (null pour une nouvelle).
 * @param {string} userMessage Le message de l'utilisateur.
 * @returns {object} La conversation mise à jour ou nouvelle.
 */
async function addMessageToConversation(conversationId, userMessage) {
    let conversation;
    let isNewConversation = false;

    // 1. Trouver ou créer la conversation
    if (conversationId) {
        conversation = conversations.find(conv => conv.id === conversationId);
        if (!conversation) {
            logApiCall('conversation_service.js', 'addMessageToConversation', 'warn', `Conversation ${conversationId} non trouvée. Création d'une nouvelle.`);
            // Si l'ID est fourni mais la conversation n'existe pas, on la crée.
            conversationId = uuidv4(); // Générer un nouvel ID pour la nouvelle conversation
            conversation = {
                id: conversationId,
                title: userMessage.substring(0, 50) + (userMessage.length > 50 ? '...' : ''), // Titre initial basé sur le message
                messages: [],
                lastUpdated: new Date().toISOString()
            };
            conversations.push(conversation);
            isNewConversation = true;
        }
    } else {
        conversationId = uuidv4();
        conversation = {
            id: conversationId,
            title: userMessage.substring(0, 50) + (userMessage.length > 50 ? '...' : ''), // Titre initial basé sur le message
            messages: [],
            lastUpdated: new Date().toISOString()
        };
        conversations.push(conversation);
        isNewConversation = true;
        logApiCall('conversation_service.js', 'addMessageToConversation', 'info', `Nouvelle conversation créée : ${conversationId}.`);
    }

    // 2. Ajouter le message de l'utilisateur
    const userMsgObj = {
        sender: 'user',
        text: userMessage,
        timestamp: new Date().toISOString()
    };
    conversation.messages.push(userMsgObj);
    conversation.lastUpdated = new Date().toISOString(); // Mettre à jour la date

    logApiCall('conversation_service.js', 'addMessageToConversation', 'info', `Message utilisateur ajouté à la conversation ${conversation.id}.`);

    // 3. Obtenir la réponse de l'IA
    try {
        const aiResponseText = await AiIntegrationService.getAiResponse(conversation.messages);
        const aiMsgObj = {
            sender: 'ai',
            text: aiResponseText,
            timestamp: new Date().toISOString()
        };
        conversation.messages.push(aiMsgObj);
        conversation.lastUpdated = new Date().toISOString(); // Mettre à jour après la réponse de l'IA

        logApiCall('conversation_service.js', 'addMessageToConversation', 'success', `Réponse IA ajoutée à la conversation ${conversation.id}.`);

        // En production, vous sauvegarderiez `conversation` dans votre base de données ici.
        return conversation;

    } catch (error) {
        logApiCall('conversation_service.js', 'addMessageToConversation', 'error', { message: `Erreur lors de la génération de la réponse IA pour conv ${conversation.id}: ${error.message}`, stack: error.stack });
        // En cas d'échec de l'IA, on peut ajouter un message d'erreur ou relancer
        throw new Error(`Impossible de générer une réponse de l'IA : ${error.message}`);
    }
}

/**
 * Supprime une conversation par son ID.
 * @param {string} conversationId L'ID de la conversation à supprimer.
 * @returns {boolean} True si la suppression a réussi, false sinon.
 */
async function deleteConversation(conversationId) {
    logApiCall('conversation_service.js', 'deleteConversation', 'info', `Tentative de suppression de la conversation : ${conversationId}.`);
    const initialLength = conversations.length;
    conversations = conversations.filter(conv => conv.id !== conversationId);

    if (conversations.length < initialLength) {
        logApiCall('conversation_service.js', 'deleteConversation', 'success', `Conversation ${conversationId} supprimée.`);
        // En production, ce serait une opération de suppression dans votre base de données.
        return true;
    }
    logApiCall('conversation_service.js', 'deleteConversation', 'warn', `Conversation ${conversationId} non trouvée pour la suppression.`);
    return false;
}

/**
 * Simule la génération d'un résumé professionnel à partir d'une conversation.
 * @param {string} conversationId L'ID de la conversation à partir de laquelle générer le résumé.
 * @returns {string|null} Le résumé professionnel généré ou null si conversation non trouvée.
 */
async function generateProfessionalSummaryFromConversation(conversationId) {
    logApiCall('conversation_service.js', 'generateProfessionalSummaryFromConversation', 'info', `Génération du résumé pro pour conv ${conversationId}.`);
    const conversation = await getConversationById(conversationId);

    if (!conversation) {
        logApiCall('conversation_service.js', 'generateProfessionalSummaryFromConversation', 'warn', `Conversation ${conversationId} non trouvée pour résumé.`);
        return null;
    }

    // Récupérer tout le texte de la conversation
    const conversationText = conversation.messages
        .map(msg => `${msg.sender}: ${msg.text}`)
        .join('\n');

    // Envoyer le texte de la conversation à l'IA pour générer le résumé
    try {
        const summaryPrompt = `Based on the following conversation, generate a concise professional summary suitable for a CV. Focus on skills, experience, and achievements discussed, keeping it to 3-5 sentences:\n\n${conversationText}\n\nProfessional Summary:`;
        const professionalSummary = await AiIntegrationService.getAiResponse(summaryPrompt);
        logApiCall('conversation_service.js', 'generateProfessionalSummaryFromConversation', 'success', `Résumé pro généré pour conv ${conversationId}.`);
        return professionalSummary;
    } catch (error) {
        logApiCall('conversation_service.js', 'generateProfessionalSummaryFromConversation', 'error', { message: `Erreur lors de la génération du résumé pro pour conv ${conversationId}: ${error.message}`, stack: error.stack });
        throw new Error(`Impossible de générer le résumé professionnel : ${error.message}`);
    }
}


module.exports = {
    getAllConversations,
    getConversationById,
    addMessageToConversation,
    deleteConversation,
    generateProfessionalSummaryFromConversation
};