// public/cv.js - Logique client pour CVNU

// --- CONSTANTES ---
const API_BASE_URL = window.location.origin; // Par exemple: http://localhost:3000

// --- Global state for modals (imported from modal.js) ---
import { showModal } from './modal.js';

// --- Global state for pagination (imported from pagination.js) ---
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
let totalUtmiEl, totalEstimatedCostUSDEl, totalEstimatedCostEUREl, totalInteractionCountEl,
    averageUtmiPerInteractionEl, totalUtmiPerCostRatioEl, utmiByTypeEl, utmiByModelEl,
    utmiPerCostRatioByModelEl, utmiByCognitiveAxisEl, thematicUtmiMarketingEl,
    thematicUtmiAffiliationEl, thematicUtmiFiscalEconomicEl, mostValuableTopicsEl,
    mostCommonActivitiesEl, exchangeRatesEl, refreshDashboardBtn,
    initialCapitalEl, monthlyUniversalIncomeEl, treasuryBalanceEl; // NOUVEAUX ÉLÉMENTS

// Gestion du CV
let cvInput, generateCvBtn, clearCvInputBtn, cvOutput, downloadCvBtn,
    valorizeCvContentBtn, valorizationOutput, editCvBtn,
    calculateCvnuValueBtn, cvnuInitialValueEl, cvnuLevelEl, cvnuEstimatedMonthlyIncomeEl; // NOUVEAUX ÉLÉMENTS

// Chatroom IA
let startNewConversationBtn, generateChatCvSummaryBtn,
    currentConversationIdSpan, chatWindow, chatInput, sendChatBtn,
    modalCvSummarySection, modalCvSummaryOutput, copyModalCvSummaryBtn;

// Dynamic elements for chat list and pagination within the left nav
let chatConversationListElement, chatPrevPageBtn, chatNextPageBtn, chatCurrentPageInfoSpan;


// --- Fonctions utilitaires ---
function showStatusMessage(message, type = 'info') {
    globalStatusMessage.textContent = message;
    globalStatusMessage.className = `status-message ${type} active`;
    setTimeout(() => {
        globalStatusMessage.classList.remove('active');
    }, 3000);
}

// Fonction pour afficher une section spécifique et masquer les autres
const showPage = (pageId) => {
    contentSections.forEach(section => {
        section.classList.remove('active');
    });
    const activeSection = document.getElementById(pageId); // Updated to match section IDs
    if (activeSection) {
        activeSection.classList.add('active');
        updateDynamicLeftNav(pageId); // Mettre à jour la nav latérale

        // Gérer les rendus spécifiques à la page si nécessaire
        if (pageId === 'dashboard') {
            fetchDashboardInsights(); // Recharger les données du dashboard
        } else if (pageId === 'home') {
            // Pas de graphique spécifique à rendre immédiatement sur la page d'accueil
        } else if (pageId === 'cv-management') {
            if (downloadCvBtn) downloadCvBtn.style.display = 'none'; // Cacher le bouton de téléchargement par défaut
            if (editCvBtn) editCvBtn.style.display = 'none'; // Cacher le bouton d'édition par default
            if (valorizeCvContentBtn) valorizeCvContentBtn.disabled = true; // Désactiver la valorisation par défaut
            if (calculateCvnuValueBtn) calculateCvnuValueBtn.disabled = true; // Désactiver la valorisation CVNU par défaut
            if (cvOutput) cvOutput.innerHTML = '<p class="placeholder-text">Votre CV sera généré ici. Il affichera vos compétences et expériences structurées.</p>';
            if (valorizationOutput) valorizationOutput.innerHTML = '<p class="placeholder-text">La valorisation de vos compétences par l\'IA apparaîtra ici (ex: phrase d\'accroche, description des compétences, estimation UTMi).</p>';
            loadLastStructuredCvData(); // Tenter de charger le dernier CV structuré si disponible
        } else if (pageId === 'chat') { // Updated from 'chatroom' to 'chat'
            // Initial state for chat input/buttons
            if (chatInput) chatInput.disabled = true;
            if (sendChatBtn) sendChatBtn.disabled = true;
            if (generateChatCvSummaryBtn) generateChatCvSummaryBtn.style.display = 'none'; // Hide until chat has content
        }
    }
};

// Fonction pour définir le lien de navigation actif
const setActiveNavLink = (pageId) => {
    navLinks.forEach(link => {
        link.classList.remove('active');
    });
    const activeLink = document.querySelector(`.nav-link[data-section="${pageId}"]`); // Updated data attribute
    if (activeLink) {
        activeLink.classList.add('active');
    }
};

// Fonction pour mettre à jour la navigation latérale dynamique
const updateDynamicLeftNav = (currentPageId) => {
    let navContent = '';
    let navTitle = `<i class="fas fa-bars"></i> Menu Thématique`;

    dynamicNavList.innerHTML = ''; // Clear existing content first
    // dynamicLeftNav.querySelector('.dynamic-nav-title').innerHTML = navTitle; // Reset title - this element might not exist initially

    if (currentPageId === 'chat') { // Updated from 'chatroom' to 'chat'
        navTitle = `<i class="fas fa-comment-dots"></i> Conversations`;
        // dynamicLeftNav.querySelector('.dynamic-nav-title').innerHTML = navTitle; // This element might not exist initially

        // Dynamically create conversation list and pagination elements
        const conversationListContainer = document.createElement('div');
        conversationListContainer.className = 'conversation-list-container'; // Reuse existing chat styles
        conversationListContainer.innerHTML = `
            <h3 class="card-subtitle"><i class="fas fa-list"></i> Vos Conversations</h3>
            <ul id="chatConversationList" class="conversation-list custom-scrollbar">
                <p class="placeholder-text">Chargement des conversations...</p>
            </ul>
            <div class="pagination-controls" id="conversation-pagination">
                <button id="prevConversationPageBtn" class="btn btn-icon" data-page-action="prev" disabled><i class="fas fa-chevron-left"></i></button>
                <span id="currentConversationPageInfo">Page 1/1</span>
                <button id="nextConversationPageBtn" class="btn btn-icon" data-page-action="next" disabled><i class="fas fa-chevron-right"></i></button>
            </div>
        `;
        dynamicNavList.appendChild(conversationListContainer);

        // Get references to the newly created elements
        chatConversationListElement = conversationListContainer.querySelector('#chatConversationList');
        chatPrevPageBtn = conversationListContainer.querySelector('#prevConversationPageBtn');
        chatNextPageBtn = conversationListContainer.querySelector('#nextConversationPageBtn');
        chatCurrentPageInfoSpan = conversationListContainer.querySelector('#currentConversationPageInfo');

        // Initialize pagination controls for the dynamically created elements
        initPaginationControls(
            chatConversationListElement, // Pass list element
            chatPrevPageBtn,
            chatNextPageBtn,
            chatCurrentPageInfoSpan,
            fetchConversations,
            selectConversation,
            deleteConversation
        );

        // Fetch and render conversations immediately
        fetchConversations(currentChatPage);

    } else {
        // Default static navigation links
        switch (currentPageId) {
            case 'home':
                navTitle = `<i class="fas fa-info-circle"></i> Accueil`;
                navContent = `
                    <li><a href="#home .ia-interaction-panel">Assistant IA</a></li>
                `;
                break;
            case 'dashboard':
                navTitle = `<i class="fas fa-chart-line"></i> Dashboard UTMi`;
                navContent = `
                    <li><a href="#dashboard .dashboard-grid">Aperçu Global</a></li>
                    <li><a href="#dashboard .chart-container">Graphique Principal</a></li>
                    <li><a href="#dashboard .dashboard-details-grid">Détails & Répartitions</a></li>
                    <li><a href="#refreshDashboardBtn">Actualiser</a></li>
                `;
                break;
            case 'cv-management':
                navTitle = `<i class="fas fa-address-card"></i> Gestion CV`;
                navContent = `
                    <li><a href="#cv-management .cv-generation-panel">Générateur de CV</a></li>
                    <li><a href="#cv-management .cv-output-area">Prévisualisation JSON</a></li>
                    <li><a href="#cv-management .cvnu-insights-panel">Insights CVNU</a></li>
                `;
                break;
            case 'about':
                navTitle = `<i class="fas fa-info-circle"></i> À Propos`;
                navContent = `
                    <li><a href="#about .card">Informations Générales</a></li>
                `;
                break;
            // Add other cases as needed
        }
        dynamicNavList.innerHTML = navContent;
    }
    // Update the dynamic nav title if the element exists
    const dynamicNavTitleEl = dynamicLeftNav.querySelector('.dynamic-nav-title');
    if (dynamicNavTitleEl) {
        dynamicNavTitleEl.innerHTML = navTitle;
    } else {
        // If the title element doesn't exist, create it.
        const titleDiv = document.createElement('div');
        titleDiv.className = 'dynamic-nav-title';
        titleDiv.innerHTML = navTitle;
        dynamicLeftNav.prepend(titleDiv);
    }
};

// --- API Calls ---

// Fonction pour récupérer les données du tableau de bord
async function fetchDashboardInsights() {
    showStatusMessage('Actualisation du tableau de bord...', 'info');
    try {
        const response = await fetch(`${API_BASE_URL}/api/dashboard-insights`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log('Dashboard Insights Data:', data); // For debugging

        // Update Dashboard UTMi elements
        if (totalUtmiEl) totalUtmiEl.textContent = data.totalUtmi ? data.totalUtmi.toFixed(2) : '0.00';
        if (totalEstimatedCostUSDEl) totalEstimatedCostUSDEl.textContent = data.totalEstimatedCostUSD ? data.totalEstimatedCostUSD.toFixed(6) : '0.000000';
        if (totalEstimatedCostEUREl) totalEstimatedCostEUREl.textContent = data.totalEstimatedCostEUR ? data.totalEstimatedCostEUR.toFixed(6) : '0.000000';
        if (totalInteractionCountEl) totalInteractionCountEl.textContent = data.totalInteractionCount !== undefined ? data.totalInteractionCount : '0';
        if (averageUtmiPerInteractionEl) averageUtmiPerInteractionEl.textContent = data.averageUtmiPerInteraction ? data.averageUtmiPerInteraction.toFixed(2) : '0.00';
        if (totalUtmiPerCostRatioEl) totalUtmiPerCostRatioEl.textContent = data.totalUtmiPerCostRatio ? data.totalUtmiPerCostRatio.toFixed(2) : '0.00';

        // NEW: Update Initial Capital, Monthly Universal Income, and Treasury Balance
        if (initialCapitalEl) initialCapitalEl.textContent = data.initialCapitalEUR ? data.initialCapitalEUR.toFixed(2) : '0.00';
        if (monthlyUniversalIncomeEl) monthlyUniversalIncomeEl.textContent = data.monthlyUniversalIncomeEUR ? data.monthlyUniversalIncomeEUR.toFixed(2) : '0.00';
        if (treasuryBalanceEl) treasuryBalanceEl.textContent = data.treasuryBalanceEUR ? data.treasuryBalanceEUR.toFixed(2) : '0.00';


        // Update detailed lists
        updateList(utmiByTypeEl, data.utmiByType, 'type', 'utmi');
        updateList(utmiByModelEl, data.utmiByModel, 'model', 'utmi');
        updateList(utmiPerCostRatioByModelEl, data.utmiPerCostRatioByModel, 'model', 'ratio');
        updateList(utmiByCognitiveAxisEl, data.utmiByCognitiveAxis, 'axis', 'utmi');
        if (thematicUtmiMarketingEl) thematicUtmiMarketingEl.innerHTML = `<li>Marketing: ${data.thematicUtmi.marketing ? data.thematicUtmi.marketing.toFixed(2) : '0.00'} UTMi</li>`;
        if (thematicUtmiAffiliationEl) thematicUtmiAffiliationEl.innerHTML = `<li>Affiliation: ${data.thematicUtmi.affiliation ? data.thematicUtmi.affiliation.toFixed(2) : '0.00'} UTMi</li>`;
        if (thematicUtmiFiscalEconomicEl) thematicUtmiFiscalEconomicEl.innerHTML = `<li>Fiscal/Économique: ${data.thematicUtmi.fiscalEconomic ? data.thematicUtmi.fiscalEconomic.toFixed(2) : '0.00'} UTMi</li>`;
        updateList(mostValuableTopicsEl, data.mostValuableTopics, 'topic', 'utmi');
        updateList(mostCommonActivitiesEl, data.mostCommonActivities, 'activity', 'count', 'fois');
        if (exchangeRatesEl && data.exchangeRates) {
            exchangeRatesEl.innerHTML = Object.entries(data.exchangeRates).map(([currency, rate]) =>
                `<li>1 EUR = ${rate.toFixed(4)} ${currency}</li>`
            ).join('');
        }


        // Update Chart
        updateMainChart(data.totalUtmi, data.totalEstimatedCostUSD, data.totalEstimatedCostEUR);

        showStatusMessage('Tableau de bord actualisé !', 'success');
    } catch (error) {
        console.error('Erreur lors de la récupération des données du tableau de bord:', error);
        showStatusMessage('Erreur lors de l\'actualisation du tableau de bord.', 'error');
    }
}

function updateList(element, data, keyName, valueName, suffix = '') {
    if (element) {
        if (data && data.length > 0) {
            element.innerHTML = data.map(item => `<li>${item[keyName]}: ${item[valueName] ? item[valueName].toFixed(2) : '0.00'} ${suffix}</li>`).join('');
        } else {
            element.innerHTML = '<li>Aucune donnée.</li>';
        }
    }
}


let mainFinancialChartInstance = null; // To store the Chart.js instance

function updateMainChart(totalUtmi, totalEstimatedCostUSD, totalEstimatedCostEUR) {
    const ctx = document.getElementById('mainFinancialChart').getContext('2d');

    if (mainFinancialChartInstance) {
        mainFinancialChartInstance.destroy(); // Destroy previous chart instance
    }

    mainFinancialChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Total UTMi', 'Coût USD', 'Coût EUR'],
            datasets: [{
                label: 'Values',
                data: [
                    parseFloat(totalUtmi),
                    parseFloat(totalEstimatedCostUSD),
                    parseFloat(totalEstimatedCostEUR)
                ],
                backgroundColor: [
                    'rgba(54, 162, 235, 0.6)', // Blue for UTMi
                    'rgba(255, 159, 64, 0.6)', // Orange for USD Cost
                    'rgba(75, 192, 192, 0.6)'  // Green for EUR Cost
                ],
                borderColor: [
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 159, 64, 1)',
                    'rgba(75, 192, 192, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                title: {
                    display: true,
                    text: 'Aperçu Financier Principal'
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}


// --- Fonctions de Chatbot Conversationnel ---

// Function to fetch conversations
async function fetchConversations(page = 1) {
    showStatusMessage('Chargement des conversations...', 'info');
    try {
        const response = await fetch(`${API_BASE_URL}/api/conversations?page=${page}&limit=${CHAT_CONVERSATIONS_PER_PAGE}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setConversations(data, page); // Update pagination module's state
        renderChatConversationList(data.conversations, chatConversationListElement); // Render list
        showStatusMessage('Conversations chargées.', 'success');
    } catch (error) {
        console.error('Erreur lors du chargement des conversations:', error);
        showStatusMessage('Impossible de charger les conversations.', 'error');
        renderChatConversationList([], chatConversationListElement); // Clear list on error
    }
}

// Function to select a conversation
async function selectConversation(conversationId) {
    if (currentConversationId === conversationId) return; // Prevent re-loading same conversation
    currentConversationId = conversationId;
    setActiveConversationId(conversationId); // Update pagination module

    showStatusMessage('Chargement de la conversation...', 'info');
    try {
        const response = await fetch(`${API_BASE_URL}/api/conversations/${conversationId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const conversation = await response.json();
        displayChatMessages(conversation.messages);
        if (chatInput) chatInput.disabled = false;
        if (sendChatBtn) sendChatBtn.disabled = false;
        if (generateChatCvSummaryBtn) {
            // Show only if there are enough messages to summarize
            generateChatCvSummaryBtn.style.display = conversation.messages.length > 2 ? 'inline-block' : 'none';
        }
        showStatusMessage('Conversation chargée.', 'success');
    } catch (error) {
        console.error('Erreur lors du chargement de la conversation:', error);
        showStatusMessage('Impossible de charger la conversation.', 'error');
        displayChatMessages([]); // Clear messages on error
        if (chatInput) chatInput.disabled = true;
        if (sendChatBtn) sendChatBtn.disabled = true;
        if (generateChatCvSummaryBtn) generateChatCvSummaryBtn.style.display = 'none';
    }
}

// Function to delete a conversation
async function deleteConversation(conversationId) {
    const confirmation = await showModal(
        'Confirmer la suppression',
        'Êtes-vous sûr de vouloir supprimer cette conversation ? Cette action est irréversible.',
        'confirm'
    );

    if (confirmation) {
        showStatusMessage('Suppression de la conversation...', 'info');
        try {
            const response = await fetch(`${API_BASE_URL}/api/conversations/${conversationId}`, {
                method: 'DELETE'
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            showStatusMessage('Conversation supprimée !', 'success');
            // Reset chat window if the active conversation was deleted
            if (currentConversationId === conversationId) {
                currentConversationId = null;
                setActiveConversationId(null);
                displayChatMessages([]);
                if (chatInput) chatInput.disabled = true;
                if (sendChatBtn) sendChatBtn.disabled = true;
                if (generateChatCvSummaryBtn) generateChatCvSummaryBtn.style.display = 'none';
            }
            fetchConversations(currentChatPage); // Re-fetch conversations to update the list
        } catch (error) {
            console.error('Erreur lors de la suppression de la conversation:', error);
            showStatusMessage('Impossible de supprimer la conversation.', 'error');
        }
    }
}

// Function to send a message
async function sendChatMessage() {
    const message = chatInput.value.trim();
    if (!message || !currentConversationId) return;

    showStatusMessage('Envoi du message...', 'info');
    chatInput.disabled = true;
    sendChatBtn.disabled = true;

    try {
        const response = await fetch(`${API_BASE_URL}/api/conversations/${currentConversationId}/message`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        displayChatMessages(data.messages); // Update chat window with new messages
        chatInput.value = ''; // Clear input field
        showStatusMessage('Message envoyé et réponse reçue.', 'success');
    } catch (error) {
        console.error('Erreur lors de l\'envoi du message:', error);
        showStatusMessage('Erreur lors de l\'envoi du message.', 'error');
    } finally {
        chatInput.disabled = false;
        sendChatBtn.disabled = false;
        chatInput.focus();
    }
}

// Function to display messages in the chat window
function displayChatMessages(messages) {
    if (!chatWindow) return;
    chatWindow.innerHTML = ''; // Clear existing messages
    if (!messages || messages.length === 0) {
        chatWindow.innerHTML = '<p class="placeholder-text">Commencez une nouvelle conversation ou sélectionnez-en une existante.</p>';
        return;
    }

    messages.forEach(msg => {
        const messageElement = document.createElement('div');
        messageElement.className = `chat-message ${msg.role}`;
        messageElement.innerHTML = `<span class="message-role">${msg.role === 'user' ? 'Vous' : 'IA'} :</span> ${msg.content}`;
        chatWindow.appendChild(messageElement);
    });
    chatWindow.scrollTop = chatWindow.scrollHeight; // Scroll to bottom
}


// --- Fonctions de Gestion de CV ---

// Function to load the last structured CV data
async function loadLastStructuredCvData() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/cv/last-structured-data`);
        if (response.ok) {
            const data = await response.json();
            currentCvStructuredData = data;
            if (cvOutput) cvOutput.textContent = JSON.stringify(data, null, 2);
            if (downloadCvBtn) downloadCvBtn.style.display = 'inline-block';
            if (editCvBtn) editCvBtn.style.display = 'inline-block';
            if (valorizeCvContentBtn) valorizeCvContentBtn.disabled = false;
            if (calculateCvnuValueBtn) calculateCvnuValueBtn.disabled = false; // Enable CVNU calculation button
            showStatusMessage('Dernier CV structuré chargé.', 'success');
            // Automatically calculate CVNU value if CV data is loaded
            calculateCvnuValue();
        } else if (response.status === 404) {
            currentCvStructuredData = null;
            if (cvOutput) cvOutput.innerHTML = '<p class="placeholder-text">Aucun CV structuré trouvé. Veuillez en générer un.</p>';
            if (downloadCvBtn) downloadCvBtn.style.display = 'none';
            if (editCvBtn) editCvBtn.style.display = 'none';
            if (valorizeCvContentBtn) valorizeCvContentBtn.disabled = true;
            if (calculateCvnuValueBtn) calculateCvnuValueBtn.disabled = true; // Disable CVNU calculation button
            // showStatusMessage('Aucun CV structuré disponible.', 'info'); // This might be too frequent
        } else {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
    } catch (error) {
        console.error('Erreur lors du chargement du dernier CV structuré:', error);
        showStatusMessage('Erreur lors du chargement du CV.', 'error');
    }
}


// Function to generate structured CV
async function generateStructuredCv() {
    const cvText = cvInput.value.trim();
    if (!cvText) {
        showModal('Erreur', 'Veuillez entrer du texte pour le CV.', 'alert');
        return;
    }

    showStatusMessage('Génération du CV structuré...', 'info');
    generateCvBtn.disabled = true;
    clearCvInputBtn.disabled = true;

    try {
        const response = await fetch(`${API_BASE_URL}/api/cv/parse-and-structure`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ cvText })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        currentCvStructuredData = data;
        if (cvOutput) cvOutput.textContent = JSON.stringify(data, null, 2);
        if (downloadCvBtn) downloadCvBtn.style.display = 'inline-block';
        if (editCvBtn) editCvBtn.style.display = 'inline-block';
        if (valorizeCvContentBtn) valorizeCvContentBtn.disabled = false;
        if (calculateCvnuValueBtn) calculateCvnuValueBtn.disabled = false; // Enable CVNU calculation button

        showStatusMessage('CV structuré généré avec succès !', 'success');
        calculateCvnuValue(); // Automatically calculate CVNU after generating CV
    } catch (error) {
        console.error('Erreur lors de la génération du CV structuré:', error);
        showStatusMessage('Erreur lors de la génération du CV.', 'error');
    } finally {
        generateCvBtn.disabled = false;
        clearCvInputBtn.disabled = false;
    }
}

// Function to calculate CVNU value
async function calculateCvnuValue() {
    if (!currentCvStructuredData) {
        showStatusMessage('Veuillez d\'abord générer ou charger un CV structuré pour calculer sa valeur.', 'alert');
        if (cvnuInitialValueEl) cvnuInitialValueEl.textContent = '0.00';
        if (cvnuLevelEl) cvnuLevelEl.textContent = 'N/A';
        if (cvnuEstimatedMonthlyIncomeEl) cvnuEstimatedMonthlyIncomeEl.textContent = '0.00';
        return;
    }

    showStatusMessage('Calcul de la valeur CVNU...', 'info');
    if (calculateCvnuValueBtn) calculateCvnuValueBtn.disabled = true;

    try {
        const response = await fetch(`${API_BASE_URL}/api/cv/calculate-value`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ cvStructuredData: currentCvStructuredData })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('CVNU Calculation Data:', data); // For debugging

        if (cvnuInitialValueEl) cvnuInitialValueEl.textContent = data.initialCvValue ? data.initialCvValue.toFixed(2) : '0.00';
        if (cvnuLevelEl) cvnuLevelEl.textContent = data.cvLevel || 'N/A';
        if (cvnuEstimatedMonthlyIncomeEl) cvnuEstimatedMonthlyIncomeEl.textContent = data.estimatedMonthlyUniversalIncomeEUR ? data.estimatedMonthlyUniversalIncomeEUR.toFixed(2) : '0.00';

        showStatusMessage('Valeur CVNU calculée avec succès !', 'success');
    } catch (error) {
        console.error('Erreur lors du calcul de la valeur CVNU:', error);
        showStatusMessage('Erreur lors du calcul de la valeur CVNU.', 'error');
        if (cvnuInitialValueEl) cvnuInitialValueEl.textContent = '0.00';
        if (cvnuLevelEl) cvnuLevelEl.textContent = 'N/A';
        if (cvnuEstimatedMonthlyIncomeEl) cvnuEstimatedMonthlyIncomeEl.textContent = '0.00';
    } finally {
        if (calculateCvnuValueBtn) calculateCvnuValueBtn.disabled = false;
    }
}

// Function to download structured CV as JSON
function downloadStructuredCv() {
    if (!currentCvStructuredData) {
        showModal('Erreur', 'Aucun CV structuré à télécharger.', 'alert');
        return;
    }
    const blob = new Blob([JSON.stringify(currentCvStructuredData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cv_structured.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showStatusMessage('CV JSON téléchargé.', 'success');
}

// Function to import CV file
async function importCvFile() {
    const fileInput = document.getElementById('actualCvFileInput');
    if (!fileInput) return;

    fileInput.click(); // Trigger click on hidden file input

    fileInput.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) {
            return;
        }

        if (file.type !== 'text/plain' && file.type !== 'application/json' && !file.type.startsWith('text/')) {
            showModal('Format de fichier non supporté', 'Veuillez sélectionner un fichier texte (.txt) ou JSON (.json).', 'alert');
            return;
        }

        try {
            const reader = new FileReader();
            reader.onload = async (event) => {
                const fileContent = event.target.result;
                if (file.type === 'application/json') {
                    try {
                        const jsonData = JSON.parse(fileContent);
                        // Assume if it's JSON, it's already structured, or can be passed for re-structuring
                        currentCvStructuredData = jsonData;
                        if (cvOutput) cvOutput.textContent = JSON.stringify(jsonData, null, 2);
                        if (downloadCvBtn) downloadCvBtn.style.display = 'inline-block';
                        if (editCvBtn) editCvBtn.style.display = 'inline-block';
                        if (valorizeCvContentBtn) valorizeCvContentBtn.disabled = false;
                        if (calculateCvnuValueBtn) calculateCvnuValueBtn.disabled = false; // Enable CVNU calculation button
                        showStatusMessage('CV JSON importé avec succès !', 'success');
                        calculateCvnuValue(); // Calculate CVNU if JSON is imported
                    } catch (jsonError) {
                        showModal('Erreur JSON', 'Le fichier JSON est mal formé.', 'alert');
                        console.error('JSON parsing error:', jsonError);
                    }
                } else {
                    // For text files, put content into textarea for parsing
                    if (cvInput) cvInput.value = fileContent;
                    showStatusMessage('Fichier texte importé. Cliquez sur "Générer CV Structuré" pour le traiter.', 'info');
                }
            };
            reader.readAsText(file);
        } catch (error) {
            console.error('Erreur lors de la lecture du fichier:', error);
            showStatusMessage('Erreur lors de la lecture du fichier.', 'error');
        }
    };
}


// --- Événements DOMContentLoaded ---
document.addEventListener('DOMContentLoaded', () => {
    // Global elements
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
    totalEstimatedCostUSDEl = document.getElementById('totalEstimatedCostUSD');
    totalEstimatedCostEUREl = document.getElementById('totalEstimatedCostEUR');
    totalInteractionCountEl = document.getElementById('totalInteractionCount');
    averageUtmiPerInteractionEl = document.getElementById('averageUtmiPerInteraction');
    totalUtmiPerCostRatioEl = document.getElementById('totalUtmiPerCostRatio');
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
    refreshDashboardBtn = document.getElementById('refreshDashboardBtn');

    // NEW Dashboard elements
    initialCapitalEl = document.getElementById('initialCapital');
    monthlyUniversalIncomeEl = document.getElementById('monthlyUniversalIncome');
    treasuryBalanceEl = document.getElementById('treasuryBalance');

    // Gestion du CV
    cvInput = document.getElementById('cvInput');
    generateCvBtn = document.getElementById('generateCvBtn');
    // clearCvInputBtn = document.getElementById('clearCvInputBtn'); // This button doesn't exist in index.html
    cvOutput = document.getElementById('cvOutput');
    downloadCvBtn = document.getElementById('downloadCvBtn');
    // valorizeCvContentBtn = document.getElementById('valorizeCvContentBtn'); // This button doesn't exist in index.html
    // valorizationOutput = document.getElementById('valorizationOutput'); // This element doesn't exist in index.html
    editCvBtn = document.getElementById('editCvBtn');
    const importCvFileBtn = document.getElementById('importCvFileBtn'); // Make sure this is linked
    const actualCvFileInput = document.getElementById('actualCvFileInput'); // Make sure this is linked

    // NEW CV Management elements
    calculateCvnuValueBtn = document.getElementById('calculateCvnuValueBtn'); // Assume this button will be added
    cvnuInitialValueEl = document.getElementById('cvnuInitialValue');
    cvnuLevelEl = document.getElementById('cvnuLevel');
    cvnuEstimatedMonthlyIncomeEl = document.getElementById('cvnuEstimatedMonthlyIncome');


    // Chatroom IA
    // startNewConversationBtn = document.getElementById('startNewConversationBtn'); // This button doesn't exist
    // generateChatCvSummaryBtn = document.getElementById('generateChatCvSummaryBtn'); // This button doesn't exist
    chatWindow = document.getElementById('chatMessages');
    chatInput = document.getElementById('chatInput');
    sendChatBtn = document.getElementById('chatSendButton');
    // modalCvSummarySection = document.getElementById('modalCvSummarySection'); // This section doesn't exist
    // modalCvSummaryOutput = document.getElementById('modalCvSummaryOutput'); // This element doesn't exist
    // copyModalCvSummaryBtn = document.getElementById('copyModalCvSummaryBtn'); // This button doesn't exist

    // --- Gestionnaire d'événements pour la navigation principale ---
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const pageId = link.dataset.section; // Use data-section
            showPage(pageId);
            setActiveNavLink(pageId);
        });
    });

    // Initial page load
    const initialPageId = window.location.hash.substring(1) || 'home';
    showPage(initialPageId);
    setActiveNavLink(initialPageId);


    // --- Event Listeners for Page Accueil ---
    if (generateResponseBtn) {
        generateResponseBtn.addEventListener('click', async () => {
            const prompt = promptInput.value;
            if (!prompt) {
                showModal('Erreur', 'Veuillez entrer un prompt pour générer une réponse.', 'alert');
                return;
            }
            showStatusMessage('Génération de la réponse...', 'info');
            generateResponseBtn.disabled = true;
            try {
                const response = await fetch(`${API_BASE_URL}/api/generate`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ prompt })
                });
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                iaResponseOutput.textContent = data.response;
                showStatusMessage('Réponse générée !', 'success');
            } catch (error) {
                console.error('Erreur lors de la génération de la réponse:', error);
                iaResponseOutput.textContent = 'Erreur lors de la génération de la réponse.';
                showStatusMessage('Erreur.', 'error');
            } finally {
                generateResponseBtn.disabled = false;
            }
        });
    }

    if (clearPromptBtn) {
        clearPromptBtn.addEventListener('click', () => {
            promptInput.value = '';
            iaResponseOutput.textContent = 'La réponse de l\'IA apparaîtra ici...';
            showStatusMessage('Prompt effacé.', 'info');
        });
    }

    // --- Event Listeners for Dashboard UTMi ---
    if (refreshDashboardBtn) {
        refreshDashboardBtn.addEventListener('click', fetchDashboardInsights);
    }

    // --- Event Listeners for Chatroom IA ---
    // Handle new conversation button (if added later)
    // if (startNewConversationBtn) {
    //     startNewConversationBtn.addEventListener('click', async () => { /* ... */ });
    // }

    // Handle sending chat messages
    if (sendChatBtn) {
        sendChatBtn.addEventListener('click', sendChatMessage);
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendChatMessage();
            }
        });
    }

    // --- Event Listeners for CV Management ---
    if (generateCvBtn) {
        generateCvBtn.addEventListener('click', generateStructuredCv);
    }

    if (downloadCvBtn) {
        downloadCvBtn.addEventListener('click', downloadStructuredCv);
    }

    if (importCvFileBtn) {
        importCvFileBtn.addEventListener('click', importCvFile);
    }

    // NEW: Event listener for calculate CVNU value button
    if (calculateCvnuValueBtn) {
        calculateCvnuValueBtn.addEventListener('click', calculateCvnuValue);
    }

    // Optional: Existing 'editCvBtn' and 'valorizeCvContentBtn' listeners could be added here
    // if (editCvBtn) { /* editCvBtn.addEventListener('click', handleEditCv); */ }
    // if (valorizeCvContentBtn) { /* valorizeCvContentBtn.addEventListener('click', handleValorizeCv); */ }

});

// Initial fetch for dashboard insights when the page loads, in case dashboard is the default view
// Or triggered by showPage('dashboard') if not home.
// fetchDashboardInsights(); // No need to call here, as showPage handles it for 'dashboard'