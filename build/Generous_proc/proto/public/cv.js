// public/cv.js - Logique client pour CVNU (Simplifié pour le prototype)

// --- CONSTANTES ---\
const API_BASE_URL = window.location.origin;

// --- Global state for modals (imported from modal.js) ---\
import { showModal } from './modal.js';

// --- Global state for pagination (imported from pagination.js) ---\
import { setConversations, renderChatConversationList, initPaginationControls, setActiveConversationId } from './pagination.js';


// --- État de l'application (simplifié) ---\
let currentConversationId = null; // ID de la conversation de chat active
let currentCvStructuredData = null; // Stocke la dernière structure JSON du CV
let mockConversations = []; // Pour simuler des conversations en mémoire


// --- Variables pour les éléments du DOM (déclarées ici mais initialisées dans DOMContentLoaded) ---\
let mainNavbar, navLinks, contentSections, dynamicLeftNav, dynamicNavList, globalStatusMessage;

// Page Accueil
let promptInput, iaResponseOutput, generateResponseBtn, clearPromptBtn;

// Dashboard UTMi (Simplifié - certains éléments ne seront pas mis à jour par le serveur simplifié)
let totalUtmiEl, totalEstimatedCostUSDEl, totalEstimatedCostEUREl, totalInteractionCountEl,
    initialCapitalEl, monthlyUniversalIncomeEl, treasuryBalanceEl, refreshDashboardBtn;

// Elements des détails du dashboard qui ne sont pas supportés par le prototype mais existent dans l'HTML
// S'ils ne sont pas mis à jour, ils afficheront leur valeur par défaut ou "Aucune donnée"
let utmiByTypeEl, utmiByModelEl, utmiPerCostRatioByModelEl, utmiByCognitiveAxisEl,
    thematicUtmiMarketingEl, thematicUtmiAffiliationEl, thematicUtmiFiscalEconomicEl,
    mostValuableTopicsEl, mostCommonActivitiesEl, exchangeRatesEl;


// Gestion du CV
let cvInput, generateCvBtn, importCvFileBtn, actualCvFileInput, downloadCvBtn, cvOutput,
    cvnuInitialValueEl, cvnuLevelEl, cvnuEstimatedMonthlyIncomeEl, calculateCvnuValueBtn;


// Chat IA
let chatMessages, chatInput, chatSendButton;
let conversationListEl, prevPageBtn, nextPageBtn, currentPageInfoSpan; // Éléments pour la pagination de chat

// --- Fonctions utilitaires ---\

function showStatusMessage(message, type = 'info') {
    if (globalStatusMessage) {
        globalStatusMessage.textContent = message;
        globalStatusMessage.className = `status-message ${type}`;
        globalStatusMessage.style.display = 'block';
        setTimeout(() => {
            globalStatusMessage.style.display = 'none';
        }, 3000);
    }
}

function showLoading(element) {
    if (element) {
        element.disabled = true;
        element.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Chargement...';
    }
}

function hideLoading(element, originalText, iconClass = '') {
    if (element) {
        element.disabled = false;
        element.innerHTML = iconClass ? `<i class="${iconClass}"></i> ${originalText}` : originalText;
    }
}


// --- Fonctions d'API Simplifiées ---

async function fetchDashboardInsights() {
    showStatusMessage('Actualisation du tableau de bord...', 'info');
    try {
        const response = await fetch(`${API_BASE_URL}/api/dashboard-insights`);
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || `Erreur HTTP: ${response.status}`);
        }
        updateDashboardUI(data);
        showStatusMessage('Tableau de bord actualisé avec succès.', 'success');
    } catch (error) {
        console.error('Erreur lors de la récupération des insights du tableau de bord:', error);
        showStatusMessage(`Erreur tableau de bord: ${error.message}`, 'error');
    }
}

async function generateAIResponse(prompt) {
    showLoading(generateResponseBtn, 'Générer Réponse', 'fas fa-magic');
    try {
        const response = await fetch(`${API_BASE_URL}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt })
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || `Erreur HTTP: ${response.status}`);
        }
        iaResponseOutput.textContent = data.response;
        showStatusMessage('Réponse IA générée.', 'success');
    } catch (error) {
        console.error('Erreur lors de la génération de la réponse IA:', error);
        iaResponseOutput.textContent = `Erreur: ${error.message}`;
        showStatusMessage(`Erreur génération IA: ${error.message}`, 'error');
    } finally {
        hideLoading(generateResponseBtn, 'Générer Réponse', 'fas fa-magic');
        fetchDashboardInsights(); // Actualise le dashboard après interaction
    }
}

async function generateStructuredCv(cvText) {
    showLoading(generateCvBtn, 'Générer CV Structuré', 'fas fa-cogs');
    cvOutput.innerHTML = '<p class="loading-text"><i class="fas fa-spinner fa-spin"></i> Traitement du CV...</p>';
    calculateCvnuValueBtn.disabled = true; // Désactiver pendant le traitement

    try {
        const response = await fetch(`${API_BASE_URL}/api/cv/parse-and-structure`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cvText })
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || `Erreur HTTP: ${response.status}`);
        }
        currentCvStructuredData = data;
        cvOutput.textContent = JSON.stringify(data, null, 2);
        downloadCvBtn.style.display = 'inline-block';
        calculateCvnuValueBtn.disabled = false; // Activer après la génération
        showStatusMessage('CV structuré avec succès.', 'success');
    } catch (error) {
        console.error('Erreur lors de la structuration du CV:', error);
        cvOutput.innerHTML = `<p class="error-text">Erreur: ${error.message}</p>`;
        showStatusMessage(`Erreur CV: ${error.message}`, 'error');
    } finally {
        hideLoading(generateCvBtn, 'Générer CV Structuré', 'fas fa-cogs');
    }
}

async function calculateCvnuValue() {
    if (!currentCvStructuredData) {
        showStatusMessage('Veuillez d\'abord structurer votre CV.', 'warning');
        return;
    }

    showLoading(calculateCvnuValueBtn, 'Calculer Valeur CVNU', 'fas fa-calculator');
    try {
        const response = await fetch(`${API_BASE_URL}/api/cv/calculate-value`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cvStructuredData: currentCvStructuredData })
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || `Erreur HTTP: ${response.status}`);
        }
        // Mise à jour de l'UI des insights CVNU
        cvnuInitialValueEl.textContent = data.initialCvValue.toFixed(2);
        cvnuLevelEl.textContent = data.cvLevel;
        cvnuEstimatedMonthlyIncomeEl.textContent = data.estimatedMonthlyUniversalIncomeEUR.toFixed(2);
        showStatusMessage('Valeur CVNU calculée avec succès.', 'success');
        fetchDashboardInsights(); // Actualise le dashboard après calcul CVNU
    } catch (error) {
        console.error('Erreur lors du calcul de la valeur CVNU:', error);
        showStatusMessage(`Erreur calcul CVNU: ${error.message}`, 'error');
    } finally {
        hideLoading(calculateCvnuValueBtn, 'Calculer Valeur CVNU', 'fas fa-calculator');
    }
}

async function fetchLastStructuredCv() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/cv/last-structured-data`);
        const data = await response.json();
        if (response.ok) {
            currentCvStructuredData = data;
            cvOutput.textContent = JSON.stringify(data, null, 2);
            downloadCvBtn.style.display = 'inline-block';
            calculateCvnuValueBtn.disabled = false;
        } else if (response.status === 404) {
            cvOutput.innerHTML = '<p class="placeholder-text">Aucun CV structuré n\'est disponible. Générez-en un !</p>';
            downloadCvBtn.style.display = 'none';
            calculateCvnuValueBtn.disabled = true;
            // Ne pas afficher d'erreur, c'est un état normal au démarrage
        } else {
            throw new Error(data.error || `Erreur HTTP: ${response.status}`);
        }
    } catch (error) {
        console.error('Erreur lors de la récupération du dernier CV structuré:', error);
        cvOutput.innerHTML = `<p class="error-text">Erreur de chargement du CV: ${error.message}</p>`;
        showStatusMessage(`Erreur chargement CV: ${error.message}`, 'error');
    }
}

// --- Fonctions de Mise à Jour de l'UI ---

let mainChart; // Pour stocker l'instance Chart.js

function updateDashboardUI(data) {
    if (data) {
        totalUtmiEl.textContent = data.totalUtmi?.toFixed(2) || '0.00';
        initialCapitalEl.textContent = data.initialCapitalEUR?.toFixed(2) || '0.00';
        monthlyUniversalIncomeEl.textContent = data.monthlyUniversalIncomeEUR?.toFixed(2) || '0.00';
        treasuryBalanceEl.textContent = data.treasuryBalanceEUR?.toFixed(2) || '0.00';
        totalEstimatedCostUSDEl.textContent = data.totalEstimatedCostUSD?.toFixed(6) || '0.000000';
        totalEstimatedCostEUREl.textContent = data.totalEstimatedCostEUR?.toFixed(6) || '0.000000';
        totalInteractionCountEl.textContent = data.totalInteractionCount || 0;

        // Mise à jour des autres détails du dashboard (simplifiés)
        updateListUI(utmiByTypeEl, data.utmiByType, (item) => `${item.type}: ${item.utmi.toFixed(2)} UTMi`);
        updateListUI(utmiByModelEl, data.utmiByModel, (item) => `${item.model}: ${item.utmi.toFixed(2)} UTMi`);
        updateListUI(utmiPerCostRatioByModelEl, data.utmiPerCostRatioByModel, (item) => `${item.model}: ${item.ratio.toFixed(2)}`);
        updateListUI(utmiByCognitiveAxisEl, data.utmiByCognitiveAxis, (item) => `${item.axis}: ${item.utmi.toFixed(2)} UTMi`);
        updateListUI(mostValuableTopicsEl, data.mostValuableTopics, (item) => `${item.topic}: ${item.utmi.toFixed(2)} UTMi`);
        updateListUI(mostCommonActivitiesEl, data.mostCommonActivities, (item) => `${item.activity} (${item.count})`);

        if (thematicUtmiMarketingEl) thematicUtmiMarketingEl.textContent = `Marketing: ${data.thematicUtmi?.marketing?.toFixed(2) || '0.00'} UTMi`;
        if (thematicUtmiAffiliationEl) thematicUtmiAffiliationEl.textContent = `Affiliation: ${data.thematicUtmi?.affiliation?.toFixed(2) || '0.00'} UTMi`;
        if (thematicUtmiFiscalEconomicEl) thematicUtmiFiscalEconomicEl.textContent = `Fiscal/Économique: ${data.thematicUtmi?.fiscalEconomic?.toFixed(2) || '0.00'} UTMi`;

        if (exchangeRatesEl) {
            if (data.exchangeRates) {
                exchangeRatesEl.innerHTML = `<li>1 EUR = ${data.exchangeRates.USD?.toFixed(4) || 'N/A'} USD</li>`;
            } else {
                exchangeRatesEl.innerHTML = '<li>Aucune donnée.</li>';
            }
        }

        updateMainChart(data);
    }
}

function updateListUI(element, dataArray, formatter) {
    if (!element) return;
    element.innerHTML = '';
    if (dataArray && dataArray.length > 0) {
        dataArray.forEach(item => {
            const li = document.createElement('li');
            li.textContent = formatter(item);
            element.appendChild(li);
        });
    } else {
        const li = document.createElement('li');
        li.textContent = 'Aucune donnée.';
        element.appendChild(li);
    }
}


function updateMainChart(data) {
    const ctx = document.getElementById('mainFinancialChart')?.getContext('2d');
    if (!ctx) return;

    if (mainChart) {
        mainChart.destroy(); // Détruit l'instance précédente si elle existe
    }

    mainChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Total UTMi', 'Capital Initial (EUR)', 'Revenu Mensuel (EUR)', 'Trésorerie (EUR)'],
            datasets: [{
                label: 'Valeurs',
                data: [
                    data.totalUtmi || 0,
                    data.initialCapitalEUR || 0,
                    data.monthlyUniversalIncomeEUR || 0,
                    data.treasuryBalanceEUR || 0
                ],
                backgroundColor: [
                    'rgba(54, 162, 235, 0.6)', // Blue for UTMi
                    'rgba(75, 192, 192, 0.6)', // Green for Capital
                    'rgba(153, 102, 255, 0.6)', // Purple for Income
                    'rgba(255, 159, 64, 0.6)'  // Orange for Treasury
                ],
                borderColor: [
                    'rgba(54, 162, 235, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)',
                    'rgba(255, 159, 64, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                title: { display: true, text: 'Aperçu Financier Principal' }
            },
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}


// --- Gestion des sections et de la navigation ---

function showSection(sectionId) {
    contentSections.forEach(section => {
        section.classList.remove('active');
    });
    const activeSection = document.getElementById(sectionId);
    if (activeSection) {
        activeSection.classList.add('active');
    }

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.dataset.section === sectionId) {
            link.classList.add('active');
        }
    });
    updateDynamicLeftNav(sectionId);
}

function updateDynamicLeftNav(activeSectionId) {
    dynamicNavList.innerHTML = ''; // Clear previous items
    let navTitle = '';

    if (activeSectionId === 'chat') {
        navTitle = 'Conversations Récentes';
        // Simule l'affichage des conversations de chat
        const chatControls = `
            <div class="chat-controls" id="conversation-pagination">
                <button id="prevPageBtn" class="btn btn-sm btn-secondary" disabled><i class="fas fa-chevron-left"></i></button>
                <span id="currentPageInfoSpan">Page 0/0</span>
                <button id="nextPageBtn" class="btn btn-sm btn-secondary" disabled><i class="fas fa-chevron-right"></i></button>
            </div>
            <button id="newConversationBtn" class="btn btn-primary btn-block mt-2"><i class="fas fa-plus"></i> Nouvelle Conversation</button>
        `;
        dynamicNavList.insertAdjacentHTML('beforebegin', chatControls); // Insérer les contrôles avant la liste

        // Récupérer les éléments DOM après insertion
        const conversationListEl = document.querySelector('#dynamicLeftNav .dynamic-nav-list');
        const prevPageBtn = document.getElementById('prevPageBtn');
        const nextPageBtn = document.getElementById('nextPageBtn');
        const currentPageInfoSpan = document.getElementById('currentPageInfoSpan');
        const newConversationBtn = document.getElementById('newConversationBtn');

        // Initialiser la pagination avec les éléments DOM
        initPaginationControls(
            conversationListEl,
            prevPageBtn,
            nextPageBtn,
            currentPageInfoSpan,
            selectConversation, // Callback pour sélectionner
            deleteConversation // Callback pour supprimer
        );

        // Afficher la liste des conversations (simulées)
        setConversations({ conversations: mockConversations, totalCount: mockConversations.length });

        if (newConversationBtn) {
            newConversationBtn.onclick = () => createNewChatConversation();
        }
    } else {
        // Cacher les contrôles de chat si on n'est pas dans la section chat
        const paginationControls = document.getElementById('conversation-pagination');
        if (paginationControls) paginationControls.remove();
        const newConversationBtn = document.getElementById('newConversationBtn');
        if (newConversationBtn) newConversationBtn.remove(); // Supprimer le bouton aussi
        navTitle = 'Navigation'; // Ou un titre générique pour les autres sections
    }

    // Mettre à jour le titre de la navigation dynamique
    if (dynamicLeftNav) {
        const titleEl = dynamicLeftNav.querySelector('.dynamic-nav-title');
        if (titleEl) titleEl.textContent = navTitle;
    }
}


// --- Fonctions de Chat IA Simplifiées ---

function createNewChatConversation() {
    const newConvId = 'conv_' + Date.now(); // ID simple pour le prototype
    const newConversation = {
        id: newConvId,
        title: `Nouvelle conversation ${mockConversations.length + 1}`,
        messages: [],
        createdAt: new Date().toISOString()
    };
    mockConversations.unshift(newConversation); // Ajouter en haut de la liste
    currentConversationId = newConvId;
    setActiveConversationId(newConvId);
    renderChatConversationList();
    chatMessages.innerHTML = '<p class="placeholder-text">Vous avez commencé une nouvelle conversation. Tapez votre message...</p>';
    chatInput.value = '';
    chatSendButton.disabled = false;
    showStatusMessage('Nouvelle conversation démarrée.', 'info');
}

function selectConversation(convId) {
    currentConversationId = convId;
    setActiveConversationId(convId);
    chatSendButton.disabled = false;
    // Afficher les messages de la conversation sélectionnée
    const selectedConv = mockConversations.find(conv => conv.id === convId);
    if (selectedConv) {
        chatMessages.innerHTML = '';
        selectedConv.messages.forEach(msg => {
            const msgDiv = document.createElement('div');
            msgDiv.className = `chat-message ${msg.role}`;
            msgDiv.innerHTML = `<span class="role-label">${msg.role === 'user' ? 'Vous' : 'IA'}</span>: ${msg.content}`;
            chatMessages.appendChild(msgDiv);
        });
        chatMessages.scrollTop = chatMessages.scrollHeight; // Scroll to bottom
    }
}

async function sendChatMessage() {
    const message = chatInput.value.trim();
    if (!message || !currentConversationId) return;

    // Ajouter le message de l'utilisateur
    const userMessage = { role: 'user', content: message };
    const currentConv = mockConversations.find(conv => conv.id === currentConversationId);
    if (currentConv) {
        currentConv.messages.push(userMessage);
    }
    appendMessageToChatWindow(userMessage);

    chatInput.value = ''; // Effacer l'input
    showLoading(chatSendButton, 'Envoyer', 'fas fa-paper-plane');

    try {
        // Simuler l'envoi au serveur (utilise la même API /api/generate pour simplicité)
        const response = await fetch(`${API_BASE_URL}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: message }) // Envoyer le message de l'utilisateur comme prompt
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || `Erreur HTTP: ${response.status}`);
        }

        const aiMessage = { role: 'assistant', content: data.response };
        if (currentConv) {
            currentConv.messages.push(aiMessage); // Ajouter la réponse IA à la conversation
        }
        appendMessageToChatWindow(aiMessage);
        showStatusMessage('Message envoyé et réponse reçue.', 'success');
        fetchDashboardInsights(); // Actualise le dashboard après interaction
    } catch (error) {
        console.error('Erreur lors de l\'envoi du message de chat:', error);
        appendMessageToChatWindow({ role: 'system', content: `Erreur: ${error.message}` });
        showStatusMessage(`Erreur chat: ${error.message}`, 'error');
    } finally {
        hideLoading(chatSendButton, 'Envoyer', 'fas fa-paper-plane');
    }
}

function appendMessageToChatWindow(message) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `chat-message ${message.role}`;
    msgDiv.innerHTML = `<span class="role-label">${message.role === 'user' ? 'Vous' : (message.role === 'assistant' ? 'IA' : 'Système')}</span>: ${message.content}`;
    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight; // Scroll to bottom
}

function deleteConversation(convId) {
    showModal('Confirmation', 'Êtes-vous sûr de vouloir supprimer cette conversation ?', 'confirm')
        .then(result => {
            if (result) {
                mockConversations = mockConversations.filter(conv => conv.id !== convId);
                renderChatConversationList(); // Rafraîchir la liste
                if (currentConversationId === convId) {
                    currentConversationId = null;
                    setActiveConversationId(null);
                    chatMessages.innerHTML = '<p class="placeholder-text">Conversation supprimée. Commencez-en une nouvelle.</p>';
                    chatSendButton.disabled = true;
                }
                showStatusMessage('Conversation supprimée.', 'success');
            }
        });
}


// --- Initialisation du DOM et des Écouteurs d'Événements ---
document.addEventListener('DOMContentLoaded', () => {
    // Initialisation des éléments DOM
    mainNavbar = document.getElementById('mainNavbar');
    navLinks = document.querySelectorAll('.nav-link');
    contentSections = document.querySelectorAll('.content-section');
    dynamicLeftNav = document.getElementById('dynamicLeftNav');
    dynamicNavList = dynamicLeftNav.querySelector('.dynamic-nav-list');
    globalStatusMessage = document.getElementById('globalStatusMessage');

    // Page Accueil
    promptInput = document.getElementById('promptInput');
    iaResponseOutput = document.getElementById('iaResponseOutput');
    generateResponseBtn = document.getElementById('generateResponseBtn');
    clearPromptBtn = document.getElementById('clearPromptBtn');

    // Dashboard UTMi
    totalUtmiEl = document.getElementById('totalUtmi');
    initialCapitalEl = document.getElementById('initialCapital');
    monthlyUniversalIncomeEl = document.getElementById('monthlyUniversalIncome');
    treasuryBalanceEl = document.getElementById('treasuryBalance');
    totalEstimatedCostUSDEl = document.getElementById('totalEstimatedCostUSD');
    totalEstimatedCostEUREl = document.getElementById('totalEstimatedCostEUR');
    totalInteractionCountEl = document.getElementById('totalInteractionCount');
    refreshDashboardBtn = document.getElementById('refreshDashboardBtn');

    utmiByTypeEl = document.getElementById('utmiByType');
    utmiByModelEl = document.getElementById('utmiByModel');
    utmiPerCostRatioByModelEl = document.getElementById('utmiPerCostRatioByModel');
    utmiByCognitiveAxisEl = document.getElementById('utmiByCognitiveAxis');
    thematicUtmiMarketingEl = document.getElementById('thematicUtmiMarketing');
    thematicUtmiAffiliationEl = document.getElementById('thematicUtmiAffiliation');
    thematicUtmiFiscalEconomicEl = document.getElementById('thematicUtmiFiscalEconomic');
    mostValuableTopicsEl = document.getElementById('mostValuableTopics');
    mostCommonActivitiesEl = document.getElementById('mostCommonActivities');
    exchangeRatesEl = document.getElementById('exchangeRates');


    // Gestion du CV
    cvInput = document.getElementById('cvInput');
    generateCvBtn = document.getElementById('generateCvBtn');
    importCvFileBtn = document.getElementById('importCvFileBtn');
    actualCvFileInput = document.getElementById('actualCvFileInput');
    downloadCvBtn = document.getElementById('downloadCvBtn');
    cvOutput = document.getElementById('cvOutput');
    cvnuInitialValueEl = document.getElementById('cvnuInitialValue');
    cvnuLevelEl = document.getElementById('cvnuLevel');
    cvnuEstimatedMonthlyIncomeEl = document.getElementById('cvnuEstimatedMonthlyIncome');
    calculateCvnuValueBtn = document.getElementById('calculateCvnuValueBtn');


    // Chat IA
    chatMessages = document.getElementById('chatMessages');
    chatInput = document.getElementById('chatInput');
    chatSendButton = document.getElementById('chatSendButton');


    // --- Attacher les écouteurs d'événements ---

    // Navigation principale
    navLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            const sectionId = event.target.dataset.section;
            showSection(sectionId);
            // Si on va au dashboard, on le rafraîchit
            if (sectionId === 'dashboard') {
                fetchDashboardInsights();
            }
            // Si on va à la gestion CV, on tente de charger le dernier CV
            if (sectionId === 'cv-management') {
                fetchLastStructuredCv();
            }
            // Si on va au chat, on initialise la création de conversation si aucune n'est active
            if (sectionId === 'chat' && mockConversations.length === 0) {
                 createNewChatConversation();
            }
        });
    });

    // Page Accueil
    if (generateResponseBtn) {
        generateResponseBtn.addEventListener('click', () => {
            const prompt = promptInput.value.trim();
            if (prompt) {
                generateAIResponse(prompt);
            } else {
                showStatusMessage('Veuillez entrer un prompt.', 'warning');
            }
        });
    }
    if (clearPromptBtn) {
        clearPromptBtn.addEventListener('click', () => {
            promptInput.value = '';
            iaResponseOutput.textContent = 'La réponse de l\'IA apparaîtra ici...';
        });
    }

    // Dashboard
    if (refreshDashboardBtn) {
        refreshDashboardBtn.addEventListener('click', fetchDashboardInsights);
    }

    // Gestion du CV
    if (generateCvBtn) {
        generateCvBtn.addEventListener('click', () => {
            const cvText = cvInput.value.trim();
            if (cvText) {
                generateStructuredCv(cvText);
            } else {
                showStatusMessage('Veuillez coller le texte de votre CV.', 'warning');
            }
        });
    }

    if (importCvFileBtn) {
        importCvFileBtn.addEventListener('click', () => actualCvFileInput.click());
    }

    if (actualCvFileInput) {
        actualCvFileInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const fileContent = e.target.result;
                        // Tente de parser comme JSON d'abord
                        const parsedJson = JSON.parse(fileContent);
                        currentCvStructuredData = parsedJson;
                        cvOutput.textContent = JSON.stringify(parsedJson, null, 2);
                        downloadCvBtn.style.display = 'inline-block';
                        calculateCvnuValueBtn.disabled = false;
                        showStatusMessage('Fichier CV JSON importé avec succès.', 'success');
                    } catch (jsonError) {
                        // Si ce n'est pas un JSON, traitez-le comme du texte brut
                        cvInput.value = fileContent;
                        currentCvStructuredData = null; // Réinitialise si ce n'est pas un JSON structuré
                        showStatusMessage('Fichier texte CV importé. Générez le CV structuré.', 'info');
                    }
                };
                reader.readAsText(file);
            }
        });
    }

    if (downloadCvBtn) {
        downloadCvBtn.addEventListener('click', () => {
            if (currentCvStructuredData) {
                const blob = new Blob([JSON.stringify(currentCvStructuredData, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'structured_cv.json';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            } else {
                showStatusMessage('Aucune donnée de CV structurée à télécharger.', 'warning');
            }
        });
    }

    if (calculateCvnuValueBtn) {
        calculateCvnuValueBtn.addEventListener('click', calculateCvnuValue);
    }


    // Chat IA
    if (chatSendButton) {
        chatSendButton.addEventListener('click', sendChatMessage);
    }
    if (chatInput) {
        chatInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault(); // Empêche le saut de ligne
                sendChatMessage();
            }
        });
    }
    // Au chargement initial, afficher la section "Accueil"
    showSection('home');
    // Initialiser le dashboard au chargement
    fetchDashboardInsights();
});