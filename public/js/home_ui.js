// public/js/home_ui.js - Logique DOM et events pour la page d'accueil
import { API_BASE_URL, showStatusMessage } from './app.js'; // Importe les utilitaires de app.js

let promptInput, iaResponseOutput, generateResponseBtn, clearPromptBtn;

/**
 * Initialise les éléments et événements de la page d'accueil.
 */
function initHomeUI() {
    promptInput = document.getElementById('promptInput');
    iaResponseOutput = document.getElementById('iaResponseOutput');
    generateResponseBtn = document.getElementById('generateResponseBtn');
    clearPromptBtn = document.getElementById('clearPromptBtn');

    if (generateResponseBtn) {
        generateResponseBtn.onclick = fetchGeneratedResponse;
    }
    if (clearPromptBtn) {
        clearPromptBtn.onclick = () => {
            if (promptInput) promptInput.value = '';
            if (iaResponseOutput) iaResponseOutput.textContent = '';
        };
    }
    console.log('[home_ui.js] Home UI initialized.');
}

/**
 * Récupère une réponse générée par l'IA via l'API.
 */
async function fetchGeneratedResponse() {
    if (!promptInput || !iaResponseOutput) {
        console.error("Éléments DOM pour l'accueil non trouvés.");
        return;
    }

    const prompt = promptInput.value.trim();
    if (!prompt) {
        showStatusMessage("Veuillez entrer une requête pour l'IA.", 'error');
        return;
    }

    showStatusMessage("Génération de la réponse...", 'info');
    generateResponseBtn.disabled = true;

    try {
        const response = await fetch(`${API_BASE_URL}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: prompt })
        });

        const data = await response.json();

        if (response.ok) {
            iaResponseOutput.textContent = data.response;
            showStatusMessage("Réponse générée avec succès.", 'success');
        } else {
            iaResponseOutput.textContent = `Erreur: ${data.message || 'Impossible de générer une réponse.'}`;
            showStatusMessage(`Erreur: ${data.message || 'Génération échouée.'}`, 'error');
        }
    } catch (error) {
        console.error('Erreur lors de la récupération de la réponse IA:', error);
        iaResponseOutput.textContent = `Erreur réseau ou serveur: ${error.message}`;
        showStatusMessage(`Erreur réseau: ${error.message}`, 'error');
    } finally {
        generateResponseBtn.disabled = false;
    }
}

export {
    initHomeUI,
    fetchGeneratedResponse // Exporté pour être appelé via app.js
};