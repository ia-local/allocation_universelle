// serveur.js
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
require('dotenv').config(); // S'assure que les variables d'environnement sont chargées

const app = express();
const PORT = process.env.PORT || 3000;

// --- Middlewares Globaux ---
app.use(express.static(path.join(__dirname, 'public')));

// Middleware pour parser les requêtes JSON (très important pour les requêtes POST/PUT)
app.use(bodyParser.json());

// Middleware pour parser les requêtes URL encodées (si tu utilises des formulaires HTML simples)
app.use(bodyParser.urlencoded({ extended: true }));

// Middleware CORS pour permettre les requêtes depuis d'autres origines (par exemple, ton frontend)
// Tu peux configurer CORS plus spécifiquement si nécessaire (ex: limiter les domaines autorisés)
app.use(cors());

// --- Importation des Modules de Routes ---

// Assure-toi que ces chemins sont corrects par rapport à l'emplacement de 'serveur.js'
const utmiRoutes = require('./server_modules/routes/utmi_routes.js');
const walletRoutes = require('./server_modules/routes/wallet_routes.js');
const webhookRoutes = require('./server_modules/routes/webhook_routes.js');
const userRoutes = require('./server_modules/routes/user_routes.js');

// --- Utilisation des Routes API ---

// Chaque groupe de routes est préfixé par son chemin d'API
app.use('/api/utmi', utmiRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/users', userRoutes);

// --- Configuration et Génération de la Documentation Swagger ---

const swaggerOptions = {
    // La 'definition' est la partie principale de la spécification OpenAPI.
    // Elle est généralement définie dans un fichier YAML ou JSON pour les projets complexes.
    // Ici, swagger-jsdoc va fusionner les définitions de tous les fichiers YAML spécifiés dans 'apis'.
    definition: {
        openapi: '3.0.0', // Version de la spécification OpenAPI
        info: {
            title: 'API UTMi (Universal Talent Monetization Index)',
            version: '1.0.0',
            description: 'Documentation de l\'API pour la gestion des UTMi, portefeuilles et webhooks.',
        },
        servers: [
            {
                url: `http://localhost:${PORT}`, // URL de base de ton API
                description: 'Serveur de développement local',
            },
            // Tu peux ajouter d'autres serveurs ici (ex: production, staging)
        ],
        // Définition des schémas de sécurité (si tu utilises l'authentification)
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT', // Indique que le jeton est un JWT
                    description: 'Authentification par jeton JWT (Bearer Token)',
                },
            },
        },
        // Applique la sécurité globale (ici, toutes les routes nécessitent bearerAuth par défaut, sauf si override)
        security: [
            {
                bearerAuth: [],
            },
        ],
        // Définition des tags pour organiser ta documentation
        tags: [
            {
                name: 'UTMI',
                description: 'Opérations liées aux UTMi (Universal Talent Monetization Index)',
            },
            {
                name: 'Wallet',
                description: 'Opérations de gestion du portefeuille UTMi',
            },
            {
                name: 'Webhooks',
                description: 'Gestion des webhooks entrants (GitHub, Stripe, etc.)',
            },
            {
                name: 'Users',
                description: 'Opérations de gestion des utilisateurs (authentification, profil)',
            },
        ],
        // 'paths' et 'components/schemas' seront automatiquement fusionnés à partir des fichiers YAML
    },
    // Le tableau 'apis' indique à swagger-jsdoc où trouver tes fichiers de définition OpenAPI.
    // Assure-toi que ces chemins sont corrects et que les fichiers existent.
    apis: [
        path.join(__dirname, './swagger/main.yaml'),      // Informations générales de l'API
        path.join(__dirname, './swagger/utmi.yaml'),      // Routes et modèles pour UTMi
        path.join(__dirname, './swagger/wallet.yaml'),    // Routes et modèles pour le portefeuille
        path.join(__dirname, './swagger/webhooks.yaml'),  // Routes et modèles pour les webhooks
        path.join(__dirname, './swagger/user.yaml'),      // Routes et modèles pour les utilisateurs
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

// --- Démarrage du Serveur ---

app.listen(PORT, () => {
    console.log(`Serveur en cours d'exécution sur le port http://localhost:${PORT}`);
    console.log(`Documentation Swagger disponible à l'adresse : http://localhost:${PORT}/api-docs`);
});