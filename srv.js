// server.js (exemple de routes pour les conversations, à ajouter/modifier dans ton backend)

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors'); // Si tu utilises CORS pour des requêtes cross-origin
const path = require('path'); // Pour servir les fichiers statiques

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json()); // Pour parser les requêtes JSON
app.use(cors()); // Pour permettre les requêtes depuis le frontend (si sur un port différent)

// Servir les fichiers statiques du dossier 'public'
app.use(express.static(path.join(__dirname, 'public')));

// --- ROUTES BACKEND SIMULÉES (À COMPLÉTER AVEC TA VRAIE LOGIQUE PLUS TARD) ---

// Stockage temporaire en mémoire pour les simulations
let conversations = [];
let nextConversationId = 1;
let currentCv = null; // Pour simuler le stockage du CV
let walletBalance = 1000; // Pour simuler le solde du portefeuille

// Route pour l'accueil (IA Génération)
app.post('/api/generate-ai-response', (req, res) => {
    const { prompt } = req.body;
    if (!prompt) {
        return res.status(400).json({ message: 'Le prompt est requis.' });
    }
    // Simulation d'une réponse IA
    const aiResponse = `Je suis une IA et voici une réponse à votre demande: "${prompt}".`;
    res.json({ response: aiResponse });
});

// Routes pour le Tableau de Bord
app.get('/api/dashboard/insights', (req, res) => {
    const insights = {
        totalUtmiGenerated: 12345,
        activeConversations: conversations.length, // Basé sur les conversations simulées
        cvGeneratedCount: currentCv ? 1 : 0, // Basé sur le CV simulé
        aiResponseSuccessRate: 0.99,
        averageAiResponseTime: 250
    };
    res.json(insights);
});


// --- ROUTES POUR LES CONVERSATIONS (CHAT) ---

// GET /api/conversations - Récupérer la liste des conversations (avec pagination)
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

// GET /api/conversations/:id - Récupérer une conversation spécifique
app.get('/api/conversations/:id', (req, res) => {
    const { id } = req.params;
    const conversation = conversations.find(conv => conv._id === id);

    if (conversation) {
        res.json(conversation);
    } else {
        res.status(404).json({ message: 'Conversation non trouvée.' });
    }
});

// POST /api/conversations - Démarrer une nouvelle conversation
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
    conversations.unshift(newConversation); // Ajoute au début pour qu'elle apparaisse en premier

    // Simuler une réponse IA
    const aiResponse = `Bonjour ! Vous avez démarré une nouvelle conversation. Votre message: "${initialMessage}"`;
    newConversation.messages.push({ role: 'assistant', content: aiResponse, timestamp: new Date() });

    res.status(201).json({
        message: 'Nouvelle conversation démarrée.',
        conversationId: newConversation._id,
        aiResponse: aiResponse // Renvoyer la première réponse de l'IA
    });
});

// POST /api/conversations/:id/messages - Ajouter un message à une conversation existante
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

    // Simuler une réponse IA
    const aiResponse = `J'ai bien reçu votre message: "${content}". Comment puis-je vous aider davantage?`;
    conversation.messages.push({ role: 'assistant', content: aiResponse, timestamp: new Date() });

    res.json({ message: 'Message ajouté avec succès.', aiResponse: aiResponse });
});


// --- ROUTES POUR LE CV ---

// GET /api/cv - Récupérer le CV existant
app.get('/api/cv', (req, res) => {
    if (currentCv) {
        res.json({ cvStructuredData: currentCv });
    } else {
        res.status(404).json({ message: 'Aucun CV sauvegardé.' });
    }
});

// POST /api/cv/generate - Générer un CV
app.post('/api/cv/generate', (req, res) => {
    const { prompt } = req.body;
    if (!prompt) {
        return res.status(400).json({ message: 'Un prompt est requis pour la génération de CV.' });
    }
    // Simuler la génération d'un CV
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

// POST /api/cv/upload - Uploader un CV
const multer = require('multer');
const upload = multer({ dest: 'uploads/' }); // Le dossier 'uploads' doit exister
app.post('/api/cv/upload', upload.single('cvFile'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'Aucun fichier uploadé.' });
    }
    // Ici, tu lirais et analyserais le fichier CV (par exemple, un JSON ou PDF)
    // Pour l'exemple, on simule l'analyse et met à jour currentCv
    console.log(`Fichier uploadé: ${req.file.originalname}`);
    currentCv = {
        name: `Uploadé depuis ${req.file.originalname}`,
        title: "Professionnel qualifié",
        contact: "contact@upload.com",
        summary: "Ceci est un CV analysé à partir d'un fichier uploadé. Les détails réels dépendraient de l'analyse du fichier.",
        experience: [],
        education: [],
        skills: ["Analyse de documents"]
    };
    res.json({ message: 'CV uploadé et analysé avec succès.', cvStructuredData: currentCv });
});


// --- ROUTES POUR LE WALLET ---

// GET /api/wallet - Récupérer le solde du portefeuille
app.get('/api/wallet', (req, res) => {
    res.json({ balance: walletBalance });
});

// POST /api/wallet/claim - Revendiquer des UTMi
app.post('/api/wallet/claim', (req, res) => {
    const claimedAmount = 50; // Montant simulé à revendiquer
    walletBalance += claimedAmount;
    res.json({ message: `Vous avez revendiqué ${claimedAmount} UTMi.`, newBalance: walletBalance });
});

// POST /api/wallet/transfer - Transférer des UTMi
app.post('/api/wallet/transfer', (req, res) => {
    const { recipientId, amount } = req.body;
    if (!recipientId || !amount || amount <= 0 || amount > walletBalance) {
        return res.status(400).json({ message: 'Données de transfert invalides ou solde insuffisant.' });
    }
    walletBalance -= amount;
    // Ici, tu implémenterais la logique pour créditer le destinataire
    res.json({ message: `Transféré ${amount} UTMi à ${recipientId}.`, newBalance: walletBalance });
});

// POST /api/wallet/convert - Convertir des UTMi
app.post('/api/wallet/convert', (req, res) => {
    const { amount, targetCurrency } = req.body;
    if (!targetCurrency || !amount || amount <= 0 || amount > walletBalance) {
        return res.status(400).json({ message: 'Données de conversion invalides ou solde insuffisant.' });
    }
    walletBalance -= amount;
    // Simulation d'une conversion (pas de vraie conversion ici)
    const convertedAmount = amount * 0.001; // Exemple de taux de conversion
    res.json({ message: `Converti ${amount} UTMi en ${convertedAmount.toFixed(2)} ${targetCurrency}.`, newBalance: walletBalance });
});


// Fallback pour toutes les autres routes non définies
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


// Démarrer le serveur
app.listen(PORT, () => {
    console.log(`Serveur démarré sur http://localhost:${PORT}`);
});