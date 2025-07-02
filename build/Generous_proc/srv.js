// serveur.js - Version unifiée et complète avec SCSS, pagination, CVNU, RUM & Trésorerie
const express = require('express');
const Groq = require('groq-sdk');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const sassMiddleware = require('node-sass-middleware');

// Chargement des variables d'environnement depuis le fichier .env
require('dotenv').config();

// --- Configuration des gestionnaires d'erreurs globaux (à maintenir) ---
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});

// Importation des modules de calcul UTMi et des scores de qualité des modèles
const {
    calculateUtmi,
    calculateDashboardInsights,
    COEFFICIENTS,
    updateUtmi,
    calculateCityzenReward,
    calculateActivityScore,
    calculateCurrentUTMAndPIPoints,
    calculateUtmiValueInEUR,
    convertValueToEUR,
    determineInteractionType,
    detectCognitiveAxis,
    determineThematicFocus,
    analyzeTextForSentiment,
    analyzeTextForTermValuation,
    calculateInitialCvValue,      // NOUVEAU
    getCvLevel,                  // NOUVEAU
    calculateMonthlyUniversalIncome, // NOUVEAU
} = require('./server_modules/utms_calculator');
const { MODEL_QUALITY_SCORES } = require('./server_modules/model_quality_config');

// Modules spécifiques au générateur de CV
const { generateStructuredCvData, renderCvHtml } = require('./src/cv_processing');
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
    generalRole: "Un assistant IA expert en développement et en économie numérique, capable de générer des CV, des analyses de marché, et des stratégies d'affiliation. Il est également très doué pour la génération de code, de texte et de médias." // Rôle général mis à jour
  },
  // Fichier pour le stockage des logs (simple, pour démonstration)
  logsFilePath: path.join(__dirname, 'data', 'logs.json'),
  // Fichier pour le stockage des conversations (simple, pour démonstration)
  conversationsFilePath: path.join(__dirname, 'data', 'conversations.json'),
};

// Initialisation de Groq SDK
const groq = new Groq({ apiKey: config.groq.apiKey });

// Initialisation d'Express
const app = express();

// --- Stockage des logs et conversations en mémoire (pour le prototypage) ---
// En production, utiliser une base de données (MongoDB, PostgreSQL, etc.)
let logs = [];
let conversations = {}; // Stocke les conversations par ID
let currentCvStructuredData = null; // Stocke la dernière structure JSON du CV traitée

// Charger les logs et conversations existants au démarrage
const loadData = () => {
    if (fs.existsSync(config.logsFilePath)) {
        try {
            logs = JSON.parse(fs.readFileSync(config.logsFilePath, 'utf8'));
            console.log(`Logs chargés depuis ${config.logsFilePath}`);
        } catch (error) {
            console.error('Erreur de lecture des logs:', error);
            logs = [];
        }
    } else {
        // Créer le répertoire data si inexistant
        fs.mkdirSync(path.dirname(config.logsFilePath), { recursive: true });
        fs.writeFileSync(config.logsFilePath, '[]', 'utf8');
    }

    if (fs.existsSync(config.conversationsFilePath)) {
        try {
            conversations = JSON.parse(fs.readFileSync(config.conversationsFilePath, 'utf8'));
            console.log(`Conversations chargées depuis ${config.conversationsFilePath}`);
        } catch (error) {
            console.error('Erreur de lecture des conversations:', error);
            conversations = {};
        }
    } else {
        fs.mkdirSync(path.dirname(config.conversationsFilePath), { recursive: true });
        fs.writeFileSync(config.conversationsFilePath, '{}', 'utf8');
    }
};
loadData(); // Charger les données au démarrage du serveur

// Sauvegarder les logs et conversations périodiquement (simple pour le prototypage)
const saveData = () => {
    fs.writeFileSync(config.logsFilePath, JSON.stringify(logs, null, 2), 'utf8');
    fs.writeFileSync(config.conversationsFilePath, JSON.stringify(conversations, null, 2), 'utf8');
};
setInterval(saveData, 60 * 1000); // Sauvegarde toutes les minutes

// --- Middlewares ---
app.use(cors());
app.use(express.json()); // Permet à Express de parser les requêtes JSON

// NOUVEAU: Middleware SASS
app.use(
    sassMiddleware({
        src: path.join(__dirname, 'public'),
        dest: path.join(__dirname, 'public'),
        indentedSyntax: false, // false pour .scss, true pour .sass
        outputStyle: 'expanded', // compressed, compact, expanded, nested
        prefix: '/prefix', // Where the output css should live
        debug: true, // Afficher les messages de debug dans la console
    })
);

// Servir les fichiers statiques du dossier 'public'
app.use(express.static(path.join(__dirname, 'public')));


// --- Routes API ---

// Route pour l'accueil (servir index.html)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

/**
 * Gère une interaction IA ponctuelle (sans historique de conversation).
 * Calcule les UTMi et coûts associés, et log l'interaction.
 *
 * @route POST /api/generate
 * @param {string} req.body.prompt - Le texte du prompt de l'utilisateur.
 * @param {string} [req.body.model] - Le modèle d'IA à utiliser (par défaut config.groq.model).
 * @param {string} [req.body.generatedContentType] - Type de contenu généré (ex: 'code', 'media', 'text'). NOUVEAU
 * @returns {object} La réponse de l'IA, les UTMi et les coûts.
 */
app.post('/api/generate', async (req, res) => {
    const { prompt, model, generatedContentType } = req.body; // Récupère generatedContentType
    const selectedModel = model || config.groq.model;

    if (!prompt) {
        return res.status(400).json({ error: 'Le prompt est requis.' });
    }

    const startTime = process.hrtime.bigint(); // Temps de début du traitement
    let aiResponseContent = '';

    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: config.ai.generalRole,
                },
                {
                    role: "user",
                    content: prompt,
                },
            ],
            model: selectedModel,
            temperature: config.groq.temperature,
            max_tokens: config.groq.maxTokens,
        });

        aiResponseContent = chatCompletion.choices[0]?.message?.content || '';

        const endTime = process.hrtime.bigint(); // Temps de fin du traitement
        const processingTimeMs = Number(endTime - startTime) / 1_000_000; // Conversion en millisecondes

        // Calcul des UTMi et coûts
        const utmiResult = calculateUtmi({
            prompt: prompt,
            aiResponse: aiResponseContent,
            model: selectedModel,
            processingTimeMs: processingTimeMs,
            // Simuler des multiplicateurs pour l'exemple
            promptComplexityMultiplier: 1.2,
            impactMultiplier: 1.1,
            relevanceMultiplier: 1.2,
            coherenceMultiplier: 1.1,
            problemSolvingMultiplier: 1.3,
            uniqueConcept: prompt.includes("unique concept"), // Exemple de détection
            creativity: aiResponseContent.includes("créatif"), // Exemple de détection
            detail: aiResponseContent.length > 500, // Exemple de détection
            generatedContentType: generatedContentType // Passe le type de contenu généré pour valorisation
        }, MODEL_QUALITY_SCORES, COEFFICIENTS.EXCHANGE_RATES);

        const newLog = {
            id: uuidv4(),
            timestamp: new Date().toISOString(),
            type: 'one_time_interaction',
            prompt: prompt,
            aiResponse: aiResponseContent,
            model: selectedModel,
            processingTimeMs: processingTimeMs,
            utmiResult: utmiResult, // Stocke les UTMi et coûts dans le log
            generatedContentType: generatedContentType // Log le type de contenu
        };
        logs.push(newLog); // Ajouter le log à la liste en mémoire

        res.json({
            aiResponse: aiResponseContent,
            utmiGenerated: utmiResult.utmi,
            estimatedCostUSD: utmiResult.estimatedCostUSD,
            estimatedCostEUR: utmiResult.estimatedCostEUR,
        });

    } catch (error) {
        console.error('Erreur lors de la génération de la réponse IA:', error);
        res.status(500).json({ error: 'Erreur lors de la génération de la réponse IA.', details: error.message });
    }
});


/**
 * Récupère les insights du tableau de bord basés sur tous les logs.
 *
 * @route GET /api/dashboard-insights
 * @returns {object} Les données agrégées pour le tableau de bord.
 */
app.get('/api/dashboard-insights', (req, res) => {
    // Simuler le contexte économique (pourrait venir d'une source externe réelle)
    const economicContext = {
        gdpGrowthRate: 0.03, // Exemple 3%
        inflationRate: 0.02, // Exemple 2%
    };

    // Passez currentCvStructuredData à calculateDashboardInsights
    const insights = calculateDashboardInsights(logs, 'EUR', economicContext, currentCvStructuredData);
    res.json(insights);
});


// --- Chatbot Conversationnel (à maintenir) ---
// Liste des conversations avec un ID unique pour chaque
// Chaque conversation contient un tableau de messages

/**
 * Initialise une nouvelle conversation de chat.
 * @route POST /api/conversations/new
 */
app.post('/api/conversations/new', (req, res) => {
    const newConversationId = uuidv4();
    conversations[newConversationId] = {
        id: newConversationId,
        createdAt: new Date().toISOString(),
        messages: [{ role: "system", content: config.ai.generalRole }], // Message système initial
        title: "Nouvelle conversation", // Titre par défaut
    };
    saveData(); // Sauvegarder la nouvelle conversation
    res.status(201).json({ conversationId: newConversationId, conversation: conversations[newConversationId] });
});

/**
 * Envoie un message à une conversation existante.
 * @route POST /api/conversations/:id/message
 * @param {string} req.params.id - L'ID de la conversation.
 * @param {string} req.body.message - Le message de l'utilisateur.
 * @param {string} [req.body.model] - Le modèle d'IA à utiliser.
 * @param {string} [req.body.generatedContentType] - Type de contenu généré (ex: 'code', 'media', 'text'). NOUVEAU
 * @returns {object} La réponse de l'IA et la conversation mise à jour.
 */
app.post('/api/conversations/:id/message', async (req, res) => {
    const conversationId = req.params.id;
    const { message, model, generatedContentType } = req.body; // Récupère generatedContentType
    const selectedModel = model || config.groq.model;

    if (!message) {
        return res.status(400).json({ error: 'Le message est requis.' });
    }

    const conversation = conversations[conversationId];
    if (!conversation) {
        return res.status(404).json({ error: 'Conversation non trouvée.' });
    }

    conversation.messages.push({ role: "user", content: message });

    const startTime = process.hrtime.bigint(); // Temps de début du traitement
    let aiResponseContent = '';

    try {
        // Préparer les messages pour l'API Groq (inclure le message système initial)
        const messagesForGroq = conversation.messages;

        const chatCompletion = await groq.chat.completions.create({
            messages: messagesForGroq,
            model: selectedModel,
            temperature: config.groq.temperature,
            max_tokens: config.groq.maxTokens,
        });

        aiResponseContent = chatCompletion.choices[0]?.message?.content || '';
        conversation.messages.push({ role: "assistant", content: aiResponseContent });

        const endTime = process.hrtime.bigint(); // Temps de fin du traitement
        const processingTimeMs = Number(endTime - startTime) / 1_000_000; // Conversion en millisecondes

        // Calcul des UTMi et coûts pour cette interaction spécifique
        const utmiResult = calculateUtmi({
            prompt: message, // Le prompt est le message utilisateur
            aiResponse: aiResponseContent,
            model: selectedModel,
            processingTimeMs: processingTimeMs,
            promptComplexityMultiplier: 1.2, // Exemple
            impactMultiplier: 1.1, // Exemple
            relevanceMultiplier: 1.2, // Exemple
            coherenceMultiplier: 1.1, // Exemple
            problemSolvingMultiplier: 1.3, // Exemple
            uniqueConcept: message.includes("nouvelle idée"), // Exemple de détection
            creativity: aiResponseContent.includes("créatif"), // Exemple de détection
            detail: aiResponseContent.length > 500, // Exemple de détection
            generatedContentType: generatedContentType // Passe le type de contenu généré pour valorisation
        }, MODEL_QUALITY_SCORES, COEFFICIENTS.EXCHANGE_RATES);

        const newLog = {
            id: uuidv4(),
            timestamp: new Date().toISOString(),
            type: 'conversation_interaction',
            conversationId: conversationId,
            prompt: message,
            aiResponse: aiResponseContent,
            model: selectedModel,
            processingTimeMs: processingTimeMs,
            utmiResult: utmiResult,
            generatedContentType: generatedContentType
        };
        logs.push(newLog);

        saveData(); // Sauvegarder les conversations et les logs

        res.json({
            aiResponse: aiResponseContent,
            conversation: conversation,
            utmiGenerated: utmiResult.utmi,
            estimatedCostUSD: utmiResult.estimatedCostUSD,
            estimatedCostEUR: utmiResult.estimatedCostEUR,
        });

    } catch (error) {
        console.error('Erreur lors de la génération de la réponse IA pour la conversation:', error);
        res.status(500).json({ error: 'Erreur lors de la génération de la réponse IA.', details: error.message });
    }
});

/**
 * Récupère toutes les conversations avec pagination.
 * @route GET /api/conversations
 * @param {number} [req.query.page=1] - Le numéro de la page.
 * @param {number} [req.query.limit=10] - Le nombre de conversations par page.
 * @returns {object} Un tableau des conversations paginées et le total.
 */
app.get('/api/conversations', (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    const allConversationsArray = Object.values(conversations).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const paginatedConversations = allConversationsArray.slice(startIndex, endIndex);

    res.json({
        totalCount: allConversationsArray.length,
        currentPage: page,
        totalPages: Math.ceil(allConversationsArray.length / limit),
        conversations: paginatedConversations,
    });
});

/**
 * Récupère une conversation spécifique par ID.
 * @route GET /api/conversations/:id
 * @param {string} req.params.id - L'ID de la conversation.
 * @returns {object} La conversation.
 */
app.get('/api/conversations/:id', (req, res) => {
    const conversationId = req.params.id;
    const conversation = conversations[conversationId];
    if (conversation) {
        res.json(conversation);
    } else {
        res.status(404).json({ message: 'Conversation non trouvée.' });
    }
});

/**
 * Supprime une conversation spécifique par ID.
 * @route DELETE /api/conversations/:id
 * @param {string} req.params.id - L'ID de la conversation à supprimer.
 * @returns {object} Un message de succès.
 */
app.delete('/api/conversations/:id', (req, res) => {
    const conversationId = req.params.id;
    if (conversations[conversationId]) {
        delete conversations[conversationId];
        // Supprimer également les logs associés à cette conversation
        logs = logs.filter(log => !(log.type === 'conversation_interaction' && log.conversationId === conversationId));
        saveData();
        res.json({ message: `Conversation ${conversationId} supprimée avec succès.` });
    } else {
        res.status(404).json({ message: 'Conversation non trouvée.' });
    }
});

/**
 * Récupère un résumé professionnel du CV à partir d'une conversation.
 * @route GET /api/conversations/:id/cv-professional-summary
 * @param {string} req.params.id - L'ID de la conversation.
 * @returns {object} Le résumé professionnel généré.
 */
app.get('/api/conversations/:id/cv-professional-summary', async (req, res) => {
    const conversationId = req.params.id;
    const conversation = conversations[conversationId];

    if (!conversation) {
        return res.status(404).json({ message: 'Conversation non trouvée.' });
    }

    try {
        const professionalSummary = await generateProfessionalSummary(conversation.messages);
        res.json({ summary: professionalSummary });
    } catch (error) {
        console.error('Erreur lors de la génération du résumé professionnel:', error);
        res.status(500).json({ error: 'Erreur lors de la génération du résumé professionnel.', details: error.message });
    }
});

// --- Générateur de CV depuis Texte (à compléter selon cv_processing.js) ---

/**
 * Parse et structure un CV à partir d'un texte brut ou JSON.
 * Met à jour la variable globale currentCvStructuredData.
 * @route POST /api/cv/parse-and-structure
 * @param {string} req.body.cvContent - Le contenu du CV (texte brut ou JSON).
 * @returns {object} La structure JSON du CV.
 */
app.post('/api/cv/parse-and-structure', async (req, res) => {
    const { cvContent } = req.body;
    if (!cvContent) {
        return res.status(400).json({ error: 'Le contenu du CV est requis.' });
    }
    try {
        const structuredData = await generateStructuredCvData(cvContent); // Assumer que cela prend le texte et retourne la structure
        currentCvStructuredData = structuredData; // Met à jour la variable globale
        res.json(structuredData);
    } catch (error) {
        console.error('Erreur lors du parsing et de la structuration du CV:', error);
        res.status(500).json({ error: 'Erreur lors du parsing et de la structuration du CV.', details: error.message });
    }
});

/**
 * Rend le HTML d'un CV structuré.
 * @route POST /api/cv/render-html
 * @param {object} req.body.structuredData - La structure JSON du CV.
 * @returns {string} Le HTML généré pour le CV.
 */
app.post('/api/cv/render-html', async (req, res) => {
    const { structuredData } = req.body;
    if (!structuredData) {
        return res.status(400).json({ error: 'Les données structurées du CV sont requises.' });
    }
    try {
        const htmlContent = await renderCvHtml(structuredData); // Assumer que cela prend la structure et retourne le HTML
        res.send(htmlContent);
    } catch (error) {
        console.error('Erreur lors du rendu HTML du CV:', error);
        res.status(500).json({ error: 'Erreur lors du rendu HTML du CV.', details: error.message });
    }
});

/**
 * Récupère la dernière donnée de CV structurée en mémoire.
 * @route GET /api/cv/last-structured-data
 * @returns {object} La dernière structure JSON du CV.
 */
app.get('/api/cv/last-structured-data', (req, res) => {
    if (currentCvStructuredData) {
        res.json(currentCvStructuredData);
    } else {
        res.status(404).json({ message: 'Aucune donnée de CV structurée n\'est disponible pour le moment.' });
    }
});

/**
 * Calcule la valeur initiale du CVNU et le niveau du CV.
 * @route POST /api/cv/calculate-value
 * @param {object} [req.body.cvStructuredData] - Les données structurées du CV (si non déjà définies globalement).
 * @returns {object} La valeur initiale du CV, le niveau du CV, et le revenu universel mensuel estimé.
 */
app.post('/api/cv/calculate-value', (req, res) => {
    const cvToAnalyze = req.body.cvStructuredData || currentCvStructuredData;

    if (!cvToAnalyze) {
        return res.status(400).json({ error: 'Des données structurées de CV sont requises pour le calcul de valeur.' });
    }

    try {
        const cvValue = calculateInitialCvValue(cvToAnalyze);
        const cvLevelData = getCvLevel(cvValue);
        const monthlyUniversalIncome = calculateMonthlyUniversalIncome(cvValue, cvLevelData);

        res.json({
            initialCvValue: parseFloat(cvValue.toFixed(2)),
            cvLevel: cvLevelData,
            estimatedMonthlyUniversalIncomeEUR: parseFloat(monthlyUniversalIncome.toFixed(2))
        });
    } catch (error) {
        console.error('Erreur lors du calcul de la valeur du CV:', error);
        res.status(500).json({ error: 'Erreur lors du calcul de la valeur du CV.', details: error.message });
    }
});


// --- Gestion des erreurs 404 (doit être la dernière route) ---
app.use((req, res) => {
    res.status(404).send('Désolé, la page demandée ou l\'API n\'a pas été trouvée.');
});

// --- Server Initialization ---
app.listen(config.port, () => {
    console.log(`\n🚀 Serveur unifié démarré sur http://localhost:${config.port}`);
    console.log(`Accédez à l'interface principale : http://localhost:${config.port}/`);
    console.log(`--- API Endpoints ---`);
    console.log(`  POST /api/generate (Interaction Ponctuelle - Valorisation Granulaire)`);
    console.log(`  GET /api/dashboard-insights`);
    console.log(`  --- Chatbot Conversationnel ---`);
    console.log(`    POST /api/conversations/new`);
    console.log(`    POST /api/conversations/:id/message (Valorisation Granulaire)`);
    console.log(`    GET /api/conversations (Avec pagination)`);
    console.log(`    GET /api/conversations/:id`);
    console.log(`    DELETE /api/conversations/:id`);
    console.log(`    GET /api/conversations/:id/cv-professional-summary (Résumé CV depuis chat)`);
    console.log(`  --- Générateur de CV depuis Texte ---`);
    console.log(`    POST /api/cv/parse-and-structure`);
    console.log(`    POST /api/cv/render-html`);
    console.log(`    GET /api/cv/last-structured-data`);
    console.log(`    POST /api/cv/calculate-value (NOUVEAU - Calcul de la valeur du CVNU)`);
    console.log(`  --- Note sur la Trésorerie ---`);
    console.log(`    La gestion de trésorerie est reflétée dans /api/dashboard-insights (monthlyUniversalIncomeEUR & treasuryBalanceEUR).`);
    console.log(`    Pour un système réel, un module de gestion de trésorerie autonome serait envisagé.`);
});