// public/js/home_ui.js
import { API_BASE_URL, showStatusMessage } from './app.js'; // Assurez-vous que showStatusMessage est exporté de app.js

let homePromptInput;
let sendHomePromptBtn;
let homeAiResponseDisplay;

export function initializeHomeUI() {
    console.log('[home_ui] Initialisation de l\'UI de la page d\'accueil.');
    // Récupération des éléments DOM
    homePromptInput = document.getElementById('home-prompt-input');
    sendHomePromptBtn = document.getElementById('send-home-prompt-btn');
    homeAiResponseDisplay = document.getElementById('home-ai-response-display');

    // Assurez-vous que les éléments existent avant d'attacher les écouteurs
    if (sendHomePromptBtn) {
        // Supprime l'écouteur précédent pour éviter les doublons si initializeHomeUI est appelée plusieurs fois
        sendHomePromptBtn.removeEventListener('click', handleSendHomePrompt);
        sendHomePromptBtn.addEventListener('click', handleSendHomePrompt);
        console.log('[home_ui] Écouteur d\'événements du bouton d\'envoi du prompt ajouté.');
    } else {
        console.warn('[home_ui] Bouton "send-home-prompt-btn" non trouvé.');
    }

    if (homePromptInput) {
        // Ajoute un écouteur pour la touche "Entrée"
        homePromptInput.removeEventListener('keypress', handlePromptKeyPress);
        homePromptInput.addEventListener('keypress', handlePromptKeyPress);
        console.log('[home_ui] Écouteur d\'événements de touche pour le prompt ajouté.');
    } else {
        console.warn('[home_ui] Champ "home-prompt-input" non trouvé.');
    }

    // Initialise l'affichage de la réponse
    if (homeAiResponseDisplay) {
        homeAiResponseDisplay.innerHTML = '<p>Votre réponse de l\'IA apparaîtra ici.</p>';
    }
}

// Gère l'envoi du prompt avec la touche "Entrée"
function handlePromptKeyPress(event) {
    // Vérifie si la touche pressée est "Entrée" (code 13) et que la touche Shift n'est PAS enfoncée
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault(); // Empêche le saut de ligne par défaut dans le textarea
        handleSendHomePrompt(); // Appelle la fonction d'envoi
    }
}

export async function handleSendHomePrompt() {
    console.log('[DEBUG] Le bouton a été cliqué ! Ou Entrée a été pressée !'); // <--- AJOUTEZ CETTE LIGNE
    showStatusMessage('Test de clic : Bouton réagit !', 'info'); // <--- AJOUTEZ CETTE LIGNE
    if (!homePromptInput) {
        showStatusMessage('Erreur: Le champ de prompt n\'est pas initialisé.', 'error');
        console.error('[home_ui] homePromptInput est null.');
        return;
    }

    const prompt = homePromptInput.value.trim();
    if (!prompt) {
        showStatusMessage('Veuillez entrer un prompt pour l\'IA.', 'warning');
        return;
    }

    showStatusMessage('Envoi du prompt à l\'IA...', 'info');
    if (homeAiResponseDisplay) {
        homeAiResponseDisplay.textContent = 'Génération en cours...';
    }

    try {
        const response = await fetch(`${API_BASE_URL}/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ prompt })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => response.text());
            throw new Error(`HTTP error! status: ${response.status} - ${JSON.stringify(errorData)}`);
        }

        const data = await response.json();
        if (homeAiResponseDisplay) {
            homeAiResponseDisplay.textContent = data.response;
        }
        showStatusMessage('Réponse IA reçue avec succès !', 'success');
        homePromptInput.value = ''; // Efface le champ après l'envoi

    } catch (error) {
        console.error('[home_ui] Erreur lors de la génération IA:', error);
        if (homeAiResponseDisplay) {
            homeAiResponseDisplay.textContent = `Erreur: ${error.message}`;
        }
        showStatusMessage(`Erreur lors de la génération IA: ${error.message}`, 'error');
    }
}