// server.js
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const multer = require('multer');
const Groq = require('groq-sdk');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

// Charger les variables d'environnement depuis le fichier .env
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// --- Configuration Serveur et IA ---
let config = {
  port: process.env.PORT || 3000,
  groq: {
    apiKey: process.env.GROQ_API_KEY,
    model: 'llama3-8b-8192', // Modèle par défaut au démarrage
    temperature: 0.7,
    maxTokens: 2048,
  },
  ai: {
    role: "Un assistant IA expert en développement et en conseil technique.",
    context: "Fournir des réponses précises, concises et utiles sur des sujets de programmation, d'architecture logicielle et de technologies web. Votre logique métier est d'être un conseiller technique fiable.",
  },
  logFilePath: path.join(__dirname, 'logs.json')
};

// Validation de la clé API Groq
if (!config.groq.apiKey) {
    console.error("ERREUR: La clé API Groq (GROQ_API_KEY) n'est pas définie dans votre fichier .env.");
    console.error("Veuillez créer un fichier .env à la racine de votre projet avec GROQ_API_KEY=YOUR_API_KEY_HERE");
    process.exit(1); // Arrête le processus si la clé API est manquante
} else {
    console.log("Clé API Groq chargée: Oui");
}

const groq = new Groq({ apiKey: config.groq.apiKey });

// --- Middlewares ---
app.use(cors()); // Active CORS pour toutes les requêtes
app.use(express.json()); // Pour parser les requêtes JSON (préféré à bodyParser.json() avec Express 4.16+)
app.use(bodyParser.urlencoded({ extended: true })); // Pour parser les requêtes URL-encoded

// --- SERVIR LES FICHIERS STATIQUES EN PREMIER ---
// C'est CRUCIAL. Tous les fichiers dans 'public' (HTML, CSS, JS, images, etc.) seront servis depuis ce dossier.
// Cette ligne DOIT être placée avant toutes les routes API et le fallback.
app.use(express.static(path.join(__dirname, 'public')));

// Configuration de Multer pour l'upload de fichiers (CV)
const upload = multer({ dest: 'uploads/' }); // Les fichiers seront stockés temporairement ici

// --- Système de Logs ---
const logs = []; // Stockage temporaire en mémoire
const INTERACTIONS_LOG_FILE = path.join(__dirname, 'logs.json'); // Utilisation de config.logFilePath
if (fs.existsSync(INTERACTIONS_LOG_FILE)) {
    try {
        const fileContent = fs.readFileSync(INTERACTIONS_LOG_FILE, 'utf8');
        if (fileContent) {
            logs.push(...JSON.parse(fileContent));
        }
    } catch (e) {
        console.error("Erreur de lecture ou de parsing du fichier de logs:", e);
    }
}

function saveLogs() {
    fs.writeFile(INTERACTIONS_LOG_FILE, JSON.stringify(logs, null, 2), (err) => {
        if (err) console.error("Erreur lors de l'écriture des logs:", err);
    });
}

// --- Système de Conversations (Chat) ---
let conversations = {};
const CONVERSATIONS_FILE = path.join(__dirname, 'conversations.json');
if (fs.existsSync(CONVERSATIONS_FILE)) {
    try {
        const fileContent = fs.readFileSync(CONVERSATIONS_FILE, 'utf8');
        if (fileContent) {
            conversations = JSON.parse(fileContent);
            console.log(`[Server] ${Object.keys(conversations).length} conversations chargées depuis le fichier.`);
        }
    } catch (e) {
        console.error("[Server] Erreur de lecture ou de parsing du fichier de conversations:", e);
    }
}

function saveConversations() {
    fs.writeFile(CONVERSATIONS_FILE, JSON.stringify(conversations, null, 2), (err) => {
        if (err) console.error("Erreur lors de l'écriture des conversations:", err);
    });
}

// --- Routes API ---

// Route pour l'accueil (gestion du prompt initial)
// Harmonisé avec frontend: /api/home/prompt
app.post('/api/home/prompt', async (req, res) => {
    const { prompt } = req.body;
    console.log(`➡️ Requête AI reçue pour le prompt (Accueil): "${prompt.substring(0, 50)}..."`);

    if (!prompt) {
        return res.status(400).json({ error: 'Le prompt est requis.' });
    }

    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: config.ai.role },
                { role: 'user', content: prompt },
            ],
            model: config.groq.model,
            temperature: config.groq.temperature,
            max_tokens: config.groq.maxTokens,
        });

        const aiResponse = chatCompletion.choices[0]?.message?.content || "Désolé, je n'ai pas pu générer de réponse.";
        
        logs.push({
            id: uuidv4(),
            timestamp: new Date().toISOString(),
            type: 'home_interaction',
            prompt: prompt,
            response: aiResponse
        });
        saveLogs();

        console.log('✅ Réponse de l\'IA générée et interaction stockée avec succès (Accueil).');
        res.json({ response: aiResponse });

    } catch (error) {
        console.error("Erreur lors de la génération de l'IA (Accueil):", error);
        res.status(500).json({ error: `Erreur interne du serveur: ${error.message}` });
    }
});


// Routes pour le Chat (Conversations)
app.get('/api/conversations', (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;

    const allConvArray = Object.values(conversations).sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedConversations = allConvArray.slice(startIndex, endIndex);

    res.json({
        conversations: paginatedConversations.map(conv => ({
            _id: conv.id, // Utiliser 'id' au lieu de '_id' si c'est ce que votre frontend attend
            title: conv.title,
            updatedAt: conv.updatedAt,
        })),
        currentPage: page,
        totalPages: Math.ceil(allConvArray.length / limit),
        totalConversations: allConvArray.length
    });
});

app.get('/api/conversations/:id', (req, res) => {
    const { id } = req.params;
    const conversation = conversations[id];
    if (conversation) {
        res.json({ conversation });
    } else {
        res.status(404).json({ error: 'Conversation non trouvée.' });
    }
});

app.post('/api/conversations', async (req, res) => {
    let { conversationId, message } = req.body;

    if (!message) {
        return res.status(400).json({ error: 'Le message est requis.' });
    }

    let currentConversation;
    if (conversationId && conversations[conversationId]) {
        currentConversation = conversations[conversationId];
    } else {
        conversationId = uuidv4();
        currentConversation = {
            id: conversationId,
            title: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
            messages: [],
            createdAt: new Date().toISOString(),
        };
        conversations[conversationId] = currentConversation;
        console.log(`[Server] Nouvelle conversation créée: ${conversationId}`);
    }

    currentConversation.messages.push({ role: 'user', content: message, timestamp: new Date().toISOString() });
    currentConversation.updatedAt = new Date().toISOString();

    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: config.ai.context },
                ...currentConversation.messages.map(msg => ({ role: msg.role, content: msg.content }))
            ],
            model: config.groq.model,
            temperature: config.groq.temperature,
            max_tokens: config.groq.maxTokens,
        });

        const aiResponse = chatCompletion.choices[0]?.message?.content || "Désolé, je n'ai pas pu générer de réponse.";
        currentConversation.messages.push({ role: 'assistant', content: aiResponse, timestamp: new Date().toISOString() });
        currentConversation.updatedAt = new Date().toISOString();

        saveConversations();
        
        logs.push({
            id: uuidv4(),
            timestamp: new Date().toISOString(),
            type: 'chat_interaction',
            conversationId: conversationId,
            userMessage: message,
            aiResponse: aiResponse
        });
        saveLogs();

        res.json({
            conversationId: conversationId,
            conversation: currentConversation,
            aiResponse: aiResponse
        });

    } catch (error) {
        console.error("Erreur lors de la génération de la réponse du chat IA:", error);
        res.status(500).json({ error: `Erreur interne du serveur lors du chat: ${error.message}` });
    }
});


// Routes pour le Générateur de CV
app.get('/api/cv', async (req, res) => {
    console.log('[API] Requête GET /api/cv reçue.');
    try {
        res.status(200).json({
            message: "Pas de CV trouvé. Veuillez en générer un ou en uploader un.",
            cvData: {}
        });
    } catch (error) {
        console.error('Erreur lors de la récupération du CV:', error);
        res.status(500).json({ error: 'Erreur serveur lors de la récupération du CV.' });
    }
});

app.post('/api/cv/generate', async (req, res) => {
    const { prompt } = req.body;
    console.log(`➡️ Requête de génération de CV reçue pour le prompt: "${prompt.substring(0, 50)}..."`);

    if (!prompt) {
        return res.status(400).json({ error: 'Le prompt est requis pour générer le CV.' });
    }

    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: "Vous êtes un générateur de CV expert. Créez un CV structuré et professionnel basé sur le prompt fourni. Le CV doit être un objet JSON avec des sections comme 'informationsPersonnelles', 'experienceProfessionnelle', 'education', 'competences'. Fournissez uniquement le JSON du CV." },
                { role: 'user', content: prompt },
            ],
            model: config.groq.model,
            temperature: config.groq.temperature,
            max_tokens: config.groq.maxTokens,
            response_format: { type: "json_object" },
        });

        let aiResponseContent = chatCompletion.choices[0]?.message?.content || "{}";
        let cvData = {};
        try {
            cvData = JSON.parse(aiResponseContent);
        } catch (e) {
            console.warn("La réponse de l'IA n'est pas un JSON valide, tentative de récupération brute.", e);
            cvData = { errorParsing: "La réponse de l'IA n'a pas pu être parsée en JSON.", rawResponse: aiResponseContent };
        }
        
        logs.push({
            id: uuidv4(),
            timestamp: new Date().toISOString(),
            type: 'cv_generation',
            prompt: prompt,
            cvData: cvData
        });
        saveLogs();

        console.log('✅ CV généré et stocké avec succès.');
        res.json({ cvData: cvData });

    } catch (error) {
        console.error("Erreur lors de la génération du CV par l'IA:", error);
        res.status(500).json({ error: `Erreur interne du serveur lors de la génération du CV: ${error.message}` });
    }
});

app.post('/api/cv/upload', upload.single('cvFile'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'Aucun fichier uploadé.' });
    }
    console.log(`➡️ Fichier CV reçu pour upload: ${req.file.originalname}`);

    let uploadedCvData = {
        fileName: req.file.originalname,
        fileSize: req.file.size,
        message: "Fichier traité avec succès (simulé).",
        contentPreview: `Contenu de ${req.file.originalname} (simulation)`
    };

    fs.unlink(req.file.path, (err) => {
        if (err) console.error("Erreur lors de la suppression du fichier temporaire:", err);
    });

    logs.push({
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        type: 'cv_upload',
        fileName: req.file.originalname,
        uploadedCvData: uploadedCvData
    });
    saveLogs();

    console.log('✅ CV uploadé et traité avec succès.');
    res.json({ cvData: uploadedCvData });
});


// Routes pour le Portefeuille UTMi (Simulé)
// Harmonisé avec frontend: /api/wallet/balance
app.get('/api/wallet/balance', (req, res) => {
    console.log('[API] Requête GET /api/wallet/balance reçue.');
    const mockBalance = { balance: 1000, currency: "UTMi", lastUpdated: new Date().toISOString() };
    logs.push({ id: uuidv4(), timestamp: new Date().toISOString(), type: 'wallet_balance_fetch', balance: mockBalance.balance });
    saveLogs();
    res.json(mockBalance);
});

app.post('/api/wallet/claim', (req, res) => {
    console.log('[API] Requête POST /api/wallet/claim reçue.');
    const claimedAmount = 50; // Exemple
    const newBalance = 1000 + claimedAmount; // Solde fictif mis à jour
    logs.push({ id: uuidv4(), timestamp: new Date().toISOString(), type: 'wallet_claim', amount: claimedAmount });
    saveLogs();
    res.json({ message: `${claimedAmount} UTMi réclamés avec succès!`, newBalance: newBalance });
});

app.post('/api/wallet/transfer', (req, res) => {
    const { recipient, amount } = req.body;
    if (!recipient || !amount || amount <= 0) {
        return res.status(400).json({ error: "Destinataire et montant valides requis." });
    }
    console.log(`[API] Transfert de ${amount} UTMi vers ${recipient}.`);
    const newBalance = 1000 - amount; // Solde fictif mis à jour
    logs.push({ id: uuidv4(), timestamp: new Date().toISOString(), type: 'wallet_transfer', recipient, amount });
    saveLogs();
    res.json({ message: `Transfert de ${amount} UTMi à ${recipient} réussi (simulé)!`, newBalance: newBalance });
});

app.post('/api/wallet/convert', (req, res) => {
    const { amount, targetCurrency } = req.body;
    if (!amount || amount <= 0 || !targetCurrency) {
        return res.status(400).json({ error: "Montant et devise cible valides requis." });
    }
    console.log(`[API] Conversion de ${amount} UTMi en ${targetCurrency}.`);
    const convertedAmount = amount * 0.01; // Exemple 1 UTMi = 0.01 USD
    logs.push({ id: uuidv4(), timestamp: new Date().toISOString(), type: 'wallet_convert', amount, targetCurrency, convertedAmount });
    saveLogs();
    res.json({ message: `${amount} UTMi convertis en ${convertedAmount.toFixed(2)} ${targetCurrency} (simulé)!`, convertedAmount: convertedAmount.toFixed(2) });
});


// Routes pour le Tableau de Bord
// Harmonisé avec frontend: /api/dashboard
app.get('/api/dashboard', async (req, res) => {
    console.log('➡️ Requête Dashboard Insights reçue.');
    try {
        const totalInteractions = logs.length;
        const chatInteractions = logs.filter(log => log.type === 'chat_interaction').length;
        const cvGenerations = logs.filter(log => log.type === 'cv_generation').length;
        const uniqueConversations = new Set(logs.filter(log => log.type === 'chat_interaction' && log.conversationId).map(log => log.conversationId)).size;

        const aiAnalysisPrompt = `Analyse les données suivantes :
        - Nombre total d'interactions: ${totalInteractions}
        - Nombre d'interactions de chat: ${chatInteractions}
        - Nombre de générations de CV: ${cvGenerations}
        - Nombre de conversations de chat uniques: ${uniqueConversations}
        Fournis un résumé concis et des insights clés sur l'utilisation de la plateforme.`;

        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: "Vous êtes un analyste de données expert. Fournissez des insights concis basés sur les données d'utilisation de la plateforme." },
                { role: 'user', content: aiAnalysisPrompt },
            ],
            model: config.groq.model,
            temperature: 0.5,
            max_tokens: 500,
        });

        const insightsSummary = chatCompletion.choices[0]?.message?.content || "Impossible de générer des insights.";

        res.json({
            totalInteractions,
            chatInteractions,
            cvGenerations,
            uniqueConversations,
            aiSummary: insightsSummary
        });
        console.log('✅ Données du tableau de bord générées et envoyées.');
    } catch (error) {
        console.error("Erreur lors de la génération des insights du tableau de bord:", error);
        res.status(500).json({ error: `Erreur lors de la récupération des insights: ${error.message}` });
    }
});


// Routes pour les Logs
app.get('/api/logs', (req, res) => {
    res.json(logs);
});


// Routes pour la configuration (modèle, température)
app.get('/api/config', (req, res) => {
    res.json({ groq: config.groq });
});

app.post('/api/config', (req, res) => {
    const { model, temperature, maxTokens } = req.body;
    if (model) config.groq.model = model;
    if (temperature !== undefined) config.groq.temperature = parseFloat(temperature);
    if (maxTokens !== undefined) config.groq.maxTokens = parseInt(maxTokens);
    res.json({ message: 'Configuration mise à jour', groq: config.groq });
});


// Route pour obtenir la liste des modèles Groq disponibles
app.get('/api/models', async (req, res) => {
    try {
        const availableModels = [
            { id: 'llama3-8b-8192', name: 'Llama 3 8B (8K context)' },
            { id: 'llama3-70b-8192', name: 'Llama 3 70B (8K context)' },
            { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B (32K context)' },
            { id: 'gemma-7b-it', name: 'Gemma 7B (Instruct)' }
        ];
        res.json(availableModels);
    } catch (error) {
        console.error("Erreur lors de la récupération des modèles Groq:", error);
        res.status(500).json({ error: `Erreur serveur: ${error.message}` });
    }
});


// --- Configuration Swagger (Documentation API) ---
const swaggerOptions = {
    swaggerDefinition: {
        openapi: '3.0.0',
        info: {
            title: 'API UTMi',
            version: '1.0.0',
            description: 'Documentation de l\'API pour la plateforme CVNU et UTMi, incluant l\'intégration Groq AI, la gestion de CV, le portefeuille et les conversations.',
            contact: {
                name: 'Votre Nom',
                email: 'votre.email@example.com',
            },
        },
        servers: [
            {
                url: `http://localhost:${PORT}`,
                description: 'Serveur de développement local',
            },
        ],
        components: {
            securitySchemes: {
                ApiKeyAuth: {
                    type: 'apiKey',
                    in: 'header',
                    name: 'X-API-Key', // Ou 'Authorization' avec Bearer
                },
            },
        },
        security: [{
            ApiKeyAuth: []
        }],
        paths: {
            // Exemple de documentation pour un endpoint
            "/api/home/prompt": {
                post: {
                    summary: "Génère une réponse IA basée sur un prompt (section Accueil).",
                    requestBody: {
                        required: true,
                        content: {
                            "application/json": {
                                schema: { type: "object", properties: { prompt: { type: "string" } } }
                            }
                        }
                    },
                    responses: {
                        "200": { description: "Réponse IA générée avec succès." },
                        "400": { description: "Prompt manquant." }
                    }
                }
            },
            "/api/wallet/balance": {
                get: {
                    summary: "Récupère le solde actuel du portefeuille UTMi de l'utilisateur.",
                    responses: {
                        "200": { description: "Solde du portefeuille récupéré avec succès.", content: { "application/json": { example: { balance: 1000, currency: "UTMi", lastUpdated: "2025-07-02T12:00:00.000Z" } } } },
                        "500": { description: "Erreur serveur." }
                    }
                }
            },
            "/api/dashboard": {
                get: {
                    summary: "Récupère les statistiques et insights pour le tableau de bord.",
                    responses: {
                        "200": { description: "Données du tableau de bord récupérées avec succès." },
                        "500": { description: "Erreur serveur." }
                    }
                }
            },
            // Ajoutez d'autres paths ici pour documenter toutes vos routes (CV, chat, wallet actions, logs, config, etc.)
            // Exemple pour CV Generate:
            "/api/cv/generate": {
                post: {
                    summary: "Génère un contenu de CV structuré en JSON à partir d'un prompt.",
                    requestBody: {
                        required: true,
                        content: {
                            "application/json": {
                                schema: { type: "object", properties: { prompt: { type: "string" } } }
                            }
                        }
                    },
                    responses: {
                        "200": { description: "CV généré avec succès.", content: { "application/json": { example: { cvData: { /* ... */ } } } } },
                        "400": { description: "Prompt manquant." }
                    }
                }
            },
            // Exemple pour les conversations:
            "/api/conversations": {
                get: {
                    summary: "Récupère la liste paginée des conversations de chat.",
                    parameters: [
                        { name: "page", in: "query", schema: { type: "integer", default: 1 } },
                        { name: "limit", in: "query", schema: { type: "integer", default: 5 } }
                    ],
                    responses: {
                        "200": { description: "Liste des conversations récupérée." }
                    }
                },
                post: {
                    summary: "Crée une nouvelle conversation de chat ou ajoute un message à une existante.",
                    requestBody: {
                        required: true,
                        content: {
                            "application/json": {
                                schema: { type: "object", properties: { conversationId: { type: "string", nullable: true }, message: { type: "string" } } }
                            }
                        }
                    },
                    responses: {
                        "200": { description: "Message envoyé et réponse IA reçue." }
                    }
                }
            },
            "/api/conversations/{id}": {
                get: {
                    summary: "Récupère une conversation spécifique par son ID.",
                    parameters: [
                        { name: "id", in: "path", required: true, schema: { type: "string" } }
                    ],
                    responses: {
                        "200": { description: "Conversation trouvée." },
                        "404": { description: "Conversation non trouvée." }
                    }
                }
            }
        }
    },
    apis: [
        // Ici, vous pouvez lier des fichiers YAML externes pour une meilleure organisation,
        // ou documenter directement dans les routes Express avec jsdoc-to-swagger ou similaire.
        // path.join(__dirname, './swagger/swagger-components.yaml'), // Fichier pour les schémas réutilisables
    ],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));


// --- Fallback pour toutes les autres routes non définies (DOIT ÊTRE LA DERNIÈRE ROUTE) ---
// Cette route gère les requêtes non API en renvoyant index.html et les requêtes API non trouvées en renvoyant 404 JSON.
app.get('*', (req, res) => {
    // Si la requête accepte du HTML (c'est une navigation directe ou un rechargement de page)
    if (req.accepts('html')) {
        console.warn(`⚠️ Requête pour une route non gérée (HTML): ${req.originalUrl}. Envoi de public/index.html.`);
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    } else {
        // Si la requête n'accepte pas de HTML (c'est un appel API ou une ressource non-HTML manquante)
        // et qu'aucune des routes API définies précédemment n'a matché, on renvoie un 404 JSON.
        console.warn(`⚠️ Requête pour une route API non gérée (non HTML): ${req.originalUrl}. Renvoi 404 JSON.`);
        res.status(404).json({ error: `Route API non trouvée: ${req.originalUrl}` });
    }
});


// --- Démarrage du Serveur ---
app.listen(PORT, () => {
    console.log(`\n🚀 Serveur Groq Express démarré sur http://localhost:${PORT}`);
    console.log(`Accédez au frontend via : http://localhost:${PORT}/`);
    console.log(`Documentation Swagger disponible à l'adresse : http://localhost:${PORT}/api-docs`);
    console.log(`Clé API Groq utilisée: ${config.groq.apiKey ? 'Oui' : 'Non'}`);
});