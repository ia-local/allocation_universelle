// server_modules/utils/api_logger.js
const fs = require('fs');
const path = require('path');

const LOG_FILE_PATH = path.join(__dirname, '../../logs/api_calls.log'); // Chemin vers le fichier de log

// Assurez-vous que le dossier 'logs' existe
const logDir = path.dirname(LOG_FILE_PATH);
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

/**
 * Logge les informations d'un appel API.
 * @param {string} endpoint - L'endpoint de l'API appelé (ex: /api/generate).
 * @param {string} method - La méthode HTTP (ex: GET, POST).
 * @param {string} status - Le statut de l'appel (ex: success, error, info).
 * @param {any} data - Les données associées à l'appel (ex: réponse, message d'erreur).
 */
function logApiCall(endpoint, method, status, data) {
    const timestamp = new Date().toISOString();
    const logEntry = {
        timestamp,
        endpoint,
        method,
        status,
        data: JSON.stringify(data) // Convertir les données en chaîne JSON pour le log
    };

    const logLine = JSON.stringify(logEntry) + '\n';

    fs.appendFile(LOG_FILE_PATH, logLine, (err) => {
        if (err) {
            console.error(`[API Logger] Erreur d'écriture dans le fichier de log: ${err.message}`);
        }
    });

    // Afficher également dans la console pour un retour immédiat
    console.log(`[API LOG] [${timestamp}] ${method} ${endpoint} - Status: ${status}`);
    // console.log(`[API LOG DATA] `, data); // Décommenter pour voir les données en console
}

module.exports = {
    logApiCall
};