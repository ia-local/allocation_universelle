// public/app.js

const API_BASE_URL = window.location.origin;

// --- Éléments du DOM pour le Générateur de CV (Section 1) ---
const conversationInput = document.getElementById('conversationInput');
const analyzeAndGenerateBtn = document.getElementById('analyzeAndGenerateBtn');
const cvDisplay = document.getElementById('cvDisplay');
const valorizeCvBtn = document.getElementById('valorizeCvBtn');
const valorizationDisplay = document.getElementById('valorizationDisplay');

// --- Éléments du DOM pour l'Assistant IA Conversationnel (Section 2) ---
const chatWindow = document.getElementById('chat-window');
const chatInput = document.getElementById('chat-input');
const sendChatBtn = document.getElementById('send-chat-btn');
const conversationList = document.getElementById('conversation-list');
const currentConversationIdSpan = document.getElementById('current-conversation-id');

// --- Éléments du DOM pour l'Interaction IA Ponctuelle (Section 3) ---
const promptInput = document.getElementById('prompt-input');
const iaResponseOutput = document.getElementById('ia-response-output');

// --- Éléments de Statut Global ---
const statusMessage = document.getElementById('statusMessage');

// --- Nouveaux éléments DOM pour la génération de CV depuis le Chat ---
// Ces éléments sont créés dynamiquement pour être insérés dans la section chat.
const generateCvSummaryBtn = document.createElement('button');
generateCvSummaryBtn.textContent = "Générer Résumé CV (Markdown)";
generateCvSummaryBtn.className = "secondary";
generateCvSummaryBtn.style.marginTop = "10px";
generateCvSummaryBtn.style.marginBottom = "15px";
generateCvSummaryBtn.style.display = "none"; // Caché par défaut

const cvSummaryHeader = document.createElement('h3');
cvSummaryHeader.textContent = "Résumé Professionnel de la Conversation (Markdown)";
cvSummaryHeader.style.display = "none"; // Caché par défaut

const cvSummaryOutput = document.createElement('pre');
cvSummaryOutput.style.backgroundColor = '#f0f0f0';
cvSummaryOutput.style.padding = '15px';
cvSummaryOutput.style.borderRadius = '8px';
cvSummaryOutput.style.marginTop = '10px';
cvSummaryOutput.style.whiteSpace = 'pre-wrap'; // Préserve les retours à la ligne
cvSummaryOutput.style.fontFamily = 'monospace';
cvSummaryOutput.style.display = 'none'; // Caché par défaut

let currentConversationId = null; // ID de la conversation de chat active
let currentConversationMessages = []; // Messages de la conversation de chat active
let generatedCvHtml = ''; // Variable pour stocker le HTML du CV généré par le textarea

// --- Initialisation DOM et écouteurs d'événements ---
document.addEventListener('DOMContentLoaded', () => {
    // Insérer les éléments de résumé CV dans la section de chat
    const chatAreaContainer = document.querySelector('.chat-area');
    if (chatAreaContainer) {
        // Insérer le bouton juste après le h2 de la section chat
        chatAreaContainer.querySelector('h2').insertAdjacentElement('afterend', generateCvSummaryBtn);
        // Insérer le titre et l'output du résumé après le bouton Nouvelle Conversation ou la structure chat-section
        const newConvButton = chatAreaContainer.querySelector('button.secondary');
        newConvButton.insertAdjacentElement('afterend', cvSummaryOutput);
        newConvButton.insertAdjacentElement('afterend', cvSummaryHeader);
    }

    // Chargement initial des conversations de chat
    fetchConversations();

    // Événements pour le Générateur de CV (Section 1)
    analyzeAndGenerateBtn.addEventListener('click', analyzeAndGenerateCvFromPastedText);
    valorizeCvBtn.addEventListener('click', valorizeCvFromGeneratedHtml);

    // Événements pour le Chatbot Conversationnel (Section 2)
    // startNewConversation() est déjà onclick dans l'HTML
    // sendMessage() est déjà onclick dans l'HTML
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !chatInput.disabled) {
            sendMessage();
        }
    });

    // Événements pour la génération de résumé CV depuis le chat
    generateCvSummaryBtn.addEventListener('click', () => generateCvSummaryFromChat(currentConversationId));
});

// --- Fonctions globales d'affichage de statut ---
const showStatus = (message, type = 'info') => {
    statusMessage.textContent = message;
    statusMessage.className = `status-message ${type}`;
};

// --- Fonctions du Générateur de CV (Section 1) ---

/**
 * Analyse le Markdown collé et génère le CV HTML.
 */
async function analyzeAndGenerateCvFromPastedText() {
    const conversationMarkdown = conversationInput.value.trim();
    if (!conversationMarkdown) {
        showStatus('Veuillez entrer une conversation pour l\'analyse du CV.', 'error');
        return;
    }

    showStatus('Analyse du texte et génération du CV en cours...', 'info');
    analyzeAndGenerateBtn.disabled = true;
    valorizeCvBtn.disabled = true;
    cvDisplay.innerHTML = '<p>Génération en cours...</p>';
    valorizationDisplay.innerHTML = '<p>En attente de valorisation...</p>';

    try {
        // Étape 1 & 2: Envoyer le Markdown au serveur pour analyse et enregistrement dans logs.json
        const analyzeResponse = await fetch(`${API_BASE_URL}/api/record-and-analyze`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ conversationMarkdown }),
        });

        if (!analyzeResponse.ok) {
            const errorData = await analyzeResponse.json();
            throw new Error(errorData.message || 'Échec de l\'analyse de la conversation.');
        }

        const analyzeResult = await analyzeResponse.json();
        console.log('Analyse cognitive réussie:', analyzeResult);
        showStatus('Texte analysé. Génération du CV HTML...', 'info');

        // Étape 3: Demander la génération du CV HTML/CSS
        const generateCvResponse = await fetch(`${API_BASE_URL}/api/generate-cv`);

        if (!generateCvResponse.ok) {
            const errorText = await generateCvResponse.text();
            throw new Error(`Échec de la génération du CV: ${errorText}`);
        }

        generatedCvHtml = await generateCvResponse.text(); // Stocke le HTML pour valorisation
        cvDisplay.innerHTML = generatedCvHtml; // Affiche le CV
        showStatus('CV généré avec succès ! Vous pouvez maintenant le valoriser.', 'success');
        valorizeCvBtn.disabled = false; // Activer le bouton de valorisation

    } catch (error) {
        console.error('Erreur lors de l\'analyse ou la génération du CV:', error);
        showStatus(`Erreur lors de l'analyse ou la génération du CV: ${error.message}`, 'error');
        cvDisplay.innerHTML = '<p style="color:red;">Erreur lors de la génération du CV.</p>';
    } finally {
        analyzeAndGenerateBtn.disabled = false;
    }
}

/**
 * Valorise le CV généré en HTML via l'API Groq.
 */
async function valorizeCvFromGeneratedHtml() {
    if (!generatedCvHtml) {
        showStatus('Veuillez d\'abord générer le CV.', 'error');
        return;
    }

    showStatus('Valorisation des compétences du CV en cours...', 'info');
    valorizeCvBtn.disabled = true;
    valorizationDisplay.innerHTML = '<p>Valorisation par Groq en cours...</p>';

    try {
        // Extraire le texte du CV pour l'envoyer à l'IA
        // Créer un élément temporaire pour extraire le texte sans les balises HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = generatedCvHtml;
        const cvTextContent = tempDiv.innerText || tempDiv.textContent;

        const valorizeResponse = await fetch(`${API_BASE_URL}/api/valorize-cv`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cvContent: cvTextContent }),
        });

        if (!valorizeResponse.ok) {
            const errorData = await valorizeResponse.json();
            throw new Error(errorData.message || 'Échec de la valorisation du CV.');
        }

        const valorizationResult = await valorizeResponse.json();
        console.log('Valorisation Groq réussie:', valorizationResult);
        // Afficher le résultat de la valorisation
        valorizationDisplay.innerHTML = `<pre>${JSON.stringify(valorizationResult.valorization, null, 2)}</pre>`;
        showStatus('Compétences valorisées avec succès par l\'IA !', 'success');

    } catch (error) {
        console.error('Erreur lors de la valorisation:', error);
        showStatus(`Erreur lors de la valorisation du CV: ${error.message}`, 'error');
        valorizationDisplay.innerHTML = '<p style="color:red;">Erreur lors de la valorisation des compétences.</p>';
    } finally {
        valorizeCvBtn.disabled = false;
    }
}

// --- Fonctions de l'Assistant IA Conversationnel (Section 2) ---

/**
 * Récupère et affiche la liste des conversations.
 */
async function fetchConversations() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/conversations`);
        const data = await response.json();
        conversationList.innerHTML = '';
        if (data.length === 0) {
            conversationList.innerHTML = '<li>Aucune conversation trouvée.</li>';
            return;
        }
        data.forEach(conv => {
            const li = document.createElement('li');
            li.textContent = `Conversation: ${new Date(conv.createdAt).toLocaleString()} ${conv.title ? `(${conv.title})` : ''}`;
            li.dataset.id = conv.id;
            li.onclick = () => loadConversation(conv.id);

            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'Supprimer';
            deleteBtn.className = 'delete-conversation-btn';
            deleteBtn.onclick = (e) => {
                e.stopPropagation(); // Empêche le clic sur le LI parent
                deleteConversation(conv.id);
            };
            li.appendChild(deleteBtn);
            conversationList.appendChild(li);
        });
    } catch (error) {
        console.error('Erreur lors du chargement des conversations:', error);
        conversationList.innerHTML = '<li>Erreur de chargement des conversations.</li>';
    }
}

/**
 * Démarre une nouvelle conversation avec l'IA.
 */
async function startNewConversation() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/conversations/new`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        });
        const data = await response.json();
        if (response.ok) {
            currentConversationId = data.id;
            currentConversationMessages = data.messages.filter(msg => msg.role !== 'system');
            displayMessages();
            chatInput.disabled = false;
            sendChatBtn.disabled = false;
            currentConversationIdSpan.textContent = `ID: ${currentConversationId.substring(0, 8)}...`;
            fetchConversations(); // Met à jour la liste pour afficher la nouvelle conversation

            // Réinitialise les éléments de résumé CV pour le chat
            generateCvSummaryBtn.style.display = 'block'; // Afficher le bouton
            generateCvSummaryBtn.disabled = false;
            cvSummaryHeader.style.display = 'none';
            cvSummaryOutput.style.display = 'none';
            cvSummaryOutput.textContent = '';
            cvSummaryOutput.style.color = '#333';
        } else {
            alert(`Erreur: ${data.error}`);
        }
    } catch (error) {
        console.error('Erreur lors du démarrage d\'une nouvelle conversation:', error);
        alert('Erreur lors du démarrage d\'une nouvelle conversation.');
    }
}

/**
 * Charge une conversation existante par son ID.
 * @param {string} id - L'ID de la conversation à charger.
 */
async function loadConversation(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/conversations/${id}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const conversation = await response.json();
        currentConversationId = conversation.id;
        currentConversationMessages = conversation.messages.filter(msg => msg.role !== 'system');

        displayMessages();
        chatInput.disabled = false;
        sendChatBtn.disabled = false;
        currentConversationIdSpan.textContent = `ID: ${currentConversationId.substring(0, 8)}...`;

        // Met en surbrillance la conversation active dans la liste
        Array.from(conversationList.children).forEach(li => {
            li.classList.remove('active');
            if (li.dataset.id === id) {
                li.classList.add('active');
            }
        });

        // Affiche et active le bouton de résumé CV pour la conversation chargée
        generateCvSummaryBtn.style.display = 'block';
        generateCvSummaryBtn.disabled = false;
        generateCvSummaryBtn.onclick = () => generateCvSummaryFromChat(currentConversationId);
        cvSummaryHeader.style.display = 'none';
        cvSummaryOutput.style.display = 'none';
        cvSummaryOutput.textContent = '';
        cvSummaryOutput.style.color = '#333';

    } catch (error) {
        console.error('Erreur lors du chargement de la conversation:', error);
        alert('Erreur lors du chargement de la conversation.');
        chatWindow.innerHTML = `<div class="chat-message assistant" style="color:red;">Erreur de chargement de la conversation: ${error.message}</div>`;
        chatInput.disabled = true;
        sendChatBtn.disabled = true;
        generateCvSummaryBtn.style.display = 'none';
    }
}

/**
 * Affiche les messages dans la fenêtre de chat.
 */
function displayMessages() {
    chatWindow.innerHTML = '';
    currentConversationMessages.forEach(msg => {
        const div = document.createElement('div');
        div.className = `chat-message ${msg.role}`;
        // Assurez-vous que msg.utmi et msg.estimated_cost_usd existent pour ne pas afficher 'undefined'
        const utmiInfo = msg.utmi !== undefined && msg.utmi !== null ? `UTMi: ${msg.utmi.toFixed(2)} EUR |` : '';
        const costInfo = msg.estimated_cost_usd !== undefined && msg.estimated_cost_usd !== null ? `Coût: ${msg.estimated_cost_usd.toFixed(6)} USD` : '';
        div.innerHTML = `<strong>${msg.role === 'user' ? 'Vous' : 'IA'}:</strong> ${msg.content} <br><small>${utmiInfo} ${costInfo}</small>`;
        chatWindow.appendChild(div);
    });
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

/**
 * Envoie un message dans la conversation active et gère la réponse de l'IA.
 */
async function sendMessage() {
    const message = chatInput.value.trim();
    if (!message || !currentConversationId) {
        return;
    }

    // Ajoute le message de l'utilisateur à l'interface immédiatement
    currentConversationMessages.push({
        role: 'user',
        content: message,
        timestamp: new Date().toISOString()
    });
    displayMessages();
    chatInput.value = '';

    try {
        const response = await fetch(`${API_BASE_URL}/api/conversations/${currentConversationId}/message`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: message })
        });

        const data = await response.json();
        if (response.ok) {
            // Recharger la conversation pour obtenir l'état complet mis à jour (incluant UTMi/coût du serveur)
            await loadConversation(currentConversationId);
            fetchConversations(); // Mettre à jour les totaux UTMi dans la liste de conversations
        } else {
            alert(`Erreur: ${data.error}`);
            // Supprimer le message utilisateur si l'IA n'a pas pu répondre
            currentConversationMessages.pop();
            displayMessages();
        }
    } catch (error) {
        console.error('Erreur lors de l\'envoi du message:', error);
        alert('Erreur lors de l\'envoi du message.');
        currentConversationMessages.pop();
        displayMessages();
    }
}

/**
 * Supprime une conversation par son ID.
 * @param {string} id - L'ID de la conversation à supprimer.
 */
async function deleteConversation(id) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette conversation ?')) {
        return;
    }
    try {
        const response = await fetch(`${API_BASE_URL}/api/conversations/${id}`, {
            method: 'DELETE'
        });
        if (response.ok) {
            alert('Conversation supprimée avec succès.');
            if (currentConversationId === id) { // Si la conversation active est supprimée
                currentConversationId = null;
                currentConversationMessages = [];
                currentConversationIdSpan.textContent = '(Sélectionnez une conversation)';
                chatInput.disabled = true;
                sendChatBtn.disabled = true;
                generateCvSummaryBtn.style.display = 'none'; // Cacher le bouton de résumé CV
                cvSummaryHeader.style.display = 'none';
                cvSummaryOutput.style.display = 'none';
                cvSummaryOutput.textContent = '';
            }
            displayMessages();
            fetchConversations(); // Recharger la liste des conversations
        } else {
            const data = await response.json();
            alert(`Erreur lors de la suppression: ${data.error}`);
        }
    } catch (error) {
        console.error('Erreur de connexion lors de la suppression de la conversation:', error);
        alert('Erreur de connexion lors de la suppression de la conversation.');
    }
}

/**
 * Génère le résumé professionnel (Markdown) d'une conversation de chat.
 * @param {string} conversationId - L'ID de la conversation de chat.
 */
async function generateCvSummaryFromChat(conversationId) {
    if (!conversationId) {
        alert("Veuillez sélectionner une conversation d'abord.");
        return;
    }

    generateCvSummaryBtn.disabled = true;
    cvSummaryHeader.style.display = 'block'; // Afficher le titre
    cvSummaryOutput.textContent = 'Génération du résumé CV en cours...';
    cvSummaryOutput.style.display = 'block';
    cvSummaryOutput.style.color = '#333'; // Réinitialiser la couleur en cas d'erreur précédente

    try {
        const response = await fetch(`${API_BASE_URL}/api/conversations/${conversationId}/cv-professional-summary`);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Échec HTTP (${response.status}): ${errorText}`);
        }

        const cvSummaryMarkdown = await response.text();
        cvSummaryOutput.textContent = cvSummaryMarkdown;
        console.log("Résumé CV généré depuis le chat:", cvSummaryMarkdown);

    } catch (error) {
        console.error('Erreur lors de la génération du résumé CV depuis le chat:', error);
        cvSummaryOutput.textContent = `Erreur lors de la génération du résumé CV : ${error.message}`;
        cvSummaryOutput.style.color = 'red';
    } finally {
        generateCvSummaryBtn.disabled = false;
    }
}

// --- Fonctions d'Interaction IA Ponctuelle (Section 3) ---

/**
 * Génère une réponse IA ponctuelle et l'affiche.
 * (Fonction existante, gardée pour la cohérence)
 */
async function generateResponse() {
    const prompt = promptInput.value.trim();
    if (!prompt) {
        iaResponseOutput.textContent = "Veuillez entrer un prompt.";
        return;
    }

    iaResponseOutput.textContent = "Génération en cours...";
    try {
        const response = await fetch(`${API_BASE_URL}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: prompt })
        });

        const data = await response.json();
        if (response.ok) {
            // Note: Les champs utmi et estimated_cost_usd sont maintenant renvoyés par serveur.js
            // et devraient être affichés ici.
            iaResponseOutput.textContent = `Réponse de l'IA:\n${data.response}\n\nUTMi généré: ${data.utmi.toFixed(2)} EUR\nCoût estimé: ${data.estimatedCost.toFixed(6)} USD`;
            // Recharger les insights du tableau de bord (si vous réactivez cette section)
            // fetchDashboardInsights();
        } else {
            iaResponseOutput.textContent = `Erreur: ${data.error || 'Réponse inattendue du serveur.'}`;
        }
    } catch (error) {
        console.error('Erreur lors de la requête API ponctuelle:', error);
        iaResponseOutput.textContent = `Erreur de connexion: ${error.message}`;
    }
}
