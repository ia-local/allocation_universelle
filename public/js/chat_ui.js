// public/js/chat_ui.js
import { 
    API_BASE_URL, 
    showStatusMessage, 
    setCurrentConversation, 
    getCurrentConversationId, 
    setConversations,
    setChatPage,
    getCurrentChatPage,
    CHAT_CONVERSATIONS_PER_PAGE,
    initPaginationControls,
    renderChatConversationList // Cette fonction est importée depuis app.js
} from './app.js';

// --- Éléments DOM du Chat (déclarés au niveau du module) ---
let chatMessagesDisplay;
let chatPromptInput;
let sendChatMessageBtn;
let conversationListElement; // Cet élément est également géré dans app.js pour le rendu global
let startNewConversationBtn;
let chatPaginationContainer;
// Pas besoin de currentChatConversationId ici, il est géré dans app.js

// --- Fonctions d'Initialisation ---
export function initializeChatUI() {
    console.log('[chat_ui] Initialisation de l\'UI du Chat.');

    // Récupération des éléments DOM
    chatMessagesDisplay = document.getElementById('chat-messages-display');
    chatPromptInput = document.getElementById('chat-prompt-input');
    sendChatMessageBtn = document.getElementById('send-chat-message-btn');
    conversationListElement = document.getElementById('conversation-list'); // Assurez-vous que cet ID est dans index.html
    startNewConversationBtn = document.getElementById('start-new-conversation-btn');
    chatPaginationContainer = document.getElementById('chat-pagination-container');

    // Logs pour vérifier si les éléments sont trouvés
    console.log('[chat_ui] chatMessagesDisplay:', chatMessagesDisplay);
    console.log('[chat_ui] chatPromptInput:', chatPromptInput);
    console.log('[chat_ui] sendChatMessageBtn:', sendChatMessageBtn);
    console.log('[chat_ui] conversationListElement (pour chat_ui):', conversationListElement);
    console.log('[chat_ui] startNewConversationBtn:', startNewConversationBtn);
    console.log('[chat_ui] chatPaginationContainer:', chatPaginationContainer);

    // Initialiser l'affichage
    if (chatMessagesDisplay) {
        chatMessagesDisplay.innerHTML = '<p>Envoyez un message pour commencer ou sélectionnez une conversation.</p>';
    }
    if (chatPromptInput) {
        chatPromptInput.value = '';
    }

    // Attachement des écouteurs d'événements
    if (sendChatMessageBtn) {
        sendChatMessageBtn.removeEventListener('click', handleSendMessage);
        sendChatMessageBtn.addEventListener('click', handleSendMessage);
        console.log('[chat_ui] Écouteur d\'événements pour le bouton d\'envoi de message ajouté.');
    } else {
        console.warn('[chat_ui] Bouton d\'envoi de message non trouvé (send-chat-message-btn).');
    }

    if (chatPromptInput) {
        chatPromptInput.removeEventListener('keypress', handlePromptKeyPress);
        chatPromptInput.addEventListener('keypress', handlePromptKeyPress);
        console.log('[chat_ui] Écouteur d\'événements de touche pour le prompt du chat ajouté.');
    } else {
        console.warn('[chat_ui] Champ de prompt du chat non trouvé (chat-prompt-input).');
    }

    if (startNewConversationBtn) {
        startNewConversationBtn.removeEventListener('click', startNewConversation);
        startNewConversationBtn.addEventListener('click', startNewConversation);
        console.log('[chat_ui] Écouteur d\'événements pour le bouton "Nouvelle Conversation" ajouté.');
    } else {
        console.warn('[chat_ui] Bouton "Nouvelle Conversation" non trouvé (start-new-conversation-btn).');
    }
}

// Gère l'envoi du prompt avec la touche "Entrée"
function handlePromptKeyPress(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault(); // Empêche le saut de ligne
        handleSendMessage();
    }
}

// --- Fonctions d'API ---

export async function fetchConversations(page = 1) {
    console.log(`[chat_ui] Récupération des conversations pour la page ${page}...`);
    showStatusMessage('Chargement des conversations...', 'info');
    try {
        const response = await fetch(`${API_BASE_URL}/api/conversations?page=${page}&limit=${CHAT_CONVERSATIONS_PER_PAGE}`);
        if (!response.ok) {
            const errorData = await response.json().catch(() => response.text());
            throw new Error(`HTTP error! status: ${response.status} - ${JSON.stringify(errorData)}`);
        }
        const data = await response.json();
        console.log('[chat_ui] Conversations reçues:', data);

        // Mettre à jour l'état global et rendre la liste
        setConversations(data.conversations, data.totalPages);
        setChatPage(data.currentPage);
        
        // Appel à la fonction de rendu qui est dans app.js et qui gère le DOM
        renderChatConversationList(data.conversations, loadConversation); 

        // Initialiser la pagination
        initPaginationControls(data.totalPages, data.currentPage, fetchConversations);

        showStatusMessage('Conversations chargées avec succès !', 'success');

        // Si une conversation est déjà active (ex: après un rechargement), la recharger
        if (getCurrentConversationId()) {
            loadConversation(getCurrentConversationId());
        } else if (data.conversations.length > 0) {
            // Sinon, charger la première conversation si elle existe
            loadConversation(data.conversations[0]._id);
        }

    } catch (error) {
        console.error('[chat_ui] Erreur lors de la récupération des conversations:', error);
        if (conversationListElement) { // Utilise conversationListElement défini dans chat_ui
            conversationListElement.innerHTML = `<p>Erreur: ${error.message}</p>`;
        }
        showStatusMessage(`Erreur lors du chargement des conversations: ${error.message}`, 'error');
    }
}

export async function loadConversation(conversationId) {
    console.log(`[chat_ui] Chargement de la conversation: ${conversationId}`);
    showStatusMessage('Chargement de la conversation...', 'info');
    setCurrentConversation(conversationId); // Met à jour l'ID de la conversation active

    try {
        const response = await fetch(`${API_BASE_URL}/api/conversations/${conversationId}`);
        if (!response.ok) {
            const errorData = await response.json().catch(() => response.text());
            throw new Error(`HTTP error! status: ${response.status} - ${JSON.stringify(errorData)}`);
        }
        const data = await response.json();
        console.log('[chat_ui] Conversation chargée:', data);
        
        // CORRECTION MAJEURE ICI : Il s'agit d'un APPEL de fonction, pas une déclaration/exportation.
        renderChatMessages(data.conversation.messages || []); // Appel correct de la fonction
        
        showStatusMessage('Conversation chargée !', 'success');
    } catch (error) {
        console.error(`[chat_ui] Erreur lors du chargement de la conversation ${conversationId}:`, error);
        if (chatMessagesDisplay) {
            chatMessagesDisplay.innerHTML = `<p>Erreur lors du chargement: ${error.message}</p>`;
        }
        showStatusMessage(`Erreur lors du chargement de la conversation: ${error.message}`, 'error');
    }
}

export async function startNewConversation() {
    console.log('[chat_ui] Démarrage d\'une nouvelle conversation.');
    showStatusMessage('Démarrage d\'une nouvelle conversation...', 'info');
    setCurrentConversation(null); // Réinitialise la conversation active

    if (chatMessagesDisplay) {
        chatMessagesDisplay.innerHTML = '<p>Nouvelle conversation. Envoyez votre premier message !</p>';
    }
    if (chatPromptInput) {
        chatPromptInput.value = '';
        chatPromptInput.focus();
    }
    // Nettoyer la surbrillance de la liste
    if (conversationListElement) {
        document.querySelectorAll('.conversation-item').forEach(item => item.classList.remove('active'));
    }

    // Pas besoin d'appeler l'API ici, le premier message en créera une.
    showStatusMessage('Nouvelle conversation prête !', 'success');
}


export async function handleSendMessage() {
    console.log('[chat_ui] handleSendMessage appelé.');
    if (!chatPromptInput) {
        console.error('[chat_ui] chatPromptInput est null/undefined. Impossible d\'envoyer le message.');
        showStatusMessage('Erreur interne: Champ de message du chat non initialisé.', 'error');
        return;
    }

    const messageContent = chatPromptInput.value.trim();
    if (!messageContent) {
        showStatusMessage('Veuillez entrer un message.', 'warning');
        return;
    }

    chatPromptInput.value = ''; // Efface le champ de saisie
    showStatusMessage('Envoi du message...', 'info');

    // Affiche le message de l'utilisateur immédiatement
    addMessageToDisplay('user', messageContent);

    const conversationId = getCurrentConversationId();
    console.log(`[chat_ui] Envoi du message pour la conversation ${conversationId || 'nouvelle'} :`, messageContent);

    try {
        const response = await fetch(`${API_BASE_URL}/api/conversations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({
                conversationId: conversationId, // Sera null si nouvelle conversation
                message: messageContent
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => response.text());
            throw new Error(`HTTP error! status: ${response.status} - ${JSON.stringify(errorData)}`);
        }

        const data = await response.json();
        console.log('[chat_ui] Réponse de l\'API chat:', data);

        // Si c'est une nouvelle conversation, mettez à jour l'ID actif
        if (!conversationId && data.conversationId) {
            setCurrentConversation(data.conversationId);
            // Re-charger la liste des conversations pour inclure la nouvelle
            fetchConversations(getCurrentChatPage());
        } else if (conversationId && data.conversation) {
            // Mettre à jour l'affichage des messages pour la conversation existante
            renderChatMessages(data.conversation.messages); // Assurez-vous que data.conversation est bien l'objet entier de conversation
        }

        // Ajouter la réponse de l'IA (si présente)
        if (data.aiResponse) {
            addMessageToDisplay('ai', data.aiResponse);
        }
        showStatusMessage('Message envoyé et réponse reçue !', 'success');

    } catch (error) {
        console.error('[chat_ui] Erreur lors de l\'envoi du message:', error);
        addMessageToDisplay('error', `Erreur: ${error.message}`);
        showStatusMessage(`Erreur lors de l'envoi du message: ${error.message}`, 'error');
    }
}

// --- Fonctions de Rendu UI ---

function addMessageToDisplay(sender, message) {
    if (!chatMessagesDisplay) {
        console.error('[chat_ui] chatMessagesDisplay est null/undefined. Impossible d\'ajouter le message.');
        return;
    }
    const messageElement = document.createElement('div');
    messageElement.classList.add('chat-message', `${sender}-message`);
    messageElement.textContent = message; // Utilisez textContent pour éviter les problèmes d'injection HTML
    chatMessagesDisplay.appendChild(messageElement);
    chatMessagesDisplay.scrollTop = chatMessagesDisplay.scrollHeight; // Scroll vers le bas
}

// La fonction renderChatMessages est correctement déclarée et exportée ici.
export function renderChatMessages(messages) {
    if (!chatMessagesDisplay) {
        console.error('[chat_ui] chatMessagesDisplay est null/undefined. Impossible de rendre le chat.');
        return;
    }
    chatMessagesDisplay.innerHTML = ''; // Nettoyer l'affichage

    if (!messages || messages.length === 0) {
        chatMessagesDisplay.innerHTML = '<p>Commencez la conversation !</p>';
        return;
    }

    messages.forEach(msg => {
        addMessageToDisplay(msg.role === 'user' ? 'user' : 'ai', msg.content);
    });
}