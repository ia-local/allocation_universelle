// public/js/pagination.js
// Ce module gère la pagination de la liste des conversations du chat.

let currentChatPage = 1;
let totalChatPages = 1;
let allConversations = []; // Stocke toutes les conversations récupérées
let chatPaginationContainer;
let conversationListElement;
let loadConversationCallback; // Callback pour charger une conversation spécifique

/**
 * @function initPaginationControls
 * @description Initialise les contrôles de pagination pour le chat.
 * @param {number} totalPages - Nombre total de pages.
 * @param {number} currentPage - Page actuelle.
 * @param {function} onPageChangeCallback - Fonction à appeler lors du changement de page.
 */
export function initPaginationControls(totalPages, currentPage, onPageChangeCallback) {
    totalChatPages = totalPages;
    currentChatPage = currentPage;
    chatPaginationContainer = document.getElementById('chat-pagination-container');

    if (!chatPaginationContainer) {
        console.error('[pagination] Élément #chat-pagination-container manquant.');
        return;
    }

    chatPaginationContainer.innerHTML = ''; // Vide les anciens contrôles

    if (totalPages > 1) {
        const prevBtn = document.createElement('button');
        prevBtn.textContent = 'Précédent';
        prevBtn.disabled = currentPage === 1;
        prevBtn.addEventListener('click', () => onPageChangeCallback(currentPage - 1));
        chatPaginationContainer.appendChild(prevBtn);

        const pageInfo = document.createElement('span');
        pageInfo.textContent = ` Page ${currentPage} sur ${totalPages} `;
        chatPaginationContainer.appendChild(pageInfo);

        const nextBtn = document.createElement('button');
        nextBtn.textContent = 'Suivant';
        nextBtn.disabled = currentPage === totalPages;
        nextBtn.addEventListener('click', () => onPageChangeCallback(currentPage + 1));
        chatPaginationContainer.appendChild(nextBtn);
    }
}

/**
 * @function setConversations
 * @description Met à jour la liste complète des conversations et le nombre total de pages.
 * @param {Array} conversations - La liste des conversations pour la page actuelle.
 * @param {number} totalPages - Le nombre total de pages de conversations.
 */
export function setConversations(conversations, totalPages) {
    allConversations = conversations; // Ceci devrait être les conversations de la page actuelle, pas toutes
    totalChatPages = totalPages;
}

/**
 * @function renderChatConversationList
 * @description Rend la liste des conversations dans l'UI du chat.
 * @param {Array} conversations - Liste des conversations à afficher.
 * @param {function} loadConvCallback - Callback pour charger une conversation spécifique.
 */
export function renderChatConversationList(conversations, loadConvCallback) {
    conversationListElement = document.getElementById('conversation-list');
    loadConversationCallback = loadConvCallback;

    if (!conversationListElement) {
        console.error('[pagination] Élément #conversation-list manquant.');
        return;
    }

    conversationListElement.innerHTML = '';
    if (conversations && conversations.length > 0) {
        conversations.forEach(conv => {
            const li = document.createElement('li');
            li.textContent = conv.title || `Conversation du ${new Date(conv.createdAt).toLocaleDateString()}`;
            li.dataset.conversationId = conv._id;
            li.classList.add('conversation-item');
            li.addEventListener('click', () => {
                // Supprime la classe 'active' de tous les éléments
                document.querySelectorAll('.conversation-item').forEach(item => {
                    item.classList.remove('active');
                });
                // Ajoute la classe 'active' à l'élément cliqué
                li.classList.add('active');
                loadConversationCallback(conv._id);
            });
            conversationListElement.appendChild(li);
        });
    } else {
        conversationListElement.innerHTML = '<p>Aucune conversation à afficher pour cette page.</p>';
    }
}

/**
 * @function setActiveConversationId
 * @description Met en surbrillance la conversation active dans la liste.
 * @param {string|null} conversationId - L'ID de la conversation active ou null.
 */
export function setActiveConversationId(conversationId) {
    if (!conversationListElement) return;

    document.querySelectorAll('.conversation-item').forEach(item => {
        if (item.dataset.conversationId === conversationId) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

/**
 * @function getCurrentChatPage
 * @description Renvoie la page de chat actuelle.
 * @returns {number} La page actuelle.
 */
export function getCurrentChatPage() {
    return currentChatPage;
}

/**
 * @function setChatPage
 * @description Définit la page de chat actuelle.
 * @param {number} page - Le numéro de la page.
 */
export function setChatPage(page) {
    if (page >= 1 && page <= totalChatPages) {
        currentChatPage = page;
    } else {
        console.warn(`[pagination] Tentative de définir une page invalide: ${page}. Reste sur la page actuelle: ${currentChatPage}`);
    }
}