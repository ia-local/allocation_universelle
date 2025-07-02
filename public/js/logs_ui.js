// public/js/logs_ui.js
import { API_BASE_URL, showStatusMessage } from './app.js';

let logsDisplayArea;
let refreshLogsBtn;

export function initializeLogsUI() {
    console.log('[logs_ui] Initialisation de l\'UI des logs.');
    logsDisplayArea = document.getElementById('logs-display-area');
    refreshLogsBtn = document.getElementById('refresh-logs-btn');

    if (refreshLogsBtn) {
        refreshLogsBtn.removeEventListener('click', fetchLogs);
        refreshLogsBtn.addEventListener('click', fetchLogs);
    }
}

/**
 * @function fetchLogs
 * @description Récupère les logs depuis le backend.
 */
export async function fetchLogs() {
    showStatusMessage('Chargement des logs...', 'info');
    if (logsDisplayArea) {
        logsDisplayArea.innerHTML = '<p>Chargement des logs en cours...</p>';
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/logs`);
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
        const logs = await response.json();
        renderLogs(logs);
        showStatusMessage('Logs chargés avec succès.', 'success');
    } catch (error) {
        console.error('[logs_ui] Erreur lors du chargement des logs:', error);
        if (logsDisplayArea) {
            logsDisplayArea.innerHTML = `<p class="error-message">Erreur lors du chargement des logs: ${error.message}</p>`;
        }
        showStatusMessage(`Erreur lors du chargement des logs: ${error.message}`, 'error');
    }
}

/**
 * @function renderLogs
 * @description Affiche les logs dans l'interface utilisateur.
 * @param {Array} logs - Un tableau d'objets log.
 */
function renderLogs(logs) {
    if (!logsDisplayArea) return;

    if (logs.length === 0) {
        logsDisplayArea.innerHTML = '<p>Aucun log disponible.</p>';
        return;
    }

    // Créer un tableau HTML pour une meilleure lisibilité
    let html = `
        <table class="logs-table">
            <thead>
                <tr>
                    <th>Timestamp</th>
                    <th>Type</th>
                    <th>Statut</th>
                    <th>Message / Raison</th>
                    <th>ID Conversation/Interaction</th>
                </tr>
            </thead>
            <tbody>
    `;

    logs.forEach(log => {
        const timestamp = new Date(log.timestamp).toLocaleString();
        const type = log.type || 'N/A';
        const status = log.status || 'N/A';
        let message = log.errorMessage || log.reason || log.message || log.userPrompt || 'N/A';
        const id = log.conversationId || log.interactionId || 'N/A';

        // Truncate long messages
        if (message.length > 150) {
            message = message.substring(0, 150) + '...';
        }

        html += `
            <tr>
                <td>${timestamp}</td>
                <td>${type}</td>
                <td>${status}</td>
                <td>${message}</td>
                <td>${id}</td>
            </tr>
        `;
    });

    html += `
            </tbody>
        </table>
    `;

    logsDisplayArea.innerHTML = html;
}