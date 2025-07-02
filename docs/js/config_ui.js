// public/js/config_ui.js
import { API_BASE_URL, showStatusMessage } from './app.js';

let configForm;
let groqModelSelect;
let groqTemperatureInput;
let groqMaxTokensInput;
let saveConfigBtn;

export function initializeConfigUI() {
    console.log('[config_ui] Initialisation de l\'UI de configuration.');
    configForm = document.getElementById('config-form');
    groqModelSelect = document.getElementById('groq-model-select');
    groqTemperatureInput = document.getElementById('groq-temperature');
    groqMaxTokensInput = document.getElementById('groq-max-tokens');
    saveConfigBtn = document.getElementById('save-config-btn');

    if (saveConfigBtn) {
        saveConfigBtn.removeEventListener('click', handleSaveConfig);
        saveConfigBtn.addEventListener('click', handleSaveConfig);
    }
}

/**
 * @function fetchConfig
 * @description Récupère la configuration actuelle depuis le backend.
 */
export async function fetchConfig() {
    showStatusMessage('Chargement de la configuration...', 'info');
    try {
        const response = await fetch(`${API_BASE_URL}/api/config`);
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
        const data = await response.json();
        if (data.groq) {
            if (groqModelSelect) groqModelSelect.value = data.groq.model;
            if (groqTemperatureInput) groqTemperatureInput.value = data.groq.temperature;
            if (groqMaxTokensInput) groqMaxTokensInput.value = data.groq.maxTokens;
        }
        showStatusMessage('Configuration chargée avec succès.', 'success');
    } catch (error) {
        console.error('[config_ui] Erreur lors du chargement de la configuration:', error);
        showStatusMessage(`Erreur lors du chargement de la configuration: ${error.message}`, 'error');
    }
}

/**
 * @function handleSaveConfig
 * @description Envoie la nouvelle configuration au backend.
 */
async function handleSaveConfig(event) {
    event.preventDefault();
    showStatusMessage('Sauvegarde de la configuration...', 'info');

    const newConfig = {
        model: groqModelSelect.value,
        temperature: parseFloat(groqTemperatureInput.value),
        maxTokens: parseInt(groqMaxTokensInput.value, 10),
    };

    try {
        const response = await fetch(`${API_BASE_URL}/api/config`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(newConfig)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => response.text());
            throw new Error(`HTTP error! status: ${response.status} - ${JSON.stringify(errorData)}`);
        }

        const data = await response.json();
        showStatusMessage(data.message, 'success');
    } catch (error) {
        console.error('[config_ui] Erreur lors de la sauvegarde de la configuration:', error);
        showStatusMessage(`Erreur lors de la sauvegarde: ${error.message}`, 'error');
    }
}

/**
 * @function fetchGroqModels
 * @description Récupère la liste des modèles Groq disponibles et les remplit dans le sélecteur.
 */
export async function fetchGroqModels() {
    if (!groqModelSelect) return; // Assurez-vous que l'élément DOM existe

    showStatusMessage('Chargement des modèles Groq...', 'info');
    try {
        const response = await fetch(`${API_BASE_URL}/api/models`);
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
        const models = await response.json();

        // Stocker la valeur actuelle sélectionnée pour la conserver si possible
        const currentModel = groqModelSelect.value;
        groqModelSelect.innerHTML = ''; // Nettoyer les options existantes

        models.forEach(model => {
            const option = document.createElement('option');
            option.value = model;
            option.textContent = model;
            groqModelSelect.appendChild(option);
        });

        // Restaurer la sélection si le modèle est toujours disponible, sinon sélectionner le premier
        if (models.includes(currentModel)) {
            groqModelSelect.value = currentModel;
        } else if (models.length > 0) {
            groqModelSelect.value = models[0];
        }
        showStatusMessage('Modèles Groq chargés.', 'success');
    } catch (error) {
        console.error('[config_ui] Erreur lors du chargement des modèles Groq:', error);
        showStatusMessage(`Erreur lors du chargement des modèles: ${error.message}`, 'error');
    }
}