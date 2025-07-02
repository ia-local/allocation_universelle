// server_modules/config.js
module.exports = {
    port: process.env.PORT || 3000, // Utilise la variable d'environnement PORT ou 3000 par défaut
    // Autres configurations globales peuvent aller ici
    // ex: apiKeys: { groq: process.env.GROQ_API_KEY }, // Bien que l'API Key soit mieux gérée directement dans groq_service via process.env
    // dbPaths: { conversations: 'data/conversations.json', wallet: 'data/wallet_data.json' }
};