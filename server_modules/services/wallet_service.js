// server_modules/services/wallet_service.js
const dbService = require('./db_service');
const {
    calculateUtmiValueInEUR,
    calculateMonthlyUniversalIncome,
    COEFFICIENTS
} = require('../utms/utmi_calculator'); // Assurez-vous que le chemin est correct pour votre structure

const WALLET_DB_PATH = 'data/wallet_data.json';
const TREASURY_DB_PATH = 'data/treasury_data.json';

/**
 * Initialise les données du portefeuille si elles n'existent pas.
 * @returns {object} Les données initialisées du portefeuille.
 */
async function initializeWalletData() {
    let walletData = await dbService.readData(WALLET_DB_PATH);
    if (!walletData || typeof walletData.utmiBalance === 'undefined') {
        walletData = {
            utmiBalance: 0.0,
            lastRumClaimDate: null,
            cvnuValue: 0.0, // Sera mis à jour par le service CV
            treasuryUtmiContribution: 0.0 // Nouvelle propriété pour la contribution
        };
        await dbService.writeData(WALLET_DB_PATH, walletData);
    }
    return walletData;
}

/**
 * Initialise les données de la trésorerie si elles n'existent pas.
 * @returns {object} Les données initialisées de la trésorerie.
 */
async function initializeTreasuryData() {
    let treasuryData = await dbService.readData(TREASURY_DB_PATH);
    if (!treasuryData || typeof treasuryData.utmiBalance === 'undefined') {
        treasuryData = {
            utmiBalance: 0.0
        };
        await dbService.writeData(TREASURY_DB_PATH, treasuryData);
    }
    return treasuryData;
}

/**
 * Met à jour et retourne le solde du portefeuille utilisateur.
 * @returns {Promise<object>} Le solde actuel d'UTMi, la valeur en EUR, la valeur du CVNU et le RUM mensuel estimé.
 */
async function getWalletBalance() {
    let walletData = await initializeWalletData();
    let treasuryData = await initializeTreasuryData();

    // Récupérer la dernière valeur du CVNU depuis le CVService (simulé ici)
    const lastCvData = await dbService.readData('data/last_cv_data.json'); // Assurez-vous que ce chemin est correct
    walletData.cvnuValue = lastCvData && lastCvData.calculatedValue ? lastCvData.calculatedValue : 0.0;

    // Calculer le RUM mensuel basé sur la valeur du CVNU
    const rumMonthlyEur = calculateMonthlyUniversalIncome(walletData.cvnuValue);

    // Mettre à jour la contribution de l'utilisateur à la trésorerie (exemple simple)
    // Pour un système plus complexe, cela dépendrait des activités passées et des règles du DAO
    walletData.treasuryUtmiContribution = (walletData.utmiBalance * (COEFFICIENTS.TREASURY_CONTRIBUTION_RATE || 0.01)); // Par exemple 1% du solde

    await dbService.writeData(WALLET_DB_PATH, walletData);

    return {
        utmiBalance: walletData.utmiBalance,
        eurBalance: calculateUtmiValueInEUR(walletData.utmiBalance),
        cvnuValue: walletData.cvnuValue,
        rumMonthlyEur: rumMonthlyEur,
        treasuryUtmiContribution: walletData.treasuryUtmiContribution
    };
}

/**
 * Permet à l'utilisateur de réclamer son Revenu Universel Mensuel (RUM).
 * Le RUM est ajouté au solde UTMi et une partie est transférée à la trésorerie.
 * @returns {Promise<object>} Message de confirmation, nouveau solde UTMi et montant réclamé.
 * @throws {Error} Si le RUM a déjà été réclamé ce mois-ci.
 */
async function claimUniversalIncome() {
    let walletData = await initializeWalletData();
    let treasuryData = await initializeTreasuryData();

    const lastClaimDate = walletData.lastRumClaimDate ? new Date(walletData.lastRumClaimDate) : null;
    const now = new Date();

    // Vérifier si le RUM a déjà été réclamé ce mois-ci
    if (lastClaimDate && lastClaimDate.getMonth() === now.getMonth() && lastClaimDate.getFullYear() === now.getFullYear()) {
        throw new Error("Le Revenu Universel Mensuel a déjà été réclamé pour ce mois.");
    }

    // Récupérer la dernière valeur du CVNU pour calculer le RUM
    const lastCvData = await dbService.readData('data/last_cv_data.json');
    const cvnuValue = lastCvData && lastCvData.calculatedValue ? lastCvData.calculatedValue : 0.0;
    const rumAmountEUR = calculateMonthlyUniversalIncome(cvnuValue);
    const rumAmountUTMi = rumAmountEUR / COEFFICIENTS.UTMI_EUR_EXCHANGE_RATE;

    if (rumAmountUTMi <= 0) {
        throw new Error("Aucun RUM à réclamer. La valeur de votre CVNU est trop basse.");
    }

    const treasuryContributionUTMi = rumAmountUTMi * COEFFICIENTS.TREASURY_CONTRIBUTION_RATE;
    const userReceivedUTMi = rumAmountUTMi - treasuryContributionUTMi;

    walletData.utmiBalance += userReceivedUTMi;
    treasuryData.utmiBalance += treasuryContributionUTMi;
    walletData.lastRumClaimDate = now.toISOString();

    await dbService.writeData(WALLET_DB_PATH, walletData);
    await dbService.writeData(TREASURY_DB_PATH, treasuryData);

    return {
        message: "RUM réclamé avec succès. Votre solde a été mis à jour et une contribution a été faite à la trésorerie.",
        newUtmiBalance: walletData.utmiBalance,
        claimedAmount: rumAmountUTMi, // Montant total généré avant contribution
        userReceivedAmount: userReceivedUTMi, // Montant que l'utilisateur reçoit
        treasuryContribution: treasuryContributionUTMi // Montant contribué à la trésorerie
    };
}

/**
 * Récupère le solde de la trésorerie commune.
 * @returns {Promise<object>} Le solde actuel d'UTMi et sa valeur estimée en EUR dans la trésorerie.
 */
async function getTreasuryBalance() {
    let treasuryData = await initializeTreasuryData();
    return {
        treasuryUtmiBalance: treasuryData.utmiBalance,
        treasuryEurBalance: calculateUtmiValueInEUR(treasuryData.utmiBalance)
    };
}

/**
 * Ajoute un montant spécifique d'UTMi au portefeuille de l'utilisateur.
 * Utilisé pour la valorisation des interactions.
 * @param {number} amount - Le montant d'UTMi à ajouter.
 */
async function addUtmiToUserWallet(amount) {
    let walletData = await initializeWalletData();
    walletData.utmiBalance += amount;
    // Une partie de l'UTMi généré par les interactions va directement à la trésorerie
    const treasuryContribution = amount * (COEFFICIENTS.TREASURY_CONTRIBUTION_RATE || 0.01);
    walletData.treasuryUtmiContribution += treasuryContribution; // Ajoutez à la contribution enregistrée
    await dbService.writeData(WALLET_DB_PATH, walletData);

    // Mettre à jour la trésorerie commune
    let treasuryData = await initializeTreasuryData();
    treasuryData.utmiBalance += treasuryContribution;
    await dbService.writeData(TREASURY_DB_PATH, treasuryData);
}

module.exports = {
    getWalletBalance,
    claimUniversalIncome,
    getTreasuryBalance,
    addUtmiToUserWallet,
    initializeWalletData, // Exporter pour permettre l'initialisation depuis serveur.js si nécessaire
    initializeTreasuryData
};