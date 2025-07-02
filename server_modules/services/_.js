// server_modules/services/db_service.js
const fs = require('fs').promises;
const path = require('path');
const { logApiCall } = require('../utils/api_logger'); // Assurez-vous du chemin correct

/**
 * Lit les données d'un fichier JSON.
 * @param {string} filePath - Chemin relatif ou absolu du fichier JSON.
 * @returns {Promise<object>} Les données parsées du fichier JSON.
 * @throws {Error} Si le fichier n'existe pas ou ne peut être lu.
 */
async function readData(filePath) {
    try {
        const data = await fs.readFile(filePath, 'utf8');
        logApiCall(`DB Service - Read`, 'N/A', 'success', `File ${filePath} read successfully.`);
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            logApiCall(`DB Service - Read`, 'N/A', 'info', `File ${filePath} not found, returning null.`);
            return null; // Retourne null si le fichier n'existe pas
        }
        logApiCall(`DB Service - Read`, 'N/A', 'error', `Error reading ${filePath}: ${error.message}`);
        throw new Error(`Impossible de lire le fichier ${filePath}: ${error.message}`);
    }
}

/**
 * Écrit des données dans un fichier JSON.
 * @param {string} filePath - Chemin relatif ou absolu du fichier JSON.
 * @param {object} data - Les données à écrire.
 * @returns {Promise<void>}
 * @throws {Error} Si l'écriture échoue.
 */
async function writeData(filePath, data) {
    try {
        // Assurez-vous que le répertoire existe
        const dir = path.dirname(filePath);
        await fs.mkdir(dir, { recursive: true });

        await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
        logApiCall(`DB Service - Write`, 'N/A', 'success', `Data written to ${filePath}.`);
    } catch (error) {
        logApiCall(`DB Service - Write`, 'N/A', 'error', `Error writing to ${filePath}: ${error.message}`);
        throw new Error(`Impossible d'écrire dans le fichier ${filePath}: ${error.message}`);
    }
}

/**
 * Initialise un fichier de base de données avec des données par défaut si inexistant.
 * @param {string} filePath - Chemin du fichier.
 * @param {object} defaultData - Données par défaut à écrire si le fichier n'existe pas.
 */
async function initializeDatabaseFile(filePath, defaultData) {
    try {
        await fs.access(filePath); // Tente d'accéder au fichier
        // Si ça passe, le fichier existe, ne rien faire
        logApiCall(`DB Service - Init`, 'N/A', 'info', `File ${filePath} already exists. No initialization needed.`);
    } catch (error) {
        if (error.code === 'ENOENT') {
            // Le fichier n'existe pas, le créer
            console.log(`[DB Service Init] Creating new database file: ${filePath}`);
            await writeData(filePath, defaultData);
            logApiCall(`DB Service - Init`, 'N/A', 'success', `File ${filePath} initialized with default data.`);
        } else {
            logApiCall(`DB Service - Init`, 'N/A', 'error', `Error accessing or initializing ${filePath}: ${error.message}`);
            throw new Error(`Erreur lors de l'initialisation du fichier ${filePath}: ${error.message}`);
        }
    }
}


module.exports = {
    readData,
    writeData,
    initializeDatabaseFile,
};