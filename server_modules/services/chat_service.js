// server_modules/services/chat_service.js

const { v4: uuidv4 } = require('uuid');
const path = require('path'); // AJOUTEZ CETTE LIGNE
const groqService = require('./groq_service');
const dbService = require('./db_service');
const { logApiCall } = require('../utils/api_logger');

const CONVERSATIONS_FILE = path.join(__dirname, '../../data/conversations.json');

/**
 * Envoie un message à l'IA, gère l'historique de la conversation et la sauvegarde.
 * @param {string} userMessage - Le message de l'utilisateur.
 * @param {string|null} conversationId - L'ID de la conversation existante, ou null pour une nouvelle.
 * @returns {Promise<object>} L'ID de la conversation, le nouveau message, la réponse de l'IA et l'historique complet.
 */
async function sendMessage(userMessage, conversationId = null) {
    logApiCall('chat_service.js', 'sendMessage', 'info', `Processing message for conversation: ${conversationId || 'new'}`);

    let conversations = await dbService.readJsonFromFile(CONVERSATIONS_FILE);
    let conversation;
    let isNewConversation = false;

    if (conversationId) {
        conversation = conversations.find(conv => conv.id === conversationId);
        if (!conversation) {
            logApiCall('chat_service.js', 'sendMessage', 'warn', `Conversation ${conversationId} not found. Starting new conversation.`);
            isNewConversation = true;
        }
    } else {
        isNewConversation = true;
    }

    if (isNewConversation) {
        conversation = {
            id: uuidv4(),
            title: "Nouvelle conversation", // Titre temporaire, sera généré après le premier échange
            messages: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        conversations.unshift(conversation); // Ajouter en début de liste pour la visibilité
    }

    // Ajouter le message de l'utilisateur
    const userMessageObj = {
        sender: 'user',
        text: userMessage,
        timestamp: new Date().toISOString()
    };
    conversation.messages.push(userMessageObj);
    conversation.updatedAt = new Date().toISOString();
    conversation.lastMessage = userMessage; // Mettre à jour le dernier message pour l'affichage

    // Préparer l'historique pour l'IA (système de rôle)
    const messagesForGroq = conversation.messages.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text
    }));

    // Appel à Groq pour la réponse de l'IA
    const groqResponse = await groqService.getGroqChatCompletion(messagesForGroq);
    const aiResponseText = groqResponse.response;
    const modelUsed = groqResponse.model;
    const promptTokens = groqResponse.promptTokens;
    const completionTokens = groqResponse.completionTokens;

    // Calcul des UTMi (simplifié)
    const utmiGenerated = (promptTokens * 0.001) + (completionTokens * 0.002); // Exemple de calcul

    // Ajouter la réponse de l'IA
    const aiMessageObj = {
        sender: 'ai',
        text: aiResponseText,
        timestamp: new Date().toISOString(),
        metadata: {
            model: modelUsed,
            promptTokens: promptTokens,
            completionTokens: completionTokens,
            utmiGenerated: utmiGenerated
        }
    };
    conversation.messages.push(aiMessageObj);
    conversation.updatedAt = new Date().toISOString();
    conversation.lastMessage = aiResponseText; // Mettre à jour le dernier message pour l'affichage

    // Générer le titre de la conversation si c'est une nouvelle conversation
    if (isNewConversation && conversation.messages.length >= 2) { // Après user message et AI response
        conversation.title = await generateConversationTitle(conversation.messages);
    }

    await dbService.writeJsonToFile(CONVERSATIONS_FILE, conversations);
    logApiCall('chat_service.js', 'sendMessage', 'success', `Message processed and conversation ${conversation.id} updated.`);

    return {
        id: conversation.id,
        newMessage: userMessageObj,
        aiResponse: aiMessageObj,
        fullConversation: conversation.messages
    };
}

/**
 * Génère un titre court pour une conversation basé sur ses premiers messages.
 * @param {Array<object>} messages - L'historique des messages de la conversation.
 * @returns {Promise<string>} Le titre généré.
 */
async function generateConversationTitle(messages) {
    logApiCall('chat_service.js', 'generateConversationTitle', 'info', 'Generating conversation title...');
    const chatExcerpt = messages.slice(0, 4).map(msg => `${msg.sender}: ${msg.text}`).join('\n');
    const prompt = `Génère un titre concis (max 10 mots) pour cette conversation en te basant sur l'extrait suivant:\n\n${chatExcerpt}\n\nTitre:`;

    try {
        const groqResponse = await groqService.getGroqChatCompletion(prompt, "llama3-8b-8192");
        let title = groqResponse.response.trim();
        // Nettoyer le titre si l'IA ajoute des guillemets ou d'autres caractères indésirables
        title = title.replace(/^["']|["']$/g, '');
        logApiCall('chat_service.js', 'generateConversationTitle', 'success', `Title generated: ${title}`);
        return title;
    } catch (error) {
        logApiCall('chat_service.js', 'generateConversationTitle', 'error', { message: error.message, stack: error.stack }, 500);
        console.error('Erreur lors de la génération du titre de la conversation:', error);
        return "Conversation sans titre";
    }
}

/**
 * Récupère toutes les conversations, triées par date de dernière mise à jour.
 * @returns {Promise<Array<object>>} Une liste de conversations.
 */
async function getAllConversations() {
    logApiCall('chat_service.js', 'getAllConversations', 'info', 'Fetching all conversations.');
    const conversations = await dbService.readJsonFromFile(CONVERSATIONS_FILE);
    // Trier par updatedAt décroissant
    conversations.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    logApiCall('chat_service.js', 'getAllConversations', 'success', `Found ${conversations.length} conversations.`);
    return conversations;
}

/**
 * Récupère une conversation spécifique par son ID.
 * @param {string} id - L'ID de la conversation.
 * @returns {Promise<object|null>} L'objet conversation ou null si non trouvé.
 */
async function getConversationById(id) {
    logApiCall('chat_service.js', 'getConversationById', 'info', `Fetching conversation by ID: ${id}`);
    const conversations = await dbService.readJsonFromFile(CONVERSATIONS_FILE);
    const conversation = conversations.find(conv => conv.id === id);
    if (conversation) {
        logApiCall('chat_service.js', 'getConversationById', 'success', `Conversation ${id} found.`);
    } else {
        logApiCall('chat_service.js', 'getConversationById', 'warn', `Conversation ${id} not found.`);
    }
    return conversation;
}

/**
 * Supprime une conversation par son ID.
 * @param {string} id - L'ID de la conversation à supprimer.
 * @returns {Promise<boolean>} Vrai si la suppression a réussi, faux sinon.
 */
async function deleteConversation(id) {
    logApiCall('chat_service.js', 'deleteConversation', 'info', `Attempting to delete conversation: ${id}`);
    let conversations = await dbService.readJsonFromFile(CONVERSATIONS_FILE);
    const initialLength = conversations.length;
    conversations = conversations.filter(conv => conv.id !== id);

    if (conversations.length < initialLength) {
        await dbService.writeJsonToFile(CONVERSATIONS_FILE, conversations);
        logApiCall('chat_service.js', 'deleteConversation', 'success', `Conversation ${id} deleted.`);
        return true;
    } else {
        logApiCall('chat_service.js', 'deleteConversation', 'warn', `Conversation ${id} not found for deletion.`);
        return false;
    }
}

module.exports = {
    sendMessage,
    getAllConversations,
    getConversationById,
    deleteConversation,
};