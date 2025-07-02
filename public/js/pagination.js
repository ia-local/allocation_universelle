// public/pagination.js - Mise à jour pour être un module ES

// Les éléments DOM sont passés lors de l'initialisation (généralement depuis cv.js)
let conversationListElement;
let prevPageBtn;
let nextPageBtn;
let currentPageInfoSpan;

// Variables d'état
let allConversations = { conversations: [], totalCount: 0 };
let currentPage = 1; // Le prototype ne gère pas de vraie pagination, reste à 1
let itemsPerPage = 5; // Nombre d'éléments affichés (arbitraire pour le prototype)

// Callbacks depuis la logique principale de l'application (cv.js)
let selectConversationCallback = null;
let deleteConversationCallback = null;

let activeConversationId = null; // Suivre la conversation active

/**
 * Initialise les contrôles de pagination avec les rappels et les éléments DOM nécessaires.
 * @param {HTMLElement} listEl - L'élément ul pour la liste des conversations.
 * @param {HTMLElement} prevBtn - Le bouton "page précédente".
 * @param {HTMLElement} nextBtn - Le bouton "page suivante".
 * @param {HTMLElement} pageInfoSpan - Le span affichant les informations de la page actuelle.
 * @param {function} selectConversationCb - Rappel pour sélectionner une conversation.
 * @param {function} deleteConversationCb - Rappel pour supprimer une conversation.
 */
export function initPaginationControls(listEl, prevBtn, nextBtn, pageInfoSpan, selectConversationCb, deleteConversationCb) {
    conversationListElement = listEl;
    prevPageBtn = prevBtn;
    nextPageBtn = nextBtn;
    currentPageInfoSpan = pageInfoSpan;
    selectConversationCallback = selectConversationCb;
    deleteConversationCallback = deleteConversationCb;

    // Pour le prototype, les boutons sont désactivés car il n'y a pas de vraie pagination
    if (prevPageBtn) prevPageBtn.disabled = true;
    if (nextPageBtn) nextPageBtn.disabled = true;

    console.log('[pagination.js] Pagination controls initialized.');
}

/**
 * Met à jour la liste des conversations et les informations de pagination.
 * @param {object} data - Un objet contenant `conversations` (Array) et `totalCount` (Number).
 * @param {number} [page=1] - Le numéro de page actuel à afficher.
 */
export function setConversations(data, page = 1) {
    allConversations = data;
    currentPage = page;
    renderChatConversationList();
    console.log('[pagination.js] Conversations set and list re-rendered.');
}

/**
 * Rend la liste des conversations dans le DOM.
 */
export function renderChatConversationList() {
    if (!conversationListElement) {
        console.error('conversationListElement not initialized in pagination.js');
        return;
    }

    conversationListElement.innerHTML = ''; // Nettoyer la liste existante

    // Simuler la pagination si des données existent, sinon juste les premières conversations
    // Pour ce prototype, on affiche juste les `itemsPerPage` premiers, sans vraie logique de page
    const conversationsToDisplay = allConversations.conversations.slice(0, itemsPerPage);

    if (conversationsToDisplay.length === 0) {
        const noConvLi = document.createElement('li');
        noConvLi.className = 'no-conversations';
        noConvLi.textContent = 'Aucune conversation trouvée.';
        conversationListElement.appendChild(noConvLi);
        if (currentPageInfoSpan) currentPageInfoSpan.textContent = `Page 0/0`;
        return;
    }

    conversationsToDisplay.forEach(conv => {
        const li = document.createElement('li');
        li.className = `conversation-item ${conv.id === activeConversationId ? 'active' : ''}`;
        li.dataset.id = conv.id;

        // Titre significatif simple
        const displayTitle = conv.title || (conv.messages && conv.messages[0] ? conv.messages[0].content.substring(0, 30) + '...' : `Conv ${conv.id.substring(0, 4)}`);
        li.innerHTML = `
            <span>${displayTitle}</span>
            <button class="delete-conversation-btn" data-id="${conv.id}" title="Supprimer la conversation"><i class="fas fa-trash-alt"></i></button>
        `;
        conversationListElement.appendChild(li);
    });

    // Les contrôles de pagination sont toujours désactivés pour ce prototype simple
    if (currentPageInfoSpan) currentPageInfoSpan.textContent = `Page ${currentPage}/${Math.ceil(allConversations.totalCount / itemsPerPage) || 1}`;
    if (prevPageBtn) prevPageBtn.disabled = true; // Désactivé pour le prototype
    if (nextPageBtn) nextPageBtn.disabled = true; // Désactivé pour le prototype

    // Attacher les écouteurs d'événements pour la sélection et la suppression
    conversationListElement.querySelectorAll('.conversation-item').forEach(item => {
        item.addEventListener('click', (event) => {
            if (!event.target.closest('.delete-conversation-btn')) { // Ne pas déclencher si c'est le bouton supprimer
                if (selectConversationCallback) selectConversationCallback(item.dataset.id);
            }
        });
    });

    conversationListElement.querySelectorAll('.delete-conversation-btn').forEach(btn => {
        btn.addEventListener('click', (event) => {
            event.stopPropagation(); // Empêcher l'événement de click de l'élément parent
            if (deleteConversationCallback) deleteConversationCallback(btn.dataset.id);
        });
    });
}

/**
 * Définit la conversation active et met à jour l'affichage.
 * @param {string} id - L'ID de la conversation à activer.
 */
export function setActiveConversationId(id) {
    activeConversationId = id;
    if (conversationListElement) {
        conversationListElement.querySelectorAll('.conversation-item').forEach(item => {
            if (item.dataset.id === activeConversationId) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }
}