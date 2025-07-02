// public/js/wallet_ui.js - Logique DOM et events pour la page portefeuille
import { API_BASE_URL, showStatusMessage, showModal } from './app.js';

let utmiBalanceEl, eurBalanceEl, refreshWalletBtn, claimUtmiBtn, transferUtmiBtn, convertUtmiBtn;
let treasuryUtmiBalanceEl, treasuryEurBalanceEl;

/**
 * Initialise les éléments et événements de l'interface du portefeuille.
 */
function initWalletUI() {
    utmiBalanceEl = document.getElementById('utmiBalanceEl');
    eurBalanceEl = document.getElementById('eurBalanceEl');
    refreshWalletBtn = document.getElementById('refreshWalletBtn');
    claimUtmiBtn = document.getElementById('claimUtmiBtn');
    transferUtmiBtn = document.getElementById('transferUtmiBtn');
    convertUtmiBtn = document.getElementById('convertUtmiBtn');
    treasuryUtmiBalanceEl = document.getElementById('treasuryUtmiBalanceEl');
    treasuryEurBalanceEl = document.getElementById('treasuryEurBalanceEl');

    if (refreshWalletBtn) refreshWalletBtn.onclick = fetchWalletData;
    if (claimUtmiBtn) claimUtmiBtn.onclick = claimUtmi;
    if (transferUtmiBtn) transferUtmiBtn.onclick = transferUtmi;
    if (convertUtmiBtn) convertUtmiBtn.onclick = convertUtmi;

    console.log('[wallet_ui.js] Wallet UI initialized.');
}

/**
 * Récupère les données du portefeuille depuis l'API.
 */
async function fetchWalletData() {
    showStatusMessage('Chargement du portefeuille...', 'info');
    if (refreshWalletBtn) refreshWalletBtn.disabled = true;

    try {
        const response = await fetch(`${API_BASE_URL}/api/wallet/balance`);
        const data = await response.json();

        if (response.ok) {
            updateWalletUI(data);
            showStatusMessage('Portefeuille actualisé.', 'success');
        } else {
            showStatusMessage(`Erreur lors du chargement du portefeuille: ${data.message}`, 'error');
        }
    } catch (error) {
        console.error('Erreur réseau ou serveur lors de la récupération des données du portefeuille:', error);
        showStatusMessage(`Erreur réseau: ${error.message}`, 'error');
    } finally {
        if (refreshWalletBtn) refreshWalletBtn.disabled = false;
    }
}

/**
 * Met à jour l'interface utilisateur du portefeuille avec les données.
 * @param {object} data - Les données du portefeuille.
 */
function updateWalletUI(data) {
    if (utmiBalanceEl) utmiBalanceEl.textContent = `${data.utmiBalance?.toFixed(2) || '0.00'} UTMi`;
    if (eurBalanceEl) eurBalanceEl.textContent = `${data.eurBalance?.toFixed(2) || '0.00'} EUR`;
    if (treasuryUtmiBalanceEl) treasuryUtmiBalanceEl.textContent = `${data.treasuryUtmiBalance?.toFixed(2) || '0.00'} UTMi`;
    if (treasuryEurBalanceEl) treasuryEurBalanceEl.textContent = `${data.treasuryEurBalance?.toFixed(2) || '0.00'} EUR`;
}

/**
 * Réclame des UTMi (simulé).
 */
async function claimUtmi() {
    const amount = await showModal('prompt', 'Réclamer des UTMi', 'Combien d\'UTMi souhaitez-vous réclamer (limité à 10 par jour pour test) ?', 'number');
    if (!amount || isNaN(amount) || amount <= 0) {
        showStatusMessage('Montant invalide.', 'error');
        return;
    }

    showStatusMessage('Réclamation des UTMi...', 'info');
    try {
        const response = await fetch(`${API_BASE_URL}/api/wallet/claim-utmi`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount: parseFloat(amount) })
        });
        const data = await response.json();
        if (response.ok) {
            showStatusMessage(`Réclamé ${data.amount} UTMi. Nouveau solde: ${data.newBalance} UTMi`, 'success');
            fetchWalletData(); // Actualise l'UI
        } else {
            showStatusMessage(`Erreur de réclamation: ${data.message}`, 'error');
        }
    } catch (error) {
        console.error('Erreur lors de la réclamation des UTMi:', error);
        showStatusMessage(`Erreur réseau: ${error.message}`, 'error');
    }
}

/**
 * Transfère des UTMi (simulé).
 */
async function transferUtmi() {
    const recipient = await showModal('prompt', 'Transférer UTMi', 'À qui souhaitez-vous transférer des UTMi (ID utilisateur simulé) ?');
    if (!recipient) return;

    const amount = await showModal('prompt', 'Montant du Transfert', `Combien d'UTMi transférer à ${recipient} ?`, 'number');
    if (!amount || isNaN(amount) || amount <= 0) {
        showStatusMessage('Montant invalide.', 'error');
        return;
    }

    showStatusMessage(`Transfert de ${amount} UTMi à ${recipient}...`, 'info');
    try {
        const response = await fetch(`${API_BASE_URL}/api/wallet/transfer`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ recipientId: recipient, amount: parseFloat(amount) })
        });
        const data = await response.json();
        if (response.ok) {
            showStatusMessage(`Transfert réussi. Nouveau solde: ${data.newBalance} UTMi`, 'success');
            fetchWalletData();
        } else {
            showStatusMessage(`Erreur de transfert: ${data.message}`, 'error');
        }
    } catch (error) {
        console.error('Erreur lors du transfert des UTMi:', error);
        showStatusMessage(`Erreur réseau: ${error.message}`, 'error');
    }
}

/**
 * Convertit des UTMi en EUR ou vice-versa (simulé).
 */
async function convertUtmi() {
    const type = await showModal('confirm', 'Conversion UTMi/EUR', 'Voulez-vous convertir des UTMi en EUR (Oui) ou des EUR en UTMi (Non) ?');
    const conversionType = type ? 'utmi_to_eur' : 'eur_to_utmi';
    const unit = conversionType === 'utmi_to_eur' ? 'UTMi' : 'EUR';

    const amount = await showModal('prompt', `Convertir ${unit}`, `Combien de ${unit} souhaitez-vous convertir ?`, 'number');
    if (!amount || isNaN(amount) || amount <= 0) {
        showStatusMessage('Montant invalide.', 'error');
        return;
    }

    showStatusMessage(`Conversion de ${amount} ${unit}...`, 'info');
    try {
        const response = await fetch(`${API_BASE_URL}/api/wallet/convert`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount: parseFloat(amount), type: conversionType })
        });
        const data = await response.json();
        if (response.ok) {
            showStatusMessage(`Conversion réussie. Nouveau solde UTMi: ${data.newUtmiBalance} UTMi, Nouveau solde EUR: ${data.newEurBalance} EUR`, 'success');
            fetchWalletData();
        } else {
            showStatusMessage(`Erreur de conversion: ${data.message}`, 'error');
        }
    } catch (error) {
        console.error('Erreur lors de la conversion:', error);
        showStatusMessage(`Erreur réseau: ${error.message}`, 'error');
    }
}


export {
    initWalletUI,
    fetchWalletData,
    claimUtmi,
    transferUtmi,
    convertUtmi
};