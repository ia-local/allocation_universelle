// server_modules/utils/swagger_config.js
const swaggerJSDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API UTMi (Universal Talent Monetization Index)', //  // <-- Assure-toi que ce titre correspond ici aussi si c'est directement défini.
      version: '1.0.0',
      description: 'Documentation de l\'API pour la gestion des UTMi, portefeuilles et webhooks.',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Serveur de développement local',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
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
    ],
  },
  // IMPORTANT : Assure-toi que les chemins sont corrects ici
  apis: [
    './swagger/main.yaml', // Chemin vers ton fichier principal
    './swagger/user.yaml',
    './swagger/utmi.yaml',
    './swagger/wallet.yaml',
    './swagger/webhooks.yaml',
    // Si tu as des annotations Swagger JSDoc directement dans tes fichiers de routes JS, ajoute-les aussi :
    './server_modules/routes/*.js', // Ou spécifie chaque fichier de route JS
  ],
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;