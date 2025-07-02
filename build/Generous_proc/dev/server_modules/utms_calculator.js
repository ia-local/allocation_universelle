// server_modules/utms_calculator.js - Version mise à jour pour Monétisation Diffeérenciée & Taxe IA
// et Valorisation Granulaire Sans Coût Utilisateur

/**
 * Moteur de calcul des Unités Temporelles Monétisables (UTMi) et d'analyse des insights.
 * Cette version intègre :
 * - La valorisation des interactions et activités, désormais différenciée par niveau de CVNU.
 * - L'analyse des données historiques (logs) pour générer des rapports d'insights détaillés.
 * - La prise en compte des attributs CVNU et du contexte économique.
 * - L'implémentation du concept de Taxe IA.
 * - La consolidation des logs et la détection des thématiques (marketing, affiliation, fiscale/économique).
 * - Prise en compte de la qualité des modèles d'IA.
 * - Optimisé pour collecter plus de données pour le calcul UTMi et la valorisation multi-devises.
 * - Ajout des concepts de Capital de départ du CV et de Revenu Universel Mensuel progressif.
 * - **IMPORTANT : Valorisation granulaire des interactions (lettre, mot, phrase, prompt, code, média) sans déduction directe des coûts pour l'utilisateur.**
 */

// Importation des scores de qualité des modèles (assurez-vous que ce fichier existe et est à jour)
const { MODEL_QUALITY_SCORES } = require('./model_quality_config');

// --- Coefficients de Valorisation (ajustables) ---
const COEFFICIENTS = {
    TIME_PER_SECOND_UTMI: 0.1, // Valeur de base d'une seconde en UTMi
    COMPLEXITY_FACTOR: { // Facteurs pour ajuster les UTMi selon la complexité
        LOW: 0.8,
        MEDIUM: 1.0,
        HIGH: 1.2,
        CODE: 1.5,
        MEDIA: 1.8 // Pour les interactions générant ou analysant des médias
    },
    // Valorisation granulaire (UTMi par unité)
    UTMI_PER_CHARACTER: 0.005,
    UTMI_PER_WORD: 0.02,
    UTMI_PER_SENTENCE: 0.05,
    UTMI_PER_LINE_CODE: 0.1,
    UTMI_PER_IMAGE: 5.0, // Estimation pour la génération ou l'analyse d'une image
    UTMI_PER_MINUTE_VIDEO: 10.0, // Estimation pour la génération ou l'analyse vidéo

    // Coûts estimés (pour information, non déduits de l'utilisateur)
    COST_PER_UTMI_EUR: 0.0001, // Coût estimé d'un UTMi en EUR (très faible)

    // Taux de change (exemples, à obtenir via une API de taux de change réel si production)
    EXCHANGE_RATES: {
        EUR_TO_UTMI: 10000, // 1 EUR = 10000 UTMi
        USD_TO_UTMI: 9000,
        GBP_TO_UTMI: 11000
    },

    // Points d'Impact (PI Points) pour la contribution au CVNU et à la plateforme
    PI_POINTS_PER_UTMI: 0.01, // Chaque UTMi génère 0.01 PI Points

    // Coefficients pour le Revenu Universel Mensuel (R.U.M)
    RUM_COEFFICIENTS: {
        BASE_INCOME_PER_CV_POINT_EUR: 0.001, // 0.001 EUR par point de CVNU
        BASE_INCOME_PER_UTMI_EUR: 0.000005, // 0.000005 EUR par UTMi généré
        JUNIOR_BONUS_EUR: 10.00,
        MIDDLE_BONUS_EUR: 25.00,
        SENIOR_BONUS_EUR: 50.00,
        MAX_MONTHLY_INCOME_EUR: 500.00 // Plafond pour le R.U.M (ajustable)
    },

    // Récompenses "Citizen"
    CITIZEN_REWARD_PER_PI_POINT_EUR: 0.005, // Récompense en EUR par PI Point
    ACTIVITY_SCORE_WEIGHT: 0.05, // Pondération des UTMi pour le score d'activité
};

// --- Données simulées (en production, elles viendraient d'une BDD) ---
const userLogs = []; // Stocke toutes les interactions valorisées
let currentTreasuryBalanceEUR = 1000000.00; // Solde initial de la trésorerie IA (plateforme)
let lastStructuredCvData = null; // Stocke la dernière version du CV structuré pour la persistance

/**
 * Simule la conversion de valeur en EUR à partir d'UTMi ou d'autres métriques.
 * @param {number} value La valeur à convertir.
 * @param {string} unit L'unité de la valeur ('UTMi', 'PI_Points', etc.).
 * @returns {number} La valeur convertie en EUR.
 */
function convertValueToEUR(value, unit) {
    let eurValue = 0;
    switch (unit) {
        case 'UTMi':
            eurValue = value * COEFFICIENTS.COST_PER_UTMI_EUR;
            break;
        case 'PI_Points':
            eurValue = value * COEFFICIENTS.CITIZEN_REWARD_PER_PI_POINT_EUR;
            break;
        default:
            eurValue = value; // Si l'unité est déjà EUR
    }
    return parseFloat(eurValue.toFixed(6)); // Précision pour les petites valeurs
}

/**
 * Détermine le type d'interaction en se basant sur le prompt.
 * Plus de types peuvent être ajoutés.
 * @param {string} prompt Le texte de l'interaction.
 * @returns {string} Le type d'interaction détecté.
 */
function determineInteractionType(prompt) {
    prompt = prompt.toLowerCase();
    if (prompt.includes('code') || prompt.includes('script') || prompt.includes('fonction') || prompt.includes('développer')) {
        return 'Code_Generation';
    }
    if (prompt.includes('analyse') || prompt.includes('résumé') || prompt.includes('expliqu') || prompt.includes('décris')) {
        return 'Information_Retrieval_Analysis';
    }
    if (prompt.includes('créer') || prompt.includes('génér') || prompt.includes('écri')) {
        return 'Content_Creation';
    }
    if (prompt.includes('optimis') || prompt.includes('amélior') || prompt.includes('corrig')) {
        return 'Optimization_Refinement';
    }
    if (prompt.includes('image') || prompt.includes('dessin') || prompt.includes('photo') || prompt.includes('visuel')) {
        return 'Media_Generation_Analysis';
    }
    if (prompt.includes('video') || prompt.includes('montage') || prompt.includes('film')) {
        return 'Media_Generation_Analysis'; // Peut être affiné en 'Video_Generation_Analysis'
    }
    return 'General_Interaction';
}

/**
 * Détecte l'axe cognitif principal de l'interaction.
 * @param {string} prompt Le texte de l'interaction.
 * @returns {string} L'axe cognitif détecté.
 */
function detectCognitiveAxis(prompt) {
    prompt = prompt.toLowerCase();
    if (prompt.includes('stratégie') || prompt.includes('planification') || prompt.includes('décision') || prompt.includes('gestion')) {
        return 'Strategic_Planning';
    }
    if (prompt.includes('analyse') || prompt.includes('données') || prompt.includes('statistiques') || prompt.includes('recherche')) {
        return 'Analytical_Reasoning';
    }
    if (prompt.includes('création') || prompt.includes('design') || prompt.includes('innovation') || prompt.includes('développement') || prompt.includes('imaginer')) {
        return 'Creative_Innovation';
    }
    if (prompt.includes('communication') || prompt.includes('présentation') || prompt.includes('rédaction') || prompt.includes('persuasion')) {
        return 'Communication_Expression';
    }
    if (prompt.includes('problème') || prompt.includes('résoudre') || prompt.includes('dépannage') || prompt.includes('logique')) {
        return 'Problem_Solving';
    }
    if (prompt.includes('apprentissage') || prompt.includes('formation') || prompt.includes('comprendre') || prompt.includes('expliquer')) {
        return 'Learning_Knowledge';
    }
    return 'General_Cognition';
}

/**
 * Détermine la thématique principale de l'interaction.
 * @param {string} text Le texte à analyser (prompt ou réponse).
 * @returns {string} La thématique principale.
 */
function determineThematicFocus(text) {
    const lowerText = text.toLowerCase();
    if (lowerText.includes('marketing') || lowerText.includes('publicité') || lowerText.includes('seo') || lowerText.includes('branding') || lowerText.includes('campagne')) {
        return 'Marketing';
    }
    if (lowerText.includes('affiliation') || lowerText.includes('partenariat') || lowerText.includes('commission') || lowerText.includes('affilié')) {
        return 'Affiliation';
    }
    if (lowerText.includes('fiscal') || lowerText.includes('impôt') || lowerText.includes('économie') || lowerText.includes('finance') || lowerText.includes('investissement') || lowerText.includes('comptabilité')) {
        return 'Fiscal_Economic';
    }
    if (lowerText.includes('code') || lowerText.includes('javascript') || lowerText.includes('python') || lowerText.includes('développement') || lowerText.includes('logiciel')) {
        return 'Code_Programming';
    }
    if (lowerText.includes('média') || lowerText.includes('image') || lowerText.includes('vidéo') || lowerText.includes('audio') || lowerText.includes('design')) {
        return 'Media_Content';
    }
    // Ajoutez d'autres thématiques si nécessaire
    return 'General_Thematic';
}

/**
 * Analyse le sentiment d'un texte (simplifié).
 * @param {string} text Le texte à analyser.
 * @returns {string} Le sentiment ('Positif', 'Neutre', 'Négatif').
 */
function analyzeTextForSentiment(text) {
    const lowerText = text.toLowerCase();
    if (lowerText.includes('excellent') || lowerText.includes('super') || lowerText.includes('merci') || lowerText.includes('parfait')) {
        return 'Positif';
    }
    if (lowerText.includes('erreur') || lowerText.includes('problème') || lowerText.includes('non') || lowerText.includes('mauvais')) {
        return 'Négatif';
    }
    return 'Neutre';
}

/**
 * Simule la valorisation de termes spécifiques dans un texte.
 * @param {string} text Le texte à analyser.
 * @returns {number} La valeur en UTMi basée sur les termes.
 */
function analyzeTextForTermValuation(text) {
    let termUtmi = 0;
    const lowerText = text.toLowerCase();
    const valuableTerms = {
        'blockchain': 10, 'ia': 8, 'cybersecurity': 9, 'data science': 7,
        'quantique': 12, 'biotechnologie': 11, 'neuroscience': 10
    };

    for (const term in valuableTerms) {
        if (lowerText.includes(term)) {
            termUtmi += valuableTerms[term];
        }
    }
    return termUtmi;
}

/**
 * Calcule les UTMi générés par une interaction granulaire.
 * Cette fonction ne déduit PAS de coût pour l'utilisateur. Elle valorise la contribution.
 * @param {object} params Paramètres de l'interaction (prompt, response, durationMs, modelUsed, customInputType, outputLength)
 * @returns {object} Résultat UTMi et coût estimé.
 */
function calculateUtmi(params) {
    const { prompt, response, durationMs, modelUsed, customInputType, outputLength } = params;

    const numCharacters = (response ? response.length : 0);
    const numWords = (response ? response.split(/\s+/).filter(word => word.length > 0).length : 0);
    const numSentences = (response ? response.split(/[.!?]+/).filter(s => s.trim().length > 0).length : 0);
    const numLinesCode = (customInputType === 'code' && response ? response.split('\n').length : 0);

    let baseUtmi = 0;

    // Valorisation granulaire basée sur la réponse générée
    baseUtmi += numCharacters * COEFFICIENTS.UTMI_PER_CHARACTER;
    baseUtmi += numWords * COEFFICIENTS.UTMI_PER_WORD;
    baseUtmi += numSentences * COEFFICIENTS.UTMI_PER_SENTENCE;

    if (customInputType === 'code') {
        baseUtmi += numLinesCode * COEFFICIENTS.UTMI_PER_LINE_CODE;
    } else if (customInputType === 'image') {
        baseUtmi += COEFFICIENTS.UTMI_PER_IMAGE;
    } else if (customInputType === 'video') {
        // Supposons une durée moyenne pour une vidéo courte si non spécifiée
        const videoDurationMinutes = params.videoDurationMinutes || 1;
        baseUtmi += videoDurationMinutes * COEFFICIENTS.UTMI_PER_MINUTE_VIDEO;
    }

    // Facteur de complexité basé sur le type d'interaction ou la longueur de la réponse
    let complexityFactor = COEFFICIENTS.COMPLEXITY_FACTOR.MEDIUM;
    if (numWords > 500 || numLinesCode > 100) complexityFactor = COEFFICIENTS.COMPLEXITY_FACTOR.HIGH;
    if (customInputType === 'code') complexityFactor = COEFFICIENTS.COMPLEXITY_FACTOR.CODE;
    if (customInputType === 'media') complexityFactor = COEFFICIENTS.COMPLEXITY_FACTOR.MEDIA;

    // Facteur de qualité du modèle
    // Assurez-vous que MODEL_QUALITY_SCORES est bien défini et contient le modelUsed
    const modelQualityScore = MODEL_QUALITY_SCORES[modelUsed] || MODEL_QUALITY_SCORES['default'];
    if (typeof modelQualityScore === 'undefined' || modelQualityScore === null) {
        console.warn(`[UTMi Calc] Model quality score for '${modelUsed}' is undefined or null. Using default.`);
        modelQualityScore = MODEL_QUALITY_SCORES['default'];
    }

    let utmiResult = baseUtmi * complexityFactor * modelQualityScore;

    // Ajout d'UTMi basés sur le temps de traitement (pour les interactions très longues)
    utmiResult += (durationMs / 1000) * COEFFICIENTS.TIME_PER_SECOND_UTMI;

    // Ajout d'UTMi pour la valorisation sémantique des termes
    utmiResult += analyzeTextForTermValuation(prompt) + analyzeTextForTermValuation(response);

    const estimatedCostEUR = utmiResult * COEFFICIENTS.COST_PER_UTMI_EUR;
    const piPointsGenerated = utmiResult * COEFFICIENTS.PI_POINTS_PER_UTMI;

    return {
        utmi: parseFloat(utmiResult.toFixed(2)),
        estimatedCostEUR: parseFloat(estimatedCostEUR.toFixed(6)),
        piPoints: parseFloat(piPointsGenerated.toFixed(2)),
        details: {
            numCharacters, numWords, numSentences, numLinesCode,
            complexityFactor: complexityFactor,
            modelQualityScore: modelQualityScore,
            baseUtmi: parseFloat(baseUtmi.toFixed(2))
        }
    };
}

/**
 * Met à jour le solde UTMi de l'utilisateur et la trésorerie de la plateforme.
 * Enregistre également un log de l'interaction.
 * @param {string} userId ID de l'utilisateur.
 * @param {object} utmiResult Le résultat du calcul UTMi.
 * @param {string} prompt Le prompt de l'utilisateur.
 * @param {string} response La réponse de l'IA.
 * @param {string} modelUsed Le modèle d'IA utilisé.
 * @param {number} durationMs La durée de traitement en ms.
 * @returns {object} Le log de l'interaction.
 */
function updateUtmi(userId, utmiResult, prompt, response, modelUsed, durationMs) {
    const logEntry = {
        timestamp: new Date().toISOString(),
        userId: userId,
        prompt: prompt,
        response: response,
        modelUsed: modelUsed,
        durationMs: durationMs,
        utmiResult: utmiResult,
        interactionType: determineInteractionType(prompt),
        cognitiveAxis: detectCognitiveAxis(prompt),
        thematicFocus: determineThematicFocus(prompt + ' ' + response), // Analyse du prompt et de la réponse
        sentiment: analyzeTextForSentiment(response) // Sentiment de la réponse
    };
    userLogs.push(logEntry);

    // Déduction de la trésorerie de la plateforme (coût de l'IA)
    currentTreasuryBalanceEUR -= utmiResult.estimatedCostEUR;

    return logEntry;
}


/**
 * Calcule les insights du tableau de bord à partir des logs.
 * @returns {object} Les données agrégées pour le tableau de bord.
 */
function calculateDashboardInsights() {
    let totalUtmi = 0;
    let totalInteractionCount = userLogs.length;
    let totalEstimatedCostEUR = 0;
    let totalPiPoints = 0;

    const utmiByType = {};
    const utmiByModel = {};
    const utmiPerCostRatioByModel = {};
    const utmiByCognitiveAxis = {};
    const thematicUtmi = {};
    const modelCosts = {}; // Pour calculer le ratio

    const topicCounts = {}; // Pour les sujets les plus valorisés
    const activityCounts = {}; // Pour les activités courantes

    userLogs.forEach(log => {
        const utmi = log.utmiResult.utmi;
        const cost = log.utmiResult.estimatedCostEUR;
        const piPoints = log.utmiResult.piPoints;

        totalUtmi += utmi;
        totalEstimatedCostEUR += cost;
        totalPiPoints += piPoints;

        // UTMi par type d'interaction
        utmiByType[log.interactionType] = (utmiByType[log.interactionType] || 0) + utmi;

        // UTMi par modèle IA
        utmiByModel[log.modelUsed] = (utmiByModel[log.modelUsed] || 0) + utmi;
        modelCosts[log.modelUsed] = (modelCosts[log.modelUsed] || 0) + cost;

        // UTMi par axe cognitif
        utmiByCognitiveAxis[log.cognitiveAxis] = (utmiByCognitiveAxis[log.cognitiveAxis] || 0) + utmi;

        // UTMi par thématique
        thematicUtmi[log.thematicFocus] = (thematicUtmi[log.thematicFocus] || 0) + utmi;

        // Compter les sujets (simplifié par le prompt principal)
        const simplifiedTopic = log.prompt.substring(0, 50).trim() + '...';
        topicCounts[simplifiedTopic] = (topicCounts[simplifiedTopic] || 0) + utmi;

        // Compter les activités
        activityCounts[log.interactionType] = (activityCounts[log.interactionType] || 0) + 1;
    });

    // Calculer le ratio UTMi/Coût par modèle
    for (const model in utmiByModel) {
        if (modelCosts[model] > 0) {
            utmiPerCostRatioByModel[model] = utmiByModel[model] / modelCosts[model];
        } else {
            utmiPerCostRatioByModel[model] = utmiByModel[model]; // Si coût zéro, le ratio est juste l'UTMi
        }
    }

    const averageUtmiPerInteraction = totalInteractionCount > 0 ? totalUtmi / totalInteractionCount : 0;
    const totalUtmiPerCostRatio = totalEstimatedCostEUR > 0 ? totalUtmi / totalEstimatedCostEUR : 0;

    // Trier les top 5
    const mostValuableTopics = Object.entries(topicCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([topic, utmi]) => ({ [topic]: utmi }));

    const mostCommonActivities = Object.entries(activityCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([activity, count]) => ({ [activity]: count }));

    // Obtenir la valeur actuelle du CVNU et le niveau
    const cvValueScore = calculateInitialCvValue(); // Assurez-vous que cette fonction retourne le score
    const cvLevelData = getCvLevel(cvValueScore);
    const cvLevel = cvLevelData.level;

    // Calcul du R.U.M
    const monthlyUniversalIncomeEUR = calculateMonthlyUniversalIncome(cvValueScore, totalUtmi, cvLevelData);


    return {
        totalUtmi: totalUtmi,
        totalInteractionCount: totalInteractionCount,
        averageUtmiPerInteraction: averageUtmiPerInteraction,
        totalUtmiPerCostRatio: totalUtmiPerCostRatio,
        utmiByType: utmiByType,
        utmiByModel: utmiByModel,
        utmiPerCostRatioByModel: utmiPerCostRatioByModel,
        utmiByCognitiveAxis: utmiByCognitiveAxis,
        thematicUtmi: thematicUtmi, // Inclure les thématiques
        mostValuableTopics: mostValuableTopics,
        mostCommonActivities: mostCommonActivities,
        exchangeRates: COEFFICIENTS.EXCHANGE_RATES,
        totalPiPoints: totalPiPoints,
        cvValueScore: cvValueScore,
        cvLevel: cvLevel,
        monthlyUniversalIncomeEUR: monthlyUniversalIncomeEUR,
        treasuryBalanceEUR: currentTreasuryBalanceEUR,
        logs: userLogs // Retourne les logs pour l'historique du portefeuille
    };
}


/**
 * Simule le calcul des récompenses "Citizen" (pour le portefeuille).
 * @param {number} piPoints Le total des PI Points de l'utilisateur.
 * @returns {number} La récompense estimée en EUR.
 */
function calculateCityzenReward(piPoints) {
    return parseFloat((piPoints * COEFFICIENTS.CITIZEN_REWARD_PER_PI_POINT_EUR).toFixed(2));
}

/**
 * Simule le calcul du score d'activité.
 * @param {number} totalUtmi Le total des UTMi générés par l'utilisateur.
 * @returns {number} Le score d'activité.
 */
function calculateActivityScore(totalUtmi) {
    return parseFloat((totalUtmi * COEFFICIENTS.ACTIVITY_SCORE_WEIGHT).toFixed(0));
}

/**
 * Calcule les UTMi courants et les PI Points pour l'affichage du portefeuille.
 * @returns {object} Les UTMi et PI Points cumulés.
 */
function calculateCurrentUTMAndPIPoints() {
    let currentUtmi = 0;
    let currentPiPoints = 0;
    userLogs.forEach(log => {
        currentUtmi += log.utmiResult.utmi;
        currentPiPoints += log.utmiResult.piPoints;
    });
    return {
        utmiBalance: parseFloat(currentUtmi.toFixed(2)),
        piPointsBalance: parseFloat(currentPiPoints.toFixed(2))
    };
}

/**
 * Calcule la valeur initiale ou mise à jour du CVNU (Capital).
 * Ceci est une fonction simplifiée. Dans une vraie application, elle analyserait le CV structuré.
 * Pour ce prototype, elle peut se baser sur les PI Points générés.
 * @returns {number} La valeur du CV en points.
 */
function calculateInitialCvValue() {
    const { piPointsBalance } = calculateCurrentUTMAndPIPoints();
    // Par exemple, la valeur du CV pourrait être les PI Points accumulés, ou une autre logique
    // Pour l'instant, faisons simple : 1 PI Point = 1 point de CV.
    // Vous pouvez ajouter une logique plus complexe ici basée sur le contenu du CV structuré.
    return parseFloat(piPointsBalance.toFixed(2));
}

/**
 * Détermine le niveau du CV (Junior, Middle, Senior) basé sur un score.
 * @param {number} cvValueScore Le score de valeur du CV.
 * @returns {object} Un objet indiquant le niveau et les booléens correspondants.
 */
function getCvLevel(cvValueScore) {
    let level = 'Junior';
    let junior = true;
    let middle = false;
    let senior = false;

    if (cvValueScore >= 500) {
        level = 'Senior';
        senior = true;
        junior = false;
    } else if (cvValueScore >= 100) {
        level = 'Moyen';
        middle = true;
        junior = false;
    }

    return { level, junior, middle, senior };
}

/**
 * Calcule le Revenu Universel Mensuel (R.U.M) estimé.
 * @param {number} cvValueScore La valeur du CVNU.
 * @param {number} totalUtmi Le total des UTMi générés.
 * @param {object} cvLevelData Les données du niveau de CV (retourné par getCvLevel).
 * @returns {number} Le R.U.M estimé en EUR.
 */
function calculateMonthlyUniversalIncome(cvValueScore, totalUtmi, cvLevelData) {
    const incomeCoeff = COEFFICIENTS.RUM_COEFFICIENTS;
    let income = 0;

    // Revenu basé sur la valeur du CV
    income += cvValueScore * incomeCoeff.BASE_INCOME_PER_CV_POINT_EUR;

    // Revenu basé sur les UTMi cumulés (revalorisation des interactions)
    income += totalUtmi * incomeCoeff.BASE_INCOME_PER_UTMI_EUR;

    // Bonus selon le niveau du CV
    if (cvLevelData.senior) {
        income += incomeCoeff.SENIOR_BONUS_EUR;
    } else if (cvLevelData.middle) {
        income += incomeCoeff.MIDDLE_BONUS_EUR;
    } else if (cvLevelData.junior) {
        income += incomeCoeff.JUNIOR_BONUS_EUR;
    }

    // Appliquer un plafond si défini
    if (incomeCoeff.MAX_MONTHLY_INCOME_EUR && income > incomeCoeff.MAX_MONTHLY_INCOME_EUR) {
        income = incomeCoeff.MAX_MONTHLY_INCOME_EUR;
    }

    return parseFloat(income.toFixed(2));
}

// --- Exportation des fonctions et coefficients ---
module.exports = {
    calculateUtmi,
    updateUtmi,
    calculateCityzenReward,
    calculateActivityScore,
    calculateCurrentUTMAndPIPoints,
    convertValueToEUR,
    determineInteractionType,
    detectCognitiveAxis,
    determineThematicFocus,
    analyzeTextForSentiment,
    analyzeTextForTermValuation,
    calculateDashboardInsights,
    calculateInitialCvValue,
    getCvLevel,
    calculateMonthlyUniversalIncome,
    COEFFICIENTS, // Exporter les coefficients pour référence
    userLogs, // Exporter les logs pour l'accès direct si nécessaire
    lastStructuredCvData, // Exporter les dernières données structurées du CV
};