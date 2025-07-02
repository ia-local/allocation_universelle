// simplified_srv.js - Prototype de Serveur Unifié Simplifié (Groq-SDK & Calculs CVNU)

const express = require('express');
const Groq = require('groq-sdk'); // Assurez-vous d'avoir 'groq-sdk' installé (npm install groq-sdk)
const cors = require('cors');
const path = require('path');

// --- Configuration des variables d'environnement (Simplifié) ---
// Pour un usage réel, utilisez un fichier .env et require('dotenv').config();
// Pour ce prototype, remplacez 'VOTRE_CLE_API_GROQ_ICI' par votre vraie clé API Groq.
// Gardez votre clé API secrète et ne la commitez JAMAIS dans un dépôt public !
const GROQ_API_KEY = process.env.GROQ_API_KEY || 'VOTRE_CLE_API_GROQ_ICI'; // Remplacez ceci !

// Initialisation de Groq SDK
const groq = new Groq({ apiKey: GROQ_API_KEY });

// --- COEFFICIENTS et FONCTIONS DE CALCUL SIMPLIFIÉES (INLINÉES POUR CE PROTOTYPE) ---
// Ces constantes et fonctions sont copiées directement de notre "prototype simplifié"
const COEFFICIENTS_PROTO = {
    CV: {
        BASE_POINT_PER_SKILL: 5,
        POINT_PER_YEAR_EXPERIENCE: 10,
        POINT_PER_DIPLOMA: 20,
        BONUS_RARE_SKILL: 15,
        SEUIL_JUNIOR: 0,
        SEUIL_MIDDLE: 100,
        SEUIL_SENIOR: 250
    },
    UTMI: {
        BASE_PER_WORD: 0.1,
        COMPLEXITY_MULTIPLIER: 1.5,
        IMPACT_MULTIPLIER: 2.0,
        BASE_INCOME_PER_UTMI_EUR: 0.005
    },
    REVENU: {
        BASE_INCOME_PER_CV_POINT_EUR: 0.01,
        JUNIOR_BONUS_EUR: 5,
        MIDDLE_BONUS_EUR: 20,
        SENIOR_BONUS_EUR: 50,
        MAX_MONTHLY_INCOME_EUR: 500
    },
    // Taux de change simplifiés pour le dashboard
    EXCHANGE_RATES: {
        USD: 1.08, // 1 EUR = 1.08 USD (exemple)
    }
};

function parseAndStructureCvProto(cvText) {
    const structuredCv = {
        skills: [],
        experienceYears: 0,
        diplomas: [],
        hasRareSkill: false
        // Ajoutez d'autres champs simplifiés si nécessaire pour les tests
    };

    if (cvText.toLowerCase().includes("javascript")) structuredCv.skills.push("JavaScript");
    if (cvText.toLowerCase().includes("python")) structuredCv.skills.push("Python");
    if (cvText.toLowerCase().includes("ai / ml") || cvText.toLowerCase().includes("intelligence artificielle")) {
        structuredCv.skills.push("AI / ML");
        structuredCv.hasRareSkill = true; // Exemple de compétence rare si AI/ML est mentionné
    }
    if (cvText.toLowerCase().includes("blockchain")) {
        structuredCv.skills.push("Blockchain");
        structuredCv.hasRareSkill = true;
    }


    const experienceMatch = cvText.match(/(\d+)\s*ans d'expérience/i);
    if (experienceMatch) {
        structuredCv.experienceYears = parseInt(experienceMatch[1], 10);
    }

    if (cvText.toLowerCase().includes("master")) structuredCv.diplomas.push("Master");
    if (cvText.toLowerCase().includes("doctorat")) structuredCv.diplomas.push("Doctorat");

    return structuredCv;
}

function calculateInitialCvValueProto(structuredCv) {
    let cvScore = 0;
    cvScore += structuredCv.skills.length * COEFFICIENTS_PROTO.CV.BASE_POINT_PER_SKILL;
    if (structuredCv.hasRareSkill) {
        cvScore += COEFFICIENTS_PROTO.CV.BONUS_RARE_SKILL;
    }
    cvScore += structuredCv.experienceYears * COEFFICIENTS_PROTO.CV.POINT_PER_YEAR_EXPERIENCE;
    cvScore += structuredCv.diplomas.length * COEFFICIENTS_PROTO.CV.POINT_PER_DIPLOMA;
    return parseFloat(cvScore.toFixed(2));
}

function getCvLevelProto(cvValueScore) {
    const level = { name: "Inconnu" };
    if (cvValueScore >= COEFFICIENTS_PROTO.CV.SEUIL_SENIOR) {
        level.name = "Senior";
    } else if (cvValueScore >= COEFFICIENTS_PROTO.CV.SEUIL_MIDDLE) {
        level.name = "Middle";
    } else {
        level.name = "Junior";
    }
    return level;
}

function calculateTotalUtmiProto(interactions) {
    let totalUtmi = 0;
    interactions.forEach(interaction => {
        let utmi = 0;
        const wordCount = interaction.content ? interaction.content.split(/\s+/).length : 0;
        utmi += wordCount * COEFFICIENTS_PROTO.UTMI.BASE_PER_WORD;
        utmi *= (interaction.complexity || 1) * COEFFICIENTS_PROTO.UTMI.COMPLEXITY_MULTIPLIER;
        utmi *= (interaction.impact || 1) * COEFFICIENTS_PROTO.UTMI.IMPACT_MULTIPLIER;
        totalUtmi += utmi;
    });
    return parseFloat(totalUtmi.toFixed(2));
}

function calculateMonthlyUniversalIncomeProto(cvValueScore, cvLevelData, totalUtmi) {
    let income = 0;
    income += cvValueScore * COEFFICIENTS_PROTO.REVENU.BASE_INCOME_PER_CV_POINT_EUR;
    income += totalUtmi * COEFFICIENTS_PROTO.REVENU.BASE_INCOME_PER_UTMI_EUR;

    if (cvLevelData.name === "Senior") {
        income += COEFFICIENTS_PROTO.REVENU.SENIOR_BONUS_EUR;
    } else if (cvLevelData.name === "Middle") {
        income += COEFFICIENTS_PROTO.REVENU.MIDDLE_BONUS_EUR;
    } else if (cvLevelData.name === "Junior") {
        income += COEFFICIENTS_PROTO.REVENU.JUNIOR_BONUS_EUR;
    }

    if (COEFFICIENTS_PROTO.REVENU.MAX_MONTHLY_INCOME_EUR && income > COEFFICIENTS_PROTO.REVENU.MAX_MONTHLY_INCOME_EUR) {
        income = COEFFICIENTS_PROTO.REVENU.MAX_MONTHLY_INCOME_EUR;
    }
    return parseFloat(income.toFixed(2));
}
// --- FIN DES FONCTIONS DE CALCUL SIMPLIFIÉES ---

const app = express();
const port = 3000; // Port du serveur

// --- Middlewares ---
app.use(cors()); // Permet les requêtes cross-origin (utile pour le développement)
app.use(express.json()); // Permet de parser le corps des requêtes JSON

// --- Variables en mémoire pour le prototype (Pas de base de données) ---
let currentCvStructuredData = null; // Stocke le dernier CV structuré en mémoire
let mockInteractionLogs = []; // Simule des logs d'interaction pour le calcul d'UTMi

// --- API Endpoints Simplifiés ---

// API pour l'interaction ponctuelle IA (Générer Réponse)
app.post('/api/generate', async (req, res) => {
    const { prompt } = req.body;
    if (!prompt) {
        return res.status(400).json({ error: "Le prompt est requis." });
    }

    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { role: "user", content: prompt }
            ],
            model: "llama3-8b-8192", // Modèle Groq
            temperature: 0.7,
            max_tokens: 100,
        });

        const aiResponse = chatCompletion.choices[0]?.message?.content || "Aucune réponse de l'IA.";

        // Enregistrement simplifié de l'interaction pour UTMi
        mockInteractionLogs.push({
            type: 'prompt_response',
            content: prompt + " " + aiResponse, // Contenu combiné pour le calcul
            complexity: 1.0, // Simulé
            impact: 1.0,     // Simulé
            timestamp: new Date().toISOString()
        });

        res.json({ response: aiResponse });

    } catch (error) {
        console.error("Erreur lors de la génération de la réponse IA:", error);
        res.status(500).json({ error: "Erreur lors de la génération de la réponse IA." });
    }
});

// API pour structurer le CV
app.post('/api/cv/parse-and-structure', (req, res) => {
    const { cvText } = req.body;
    if (!cvText) {
        return res.status(400).json({ error: "Le texte du CV est requis." });
    }

    try {
        const structuredCv = parseAndStructureCvProto(cvText);
        currentCvStructuredData = structuredCv; // Stocke en mémoire
        res.json(structuredCv);
    } catch (error) {
        console.error("Erreur lors de la structuration du CV:", error);
        res.status(500).json({ error: "Erreur lors de la structuration du CV." });
    }
});

// API pour récupérer le dernier CV structuré (en mémoire)
app.get('/api/cv/last-structured-data', (req, res) => {
    if (currentCvStructuredData) {
        res.json(currentCvStructuredData);
    } else {
        res.status(404).json({ message: 'Aucune donnée de CV structurée n\'est disponible pour le moment.' });
    }
});

// API pour calculer la valeur du CVNU
app.post('/api/cv/calculate-value', (req, res) => {
    const { cvStructuredData } = req.body;
    if (!cvStructuredData) {
        return res.status(400).json({ error: "Les données de CV structurées sont requises." });
    }

    try {
        const initialCvValue = calculateInitialCvValueProto(cvStructuredData);
        const cvLevel = getCvLevelProto(initialCvValue).name; // Obtenir le nom du niveau
        const totalUtmi = calculateTotalUtmiProto(mockInteractionLogs); // Utilise les logs simulés
        const estimatedMonthlyUniversalIncomeEUR = calculateMonthlyUniversalIncomeProto(initialCvValue, { name: cvLevel }, totalUtmi);

        res.json({
            initialCvValue,
            cvLevel,
            estimatedMonthlyUniversalIncomeEUR
        });
    } catch (error) {
        console.error("Erreur lors du calcul de la valeur CVNU:", error);
        res.status(500).json({ error: "Erreur lors du calcul de la valeur CVNU." });
    }
});

// API pour les insights du tableau de bord (très simplifié)
app.get('/api/dashboard-insights', (req, res) => {
    // Calculs simplifiés pour le dashboard
    const totalUtmi = calculateTotalUtmiProto(mockInteractionLogs);
    let initialCapitalEUR = 0;
    let monthlyUniversalIncomeEUR = 0;

    if (currentCvStructuredData) {
        const cvValue = calculateInitialCvValueProto(currentCvStructuredData);
        const cvLevel = getCvLevelProto(cvValue);
        initialCapitalEUR = cvValue * COEFFICIENTS_PROTO.REVENU.BASE_INCOME_PER_CV_POINT_EUR; // Simple mapping
        monthlyUniversalIncomeEUR = calculateMonthlyUniversalIncomeProto(cvValue, cvLevel, totalUtmi);
    }

    // Solde de trésorerie simplifié : une accumulation fictive basée sur le revenu mensuel
    // Dans un système réel, cela serait une somme persistante de tous les revenus générés.
    const treasuryBalanceEUR = monthlyUniversalIncomeEUR * (mockInteractionLogs.length > 0 ? 1 : 0); // Accumule si des interactions ont eu lieu


    // Métriques supplémentaires très simplifiées ou fictives
    const totalInteractionCount = mockInteractionLogs.length;
    const totalEstimatedCostUSD = (totalUtmi / 100) * 0.1; // Coût fictif basé sur UTMi
    const totalEstimatedCostEUR = totalEstimatedCostUSD / COEFFICIENTS_PROTO.EXCHANGE_RATES.USD;

    res.json({
        totalUtmi: totalUtmi,
        initialCapitalEUR: parseFloat(initialCapitalEUR.toFixed(2)),
        monthlyUniversalIncomeEUR: parseFloat(monthlyUniversalIncomeEUR.toFixed(2)),
        treasuryBalanceEUR: parseFloat(treasuryBalanceEUR.toFixed(2)),
        totalEstimatedCostUSD: parseFloat(totalEstimatedCostUSD.toFixed(6)),
        totalEstimatedCostEUR: parseFloat(totalEstimatedCostEUR.toFixed(6)),
        totalInteractionCount: totalInteractionCount,
        averageUtmiPerInteraction: totalInteractionCount > 0 ? parseFloat((totalUtmi / totalInteractionCount).toFixed(2)) : 0,
        totalUtmiPerCostRatio: totalEstimatedCostEUR > 0 ? parseFloat((totalUtmi / totalEstimatedCostEUR).toFixed(2)) : 0,
        // Autres données simplifiées (ou vides pour ce prototype)
        utmiByType: [],
        utmiByModel: [],
        utmiPerCostRatioByModel: [],
        utmiByCognitiveAxis: [],
        thematicUtmi: { marketing: 0, affiliation: 0, fiscalEconomic: 0 },
        mostValuableTopics: [],
        mostCommonActivities: [],
        exchangeRates: COEFFICIENTS_PROTO.EXCHANGE_RATES
    });
});


// --- Servir les fichiers statiques du dossier 'public' ---
app.use(express.static(path.join(__dirname, 'public')));

// --- Route par défaut pour l'application SPA (Single Page Application) ---
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- Démarrage du serveur ---
app.listen(port, () => {
    console.log(`\n🚀 Serveur prototype démarré sur http://localhost:${port}`);
    console.log(`Accédez à l'interface principale : http://localhost:${port}/`);
    console.log(`\nATTENTION: Ce serveur est un PROTOTYPE SIMPLIFIÉ et ne gère PAS la persistance des données.`);
    console.log(`Les données (CV, logs d'interactions) seront réinitialisées à chaque redémarrage.`);
    console.log(`N'oubliez pas de remplacer 'VOTRE_CLE_API_GROQ_ICI' par votre clé API Groq réelle.`);
});