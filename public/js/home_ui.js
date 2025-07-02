// public/js/home_ui.js
import { API_BASE_URL, showStatusMessage } from './app.js';

let homePromptInput;
let sendHomePromptBtn;
let homeAiResponseDisplay;

export function initializeHomeUI() {
    console.log('[home_ui] Initialisation de l\'UI de la page d\'accueil.');
    homePromptInput = document.getElementById('home-prompt-input');
    sendHomePromptBtn = document.getElementById('send-home-prompt-btn');
    homeAiResponseDisplay = document.getElementById('home-ai-response-display');

    if (sendHomePromptBtn) {
        sendHomePromptBtn.removeEventListener('click', handleSendHomePrompt);
        sendHomePromptBtn.addEventListener('click', handleSendHomePrompt);
        console.log('[home_ui] Écouteur d\'événements du bouton d\'envoi du prompt ajouté.');
    } else {
        console.warn('[home_ui] Bouton "send-home-prompt-btn" non trouvé.');
    }

    if (homePromptInput) {
        homePromptInput.removeEventListener('keypress', handlePromptKeyPress);
        homePromptInput.addEventListener('keypress', handlePromptKeyPress);
        console.log('[home_ui] Écouteur d\'événements de touche pour le prompt ajouté.');
    } else {
        console.warn('[home_ui] Champ "home-prompt-input" non trouvé.');
    }

    if (homeAiResponseDisplay) {
        homeAiResponseDisplay.innerHTML = '<p>Votre réponse de l\'IA apparaîtra ici.</p>';
    }
}

function handlePromptKeyPress(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        handleSendHomePrompt();
    }
}

export async function handleSendHomePrompt() {
    console.log('[DEBUG] Le bouton a été cliqué ! Ou Entrée a été pressée !');
    showStatusMessage('Test de clic : Bouton réagit !', 'info');
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
        // --- CORRECTION ICI : L'URL de l'API a été changée pour correspondre à srv.js ---
        const response = await fetch(`${API_BASE_URL}/api/home/prompt`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ prompt })
        });

        if (!response.ok) {
            // Tente de lire l'erreur en JSON, sinon en texte brut
            const errorData = await response.json().catch(() => response.text());
            let errorMessage = `HTTP error! status: ${response.status}`;
            if (typeof errorData === 'object' && errorData.error) {
                errorMessage += ` - ${errorData.error}`;
            } else if (typeof errorData === 'string') {
                errorMessage += ` - ${errorData}`;
            } else {
                errorMessage += ` - Erreur inconnue`;
            }
            throw new Error(errorMessage);
        }

        const data = await response.json();
        if (homeAiResponseDisplay) {
            homeAiResponseDisplay.textContent = data.response;
        }
        showStatusMessage('Réponse IA reçue avec succès !', 'success');
        homePromptInput.value = '';

    } catch (error) {
        console.error('[home_ui] Erreur lors de la génération IA:', error);
        if (homeAiResponseDisplay) {
            homeAiResponseDisplay.textContent = `Erreur: ${error.message}`;
        }
        showStatusMessage(`Erreur lors de la génération IA: ${error.message}`, 'error');
    }
}