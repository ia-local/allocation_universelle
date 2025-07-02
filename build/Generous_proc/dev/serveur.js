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
    convertValueToEUR,
    determineInteractionType,
    detectCognitiveAxis,
    determineThematicFocus,
    analyzeTextForSentiment,
    analyzeTextForTermValuation,
    calculateInitialCvValue,
    getCvLevel,
    calculateMonthlyUniversalIncome,
    userLogs, // Importation des logs pour l'accès direct
    lastStructuredCvData, // Importation pour la persistance du CV structuré
} = require('./server_modules/utms_calculator');

// Configuration de Groq SDK
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

const app = express();
const config = {
    port: process.env.PORT || 3000,
    logsFile: path.join(__dirname, 'data', 'interactions.json'),
    conversationsDir: path.join(__dirname, 'data', 'conversations'),
    structuredCvFile: path.join(__dirname, 'data', 'structured_cv.json') // Fichier pour persister le CV structuré
};

// Créer le dossier 'data' si non existant
if (!fs.existsSync(path.join(__dirname, 'data'))) {
    fs.mkdirSync(path.join(__dirname, 'data'));
}
// Créer le dossier 'conversations' si non existant
if (!fs.existsSync(config.conversationsDir)) {
    fs.mkdirSync(config.conversationsDir);
}

// Middleware pour analyser le corps des requêtes en JSON
app.use(express.json());
// Middleware CORS pour permettre les requêtes depuis le frontend
app.use(cors());

// Middleware SASS pour compiler les fichiers .scss en .css
app.use(
    sassMiddleware({
        src: path.join(__dirname, 'public'),
        dest: path.join(__dirname, 'public'),
        indentedSyntax: false, // true for .sass, false for .scss
        outputStyle: 'compressed', // 'compressed' pour la production, 'expanded' pour le développement
        prefix: '/', // Où le serveur servira les fichiers CSS compilés
    })
);

// Servir les fichiers statiques (HTML, CSS, JS)
app.use(express.static('public'));

// --- Fonctions de persistance des données (simulées avec des fichiers locaux) ---

// Sauvegarde des logs d'interactions (pour le dashboard)
function saveLogs() {
    fs.writeFileSync(config.logsFile, JSON.stringify(userLogs, null, 2), 'utf8');
}

// Charger les logs au démarrage
function loadLogs() {
    if (fs.existsSync(config.logsFile)) {
        const data = fs.readFileSync(config.logsFile, 'utf8');
        userLogs.splice(0, userLogs.length, ...JSON.parse(data)); // Vider et recharger
    }
}

// Sauvegarde du CV structuré
function saveStructuredCv(cvData) {
    fs.writeFileSync(config.structuredCvFile, JSON.stringify(cvData, null, 2), 'utf8');
    // Mettre à jour la variable globale si nécessaire, bien que lastStructuredCvData soit déjà mise à jour
}

// Charger le CV structuré
function loadStructuredCv() {
    if (fs.existsSync(config.structuredCvFile)) {
        const data = fs.readFileSync(config.structuredCvFile, 'utf8');
        return JSON.parse(data);
    }
    return null;
}

// Charger les conversations individuelles
function loadConversation(id) {
    const filePath = path.join(config.conversationsDir, `${id}.json`);
    if (fs.existsSync(filePath)) {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
    return null;
}

// Sauvegarder une conversation individuelle
function saveConversation(conversation) {
    const filePath = path.join(config.conversationsDir, `${conversation.id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(conversation, null, 2), 'utf8');
}

// Charger toutes les conversations pour l'affichage paginé
function loadAllConversations() {
    const conversationFiles = fs.readdirSync(config.conversationsDir);
    const conversations = conversationFiles
        .filter(file => file.endsWith('.json'))
        .map(file => JSON.parse(fs.readFileSync(path.join(config.conversationsDir, file), 'utf8')))
        .sort((a, b) => new Date(b.lastUpdate) - new Date(a.lastUpdate)); // Trier par dernière mise à jour
    return conversations;
}

// --- Chargement initial des données ---
loadLogs();


// --- Routes API ---

/**
 * POST /api/generate
 * Gère les interactions ponctuelles de génération de texte et calcule les UTMi.
 */
app.post('/api/generate', async (req, res) => {
    const { prompt } = req.body;
    const userId = req.headers['x-user-id'] || 'anonymous_user'; // Récupère l'ID utilisateur
    const model = 'gemma2-9b-it'; // Modèle IA utilisé pour cette interaction

    if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
    }

    try {
        const startTime = process.hrtime.bigint(); // Début du chrono

        const chatCompletion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: model,
            temperature: 0.7,
            max_tokens: 1024,
        });

        const responseContent = chatCompletion.choices[0]?.message?.content || "No response generated.";
        const endTime = process.hrtime.bigint(); // Fin du chrono
        const durationMs = Number(endTime - startTime) / 1_000_000; // Convertir en millisecondes

        // Calcul des UTMi et des coûts sans les déduire du front-end
        const utmiResult = calculateUtmi({
            prompt: prompt,
            response: responseContent,
            durationMs: durationMs,
            modelUsed: model,
            customInputType: 'text', // Par défaut 'text', peut être 'code', 'image', etc.
            outputLength: responseContent.length
        });

        // Enregistrer le log et mettre à jour la trésorerie de la plateforme
        updateUtmi(userId, utmiResult, prompt, responseContent, model, durationMs);
        saveLogs(); // Persister les logs

        res.json({
            response: responseContent,
            utmi: utmiResult.utmi,
            cost: utmiResult.estimatedCostEUR,
            piPoints: utmiResult.piPoints,
            duration: durationMs
        });

    } catch (error) {
        console.error('Error generating AI response or calculating UTMi:', error);
        res.status(500).json({ error: 'Failed to generate AI response or calculate UTMi.', details: error.message });
    }
});

/**
 * GET /api/dashboard-insights
 * Fournit les données agrégées pour le tableau de bord.
 */
app.get('/api/dashboard-insights', (req, res) => {
    try {
        const insights = calculateDashboardInsights();
        res.json(insights);
    } catch (error) {
        console.error('Error calculating dashboard insights:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard insights.', details: error.message });
    }
});

// --- Routes pour le Chatbot Conversationnel ---

/**
 * POST /api/conversations/new
 * Crée une nouvelle conversation.
 */
app.post('/api/conversations/new', (req, res) => {
    try {
        const conversationId = uuidv4();
        const newConversation = {
            id: conversationId,
            title: "Nouvelle conversation",
            messages: [],
            createdAt: new Date().toISOString(),
            lastUpdate: new Date().toISOString()
        };
        saveConversation(newConversation);
        res.status(201).json({ conversationId: conversationId });
    } catch (error) {
        console.error('Error creating new conversation:', error);
        res.status(500).json({ error: 'Failed to create new conversation.', details: error.message });
    }
});

/**
 * GET /api/conversations
 * Récupère toutes les conversations avec pagination.
 */
app.get('/api/conversations', (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;

        const allConversations = loadAllConversations();
        const totalCount = allConversations.length;
        const totalPages = Math.ceil(totalCount / limit);

        // Pour ce prototype, nous simplifions la pagination côté serveur
        // En renvoyant toutes les conversations si nécessaire, ou une logique simple
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        const paginatedConversations = allConversations.slice(startIndex, endIndex);

        res.json({
            conversations: paginatedConversations,
            totalCount: totalCount,
            totalPages: totalPages,
            currentPage: page
        });
    } catch (error) {
        console.error('Error fetching conversations:', error);
        res.status(500).json({ error: 'Failed to fetch conversations.', details: error.message });
    }
});

/**
 * GET /api/conversations/:id
 * Récupère une conversation spécifique.
 */
app.get('/api/conversations/:id', (req, res) => {
    try {
        const conversationId = req.params.id;
        const conversation = loadConversation(conversationId);
        if (!conversation) {
            return res.status(404).json({ error: 'Conversation not found.' });
        }
        res.json(conversation);
    } catch (error) {
        console.error('Error fetching conversation:', error);
        res.status(500).json({ error: 'Failed to fetch conversation.', details: error.message });
    }
});

/**
 * POST /api/conversations/:id/message
 * Ajoute un message à une conversation existante et génère une réponse IA valorisée.
 */
app.post('/api/conversations/:id/message', async (req, res) => {
    const conversationId = req.params.id;
    const { message } = req.body;
    const userId = req.headers['x-user-id'] || 'anonymous_user';
    const model = 'gemma2-9b-it'; // Modèle IA pour le chat

    if (!message) {
        return res.status(400).json({ error: 'Message is required.' });
    }

    let conversation = loadConversation(conversationId);
    if (!conversation) {
        return res.status(404).json({ error: 'Conversation not found.' });
    }

    // Ajouter le message de l'utilisateur
    conversation.messages.push({ sender: 'user', content: message, timestamp: new Date().toISOString() });

    try {
        const startTime = process.hrtime.bigint();

        // Préparer les messages pour l'API Groq (historique limité pour éviter trop de tokens)
        const groqMessages = conversation.messages.slice(-10).map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'assistant',
            content: msg.content
        }));

        const chatCompletion = await groq.chat.completions.create({
            messages: groqMessages,
            model: model,
            temperature: 0.7,
            max_tokens: 1024,
        });

        const aiResponseContent = chatCompletion.choices[0]?.message?.content || "No response generated.";
        const endTime = process.hrtime.bigint();
        const durationMs = Number(endTime - startTime) / 1_000_000;

        // Calcul des UTMi pour la réponse IA
        const utmiResult = calculateUtmi({
            prompt: message,
            response: aiResponseContent,
            durationMs: durationMs,
            modelUsed: model,
            customInputType: 'text',
            outputLength: aiResponseContent.length
        });

        // Ajouter la réponse de l'IA à la conversation
        conversation.messages.push({ sender: 'ai', content: aiResponseContent, timestamp: new Date().toISOString(), utmi: utmiResult.utmi, cost: utmiResult.estimatedCostEUR });
        conversation.lastUpdate = new Date().toISOString();

        // Enregistrer le log d'interaction (y compris pour le chat)
        updateUtmi(userId, utmiResult, message, aiResponseContent, model, durationMs);
        saveLogs(); // Persister les logs
        saveConversation(conversation); // Persister la conversation

        res.json({ response: aiResponseContent, utmi: utmiResult.utmi, cost: utmiResult.estimatedCostEUR });

    } catch (error) {
        console.error('Error sending message or generating AI response:', error);
        res.status(500).json({ error: 'Failed to send message or get AI response.', details: error.message });
    }
});

/**
 * DELETE /api/conversations/:id
 * Supprime une conversation.
 */
app.delete('/api/conversations/:id', (req, res) => {
    try {
        const conversationId = req.params.id;
        const filePath = path.join(config.conversationsDir, `${conversationId}.json`);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            res.status(200).json({ message: 'Conversation deleted successfully.' });
        } else {
            res.status(404).json({ error: 'Conversation not found.' });
        }
    } catch (error) {
        console.error('Error deleting conversation:', error);
        res.status(500).json({ error: 'Failed to delete conversation.', details: error.message });
    }
});

// --- Routes pour le Générateur de CV ---

/**
 * POST /api/cv/parse-and-structure
 * Analyse un CV texte et le structure en JSON.
 */
app.post('/api/cv/parse-and-structure', async (req, res) => {
    const { cvText } = req.body;
    const model = 'gemma2-9b-it';

    if (!cvText) {
        return res.status(400).json({ error: 'CV text is required.' });
    }

    try {
        const prompt = `Convert the following CV text into a structured JSON format, including sections like "personal_info", "contact_info", "summary", "experience", "education", "skills", "languages", "certifications", "projects". Ensure all dates are parsed correctly. CV text:\n\n${cvText}`;

        const chatCompletion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: model,
            temperature: 0.2, // Température basse pour une sortie structurée
            max_tokens: 2048,
            response_format: { type: "json_object" } // Demande une réponse JSON
        });

        const jsonString = chatCompletion.choices[0]?.message?.content;
        let structuredCv;
        try {
            structuredCv = JSON.parse(jsonString);
        } catch (parseError) {
            console.error('Failed to parse AI response as JSON:', parseError);
            // Tenter d'extraire le JSON si l'IA a mis du texte autour
            const jsonMatch = jsonString.match(/```json\n([\s\S]*?)\n```/);
            if (jsonMatch && jsonMatch[1]) {
                structuredCv = JSON.parse(jsonMatch[1]);
            } else {
                throw new Error('AI response was not a valid JSON object.');
            }
        }

        // Sauvegarder la dernière version structurée du CV
        fs.writeFileSync(config.structuredCvFile, JSON.stringify(structuredCv, null, 2), 'utf8');
        // Mettre à jour la variable lastStructuredCvData dans utms_calculator
        // Cela est géré par l'importation de lastStructuredCvData, mais il faut s'assurer que utms_calculator l'expose en tant que mutable
        // Pour une approche propre, utms_calculator pourrait avoir une fonction pour mettre à jour ses données internes.
        // Pour l'instant, on se base sur la sauvegarde dans le fichier.

        res.json({ structuredCv: structuredCv });

    } catch (error) {
        console.error('Error parsing and structuring CV:', error);
        res.status(500).json({ error: 'Failed to parse and structure CV.', details: error.message });
    }
});

/**
 * GET /api/cv/last-structured-data
 * Récupère la dernière version structurée du CV sauvegardée.
 */
app.get('/api/cv/last-structured-data', (req, res) => {
    try {
        const data = loadStructuredCv();
        if (!data) {
            return res.status(404).json({ error: 'No structured CV data found.' });
        }
        res.json({ structuredCv: data });
    } catch (error) {
        console.error('Error fetching last structured CV data:', error);
        res.status(500).json({ error: 'Failed to retrieve last structured CV data.', details: error.message });
    }
});


/**
 * POST /api/cv/render-html
 * Rend le CV structuré en HTML.
 * Une implémentation simple est faite ici, un moteur de template serait mieux pour des CV complexes.
 */
app.post('/api/cv/render-html', async (req, res) => {
    const { structuredCv } = req.body;
    const model = 'gemma2-9b-it';

    if (!structuredCv) {
        return res.status(400).json({ error: 'Structured CV data is required.' });
    }

    try {
        // Demander à l'IA de générer un HTML propre à partir du JSON
        const prompt = `Generate a professional and clean HTML representation of the following CV data (only the body content inside <body> tags, no html, head, or body tags themselves, just the content). Use semantic HTML5. Make sure to include basic inline styles for readability (e.g., margins, font sizes) but focus on structure. JSON CV data:\n\n${JSON.stringify(structuredCv, null, 2)}`;

        const chatCompletion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: model,
            temperature: 0.5,
            max_tokens: 2048,
        });

        const htmlContent = chatCompletion.choices[0]?.message?.content || "<p>Failed to generate HTML.</p>";

        res.json({ html: htmlContent });

    } catch (error) {
        console.error('Error rendering CV to HTML:', error);
        res.status(500).json({ error: 'Failed to render CV to HTML.', details: error.message });
    }
});

/**
 * POST /api/cv/calculate-value
 * Calcule la valeur du CVNU et son niveau.
 */
app.post('/api/cv/calculate-value', (req, res) => {
    try {
        const cvValueScore = calculateInitialCvValue(); // Utilise la logique de utms_calculator
        const cvLevelData = getCvLevel(cvValueScore);
        const totalPiPoints = calculateCurrentUTMAndPIPoints().piPointsBalance;

        res.json({
            cvValueScore: cvValueScore,
            cvLevel: cvLevelData.level,
            totalPiPoints: totalPiPoints
        });
    } catch (error) {
        console.error('Error calculating CV value:', error);
        res.status(500).json({ error: 'Failed to calculate CV value.', details: error.message });
    }
});


// Route pour servir la page d'index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- Démarrage du serveur ---
app.listen(config.port, () => {
    console.log(`Serveur démarré sur http://localhost:${config.port}`);
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
    console.log(`  --- Générateur de CV depuis Texte ---`);
    console.log(`    POST /api/cv/parse-and-structure`);
    console.log(`    POST /api/cv/render-html`);
    console.log(`    GET /api/cv/last-structured-data`);
    console.log(`    POST /api/cv/calculate-value (Calcul de la valeur du CVNU)`);
    console.log(`  --- Note sur la Trésorerie ---`);
    console.log(`    La gestion de trésorerie est interne au serveur et s'ajuste avec les interactions.`);
    console.log(`    Elle est visible via l'insight du tableau de bord.`);
});