// server.js
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const multer = require('multer'); // Nécessaire pour l'upload de CV
require('dotenv').config(); // S'assure que les variables d'environnement sont chargées

const app = express();
const PORT = process.env.PORT || 3000;

// --- Middlewares Globaux ---
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

// Configuration de Multer pour les uploads de fichiers (ex: CV)
const upload = multer({ dest: 'uploads/' }); // Assure-toi que ce dossier existe à la racine du projet

// --- Stockage temporaire en mémoire pour les simulations ---
let conversations = [];
let nextConversationId = 1;
let currentCv = null; // Pour simuler le stockage du CV
let walletBalance = 1000; // Pour simuler le solde du portefeuille

// --- ROUTES BACKEND SIMULÉES (POUR LE FONCTIONNEMENT DU FRONTEND) ---
// Ces routes sont ici pour permettre au frontend de fonctionner
// si tes modules de routes externes ne les définissent pas encore.
// Si tes modules de routes (ex: wallet_routes.js) implémentent ces mêmes chemins,
// tu devras soit supprimer ces routes simulées ici, soit ajuster la logique
// pour éviter les conflits ou les doublons.

// Route pour l'accueil (IA Génération)
app.post('/api/generate-ai-response', (req, res) => {
    const { prompt } = req.body;
    if (!prompt) {
        return res.status(400).json({ message: 'Le prompt est requis.' });
    }
    const aiResponse = `Je suis une IA et voici une réponse à votre demande: "${prompt}".`;
    res.json({ response: aiResponse });
});

// Routes pour le Tableau de Bord
app.get('/api/dashboard/insights', (req, res) => {
    const insights = {
        totalUtmiGenerated: 12345,
        activeConversations: conversations.length,
        cvGeneratedCount: currentCv ? 1 : 0,
        aiResponseSuccessRate: 0.99,
        averageAiResponseTime: 250
    };
    res.json(insights);
});

// --- ROUTES POUR LES CONVERSATIONS (CHAT) ---
app.get('/api/conversations', (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    const results = {};
    results.totalConversations = conversations.length;
    results.totalPages = Math.ceil(conversations.length / limit);
    results.currentPage = page;

    results.conversations = conversations.slice(startIndex, endIndex).map(conv => ({
        _id: conv._id,
        title: conv.messages[0] ? conv.messages[0].content.substring(0, 50) + '...' : 'Nouvelle conversation',
        createdAt: conv.createdAt
    }));
    res.json(results);
});

app.get('/api/conversations/:id', (req, res) => {
    const { id } = req.params;
    const conversation = conversations.find(conv => conv._id === id);
    if (conversation) {
        res.json(conversation);
    } else {
        res.status(404).json({ message: 'Conversation non trouvée.' });
    }
});

app.post('/api/conversations', (req, res) => {
    const { initialMessage } = req.body;
    if (!initialMessage) {
        return res.status(400).json({ message: 'Un message initial est requis pour démarrer une conversation.' });
    }
    const newConversation = {
        _id: `conv-${nextConversationId++}`,
        messages: [{ role: 'user', content: initialMessage, timestamp: new Date() }],
        createdAt: new Date(),
        updatedAt: new Date()
    };
    conversations.unshift(newConversation);
    const aiResponse = `Bonjour ! Vous avez démarré une nouvelle conversation. Votre message: "${initialMessage}"`;
    newConversation.messages.push({ role: 'assistant', content: aiResponse, timestamp: new Date() });
    res.status(201).json({
        message: 'Nouvelle conversation démarrée.',
        conversationId: newConversation._id,
        aiResponse: aiResponse
    });
});

app.post('/api/conversations/:id/messages', (req, res) => {
    const { id } = req.params;
    const { content } = req.body;
    if (!content) {
        return res.status(400).json({ message: 'Le contenu du message est requis.' });
    }
    const conversation = conversations.find(conv => conv._id === id);
    if (!conversation) {
        return res.status(404).json({ message: 'Conversation non trouvée.' });
    }
    conversation.messages.push({ role: 'user', content: content, timestamp: new Date() });
    conversation.updatedAt = new Date();
    const aiResponse = `J'ai bien reçu votre message: "${content}". Comment puis-je vous aider davantage?`;
    conversation.messages.push({ role: 'assistant', content: aiResponse, timestamp: new Date() });
    res.json({ message: 'Message ajouté avec succès.', aiResponse: aiResponse });
});

// --- ROUTES POUR LE CV ---
app.get('/api/cv', (req, res) => {
    if (currentCv) {
        res.json({ cvStructuredData: currentCv });
    } else {
        res.status(404).json({ message: 'Aucun CV sauvegardé.' });
    }
});

app.post('/api/cv/generate', (req, res) => {
    const { prompt } = req.body;
    if (!prompt) {
        return res.status(400).json({ message: 'Un prompt est requis pour la génération de CV.' });
    }
    currentCv = {
        name: "John Doe",
        title: "Développeur Fullstack",
        contact: "john.doe@example.com | 06-XX-XX-XX-XX",
        summary: `Développeur passionné avec 5 ans d'expérience. Basé sur votre prompt: "${prompt}".`,
        experience: [
            { title: "Développeur Senior", company: "Tech Solutions", startDate: "2022-01-01", endDate: "Présent", description: "Développement d'applications web complexes." },
            { title: "Développeur Junior", company: "Web Innovations", startDate: "2019-06-01", endDate: "2021-12-31", description: "Maintenance et création de sites internet." }
        ],
        education: [
            { degree: "Master en Informatique", institution: "Université Paris-Saclay", startDate: "2017-09-01", endDate: "2019-06-01" }
        ],
        skills: ["JavaScript", "Node.js", "React", "MongoDB", "Python", "Docker"]
    };
    res.json({ message: 'CV généré avec succès.', cvStructuredData: currentCv });
});

app.post('/api/cv/upload', upload.single('cvFile'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'Aucun fichier uploadé.' });
    }
    console.log(`Fichier uploadé: ${req.file.originalname}`);
    currentCv = {
        name: `Uploadé depuis ${req.file.originalname}`,
        title: "Professionnel qualifié",
        contact: "contact@upload.com",
        summary: "Ceci est un CV analysé à partir d'un fichier uploadé.",
        experience: [], education: [], skills: []
    };
    res.json({ message: 'CV uploadé et analysé avec succès.', cvStructuredData: currentCv });
});

// --- ROUTES POUR LE WALLET ---
app.get('/api/wallet', (req, res) => {
    res.json({ balance: walletBalance });
});

app.post('/api/wallet/claim', (req, res) => {
    const claimedAmount = 50;
    walletBalance += claimedAmount;
    res.json({ message: `Vous avez revendiqué ${claimedAmount} UTMi.`, newBalance: walletBalance });
});

app.post('/api/wallet/transfer', (req, res) => {
    const { recipientId, amount } = req.body;
    if (!recipientId || !amount || amount <= 0 || amount > walletBalance) {
        return res.status(400).json({ message: 'Données de transfert invalides ou solde insuffisant.' });
    }
    walletBalance -= amount;
    res.json({ message: `Transféré ${amount} UTMi à ${recipientId}.`, newBalance: walletBalance });
});

app.post('/api/wallet/convert', (req, res) => {
    const { amount, targetCurrency } = req.body;
    if (!targetCurrency || !amount || amount <= 0 || amount > walletBalance) {
        return res.status(400).json({ message: 'Données de conversion invalides ou solde insuffisant.' });
    }
    walletBalance -= amount;
    const convertedAmount = amount * 0.001;
    res.json({ message: `Converti ${amount} UTMi en ${convertedAmount.toFixed(2)} ${targetCurrency}.`, newBalance: walletBalance });
});


// --- Importation des Modules de Routes Spécifiques ---
// CES ROUTES DOIVENT ÊTRE DÉFINIES APRÈS LES ROUTES SIMULÉES SPÉCIFIQUES
// Si ces modules définissent des routes qui se chevauchent avec les routes simulées ci-dessus,
// les routes définies dans ces modules PRENDRONT LE DESSUS (car app.use les verra après).
// Si tu veux que TES modules gèrent ces routes, supprime les sections simulées correspondantes ci-dessus.
// Assure-toi que ces chemins sont corrects par rapport à l'emplacement de 'server.js'

// const utmiRoutes = require('./server_modules/routes/utmi_routes.js');
// const walletRoutes = require('./server_modules/routes/wallet_routes.js');
// const webhookRoutes = require('./server_modules/routes/webhook_routes.js');
// const userRoutes = require('./server_modules/routes/user_routes.js');

// app.use('/api/utmi', utmiRoutes);
// app.use('/api/wallet', walletRoutes); // Si ce module définit /api/wallet, il prendra le dessus
// app.use('/api/webhooks', webhookRoutes);
// app.use('/api/users', userRoutes);

// --- Configuration et Génération de la Documentation Swagger ---

const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'API UTMi (Universal Timestamp Monetization Index)',
            version: '1.0.0',
            description: 'Documentation de l\'API pour la gestion des UTMi, portefeuilles et webhooks.',
        },
        servers: [
            {
                url: `http://localhost:${PORT}`,
                description: 'Serveur de développement local',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Authentification par jeton JWT (Bearer Token)',
                },
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
        tags: [
            { name: 'UTMI', description: 'Opérations liées aux UTMi (Universal Timestamp Monetization Index)' },
            { name: 'Wallet', description: 'Opérations de gestion du portefeuille UTMi' },
            { name: 'Webhooks', description: 'Gestion des webhooks entrants (GitHub, Stripe, etc.)' },
            { name: 'Users', description: 'Opérations de gestion des utilisateurs (authentification, profil)' },
            // Ajout des tags pour les sections du frontend qui ont des routes simulées
            { name: 'AI Generator', description: 'Génération de réponses IA pour l\'accueil' },
            { name: 'Dashboard', description: 'Statistiques et aperçus du tableau de bord' },
            { name: 'Chat', description: 'Gestion des conversations avec l\'IA' },
            { name: 'CV Generator', description: 'Génération et gestion des CV via IA et upload' },
        ],
    },
    apis: [
        path.join(__dirname, './swagger/main.yaml'),
        path.join(__dirname, './swagger/utmi.yaml'),
        path.join(__dirname, './swagger/wallet.yaml'),
        path.join(__dirname, './swagger/webhooks.yaml'),
        path.join(__dirname, './swagger/user.yaml'),
        // Si tu souhaites documenter les routes simulées, tu devras ajouter des fichiers YAML
        // pour celles-ci ou les intégrer dans un des fichiers existants (ex: main.yaml)
        // en utilisant les annotations JSDoc dans le code ou des définitions YAML complètes.
    ],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Middleware pour servir la documentation Swagger UI
// Accessible via http://localhost:PORT/api-docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// --- Route de Base ---
app.get('/', (req, res) => {
    res.send('Bienvenue sur l\'API UTMi ! Consultez la documentation sur <a href="/api-docs">/api-docs</a>');
});

// Fallback pour toutes les autres routes non définies vers index.html
// Cette route DOIT être la dernière pour ne pas intercepter les appels API ni Swagger.
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- Démarrage du Serveur ---
app.listen(PORT, () => {
    console.log(`Serveur en cours d'exécution sur le port http://localhost:${PORT}`);
    console.log(`Documentation Swagger disponible à l'adresse : http://localhost:${PORT}/api-docs`);
});