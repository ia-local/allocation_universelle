// public/js/cv_ui.js - Logique DOM et events pour le générateur de CV
import { API_BASE_URL, showStatusMessage, showModal, currentCvStructuredData } from './app.js';

let cvDisplayAreaEl, generateCvBtn, exportCvBtn, uploadCvBtn, cvFileInput, cvFileNameDisplayEl;
let cvValueEl, cvLevelEl, rumEl, refreshCvMetricsBtn;

/**
 * Initialise les éléments et événements de l page du générateur de CV.
 */
function initCvUI() {
    cvDisplayAreaEl = document.getElementById('cvDisplayArea');
    generateCvBtn = document.getElementById('generateCvBtn');
    exportCvBtn = document.getElementById('exportCvBtn');
    uploadCvBtn = document.getElementById('uploadCvBtn');
    cvFileInput = document.getElementById('cvFileInput');
    cvFileNameDisplayEl = document.getElementById('cvFileNameDisplay');
    cvValueEl = document.getElementById('cvValueEl');
    cvLevelEl = document.getElementById('cvLevelEl');
    rumEl = document.getElementById('rumEl');
    refreshCvMetricsBtn = document.getElementById('refreshCvMetricsBtn');

    if (generateCvBtn) generateCvBtn.onclick = generateCv;
    if (exportCvBtn) exportCvBtn.onclick = exportCv;
    if (uploadCvBtn) uploadCvBtn.onclick = () => cvFileInput && cvFileInput.click();
    if (cvFileInput) {
        cvFileInput.onchange = (event) => {
            if (cvFileInput.files.length > 0) {
                if (cvFileNameDisplayEl) cvFileNameDisplayEl.textContent = cvFileInput.files[0].name;
                uploadCv(cvFileInput.files[0]);
            } else {
                if (cvFileNameDisplayEl) cvFileNameDisplayEl.textContent = 'Aucun fichier';
            }
        };
    }
    if (refreshCvMetricsBtn) refreshCvMetricsBtn.onclick = fetchCvData;

    console.log('[cv_ui.js] CV UI initialized.');
}

/**
 * Récupère les données du CV et les affiche.
 */
async function fetchCvData() {
    showStatusMessage('Chargement des données du CV...', 'info');
    try {
        const response = await fetch(`${API_BASE_URL}/api/cv/data`);
        const data = await response.json();
        if (response.ok) {
            currentCvStructuredData = data.cvData; // Met à jour l'état global
            displayCv(data.cvData);
            updateCvMetrics(data.metrics);
            showStatusMessage('Données CV chargées.', 'success');
        } else {
            showStatusMessage(`Erreur lors du chargement des données CV: ${data.message}`, 'error');
        }
    } catch (error) {
        console.error('Erreur réseau ou serveur lors du chargement des données CV:', error);
        showStatusMessage(`Erreur réseau: ${error.message}`, 'error');
    }
}

/**
 * Affiche le CV. (Peut être étendu pour générer du HTML/CSS)
 * @param {object} cvData - Les données structurées du CV.
 */
function displayCv(cvData) {
    if (!cvDisplayAreaEl) return;
    if (!cvData) {
        cvDisplayAreaEl.innerHTML = '<p>Aucun CV généré ou chargé.</p>';
        return;
    }
    // Génération simple pour l'instant
    let html = `<h3>${cvData.personalInfo?.name || 'Nom Inconnu'}</h3>`;
    html += `<p>${cvData.personalInfo?.title || 'Titre Inconnu'}</p>`;
    html += `<h4>Expérience</h4><ul>`;
    cvData.experience?.forEach(exp => {
        html += `<li>${exp.title} at ${exp.company} (${exp.years} years)</li>`;
    });
    html += `</ul>`;
    html += `<h4>Compétences</h4><p>${cvData.skills?.join(', ') || 'Aucune compétence'}</p>`;
    cvDisplayAreaEl.innerHTML = html;
}

/**
 * Met à jour les métriques du CV.
 * @param {object} metrics - Les métriques du CV (valeur, niveau, RUM).
 */
function updateCvMetrics(metrics) {
    if (cvValueEl) cvValueEl.textContent = `${metrics.cvValue?.toFixed(2) || 0} CVNU`;
    if (cvLevelEl) cvLevelEl.textContent = metrics.cvLevel || 'Inconnu';
    if (rumEl) rumEl.textContent = `${metrics.monthlyUniversalIncome?.toFixed(2) || 0} EUR/mois`;
}

/**
 * Génère un nouveau CV via l'API.
 */
async function generateCv() {
    const prompt = await showModal('prompt', 'Générer un CV', 'Décrivez la personne pour qui générer le CV (ex: Développeur frontend expérimenté avec 5 ans d\'expérience en React).');
    if (!prompt) return;

    showStatusMessage('Génération du CV...', 'info');
    generateCvBtn.disabled = true;

    try {
        const response = await fetch(`${API_BASE_URL}/api/cv/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: prompt })
        });

        const data = await response.json();

        if (response.ok) {
            currentCvStructuredData = data.cvData;
            displayCv(data.cvData);
            updateCvMetrics(data.metrics);
            showStatusMessage('CV généré et sauvegardé.', 'success');
        } else {
            showStatusMessage(`Erreur: ${data.message || 'Échec de la génération du CV.'}`, 'error');
        }
    } catch (error) {
        console.error('Erreur lors de la génération du CV:', error);
        showStatusMessage(`Erreur réseau: ${error.message}`, 'error');
    } finally {
        generateCvBtn.disabled = false;
    }
}

/**
 * Exporte le CV structuré en tant que fichier JSON.
 */
function exportCv() {
    if (!currentCvStructuredData) {
        showStatusMessage('Aucune donnée de CV à exporter.', 'error');
        return;
    }

    const filename = `CVNU_${currentCvStructuredData.personalInfo?.name?.replace(/\s/g, '_') || 'generated'}.json`;
    const jsonStr = JSON.stringify(currentCvStructuredData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showStatusMessage('CV exporté en JSON.', 'success');
}

/**
 * Charge un CV à partir d'un fichier JSON.
 * @param {File} file - Le fichier JSON à charger.
 */
async function uploadCv(file) {
    if (!file) {
        showStatusMessage("Aucun fichier sélectionné.", "error");
        return;
    }

    if (file.type !== "application/json") {
        showStatusMessage("Veuillez sélectionner un fichier JSON.", "error");
        return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const uploadedData = JSON.parse(e.target.result);
            showStatusMessage("Analyse du CV chargé...", "info");

            const response = await fetch(`${API_BASE_URL}/api/cv/upload`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(uploadedData)
            });

            const data = await response.json();

            if (response.ok) {
                currentCvStructuredData = data.cvData;
                displayCv(data.cvData);
                updateCvMetrics(data.metrics);
                showStatusMessage('CV chargé et métriques actualisées.', 'success');
            } else {
                showStatusMessage(`Erreur lors du chargement du CV: ${data.message}`, 'error');
            }
        } catch (error) {
            console.error('Erreur lors de la lecture ou du chargement du fichier JSON:', error);
            showStatusMessage(`Erreur lors du chargement du fichier: ${error.message}`, 'error');
        }
    };
    reader.readAsText(file);
}

export {
    initCvUI,
    fetchCvData,
    generateCv,
    exportCv,
    uploadCv
};