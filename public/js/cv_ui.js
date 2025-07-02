// public/js/cv_ui.js
// Ce module gère la logique spécifique à la page du générateur de CV.

import { API_BASE_URL, showStatusMessage, getCvStructuredData, setCvStructuredData } from './app.js';

let cvPromptInput;
let generateCvBtn;
let cvFileInput;
let uploadCvBtn;
let exportCvBtn; // Le bouton d'exportation
let cvDisplayArea;

/**
 * @function initializeCvUI
 * @description Initialise les éléments DOM et les écouteurs pour la page du générateur de CV.
 */
export function initializeCvUI() {
    console.log('[cv_ui] Initialisation de l\'UI du CV.');
    cvPromptInput = document.getElementById('cv-prompt-input');
    generateCvBtn = document.getElementById('generate-cv-btn');
    cvFileInput = document.getElementById('cv-file-input');
    uploadCvBtn = document.getElementById('upload-cv-btn');
    exportCvBtn = document.getElementById('export-cv-btn'); // Récupération du bouton d'exportation
    cvDisplayArea = document.getElementById('cv-display-area');

    if (cvPromptInput && generateCvBtn && cvFileInput && uploadCvBtn && exportCvBtn && cvDisplayArea) {
        generateCvBtn.removeEventListener('click', generateCv);
        uploadCvBtn.removeEventListener('click', uploadCv);
        exportCvBtn.removeEventListener('click', exportCVData); // S'assurer que le bon écouteur est attaché
        cvFileInput.removeEventListener('change', handleFileInputChange);

        generateCvBtn.addEventListener('click', generateCv);
        uploadCvBtn.addEventListener('click', uploadCv);
        exportCvBtn.addEventListener('click', exportCVData); // Attacher l'écouteur pour l'exportation
        cvFileInput.addEventListener('change', handleFileInputChange);

        console.log('[cv_ui] Écouteurs d\'événements du CV ajoutés.');
    } else {
        console.error('[cv_ui] Un ou plusieurs éléments DOM nécessaires pour le générateur de CV sont manquants. Vérifiez index.html.');
    }
    renderCv(); // Afficher le CV s'il existe déjà au chargement
}

/**
 * @function generateCv
 * @description Envoie une requête au backend pour générer un CV.
 */
async function generateCv() {
    const prompt = cvPromptInput.value.trim();
    if (!prompt) {
        showStatusMessage('Veuillez fournir une description pour générer le CV.', 'info');
        return;
    }

    showStatusMessage('Génération du CV en cours...', 'info');
    try {
        const response = await fetch(`${API_BASE_URL}/api/cv/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prompt })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => response.text());
            throw new Error(`HTTP error! status: ${response.status} - ${typeof errorData === 'object' && errorData.message ? errorData.message : errorData}`);
        }

        const data = await response.json();
        console.log('[cv_ui] CV généré:', data);
        setCvStructuredData(data.cvStructuredData); // Stocke les données structurées du CV
        renderCv();
        showStatusMessage('CV généré avec succès !', 'success');
    } catch (error) {
        console.error('[cv_ui] Erreur lors de la génération du CV:', error);
        showStatusMessage(`Échec de la génération du CV: ${error.message}`, 'error');
    }
}

/**
 * @function uploadCv
 * @description Gère l'upload d'un fichier CV.
 */
async function uploadCv() {
    if (cvFileInput.files.length === 0) {
        showStatusMessage('Veuillez sélectionner un fichier CV à uploader.', 'info');
        return;
    }

    const file = cvFileInput.files[0];
    const formData = new FormData();
    formData.append('cvFile', file);

    showStatusMessage('Upload du CV en cours...', 'info');
    try {
        const response = await fetch(`${API_BASE_URL}/api/cv/upload`, {
            method: 'POST',
            body: formData // Pas de Content-Type ici, le navigateur le gère avec FormData
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => response.text());
            throw new Error(`HTTP error! status: ${response.status} - ${typeof errorData === 'object' && errorData.message ? errorData.message : errorData}`);
        }

        const data = await response.json();
        console.log('[cv_ui] CV uploadé et analysé:', data);
        setCvStructuredData(data.cvStructuredData); // Stocke les données structurées du CV
        renderCv();
        showStatusMessage('CV uploadé et analysé avec succès !', 'success');
    } catch (error) {
        console.error('[cv_ui] Erreur lors de l\'upload du CV:', error);
        showStatusMessage(`Échec de l'upload du CV: ${error.message}`, 'error');
    }
}

/**
 * @function handleFileInputChange
 * @description Gère le changement de sélection de fichier et active le bouton d'upload.
 */
function handleFileInputChange() {
    if (cvFileInput.files.length > 0) {
        showStatusMessage(`Fichier sélectionné : ${cvFileInput.files[0].name}`, 'info');
    } else {
        showStatusMessage('Aucun fichier sélectionné.', 'info');
    }
}

/**
 * @function renderCv
 * @description Affiche les données du CV dans l'interface utilisateur.
 */
export function renderCv() {
    const cvData = getCvStructuredData();
    if (!cvData) {
        cvDisplayArea.innerHTML = '<p>Aucun CV à afficher. Générez-en un ou uploadez-en un !</p>';
        exportCvBtn.disabled = true; // Désactive l'exportation si pas de CV
        return;
    }

    let html = '<h3>Votre CV</h3>';
    html += `<h4>${cvData.name || 'Nom Inconnu'} - ${cvData.title || 'Titre Inconnu'}</h4>`;
    html += `<p><strong>Contact:</strong> ${cvData.contact || 'N/A'}</p>`;
    html += `<p><strong>Résumé:</strong> ${cvData.summary || 'N/A'}</p>`;

    if (cvData.experience && cvData.experience.length > 0) {
        html += '<h4>Expérience Professionnelle</h4><ul>';
        cvData.experience.forEach(exp => {
            html += `<li><strong>${exp.title}</strong> chez ${exp.company} (${exp.startDate} - ${exp.endDate || 'Présent'})<br>${exp.description || ''}</li>`;
        });
        html += '</ul>';
    }

    if (cvData.education && cvData.education.length > 0) {
        html += '<h4>Éducation</h4><ul>';
        cvData.education.forEach(edu => {
            html += `<li><strong>${edu.degree}</strong> de ${edu.institution} (${edu.startDate} - ${edu.endDate || 'Présent'})</li>`;
        });
        html += '</ul>';
    }

    if (cvData.skills && cvData.skills.length > 0) {
        html += '<h4>Compétences</h4><p>';
        html += cvData.skills.join(', ');
        html += '</p>';
    }

    cvDisplayArea.innerHTML = html;
    exportCvBtn.disabled = false; // Active l'exportation si un CV est affiché
    showStatusMessage('CV affiché.', 'success');
}

/**
 * @function exportCVData
 * @description Exporte les données du CV structuré au format JSON.
 * (Fonction à exporter pour être appelée depuis app.js ou directement via un bouton)
 */
export function exportCVData() { // <-- Ici l'export de la fonction
    const cvData = getCvStructuredData();
    if (!cvData) {
        showStatusMessage('Aucune donnée de CV à exporter.', 'warning');
        return;
    }

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(cvData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "mon_cv.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    showStatusMessage('CV exporté en JSON.', 'success');
}