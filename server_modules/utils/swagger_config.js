// server_modules/utils/swagger_options.js
const path = require('path');

const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'API CVNU - Plateforme UTMi', // Nom corrigé comme discuté
            version: '1.0.1', // Version que vous avez spécifiée
            description: 'Documentation de l\'API pour la plateforme CV Numérique Universel. Elle inclut la monétisation des compétences via les **UTMi (Universal Timestamp Monetization Index)**, qui sont des unités de mesure des scores d\'activité IA monétisable. L\'API couvre également le RUM (Revenue Unit Monetization) et la gestion de la Trésorerie.',
            contact: {
                name: 'Équipe CVNU',
                email: 'contact@cvnu.com',
            },
        },
        servers: [
            {
                url: 'http://localhost:3000', // Assurez-vous que c'est le bon port
                description: 'Serveur de développement local',
            },
            // Ajoutez d'autres serveurs (production, staging) si nécessaire
        ],
        components: {
            // Les schémas de données réutilisables sont définis dans swagger-components.yaml
            // et référencés ici via $ref.
            securitySchemes: {
                bearerAuth: { // Exemple d'authentification Bearer (JWT)
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
                ApiKeyAuth: { // Exemple d'authentification par clé API dans l'en-tête
                    type: 'apiKey',
                    in: 'header',
                    name: 'X-API-Key',
                },
            },
            // Les 'responses' réutilisables peuvent être définies ici ou dans un YAML dédié.
            responses: {
                InternalServerError: {
                    description: 'Erreur interne du serveur.',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/Error', // Référence au schéma Error dans swagger-components.yaml
                            },
                        },
                    },
                },
                NotFound: {
                    description: 'Ressource non trouvée.',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/Error',
                            },
                            example: {
                                status: 'error',
                                message: 'La ressource demandée n\'a pas été trouvée.',
                            },
                        },
                    },
                },
                Unauthorized: {
                    description: 'Non autorisé - Authentification requise.',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/Error',
                            },
                            example: {
                                status: 'error',
                                message: 'Accès non autorisé. Veuillez vous connecter.',
                            },
                        },
                    },
                },
                BadRequest: {
                    description: 'Requête invalide.',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/Error',
                            },
                            example: {
                                status: 'error',
                                message: 'Paramètres de requête invalides.',
                            },
                        },
                    },
                },
            },
        },
        // Tags pour organiser les opérations dans l'UI Swagger
        tags: [
            { name: 'Home', description: 'Routes et fonctionnalités de la page d\'accueil (interactions IA directes).' },
            { name: 'Dashboard', description: 'Visualisation des données agrégées et statistiques de la plateforme.' },
            { name: 'Chat', description: 'Gestion des conversations de chat avec l\'IA.' },
            { name: 'CV', description: 'Opérations liées à la génération, l\'upload et la gestion du CV Numérique Universel.' },
            { name: 'Wallet', description: 'Gestion du portefeuille UTMi (solde, réclamation, transfert, conversion).' },
            { name: 'UTMi', description: 'Opérations et calculs spécifiques aux Unités de Mesure du Score IA (UTMi).' },
            { name: 'Logs', description: 'Accès aux journaux d\'activité de l\'API.' },
            { name: 'User', description: 'Opérations d\'authentification et de gestion des utilisateurs.' },
            { name: 'Webhooks', description: 'Gestion des notifications automatiques et intégrations externes.' },
            { name: 'Config', description: 'Gestion de la configuration du serveur (ex: modèles IA).' }
        ],
    },
    // La clé de la solution : `apis` doit inclure TOUS vos fichiers de documentation !
    // Utilisez path.join pour des chemins robustes quel que soit l'OS.
    apis: [
        // Fichiers de définitions de schémas (components)
        path.join(__dirname, '..', '..', 'swagger', 'swagger-components.yaml'),

        // Fichiers de définitions de chemins (paths) pour chaque module
        path.join(__dirname, '..', '..', 'swagger', 'home.yaml'),
        path.join(__dirname, '..', '..', 'swagger', 'dashboard.yaml'),
        path.join(__dirname, '..', '..', 'swagger', 'conversations.yaml'), // Correspond à chat_routes/conversation_routes
        path.join(__dirname, '..', '..', 'swagger', 'cv.yaml'),
        path.join(__dirname, '..', '..', 'swagger', 'wallet.yaml'),
        path.join(__dirname, '..', '..', 'swagger', 'utmi.yaml'),
        path.join(__dirname, '..', '..', 'swagger', 'logs.yaml'),
        path.join(__dirname, '..', '..', 'swagger', 'user.yaml'),
        path.join(__dirname, '..', '..', 'swagger', 'webhooks.yaml'),
        // Si vous aviez un main.yaml qui agrégeait des chemins, vous pourriez l'inclure.
        // Mais si chaque service a son propre fichier YAML comme ici, un main.yaml pour les paths n'est pas nécessaire.
    ],
};

module.exports = swaggerOptions;