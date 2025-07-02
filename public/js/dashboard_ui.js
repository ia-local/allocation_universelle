// public/js/dashboard_ui.js
// Ce module gère la logique spécifique à la page du tableau de bord.

import { API_BASE_URL, showStatusMessage } from './app.js';

let totalInteractionsElement; // Nouveau nom pour correspondre à l'ID HTML
let activeConversationsElement;
let cvGeneratedCountElement;
let aiResponseSuccessRateElement;
let averageAiResponseTimeElement;
let dashboardRefreshBtn; // Nouveau bouton de rafraîchissement

/**
 * @function initializeDashboardUI
 * @description Initialise les éléments DOM et les écouteurs pour la page du tableau de bord.
 * Appelé par app.js quand la page 'dashboard' est affichée.
 */
export function initializeDashboardUI() {
    console.log('[dashboard_ui] Initialisation de l\'UI du tableau de bord.');
    // Mise à jour des sélecteurs pour correspondre aux IDs dans index.html
    totalInteractionsElement = document.getElementById('total-interactions');
    activeConversationsElement = document.getElementById('active-conversations');
    cvGeneratedCountElement = document.getElementById('cv-generated-count');
    aiResponseSuccessRateElement = document.getElementById('ai-response-success-rate');
    averageAiResponseTimeElement = document.getElementById('average-ai-response-time');
    dashboardRefreshBtn = document.getElementById('dashboard-refresh-btn');

    if (dashboardRefreshBtn) {
        dashboardRefreshBtn.removeEventListener('click', fetchDashboardInsights); // Supprime pour éviter les doublons
        dashboardRefreshBtn.addEventListener('click', fetchDashboardInsights);
        console.log('[dashboard_ui] Écouteur d\'événements du bouton de rafraîchissement du tableau de bord ajouté.');
    } else {
        console.warn('[dashboard_ui] Bouton de rafraîchissement du tableau de bord non trouvé.');
    }
}

/**
 * @function fetchDashboardInsights
 * @description Récupère les données du tableau de bord depuis le backend.
 */
export async function fetchDashboardInsights() {
    console.log('[dashboard_ui] Chargement des insights du tableau de bord...');
    showStatusMessage('Chargement des données du tableau de bord...', 'info');
    try {
        const response = await fetch(`${API_BASE_URL}/api/dashboard/insights`);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status} - ${errorText || response.statusText}`);
        }
        const data = await response.json();
        console.log('[dashboard_ui] Données du tableau de bord reçues:', data);

        // Mise à jour des textContent pour correspondre aux données reçues
        if (totalInteractionsElement) totalInteractionsElement.textContent = data.totalUtmiGenerated || 'N/A'; // Utilise totalUtmiGenerated comme proxy pour interactions
        if (activeConversationsElement) activeConversationsElement.textContent = data.activeConversations || 'N/A';
        if (cvGeneratedCountElement) cvGeneratedCountElement.textContent = data.cvGeneratedCount || 'N/A';
        if (aiResponseSuccessRateElement) aiResponseSuccessRateElement.textContent = data.aiResponseSuccessRate ? `${(data.aiResponseSuccessRate * 100).toFixed(2)}%` : 'N/A';
        if (averageAiResponseTimeElement) averageAiResponseTimeElement.textContent = data.averageAiResponseTime ? `${data.averageAiResponseTime.toFixed(2)} ms` : 'N/A';

        showStatusMessage('Données du tableau de bord mises à jour.', 'success');
    } catch (error) {
        console.error('[dashboard_ui] Erreur lors du chargement des insights du tableau de bord:', error);
        showStatusMessage(`Erreur lors du chargement des données: ${error.message}`, 'error');
        // Afficher des messages d'erreur dans l'UI si les éléments existent
        if (totalInteractionsElement) totalInteractionsElement.textContent = 'Erreur';
        if (activeConversationsElement) activeConversationsElement.textContent = 'Erreur';
        if (cvGeneratedCountElement) cvGeneratedCountElement.textContent = 'Erreur';
        if (aiResponseSuccessRateElement) aiResponseSuccessRateElement.textContent = 'Erreur';
        if (averageAiResponseTimeElement) averageAiResponseTimeElement.textContent = 'Erreur';
    }
}