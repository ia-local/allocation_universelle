// public/js/dashboard_ui.js - Logique DOM et events pour le tableau de bord
import { API_BASE_URL, showStatusMessage } from './app.js';

let totalUtmiEl, totalInteractionCountEl, averageUtmiPerInteractionEl, totalUtmiPerCostRatioEl,
    utmiByTypeEl, utmiByModelEl, utmiByCognitiveAxisEl,
    thematicUtmiMarketingEl, thematicUtmiAffiliationEl, thematicUtmiFiscalEconomicEl,
    mostValuableTopicsEl, mostCommonActivitiesEl, exchangeRatesEl, refreshDashboardBtn;

/**
 * Initialise les éléments et événements du tableau de bord.
 */
function initDashboardUI() {
    totalUtmiEl = document.getElementById('totalUtmiEl');
    totalInteractionCountEl = document.getElementById('totalInteractionCountEl');
    averageUtmiPerInteractionEl = document.getElementById('averageUtmiPerInteractionEl');
    totalUtmiPerCostRatioEl = document.getElementById('totalUtmiPerCostRatioEl');
    utmiByTypeEl = document.getElementById('utmiByTypeEl');
    utmiByModelEl = document.getElementById('utmiByModelEl');
    utmiByCognitiveAxisEl = document.getElementById('utmiByCognitiveAxisEl');
    thematicUtmiMarketingEl = document.getElementById('thematicUtmiMarketingEl');
    thematicUtmiAffiliationEl = document.getElementById('thematicUtmiAffiliationEl');
    thematicUtmiFiscalEconomicEl = document.getElementById('thematicUtmiFiscalEconomicEl');
    mostValuableTopicsEl = document.getElementById('mostValuableTopicsEl');
    mostCommonActivitiesEl = document.getElementById('mostCommonActivitiesEl');
    exchangeRatesEl = document.getElementById('exchangeRatesEl');
    refreshDashboardBtn = document.getElementById('refreshDashboardBtn');

    if (refreshDashboardBtn) {
        refreshDashboardBtn.onclick = fetchDashboardInsights;
    }
    console.log('[dashboard_ui.js] Dashboard UI initialized.');
}

/**
 * Récupère les insights du tableau de bord depuis l'API.
 */
async function fetchDashboardInsights() {
    showStatusMessage('Chargement des insights du tableau de bord...', 'info');
    if (refreshDashboardBtn) refreshDashboardBtn.disabled = true;

    try {
        const response = await fetch(`${API_BASE_URL}/api/dashboard-insights`);
        const data = await response.json();

        if (response.ok) {
            updateDashboardUI(data);
            showStatusMessage('Tableau de bord actualisé.', 'success');
        } else {
            showStatusMessage(`Erreur lors du chargement du tableau de bord: ${data.message}`, 'error');
        }
    } catch (error) {
        console.error('Erreur réseau ou serveur lors de la récupération des insights du tableau de bord:', error);
        showStatusMessage(`Erreur réseau: ${error.message}`, 'error');
    } finally {
        if (refreshDashboardBtn) refreshDashboardBtn.disabled = false;
    }
}

/**
 * Met à jour l'interface utilisateur du tableau de bord avec les données.
 * @param {object} insights - Les données d'insights du tableau de bord.
 */
function updateDashboardUI(insights) {
    if (totalUtmiEl) totalUtmiEl.textContent = `${insights.totalUtmi?.toFixed(2) || '0.00'} UTMi`;
    if (totalInteractionCountEl) totalInteractionCountEl.textContent = insights.totalInteractionCount || 0;
    if (averageUtmiPerInteractionEl) averageUtmiPerInteractionEl.textContent = `${insights.averageUtmiPerInteraction?.toFixed(2) || '0.00'} UTMi`;
    if (totalUtmiPerCostRatioEl) totalUtmiPerCostRatioEl.textContent = `${insights.totalUtmiPerCostRatio?.toFixed(2) || '0.00'}`;

    updateMetricList(utmiByTypeEl, insights.utmiByType, 'UTMi');
    updateMetricList(utmiByModelEl, insights.utmiByModel, 'UTMi');
    updateMetricList(utmiByCognitiveAxisEl, insights.utmiByCognitiveAxis, 'UTMi');

    if (thematicUtmiMarketingEl) thematicUtmiMarketingEl.textContent = `Marketing: ${insights.utmiByThematicFocus?.marketing?.toFixed(2) || '0.00'} UTMi`;
    if (thematicUtmiAffiliationEl) thematicUtmiAffiliationEl.textContent = `Affiliation: ${insights.utmiByThematicFocus?.affiliation?.toFixed(2) || '0.00'} UTMi`;
    if (thematicUtmiFiscalEconomicEl) thematicUtmiFiscalEconomicEl.textContent = `Fiscal-Économique: ${insights.utmiByThematicFocus?.fiscal_economique?.toFixed(2) || '0.00'} UTMi`;

    updateTextList(mostValuableTopicsEl, insights.mostValuableTopics, 'topic', 'count', ' occurrences');
    updateTextList(mostCommonActivitiesEl, insights.mostCommonActivities, 'activity', 'count', ' interactions');

    if (exchangeRatesEl) {
        exchangeRatesEl.textContent = `1 EUR = ${insights.exchangeRates?.eurToUtmi?.toFixed(2) || 'N/A'} UTMi | 1 UTMi = ${insights.exchangeRates?.utmiToEur?.toFixed(4) || 'N/A'} EUR`;
    }
}

/**
 * Fonction utilitaire pour mettre à jour les listes de métriques.
 * @param {HTMLElement} listEl - L'élément <ul> ou <ol> à mettre à jour.
 * @param {object} data - L'objet de données (e.g., { 'type1': value1, 'type2': value2 }).
 * @param {string} unit - L'unité à afficher (e.g., 'UTMi').
 */
function updateMetricList(listEl, data, unit) {
    if (!listEl) return;
    listEl.innerHTML = '';
    for (const key in data) {
        if (Object.hasOwnProperty.call(data, key)) {
            const li = document.createElement('li');
            li.textContent = `${key}: ${data[key].toFixed(2)} ${unit}`;
            listEl.appendChild(li);
        }
    }
}

/**
 * Fonction utilitaire pour mettre à jour les listes de texte triées (ex: topics, activities).
 * @param {HTMLElement} listEl - L'élément <ul> ou <ol> à mettre à jour.
 * @param {Array<object>} data - Tableau d'objets avec des propriétés à afficher.
 * @param {string} keyProp - Nom de la propriété pour la clé (ex: 'topic', 'activity').
 * @param {string} valueProp - Nom de la propriété pour la valeur (ex: 'count').
 * @param {string} suffix - Suffixe pour la valeur (ex: ' occurrences').
 */
function updateTextList(listEl, data, keyProp, valueProp, suffix = '') {
    if (!listEl) return;
    listEl.innerHTML = '';
    data.forEach(item => {
        const li = document.createElement('li');
        li.textContent = `${item[keyProp]}: ${item[valueProp]}${suffix}`;
        listEl.appendChild(li);
    });
}


export {
    initDashboardUI,
    fetchDashboardInsights // Exporté pour être appelé via app.js
};