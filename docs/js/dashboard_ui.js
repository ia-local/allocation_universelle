// public/js/dashboard_ui.js
// Ce module gère la logique spécifique à la page du tableau de bord.

import { API_BASE_URL, showStatusMessage } from './app.js';

let totalInteractionsElement;
let chatInteractionsElement; // Changé de activeConversationsElement pour correspondre à srv.js
let cvGeneratedCountElement;
let aiSummaryElement; // Nouvel élément pour l'aiSummary
let dashboardRefreshBtn;

/**
 * @function initializeDashboardUI
 * @description Initialise les éléments DOM et les écouteurs pour la page du tableau de bord.
 * Appelé par app.js quand la page 'dashboard' est affichée.
 */
export function initializeDashboardUI() {
    console.log('[dashboard_ui] Initialisation de l\'UI du tableau de bord.');
    // Mise à jour des sélecteurs pour correspondre aux IDs dans index.html
    totalInteractionsElement = document.getElementById('total-interactions'); // ID pour totalInteractions
    chatInteractionsElement = document.getElementById('chat-interactions'); // ID pour chatInteractions
    cvGeneratedCountElement = document.getElementById('cv-generated-count'); // ID pour cvGenerations
    aiSummaryElement = document.getElementById('ai-summary-content'); // ID pour l'élément affichant le résumé IA
    dashboardRefreshBtn = document.getElementById('dashboard-refresh-btn');

    if (dashboardRefreshBtn) {
        dashboardRefreshBtn.removeEventListener('click', fetchDashboardInsights); // Supprime pour éviter les doublons
        dashboardRefreshBtn.addEventListener('click', fetchDashboardInsights);
        console.log('[dashboard_ui] Écouteur d\'événements du bouton de rafraîchissement du tableau de bord ajouté.');
    } else {
        console.warn('[dashboard_ui] Bouton de rafraîchissement du tableau de bord non trouvé.');
    }
    // Appel initial pour charger les insights lors de l'initialisation
    fetchDashboardInsights();
}

/**
 * @function fetchDashboardInsights
 * @description Récupère les données du tableau de bord depuis le backend.
 */
export async function fetchDashboardInsights() {
    console.log('[dashboard_ui] Chargement des insights du tableau de bord...');
    showStatusMessage('Chargement des données du tableau de bord...', 'info');
    try {
        // --- CORRECTION ICI : L'URL de l'API a été changée pour correspondre à srv.js ---
        const response = await fetch(`${API_BASE_URL}/api/dashboard`);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status} - ${errorText || response.statusText}`);
        }
        const data = await response.json();
        console.log('[dashboard_ui] Données du tableau de bord reçues:', data);

        // Mise à jour des textContent pour correspondre aux données reçues de srv.js
        if (totalInteractionsElement) totalInteractionsElement.textContent = data.totalInteractions !== undefined ? data.totalInteractions : 'N/A';
        if (chatInteractionsElement) chatInteractionsElement.textContent = data.chatInteractions !== undefined ? data.chatInteractions : 'N/A';
        if (cvGeneratedCountElement) cvGeneratedCountElement.textContent = data.cvGenerations !== undefined ? data.cvGenerations : 'N/A';
        
        // Affichage du résumé IA
        if (aiSummaryElement) {
            aiSummaryElement.innerHTML = data.aiSummary ? `<p>${data.aiSummary.replace(/\n/g, '<br>')}</p>` : '<p>Aucun résumé IA disponible.</p>';
        }

        // Les champs 'aiResponseSuccessRate' et 'averageAiResponseTime' ne sont plus renvoyés par srv.js directement.
        // Si ces données sont toujours souhaitées, elles devront être calculées et renvoyées par le backend.
        // Pour l'instant, je les marque comme N/A ou les supprime si elles ne sont pas nécessaires dans l'UI.
        // if (aiResponseSuccessRateElement) aiResponseSuccessRateElement.textContent = 'N/A';
        // if (averageAiResponseTimeElement) averageAiResponseTimeElement.textContent = 'N/A';

        showStatusMessage('Données du tableau de bord mises à jour.', 'success');
    } catch (error) {
        console.error('[dashboard_ui] Erreur lors du chargement des insights du tableau de bord:', error);
        showStatusMessage(`Erreur lors du chargement des données: ${error.message}`, 'error');
        // Afficher des messages d'erreur dans l'UI
        if (totalInteractionsElement) totalInteractionsElement.textContent = 'Erreur';
        if (chatInteractionsElement) chatInteractionsElement.textContent = 'Erreur';
        if (cvGeneratedCountElement) cvGeneratedCountElement.textContent = 'Erreur';
        if (aiSummaryElement) aiSummaryElement.textContent = 'Erreur lors du chargement du résumé.';
        // if (aiResponseSuccessRateElement) aiResponseSuccessRateElement.textContent = 'Erreur';
        // if (averageAiResponseTimeElement) averageAiResponseTimeElement.textContent = 'Erreur';
    }
}