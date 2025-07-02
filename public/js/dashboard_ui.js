// public/js/dashboard_ui.js
// Ce module gère la logique spécifique à la page du tableau de bord.

import { API_BASE_URL, showStatusMessage } from './app.js';

let dashboardContentElement;

/**
 * @function initializeDashboardUI
 * @description Initialise les éléments DOM et les écouteurs pour la page Dashboard.
 * Appelé par app.js quand la page 'dashboard' est affichée.
 */
export function initializeDashboardUI() {
    console.log('[dashboard_ui] Initialisation de l\'UI du tableau de bord.');
    dashboardContentElement = document.getElementById('dashboard-content');

    if (!dashboardContentElement) {
        console.error('[dashboard_ui] L\'élément #dashboard-content est manquant. Vérifiez index.html.');
    }

    // Tu pourrais avoir ici des initialisations de graphiques, etc.
    if (dashboardContentElement) { // Vérification ajoutée
        dashboardContentElement.innerHTML = '<p>Chargement des données du tableau de bord...</p>';
    }
}

/**
 * @function fetchDashboardInsights
 * @description Récupère les données analytiques pour le tableau de bord.
 */
export async function fetchDashboardInsights() {
    console.log('[dashboard_ui] Chargement des données du tableau de bord...');
    showStatusMessage('Chargement des insights du tableau de bord...', 'info');
    try {
        const response = await fetch(`${API_BASE_URL}/api/dashboard/insights`);
        if (!response.ok) {
            // Tente de lire l'erreur du corps de la réponse si disponible, même pour un 404
            const errorText = await response.text();
            throw new Error(`Erreur HTTP: ${response.status} - ${errorText || response.statusText}`);
        }
        const data = await response.json();
        console.log('[dashboard_ui] Insights du tableau de bord reçus:', data);

        // Mettre à jour l'UI avec les données
        if (dashboardContentElement) {
            dashboardContentElement.innerHTML = `
                <h3>Statistiques Générales</h3>
                <p><strong>UTMi Générés Total:</strong> ${data.totalUtmiGenerated || 'N/A'}</p>
                <p><strong>Conversations Actives:</strong> ${data.activeConversations || 'N/A'}</p>
                <p><strong>CVs Générés:</strong> ${data.cvGeneratedCount || 'N/A'}</p>
                <h4>Performance IA</h4>
                <p><strong>Taux de Réussite des Réponses:</strong> ${data.aiResponseSuccessRate ? `${(data.aiResponseSuccessRate * 100).toFixed(2)}%` : 'N/A'}</p>
                <p><strong>Temps de Réponse Moyen IA:</strong> ${data.averageAiResponseTime ? `${data.averageAiResponseTime.toFixed(2)} ms` : 'N/A'}</p>
                `;
            showStatusMessage('Tableau de bord mis à jour.', 'success');
        }

    } catch (error) {
        console.error('[dashboard_ui] Erreur lors du chargement des insights du tableau de bord:', error);
        showStatusMessage(`Échec du chargement du tableau de bord: ${error.message}`, 'error');
        if (dashboardContentElement) dashboardContentElement.innerHTML = '<p class="error-message">Impossible de charger les données du tableau de bord.</p>';
    }
}