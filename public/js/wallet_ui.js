// public/js/wallet_ui.js
// Ce module gère la logique spécifique à la page du portefeuille UTMi.

import { API_BASE_URL, showStatusMessage } from './app.js';

let walletBalanceElement;
let utmiClaimBtn;
let transferRecipientInput;
let transferAmountInput;
let utmiTransferBtn;
let convertAmountInput;
let convertTargetCurrencyInput;
let utmiConvertBtn;

/**
 * @function initializeWalletUI
 * @description Initialise les éléments DOM et les écouteurs pour la page du portefeuille.
 * Appelé par app.js quand la page 'wallet' est affichée.
 */
export function initializeWalletUI() { // <-- Ajout de 'export' ici
    console.log('[wallet_ui] Initialisation de l\'UI du portefeuille.');
    walletBalanceElement = document.getElementById('wallet-balance');
    utmiClaimBtn = document.getElementById('utmi-claim-btn');
    transferRecipientInput = document.getElementById('transfer-recipient');
    transferAmountInput = document.getElementById('transfer-amount');
    utmiTransferBtn = document.getElementById('utmi-transfer-btn');
    convertAmountInput = document.getElementById('convert-amount');
    convertTargetCurrencyInput = document.getElementById('convert-target-currency');
    utmiConvertBtn = document.getElementById('utmi-convert-btn');

    if (walletBalanceElement && utmiClaimBtn && utmiTransferBtn && utmiConvertBtn) {
        // Supprime les écouteurs existants pour éviter les doublons
        utmiClaimBtn.removeEventListener('click', claimUtmi);
        utmiTransferBtn.removeEventListener('click', transferUtmi);
        utmiConvertBtn.removeEventListener('click', convertUtmi);

        // Ajoute les nouveaux écouteurs
        utmiClaimBtn.addEventListener('click', claimUtmi);
        utmiTransferBtn.addEventListener('click', transferUtmi);
        utmiConvertBtn.addEventListener('click', convertUtmi);
        console.log('[wallet_ui] Écouteurs d\'événements du portefeuille ajoutés.');
    } else {
        console.error('[wallet_ui] Un ou plusieurs éléments DOM nécessaires pour le portefeuille sont manquants. Vérifiez index.html.');
    }
}

/**
 * @function fetchWalletBalance
 * @description Récupère le solde du portefeuille depuis le backend.
 */
export async function fetchWalletBalance() { // <-- Ajout de 'export' ici
    console.log('[wallet_ui] Chargement du solde du portefeuille...');
    showStatusMessage('Chargement du solde du portefeuille...', 'info');
    try {
        const response = await fetch(`${API_BASE_URL}/api/wallet`);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status} - ${errorText || response.statusText}`);
        }
        const data = await response.json();
        console.log('[wallet_ui] Solde du portefeuille reçu:', data);
        if (walletBalanceElement) {
            walletBalanceElement.textContent = `Solde actuel : ${data.balance} UTMi`;
        }
        showStatusMessage('Solde du portefeuille mis à jour.', 'success');
    } catch (error) {
        console.error('[wallet_ui] Erreur lors du chargement du solde du portefeuille:', error);
        showStatusMessage(`Erreur lors du chargement du solde: ${error.message}`, 'error');
    }
}

/**
 * @function claimUtmi
 * @description Revendique des UTMi.
 */
async function claimUtmi() {
    showStatusMessage('Revendication d\'UTMi en cours...', 'info');
    try {
        const response = await fetch(`${API_BASE_URL}/api/wallet/claim`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => response.text());
            throw new Error(`HTTP error! status: ${response.status} - ${typeof errorData === 'object' && errorData.message ? errorData.message : errorData}`);
        }

        const data = await response.json();
        console.log('[wallet_ui] UTMi revendiqués:', data);
        showStatusMessage(data.message, 'success');
        fetchWalletBalance(); // Rafraîchir le solde après l'opération
    } catch (error) {
        console.error('[wallet_ui] Erreur lors de la revendication des UTMi:', error);
        showStatusMessage(`Échec de la revendication d'UTMi: ${error.message}`, 'error');
    }
}

/**
 * @function transferUtmi
 * @description Transfère des UTMi à un autre utilisateur.
 */
async function transferUtmi() {
    const recipientId = transferRecipientInput.value.trim();
    const amount = parseFloat(transferAmountInput.value);

    if (!recipientId || isNaN(amount) || amount <= 0) {
        showStatusMessage('Veuillez entrer un ID de destinataire valide et un montant positif.', 'warning');
        return;
    }

    showStatusMessage('Transfert d\'UTMi en cours...', 'info');
    try {
        const response = await fetch(`${API_BASE_URL}/api/wallet/transfer`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ recipientId, amount })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => response.text());
            throw new Error(`HTTP error! status: ${response.status} - ${typeof errorData === 'object' && errorData.message ? errorData.message : errorData}`);
        }

        const data = await response.json();
        console.log('[wallet_ui] UTMi transférés:', data);
        showStatusMessage(data.message, 'success');
        fetchWalletBalance(); // Rafraîchir le solde après l'opération
        transferRecipientInput.value = '';
        transferAmountInput.value = '';
    } catch (error) {
        console.error('[wallet_ui] Erreur lors du transfert des UTMi:', error);
        showStatusMessage(`Échec du transfert d'UTMi: ${error.message}`, 'error');
    }
}

/**
 * @function convertUtmi
 * @description Convertit des UTMi en une autre devise.
 */
async function convertUtmi() {
    const amount = parseFloat(convertAmountInput.value);
    const targetCurrency = convertTargetCurrencyInput.value.trim();

    if (isNaN(amount) || amount <= 0 || !targetCurrency) {
        showStatusMessage('Veuillez entrer un montant positif et une devise cible.', 'warning');
        return;
    }

    showStatusMessage('Conversion d\'UTMi en cours...', 'info');
    try {
        const response = await fetch(`${API_BASE_URL}/api/wallet/convert`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ amount, targetCurrency })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => response.text());
            throw new Error(`HTTP error! status: ${response.status} - ${typeof errorData === 'object' && errorData.message ? errorData.message : errorData}`);
        }

        const data = await response.json();
        console.log('[wallet_ui] UTMi convertis:', data);
        showStatusMessage(data.message, 'success');
        fetchWalletBalance(); // Rafraîchir le solde après l'opération
        convertAmountInput.value = '';
        convertTargetCurrencyInput.value = '';
    } catch (error) {
        console.error('[wallet_ui] Erreur lors de la conversion des UTMi:', error);
        showStatusMessage(`Échec de la conversion d'UTMi: ${error.message}`, 'error');
    }
}