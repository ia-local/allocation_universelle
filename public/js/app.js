// public/js/app.js - Contrôleur principal client (Orchestre les modules UI)

// Importation des modules utilitaires/globaux
import { showModal, hideModal } from './modal.js'; // Assurez-vous que modal.js exporte bien ces fonctions
import { initPaginationControls, setConversations, renderChatConversationList, setActiveConversationId } from './pagination.js'; // Assurez-vous que pagination.js exporte bien ces fonctions

// Importation des modules UI spécifiques
import { initHomeUI, fetchGeneratedResponse } from './home_ui.js';
import { initChatUI, fetchConversations, loadConversation, sendMessage, startNewConversation } from './chat_ui.js';
import { initCvUI, fetchCvData, generateCv, exportCv, uploadCv } from './cv_ui.js';
import { initDashboardUI, fetchDashboardInsights } from './dashboard_ui.js';
import { initWalletUI, fetchWalletData, claimUtmi, transferUtmi, convertUtmi } from './wallet_ui.js';

// --- CONSTANTES ---
const API_BASE_URL = window.location.origin; // Par exemple: http://localhost:3000

// --- Global state for modals (Assuming modal.js functions are globally available) ---
// If modal.js and pagination.js are loaded via <script> tags before cv.js,
// their exported functions like showModal, setConversations, etc.
// should be available directly in the global scope (window).
// No 'require' needed in browser environment.

// --- État de l'application (global pour app.js et les modules UI) ---
let currentConversationId = null;
let currentChatPage = 1;
const CHAT_CONVERSATIONS_PER_PAGE = 5; // Nombre de conversations à afficher par page
let currentCvStructuredData = null; // Stocke la dernière structure JSON du CV
let globalStatusMessageElement; // Élément DOM pour les messages de statut globaux

// --- Fonctions globales de l'application ---

/**
 * Affiche un message de statut global à l'utilisateur.
 * @param {string} message - Le message à afficher.
 * @param {string} type - 'success', 'error', 'info'.
 */
function showStatusMessage(message, type = 'info') {
    if (!globalStatusMessageElement) {
        globalStatusMessageElement = document.getElementById('globalStatusMessage');
        if (!globalStatusMessageElement) {
            console.error("Élément #globalStatusMessage introuvable.");
            return;
        }
    }
    globalStatusMessageElement.textContent = message;
    globalStatusMessageElement.className = `status-message ${type} active`;

    // Supprime le message après un certain temps
    setTimeout(() => {
        globalStatusMessageElement.classList.remove('active');
    }, 5000);
}

/**
 * Gère l'affichage des différentes sections de l'application.
 * @param {string} pageId - L'ID de la section à afficher (ex: 'home', 'dashboard', 'chat').
 */
function showPage(pageId) {
    const contentSections = document.querySelectorAll('.content-section');
    const navLinks = document.querySelectorAll('.nav-link');

    contentSections.forEach(section => {
        if (section.id === pageId) {
            section.classList.add('active');
        } else {
            section.classList.remove('active');
        }
    });

    navLinks.forEach(link => {
        if (link.dataset.section === pageId) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });

    // Appeler les fonctions d'initialisation/rafraîchissement spécifiques à la page
    switch (pageId) {
        case 'home':
            initHomeUI(); // Réinitialise ou prépare l'UI de la page d'accueil
            break;
        case 'dashboard':
            fetchDashboardInsights(); // Rafraîchit les données du tableau de bord
            break;
        case 'chat':
            initChatUI(); // Réinitialise ou prépare l'UI du chat
            fetchConversations(); // Charge l'historique des conversations
            break;
        case 'cv-generator':
            initCvUI(); // Réinitialise ou prépare l'UI du générateur de CV
            fetchCvData(); // Charge les données du CV
            break;
        case 'wallet':
            initWalletUI(); // Réinitialise ou prépare l'UI du portefeuille
            fetchWalletData(); // Charge les données du portefeuille
            break;
    }
}

/**
 * Attache les écouteurs d'événements pour la navigation principale.
 */
function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    if (navLinks) {
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const pageId = e.target.dataset.section;
                if (pageId) {
                    console.log(`[Nav Click] Main nav link clicked for section: ${pageId}`);
                    showPage(pageId);
                    history.pushState(null, '', `#${pageId}`); // Met à jour l'URL sans recharger
                } else {
                    console.warn('[Nav Click] Clicked nav link has no data-section attribute.');
                }
            });
        });
    }
}

// Initialisation de l'application une fois que le DOM est complètement chargé
document.addEventListener('DOMContentLoaded', () => {
    globalStatusMessageElement = document.getElementById('globalStatusMessage'); // Initialisation ici
    setupNavigation();

    // Initial page load based on URL hash or default to 'home'
    const initialPageId = window.location.hash.substring(1) || 'home';
    console.log(`[DOMContentLoaded] Initial page ID: ${initialPageId}`);
    showPage(initialPageId);

    console.log('[DOMContentLoaded] CVNU application initialization complete.');
});

// Exportation des fonctions globales/partagées qui pourraient être nécessaires ailleurs
export {
    API_BASE_URL,
    showStatusMessage,
    showModal, // Exporter showModal pour les modules UI qui en auraient besoin
    hideModal, // Exporter hideModal
    currentConversationId,
    currentChatPage,
    CHAT_CONVERSATIONS_PER_PAGE,
    currentCvStructuredData,
    initPaginationControls,
    setConversations,
    renderChatConversationList,
    setActiveConversationId,
    fetchGeneratedResponse, // Exporter si d'autres modules doivent déclencher cette action
    fetchConversations,
    loadConversation,
    sendMessage,
    startNewConversation,
    fetchCvData,
    generateCv,
    exportCv,
    uploadCv,
    fetchDashboardInsights,
    fetchWalletData,
    claimUtmi,
    transferUtmi,
    convertUtmi,
};