// public/js/home_ui.js
// Ce module gère la logique spécifique à la page d'accueil (générateur IA simple).

import { API_BASE_URL, showStatusMessage } from './app.js'; // Assure-toi que showStatusMessage est bien exporté de app.js

let homePromptInput;
let sendHomePromptBtn;
let homeAiResponseDisplay;

/**
 * @function initializeHomeUI
 * @description Initialise les éléments DOM et les écouteurs pour la page d'accueil.
 * Appelé par app.js quand la page 'home' est affichée.
 */
export function initializeHomeUI() { // <-- Ajout de 'export' ici
    console.log('[home_ui] Initialisation de l\'UI de la page d\'accueil.');
    homePromptInput = document.getElementById('home-prompt-input');
    sendHomePromptBtn = document.getElementById('send-home-prompt-btn');
    homeAiResponseDisplay = document.getElementById('home-ai-response-display');

    if (homePromptInput && sendHomePromptBtn && homeAiResponseDisplay) {
        // Supprime les écouteurs existants pour éviter les doublons
        sendHomePromptBtn.removeEventListener('click', sendHomePrompt);
        // Ajoute le nouvel écouteur
        sendHomePromptBtn.addEventListener('click', sendHomePrompt);
        console.log('[home_ui] Écouteurs d\'événements de la page d\'accueil ajoutés.');
    } else {
        console.error('[home_ui] Un ou plusieurs éléments DOM nécessaires pour la page d\'accueil sont manquants. Vérifiez index.html.');
    }
}

/**
 * @function sendHomePrompt
 * @description Envoie le prompt de l'utilisateur au backend pour une réponse IA.
 */
export async function sendHomePrompt() { // <-- Ajout de 'export' ici
    const prompt = homePromptInput.value.trim();
    if (!prompt) {
        showStatusMessage('Veuillez entrer un prompt pour que l\'IA puisse répondre.', 'info');
        return;
    }

    homeAiResponseDisplay.innerHTML = '<p>Génération de la réponse...</p>';
    showStatusMessage('Envoi au générateur IA...', 'info');

    try {
        const response = await fetch(`${API_BASE_URL}/api/generate-ai-response`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ prompt: prompt })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => response.text());
            throw new Error(`HTTP error! status: ${response.status} - ${typeof errorData === 'object' && errorData.message ? errorData.message : errorData}`);
        }

        const data = await response.json();
        console.log('[home_ui] Réponse de l\'IA reçue:', data);
        homeAiResponseDisplay.innerHTML = `<p><strong>Réponse IA:</strong> ${data.response}</p>`;
        showStatusMessage('Réponse IA générée avec succès.', 'success');
        homePromptInput.value = ''; // Efface le champ de saisie
    } catch (error) {
        console.error('[home_ui] Erreur lors de l\'envoi du prompt:', error);
        homeAiResponseDisplay.innerHTML = `<p class="error-message">Erreur: ${error.message}</p>`;
        showStatusMessage(`Échec de la génération de la réponse IA: ${error.message}`, 'error');
    }
}