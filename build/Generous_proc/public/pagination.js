// public/pagination.js

// Les éléments DOM sont passés lors de l'initialisation depuis app.js
let conversationListElement;
let prevPageBtn;
let nextPageBtn;
let currentPageInfoSpan;

// State variables
let allConversations = { conversations: [], totalCount: 0 };
let currentPage = 1;
let itemsPerPage = 5;

// Callbacks from main app logic (app.js)
let selectConversationCallback = null;
let deleteConversationCallback = null;
let fetchConversationsCallback = null;
let activeConversationId = null; // Track the currently active conversation

/**
 * Initializes pagination controls with necessary callbacks and DOM elements.
 * This function should be called by app.js when the chatroom section is activated.
 * @param {HTMLElement} listEl - The ul element for conversation list.
 * @param {HTMLElement} prevBtn - The "previous page" button element.
 * @param {HTMLElement} nextBtn - The "next page" button element.
 * @param {HTMLElement} pageInfoSpan - The span element displaying current page info.
 * @param {function} fetchConversationsCb - Callback to fetch conversations for a given page.
 * @param {function} selectConversationCb - Callback to select a conversation.
 * @param {function} deleteConversationCb - Callback to delete a conversation.
 */
export function initPaginationControls(listEl, prevBtn, nextBtn, pageInfoSpan, fetchConversationsCb, selectConversationCb, deleteConversationCb) {
    // Assign DOM elements passed from app.js
    conversationListElement = listEl;
    prevPageBtn = prevBtn;
    nextPageBtn = nextBtn;
    currentPageInfoSpan = pageInfoSpan;

    fetchConversationsCallback = fetchConversationsCb;
    selectConversationCallback = selectConversationCb;
    deleteConversationCallback = deleteConversationCb;

    // Remove existing listeners to prevent duplicates if init is called multiple times
    if (prevPageBtn) {
        prevPageBtn.removeEventListener('click', handlePrevClick);
        prevPageBtn.addEventListener('click', handlePrevClick);
    }
    if (nextPageBtn) {
        nextPageBtn.removeEventListener('click', handleNextClick);
        nextPageBtn.addEventListener('click', handleNextClick);
    }
}

/**
 * Sets the list of conversations and updates pagination state.
 * This function is called by app.js after a successful conversation fetch.
 * @param {Object} data - An object containing conversations and totalCount.
 * @param {Array} data.conversations - The list of conversations fetched for the current page.
 * @param {number} data.totalCount - The total number of conversations available.
 * @param {number} currentP - The current page number.
 * @param {number} itemsPP - Items per page.
 */
export function setConversations(data, currentP, itemsPP) {
    allConversations = data;
    currentPage = currentP;
    itemsPerPage = itemsPP;
    // totalPages calculation should happen when rendering
}

/**
 * Sets the ID of the currently active conversation.
 * Used to visually highlight the selected conversation in the list.
 * @param {string} convId - The ID of the conversation to mark as active.
 */
export function setActiveConversationId(convId) {
    activeConversationId = convId;
}

/**
 * Handles the click on the "Previous" button.
 */
function handlePrevClick() {
    if (currentPage > 1 && fetchConversationsCallback) {
        currentPage--;
        fetchConversationsCallback(currentPage, itemsPerPage);
    }
}

/**
 * Handles the click on the "Next" button.
 */
function handleNextClick() {
    const totalPages = Math.ceil(allConversations.totalCount / itemsPerPage);
    if (currentPage < totalPages && fetchConversationsCallback) {
        currentPage++;
        fetchConversationsCallback(currentPage, itemsPerPage);
    }
}

/**
 * Renders the list of conversations in the target UL element and updates pagination controls.
 * This function is called by app.js after setConversations.
 */
export function renderChatConversationList() {
    if (!conversationListElement) return;

    conversationListElement.innerHTML = ''; // Clear existing list

    if (allConversations.conversations.length === 0) {
        const li = document.createElement('li');
        li.textContent = 'Aucune conversation.';
        conversationListElement.appendChild(li);
        if (currentPageInfoSpan) currentPageInfoSpan.textContent = 'Page 0/0';
        if (prevPageBtn) prevPageBtn.disabled = true;
        if (nextPageBtn) nextPageBtn.disabled = true;
        const paginationControls = document.getElementById('conversation-pagination');
        if (paginationControls) {
            paginationControls.style.display = 'none';
        }
        return;
    }

    const paginationControls = document.getElementById('conversation-pagination');
    if (paginationControls) {
        paginationControls.style.display = 'flex';
    }

    allConversations.conversations.forEach(conv => {
        const li = document.createElement('li');
        li.className = `conversation-item ${conv.id === activeConversationId ? 'active' : ''}`;
        li.dataset.id = conv.id;
        li.innerHTML = `
            <span>${conv.title || `Conversation ${conv.createdAt ? new Date(conv.createdAt).toLocaleString() : conv.id.substring(0, 4) + '...'}`}</span>
            <button class="delete-conversation-btn" data-id="${conv.id}" title="Supprimer la conversation"><i class="fas fa-trash-alt"></i></button>
        `;
        conversationListElement.appendChild(li);
    });

    const totalPages = Math.ceil(allConversations.totalCount / itemsPerPage);
    if (currentPageInfoSpan) currentPageInfoSpan.textContent = `Page ${currentPage}/${totalPages}`;
    if (prevPageBtn) prevPageBtn.disabled = (currentPage <= 1);
    if (nextPageBtn) nextPageBtn.disabled = (currentPage >= totalPages);
}