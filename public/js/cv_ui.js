// public/js/cv_ui.js
import { API_BASE_URL, showStatusMessage } from './app.js';

// --- Déclaration des variables au niveau du module ---
let cvPromptInput;
let generateCvBtn;
let cvFileInput;
let uploadCvBtn;
let exportCvBtn;
let cvDisplayArea;

// --- Fonctions d'Initialisation ---
export function initializeCvUI() {
    console.log('[cv_ui] Initialisation de l\'UI du générateur de CV.');
    // Assignation des variables aux éléments DOM
    cvPromptInput = document.getElementById('cv-prompt-input');
    generateCvBtn = document.getElementById('generate-cv-btn');
    cvFileInput = document.getElementById('cv-file-input');
    uploadCvBtn = document.getElementById('upload-cv-btn');
    exportCvBtn = document.getElementById('export-cv-btn');
    cvDisplayArea = document.getElementById('cv-display-area');

    // Logs pour vérifier si les éléments sont trouvés
    console.log('[cv_ui] cvPromptInput:', cvPromptInput);
    console.log('[cv_ui] generateCvBtn:', generateCvBtn);
    console.log('[cv_ui] cvFileInput:', cvFileInput);
    console.log('[cv_ui] uploadCvBtn:', uploadCvBtn);
    console.log('[cv_ui] exportCvBtn:', exportCvBtn);
    console.log('[cv_ui] cvDisplayArea:', cvDisplayArea);


    // Attachement des écouteurs d'événements
    if (generateCvBtn) {
        generateCvBtn.removeEventListener('click', handleGenerateCv);
        generateCvBtn.addEventListener('click', handleGenerateCv);
        console.log('[cv_ui] Écouteur d\'événements du bouton de génération de CV ajouté.');
    } else {
        console.warn('[cv_ui] Bouton "generate-cv-btn" non trouvé.');
    }

    if (uploadCvBtn) {
        uploadCvBtn.removeEventListener('click', handleUploadCv);
        uploadCvBtn.addEventListener('click', handleUploadCv);
        console.log('[cv_ui] Écouteur d\'événements du bouton d\'upload de CV ajouté.');
    } else {
        console.warn('[cv_ui] Bouton "upload-cv-btn" non trouvé.');
    }

    if (exportCvBtn) {
        exportCvBtn.removeEventListener('click', handleExportCv);
        exportCvBtn.addEventListener('click', handleExportCv);
        console.log('[cv_ui] Écouteur d\'événements du bouton d\'export de CV ajouté.');
        exportCvBtn.disabled = true; // Désactive l'export par défaut s'il n'y a pas de CV
    } else {
        console.warn('[cv_ui] Bouton "export-cv-btn" non trouvé.');
    }

    // L'appel initial à fetchCurrentCv() est désormais géré par app.js dans showSection('cv-generator').
}

// --- Fonctions d'API et de Logique ---

export async function fetchCurrentCv() {
    console.log('[cv_ui] Chargement du CV actuel...');
    showStatusMessage('Chargement du CV actuel...', 'info');
    if (cvDisplayArea) cvDisplayArea.innerHTML = '<p>Chargement du CV...</p>';
    if (exportCvBtn) exportCvBtn.disabled = true;

    try {
        const response = await fetch(`${API_BASE_URL}/api/cv`);
        if (!response.ok) {
            const errorData = await response.json().catch(() => response.text());
            throw new Error(`HTTP error! status: ${response.status} - ${JSON.stringify(errorData)}`);
        }
        const data = await response.json();
        console.log('[cv_ui] Données CV reçues:', data);

        if (data.cvData && Object.keys(data.cvData).length > 0) {
            renderCv(data.cvData); // Affiche le CV si des données sont reçues
            showStatusMessage('CV chargé avec succès !', 'success');
            if (exportCvBtn) exportCvBtn.disabled = false;
        } else {
            if (cvDisplayArea) cvDisplayArea.innerHTML = '<p>Aucun CV trouvé. Générez-en un nouveau ou uploadez-en un.</p>';
            showStatusMessage('Aucun CV trouvé sur le serveur.', 'info');
            if (exportCvBtn) exportCvBtn.disabled = true;
        }
    } catch (error) {
        console.error('[cv_ui] Erreur lors du chargement du CV:', error);
        if (cvDisplayArea) cvDisplayArea.innerHTML = `<p>Erreur lors du chargement du CV: ${error.message}</p>`;
        showStatusMessage(`Erreur lors du chargement du CV: ${error.message}`, 'error');
        if (exportCvBtn) exportCvBtn.disabled = true;
    }
}

export async function handleGenerateCv() {
    console.log('[cv_ui] handleGenerateCv appelé.');
    if (!cvPromptInput) {
        console.error('[cv_ui] cvPromptInput est null/undefined. Impossible de générer le CV.');
        showStatusMessage('Erreur interne: Champ de prompt CV non initialisé.', 'error');
        return;
    }
    
    const prompt = cvPromptInput.value.trim();
    if (!prompt) {
        showStatusMessage('Veuillez entrer un prompt pour générer le CV.', 'warning');
        return;
    }

    showStatusMessage('Génération du CV en cours...', 'info');
    if (cvDisplayArea) cvDisplayArea.innerHTML = 'Génération en cours...';
    if (exportCvBtn) exportCvBtn.disabled = true;

    try {
        const response = await fetch(`${API_BASE_URL}/api/cv/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({ prompt })
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => response.text());
            throw new Error(`HTTP error! status: ${response.status} - ${JSON.stringify(errorData)}`);
        }
        const data = await response.json();
        console.log('[cv_ui] Réponse de génération de CV reçue:', data);

        if (data.cvData) {
            renderCv(data.cvData);
            showStatusMessage('CV généré avec succès !', 'success');
            if (exportCvBtn) exportCvBtn.disabled = false;
        } else {
            if (cvDisplayArea) cvDisplayArea.innerHTML = 'Erreur: Aucune donnée de CV reçue.';
            showStatusMessage('Erreur: Aucune donnée de CV reçue.', 'error');
        }

    } catch (error) {
        console.error('[cv_ui] Erreur lors de la génération du CV:', error);
        if (cvDisplayArea) cvDisplayArea.innerHTML = `<p>Erreur: ${error.message}</p>`;
        showStatusMessage(`Erreur lors de la génération du CV: ${error.message}`, 'error');
    }
}

export async function handleUploadCv() {
    console.log('[cv_ui] handleUploadCv appelé.');
    if (!cvFileInput) {
        console.error('[cv_ui] cvFileInput est null/undefined. Impossible d\'uploader le CV.');
        showStatusMessage('Erreur interne: Champ de fichier CV non initialisé.', 'error');
        return;
    }

    if (!cvFileInput.files || cvFileInput.files.length === 0) {
        showStatusMessage('Veuillez sélectionner un fichier CV à uploader.', 'warning');
        return;
    }

    const file = cvFileInput.files[0];
    const formData = new FormData();
    formData.append('cvFile', file);

    showStatusMessage('Upload du CV en cours...', 'info');
    if (cvDisplayArea) cvDisplayArea.innerHTML = 'Upload en cours...';
    if (exportCvBtn) exportCvBtn.disabled = true;


    try {
        const response = await fetch(`${API_BASE_URL}/api/cv/upload`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        console.log('[cv_ui] Réponse d\'upload de CV reçue:', data);

        if (data.cvData) {
            renderCv(data.cvData);
            showStatusMessage('CV uploadé et chargé avec succès !', 'success');
            if (exportCvBtn) exportCvBtn.disabled = false;
        } else {
            showStatusMessage('Upload réussi mais aucune donnée de CV reçue.', 'warning');
        }

    } catch (error) {
        console.error('[cv_ui] Erreur lors de l\'upload du CV:', error);
        showStatusMessage(`Erreur lors de l'upload du CV: ${error.message}`, 'error');
        if (cvDisplayArea) cvDisplayArea.innerHTML = `Erreur lors de l'upload: ${error.message}`;
    }
}

export function handleExportCv() {
    console.log('[cv_ui] handleExportCv appelé.');
    showStatusMessage('Fonction d\'export de CV non implémentée (exporte en JSON simple pour l\'instant).', 'info');
    
    if (cvDisplayArea && cvDisplayArea.dataset.currentCvData) {
        try {
            const currentCv = JSON.parse(cvDisplayArea.dataset.currentCvData);
            const blob = new Blob([JSON.stringify(currentCv, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'cv_export.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showStatusMessage('CV exporté en JSON !', 'success');
        } catch (e) {
            console.error('Erreur lors de l\'export du CV JSON:', e);
            showStatusMessage('Erreur lors de l\'export du CV.', 'error');
        }
    } else {
        showStatusMessage('Aucun CV à exporter.', 'warning');
    }
}

// --- Fonctions de Rendu UI ---

function renderCv(cvData) {
    console.log('[cv_ui] Rendu du CV:', cvData);
    if (!cvDisplayArea) {
        console.error('[cv_ui] cvDisplayArea est null/undefined. Impossible de rendre le CV.');
        return;
    }
    cvDisplayArea.innerHTML = ''; // Nettoyer l'affichage précédent

    if (!cvData || Object.keys(cvData).length === 0) {
        cvDisplayArea.innerHTML = '<p>Aucune donnée de CV à afficher.</p>';
        return;
    }

    let htmlContent = '<h3>Votre CV</h3><div class="cv-output">';
    for (const key in cvData) {
        if (Object.hasOwnProperty.call(cvData, key)) {
            const value = cvData[key];
            htmlContent += `<div class="cv-section"><h4>${formatTitle(key)}</h4>`;
            if (Array.isArray(value)) {
                value.forEach(item => {
                    htmlContent += '<div class="cv-item">';
                    for (const subKey in item) {
                        htmlContent += `<p><strong>${formatTitle(subKey)}:</strong> ${item[subKey]}</p>`;
                    }
                    htmlContent += '</div>';
                });
            } else if (typeof value === 'object' && value !== null) {
                for (const subKey in value) {
                    htmlContent += `<p><strong>${formatTitle(subKey)}:</strong> ${value[subKey]}</p>`;
                }
            } else {
                htmlContent += `<p>${value}</p>`;
            }
            htmlContent += `</div>`;
        }
    }
    htmlContent += '</div>'; // Ferme cv-output
    cvDisplayArea.innerHTML = htmlContent;

    // Stocker les données brutes du CV pour l'export (si c'est du JSON)
    cvDisplayArea.dataset.currentCvData = JSON.stringify(cvData);
    if (exportCvBtn) exportCvBtn.disabled = false; // Active le bouton d'export
}

// Fonction utilitaire pour formater les titres (ex: 'informationsPersonnelles' -> 'Informations Personnelles')
function formatTitle(text) {
    return text.replace(/([A-Z])/g, ' $1') // Ajoute un espace avant les majuscules
               .replace(/^./, str => str.toUpperCase()); // Met la première lettre en majuscule
}