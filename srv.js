// server.js
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const multer = require('multer'); // Nécessaire pour l'upload de CV
const Groq = require('groq-sdk'); // Importation du SDK Groq
const { v4: uuidv4 } = require('uuid'); // Pour générer des IDs uniques
const fs = require('fs'); // Pour le logging des interactions

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
app.use(express.json()); // Pour parser les requêtes JSON
app.use(bodyParser.urlencoded({ extended: true })); // Pour parser les requêtes URL-encoded

// Configuration de Multer pour l'upload de fichiers (CV)
const upload = multer({ dest: 'uploads/' }); // Les fichiers seront stockés temporairement ici

// --- Système de Logs (très basique pour l'exemple) ---
const logs = []; // Stockage temporaire en mémoire
if (fs.existsSync(config.logFilePath)) {
    try {
        const fileContent = fs.readFileSync(config.logFilePath, 'utf8');
        if (fileContent) { // S'assurer que le fichier n'est pas vide
            logs.push(...JSON.parse(fileContent));
        }
    } catch (e) {
        console.error("Erreur de lecture ou de parsing du fichier de logs:", e);
    }
}

function saveLogs() {
    fs.writeFile(config.logFilePath, JSON.stringify(logs, null, 2), (err) => {
        if (err) console.error("Erreur lors de l'écriture des logs:", err);
    });
}

// --- Système de Conversations (Chat) ---
// Utilise un simple objet pour stocker les conversations en mémoire pour cet exemple
// Dans une vraie application, vous utiliseriez une base de données (MongoDB, PostgreSQL, etc.)
let conversations = {}; // { conversationId: { id, title, messages: [] } }

// Charger les conversations existantes si elles sont stockées dans un fichier (optionnel)
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

// Route pour la génération de texte/réponse IA (utilisée par la section Accueil)
app.post('/generate', async (req, res) => {
    const { prompt } = req.body;
    console.log(`➡️ Requête AI reçue pour le prompt: "${prompt.substring(0, 50)}..."`);

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
        
        // Stocker l'interaction
        logs.push({
            id: uuidv4(),
            timestamp: new Date().toISOString(),
            type: 'home_interaction',
            prompt: prompt,
            response: aiResponse
        });
        saveLogs();

        console.log('✅ Réponse de l\'IA générée et interaction stockée avec succès.');
        res.json({ response: aiResponse });

    } catch (error) {
        console.error("Erreur lors de la génération de l'IA:", error);
        res.status(500).json({ error: `Erreur interne du serveur: ${error.message}` });
    }
});


// Routes pour le Chat (Conversations)
// GET toutes les conversations (liste)
app.get('/api/conversations', (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;

    const allConvArray = Object.values(conversations).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedConversations = allConvArray.slice(startIndex, endIndex);

    res.json({
        conversations: paginatedConversations.map(conv => ({
            _id: conv.id,
            title: conv.title,
            updatedAt: conv.updatedAt,
            // Ne pas envoyer tous les messages ici, juste pour la liste
        })),
        currentPage: page,
        totalPages: Math.ceil(allConvArray.length / limit),
        totalConversations: allConvArray.length
    });
});

// GET une conversation spécifique
app.get('/api/conversations/:id', (req, res) => {
    const { id } = req.params;
    const conversation = conversations[id];
    if (conversation) {
        res.json({ conversation });
    } else {
        res.status(404).json({ error: 'Conversation non trouvée.' });
    }
});

// POST un message à une conversation (création ou mise à jour)
app.post('/api/conversations', async (req, res) => {
    let { conversationId, message } = req.body;

    if (!message) {
        return res.status(400).json({ error: 'Le message est requis.' });
    }

    let currentConversation;
    if (conversationId && conversations[conversationId]) {
        // Conversation existante
        currentConversation = conversations[conversationId];
    } else {
        // Nouvelle conversation
        conversationId = uuidv4();
        currentConversation = {
            id: conversationId,
            title: message.substring(0, 50) + (message.length > 50 ? '...' : ''), // Premier message comme titre
            messages: [],
            createdAt: new Date().toISOString(),
        };
        conversations[conversationId] = currentConversation;
        console.log(`[Server] Nouvelle conversation créée: ${conversationId}`);
    }

    // Ajouter le message de l'utilisateur
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
        currentConversation.updatedAt = new Date().toISOString(); // Mettre à jour après la réponse IA

        saveConversations(); // Sauvegarder après chaque échange
        
        // Stocker l'interaction dans les logs généraux
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
            conversation: currentConversation, // Renvoie l'objet conversation mis à jour
            aiResponse: aiResponse
        });

    } catch (error) {
        console.error("Erreur lors de la génération de la réponse du chat IA:", error);
        res.status(500).json({ error: `Erreur interne du serveur lors du chat: ${error.message}` });
    }
});


// Routes pour le Générateur de CV
// GET une représentation du CV (peut être un JSON vide si aucun CV n'est "actif")
app.get('/api/cv', async (req, res) => {
    console.log('[API] Requête GET /api/cv reçue.');
    try {
        // Ici, vous devrez implémenter la logique pour récupérer le CV de l'utilisateur
        // Par exemple, depuis un fichier ou une base de données.
        // Pour l'instant, renvoyons une structure vide si aucun CV n'est "actif" côté serveur.
        res.status(200).json({
            message: "Pas de CV trouvé. Veuillez en générer un ou en uploader un.",
            cvData: {} // Objet vide pour indiquer l'absence de données de CV
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
                { role: 'system', content: "Vous êtes un générateur de CV expert. Créez un CV structuré et professionnel basé sur le prompt fourni. Le CV doit être un objet JSON avec des sections comme 'informationsPersonnelles', 'experienceProfessionnelle', 'education', 'competences'. Si le prompt demande des informations spécifiques, adaptez le CV en conséquence. Fournissez uniquement le JSON du CV." },
                { role: 'user', content: prompt },
            ],
            model: config.groq.model,
            temperature: config.groq.temperature,
            max_tokens: config.groq.maxTokens,
            response_format: { type: "json_object" }, // Assure une réponse JSON si le modèle le supporte
        });

        let aiResponseContent = chatCompletion.choices[0]?.message?.content || "{}";
        let cvData = {};
        try {
            cvData = JSON.parse(aiResponseContent);
        } catch (e) {
            console.warn("La réponse de l'IA n'est pas un JSON valide, tentative de récupération brute.", e);
            cvData = { errorParsing: "La réponse de l'IA n'a pas pu être parsée en JSON.", rawResponse: aiResponseContent };
        }
        
        // Stocker l'interaction
        logs.push({
            id: uuidv4(),
            timestamp: new Date().toISOString(),
            type: 'cv_generation',
            prompt: prompt,
            cvData: cvData // Stocker les données parsées ou brutes
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

    // Ici, vous traiterez le fichier uploadé (ex: le parser, l'analyser avec l'IA)
    // Pour l'exemple, nous allons juste simuler un parsing et renvoyer une structure simple.
    let uploadedCvData = {
        fileName: req.file.originalname,
        fileSize: req.file.size,
        message: "Fichier traité avec succès (simulé).",
        contentPreview: `Contenu de ${req.file.originalname} (simulation)`
    };

    // Supprimer le fichier temporaire après traitement
    fs.unlink(req.file.path, (err) => {
        if (err) console.error("Erreur lors de la suppression du fichier temporaire:", err);
    });

    // Stocker l'interaction
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
// GET le solde actuel de l'utilisateur
app.get('/api/wallet', (req, res) => {
    // Ceci est un exemple simple, dans un cas réel, vous vérifieriez l'utilisateur et sa balance
    res.json({ balance: 1000, currency: "UTMi" });
});

// POST pour réclamer des UTMi (simulé)
app.post('/api/wallet/claim', (req, res) => {
    // Logique de simulation : ajouter des UTMi
    res.json({ message: "10 UTMi réclamés avec succès!", newBalance: 1010 });
});

// POST pour transférer des UTMi (simulé)
app.post('/api/wallet/transfer', (req, res) => {
    const { recipient, amount } = req.body;
    if (!recipient || !amount || amount <= 0) {
        return res.status(400).json({ error: "Destinataire et montant valides requis." });
    }
    // Logique de simulation : déduire du solde de l'expéditeur et ajouter au destinataire
    res.json({ message: `Transfert de ${amount} UTMi à ${recipient} réussi (simulé)!`, newBalance: 990 });
});

// POST pour convertir des UTMi (simulé)
app.post('/api/wallet/convert', (req, res) => {
    const { amount, targetCurrency } = req.body;
    if (!amount || amount <= 0 || !targetCurrency) {
        return res.status(400).json({ error: "Montant et devise cible valides requis." });
    }
    // Logique de simulation de conversion
    const convertedAmount = amount * 0.01; // Exemple 1 UTMi = 0.01 USD
    res.json({ message: `${amount} UTMi convertis en ${convertedAmount} ${targetCurrency} (simulé)!` });
});


// Routes pour le Tableau de Bord
app.get('/api/dashboard/insights', async (req, res) => {
    console.log('➡️ Requête Dashboard Insights reçue.');
    try {
        // Exemples d'insights basés sur les logs ou des données fictives
        const totalInteractions = logs.length;
        const chatInteractions = logs.filter(log => log.type === 'chat_interaction').length;
        const cvGenerations = logs.filter(log => log.type === 'cv_generation').length;
        const uniqueConversations = new Set(logs.filter(log => log.type === 'chat_interaction' && log.conversationId).map(log => log.conversationId)).size;

        // Simulation d'une analyse IA sur les logs (nécessiterait plus de logique)
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
        // En pratique, vous feriez un appel à l'API Groq pour lister les modèles
        // Pour cet exemple, nous simulons une liste de modèles
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
            title: 'UTMi API',
            version: '1.0.0',
            description: 'API pour la plateforme UTMi, incluant l\'intégration Groq AI, la gestion de CV, le portefeuille et les conversations.',
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
    },
    apis: [
        path.join(__dirname, './swagger/swagger-components.yaml'), // Fichier pour les schémas réutilisables
        // path.join(__dirname, './swagger/groq.yaml'),
        // path.join(__dirname, './swagger/conversations.yaml'),
        // path.join(__dirname, './swagger/cv.yaml'),
        // path.join(__dirname, './swagger/dashboard.yaml'),
        // path.join(__dirname, './swagger/logs.yaml'),
        // path.join(__dirname, './swagger/utmi.yaml'),
        // path.join(__dirname, './swagger/wallet.yaml'),
        // path.join(__dirname, './swagger/webhooks.yaml'),
        // path.join(__dirname, './swagger/user.yaml'),
    ],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Middleware pour servir la documentation Swagger UI
// Accessible via http://localhost:PORT/api-docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));


// --- Servir les fichiers statiques du frontend (public/) ---
// Cette ligne doit être AVANT le fallback app.get('*') pour servir vos fichiers HTML, CSS, JS, etc.
app.use(express.static(path.join(__dirname, 'public')));


// Fallback pour toutes les autres routes non définies (DOIT ÊTRE LA DERNIÈRE ROUTE)
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