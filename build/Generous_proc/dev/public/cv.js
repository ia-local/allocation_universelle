// public/cv.js - Logique client pour CVNU

// --- CONSTANTES ---
const API_BASE_URL = window.location.origin; // Par exemple: http://localhost:3000

// --- Global state for modals (Assuming modal.js functions are globally available) ---
// If modal.js and pagination.js are loaded via <script> tags before cv.js,
// their exported functions like showModal, setConversations, etc.
// should be available directly in the global scope (window).
// No 'require' needed in browser environment.

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
let universalIncomeEl, treasuryBalanceEl, updateUniversalIncomeBtn, refreshWalletBtn;

// Chatbot Conversationnel
let chatArea, chatMessagesContainer, chatInput, sendMessageBtn, newChatBtn;
let conversationListElement, prevPageBtn, nextPageBtn, currentPageInfoSpan;

// Générateur de CV
let cvTextInput, parseCvBtn, cvOutput, renderCvBtn, cvHtmlOutput, downloadCvBtn, refreshCvBtn;
let uploadCvFileBtn, fileInput, fileDisplaySpan; // Pour l'upload de fichier

// Modals
let genericAppModal, genericModalTitle, genericModalBody, genericModalFooter,
    genericCloseModalBtn, genericModalConfirmBtn, genericModalCancelBtn, genericModalOkBtn;

// Fonctions utilitaires
async function postData(url, data) {
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    });
    return handleApiResponse(response);
}

async function getData(url) {
    const response = await fetch(url);
    return handleApiResponse(response);
}

async function deleteData(url) {
    const response = await fetch(url, {
        method: 'DELETE'
    });
    return handleApiResponse(response);
}

async function handleApiResponse(response) {
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || response.statusText);
    }
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
        return response.json();
    }
    return response.text(); // Retourne le texte si ce n'est pas du JSON
}

function showStatusMessage(message, type = 'info') {
    if (globalStatusMessage) {
        globalStatusMessage.textContent = message;
        globalStatusMessage.className = `status-message ${type}`;
        globalStatusMessage.classList.add('active');
        setTimeout(() => {
            globalStatusMessage.classList.remove('active');
        }, 3000);
    } else {
        console.warn('Status message element not found.', message);
    }
}


// --- Fonctions de Navigation ---
function showPage(pageId) {
    console.log(`Page '${pageId}' is now active.`);
    contentSections.forEach(section => {
        if (section.id === pageId) {
            section.classList.add('active');
        } else {
            section.classList.remove('active');
        }
    });

    navLinks.forEach(link => {
        if (link.dataset.section === pageId) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });

    // Mettre à jour l'URL sans recharger la page
    history.pushState(null, '', `#${pageId}`);

    // Charger les données spécifiques à la page si nécessaire
    if (pageId === 'dashboard') {
        fetchDashboardInsights();
        // refreshWalletData(); // Commenté car l'endpoint /api/wallet-data n'existe pas encore
    } else if (pageId === 'chat') {
        fetchConversations(currentChatPage);
    } else if (pageId === 'cv-generator') {
        fetchLastStructuredCvData();
    }
}

// --- Fonctions Spécifiques aux Pages ---

// Page Accueil: Génération de réponse IA
async function fetchGenerateResponse() {
    if (!promptInput || !iaResponseOutput) {
        showStatusMessage("Éléments du DOM pour l'accueil non trouvés.", 'error');
        return;
    }
    const prompt = promptInput.value;
    if (!prompt) {
        showStatusMessage('Veuillez entrer un prompt.', 'error');
        return;
    }
    try {
        showStatusMessage('Génération en cours...', 'info');
        const data = await postData(`${API_BASE_URL}/api/generate`, { prompt });
        let outputContent = `<strong>Réponse de l'IA :</strong><br>${data.response}`;
        
        // NOUVEAU: Afficher les UTMi générés si la réponse du serveur les contient
        if (data.utmiValue !== undefined && data.utmiValue !== null) {
            outputContent += `<br><br><strong>UTMi générés pour cette interaction :</strong> ${data.utmiValue.toFixed(2)} UTMi`;
        } else {
            console.warn("Le serveur n'a pas retourné de valeur UTMi pour cette interaction ponctuelle.");
            outputContent += `<br><br><em>(Le calcul des UTMi sera affiché ici une fois que le serveur le retournera.)</em>`;
        }

        iaResponseOutput.innerHTML = outputContent;
        promptInput.value = ''; // Effacer le prompt
        showStatusMessage('Réponse générée avec succès !', 'success');
    } catch (error) {
        console.error('Erreur lors de la génération de réponse:', error);
        iaResponseOutput.textContent = `Erreur: ${error.message}`;
        showStatusMessage(`Erreur lors de la génération: ${error.message}`, 'error');
    }
}

// Tableau de Bord UTMi
async function fetchDashboardInsights() {
    // Vérifier si tous les éléments du DOM sont présents avant de tenter de les manipuler
    const dashboardElementsPresent = totalUtmiEl && totalInteractionCountEl && averageUtmiPerInteractionEl &&
                                    utmiByTypeEl && utmiByModelEl && utmiPerCostRatioByModelEl &&
                                    utmiByCognitiveAxisEl && thematicUtmiMarketingEl && thematicUtmiAffiliationEl &&
                                    thematicUtmiFiscalEconomicEl && mostValuableTopicsEl && mostCommonActivitiesEl &&
                                    exchangeRatesEl;

    if (!dashboardElementsPresent) {
        console.warn("Certains éléments du tableau de bord ne sont pas trouvés. Vérifiez leurs IDs dans index.html.");
        showStatusMessage("Certains éléments du tableau de bord sont manquants. Mise à jour impossible.", 'error');
        return;
    }

    try {
        showStatusMessage('Chargement des insights du tableau de bord...', 'info');
        const insights = await getData(`${API_BASE_URL}/api/dashboard-insights`);

        // Mise à jour des métriques principales (avec vérification des données)
        totalUtmiEl.textContent = (insights.totalUtmi || 0).toFixed(2);
        totalInteractionCountEl.textContent = insights.totalInteractionCount || 0;
        averageUtmiPerInteractionEl.textContent = (insights.averageUtmiPerInteraction || 0).toFixed(2);
        // totalUtmiPerCostRatioEl.textContent = (insights.totalUtmiPerCostRatio || 0).toFixed(2); // Non défini dans l'output

        // Mise à jour des graphiques et listes (à adapter si vous utilisez Chart.js ou des listes dynamiques)
        // Exemple pour les données brutes :
        utmiByTypeEl.textContent = JSON.stringify(insights.utmiByType || {}, null, 2);
        utmiByModelEl.textContent = JSON.stringify(insights.utmiByModel || {}, null, 2);
        utmiPerCostRatioByModelEl.textContent = JSON.stringify(insights.utmiPerCostRatioByModel || {}, null, 2);
        utmiByCognitiveAxisEl.textContent = JSON.stringify(insights.utmiByCognitiveAxis || {}, null, 2);
        thematicUtmiMarketingEl.textContent = (insights.thematicUtmi.marketing || 0).toFixed(2);
        thematicUtmiAffiliationEl.textContent = (insights.thematicUtmi.affiliation || 0).toFixed(2);
        thematicUtmiFiscalEconomicEl.textContent = (insights.thematicUtmi.fiscalEconomic || 0).toFixed(2);
        mostValuableTopicsEl.textContent = JSON.stringify(insights.mostValuableTopics || [], null, 2);
        mostCommonActivitiesEl.textContent = JSON.stringify(insights.mostCommonActivities || [], null, 2);
        exchangeRatesEl.textContent = JSON.stringify(insights.exchangeRates || {}, null, 2);

        showStatusMessage('Tableau de bord mis à jour avec succès !', 'success');
    } catch (error) {
        console.error('Erreur lors du chargement des insights du tableau de bord:', error);
        showStatusMessage(`Erreur de chargement du tableau de bord: ${error.message}`, 'error');
    }
}

// Fonction pour rafraîchir les données du portefeuille (UTMi et Trésorerie)
// COMMENTÉ: Cette fonction dépend d'un endpoint /api/wallet-data qui n'existe pas encore côté serveur.
/*
async function refreshWalletData() {
    if (!universalIncomeEl || !treasuryBalanceEl) {
        console.warn("Éléments du DOM pour le portefeuille non trouvés.");
        showStatusMessage("Éléments du portefeuille manquants. Mise à jour impossible.", 'error');
        return;
    }
    try {
        showStatusMessage('Actualisation du portefeuille...', 'info');
        const walletData = await getData(`${API_BASE_URL}/api/wallet-data`);
        universalIncomeEl.textContent = (walletData.monthlyUniversalIncome || 0).toFixed(2) + ' EUR';
        treasuryBalanceEl.textContent = (walletData.treasuryBalance || 0).toFixed(2) + ' EUR';
        showStatusMessage('Portefeuille actualisé !', 'success');
    } catch (error) {
        console.error('Erreur lors de l\'actualisation du portefeuille:', error);
        showStatusMessage(`Erreur actualisation portefeuille: ${error.message}`, 'error');
    }
}
*/

// Chatbot Conversationnel
async function fetchConversations(page) {
    if (!conversationListElement) {
        console.warn("Élément de la liste de conversations non trouvé.");
        return;
    }
    try {
        showStatusMessage('Chargement des conversations...', 'info');
        const response = await getData(`${API_BASE_URL}/api/conversations?page=${page}&limit=${CHAT_CONVERSATIONS_PER_PAGE}`);
        
        // Les fonctions de pagination (setConversations, renderChatConversationList)
        // sont censées être disponibles globalement si pagination.js est chargé via <script>.
        // Adaptez si vous utilisez des modules.
        if (typeof setConversations === 'function' && typeof renderChatConversationList === 'function') {
            setConversations(response.conversations, response.totalCount);
            renderChatConversationList(currentChatPage, response.totalCount, selectConversation, deleteConversation);
        } else {
            console.error("Les fonctions de pagination ne sont pas disponibles globalement.");
            showStatusMessage("Erreur: Fonctions de pagination non chargées.", 'error');
        }
        
        showStatusMessage('Conversations chargées !', 'success');
    } catch (error) {
        console.error('Erreur lors du chargement des conversations:', error);
        showStatusMessage(`Erreur chargement conversations: ${error.message}`, 'error');
    }
}

async function selectConversation(id) {
    currentConversationId = id;
    if (typeof setActiveConversationId === 'function') {
        setActiveConversationId(id); // Met en surbrillance la conversation active
    }
    try {
        showStatusMessage('Chargement de la conversation...', 'info');
        const conversation = await getData(`${API_BASE_URL}/api/conversations/${id}`);
        displayConversationMessages(conversation.messages);
        showStatusMessage('Conversation chargée !', 'success');
    } catch (error) {
        console.error('Erreur lors de la sélection de la conversation:', error);
        showStatusMessage(`Erreur sélection conversation: ${error.message}`, 'error');
    }
}

function displayConversationMessages(messages) {
    if (!chatMessagesContainer) {
        console.warn("Conteneur des messages de chat non trouvé.");
        return;
    }
    chatMessagesContainer.innerHTML = '';
    messages.forEach(msg => {
        const messageClass = msg.sender === 'user' ? 'user-message' : 'ai-message';
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('chat-message', messageClass);
        messageDiv.innerHTML = `<strong>${msg.sender === 'user' ? 'Vous' : 'IA'} :</strong> ${msg.content}`;
        chatMessagesContainer.appendChild(messageDiv);
    });
    chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight; // Scroll vers le bas
}

async function sendMessage() {
    if (!chatInput || !chatMessagesContainer) {
        showStatusMessage("Éléments du DOM du chat non trouvés.", 'error');
        return;
    }

    const messageContent = chatInput.value.trim();
    if (!messageContent) {
        return; // Ne rien envoyer si le message est vide
    }

    // Afficher le message de l'utilisateur immédiatement
    displayConversationMessages([...(currentConversationId ? [] : []), { sender: 'user', content: messageContent }]);
    chatInput.value = ''; // Effacer l'input

    try {
        showStatusMessage('Envoi du message...', 'info');
        let data;
        if (!currentConversationId) {
            // Créer une nouvelle conversation
            data = await postData(`${API_BASE_URL}/api/conversations/new`, { message: messageContent });
            currentConversationId = data.conversationId;
            showStatusMessage('Nouvelle conversation créée.', 'success');
            // Recharger la liste des conversations pour afficher la nouvelle
            fetchConversations(currentChatPage);
        } else {
            // Envoyer le message à la conversation existante
            data = await postData(`${API_BASE_URL}/api/conversations/${currentConversationId}/message`, { message: messageContent });
            showStatusMessage('Message envoyé.', 'success');
        }
        
        // Afficher la réponse de l'IA (et potentiellement le message utilisateur complet avec ID si nouvelle conv)
        displayConversationMessages(data.updatedConversation.messages);
        showStatusMessage('Réponse de l\'IA reçue !', 'success');

    } catch (error) {
        console.error('Erreur lors de l\'envoi du message:', error);
        showStatusMessage(`Erreur envoi message: ${error.message}`, 'error');
        // Si erreur, ré-afficher le message utilisateur pour éviter qu'il ne disparaisse
        displayConversationMessages([...(currentConversationId ? [] : []), { sender: 'user', content: messageContent }]);
    }
}

async function deleteConversation(id) {
    // Utiliser la modale de confirmation
    if (typeof showModal === 'function') {
        const confirmed = await showModal('confirm', 'Confirmation', 'Êtes-vous sûr de vouloir supprimer cette conversation ?');
        if (!confirmed) {
            return;
        }
    } else {
        console.warn("showModal n'est pas disponible, impossible de confirmer la suppression.");
        if (!confirm('Êtes-vous sûr de vouloir supprimer cette conversation ?')) {
            return;
        }
    }

    try {
        showStatusMessage('Suppression de la conversation...', 'info');
        await deleteData(`${API_BASE_URL}/api/conversations/${id}`);
        showStatusMessage('Conversation supprimée !', 'success');
        if (id === currentConversationId) {
            currentConversationId = null;
            if (chatMessagesContainer) chatMessagesContainer.innerHTML = ''; // Nettoyer l'affichage
        }
        fetchConversations(currentChatPage); // Recharger la liste
    } catch (error) {
        console.error('Erreur lors de la suppression de la conversation:', error);
        showStatusMessage(`Erreur suppression conversation: ${error.message}`, 'error');
    }
}

// Générateur de CV
async function parseAndStructureCv() {
    if (!cvTextInput || !cvOutput) {
        showStatusMessage("Éléments du DOM du générateur de CV non trouvés.", 'error');
        return;
    }
    const cvText = cvTextInput.value;
    if (!cvText) {
        showStatusMessage('Veuillez coller le texte de votre CV.', 'error');
        return;
    }
    try {
        showStatusMessage('Analyse et structuration du CV...', 'info');
        const structuredData = await postData(`${API_BASE_URL}/api/cv/parse-and-structure`, { cvText });
        currentCvStructuredData = structuredData; // Stocker les données structurées
        cvOutput.textContent = JSON.stringify(structuredData, null, 2); // Afficher le JSON formaté
        showStatusMessage('CV structuré avec succès !', 'success');
    } catch (error) {
        console.error('Erreur lors de la structuration du CV:', error);
        cvOutput.textContent = `Erreur: ${error.message}`;
        showStatusMessage(`Erreur structuration CV: ${error.message}`, 'error');
    }
}

async function renderCvHtml() {
    if (!cvHtmlOutput) {
        showStatusMessage("Élément de sortie HTML du CV non trouvé.", 'error');
        return;
    }
    if (!currentCvStructuredData) {
        showStatusMessage('Veuillez d\'abord structurer un CV.', 'error');
        return;
    }
    try {
        showStatusMessage('Génération HTML du CV...', 'info');
        const htmlContent = await postData(`${API_BASE_URL}/api/cv/render-html`, { structuredData: currentCvStructuredData });
        cvHtmlOutput.innerHTML = htmlContent;
        showStatusMessage('HTML du CV généré avec succès !', 'success');
    } catch (error) {
        console.error('Erreur lors de la génération HTML du CV:', error);
        cvHtmlOutput.innerHTML = `Erreur: ${error.message}`;
        showStatusMessage(`Erreur génération HTML CV: ${error.message}`, 'error');
    }
}

async function downloadCv() {
    if (!cvHtmlOutput || !cvHtmlOutput.innerHTML) {
        showStatusMessage('Aucun CV HTML à télécharger.', 'error');
        return;
    }
    const htmlContent = cvHtmlOutput.innerHTML;
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mon_cvnu.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showStatusMessage('CV téléchargé !', 'success');
}

async function fetchLastStructuredCvData() {
    if (!cvTextInput || !cvOutput) return; // Quitter si les éléments ne sont pas là
    try {
        showStatusMessage('Chargement du dernier CV structuré...', 'info');
        const data = await getData(`${API_BASE_URL}/api/cv/last-structured-data`);
        if (data && Object.keys(data).length > 0) {
            currentCvStructuredData = data;
            cvOutput.textContent = JSON.stringify(data, null, 2);
            cvTextInput.value = data.rawText || ''; // Pré-remplir le texte brut si disponible
            showStatusMessage('Dernier CV structuré chargé.', 'success');
        } else {
            showStatusMessage('Aucun CV structuré trouvé sur le serveur.', 'info');
            currentCvStructuredData = null;
            cvOutput.textContent = '';
            cvTextInput.value = '';
        }
    } catch (error) {
        console.error('Erreur lors du chargement du dernier CV structuré:', error);
        showStatusMessage(`Erreur chargement dernier CV: ${error.message}`, 'error');
        currentCvStructuredData = null; // Assurer que les données sont effacées en cas d'erreur
    }
}

async function calculateCvValue() {
    if (!currentCvStructuredData) {
        showStatusMessage('Veuillez d\'abord structurer un CV.', 'error');
        return;
    }
    try {
        showStatusMessage('Calcul de la valeur du CVNU...', 'info');
        const result = await postData(`${API_BASE_URL}/api/cv/calculate-value`, { cvData: currentCvStructuredData });
        showModal('info', 'Valeur du CVNU Calculée', 
            `Valeur Initiale: ${result.initialCvValue.toFixed(2)} EUR<br>` +
            `Niveau du CV: ${result.cvLevel}<br>` +
            `Revenu Universel Mensuel Estimé: ${result.estimatedMonthlyUniversalIncome.toFixed(2)} EUR`);
        showStatusMessage('Valeur du CVNU calculée !', 'success');
    } catch (error) {
        console.error('Erreur lors du calcul de la valeur du CV:', error);
        showStatusMessage(`Erreur calcul valeur CV: ${error.message}`, 'error');
    }
}


// --- Initialisation au chargement du DOM ---
document.addEventListener('DOMContentLoaded', () => {
    // Initialisation des éléments DOM globaux
    mainNavbar = document.getElementById('mainNavbar');
    navLinks = document.querySelectorAll('.navbar-main-links .nav-link');
    contentSections = document.querySelectorAll('.content-section');
    dynamicLeftNav = document.getElementById('dynamicLeftNav');
    dynamicNavList = document.getElementById('dynamicNavList');
    globalStatusMessage = document.getElementById('globalStatusMessage');

    // Page Accueil
    promptInput = document.getElementById('promptInput');
    iaResponseOutput = document.getElementById('iaResponseOutput');
    generateResponseBtn = document.getElementById('generateResponseBtn');
    clearPromptBtn = document.getElementById('clearPromptBtn');

    // Dashboard UTMi
    totalUtmiEl = document.getElementById('totalUtmi');
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

    // NOUVEAU: Éléments pour le Revenu Universel et le Solde de Trésorerie
    universalIncomeEl = document.getElementById('universalIncome');
    treasuryBalanceEl = document.getElementById('treasuryBalance');
    updateUniversalIncomeBtn = document.getElementById('updateUniversalIncomeBtn'); // Supposé exister si vous avez ce bouton
    refreshWalletBtn = document.getElementById('refreshWalletBtn'); // Supposé exister si vous avez ce bouton

    // Chatbot Conversationnel
    chatArea = document.getElementById('chatArea');
    chatMessagesContainer = document.getElementById('chatMessagesContainer');
    chatInput = document.getElementById('chatInput');
    sendMessageBtn = document.getElementById('sendMessageBtn');
    newChatBtn = document.getElementById('newChatBtn');
    conversationListElement = document.getElementById('conversationList');
    prevPageBtn = document.getElementById('prevPageBtn');
    nextPageBtn = document.getElementById('nextPageBtn');
    currentPageInfoSpan = document.getElementById('currentPageInfo');

    // Générateur de CV
    cvTextInput = document.getElementById('cvTextInput');
    parseCvBtn = document.getElementById('parseCvBtn');
    cvOutput = document.getElementById('cvOutput');
    renderCvBtn = document.getElementById('renderCvBtn');
    cvHtmlOutput = document.getElementById('cvHtmlOutput');
    downloadCvBtn = document.getElementById('downloadCvBtn');
    refreshCvBtn = document.getElementById('refreshCvBtn');
    uploadCvFileBtn = document.getElementById('uploadCvFileBtn');
    fileInput = document.getElementById('fileInput');
    fileDisplaySpan = document.getElementById('fileDisplaySpan');

    // Modals - Initialisation si le modal.js utilise DOMContentLoaded
    // Si modal.js initialise ses éléments, ils seront déjà prêts ici.
    // Sinon, décommentez et initialisez-les ici si nécessaire.
    // genericAppModal = document.getElementById('genericAppModal');
    // ...

    // --- Attachement des gestionnaires d'événements ---

    // Page Accueil
    if (generateResponseBtn) generateResponseBtn.addEventListener('click', fetchGenerateResponse);
    if (clearPromptBtn) clearPromptBtn.addEventListener('click', () => {
        if (promptInput) promptInput.value = '';
        if (iaResponseOutput) iaResponseOutput.innerHTML = '';
        showStatusMessage('Prompt et réponse effacés.', 'info');
    });

    // Dashboard UTMi
    if (refreshDashboardBtn) refreshDashboardBtn.addEventListener('click', fetchDashboardInsights);
    // if (refreshWalletBtn) refreshWalletBtn.addEventListener('click', refreshWalletData); // Commenté

    // Chatbot Conversationnel
    if (sendMessageBtn) sendMessageBtn.addEventListener('click', sendMessage);
    if (chatInput) chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    if (newChatBtn) newChatBtn.addEventListener('click', () => {
        currentConversationId = null;
        if (chatMessagesContainer) chatMessagesContainer.innerHTML = '<div class="chat-message ai-message">Bonjour ! Comment puis-je vous aider aujourd\'hui ?</div>';
        if (chatInput) chatInput.value = '';
        showStatusMessage('Nouvelle conversation commencée.', 'info');
        if (typeof setActiveConversationId === 'function') {
            setActiveConversationId(null); // Désélectionner toute conversation active
        }
    });
    if (prevPageBtn && nextPageBtn && currentPageInfoSpan && conversationListElement) {
        if (typeof initPaginationControls === 'function') {
            initPaginationControls(conversationListElement, prevPageBtn, nextPageBtn, currentPageInfoSpan, selectConversation, deleteConversation);
        } else {
            console.error("initPaginationControls n'est pas disponible globalement. Vérifiez pagination.js.");
        }
    }


    // Générateur de CV
    if (parseCvBtn) parseCvBtn.addEventListener('click', parseAndStructureCv);
    if (renderCvBtn) renderCvBtn.addEventListener('click', renderCvHtml);
    if (downloadCvBtn) downloadCvBtn.addEventListener('click', downloadCv);
    if (refreshCvBtn) refreshCvBtn.addEventListener('click', fetchLastStructuredCvData);
    if (updateUniversalIncomeBtn) updateUniversalIncomeBtn.addEventListener('click', calculateCvValue); // Assurez-vous que ce bouton existe

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


    // Initial page load based on URL hash or default to 'home'
    const initialPageId = window.location.hash.substring(1) || 'home';
    console.log(`[DOMContentLoaded] Initial page ID: ${initialPageId}`);
    showPage(initialPageId);

    // Initial fetch for dashboard data
    fetchDashboardInsights();

    console.log('[DOMContentLoaded] CVNU application initialization complete.');
});