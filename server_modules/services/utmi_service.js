// server_modules/services/utmi_service.js
const { v4: uuidv4 } = require('uuid');
const { logApiCall } = require('../utils/api_logger');
const walletService = require('./wallet_service'); // Nécessaire pour ajouter des UTMi au portefeuille

// Cette simulation remplace une base de données pour les transactions UTMi et les soldes utilisateur
// En production, vous utiliseriez une base de données réelle.
const utmiHistory = []; // Historique de toutes les transactions UTMi
const userUtmiBalances = {}; // Soldes totaux des UTMi par utilisateur (simulés)

/**
 * Calcule et enregistre les UTMi générés pour une interaction.
 * @param {string} interactionType Le type d'interaction (ex: 'chat', 'cv_creation').
 * @param {number} complexityScore Un score de 0.1 à 10.0.
 * @param {number} responseLength La longueur de la réponse en caractères.
 * @param {string} [userId] L'ID de l'utilisateur concerné (optionnel).
 * @returns {object} Un objet contenant le montant d'UTMi calculé et le solde total de l'utilisateur.
 */
async function calculateAndRecordUtmi(interactionType, complexityScore, responseLength, userId = 'anonymous') {
    logApiCall('utmi_service.js', 'calculateAndRecordUtmi', 'info', `Calcul des UTMi pour type: ${interactionType}, complexité: ${complexityScore}, longueur: ${responseLength}, utilisateur: ${userId}`);

    // Logique de calcul des UTMi (exemple simplifié)
    // Vous pouvez affiner cette formule selon vos besoins métier
    let calculatedUtmi = (complexityScore * 0.5) + (responseLength / 100);

    // Ajoute un bonus selon le type d'interaction
    switch (interactionType) {
        case 'cv_creation':
            calculatedUtmi *= 1.5; // Création de CV est plus valorisée
            break;
        case 'text_generation':
            calculatedUtmi *= 1.2;
            break;
        case 'chat':
        default:
            // Pas de bonus spécial ou ajustements si besoin
            break;
    }

    // Arrondir à deux décimales
    calculatedUtmi = parseFloat(calculatedUtmi.toFixed(2));

    // Enregistrer la transaction dans l'historique
    const transaction = {
        id: uuidv4(),
        userId: userId,
        amount: calculatedUtmi,
        type: 'gain', // Type de transaction: gain
        interactionType: interactionType,
        complexityScore: complexityScore,
        responseLength: responseLength,
        date: new Date().toISOString()
    };
    utmiHistory.push(transaction);

    // Mettre à jour le solde utilisateur (et simuler l'ajout au portefeuille)
    if (!userUtmiBalances[userId]) {
        userUtmiBalances[userId] = 0;
    }
    userUtmiBalances[userId] += calculatedUtmi;

    // Simuler l'ajout des UTMi au solde "pending" du walletService
    // Ceci est une intégration avec le service de portefeuille.
    try {
        await walletService.addPendingUtmi(userId, calculatedUtmi);
        logApiCall('utmi_service.js', 'calculateAndRecordUtmi', 'success', `UTMi calculés et ajoutés en attente pour ${userId}: ${calculatedUtmi}`);
    } catch (walletError) {
        logApiCall('utmi_service.js', 'calculateAndRecordUtmi', 'error', { message: `Erreur ajout UTMi à wallet (pending) pour ${userId}: ${walletError.message}`, stack: walletError.stack });
        // Ne pas bloquer la transaction UTMi si l'ajout au portefeuille échoue
        console.error("Erreur lors de l'ajout des UTMi au portefeuille (pending):", walletError);
    }

    logApiCall('utmi_service.js', 'calculateAndRecordUtmi', 'success', `UTMi ${calculatedUtmi} calculés et enregistrés pour ${userId}. Solde actuel: ${userUtmiBalances[userId]}`);

    return {
        calculatedUtmi: calculatedUtmi,
        totalUserUtmi: userUtmiBalances[userId]
    };
}

/**
 * Récupère l'historique des transactions UTMi pour un utilisateur donné.
 * @param {string} userId L'ID de l'utilisateur.
 * @param {number} [limit] Nombre maximum d'entrées à retourner.
 * @param {number} [offset] Nombre d'entrées à sauter (pour la pagination).
 * @returns {Array} La liste des transactions UTMi de l'utilisateur.
 */
async function getUtmiHistory(userId, limit = 10, offset = 0) {
    logApiCall('utmi_service.js', 'getUtmiHistory', 'info', `Récupération de l'historique UTMi pour ${userId}, limit: ${limit}, offset: ${offset}`);
    const userHistory = utmiHistory.filter(tx => tx.userId === userId)
                                   .sort((a, b) => new Date(b.date) - new Date(a.date)); // Trier par date décroissante

    // Appliquer la pagination
    const paginatedHistory = userHistory.slice(offset, offset + limit);

    logApiCall('utmi_service.js', 'getUtmiHistory', 'success', `Historique UTMi récupéré pour ${userId}. Nombre d'entrées: ${paginatedHistory.length}`);
    return paginatedHistory;
}

/**
 * Met à jour le solde total d'un utilisateur (utilisé par wallet_service lors de claim/transfer/convert)
 * Cette fonction est interne et ne devrait pas être appelée directement par les routes.
 * @param {string} userId
 * @param {number} amount
 */
function updateUserTotalUtmiBalance(userId, amount) {
    if (!userUtmiBalances[userId]) {
        userUtmiBalances[userId] = 0;
    }
    userUtmiBalances[userId] = parseFloat((userUtmiBalances[userId] + amount).toFixed(2));
    logApiCall('utmi_service.js', 'updateUserTotalUtmiBalance', 'info', `Solde total UTMi de ${userId} mis à jour de ${amount}. Nouveau solde: ${userUtmiBalances[userId]}`);
}


module.exports = {
    calculateAndRecordUtmi,
    getUtmiHistory,
    updateUserTotalUtmiBalance // Exposer cette fonction pour wallet_service
};