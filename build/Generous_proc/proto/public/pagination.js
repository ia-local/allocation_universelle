// public/pagination.js - Version simplifiée pour le prototype

// Les éléments DOM sont passés lors de l'initialisation depuis app.js
let conversationListElement;
let prevPageBtn;
let nextPageBtn;
let currentPageInfoSpan;

// Variables d'état simplifiées (le prototype ne gère pas de vraies pages ou la persistance)
let allConversations = { conversations: [], totalCount: 0 };
let currentPage = 1; // Toujours 1 pour le prototype
let itemsPerPage = 5; // Nombre d'éléments affichés (arbitraire car pas de pagination réelle)

// Callbacks depuis la logique principale de l'application (cv.js)
let selectConversationCallback = null;
let deleteConversationCallback = null;
// Pas de fetchConversationsCallback pour ce prototype, la liste est gérée en mémoire

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

    // Attacher les écouteurs d'événements pour les boutons de pagination (même si désactivés pour le prototype)
    if (prevPageBtn) {
        prevPageBtn.addEventListener('click', () => { /* Logique désactivée */ });
    }
    if (nextPageBtn) {
        nextPageBtn.addEventListener('click', () => { /* Logique désactivée */ });
    }
}

/**
 * Définit la liste complète des conversations (simulée).
 * @param {object} conversationsData - Un objet { conversations: Array, totalCount: number }.
 */
export function setConversations(conversationsData) {
    allConversations = conversationsData;
    // Dans ce prototype, nous affichons tout ou juste une partie sans réelle pagination côté client
    renderChatConversationList();
}

/**
 * Définit l'ID de la conversation active.
 * @param {string} id - L'ID de la conversation à définir comme active.
 */
export function setActiveConversationId(id) {
    activeConversationId = id;
    renderChatConversationList(); // Rafraîchir pour mettre en surbrillance l'active
}

/**
 * Rend la liste des conversations dans le DOM pour la page courante (simplifié).
 */
export function renderChatConversationList() {
    if (!conversationListElement) return;

    conversationListElement.innerHTML = ''; // Nettoyer la liste existante

    // Simule une liste limitée ou complète, sans vraie pagination côté client
    const conversationsToShow = allConversations.conversations.slice(0, itemsPerPage);

    if (conversationsToShow.length === 0) {
        const li = document.createElement('li');
        li.textContent = "Aucune conversation.";
        conversationListElement.appendChild(li);
        if (currentPageInfoSpan) currentPageInfoSpan.textContent = 'Page 0/0';
        if (prevPageBtn) prevPageBtn.disabled = true;
        if (nextPageBtn) nextPageBtn.disabled = true;
        const paginationControls = document.getElementById('conversation-pagination');
        if (paginationControls) {
            paginationControls.style.display = 'none'; // Cacher les contrôles si pas de conversations
        }
        return;
    }

    const paginationControls = document.getElementById('conversation-pagination');
    if (paginationControls) {
        paginationControls.style.display = 'flex'; // Afficher les contrôles
    }

    conversationsToShow.forEach(conv => {
        const li = document.createElement('li');
        li.className = `conversation-item ${conv.id === activeConversationId ? 'active' : ''}`;
        li.dataset.id = conv.id;
        // Utilisez le titre ou un extrait si disponible, sinon un identifiant simple
        const displayTitle = conv.title || (conv.messages && conv.messages[0] ? conv.messages[0].content.substring(0, 30) + '...' : `Conv ${conv.id.substring(0, 4)}`);
        li.innerHTML = `
            <span>${displayTitle}</span>
            <button class="delete-conversation-btn" data-id="${conv.id}" title="Supprimer la conversation"><i class="fas fa-trash-alt"></i></button>
        `;
        conversationListElement.appendChild(li);
    });

    // Les contrôles de pagination sont toujours désactivés pour ce prototype simple
    if (currentPageInfoSpan) currentPageInfoSpan.textContent = `Page ${currentPage}/${1}`; // Toujours 1 page
    if (prevPageBtn) prevPageBtn.disabled = true;
    if (nextPageBtn) nextPageBtn.disabled = true;

    // Attacher les écouteurs d'événements pour la sélection et la suppression
    conversationListElement.querySelectorAll('.conversation-item').forEach(item => {
        item.addEventListener('click', (event) => {
            if (!event.target.closest('.delete-conversation-btn')) { // Ne pas déclencher si c'est le bouton supprimer
                selectConversationCallback(item.dataset.id);
            }
        });
    });

    conversationListElement.querySelectorAll('.delete-conversation-btn').forEach(btn => {
        btn.addEventListener('click', (event) => {
            event.stopPropagation(); // Empêcher l'événement de click de l'élément parent
            deleteConversationCallback(btn.dataset.id);
        });
    });
}