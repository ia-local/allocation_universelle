// public/js/wallet_ui.js
import { API_BASE_URL, showStatusMessage } from './app.js';

// Éléments DOM du portefeuille
let walletBalanceElement;
let claimUtmiBtn;
let transferUtmiRecipientInput;
let transferUtmiAmountInput;
let transferUtmiBtn;
let convertUtmiAmountInput;
let convertUtmiBtn;
let utmiTransactionHistoryElement;


export function initializeWalletUI() {
    console.log('[wallet_ui] Initialisation de l\'UI du portefeuille.');
    walletBalanceElement = document.getElementById('wallet-balance');
    claimUtmiBtn = document.getElementById('claim-utmi-btn');
    transferUtmiRecipientInput = document.getElementById('transfer-utmi-recipient');
    transferUtmiAmountInput = document.getElementById('transfer-utmi-amount');
    transferUtmiBtn = document.getElementById('transfer-utmi-btn');
    convertUtmiAmountInput = document.getElementById('convert-utmi-amount');
    convertUtmiBtn = document.getElementById('convert-utmi-btn');
    utmiTransactionHistoryElement = document.getElementById('utmi-transaction-history');


    // Assurez-vous que les écouteurs d'événements ne sont ajoutés qu'une seule fois
    if (claimUtmiBtn) {
        claimUtmiBtn.removeEventListener('click', handleClaimUtmi);
        claimUtmiBtn.addEventListener('click', handleClaimUtmi);
    }
    if (transferUtmiBtn) {
        transferUtmiBtn.removeEventListener('click', handleTransferUtmi);
        transferUtmiBtn.addEventListener('click', handleTransferUtmi);
    }
    if (convertUtmiBtn) {
        convertUtmiBtn.removeEventListener('click', handleConvertUtmi);
        convertUtmiBtn.addEventListener('click', handleConvertUtmi);
    }
}

/**
 * @function fetchWalletBalance
 * @description Récupère le solde du portefeuille UTMI depuis le backend.
 */
export async function fetchWalletBalance() {
    showStatusMessage('Chargement du solde du portefeuille...', 'info');
    try {
        const response = await fetch(`${API_BASE_URL}/api/wallet/balance`);
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
        const data = await response.json();
        if (walletBalanceElement) {
            walletBalanceElement.textContent = parseFloat(data.balance).toFixed(4); // Afficher avec 4 décimales
        }
        renderTransactionHistory(data.transactionHistory);
        showStatusMessage('Solde du portefeuille chargé.', 'success');
    } catch (error) {
        console.error('[wallet_ui] Erreur lors du chargement du solde du portefeuille:', error);
        showStatusMessage(`Erreur lors du chargement du solde: ${error.message}`, 'error');
        if (walletBalanceElement) {
            walletBalanceElement.textContent = 'Erreur';
        }
        if (utmiTransactionHistoryElement) {
            utmiTransactionHistoryElement.innerHTML = '<p class="error-message">Erreur lors du chargement de l\'historique.</p>';
        }
    }
}

/**
 * @function handleClaimUtmi
 * @description Gère la réclamation de tokens UTMI gratuits.
 */
export async function handleClaimUtmi() {
    showStatusMessage('Réclamation de tokens UTMI...', 'info');
    try {
        const response = await fetch(`${API_BASE_URL}/api/wallet/claim`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => response.text());
            throw new Error(`HTTP error! status: ${response.status} - ${JSON.stringify(errorData)}`);
        }

        const data = await response.json();
        showStatusMessage(data.message, 'success');
        fetchWalletBalance(); // Mettre à jour le solde après réclamation
    } catch (error) {
        console.error('[wallet_ui] Erreur lors de la réclamation d\'UTMI:', error);
        showStatusMessage(`Erreur lors de la réclamation: ${error.message}`, 'error');
    }
}

/**
 * @function handleTransferUtmi
 * @description Gère le transfert de tokens UTMI à un autre utilisateur.
 */
export async function handleTransferUtmi() {
    const recipient = transferUtmiRecipientInput.value.trim();
    const amount = parseFloat(transferUtmiAmountInput.value);

    if (!recipient || isNaN(amount) || amount <= 0) {
        showStatusMessage('Veuillez entrer un destinataire valide et un montant positif pour le transfert.', 'warning');
        return;
    }

    showStatusMessage('Transfert de tokens UTMI...', 'info');
    try {
        const response = await fetch(`${API_BASE_URL}/api/wallet/transfer`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ recipientId: recipient, amount })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => response.text());
            throw new Error(`HTTP error! status: ${response.status} - ${JSON.stringify(errorData)}`);
        }

        const data = await response.json();
        showStatusMessage(data.message, 'success');
        transferUtmiRecipientInput.value = '';
        transferUtmiAmountInput.value = '';
        fetchWalletBalance(); // Mettre à jour le solde après transfert
    } catch (error) {
        console.error('[wallet_ui] Erreur lors du transfert d\'UTMI:', error);
        showStatusMessage(`Erreur lors du transfert: ${error.message}`, 'error');
    }
}

/**
 * @function handleConvertUtmi
 * @description Gère la conversion de tokens UTMI en USDC simulé.
 */
export async function handleConvertUtmi() {
    const amount = parseFloat(convertUtmiAmountInput.value);

    if (isNaN(amount) || amount <= 0) {
        showStatusMessage('Veuillez entrer un montant positif à convertir.', 'warning');
        return;
    }

    showStatusMessage('Conversion de tokens UTMI...', 'info');
    try {
        const response = await fetch(`${API_BASE_URL}/api/wallet/convert`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ amount })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => response.text());
            throw new Error(`HTTP error! status: ${response.status} - ${JSON.stringify(errorData)}`);
        }

        const data = await response.json();
        showStatusMessage(data.message, 'success');
        convertUtmiAmountInput.value = '';
        fetchWalletBalance(); // Mettre à jour le solde après conversion
    } catch (error) {
        console.error('[wallet_ui] Erreur lors de la conversion d\'UTMI:', error);
        showStatusMessage(`Erreur lors de la conversion: ${error.message}`, 'error');
    }
}

/**
 * @function renderTransactionHistory
 * @description Affiche l'historique des transactions.
 * @param {Array} history - Tableau d'objets transaction.
 */
function renderTransactionHistory(history) {
    if (!utmiTransactionHistoryElement) return;

    if (history.length === 0) {
        utmiTransactionHistoryElement.innerHTML = '<p>Aucune transaction récente.</p>';
        return;
    }

    let html = `
        <table class="transactions-table">
            <thead>
                <tr>
                    <th>Type</th>
                    <th>Montant</th>
                    <th>Partie Impliquée</th>
                    <th>Date</th>
                </tr>
            </thead>
            <tbody>
    `;

    history.forEach(tx => {
        const type = tx.type; // 'claim', 'transfer_in', 'transfer_out', 'convert'
        const amount = parseFloat(tx.amount).toFixed(4);
        const party = tx.recipientId || tx.senderId || 'N/A';
        const date = new Date(tx.timestamp).toLocaleString();

        html += `
            <tr class="${type}">
                <td>${type}</td>
                <td>${amount} UTMI</td>
                <td>${party}</td>
                <td>${date}</td>
            </tr>
        `;
    });

    html += `
            </tbody>
        </table>
    `;

    utmiTransactionHistoryElement.innerHTML = html;
}