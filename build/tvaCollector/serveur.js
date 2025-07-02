// serveur.js - Version unifiée et complète avec SCSS et pagination corrigée
const express = require('express');
const Groq = require('groq-sdk');
const cors = require('cors');
const path = require('path');
const fs = require('fs'); // Utilisation de fs standard, pas fs.promises ici pour compatibilité avec les fonctions existantes
const { v4: uuidv4 } = require('uuid');
const sassMiddleware = require('node-sass-middleware'); // NOUVEAU: Pour la compilation SCSS

// Load environment variables from .env file
require('dotenv').config();

// Importation des modules de calcul UTMi et des scores de qualité des modèles
const { calculateUtmi, calculateDashboardInsights, COEFFICIENTS } = require('./server_modules/utms_calculator');
const { MODEL_QUALITY_SCORES } = require('./server_modules/model_quality_config'); // Assurez-vous que ce fichier existe

// Modules spécifiques au générateur de CV
const { generateStructuredCvData, renderCvHtml } = require('./src/cv_processing'); // Nouveau module centralisé
const { generateProfessionalSummary } = require('./server_modules/cv_professional_analyzer');


// --- Server and AI Configuration ---
const config = {
  port: process.env.PORT || 3000,
  groq: {
    apiKey: process.env.GROQ_API_KEY,
    model: 'gemma2-9b-it', // Modèle par défaut pour les conversations de chat
    temperature: 0.7,
    maxTokens: 2048,
  },
  ai: {
    generalRole: "Un assistant IA expert en développement et en conseil technique.",
    generalContext: "Fournir des réponses précises, concises et utiles sur des sujets de programmation, d'architecture logicielle et de technologies web. Votre logique métier est d'être un conseiller technique fiable.",
    chatbotRole: "Un coach de carrière IA, expert en extraction de compétences et de savoir-faire pour la rédaction de CV.",
    chatbotContext: "Votre objectif est d'aider l'utilisateur à structurer son parcours professionnel. Posez des questions ciblées sur ses expériences, projets, compétences techniques (langages, outils, plateformes), défis rencontrés et solutions apportées, réalisations quantifiables, responsabilités et soft skills. Guidez-le pour qu'il exprime clairement ses aptitudes professionnelles.",
  },
  logFilePath: path.join(__dirname, 'data','logs.json'),
  conversationsFilePath: path.join(__dirname, 'conversations.json'),
  lastStructuredCvFilePath: path.join(__dirname, 'data', 'last_structured_cv.json') // Nouveau chemin pour le CV JSON
};

// Validate Groq API Key
if (!config.groq.apiKey) {
  console.error("❌ Erreur: La clé API Groq (GROQ_API_KEY) n'est pas configurée dans les variables d'environnement.");
  process.exit(1);
}

const groq = new Groq({ apiKey: config.groq.apiKey });
const app = express();

// --- Global Log Management ---
const writeLog = (logEntry) => {
  const timestamp = new Date().toISOString();
  const log = { timestamp, ...logEntry };

  try {
    let logs = [];
    if (fs.existsSync(config.logFilePath)) {
      const data = fs.readFileSync(config.logFilePath, 'utf8');
      logs = JSON.parse(data.toString());
    }
    logs.push(log);
    fs.writeFileSync(config.logFilePath, JSON.stringify(logs, null, 2), 'utf8');
  } catch (error) {
    console.error("❌ Erreur lors de l'écriture du log dans logs.json:", error.message);
  }
};

// Initialize logs.json
if (!fs.existsSync(config.logFilePath)) {
  fs.writeFileSync(config.logFilePath, JSON.stringify([]));
  console.log(`➡️ Fichier de log créé : ${config.logFilePath}`);
} else {
  try {
    JSON.parse(fs.readFileSync(config.logFilePath, 'utf8').toString());
  } catch (parseError) {
    console.error(`⚠️ Fichier de log existant corrompu (${config.logFilePath}). Réinitialisation.`);
    fs.writeFileSync(config.logFilePath, JSON.stringify([]));
  }
}

// --- Conversation History Management (Shared) ---
let conversations = []; // In-memory storage for current session

const loadConversations = () => {
  if (fs.existsSync(config.conversationsFilePath)) {
    try {
      const data = fs.readFileSync(config.conversationsFilePath, 'utf8');
      conversations = JSON.parse(data);
      console.log(`➡️ Conversations historiques chargées depuis : ${config.conversationsFilePath}`);
    } catch (error) {
      console.error("❌ Erreur lors du chargement des conversations historiques:", error.message);
      conversations = []; // Start fresh if file is corrupted
    }
  } else {
    fs.writeFileSync(config.conversationsFilePath, JSON.stringify([]));
    console.log(`➡️ Fichier d'historique des conversations créé: ${config.conversationsFilePath}`);
  }
};

const saveConversations = () => {
  fs.writeFile(config.conversationsFilePath, JSON.stringify(conversations, null, 2), (err) => {
    if (err) {
      console.error("❌ Erreur lors de l'écriture de l'historique des conversations:", err.message);
    }
  });
};

// Load conversations when server starts
loadConversations();


// --- Middleware Setup ---
app.use(cors());
app.use(express.json()); // For parsing JSON request bodies

// NOUVEAU: SCSS Middleware
app.use(
    sassMiddleware({
        src: path.join(__dirname, 'docs'), // Répertoire source de vos fichiers SCSS
        dest: path.join(__dirname, 'docs'), // Répertoire de destination pour les fichiers CSS compilés
        debug: true, // Affiche des messages de debug dans la console
        outputStyle: 'compressed', // Style de sortie (expanded, compressed, etc.)
        force: true // Force la recompilation à chaque requête (utile en dev)
    })
);

// Serve static files from the 'docs' directory
app.use(express.static(path.join(__dirname, 'docs')));
console.log(`➡️ Service des fichiers statiques depuis : ${path.join(__dirname, 'docs')}`);

// --- Fonction utilitaire pour déterminer les drapeaux de Taxe IA ---
// Ces fonctions sont des MOCKS/PLACEHOLDERS pour le moment.
// Elles devraient être remplacées par une logique plus sophistiquée
// (ex: basée sur le profil utilisateur, l'analyse NLP du prompt, les données blockchain).
const determineTaxIAFlags = (userPrompt, userId = 'default_user') => {
    const lowerPrompt = userPrompt.toLowerCase();
    let isCommercialUse = false;
    let isLegalCompliance = false;
    let campaignRelatedUtmiShare = 0; // Entre 0 et 1, représentant la part d'UTMi liée à une campagne

    // Simulation simple pour isCommercialUse
    if (lowerPrompt.includes('entreprise') || lowerPrompt.includes('business') ||
        lowerPrompt.includes('commercial') || lowerPrompt.includes('monétisation')) {
        isCommercialUse = true;
    }
    // Simulation simple pour isLegalCompliance (ex: si le prompt parle de conformité ou de loi)
    if (lowerPrompt.includes('réglementation') || lowerPrompt.includes('loi') ||
        lowerPrompt.includes('conformité') || lowerPrompt.includes('rgpd')) {
        isLegalCompliance = true;
    }

    // Simulation pour le "compte de campagne 918" - ceci est très abstrait sans plus de détails.
    // Pour l'instant, nous allons simuler un impact basé sur un certain user ID
    // ou si le prompt mentionne "campagne" ou "politique".
    if (userId === 'user_campaign_test' || lowerPrompt.includes('campagne') || lowerPrompt.includes('politique')) {
        campaignRelatedUtmiShare = 0.05; // 5% des UTMi pour la "campagne"
    }

    // Ici, vous pourriez intégrer la logique de lecture de l'ABI/smart contract
    // pour des données spécifiques à l'utilisateur si une blockchain était activement connectée.
    // Par exemple, pour obtenir un "score de conformité" de l'utilisateur stocké sur la blockchain.
    // const userBlockchainData = await getUserDataFromSmartContract(userId, abi_smartContract_cvnu.json, cvnu.sol_address);
    // if (userBlockchainData.complianceScore > 0.8) isLegalCompliance = true;

    return {
        isCommercialUse,
        isLegalCompliance,
        campaignRelatedUtmiShare
    };
};


// --- API Endpoints ---

/**
 * POST /api/generate
 * Génère du contenu via l'API Groq (Interaction ponctuelle).
 * Enregistre les interactions et les UTMi dans les logs.
 */
app.post('/api/generate', async (req, res) => {
  const userPrompt = req.body.prompt;
  const modelToUse = req.body.model || config.groq.model;
  // Assumons un userId par défaut pour les interactions ponctuelles ou extrayez-le du req.body/session
  const userId = req.body.userId || 'guest_user';

  if (!userPrompt) {
    writeLog({ type: 'ERROR', message: 'Prompt manquant', prompt: userPrompt });
    return res.status(400).json({ error: 'Le champ "prompt" est requis.' });
  }

  const requestStartTime = Date.now();
  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: userPrompt }],
      model: modelToUse,
      temperature: config.groq.temperature,
      max_tokens: config.groq.maxTokens,
    });

    const aiResponseContent = chatCompletion.choices[0]?.message?.content;
    const processingTime = (Date.now() - requestStartTime) / 1000;
    const responseTokenCount = chatCompletion.usage?.output_tokens || Math.ceil(aiResponseContent?.length / 4);
    const promptTokenCount = chatCompletion.usage?.prompt_tokens || Math.ceil(userPrompt.length / 4);

    if (aiResponseContent) {
        // Déterminer les drapeaux de Taxe IA pour cette interaction
        const taxIAFlags = determineTaxIAFlags(userPrompt, userId);

        // --- Calcul UTMi pour la réponse AI ---
        const aiResponseInteractionData = {
            type: COEFFICIENTS.LOG_TYPES.AI_RESPONSE,
            data: {
                text: aiResponseContent,
                tokenCount: responseTokenCount,
                outputTokens: responseTokenCount,
                inputTokens: promptTokenCount,
                modelId: modelToUse,
                relevance: true, // Placeholder
                coherence: true,
                completeness: true,
                problemSolved: false, // Placeholder
                isFiscalEconomicInsight: aiResponseContent.toLowerCase().includes('fiscal') || aiResponseContent.toLowerCase().includes('économie'),
                isMetierSpecificSolution: false,
                // NOUVEAU: Ajout des drapeaux pour la Taxe IA
                isCommercialUse: taxIAFlags.isCommercialUse,
                isLegalCompliance: taxIAFlags.isLegalCompliance,
                campaignRelatedUtmiShare: taxIAFlags.campaignRelatedUtmiShare,
            }
        };
        // Pour les interactions ponctuelles, le userCvnuValue est un simple placeholder si pas de user authentifié
        const aiResponseUtmiResult = calculateUtmi(aiResponseInteractionData, { userCvnuValue: 0.5 }, MODEL_QUALITY_SCORES);

        writeLog({
            type: 'AI_RESPONSE_PUNCTUAL',
            userId: userId, // Log l'ID utilisateur
            prompt: userPrompt,
            response: aiResponseContent,
            model: modelToUse,
            utmi: aiResponseUtmiResult.utmi,
            estimatedCost: aiResponseUtmiResult.estimatedCostUSD,
            taxeIAAmount: aiResponseUtmiResult.taxeIAAmount, // Log le montant de la taxe
            processingTime: processingTime,
            taxFlags: taxIAFlags // Log les drapeaux appliqués
        });

        res.status(200).json({
            response: aiResponseContent,
            utmi: aiResponseUtmiResult.utmi,
            estimatedCost: aiResponseUtmiResult.estimatedCostUSD,
            taxeIAAmount: aiResponseUtmiResult.taxeIAAmount
        });

    } else {
        writeLog({ type: 'ERROR', message: 'Réponse IA vide', prompt: userPrompt, model: modelToUse, userId: userId });
        res.status(500).json({ error: "L'IA n'a pas pu générer de réponse." });
    }

  } catch (error) {
    console.error('Erreur lors de l\'appel à l\'API Groq (ponctuel):', error);
    if (error.response && error.response.status === 429) {
        res.status(429).json({ error: "Trop de requêtes. Veuillez patienter un instant avant de réessayer." });
    } else {
        const errorMessage = error.response && error.response.status >= 500
            ? "Le service Groq est actuellement indisponible. Veuillez réessayer plus tard."
            : error.message;

        writeLog({
            type: 'ERROR',
            message: `Erreur API Groq (ponctuel): ${errorMessage}`,
            details: error.message,
            prompt: userPrompt,
            model: modelToUse,
            userId: userId, // Log l'ID utilisateur même en cas d'erreur
            status: error.response?.status || 'N/A'
        });
        res.status(500).json({ error: `Une erreur interne est survenue lors de la communication avec l'IA: ${errorMessage}` });
    }
  }
});

/**
 * GET /api/dashboard-insights
 * Retourne les insights UTMi agrégés de tous les logs.
 */
app.get('/api/dashboard-insights', (req, res) => {
    fs.readFile(config.logFilePath, (err, data) => {
        if (err) {
            console.error("Erreur lecture logs pour insights:", err);
            return res.status(500).json({ error: "Impossible de lire les logs pour les insights." });
        }
        try {
            const logs = JSON.parse(data.toString());
            const insights = calculateDashboardInsights(logs);
            res.status(200).json(insights);
        } catch (parseError) {
            console.error("Erreur parsing logs pour insights:", parseError);
            res.status(500).json({ error: "Erreur de format des logs, impossible de générer les insights." });
        }
    });
});

// --- API Endpoints for Chatbot Conversations ---

/**
 * GET /api/conversations
 * Retrieves all stored conversation histories with pagination.
 * @query {number} page - Current page number (default 1).
 * @query {number} limit - Number of conversations per page (default 5).
 */
app.get('/api/conversations', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5;

  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;

  const allConversationsSorted = conversations.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const paginatedConversations = allConversationsSorted.slice(startIndex, endIndex);
  const totalCount = allConversationsSorted.length;
  const totalPages = Math.ceil(totalCount / limit);

  // Assumons un userId par défaut pour l'affichage des conversations
  const userId = req.query.userId || 'guest_user'; // Ou de la session

  writeLog({ type: 'CONVERSATION_HISTORY', action: 'READ_ALL', page, limit, count: paginatedConversations.length, totalCount, userId: userId });

  res.status(200).json({
    conversations: paginatedConversations.map(({ id, createdAt, title, utmi_total, estimated_cost_total_usd }) => ({ id, createdAt, title, utmi_total, estimated_cost_total_usd })),
    totalCount,
    totalPages,
    currentPage: page
  });
});

/**
 * GET /api/conversations/:id
 * Retrieves a specific conversation history by ID.
 */
app.get('/api/conversations/:id', (req, res) => {
  const { id } = req.params;
  const conversation = conversations.find(conv => conv.id === id);
  // Assumons un userId par défaut pour le logging
  const userId = req.query.userId || 'guest_user';

  if (conversation) {
    const userVisibleMessages = conversation.messages.filter(msg => msg.role !== 'system');
    writeLog({ type: 'CONVERSATION_HISTORY', action: 'READ_SINGLE', conversationId: id, userId: userId });
    res.status(200).json({ ...conversation, messages: userVisibleMessages });
  } else {
    writeLog({ type: 'CONVERSATION_HISTORY', action: 'READ_SINGLE_NOT_FOUND', conversationId: id, userId: userId });
    res.status(404).json({ error: 'Conversation non trouvée.' });
  }
});

/**
 * POST /api/conversations/new
 * Starts a new conversation.
 */
app.post('/api/conversations/new', (req, res) => {
  const newConversationId = uuidv4();
  const systemMessage = {
    role: "system",
    content: `${config.ai.chatbotRole} ${config.ai.chatbotContext}`
  };
  const initialMessages = [systemMessage];

  // Assumons un userId par défaut pour les nouvelles conversations
  const userId = req.body.userId || 'guest_user'; // Ou de la session
  // Pour la simulation, userCvnuValue est hardcodé pour l'instant.
  // Dans un système réel, il viendrait du profil utilisateur (potentiellement blockchain).
  const userCvnuValue = 0.5; // Placeholder for user's CVNU value

  // Calcul UTMi pour le début de session (peut être optionnel ou basé sur le type d'utilisateur)
  // Pas de drapeaux de taxe IA au démarrage de session pour le moment, mais pourrait être ajouté.
  const sessionStartUtmiResult = calculateUtmi({ type: COEFFICIENTS.LOG_TYPES.SESSION_START }, { userCvnuValue: userCvnuValue }, MODEL_QUALITY_SCORES);

  const newConversation = {
    id: newConversationId,
    createdAt: new Date().toISOString(),
    messages: initialMessages,
    title: `Conversation ${new Date().toLocaleString()}`, // Titre par défaut
    userId: userId, // Associer la conversation à un utilisateur
    utmi_total: sessionStartUtmiResult.utmi,
    estimated_cost_total_usd: sessionStartUtmiResult.estimatedCostUSD
  };
  conversations.push(newConversation);
  saveConversations();
  writeLog({
      type: 'CONVERSATION_MANAGEMENT',
      action: 'NEW_CONVERSATION',
      conversationId: newConversationId,
      userId: userId, // Log l'ID utilisateur
      utmi_generated: newConversation.utmi_total,
      estimated_cost_usd: newConversation.estimated_cost_total_usd
  });
  res.status(201).json(newConversation);
});

/**
 * POST /api/conversations/:id/message
 * Sends a message within an existing conversation and gets an AI response.
 */
app.post('/api/conversations/:id/message', async (req, res) => {
  const { id } = req.params;
  const userMessageContent = req.body.message;
  const modelToUse = config.groq.model;

  if (!userMessageContent) {
    writeLog({ type: 'CONVERSATION_ERROR', action: 'SEND_MESSAGE_FAIL', reason: 'Missing message', conversationId: id });
    return res.status(400).json({ error: "Le champ 'message' est manquant dans le corps de la requête." });
  }

  const conversationIndex = conversations.findIndex(conv => conv.id === id);
  if (conversationIndex === -1) {
    writeLog({ type: 'CONVERSATION_ERROR', action: 'SEND_MESSAGE_FAIL', reason: 'Conversation not found', conversationId: id });
    return res.status(404).json({ error: 'Conversation non trouvée.' });
  }

  const currentConversation = conversations[conversationIndex];
  // Utiliser l'ID utilisateur associé à la conversation pour les calculs de taxe
  const userId = currentConversation.userId || 'guest_user';
  // Placeholder pour userCvnuValue. Dans un vrai système, il serait dynamique.
  const userCvnuValue = 0.5;

  // Déterminer les drapeaux de Taxe IA pour le message utilisateur
  const taxIAFlagsUser = determineTaxIAFlags(userMessageContent, userId);

  // Calcul UTMi pour le message utilisateur
  const userPromptInteractionData = {
      type: COEFFICIENTS.LOG_TYPES.PROMPT,
      data: {
          text: userMessageContent,
          wordCount: userMessageContent.split(/\s+/).filter(word => word.length > 0).length,
          inputTokens: Math.ceil(userMessageContent.length / 4),
          modelId: modelToUse, // Ajout du modelId pour que calculateUtmi puisse l'utiliser pour le coût
          // NOUVEAU: Ajout des drapeaux pour la Taxe IA pour l'interaction de prompt
          isCommercialUse: taxIAFlagsUser.isCommercialUse,
          isLegalCompliance: taxIAFlagsUser.isLegalCompliance,
          campaignRelatedUtmiShare: taxIAFlagsUser.campaignRelatedUtmiShare,
      }
  };
  const userUtmiResult = calculateUtmi(userPromptInteractionData, { userCvnuValue: userCvnuValue }, MODEL_QUALITY_SCORES);

  // Add user message to conversation history
  currentConversation.messages.push({
      role: 'user',
      content: userMessageContent,
      timestamp: new Date().toISOString(),
      utmi: userUtmiResult.utmi,
      estimated_cost_usd: userUtmiResult.estimatedCostUSD,
      taxeIAAmount: userUtmiResult.taxeIAAmount, // Log le montant de la taxe pour le prompt
      taxFlags: taxIAFlagsUser, // Log les drapeaux
  });
  currentConversation.utmi_total = (currentConversation.utmi_total || 0) + userUtmiResult.utmi;
  currentConversation.estimated_cost_total_usd = (currentConversation.estimated_cost_total_usd || 0) + userUtmiResult.estimatedCostUSD;

  writeLog({
      type: 'CONVERSATION_MESSAGE',
      action: 'USER_MESSAGE_SENT',
      conversationId: id,
      userId: userId, // Log l'ID utilisateur
      userMessage: userMessageContent.substring(0, 100) + '...',
      utmi: userUtmiResult.utmi,
      estimated_cost_usd: userUtmiResult.estimatedCostUSD,
      taxeIAAmount: userUtmiResult.taxeIAAmount,
      interaction: userPromptInteractionData,
      taxFlags: taxIAFlagsUser
  });

  try {
    const messagesForGroq = currentConversation.messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    const chatCompletion = await groq.chat.completions.create({
      messages: messagesForGroq,
      model: modelToUse,
      temperature: config.groq.temperature,
      max_tokens: config.groq.maxTokens,
    });

    const aiResponseContent = chatCompletion.choices[0]?.message?.content;
    const responseTokenCount = chatCompletion.usage?.output_tokens || Math.ceil(aiResponseContent?.length / 4);
    const promptTokenCount = chatCompletion.usage?.prompt_tokens || Math.ceil(messagesForGroq.map(m => m.content).join('').length / 4);

    if (aiResponseContent) {
        // Déterminer les drapeaux de Taxe IA pour la réponse IA (basés sur le contenu de la réponse ou du prompt initial)
        const taxIAFlagsAIResponse = determineTaxIAFlags(userMessageContent + " " + aiResponseContent, userId);

        // Calcul UTMi pour la réponse IA
        const aiResponseInteractionData = {
            type: COEFFICIENTS.LOG_TYPES.AI_RESPONSE,
            data: {
                text: aiResponseContent,
                tokenCount: responseTokenCount,
                outputTokens: responseTokenCount,
                inputTokens: promptTokenCount,
                modelId: modelToUse,
                relevance: true, // Placeholder
                coherence: true,
                completeness: true,
                problemSolved: false, // Placeholder
                isFiscalEconomicInsight: aiResponseContent.toLowerCase().includes('fiscal') || aiResponseContent.toLowerCase().includes('économie'),
                isMetierSpecificSolution: false,
                // NOUVEAU: Ajout des drapeaux pour la Taxe IA pour la réponse de l'IA
                isCommercialUse: taxIAFlagsAIResponse.isCommercialUse,
                isLegalCompliance: taxIAFlagsAIResponse.isLegalCompliance,
                campaignRelatedUtmiShare: taxIAFlagsAIResponse.campaignRelatedUtmiShare,
            }
        };
        const aiUtmiResult = calculateUtmi(aiResponseInteractionData, { userCvnuValue: userCvnuValue }, MODEL_QUALITY_SCORES);

        // Add AI response to conversation history
        currentConversation.messages.push({
            role: 'assistant',
            content: aiResponseContent,
            timestamp: new Date().toISOString(),
            utmi: aiUtmiResult.utmi,
            estimated_cost_usd: aiUtmiResult.estimatedCostUSD,
            taxeIAAmount: aiUtmiResult.taxeIAAmount, // Log le montant de la taxe pour la réponse IA
            taxFlags: taxIAFlagsAIResponse, // Log les drapeaux
        });
        currentConversation.utmi_total = (currentConversation.utmi_total || 0) + aiUtmiResult.utmi;
        currentConversation.estimated_cost_total_usd = (currentConversation.estimated_cost_total_usd || 0) + aiUtmiResult.estimatedCostUSD;

        saveConversations();

        writeLog({
            type: 'CONVERSATION_MESSAGE',
            action: 'AI_RESPONSE_RECEIVED',
            conversationId: id,
            userId: userId, // Log l'ID utilisateur
            aiResponse: aiResponseContent.substring(0, 100) + '...',
            utmi: aiUtmiResult.utmi,
            estimated_cost_usd: aiUtmiResult.estimatedCostUSD,
            taxeIAAmount: aiUtmiResult.taxeIAAmount,
            interaction: aiResponseInteractionData,
            taxFlags: taxIAFlagsAIResponse
        });
        res.status(200).json({
            aiResponse: aiResponseContent,
            utmi: aiUtmiResult.utmi,
            estimated_cost_usd: aiUtmiResult.estimatedCostUSD,
            taxeIAAmount: aiUtmiResult.taxeIAAmount
        });
    } else {
      console.warn(`⚠️ Groq n'a pas généré de contenu pour la conversation ${id}.`);
      writeLog({ type: 'CONVERSATION_ERROR', action: 'AI_RESPONSE_EMPTY', conversationId: id, userId: userId });
      res.status(500).json({ error: "L'IA n'a pas pu générer de réponse." });
    }

  } catch (error) {
    console.error(`❌ Erreur lors de l'appel à l'API Groq pour la conversation ${id}:`, error);
    const errorMessage = error.response && error.response.status >= 500
        ? "Le service Groq est actuellement indisponible. Veuillez réessayer plus tard."
        : error.message;

    if (error.response && error.response.status === 429) {
        res.status(429).json({ error: "Trop de requêtes. Veuillez patienter un instant avant de réessayer." });
    } else {
        writeLog({
            type: 'CONVERSATION_ERROR',
            action: 'AI_API_ERROR',
            conversationId: id,
            userId: userId, // Log l'ID utilisateur
            errorMessage: `Erreur API Groq: ${errorMessage}`,
            stack: error.stack?.substring(0, 500) + '...' || 'N/A',
            status: error.response?.status || 'N/A'
        });
        res.status(500).json({ error: `Une erreur interne est survenue lors de la communication avec l'IA: ${errorMessage}` });
    }
  }
});

/**
 * DELETE /api/conversations/:id
 * Deletes a specific conversation history.
 */
app.delete('/api/conversations/:id', (req, res) => {
  const { id } = req.params;
  const initialLength = conversations.length;
  // Assumons un userId par défaut pour le logging
  const userId = req.query.userId || 'guest_user';

  conversations = conversations.filter(conv => conv.id !== id);

  if (conversations.length < initialLength) {
    saveConversations();
    writeLog({ type: 'CONVERSATION_MANAGEMENT', action: 'CONVERSATION_DELETED', status: 'SUCCESS', conversationId: id, userId: userId });
    res.status(204).send();
  } else {
    writeLog({ type: 'CONVERSATION_MANAGEMENT', action: 'CONVERSATION_DELETED', status: 'NOT_FOUND', conversationId: id, userId: userId });
    res.status(404).json({ error: `Conversation avec l'ID ${id} non trouvée.` });
  }
});


// --- ROUTES POUR LE GÉNÉRATEUR DE CV ---

/**
 * POST /api/cv/parse-and-structure
 * Reçoit le texte brut du CV, utilise l'IA pour le structurer en JSON.
 * @body {string} cvContent - Le texte brut du CV.
 * @returns {object} - L'objet JSON structuré du CV.
 */
app.post('/api/cv/parse-and-structure', async (req, res) => {
    const { cvContent } = req.body;
    // Assumons un userId par défaut pour cette opération
    const userId = req.body.userId || 'guest_user';

    if (!cvContent) {
        return res.status(400).json({ error: 'Le contenu du CV est manquant.' });
    }
    try {
        const structuredData = await generateStructuredCvData(cvContent);
        fs.writeFileSync(config.lastStructuredCvFilePath, JSON.stringify(structuredData, null, 2), 'utf8');
        writeLog({ type: 'CV_PROCESSING', action: 'PARSE_AND_STRUCTURE', status: 'SUCCESS', data: structuredData.nom || 'N/A', userId: userId });
        res.status(200).json(structuredData);
    } catch (error) {
        console.error('Erreur lors du parsing et structuration du CV:', error);
        if (error.response && error.response.status === 429) {
            res.status(429).json({ error: "Trop de requêtes. Veuillez patienter un instant avant de réessayer de structurer le CV." });
        } else {
            const errorMessage = error.response && error.response.status >= 500
                ? "Le service Groq est actuellement indisponible. Veuillez réessayer plus tard."
                : error.message;

            writeLog({ type: 'CV_PROCESSING', action: 'PARSE_AND_STRUCTURE', status: 'ERROR', error: `Erreur API Groq: ${errorMessage}`, details: error.message, status_code: error.response?.status || 'N/A', userId: userId });
            res.status(500).json({ error: `Échec de l'analyse et de la structuration du CV: ${errorMessage}`, details: error.message });
        }
    }
});

/**
 * POST /api/cv/render-html
 * Reçoit une structure JSON du CV et renvoie le HTML formaté.
 * @body {object} cvData - L'objet JSON structuré du CV.
 * @returns {string} - La chaîne HTML du CV.
 */
app.post('/api/cv/render-html', (req, res) => {
    const { cvData } = req.body;
    // Assumons un userId par défaut pour cette opération
    const userId = req.body.userId || 'guest_user';

    if (!cvData) {
        return res.status(400).json({ error: 'Les données structurées du CV sont manquantes.' });
    }
    try {
        const htmlContent = renderCvHtml(cvData);
        writeLog({ type: 'CV_PROCESSING', action: 'RENDER_HTML', status: 'SUCCESS', name: cvData.nom || 'N/A', userId: userId });
        res.setHeader('Content-Type', 'text/html');
        res.status(200).send(htmlContent);
    } catch (error) {
        console.error('Erreur lors du rendu HTML du CV:', error);
        writeLog({ type: 'CV_PROCESSING', action: 'RENDER_HTML', status: 'ERROR', error: error.message, userId: userId });
        res.status(500).json({ error: 'Échec du rendu HTML du CV.', details: error.message });
    }
});

/**
 * GET /api/cv/last-structured-data
 * Retourne la dernière structure JSON de CV enregistrée.
 * Utile pour pré-remplir le formulaire d'édition.
 */
app.get('/api/cv/last-structured-data', (req, res) => {
    // Assumons un userId par défaut pour cette opération
    const userId = req.query.userId || 'guest_user';

    if (fs.existsSync(config.lastStructuredCvFilePath)) {
        try {
            const data = fs.readFileSync(config.lastStructuredCvFilePath, 'utf8');
            const structuredCv = JSON.parse(data);
            writeLog({ type: 'CV_PROCESSING', action: 'LOAD_LAST_STRUCTURED_DATA', status: 'SUCCESS', userId: userId });
            res.status(200).json(structuredCv);
        } catch (error) {
            console.error('Erreur lors de la lecture du dernier CV structuré:', error);
            writeLog({ type: 'CV_PROCESSING', action: 'LOAD_LAST_STRUCTURED_DATA', status: 'ERROR', error: error.message, userId: userId });
            res.status(500).json({ error: 'Impossible de lire les dernières données de CV structurées.', details: error.message });
        }
    } else {
        writeLog({ type: 'CV_PROCESSING', action: 'LOAD_LAST_STRUCTURED_DATA', status: 'NOT_FOUND', userId: userId });
        res.status(404).json({ error: 'Aucune donnée de CV structurée trouvée.' });
    }
});

/**
 * @route POST /api/valorize-cv
 * @description Envoie le contenu textuel du CV au modèle Groq pour la valorisation des compétences.
 * @body {string} cvContent - Le contenu textuel du CV à valoriser.
 * @returns {object} - La valorisation des compétences par l'IA.
 */
app.post('/api/valorize-cv', async (req, res) => {
    const { cvContent } = req.body;
    // Assumons un userId par défaut pour cette opération
    const userId = req.body.userId || 'guest_user';

    if (!cvContent) {
        return res.status(400).json({ message: 'Contenu du CV manquant pour la valorisation.' });
    }

    try {
        const valorizedResult = await require('./src/groq_cv_analyse').valorizeSkillsWithGroq(cvContent);

        // Calcul de la taxe IA pour la valorisation du CV (même si le module valorizeSkillsWithGroq ne retourne pas d'UTMi directe)
        // Ceci est une SIMULATION. En réalité, valorizeSkillsWithGroq devrait renvoyer des données
        // qui peuvent être utilisées pour calculer l'UTMi.
        const mockUtmiForValorization = 10; // Valeur arbitraire pour la démo
        const taxIAFlags = determineTaxIAFlags(cvContent, userId);
        const valorizationUtmiResult = calculateUtmi(
            { type: COEFFICIENTS.LOG_TYPES.CV_VALORIZATION, data: { text: cvContent, ...taxIAFlags } },
            { userCvnuValue: 0.5 }, // Placeholder
            MODEL_QUALITY_SCORES
        );

        writeLog({
            type: 'CV_PROCESSING',
            action: 'VALORIZE_CV',
            status: 'SUCCESS',
            userId: userId,
            utmi: valorizationUtmiResult.utmi,
            estimatedCost: valorizationUtmiResult.estimatedCostUSD,
            taxeIAAmount: valorizationUtmiResult.taxeIAAmount,
            taxFlags: taxIAFlags
        });

        res.status(200).json({
            message: 'Compétences du CV valorisées avec succès.',
            valorization: valorizedResult,
            utmi: valorizationUtmiResult.utmi,
            estimatedCost: valorizationUtmiResult.estimatedCostUSD,
            taxeIAAmount: valorizationUtmiResult.taxeIAAmount
        });
    } catch (error) {
        console.error('Erreur lors de la valorisation du CV avec Groq (route /api/valorize-cv):', error);
        if (error.response && error.response.status === 429) {
            res.status(429).json({ error: "Trop de requêtes. Veuillez patienter un instant avant de réessayer." });
        } else {
            const errorMessage = error.response && error.response.status >= 500
                ? "Le service Groq est actuellement indisponible. Veuillez réessayer plus tard."
                : error.message;

            writeLog({ type: 'CV_PROCESSING', action: 'VALORIZE_CV', status: 'ERROR', error: `Erreur API Groq: ${errorMessage}`, details: error.message, userId: userId });
            res.status(500).json({ message: `Erreur serveur lors de la valorisation du CV: ${errorMessage}`, error: error.message });
        }
    }
});


// --- NOUVELLE ROUTE: Générer un résumé professionnel d'une conversation pour un CV (depuis le chat) ---
app.get('/api/conversations/:id/cv-professional-summary', async (req, res) => {
    const { id } = req.params;
    const conversation = conversations.find(conv => conv.id === id);

    if (!conversation) {
        return res.status(404).json({ error: 'Conversation non trouvée.' });
    }

    // Utiliser l'ID utilisateur associé à la conversation pour les calculs de taxe
    const userId = conversation.userId || 'guest_user';
    // Placeholder pour userCvnuValue
    const userCvnuValue = 0.5;

    try {
        const professionalSummaryMarkdown = await generateProfessionalSummary(conversation.messages);

        // Déterminer les drapeaux de Taxe IA pour cette opération
        const taxIAFlags = determineTaxIAFlags(professionalSummaryMarkdown, userId);

        // Calcul UTMi pour la génération de résumé CV (simulation)
        const summaryUtmiResult = calculateUtmi(
            { type: COEFFICIENTS.LOG_TYPES.CV_SUMMARY_GENERATE, data: { text: professionalSummaryMarkdown, ...taxIAFlags } },
            { userCvnuValue: userCvnuValue },
            MODEL_QUALITY_SCORES
        );

        res.setHeader('Content-Type', 'text/markdown');
        res.status(200).send(professionalSummaryMarkdown);

        writeLog({
            type: 'CV_GENERATION_FROM_CHAT',
            action: 'GENERATE_SUMMARY',
            status: 'SUCCESS',
            conversationId: id,
            userId: userId, // Log l'ID utilisateur
            summaryLength: professionalSummaryMarkdown.length,
            utmi: summaryUtmiResult.utmi,
            estimatedCost: summaryUtmiResult.estimatedCostUSD,
            taxeIAAmount: summaryUtmiResult.taxeIAAmount,
            taxFlags: taxIAFlags
        });

    } catch (error) {
        console.error(`Erreur lors de la génération du résumé professionnel pour la conversation ${id}:`, error);
        if (error.response && error.response.status === 429) {
            res.status(429).json({ error: "Trop de requêtes. Veuillez patienter un instant avant de réessayer." });
        } else {
            const errorMessage = error.response && error.response.status >= 500
                ? "Le service Groq est actuellement indisponible. Veuillez réessayer plus tard."
                : error.message;

            writeLog({
                type: 'CV_GENERATION_FROM_CHAT',
                action: 'GENERATE_SUMMARY',
                status: 'ERROR',
                conversationId: id,
                userId: userId, // Log l'ID utilisateur
                error: `Erreur API Groq: ${errorMessage}`,
                details: error.message
            });
            res.status(500).json({ error: `Échec de la génération du résumé professionnel: ${errorMessage}`, details: error.message });
        }
    }
});


// --- Gestion des erreurs 404 ---
app.use((req, res) => {
    res.status(404).send('Désolé, la page demandée ou l\'API n\'a pas été trouvée.');
});

// --- Server Initialization ---
app.listen(config.port, () => {
  console.log(`\n🚀 Serveur unifié démarré sur http://localhost:${config.port}`);
  console.log(`Accédez à l'interface principale : http://localhost:${config.port}/`);
  console.log(`--- API Endpoints ---`);
  console.log(`  POST /api/generate (Interaction Ponctuelle)`);
  console.log(`  GET /api/dashboard-insights`);
  console.log(`  --- Chatbot Conversationnel ---`);
  console.log(`    POST /api/conversations/new`);
  console.log(`    POST /api/conversations/:id/message`);
  console.log(`    GET /api/conversations (Avec pagination)`);
  console.log(`    GET /api/conversations/:id`);
  console.log(`    DELETE /api/conversations/:id`);
  console.log(`    GET /api/conversations/:id/cv-professional-summary (Résumé CV depuis chat)`);
  console.log(`  --- Générateur de CV depuis Texte ---`);
  console.log(`    POST /api/cv/parse-and-structure`);
  console.log(`    POST /api/cv/render-html`);
  console.log(`    GET /api/cv/last-structured-data`);
  console.log(`    POST /api/valorize-cv`);
  console.log(`Logs enregistrés dans : ${config.logFilePath}`);
  console.log(`Historique des conversations enregistré dans : ${config.conversationsFilePath}`);
  console.log(`Dernier CV structuré enregistré dans : ${config.lastStructuredCvFilePath}`);
});
