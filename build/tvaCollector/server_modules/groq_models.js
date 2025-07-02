// server_modules/groq_models.js
// Utilise require pour être compatible avec CommonJS de Node.js par défaut
const Groq = require("groq-sdk");
require('dotenv').config(); // Charge les variables d'environnement du fichier .env

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const getGroqModels = async () => {
  if (!process.env.GROQ_API_KEY) {
    console.warn("GROQ_API_KEY is not set. Cannot fetch Groq models.");
    return [];
  }
  try {
    const models = await groq.models.list();
    // Groq retourne un objet avec une propriété 'data' qui est un tableau de modèles
    return models.data;
  } catch (error) {
    console.error("Error fetching Groq models:", error.message);
    return []; // Retourne un tableau vide en cas d'erreur
  }
};

// Exporter la fonction pour pouvoir l'utiliser ailleurs
module.exports = { getGroqModels };