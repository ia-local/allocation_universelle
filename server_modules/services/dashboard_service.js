// server_modules/services/dashboard_service.js

const fs = require('fs').promises;
const path = require('path');
const { logApiCall } = require('../utils/api_logger');
const dbService = require('./db_service'); // Pour la lecture/écriture des fichiers JSON

const DASHBOARD_DATA_FILE = path.join(__dirname, '../../data/dashboard_data.json');

/**
 * Récupère les données et insights agrégés pour le tableau de bord.
 * @returns {Promise<object>} Les données du tableau de bord.
 */
async function getDashboardInsights() {
    logApiCall('dashboard_service.js', 'getDashboardInsights', 'info', 'Fetching dashboard insights...');
    try {
        // Lire les données du tableau de bord à partir du fichier JSON.
        // Si le fichier n'existe pas ou est vide, retourner des données par défaut.
        let dashboardData = await dbService.readJsonFromFile(DASHBOARD_DATA_FILE);

        if (!dashboardData || Object.keys(dashboardData).length === 0) {
            logApiCall('dashboard_service.js', 'getDashboardInsights', 'info', 'Dashboard data file not found or empty. Returning default insights.');
            // Données par défaut pour un premier démarrage ou si aucune donnée n'est présente
            dashboardData = {
                totalUtmi: 0,
                totalInteractionCount: 0,
                averageUtmiPerInteraction: 0,
                utmiByCognitiveAxis: {
                    'marketing': 0,
                    'affiliation': 0,
                    'fiscal-economic': 0,
                    'other': 0
                },
                utmiByModel: {
                    'llama3-8b-8192': 0,
                    'llama3-70b-8192': 0,
                    'mixtral-8x7b-32768': 0
                },
                mostValuableTopics: [],
                mostCommonActivities: [],
                exchangeRates: {
                    utmiToEur: 0.01, // Exemple: 1 UTMi = 0.01 EUR
                    eurToUtmi: 100   // Exemple: 1 EUR = 100 UTMi
                }
            };
            // On pourrait choisir de sauvegarder ces données par défaut ici,
            // ou les laisser être écrites lors de la première mise à jour.
        }

        // Ici, vous pourriez ajouter de la logique pour agréger des données
        // à partir d'autres sources (ex: logs d'API, base de données, etc.)
        // pour maintenir les insights à jour. Pour le moment, nous lisons simplement.

        logApiCall('dashboard_service.js', 'getDashboardInsights', 'success', 'Dashboard insights fetched successfully.');
        return dashboardData;
    } catch (error) {
        if (error.code === 'ENOENT') {
            // C'est normal si le fichier n'existe pas encore au premier démarrage, on retourne les défauts
            logApiCall('dashboard_service.js', 'getDashboardInsights', 'info', 'Dashboard data file not found. Returning default insights.');
            return {
                totalUtmi: 0,
                totalInteractionCount: 0,
                averageUtmiPerInteraction: 0,
                utmiByCognitiveAxis: { 'marketing': 0, 'affiliation': 0, 'fiscal-economic': 0, 'other': 0 },
                utmiByModel: { 'llama3-8b-8192': 0, 'llama3-70b-8192': 0, 'mixtral-8x7b-32768': 0 },
                mostValuableTopics: [],
                mostCommonActivities: [],
                exchangeRates: { utmiToEur: 0.01, eurToUtmi: 100 }
            };
        }
        logApiCall('dashboard_service.js', 'getDashboardInsights', 'error', { message: error.message, stack: error.stack });
        console.error('Erreur lors de la récupération des données du tableau de bord:', error);
        throw error;
    }
}

module.exports = {
    getDashboardInsights
};