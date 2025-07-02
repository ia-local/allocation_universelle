// public/js/app.js

// --- Configuration Globale ---
export const API_BASE_URL = 'http://localhost:3000'; // L'URL de votre backend

// --- Éléments DOM Globaux ---
const globalStatusMessageElement = document.getElementById('globalStatusMessage');
const conversationListElement = document.getElementById('conversation-list'); // Ajouté ici car utilisé par renderChatConversationList

// --- État Global de l'Application ---
let currentActiveSectionId = 'home'; // Section active par défaut
let currentConversationId = null; // ID de la conversation de chat actuellement sélectionnée
let chatCurrentPage = 1; // Page actuelle de la liste des conversations
export const CHAT_CONVERSATIONS_PER_PAGE = 5; // Nombre de conversations par page
let allConversations = []; // Stocke les conversations récupérées
let chatTotalPages = 1; // Nombre total de pages de conversations

// --- Importations des Modules UI ---
// Importez UNIQUEMENT les fonctions qui sont explicitement exportées.
import { initializeDashboardUI, fetchDashboardInsights } from './dashboard_ui.js';
import { 
    initializeChatUI, 
    fetchConversations, 
    loadConversation, 
    startNewConversation, 
    renderChatMessages, 
    handleSendMessage // handleSendMessage n'était pas exporté directement avant
} from './chat_ui.js';
import { 
    initializeCvUI, 
    handleGenerateCv, 
    handleUploadCv, 
    handleExportCv,
    fetchCurrentCv // Ajouté car fetchCurrentCv est une fonction essentielle de cv_ui
} from './cv_ui.js'; 
import { initializeWalletUI, fetchWalletBalance, handleClaimUtmi, handleTransferUtmi, handleConvertUtmi } from './wallet_ui.js'; 
import { initializeHomeUI, handleSendHomePrompt } from './home_ui.js';
import { initializeLogsUI, fetchLogs } from './logs_ui.js';

// --- Getters et Setters pour l'état global ---
export function getCurrentConversationId() {
    return currentConversationId;
}

export function setCurrentConversation(id) {
    currentConversationId = id;
}

export function getConversations() {
    return allConversations;
}

export function setConversations(conversations, totalPages) {
    allConversations = conversations;
    chatTotalPages = totalPages;
}

export function getCurrentChatPage() {
    return chatCurrentPage;
}

export function setChatPage(page) {
    chatCurrentPage = page;
}

export function getChatTotalPages() {
    return chatTotalPages;
}

// --- Fonctions Globales ---

// Fonction pour afficher les messages de statut (succès, erreur, info)
export function showStatusMessage(message, type = 'info', duration = 3000) {
    if (globalStatusMessageElement) {
        globalStatusMessageElement.textContent = message;
        globalStatusMessageElement.className = `status-message ${type}`; // Ajoute la classe de type
        globalStatusMessageElement.style.display = 'block';

        setTimeout(() => {
            globalStatusMessageElement.style.display = 'none';
        }, duration);
    }
}

// Gère la navigation entre les sections
function setupNavigation() {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault(); // Empêche le comportement de lien par défaut
            const sectionId = event.target.dataset.section;
            showSection(sectionId);
        });
    });
}

// Affiche la section demandée et cache les autres
export function showSection(sectionId) {
    console.log(`[app.js] Section affichée: ${sectionId}`);

    document.querySelectorAll('main .container > section').forEach(section => {
        section.style.display = 'none';
    });

    const activeSection = document.getElementById(sectionId);
    if (activeSection) {
        activeSection.style.display = 'block';
        currentActiveSectionId = sectionId; // Met à jour l'ID de la section active

        // Initialiser l'UI spécifique à la section si nécessaire
        switch (sectionId) {
            case 'home':
                initializeHomeUI();
                break;
            case 'dashboard':
                initializeDashboardUI();
                fetchDashboardInsights();
                break;
            case 'chat':
                initializeChatUI();
                // Assurez-vous que fetchConversations est appelé après l'initialisation de l'UI
                fetchConversations(chatCurrentPage); // Récupère les conversations pour la page actuelle
                break;
            case 'cv-generator':
                initializeCvUI();
                fetchCurrentCv(); // Charge le CV existant si applicable
                break;
            case 'wallet':
                initializeWalletUI();
                fetchWalletBalance();
                break;
            case 'logs':
                initializeLogsUI();
                fetchLogs();
                break;
            // Ajoutez d'autres cas pour vos sections
            default:
                console.warn(`Section inconnue: ${sectionId}`);
                break;
        }
    } else {
        console.error(`Section avec l'ID '${sectionId}' non trouvée.`);
    }
}

// Fonction de rendu de la liste de conversations pour le chat
export function renderChatConversationList(conversations, loadConvCallback) {
    if (!conversationListElement) {
        console.error('[app.js] conversationListElement non trouvé. Impossible de rendre la liste des conversations.');
        return;
    }
    conversationListElement.innerHTML = ''; // Nettoyer l'affichage

    if (!conversations || conversations.length === 0) {
        conversationListElement.innerHTML = '<p>Aucune conversation. Démarrez-en une nouvelle !</p>';
        return;
    }

    conversations.forEach(conv => {
        const listItem = document.createElement('li');
        listItem.classList.add('conversation-item');
        if (conv._id === currentConversationId) {
            listItem.classList.add('active'); // Mettre en surbrillance la conversation active
        }

        const title = conv.title || (conv.messages && conv.messages[0] ? conv.messages[0].content.substring(0, 40) + '...' : 'Nouvelle conversation');
        const date = conv.updatedAt ? new Date(conv.updatedAt).toLocaleDateString() : 'Date inconnue';

        listItem.innerHTML = `
            <span class="conversation-title">${title}</span>
            <span class="conversation-date">${date}</span>
        `;
        listItem.addEventListener('click', () => {
            // Supprime la classe 'active' de tous les éléments
            document.querySelectorAll('.conversation-item').forEach(item => item.classList.remove('active'));
            // Ajoute la classe 'active' à l'élément cliqué
            listItem.classList.add('active');
            loadConvCallback(conv._id);
        });
        conversationListElement.appendChild(listItem);
    });
}

// Fonction pour initialiser les contrôles de pagination (pour le chat ou d'autres listes paginées)
export function initPaginationControls(totalPages, currentPage, fetchFunction) {
    const paginationContainer = document.getElementById('chat-pagination-container');
    if (!paginationContainer) {
        console.warn('[app.js] Conteneur de pagination non trouvé (chat-pagination-container).');
        return;
    }
    paginationContainer.innerHTML = ''; // Nettoyer

    if (totalPages <= 1) {
        return; // Pas besoin de pagination s'il y a 1 page ou moins
    }

    for (let i = 1; i <= totalPages; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.classList.add('page-btn');
        if (i === currentPage) {
            pageBtn.classList.add('active');
        }
        pageBtn.textContent = i;
        pageBtn.addEventListener('click', () => {
            fetchFunction(i);
        });
        paginationContainer.appendChild(pageBtn);
    }
}


// --- Initialisation de l'Application ---
document.addEventListener('DOMContentLoaded', () => {
    console.log('[app.js] DOM entièrement chargé.');
    setupNavigation();
    // Afficher la section d'accueil au chargement initial
    showSection('home');
});