// public/cv.js - Logique client pour CVNU

// --- CONSTANTES ---
const API_BASE_URL = window.location.origin; // Par exemple: http://localhost:3000

// --- Importation des fonctions des autres modules ES ---
import { showModal } from './modal.js';
import { setConversations, renderChatConversationList, initPaginationControls, setActiveConversationId } from './pagination.js';


// --- État de l'application ---
let currentConversationId = null;
let currentChatPage = 1;
const CHAT_CONVERSATIONS_PER_PAGE = 5; // Nombre de conversations à afficher par page
let currentCvStructuredData = null; // Stocke la dernière structure JSON du CV

// --- Variables pour les éléments du DOM (déclarées ici mais initialisées dans DOMContentLoaded) ---
let mainNavbar, navLinks, contentSections, dynamicLeftNav, dynamicNavList, globalStatusMessage;

// Page Accueil
let promptInput, iaResponseOutput, generateResponseBtn, clearPromptBtn;

// Dashboard UTMi
let totalUtmiEl, totalInteractionCountEl, averageUtmiPerInteractionEl, totalUtmiPerCostRatioEl,
    utmiByTypeEl, utmiByModelEl, utmiPerCostRatioByModelEl, utmiByCognitiveAxisEl,
    thematicUtmiMarketingEl, thematicUtmiAffiliationEl, thematicUtmiFiscalEconomicEl,
    mostValuableTopicsEl, mostCommonActivitiesEl, exchangeRatesEl, refreshDashboardBtn;

// NOUVEAU: Éléments pour le Revenu Universel et le Solde de Trésorerie
let utmiBalanceEl, eurBalanceEl, cvnuValueEl, rumMonthlyEurEl, treasuryUtmiBalanceEl, treasuryEurBalanceEl;
let claimRumBtn, refreshWalletBtn, refreshTreasuryBtn, walletUtmiContributionEl;


// Page Chat
let chatConversationList, newChatBtn, refreshConversationsBtn, chatMessagesDisplay, chatInput, sendChatBtn, currentChatTitleEl, deleteConversationBtn;

// Page CV
let cvTextInput, parseCvBtn, cvJsonOutput, cvRenderedOutput, renderCvHtmlBtn,
    downloadHtmlCvBtn, fileInput, fileDisplaySpan, calculateCvValueBtn,
    cvnuValueDisplayEl, cvLevelDisplayEl, rumCvValueDisplayEl;

// --- Fonctions Utilitaires ---

/**
 * Affiche un message de statut global (succès, erreur, info).
 * @param {string} message - Le message à afficher.
 * @param {'success'|'error'|'info'} type - Le type de message pour le style.
 * @param {number} duration - Durée d'affichage du message en ms.
 */
function showGlobalStatusMessage(message, type = 'info', duration = 3000) {
    if (!globalStatusMessage) {
        globalStatusMessage = document.getElementById('globalStatusMessage'); // Assurez-vous que l'ID est correct
        if (!globalStatusMessage) {
            console.error('Element #globalStatusMessage not found.');
            return;
        }
    }

    // Retirer toutes les classes de type précédentes
    globalStatusMessage.classList.remove('success', 'error', 'info', 'active');
    // Ajouter la nouvelle classe de type
    globalStatusMessage.classList.add(type);
    // Afficher le message
    globalStatusMessage.textContent = message;
    globalStatusMessage.classList.add('active');

    // Cacher le message après 'duration'
    setTimeout(() => {
        globalStatusMessage.classList.remove('active');
        globalStatusMessage.textContent = ''; // Vider le contenu
    }, duration);
}

/**
 * Effectue une requête API générique.
 * @param {string} endpoint - Le chemin de l'API (ex: '/api/generate').
 * @param {object} options - Options de la requête (method, headers, body).
 * @returns {Promise<object>} La réponse JSON de l'API.
 */
async function apiRequest(endpoint, options = {}) {
    showGlobalStatusMessage('Chargement...', 'info', 0); // Afficher un message de chargement
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
            ...options,
        });

        const data = await response.json();

        if (!response.ok) {
            showGlobalStatusMessage(data.message || 'Erreur API', 'error');
            throw new Error(data.message || `Erreur HTTP: ${response.status}`);
        }

        showGlobalStatusMessage('Opération réussie !', 'success');
        return data;
    } catch (error) {
        console.error('Erreur lors de la requête API:', endpoint, error);
        showGlobalStatusMessage(error.message || 'Une erreur inattendue est survenue.', 'error');
        throw error; // Propager l'erreur pour une gestion spécifique si nécessaire
    }
}

/**
 * Affiche la section de page demandée et cache les autres.
 * Met à jour les liens de navigation actifs.
 * @param {string} pageId - L'ID de la section de page à afficher (ex: 'home', 'chat', 'cv').
 */
function showPage(pageId) {
    if (!contentSections || !navLinks) return;

    contentSections.forEach(section => {
        if (section.id === pageId) {
            section.classList.add('active');
            section.classList.remove('hidden');
        } else {
            section.classList.remove('active');
            section.classList.add('hidden');
        }
    });

    // Mettre à jour l'état actif des liens de navigation principaux
    navLinks.forEach(link => {
        if (link.dataset.section === pageId) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });

    // Gérer l'affichage de la navigation gauche dynamique
    if (pageId === 'chat') {
        dynamicLeftNav.classList.add('active');
        fetchConversations(currentChatPage); // Recharger les conversations lors de l'accès à la page chat
    } else {
        dynamicLeftNav.classList.remove('active');
    }

    if (pageId === 'dashboard') {
        fetchDashboardInsights(); // Recharger les insights lors de l'accès au tableau de bord
    }

    if (pageId === 'wallet') {
        fetchWalletBalance();
        fetchTreasuryBalance();
    }

    console.log(`[UI] Showing page: ${pageId}`);
}


// --- Fonctions Spécifiques aux Pages ---

// Page Accueil: Génération de réponse IA
async function generateIaResponse() {
    const prompt = promptInput.value.trim();
    if (!prompt) {
        showGlobalStatusMessage('Veuillez entrer un prompt.', 'error');
        return;
    }

    try {
        const data = await apiRequest('/api/generate', {
            method: 'POST',
            body: JSON.stringify({ prompt })
        });
        iaResponseOutput.textContent = data.response;
        // Afficher également les UTMi et valeur EUR générées
        const utmiDetails = `UTMi générés: ${data.utmi ? data.utmi.toFixed(4) : 'N/A'} (${data.utmi_eur_value ? data.utmi_eur_value.toFixed(4) : 'N/A'} €)`;
        iaResponseOutput.textContent += `\n\n--- ${utmiDetails} ---`;
        showGlobalStatusMessage('Réponse générée avec succès.', 'success');
    } catch (error) {
        iaResponseOutput.textContent = `Erreur: ${error.message}`;
    }
}

function clearPromptAndResponse() {
    promptInput.value = '';
    iaResponseOutput.textContent = '';
    showGlobalStatusMessage('Champ de prompt vidé.', 'info');
}

// Page Chat: Gestion des conversations
async function fetchConversations(page) {
    try {
        const data = await apiRequest(`/api/conversations?page=${page}&limit=${CHAT_CONVERSATIONS_PER_PAGE}`);
        setConversations(data, page); // Utilise la fonction exportée de pagination.js
        console.log('[Chat] Conversations fetched:', data);
    } catch (error) {
        console.error('Erreur lors de la récupération des conversations:', error);
        showGlobalStatusMessage('Échec de la récupération des conversations.', 'error');
    }
}

async function startNewConversation() {
    try {
        const data = await apiRequest('/api/conversations/new', {
            method: 'POST',
            body: JSON.stringify({}) // Pas besoin de corps pour créer une nouvelle conversation vide
        });
        currentConversationId = data.id;
        setActiveConversationId(data.id); // Utilise la fonction exportée de pagination.js
        chatMessagesDisplay.innerHTML = ''; // Vider les messages précédents
        chatInput.value = ''; // Vider l'input de chat
        currentChatTitleEl.textContent = data.title || `Nouvelle conversation (${data.id.substring(0, 4)})`; // Afficher le titre
        showGlobalStatusMessage('Nouvelle conversation démarrée.', 'success');
        fetchConversations(currentChatPage); // Recharger la liste des conversations
    } catch (error) {
        console.error('Erreur lors du démarrage d\'une nouvelle conversation:', error);
        showGlobalStatusMessage('Échec du démarrage de la nouvelle conversation.', 'error');
    }
}

async function sendMessage() {
    if (!currentConversationId) {
        showGlobalStatusMessage('Veuillez démarrer ou sélectionner une conversation.', 'error');
        return;
    }

    const messageContent = chatInput.value.trim();
    if (!messageContent) {
        showGlobalStatusMessage('Veuillez entrer un message.', 'error');
        return;
    }

    // Ajouter le message de l'utilisateur à l'affichage
    appendMessageToChat('user', messageContent);
    chatInput.value = ''; // Vider l'input

    try {
        const data = await apiRequest(`/api/conversations/${currentConversationId}/message`, {
            method: 'POST',
            body: JSON.stringify({ message: messageContent })
        });
        appendMessageToChat('assistant', data.response);
        // Mettre à jour le titre de la conversation si c'est le premier message
        if (data.conversation && data.conversation.title && currentChatTitleEl.textContent.includes('Nouvelle conversation')) {
            currentChatTitleEl.textContent = data.conversation.title;
        }
        showGlobalStatusMessage('Message envoyé et réponse reçue.', 'success');
        fetchConversations(currentChatPage); // Rafraîchir la liste pour mettre à jour UTMi total
    } catch (error) {
        console.error('Erreur lors de l\'envoi du message:', error);
        showGlobalStatusMessage('Échec de l\'envoi du message.', 'error');
        // Optionnel: Retirer le message de l'utilisateur ou le marquer comme non envoyé
    }
}

function appendMessageToChat(role, content) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('chat-message', role);
    messageElement.innerHTML = `<span class="message-role">${role === 'user' ? 'Vous' : 'IA'} :</span> ${content}`;
    chatMessagesDisplay.appendChild(messageElement);
    chatMessagesDisplay.scrollTop = chatMessagesDisplay.scrollHeight; // Faire défiler vers le bas
}

async function selectConversation(id) {
    try {
        const data = await apiRequest(`/api/conversations/${id}`);
        currentConversationId = data.id;
        setActiveConversationId(data.id); // Utilise la fonction exportée de pagination.js
        currentChatTitleEl.textContent = data.title || `Conversation ${data.id.substring(0, 4)}`;
        chatMessagesDisplay.innerHTML = '';
        data.messages.forEach(msg => appendMessageToChat(msg.role, msg.content));
        showGlobalStatusMessage(`Conversation "${data.title || 'sans titre'}" chargée.`, 'info');
    } catch (error) {
        console.error('Erreur lors de la sélection de la conversation:', error);
        showGlobalStatusMessage('Échec du chargement de la conversation.', 'error');
    }
}

async function deleteConversation(id) {
    const confirmDelete = await showModal(
        'Confirmer la suppression',
        'Êtes-vous sûr de vouloir supprimer cette conversation ? Cette action est irréversible.',
        'confirm'
    );

    if (!confirmDelete) {
        showGlobalStatusMessage('Suppression annulée.', 'info');
        return;
    }

    try {
        await apiRequest(`/api/conversations/${id}`, {
            method: 'DELETE'
        });
        showGlobalStatusMessage('Conversation supprimée avec succès.', 'success');
        if (currentConversationId === id) {
            currentConversationId = null;
            chatMessagesDisplay.innerHTML = '';
            currentChatTitleEl.textContent = 'Sélectionnez ou démarrez une conversation';
        }
        fetchConversations(currentChatPage); // Recharger la liste
    } catch (error) {
        console.error('Erreur lors de la suppression de la conversation:', error);
        showGlobalStatusMessage('Échec de la suppression de la conversation.', 'error');
    }
}


// Page Dashboard: Récupération et affichage des insights
async function fetchDashboardInsights() {
    try {
        const insights = await apiRequest('/api/dashboard-insights');
        console.log('[Dashboard] Insights:', insights);

        if (totalUtmiEl) totalUtmiEl.textContent = (insights.totalUtmi || 0).toFixed(4);
        if (totalInteractionCountEl) totalInteractionCountEl.textContent = insights.totalInteractionCount || 0;
        if (averageUtmiPerInteractionEl) averageUtmiPerInteractionEl.textContent = (insights.averageUtmiPerInteraction || 0).toFixed(4);

        // Mise à jour des valeurs pour les cartes d'insights thématiques
        if (thematicUtmiMarketingEl) thematicUtmiMarketingEl.textContent = (insights.utmiByThematicFocus?.marketing || 0).toFixed(4);
        if (thematicUtmiAffiliationEl) thematicUtmiAffiliationEl.textContent = (insights.utmiByThematicFocus?.affiliation || 0).toFixed(4);
        if (thematicUtmiFiscalEconomicEl) thematicUtmiFiscalEconomicEl.textContent = (insights.utmiByThematicFocus?.['fiscal-economic'] || 0).toFixed(4);


        // Affichage des top topics et activités
        if (mostValuableTopicsEl) {
            mostValuableTopicsEl.innerHTML = insights.mostValuableTopics?.map(item => `<li>${item.topic} (${item.count} interactions)</li>`).join('') || '<li>Aucun</li>';
        }
        if (mostCommonActivitiesEl) {
            mostCommonActivitiesEl.innerHTML = insights.mostCommonActivities?.map(item => `<li>${item.activity} (${item.count} occurrences)</li>`).join('') || '<li>Aucune</li>';
        }

        // Simuler des taux de change pour l'affichage (à remplacer par une API réelle)
        if (exchangeRatesEl) {
            exchangeRatesEl.innerHTML = `
                <li>1 UTMi ≈ 0.005 €</li>
                <li>1 UTMi ≈ 0.0054 $</li>
            `;
        }

        // Mettre à jour les graphiques Chart.js si vous en avez
        updateCharts(insights);

        showGlobalStatusMessage('Tableau de bord mis à jour.', 'success');
    } catch (error) {
        console.error('Erreur lors de la récupération des insights du tableau de bord:', error);
        showGlobalStatusMessage('Échec de la récupération des insights du tableau de bord.', 'error');
    }
}

// Fonction de mise à jour des graphiques Chart.js
let utmiByTypeChart, utmiByModelChart, utmiByCognitiveAxisChart;

function updateCharts(insights) {
    const ctxUtmiByType = document.getElementById('utmiByTypeChart')?.getContext('2d');
    const ctxUtmiByModel = document.getElementById('utmiByModelChart')?.getContext('2d');
    const ctxUtmiByCognitiveAxis = document.getElementById('utmiByCognitiveAxisChart')?.getContext('2d');

    // Assurez-vous que les contextes existent avant de créer/mettre à jour les graphiques
    if (ctxUtmiByType) {
        if (utmiByTypeChart) utmiByTypeChart.destroy();
        utmiByTypeChart = new Chart(ctxUtmiByType, {
            type: 'bar',
            data: {
                labels: Object.keys(insights.utmiByType || {}),
                datasets: [{
                    label: 'UTMi par Type d\'Interaction',
                    data: Object.values(insights.utmiByType || {}),
                    backgroundColor: 'rgba(75, 192, 192, 0.6)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    }

    if (ctxUtmiByModel) {
        if (utmiByModelChart) utmiByModelChart.destroy();
        utmiByModelChart = new Chart(ctxUtmiByModel, {
            type: 'pie',
            data: {
                labels: Object.keys(insights.utmiByModel || {}),
                datasets: [{
                    label: 'UTMi par Modèle IA',
                    data: Object.values(insights.utmiByModel || {}),
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.6)',
                        'rgba(54, 162, 235, 0.6)',
                        'rgba(255, 206, 86, 0.6)',
                        'rgba(75, 192, 192, 0.6)'
                    ],
                    borderColor: [
                        'rgba(255, 99, 132, 1)',
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 206, 86, 1)',
                        'rgba(75, 192, 192, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
            }
        });
    }

    if (ctxUtmiByCognitiveAxis) {
        if (utmiByCognitiveAxisChart) utmiByCognitiveAxisChart.destroy();
        utmiByCognitiveAxisChart = new Chart(ctxUtmiByCognitiveAxis, {
            type: 'doughnut',
            data: {
                labels: Object.keys(insights.utmiByCognitiveAxis || {}),
                datasets: [{
                    label: 'UTMi par Axe Cognitif',
                    data: Object.values(insights.utmiByCognitiveAxis || {}),
                    backgroundColor: [
                        'rgba(153, 102, 255, 0.6)',
                        'rgba(255, 159, 64, 0.6)',
                        'rgba(200, 200, 200, 0.6)'
                    ],
                    borderColor: [
                        'rgba(153, 102, 255, 1)',
                        'rgba(255, 159, 64, 1)',
                        'rgba(200, 200, 200, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
            }
        });
    }
}


// Page Wallet (Portefeuille et Trésorerie)
async function fetchWalletBalance() {
    try {
        const data = await apiRequest('/api/wallet/balance');
        console.log('[Wallet] Balance:', data);
        if (utmiBalanceEl) utmiBalanceEl.textContent = (data.utmiBalance || 0).toFixed(4);
        if (eurBalanceEl) eurBalanceEl.textContent = (data.eurBalance || 0).toFixed(2);
        if (cvnuValueEl) cvnuValueEl.textContent = (data.cvnuValue || 0).toFixed(2);
        if (rumMonthlyEurEl) rumMonthlyEurEl.textContent = (data.rumMonthlyEur || 0).toFixed(2);
        if (walletUtmiContributionEl) walletUtmiContributionEl.textContent = (data.treasuryUtmiContribution || 0).toFixed(4);
        showGlobalStatusMessage('Solde du portefeuille mis à jour.', 'success');
    } catch (error) {
        console.error('Erreur lors de la récupération du solde du portefeuille:', error);
        showGlobalStatusMessage('Échec de la récupération du solde du portefeuille.', 'error');
    }
}

async function claimRum() {
    const confirmClaim = await showModal(
        'Réclamer le RUM',
        'Voulez-vous réclamer votre Revenu Universel Mensuel (RUM) ?',
        'confirm'
    );

    if (!confirmClaim) {
        showGlobalStatusMessage('Réclamation du RUM annulée.', 'info');
        return;
    }

    try {
        const data = await apiRequest('/api/wallet/claim-rum', {
            method: 'POST'
        });
        showGlobalStatusMessage(data.message || 'RUM réclamé avec succès!', 'success');
        fetchWalletBalance(); // Rafraîchir le solde après la réclamation
    } catch (error) {
        console.error('Erreur lors de la réclamation du RUM:', error);
        // Le message d'erreur générique est déjà géré par apiRequest, mais on peut ajouter une spécificité ici si besoin
    }
}

async function fetchTreasuryBalance() {
    try {
        const data = await apiRequest('/api/wallet/treasury-balance');
        console.log('[Wallet] Treasury Balance:', data);
        if (treasuryUtmiBalanceEl) treasuryUtmiBalanceEl.textContent = (data.treasuryUtmiBalance || 0).toFixed(4);
        if (treasuryEurBalanceEl) treasuryEurBalanceEl.textContent = (data.treasuryEurBalance || 0).toFixed(2);
        showGlobalStatusMessage('Solde de la trésorerie mis à jour.', 'success');
    } catch (error) {
        console.error('Erreur lors de la récupération du solde de la trésorerie:', error);
        showGlobalStatusMessage('Échec de la récupération du solde de la trésorerie.', 'error');
    }
}


// Page CV: Traitement et Valorisation du CV
async function parseAndStructureCv() {
    const cvText = cvTextInput.value.trim();
    if (!cvText && (!fileInput || fileInput.files.length === 0)) {
        showGlobalStatusMessage('Veuillez coller du texte de CV ou sélectionner un fichier.', 'error');
        return;
    }

    let payload;
    let endpoint = '/api/cv/parse-and-structure';

    if (fileInput && fileInput.files.length > 0) {
        const file = fileInput.files[0];
        const formData = new FormData();
        formData.append('cvFile', file);
        // Pour FormData, ne pas définir Content-Type, le navigateur le fera correctement (multipart/form-data)
        payload = formData;
    } else {
        payload = JSON.stringify({ cvText: cvText });
    }

    try {
        const data = await apiRequest(endpoint, {
            method: 'POST',
            body: payload,
            // Header Content-Type seulement pour JSON, pas pour FormData
            headers: fileInput && fileInput.files.length > 0 ? {} : { 'Content-Type': 'application/json' }
        });

        currentCvStructuredData = data.structuredCv; // Stocker les données structurées
        cvJsonOutput.textContent = JSON.stringify(data.structuredCv, null, 2);
        showGlobalStatusMessage('CV analysé et structuré avec succès.', 'success');
    } catch (error) {
        cvJsonOutput.textContent = `Erreur: ${error.message}`;
    }
}

async function renderCvAsHtml() {
    if (!currentCvStructuredData) {
        showGlobalStatusMessage('Veuillez d\'abord structurer un CV.', 'error');
        return;
    }

    try {
        const data = await apiRequest('/api/cv/render-html', {
            method: 'POST',
            body: JSON.stringify({ structuredCv: currentCvStructuredData })
        });
        cvRenderedOutput.innerHTML = data.html;
        downloadHtmlCvBtn.style.display = 'inline-block'; // Afficher le bouton de téléchargement
        showGlobalStatusMessage('CV rendu en HTML.', 'success');
    } catch (error) {
        cvRenderedOutput.innerHTML = `Erreur lors du rendu HTML: ${error.message}`;
        downloadHtmlCvBtn.style.display = 'none';
    }
}

function downloadHtmlCv() {
    if (!cvRenderedOutput || !cvRenderedOutput.innerHTML) {
        showGlobalStatusMessage('Aucun CV rendu en HTML à télécharger.', 'error');
        return;
    }
    const htmlContent = cvRenderedOutput.innerHTML;
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mon_cv_nu.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showGlobalStatusMessage('CV HTML téléchargé.', 'success');
}

async function fetchLastStructuredCvData() {
    try {
        const data = await apiRequest('/api/cv/last-structured-data');
        if (data && data.structuredCv) {
            currentCvStructuredData = data.structuredCv;
            cvJsonOutput.textContent = JSON.stringify(data.structuredCv, null, 2);
            showGlobalStatusMessage('Dernier CV structuré chargé.', 'success');
            // Afficher le bouton de rendu si les données sont chargées
            renderCvHtmlBtn.style.display = 'inline-block';
        } else {
            cvJsonOutput.textContent = 'Aucune donnée de CV structurée trouvée.';
            currentCvStructuredData = null;
            renderCvHtmlBtn.style.display = 'none';
            showGlobalStatusMessage('Aucun CV structuré précédent.', 'info');
        }
    } catch (error) {
        cvJsonOutput.textContent = `Erreur: ${error.message}`;
        currentCvStructuredData = null;
        renderCvHtmlBtn.style.display = 'none';
    }
}


async function calculateCvValue() {
    if (!currentCvStructuredData) {
        showGlobalStatusMessage('Veuillez d\'abord structurer un CV pour calculer sa valeur.', 'error');
        return;
    }

    try {
        const data = await apiRequest('/api/cv/calculate-value', {
            method: 'POST',
            body: JSON.stringify({ structuredCv: currentCvStructuredData })
        });
        console.log('[CV Value] Result:', data);
        if (cvnuValueDisplayEl) cvnuValueDisplayEl.textContent = (data.cvnuValue || 0).toFixed(2);
        if (rumCvValueDisplayEl) rumCvValueDisplayEl.textContent = (data.rumMonthlyEur || 0).toFixed(2);
        // Mettre à jour l'affichage du niveau du CV
        if (cvLevelDisplayEl) {
            let levelText = 'Non défini';
            if (data.cvLevel) {
                if (data.cvLevel.senior) levelText = 'Senior';
                else if (data.cvLevel.middle) levelText = 'Middle';
                else if (data.cvLevel.junior) levelText = 'Junior';
            }
            cvLevelDisplayEl.textContent = levelText;
        }
        showGlobalStatusMessage('Valeur du CVNU calculée avec succès.', 'success');
    } catch (error) {
        console.error('Erreur lors du calcul de la valeur du CV:', error);
        showGlobalStatusMessage('Échec du calcul de la valeur du CV.', 'error');
    }
}

// --- Initialisation du DOM et Attachement des Écouteurs d'Événements ---
document.addEventListener('DOMContentLoaded', () => {
    // Initialisation des variables DOM
    mainNavbar = document.getElementById('mainNavbar');
    navLinks = document.querySelectorAll('.navbar-main-links .nav-link');
    contentSections = document.querySelectorAll('.content-section');
    dynamicLeftNav = document.getElementById('dynamicLeftNav');
    dynamicNavList = document.getElementById('dynamicNavList');
    globalStatusMessage = document.getElementById('globalStatusMessage'); // Assurez-vous d'avoir cet ID dans index.html

    // Page Accueil
    promptInput = document.getElementById('promptInput');
    iaResponseOutput = document.getElementById('iaResponseOutput');
    generateResponseBtn = document.getElementById('generateResponseBtn');
    clearPromptBtn = document.getElementById('clearPromptBtn');

    // Dashboard UTMi
    totalUtmiEl = document.getElementById('totalUtmi');
    totalInteractionCountEl = document.getElementById('totalInteractionCount');
    averageUtmiPerInteractionEl = document.getElementById('averageUtmiPerInteraction');
    utmiByTypeEl = document.getElementById('utmiByType'); // Cet élément est le conteneur du graphique
    utmiByModelEl = document.getElementById('utmiByModel'); // Cet élément est le conteneur du graphique
    utmiByCognitiveAxisEl = document.getElementById('utmiByCognitiveAxis'); // Conteneur du graphique
    thematicUtmiMarketingEl = document.getElementById('thematicUtmiMarketing');
    thematicUtmiAffiliationEl = document.getElementById('thematicUtmiAffiliation');
    thematicUtmiFiscalEconomicEl = document.getElementById('thematicUtmiFiscalEconomic');
    mostValuableTopicsEl = document.getElementById('mostValuableTopics');
    mostCommonActivitiesEl = document.getElementById('mostCommonActivities');
    exchangeRatesEl = document.getElementById('exchangeRates');
    refreshDashboardBtn = document.getElementById('refreshDashboardBtn');

    // NOUVEAU: Éléments pour le Revenu Universel et le Solde de Trésorerie
    utmiBalanceEl = document.getElementById('utmiBalance');
    eurBalanceEl = document.getElementById('eurBalance');
    cvnuValueEl = document.getElementById('cvnuValue');
    rumMonthlyEurEl = document.getElementById('rumMonthlyEur');
    walletUtmiContributionEl = document.getElementById('walletUtmiContribution');
    claimRumBtn = document.getElementById('claimRumBtn');
    refreshWalletBtn = document.getElementById('refreshWalletBtn');
    treasuryUtmiBalanceEl = document.getElementById('treasuryUtmiBalance');
    treasuryEurBalanceEl = document.getElementById('treasuryEurBalance');
    refreshTreasuryBtn = document.getElementById('refreshTreasuryBtn');


    // Page Chat
    chatConversationList = document.getElementById('chatConversationList');
    newChatBtn = document.getElementById('newChatBtn');
    refreshConversationsBtn = document.getElementById('refreshConversationsBtn');
    chatMessagesDisplay = document.getElementById('chatMessagesDisplay');
    chatInput = document.getElementById('chatInput');
    sendChatBtn = document.getElementById('sendChatBtn');
    currentChatTitleEl = document.getElementById('currentChatTitle');
    deleteConversationBtn = document.getElementById('deleteConversationBtn');

    // Page CV
    cvTextInput = document.getElementById('cvTextInput');
    parseCvBtn = document.getElementById('parseCvBtn');
    cvJsonOutput = document.getElementById('cvJsonOutput');
    cvRenderedOutput = document.getElementById('cvRenderedOutput');
    renderCvHtmlBtn = document.getElementById('renderCvHtmlBtn');
    downloadHtmlCvBtn = document.getElementById('downloadHtmlCvBtn');
    fileInput = document.getElementById('cvFileInput');
    fileDisplaySpan = document.getElementById('fileDisplaySpan');
    calculateCvValueBtn = document.getElementById('calculateCvValueBtn');
    cvnuValueDisplayEl = document.getElementById('cvnuValueDisplay');
    cvLevelDisplayEl = document.getElementById('cvLevelDisplay');
    rumCvValueDisplayEl = document.getElementById('rumCvValueDisplay');


    // Attacher les écouteurs d'événements
    if (generateResponseBtn) generateResponseBtn.addEventListener('click', generateIaResponse);
    if (clearPromptBtn) clearPromptBtn.addEventListener('click', clearPromptAndResponse);

    // Chat
    if (newChatBtn) newChatBtn.addEventListener('click', startNewConversation);
    if (sendChatBtn) sendChatBtn.addEventListener('click', sendMessage);
    if (chatInput) chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
    if (refreshConversationsBtn) refreshConversationsBtn.addEventListener('click', () => fetchConversations(currentChatPage));
    if (deleteConversationBtn) deleteConversationBtn.addEventListener('click', () => {
        if (currentConversationId) {
            deleteConversation(currentConversationId);
        } else {
            showGlobalStatusMessage('Aucune conversation sélectionnée à supprimer.', 'info');
        }
    });


    // Initialisation des contrôles de pagination (maintenant importés)
    if (chatConversationList) {
        initPaginationControls(
            chatConversationList,
            document.getElementById('prevChatPageBtn'), // Ces IDs doivent exister dans index.html
            document.getElementById('nextChatPageBtn'), // Ces IDs doivent exister dans index.html
            document.getElementById('currentPageInfo'), // Ces IDs doivent exister dans index.html
            selectConversation, // Callback pour la sélection
            deleteConversation  // Callback pour la suppression
        );
    }


    // CV
    if (parseCvBtn) parseCvBtn.addEventListener('click', parseAndStructureCv);
    if (renderCvHtmlBtn) renderCvHtmlBtn.addEventListener('click', renderCvAsHtml);
    if (downloadHtmlCvBtn) downloadHtmlCvBtn.addEventListener('click', downloadHtmlCv);
    if (calculateCvValueBtn) calculateCvValueBtn.addEventListener('click', calculateCvValue);
    if (document.getElementById('loadLastCvBtn')) document.getElementById('loadLastCvBtn').addEventListener('click', fetchLastStructuredCvData);
    if (fileInput) {
        fileInput.addEventListener('change', (event) => {
            if (fileInput.files.length > 0) {
                if (fileDisplaySpan) fileDisplaySpan.textContent = fileInput.files[0].name;
            } else {
                if (fileDisplaySpan) fileDisplaySpan.textContent = 'Aucun fichier';
            }
        });
    }

    // Attach event listeners to main navigation links
    if (navLinks) {
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault(); // Prevent default anchor link behavior
                const pageId = e.target.dataset.section;
                if (pageId) {
                    console.log(`[Nav Click] Main nav link clicked for section: ${pageId}`);
                    showPage(pageId);
                    // Update URL hash without reloading
                    history.pushState(null, '', `#${pageId}`);
                } else {
                    console.warn('[Nav Click] Clicked nav link has no data-section attribute.');
                }
            });
        });
    }

    // Dashboard
    if (refreshDashboardBtn) refreshDashboardBtn.addEventListener('click', fetchDashboardInsights);

    // Wallet
    if (claimRumBtn) claimRumBtn.addEventListener('click', claimRum);
    if (refreshWalletBtn) refreshWalletBtn.addEventListener('click', fetchWalletBalance);
    if (refreshTreasuryBtn) refreshTreasuryBtn.addEventListener('click', fetchTreasuryBalance);


    // Initial page load based on URL hash or default to 'home'
    const initialPageId = window.location.hash.substring(1) || 'home';
    console.log(`[DOMContentLoaded] Initial page ID: ${initialPageId}`);
    showPage(initialPageId);

    // Initial fetch for dashboard data
    fetchDashboardInsights();
    fetchWalletBalance(); // Charger le solde du portefeuille à l'initialisation
    fetchTreasuryBalance(); // Charger le solde de la trésorerie à l'initialisation


    console.log('[DOMContentLoaded] CVNU application initialization complete.');
});