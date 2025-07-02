// public/js/chat_ui.js - Logique DOM et events pour le chat
import { API_BASE_URL, showStatusMessage, currentConversationId, currentChatPage, CHAT_CONVERSATIONS_PER_PAGE,
         initPaginationControls, setConversations, renderChatConversationList, setActiveConversationId } from './app.js';

let chatMessagesEl, chatInputEl, sendChatMessageBtn, newChatBtn, conversationsListEl, prevChatPageBtn, nextChatPageBtn, chatPageInfoEl;

/**
 * Initialise les éléments et événements de l'interface de chat.
 */
function initChatUI() {
    chatMessagesEl = document.getElementById('chatMessages');
    chatInputEl = document.getElementById('chatInput');
    sendChatMessageBtn = document.getElementById('sendChatMessageBtn');
    newChatBtn = document.getElementById('newChatBtn');
    conversationsListEl = document.getElementById('conversationsList');
    prevChatPageBtn = document.getElementById('prevChatPageBtn');
    nextChatPageBtn = document.getElementById('nextChatPageBtn');
    chatPageInfoEl = document.getElementById('chatPageInfo');

    if (sendChatMessageBtn) sendChatMessageBtn.onclick = sendMessage;
    if (newChatBtn) newChatBtn.onclick = startNewConversation;

    // Initialise les contrôles de pagination (si nécessaire, sinon à retirer)
    initPaginationControls(
        conversationsListEl,
        prevChatPageBtn,
        nextChatPageBtn,
        chatPageInfoEl,
        loadConversation, // Callback pour sélectionner une conversation
        deleteConversation // Callback pour supprimer une conversation
    );
    console.log('[chat_ui.js] Chat UI initialized.');
}

/**
 * Affiche un message dans la fenêtre de chat.
 * @param {string} role - 'user' ou 'assistant'.
 * @param {string} content - Le contenu du message.
 */
function displayMessage(role, content) {
    if (!chatMessagesEl) return;
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('chat-message', role);
    messageDiv.innerHTML = `<p>${content}</p>`;
    chatMessagesEl.appendChild(messageDiv);
    chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight; // Scroll vers le bas
}

/**
 * Récupère l'historique des conversations depuis le backend.
 */
async function fetchConversations() {
    showStatusMessage('Chargement des conversations...', 'info');
    try {
        const response = await fetch(`${API_BASE_URL}/api/conversations`);
        const data = await response.json();
        if (response.ok) {
            setConversations(data.conversations); // Met à jour les données dans pagination.js
            renderChatConversationList(); // Rend la liste des conversations via pagination.js
            showStatusMessage('Conversations chargées.', 'success');
        } else {
            showStatusMessage(`Erreur lors du chargement des conversations: ${data.message}`, 'error');
        }
    } catch (error) {
        console.error('Erreur réseau ou serveur lors du chargement des conversations:', error);
        showStatusMessage(`Erreur réseau: ${error.message}`, 'error');
    }
}

/**
 * Charge une conversation spécifique.
 * @param {string} conversationId - L'ID de la conversation à charger.
 */
async function loadConversation(conversationId) {
    showStatusMessage('Chargement de la conversation...', 'info');
    currentConversationId = conversationId; // Mettre à jour l'état global
    setActiveConversationId(conversationId); // Mettre à jour l'UI dans pagination.js

    try {
        const response = await fetch(`${API_BASE_URL}/api/conversations/${conversationId}`);
        const data = await response.json();
        if (response.ok) {
            // Nettoyer la zone de chat et afficher les messages
            if (chatMessagesEl) chatMessagesEl.innerHTML = '';
            data.messages.forEach(msg => displayMessage(msg.role, msg.content));
            showStatusMessage(`Conversation "${data.title}" chargée.`, 'success');
        } else {
            showStatusMessage(`Erreur lors du chargement de la conversation: ${data.message}`, 'error');
        }
    } catch (error) {
        console.error('Erreur lors du chargement de la conversation:', error);
        showStatusMessage(`Erreur réseau: ${error.message}`, 'error');
    }
}

/**
 * Envoie un message au chatbot.
 */
async function sendMessage() {
    if (!chatInputEl) return;

    const message = chatInputEl.value.trim();
    if (!message) {
        showStatusMessage("Veuillez taper un message.", 'error');
        return;
    }

    displayMessage('user', message);
    chatInputEl.value = '';
    sendChatMessageBtn.disabled = true;

    try {
        const response = await fetch(`${API_BASE_URL}/api/conversations/${currentConversationId}/message`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: message })
        });

        const data = await response.json();

        if (response.ok) {
            displayMessage('assistant', data.response);
            showStatusMessage('Message envoyé, réponse reçue.', 'success');
            fetchConversations(); // Rafraîchir la liste pour les nouvelles UTMi ou titre
        } else {
            showStatusMessage(`Erreur: ${data.message || 'Impossible d\'obtenir une réponse.'}`, 'error');
        }
    } catch (error) {
        console.error('Erreur lors de l\'envoi du message:', error);
        showStatusMessage(`Erreur réseau: ${error.message}`, 'error');
    } finally {
        sendChatMessageBtn.disabled = false;
    }
}

/**
 * Démarre une nouvelle conversation.
 */
async function startNewConversation() {
    showStatusMessage('Création d\'une nouvelle conversation...', 'info');
    currentConversationId = null; // Réinitialiser l'ID de conversation global
    if (chatMessagesEl) chatMessagesEl.innerHTML = ''; // Nettoyer l'affichage
    setActiveConversationId(null); // Désactiver la sélection dans la liste

    try {
        const response = await fetch(`${API_BASE_URL}/api/conversations/new`, {
            method: 'POST',
        });
        const data = await response.json();
        if (response.ok) {
            currentConversationId = data.conversationId;
            showStatusMessage('Nouvelle conversation créée.', 'success');
            fetchConversations(); // Rafraîchir la liste pour inclure la nouvelle conversation
        } else {
            showStatusMessage(`Erreur lors de la création d'une nouvelle conversation: ${data.message}`, 'error');
        }
    } catch (error) {
        console.error('Erreur lors de la création d\'une nouvelle conversation:', error);
        showStatusMessage(`Erreur réseau: ${error.message}`, 'error');
    }
}

/**
 * Supprime une conversation.
 * @param {string} conversationId - L'ID de la conversation à supprimer.
 */
async function deleteConversation(conversationId) {
    const confirmDelete = await showModal('confirm', 'Confirmer la suppression', 'Voulez-vous vraiment supprimer cette conversation ?');
    if (!confirmDelete) return;

    showStatusMessage('Suppression de la conversation...', 'info');
    try {
        const response = await fetch(`${API_BASE_URL}/api/conversations/${conversationId}`, {
            method: 'DELETE',
        });
        if (response.ok) {
            showStatusMessage('Conversation supprimée.', 'success');
            if (currentConversationId === conversationId) {
                currentConversationId = null; // Si la conversation active est supprimée
                if (chatMessagesEl) chatMessagesEl.innerHTML = '';
            }
            fetchConversations(); // Rafraîchir la liste
        } else {
            const data = await response.json();
            showStatusMessage(`Erreur lors de la suppression: ${data.message}`, 'error');
        }
    } catch (error) {
        console.error('Erreur lors de la suppression de la conversation:', error);
        showStatusMessage(`Erreur réseau: ${error.message}`, 'error');
    }
}


export {
    initChatUI,
    fetchConversations,
    loadConversation,
    sendMessage,
    startNewConversation,
    // deleteConversation // Exporté car utilisé par pagination.js
};