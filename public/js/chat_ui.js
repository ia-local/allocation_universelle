// public/js/chat_ui.js
// Ce module gère la logique spécifique à la page de chat.

// Importation des modules nécessaires depuis app.js
import {
    API_BASE_URL,
    showStatusMessage,
    setCurrentConversation,
    getCurrentChatPage,
    setChatPage,
    CHAT_CONVERSATIONS_PER_PAGE,
    setConversations,
    renderChatConversationList,
    initPaginationControls // <--- Correction ici : Ajout de l'import manquant
} from './app.js';

let conversationListElement;
let chatMessagesDisplay;
let chatInput;
let sendChatMessageBtn;
let startNewConversationBtn;
let chatPaginationContainer;
let currentChatContext = { conversationId: null };

/**
 * @function setChatContext
 * @description Met à jour le contexte du chat (ID de conversation).
 * @param {object} context - Objet avec les propriétés de contexte (ex: { conversationId: '...' }).
 */
export function setChatContext(context) {
    if (context.conversationId !== undefined) {
        currentChatContext.conversationId = context.conversationId;
        console.log(`[chat_ui] Contexte de conversation mis à jour: ${currentChatContext.conversationId}`);
    }
}

/**
 * @function initializeChatUI
 * @description Initialise les éléments DOM et les écouteurs pour la page de chat.
 * Appelé par app.js quand la page 'chat' est affichée.
 */
export function initializeChatUI() {
    console.log('[chat_ui] Initialisation de l\'UI du chat.');
    conversationListElement = document.getElementById('conversation-list');
    chatMessagesDisplay = document.getElementById('chat-messages-display');
    chatInput = document.getElementById('chat-input');
    sendChatMessageBtn = document.getElementById('send-chat-message-btn');
    startNewConversationBtn = document.getElementById('start-new-conversation-btn');
    chatPaginationContainer = document.getElementById('chat-pagination-container');

    if (conversationListElement && chatMessagesDisplay && chatInput && sendChatMessageBtn && startNewConversationBtn) {
        // Supprime les écouteurs existants pour éviter les doublons
        sendChatMessageBtn.removeEventListener('click', sendMessage);
        startNewConversationBtn.removeEventListener('click', startNewConversation);
        chatInput.removeEventListener('keypress', handleKeyPress);

        // Ajoute les nouveaux écouteurs
        sendChatMessageBtn.addEventListener('click', sendMessage);
        startNewConversationBtn.addEventListener('click', startNewConversation);
        chatInput.addEventListener('keypress', handleKeyPress);
        console.log('[chat_ui] Écouteurs d\'événements du chat ajoutés.');
    } else {
        console.error('[chat_ui] Un ou plusieurs éléments DOM nécessaires pour le chat sont manquants. Vérifiez index.html.');
    }

    // Réinitialise l'affichage au chargement de la page chat
    if (chatMessagesDisplay) {
        chatMessagesDisplay.innerHTML = '';
    }
    if (chatInput) {
        chatInput.value = '';
    }
    currentChatContext.conversationId = null; // Réinitialise l'ID de conversation à l'initialisation de l'UI
    setCurrentConversation(null); // Met à jour l'état global via app.js
}

/**
 * @function handleKeyPress
 * @description Permet d'envoyer un message avec la touche Entrée.
 * @param {KeyboardEvent} e - L'événement clavier.
 */
function handleKeyPress(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
}

/**
 * @function fetchConversations
 * @description Charge la liste des conversations depuis le serveur.
 */
export async function fetchConversations() {
    console.log('[chat_ui] Chargement des conversations...');
    showStatusMessage('Chargement des conversations...', 'info');
    try {
        const page = getCurrentChatPage();
        const limit = CHAT_CONVERSATIONS_PER_PAGE;
        const response = await fetch(`${API_BASE_URL}/api/conversations?page=${page}&limit=${limit}`);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status} - ${errorText || response.statusText}`);
        }
        const data = await response.json();
        console.log('[chat_ui] Conversations reçues:', data);

        if (data && data.conversations && Array.isArray(data.conversations)) {
            setConversations(data.conversations, data.totalPages); // Met à jour l'état global des conversations dans pagination.js
            renderChatConversationList(data.conversations, loadConversation); // Rend la liste des conversations
            // Correction : initPaginationControls est maintenant importé
            initPaginationControls(data.totalPages, getCurrentChatPage(), (newPage) => {
                setChatPage(newPage);
                fetchConversations();
            });
            showStatusMessage('Conversations chargées.', 'success');
        } else {
            if (conversationListElement) {
                conversationListElement.innerHTML = '<p>Aucune conversation trouvée.</p>';
            }
            showStatusMessage('Aucune conversation trouvée.', 'info');
        }
    } catch (error) {
    console.error('[chat_ui] Erreur lors du chargement des conversations:', error);
    // Vérifier si l'erreur est due à une absence de conversation (par exemple, 404)
    if (error.message.includes('404')) {
        showStatusMessage('Aucune conversation trouvée sur le serveur. Démarrez une nouvelle conversation !', 'info');
        if (conversationListElement) {
            conversationListElement.innerHTML = '<p>Aucune conversation. Démarrez-en une nouvelle !</p>';
        }
    } else {
        showStatusMessage(`Erreur lors du chargement des conversations: ${error.message}`, 'error');
    }
}
}

/**
 * @function loadConversation
 * @description Charge les messages d'une conversation spécifique.
 * @param {string} conversationId - L'ID de la conversation à charger.
 */
export async function loadConversation(conversationId) {
    console.log(`[chat_ui] Chargement de la conversation: ${conversationId}`);
    showStatusMessage('Chargement de la conversation...', 'info');
    if (chatMessagesDisplay) {
        chatMessagesDisplay.innerHTML = '<p>Chargement des messages...</p>';
    }
    setCurrentConversation(conversationId); // Met à jour l'état global et propage l'ID

    try {
        const response = await fetch(`${API_BASE_URL}/api/conversations/${conversationId}`);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status} - ${errorText || response.statusText}`);
        }
        const conversation = await response.json();
        console.log('[chat_ui] Conversation chargée:', conversation);

        if (conversation && conversation.messages && Array.isArray(conversation.messages)) {
            if (chatMessagesDisplay) {
                chatMessagesDisplay.innerHTML = ''; // Vide l'affichage
                conversation.messages.forEach(msg => {
                    const msgElement = document.createElement('div');
                    msgElement.classList.add('chat-message', msg.role);
                    msgElement.innerHTML = `<strong>${msg.role === 'user' ? 'Vous' : 'IA'}:</strong> ${msg.content}`;
                    chatMessagesDisplay.appendChild(msgElement);
                });
                chatMessagesDisplay.scrollTop = chatMessagesDisplay.scrollHeight; // Scroll vers le bas
            }
            showStatusMessage('Conversation chargée.', 'success');
        } else {
            if (chatMessagesDisplay) {
                chatMessagesDisplay.innerHTML = '<p>Aucun message dans cette conversation.</p>';
            }
            showStatusMessage('Conversation vide.', 'info');
        }
    } catch (error) {
        console.error('[chat_ui] Erreur lors du chargement de la conversation:', error);
        showStatusMessage(`Erreur lors du chargement de la conversation: ${error.message}`, 'error');
    }
}

/**
 * @function sendMessage
 * @description Gère l'envoi d'un nouveau message dans la conversation actuelle.
 */
export async function sendMessage() {
    const messageContent = chatInput.value.trim();
    if (messageContent === '') {
        showStatusMessage('Veuillez taper un message.', 'info');
        return;
    }

    const currentConvId = currentChatContext.conversationId;
    console.log(`[chat_ui] Envoi du message dans conversation ${currentConvId || 'nouvelle'}: ${messageContent}`);
    showStatusMessage('Envoi du message...', 'info');

    // Afficher le message de l'utilisateur immédiatement
    const userMsgElement = document.createElement('div');
    userMsgElement.classList.add('chat-message', 'user');
    userMsgElement.innerHTML = `<strong>Vous:</strong> ${messageContent}`;
    if (chatMessagesDisplay) {
        chatMessagesDisplay.appendChild(userMsgElement);
        chatMessagesDisplay.scrollTop = chatMessagesDisplay.scrollHeight;
    }
    if (chatInput) {
        chatInput.value = ''; // Efface l'input
    }

    try {
        const endpoint = currentConvId ? `/api/conversations/${currentConvId}/messages` : `/api/conversations`;
        const method = 'POST';
        const body = currentConvId ? { content: messageContent } : { initialMessage: messageContent };

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            // Tente de lire l'erreur du corps de la réponse si disponible
            const errorData = await response.json().catch(() => response.text());
            const errorMessage = typeof errorData === 'object' && errorData.message ? errorData.message : errorData;
            throw new Error(`Erreur HTTP: ${response.status} - ${errorMessage}`);
        }

        const data = await response.json();
        console.log('[chat_ui] Réponse de l\'API chat:', data);

        // Si c'est une nouvelle conversation, met à jour l'ID global
        if (!currentConvId && data.conversationId) {
            setCurrentConversation(data.conversationId);
            showStatusMessage('Nouvelle conversation démarrée.', 'success');
            fetchConversations(); // Rafraîchit la liste des conversations
        } else {
            showStatusMessage('Message envoyé et réponse reçue.', 'success');
        }

        // Ajouter la réponse de l'IA (si disponible)
        if (data && data.aiResponse) {
            const aiMsgElement = document.createElement('div');
            aiMsgElement.classList.add('chat-message', 'assistant');
            aiMsgElement.innerHTML = `<strong>IA:</strong> ${data.aiResponse}`;
            if (chatMessagesDisplay) {
                chatMessagesDisplay.appendChild(aiMsgElement);
                chatMessagesDisplay.scrollTop = chatMessagesDisplay.scrollHeight;
            }
        }

    } catch (error) {
        console.error('[chat_ui] Erreur lors de l\'envoi du message:', error);
        showStatusMessage(`Échec de l'envoi du message: ${error.message}`, 'error');
        if (chatInput) {
            chatInput.value = messageContent; // Ré-ajouter le message pour modification
        }
    }
}

/**
 * @function startNewConversation
 * @description Démarre une nouvelle conversation en réinitialisant l'UI.
 */
export async function startNewConversation() {
    console.log('[chat_ui] Démarrage d\'une nouvelle conversation.');
    showStatusMessage('Démarrage d\'une nouvelle conversation...', 'info');
    if (chatMessagesDisplay) {
        chatMessagesDisplay.innerHTML = '';
    }
    if (chatInput) {
        chatInput.value = '';
    }
    setCurrentConversation(null); // Indique qu'il n'y a plus de conversation active
    showStatusMessage('Nouvelle conversation prête. Envoyez votre premier message.', 'info');
    fetchConversations(); // Rafraîchit la liste des conversations (pour effacer la sélection active)
}