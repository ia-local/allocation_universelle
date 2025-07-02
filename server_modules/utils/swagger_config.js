// server_modules/utils/swagger_config.js
const swaggerConfig = {
    definition: {
        openapi: '3.0.0',
        info: {
        title: 'API UTMi (Universal Talent Monetization Index)', // <-- Change ceci
            version: '1.0.0',
            description: 'Documentation de l\'API pour l\'application CV Numérique Universel et la monétisation des compétences via les UTMi, le RUM et la Trésorerie.',
        },
        servers: [
            {
                url: 'http://localhost:3000',
                description: 'Serveur de développement local',
            },
        ],
        components: {
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
    },
    apis: ['./server_modules/routes/*.js'], // Chemin vers les fichiers de routes pour la documentation
};

module.exports = swaggerConfig;