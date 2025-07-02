// server_modules/utils/swagger_config.js
const swaggerJSDoc = require('swagger-jsdoc');

const swaggerConfig = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'API UTMi (Universal Timestamp Monetization Index)', // <-- Le titre corrigé ici !
            version: '1.0.1',
            description: 'Documentation de l\'API pour l\'application CV Numérique Universel et la monétisation des compétences via les UTMi, le RUM et la Trésorerie.',
        },
        servers: [
            {
                url: 'http://localhost:3000',
                description: 'Serveur de développement local',
            },
        ],
        // Schémas génériques définis ici. Les schémas spécifiques aux routes peuvent rester dans leurs fichiers YAML dédiés.
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
            schemas: {
                Error: {
                    type: 'object',
                    properties: {
                        status: {
                            type: 'string',
                            example: 'error',
                        },
                        message: {
                            type: 'string',
                            example: 'Description de l\'erreur.',
                        },
                    },
                },
                ConversationMessage: {
                    type: 'object',
                    properties: {
                        role: {
                            type: 'string',
                            enum: ['user', 'assistant'],
                            description: 'Rôle de l\'expéditeur du message.',
                        },
                        content: {
                            type: 'string',
                            description: 'Contenu textuel du message.',
                        },
                        timestamp: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Horodatage de l\'envoi du message.',
                        },
                        utmiEarned: {
                            type: 'number',
                            format: 'float',
                            description: 'UTMi gagnés pour cette interaction (le cas échéant).',
                            nullable: true,
                        },
                        piPointsEarned: {
                            type: 'number',
                            format: 'float',
                            description: 'Points d\'Influence (PI) gagnés pour cette interaction (le cas échéant).',
                            nullable: true,
                        },
                    },
                },
                Conversation: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            description: 'Identifiant unique de la conversation.',
                            example: 'conv_123abc',
                        },
                        title: {
                            type: 'string',
                            description: 'Titre de la conversation.',
                            example: 'Génération de code pour l\'UI',
                        },
                        messages: {
                            type: 'array',
                            items: {
                                $ref: '#/components/schemas/ConversationMessage',
                            },
                            description: 'Liste des messages de la conversation.',
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Date de création de la conversation.',
                        },
                        updatedAt: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Dernière date de mise à jour de la conversation.',
                        },
                    },
                },
            },
            responses: {
                InternalServerError: {
                    description: 'Erreur serveur interne.',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/Error',
                            },
                        },
                    },
                },
            },
        },
        // Assure-toi que cette section est également correcte si tu l'as dans main.yaml
        // ou si tu préfères la centraliser ici.
        tags: [
            { name: 'User', description: 'Opérations liées aux utilisateurs.' },
            { name: 'UTMI', description: 'Opérations liées aux UTMi (Universal Timestamp Monetization Index).' },
            { name: 'Wallet', description: 'Opérations de gestion du portefeuille UTMi.' },
            { name: 'Webhooks', description: 'Gestion des webhooks entrants (GitHub, Stripe, etc.).' },
            { name: 'Conversation', description: 'Gestion des conversations et interactions IA.' },
            { name: 'CV', description: 'Gestion du CV Numérique Universel.' },
            { name: 'Dashboard', description: 'Visualisation des données du tableau de bord.' },
            { name: 'Home', description: 'Routes de la page d\'accueil.' }
        ],
    },
    // La clé de la solution : `apis` doit inclure TOUS tes fichiers de documentation !
    apis: [
        './swagger/main.yaml',      // Inclus explicitement le fichier main.yaml
        './swagger/user.yaml',      // Fichiers YAML spécifiques aux modules
        './swagger/utmi.yaml',
        './swagger/wallet.yaml',
        './swagger/webhooks.yaml',
        './server_modules/routes/*.js', // Scan toutes les annotations JSDoc dans tes routes
        // Si certains de tes fichiers de routes ne sont pas dans le dossier racine de 'routes'
        // ou si tu veux être plus spécifique, tu peux les lister individuellement :
        // './server_modules/routes/auth_routes.js',
        // './server_modules/routes/chat_routes.js',
        // './server_modules/routes/conversation_routes.js',
        // './server_modules/routes/cv_routes.js',
        // './server_modules/routes/dashboard_routes.js',
        // './server_modules/routes/home_routes.js',
        // './server_modules/routes/user_routes.js',
        // './server_modules/routes/utmi_routes.js',
        // './server_modules/routes/wallet_routes.js',
        // './server_modules/routes/webhook_routes.js',
    ],
};

const swaggerSpec = swaggerJSDoc(swaggerConfig);

module.exports = swaggerSpec;