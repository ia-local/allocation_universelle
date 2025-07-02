import { GoogleGenerativeAI } from '@google/generative-ai';

// Assurez-vous que la clé API est correctement configurée dans vos variables d'environnement
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Choisissez un modèle Gemini qui prend en charge les entrées de texte
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Ou "gemini-pro"

const prompt = "Génère une description détaillée d'un chat roux et blanc très mignon, dormant paisiblement sur un coussin bleu moelleux sous un rayon de soleil chaud filtrant à travers une fenêtre.";

async function generateImageDescription() {
  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    console.log("Description de l'image générée :");
    console.log(responseText);

    // Ici, vous utiliseriez 'responseText' avec une autre API de génération d'images
    // ou un outil pour créer l'image basée sur cette description.

  } catch (error) {
    console.error("Erreur lors de la génération de la description :", error);
  }
}

generateImageDescription();