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
// Exportation retirée, la fonction est rendue globale
function initPaginationControls(listEl, prevBtn, nextBtn, pageInfoSpan, selectConversationCb, deleteConversationCb) {
    conversationListElement = listEl;
    prevPageBtn = prevBtn;
    nextPageBtn = nextBtn;
    currentPageInfoSpan = pageInfoSpan;
    selectConversationCallback = selectConversationCb;
    deleteConversationCallback = deleteConversationCb;

    // Écouteurs d'événements pour les boutons de pagination (si implémentés)
    if (prevPageBtn) prevPageBtn.addEventListener('click', () => {
        // Logique de pagination simplifiée ou à implémenter
        console.log('Previous page clicked');
    });
    if (nextPageBtn) nextPageBtn.addEventListener('click', () => {
        // Logique de pagination simplifiée ou à implémenter
        console.log('Next page clicked');
    });
}

// Exportation retirée, la fonction est rendue globale
function setConversations(data) {
    allConversations = data;
    currentPage = data.currentPage || 1;
    // Si vous aviez une pagination réelle, vous mettriez à jour totalPages ici
}

// Exportation retirée, la fonction est rendue globale
function renderChatConversationList(selectConversationCb, deleteConversationCb) {
    selectConversationCallback = selectConversationCb; // Mettre à jour les callbacks au cas où
    deleteConversationCallback = deleteConversationCb;

    if (!conversationListElement) {
        console.error('conversationListElement not found for rendering.');
        return;
    }

    conversationListElement.innerHTML = ''; // Clear previous list

    if (allConversations.conversations && allConversations.conversations.length > 0) {
        allConversations.conversations.forEach(conv => {
            const li = document.createElement('li');
            li.className = `conversation-item ${conv.id === activeConversationId ? 'active' : ''}`;
            li.dataset.id = conv.id; // Stocker l'ID sur l'élément pour référence

            // Utiliser le titre de conversation si disponible, sinon un identifiant simple
            const displayTitle = conv.title || (conv.messages && conv.messages[0] ? conv.messages[0].content.substring(0, 30) + '...' : `Conv ${conv.id.substring(0, 4)}`);
            li.innerHTML = `
                <span>${displayTitle}</span>
                <button class="delete-conversation-btn" data-id="${conv.id}" title="Supprimer la conversation"><i class="fas fa-trash-alt"></i></button>
            `;
            conversationListElement.appendChild(li);
        });
    } else {
        const li = document.createElement('li');
        li.textContent = "Aucune conversation.";
        conversationListElement.appendChild(li);
    }

    // Mettre à jour les informations de pagination (simplifié pour ce prototype)
    if (currentPageInfoSpan) currentPageInfoSpan.textContent = `Page ${currentPage}/${1}`; // Toujours 1 page pour l'instant
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

// Exportation retirée, la fonction est rendue globale
function setActiveConversationId(id) {
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