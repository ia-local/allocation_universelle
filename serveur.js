// serveur.js - Point d'entrée principal de l'application Node.js/Express

// --- 1. Importations des modules nécessaires ---
const express = require('express');
const bodyParser = require('body-parser'); // Pour parser le corps des requêtes POST
const cors = require('cors'); // Pour gérer les requêtes Cross-Origin
const path = require('path'); // Pour travailler avec les chemins de fichiers
const dotenv = require('dotenv'); // Pour charger les variables d'environnement
const swaggerUi = require('swagger-ui-express'); // Pour la documentation Swagger UI
const swaggerJsdoc = require('swagger-jsdoc'); // Pour générer la spécification Swagger à partir des JSDoc

// Importation du logger API personnalisé
const { logApiCall } = require('./server_modules/utils/api_logger');

// Importation des routes de l'API
const homeRoutes = require('./server_modules/routes/home_routes');
const conversationRoutes = require('./server_modules/routes/conversation_routes');
const cvRoutes = require('./server_modules/routes/cv_routes');
const dashboardRoutes = require('./server_modules/routes/dashboard_routes');
const walletRoutes = require('./server_modules/routes/wallet_routes');
const utmiRoutes = require('./server_modules/routes/utmi_routes'); // Assurez-vous que ce fichier existe

// --- 2. Configuration de l'environnement et de l'application ---
dotenv.config(); // Charge les variables d'environnement du fichier .env
const app = express();
const PORT = process.env.PORT || 3000; // Utilise le port défini dans .env ou 3000 par défaut

// --- 3. Configuration de Swagger (Documentation API) ---
const swaggerOptions = {
    swaggerDefinition: {
        openapi: '3.0.0',
        info: {
            title: 'CVNU AI API Documentation',
            version: '1.0.0',
            description: 'Documentation de l\'API backend pour l\'application CVNU AI.',
            contact: {
                name: 'Support CVNU AI',
                url: 'http://localhost:3000/contact',
                email: 'support@cvnu.ai',
            },
        },
        servers: [
            {
                url: `http://localhost:${PORT}/api`,
                description: 'Serveur de développement local',
            },
        ],
        tags: [ // Définition des tags globaux pour organiser la documentation
            {
                name: 'Home',
                description: 'Opérations liées à la page d\'accueil et à la génération de texte/CV.'
            },
            {
                name: 'Conversations',
                description: 'Gestion des conversations avec l\'IA.'
            },
            {
                name: 'CV',
                description: 'Gestion des données et génération de CV.'
            },
            {
                name: 'Dashboard',
                description: 'Statistiques et informations du tableau de bord.'
            },
            {
                name: 'Wallet',
                description: 'Gestion du portefeuille utilisateur (fiat et crypto).'
            },
            {
                name: 'UTMi',
                description: 'Gestion et calcul des Universal Talent Monetization Index.'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Authentification JWT via Bearer Token. Non implémenté dans cet exemple, mais prévu pour la sécurité.'
                }
            }
        },
        security: [ // Applique la sécurité JWT globalement, si besoin.
            // {
            //     bearerAuth: []
            // }
        ]
    },
    apis: [
        './server_modules/routes/*.js', // Chemin vers tous vos fichiers de routes pour JSDoc
        './server_modules/models/*.js' // Si vous avez des schémas de modèles avec JSDoc
    ],
};
const swaggerSpec = swaggerJsdoc(swaggerOptions);

// --- 4. Middlewares Globaux ---

// Middleware pour parser les corps de requêtes au format JSON
app.use(bodyParser.json());
// Middleware pour parser les corps de requêtes URL encodées
app.use(bodyParser.urlencoded({ extended: true }));
// Middleware CORS pour permettre les requêtes cross-origin
app.use(cors());

// Middleware pour le logging de toutes les requêtes entrantes
app.use((req, res, next) => {
    logApiCall('serveur.js', `${req.method} ${req.url}`, 'info');
    next();
});

// --- 5. Routes Statiques (TRÈS IMPORTANT : Doit être avant les routes API et catch-all) ---
// Sert les fichiers statiques (HTML, CSS, JavaScript du frontend, images, etc.)
app.use(express.static(path.join(__dirname, 'public')));

// --- 6. Routes API ---
// Toutes les routes API sont préfixées par '/api'
app.use('/api/home', homeRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/cv', cvRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/utmi', utmiRoutes);

// --- 7. Route pour la documentation Swagger UI ---
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// --- 8. Route Catch-all pour l'application SPA (Doit être la DERNIÈRE route) ---
// Cette route sert le fichier index.html pour toutes les requêtes qui ne correspondent
// pas aux routes statiques ou aux routes API définies précédemment.
// C'est essentiel pour le routage côté client d'une Single Page Application (SPA).
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- 9. Gestionnaire d'erreurs global (Middleware d'erreur) ---
app.use((err, req, res, next) => {
    // Log l'erreur complète avec stack trace
    logApiCall('serveur.js', 'GLOBAL_ERROR', 'error', { message: err.message, stack: err.stack });

    // Répond à la requête avec un statut d'erreur
    res.status(err.status || 500).json({
        status: 'error',
        message: err.message || 'Une erreur interne est survenue.'
    });
});

// --- 10. Démarrage du serveur ---
app.listen(PORT, () => {
    logApiCall('serveur.js', 'SERVER_STARTUP', 'info', `Serveur démarré sur http://localhost:${PORT}`);
    console.log(`Serveur démarré sur http://localhost:${PORT}`);
    console.log(`Documentation Swagger disponible sur http://localhost:${PORT}/api-docs`);
});