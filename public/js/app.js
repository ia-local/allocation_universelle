// public/js/app.js
// Point d'entrée principal de l'application. Gère la navigation et l'état global.

// Importations des modules UI pour chaque section
import { initializeHomeUI, sendHomePrompt } from './home_ui.js';
import { initializeDashboardUI, fetchDashboardInsights } from './dashboard_ui.js';
import { initializeChatUI, fetchConversations, loadConversation, sendMessage, startNewConversation } from './chat_ui.js';
import { initializeCvUI, renderCv, exportCVData } from './cv_ui.js';
import { initializeWalletUI, fetchWalletBalance } from './wallet_ui.js';

// --- Constantes Globales ---
export const API_BASE_URL = 'http://localhost:3000'; // URL de base de ton API backend
export const CHAT_CONVERSATIONS_PER_PAGE = 5; // Nombre de conversations à afficher par page

// --- État Global de l'Application ---
let currentSection = 'home'; // Section actuellement affichée
let globalStatusMessageElement; // Élément DOM pour les messages de statut
let currentConversationId = null; // ID de la conversation de chat active
let chatCurrentPage = 1; // Page actuelle de la liste des conversations
let chatTotalPages = 1; // Nombre total de pages de conversations
let allConversations = []; // Cache pour toutes les conversations (si nécessaire)
let cvStructuredData = null; // Stocke les données structurées du CV

// --- Getters et Setters pour l'état Global (Exports) ---

/**
 * @function showStatusMessage
 * @description Affiche un message de statut global à l'utilisateur.
 * @param {string} message - Le message à afficher.
 * @param {string} type - Le type de message ('success', 'error', 'info', 'warning').
 */
export function showStatusMessage(message, type = 'info') {
    if (globalStatusMessageElement) {
        globalStatusMessageElement.textContent = message;
        globalStatusMessageElement.className = `status-message ${type}`; // Met à jour les classes pour le style
        globalStatusMessageElement.style.display = 'block'; // Affiche le message
        setTimeout(() => {
            globalStatusMessageElement.style.display = 'none'; // Cache le message après un délai
        }, 5000); // 5 secondes
    } else {
        console.log(`[Status ${type.toUpperCase()}]: ${message}`);
    }
}

/**
 * @function setCurrentConversation
 * @description Définit la conversation de chat actuellement sélectionnée.
 * @param {string|null} id - L'ID de la conversation ou null si aucune sélection.
 */
export function setCurrentConversation(id) {
    currentConversationId = id;
    console.log(`[App State] Conversation ID set to: ${currentConversationId}`);
    // Ici, tu pourrais ajouter une logique pour mettre en évidence la conversation dans la liste
    // et désactiver/activer certains éléments de l'UI du chat si nécessaire.
    // Par exemple, passer l'ID au module chat_ui:
    // No need to call initializeChatUI here, as it's meant for initial setup.
    // loadConversation will be called if id is provided.
    if (id) {
        loadConversation(id);
    }
}

/**
 * @function setChatPage
 * @description Définit la page actuelle de la liste des conversations du chat.
 * @param {number} page - Le numéro de la page.
 */
export function setChatPage(page) {
    chatCurrentPage = page;
}

/**
 * @function getCurrentChatPage
 * @description Récupère la page actuelle de la liste des conversations du chat.
 * @returns {number} La page actuelle.
 */
export function getCurrentChatPage() {
    return chatCurrentPage;
}

/**
 * @function setConversations
 * @description Stocke la liste des conversations et le nombre total de pages.
 * @param {Array} conversations - La liste des conversations.
 * @param {number} totalPages - Le nombre total de pages.
 */
export function setConversations(conversations, totalPages) {
    allConversations = conversations;
    chatTotalPages = totalPages;
}

/**
 * @function getCvStructuredData
 * @description Récupère les données structurées du CV stockées globalement.
 * @returns {object|null} Les données du CV ou null.
 */
// Make sure to export this function
export function getCvStructuredData() { // <--- Added export here
    return cvStructuredData;
}

/**
 * @function setCvStructuredData
 * @description Stocke les données structurées du CV globalement.
 * @param {object|null} data - Les données du CV à stocker.
 */
// Make sure to export this function
export function setCvStructuredData(data) { // <--- Added export here
    cvStructuredData = data;
    renderCv(); // Appelle renderCv de cv_ui.js pour mettre à jour l'affichage
}


// --- Fonctions de Rendu / Rendu de l'UI des Modules ---

/**
 * @function renderChatConversationList
 * @description Rend la liste des conversations dans la sidebar du chat.
 * @param {Array} conversations - La liste des objets conversation.
 * @param {Function} onClickCallback - Fonction à appeler quand une conversation est cliquée.
 */
export function renderChatConversationList(conversations, onClickCallback) {
    const conversationListElement = document.getElementById('conversation-list');
    if (!conversationListElement) {
        console.error('[App] Élément #conversation-list non trouvé.');
        return;
    }

    conversationListElement.innerHTML = ''; // Vide la liste existante

    if (conversations.length === 0) {
        conversationListElement.innerHTML = '<p>Aucune conversation. Démarrez-en une nouvelle !</p>';
        return;
    }

    conversations.forEach(conv => {
        const listItem = document.createElement('li');
        listItem.classList.add('conversation-item');
        if (currentConversationId === conv._id) {
            listItem.classList.add('active'); // Ajoute une classe 'active' si c'est la conversation actuelle
        }
        listItem.dataset.conversationId = conv._id;
        listItem.textContent = conv.title || `Conversation du ${new Date(conv.createdAt).toLocaleDateString()}`;
        listItem.addEventListener('click', () => {
            onClickCallback(conv._id);
            // Met à jour la classe 'active'
            document.querySelectorAll('.conversation-item').forEach(item => item.classList.remove('active'));
            listItem.classList.add('active');
        });
        conversationListElement.appendChild(listItem);
    });
}

/**
 * @function initPaginationControls
 * @description Initialise les contrôles de pagination pour la liste des conversations.
 * @param {number} totalPages - Le nombre total de pages.
 * @param {number} currentPage - La page actuellement active.
 * @param {Function} onPageChangeCallback - Callback appelé quand une page est changée.
 */
export function initPaginationControls(totalPages, currentPage, onPageChangeCallback) {
    const paginationContainer = document.getElementById('chat-pagination-container');
    if (!paginationContainer) {
        console.error('[App] Élément #chat-pagination-container non trouvé.');
        return;
    }

    paginationContainer.innerHTML = ''; // Vide les contrôles existants

    if (totalPages <= 1) {
        return; // Pas besoin de pagination s'il y a 0 ou 1 page
    }

    // Bouton Précédent
    const prevBtn = document.createElement('button');
    prevBtn.textContent = 'Précédent';
    prevBtn.disabled = currentPage === 1;
    prevBtn.classList.add('btn', 'btn-pagination');
    prevBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            onPageChangeCallback(currentPage - 1);
        }
    });
    paginationContainer.appendChild(prevBtn);

    // Numéros de page
    for (let i = 1; i <= totalPages; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.textContent = i;
        pageBtn.classList.add('btn', 'btn-pagination');
        if (i === currentPage) {
            pageBtn.classList.add('active');
        }
        pageBtn.addEventListener('click', () => onPageChangeCallback(i));
        paginationContainer.appendChild(pageBtn);
    }

    // Bouton Suivant
    const nextBtn = document.createElement('button');
    nextBtn.textContent = 'Suivant';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.classList.add('btn', 'btn-pagination');
    nextBtn.addEventListener('click', () => {
        if (currentPage < totalPages) {
            onPageChangeCallback(currentPage + 1);
        }
    });
    paginationContainer.appendChild(nextBtn);
}


// --- Fonctions de Navigation ---

/**
 * @function showPage
 * @description Affiche la section de contenu spécifiée et initialise son UI.
 * @param {string} sectionId - L'ID de la section à afficher (ex: 'home', 'dashboard').
 */
async function showPage(sectionId) {
    console.log(`[Nav Click] Main nav link clicked for section: ${sectionId}`);
    // Cache la section actuelle
    const currentActiveSection = document.getElementById(currentSection);
    if (currentActiveSection) {
        currentActiveSection.classList.remove('active');
    }

    // Affiche la nouvelle section
    const newActiveSection = document.getElementById(sectionId);
    if (newActiveSection) {
        newActiveSection.classList.add('active');
        currentSection = sectionId; // Met à jour la section active globale

        // Initialise l'UI spécifique à la section
        switch (sectionId) {
            case 'home':
                initializeHomeUI();
                break;
            case 'dashboard':
                initializeDashboardUI();
                await fetchDashboardInsights(); // Charge les données du tableau de bord
                break;
            case 'chat':
                initializeChatUI();
                await fetchConversations(); // Charge les conversations au démarrage
                break;
            case 'cv-generator':
                initializeCvUI();
                renderCv(); // Affiche le CV s'il existe déjà au chargement
                break;
            case 'wallet':
                initializeWalletUI();
                await fetchWalletBalance(); // Charge le solde du portefeuille
                break;
            default:
                console.warn(`[App] Section inconnue: ${sectionId}`);
                break;
        }
    } else {
        console.error(`[App] Section DOM non trouvée pour l'ID: ${sectionId}`);
    }
}

// --- Initialisation de l'Application ---

document.addEventListener('DOMContentLoaded', () => {
    globalStatusMessageElement = document.getElementById('globalStatusMessage');

    // Écouteurs pour la navigation principale
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault(); // Empêche le comportement par défaut du lien
            const sectionId = e.target.dataset.section;
            if (sectionId) {
                showPage(sectionId);
            }
        });
    });

    // Afficher la page d'accueil par défaut au chargement
    showPage('home');
});