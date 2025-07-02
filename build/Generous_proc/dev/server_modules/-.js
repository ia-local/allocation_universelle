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
    TIME_PER_SECOND_UTMI: 0.1, // Valeur de base d'une seconde en UTMi (pour le calcul d'UTMi
                               // basé sur le temps d'interaction/réponse)

    PROMPT: {
        BASE_UTMI_PER_WORD: 0.5,
        COMPLEXITY_MULTIPLIER: 1.2,
        IMPACT_MULTIPLIER: 1.5,
        UNIQUE_CONCEPT_BONUS: 5,
        FISCAL_ECONOMIC_TOPIC_BONUS: 3,
        METIER_RELATED_PROMPT_BONUS: 2,
        // NOUVEAU: Bonus pour les prompts liés à l'apprentissage ou la professionnalisation
        LEARNING_PROFESSIONALIZATION_PROMPT_BONUS: 4,
    },

    RESPONSE: {
        BASE_UTMI_PER_WORD: 0.7,
        QUALITY_MULTIPLIER: 1.3, // Basé sur MODEL_QUALITY_SCORES
        RELEVANCE_MULTIPLIER: 1.2,
        DETAIL_BONUS: 3,
        SYNTHESIS_BONUS: 2,
        // NOUVEAU: Bonus pour les réponses structurées (ex: JSON, code)
        STRUCTURED_RESPONSE_BONUS: 5,
    },

    ACTIVITY_SCORES: { // Coeffs pour le calcul des scores d'activité
        CHAT_MESSAGE: 0.2, // UTMi par message de chat
        CV_GENERATION: 10, // UTMi par génération/mise à jour de CV
        DASHBOARD_VIEW: 0.5, // UTMi par vue de tableau de bord
        FILE_UPLOAD: 1, // UTMi par fichier uploadé
        API_CALL: 0.1, // UTMi par appel API générique
        // NOUVEAU: Coefficients pour les activités de formation et d'auto-amélioration
        LEARNING_ACTIVITY: 5,
        SELF_IMPROVEMENT_ACTIVITY: 7,
    },

    CV_VALUATION: { // Coefficients pour la valorisation du CV
        BASE_CV_POINT_PER_WORD: 0.1,
        EXPERIENCE_MULTIPLIER_YEAR: 0.5, // Par année d'expérience
        SKILL_BONUS_HIGH_DEMAND: 20, // Bonus pour compétences très demandées
        CERTIFICATION_BONUS: 15,
        PROJECT_IMPACT_MULTIPLIER: 1.5, // Influence de l'impact des projets
        EDUCATION_LEVEL_BONUS: { // NOUVEAU: Bonus par niveau d'éducation
            BACHELOR: 10,
            MASTER: 20,
            PHD: 30,
        },
        LANGUAGE_BONUS_PER_LEVEL: 5, // Bonus par langue et niveau
    },

    INCOME_MODEL: { // NOUVEAU: Coefficients pour le Revenu Universel Mensuel
        BASE_INCOME_PER_CV_POINT_EUR: 0.05, // € par point de CV
        BASE_INCOME_PER_UTMI_EUR: 0.001, // € par UTMi cumulé
        JUNIOR_BONUS_EUR: 50,
        MIDDLE_BONUS_EUR: 150,
        SENIOR_BONUS_EUR: 300,
        MAX_MONTHLY_INCOME_EUR: 1500, // Plafond pour l'exemple
    },

    TREASURY: { // NOUVEAU: Coefficients pour le capital de départ et la trésorerie
        INITIAL_CV_VALUE_TO_CAPITAL_RATIO: 0.1, // % de la valeur initiale du CV convertie en capital
        UTMI_TO_TREASURY_CONVERSION_RATE: 0.005, // € générés par UTMi pour la trésorerie
        TAX_IA_RATE: 0.02, // 2% de taxe sur la valeur générée par l'IA (pour l'écosystème)
    },

    EXCHANGE_RATES: { // Taux de change (exemples, à mettre à jour via une API réelle)
        USD: 1.08,
        GBP: 0.85,
        JPY: 169.20,
    },
    // Ajout d'une notion de "coût" pour la Taxe IA si applicable dans un modèle économique réel
    // Ici, nous nous concentrons sur la monétisation pour l'utilisateur
};

// --- Historique des logs pour le dashboard (stockage temporaire en mémoire pour l'exemple) ---
const interactionLogs = [];

/**
 * Détermine le type d'interaction basé sur le prompt et la réponse.
 * Ceci est une simplification; une implémentation réelle utiliserait des modèles NLP plus avancés.
 * @param {string} prompt - Le prompt de l'utilisateur.
 * @param {string} response - La réponse de l'IA.
 * @returns {string} Le type d'interaction (e.g., 'question', 'generation', 'code', 'data_analysis', etc.).
 */
function determineInteractionType(prompt, response) {
    prompt = prompt.toLowerCase();
    response = response.toLowerCase();

    if (prompt.includes("code") || prompt.includes("développe") || prompt.includes("fonction")) {
        return "code_generation";
    }
    if (prompt.includes("analyse") || prompt.includes("données") || prompt.includes("rapport")) {
        return "data_analysis";
    }
    if (prompt.includes("résume") || prompt.includes("synthétise")) {
        return "summarization";
    }
    if (prompt.includes("traduis")) {
        return "translation";
    }
    if (prompt.includes("écris") || prompt.includes("rédige")) {
        return "text_generation";
    }
    // NOUVEAU: Détection des interactions liées à l'apprentissage/professionnalisation
    if (prompt.includes("comment apprendre") || prompt.includes("formation") || prompt.includes("compétences") ||
        prompt.includes("carrière") || prompt.includes("certificat") || prompt.includes("développer mes capacités")) {
        return "learning_professionalization";
    }
    if (response.length > 500 && (response.includes("{") || response.includes("["))) {
        return "structured_data_output";
    }
    return "general_question";
}

/**
 * Détecte l'axe cognitif principal d'une interaction.
 * Ceci est une simplification.
 * @param {string} text - Le texte à analyser (prompt ou réponse).
 * @returns {string} L'axe cognitif (e.g., 'logique', 'créativité', 'analyse', 'synthèse').
 */
function detectCognitiveAxis(text) {
    text = text.toLowerCase();
    if (text.includes("analyse") || text.includes("données") || text.includes("calcul") || text.includes("logique")) {
        return "Analyse/Logique";
    }
    if (text.includes("créer") || text.includes("imaginer") || text.includes("fiction") || text.includes("idée")) {
        return "Créativité";
    }
    if (text.includes("synthèse") || text.includes("résumé") || text.includes("structure")) {
        return "Synthèse/Organisation";
    }
    if (text.includes("problème") || text.includes("solution") || text.includes("optimiser")) {
        return "Résolution de Problèmes";
    }
    // NOUVEAU: Axe lié à l'apprentissage et l'acquisition de compétences
    if (text.includes("apprendre") || text.includes("enseigner") || text.includes("comprendre") || text.includes("compétence")) {
        return "Apprentissage/Acquisition de Connaissances";
    }
    return "Général";
}


/**
 * Détermine le focus thématique d'un texte.
 * @param {string} text - Le texte à analyser.
 * @returns {string} Le focus thématique (e.g., 'marketing', 'affiliation', 'fiscal_economic', 'general').
 */
function determineThematicFocus(text) {
    text = text.toLowerCase();
    if (text.includes("marketing") || text.includes("publicité") || text.includes("vente") || text.includes("client")) {
        return "marketing";
    }
    if (text.includes("affiliation") || text.includes("partenariat") || text.includes("commission") || text.includes("influenceur")) {
        return "affiliation";
    }
    if (text.includes("impôt") || text.includes("fiscalité") || text.includes("économie") || text.includes("finance") || text.includes("investissement")) {
        return "fiscal_economic";
    }
    // NOUVEAU: thématiques liées à l'éducation et au développement pro
    if (text.includes("éducation") || text.includes("formation") || text.includes("cours") || text.includes("étudiant")) {
        return "education_training";
    }
    if (text.includes("carrière") || text.includes("emploi") || text.includes("professionnel") || text.includes("compétences pro")) {
        return "professional_development";
    }
    return "general";
}


/**
 * Analyse le sentiment d'un texte.
 * @param {string} text - Le texte à analyser.
 * @returns {string} Le sentiment (e.g., 'positif', 'négatif', 'neutre').
 */
function analyzeTextForSentiment(text) {
    text = text.toLowerCase();
    const positiveWords = ['bon', 'excellent', 'super', 'heureux', 'facile', 'rapide', 'succès', 'efficace'];
    const negativeWords = ['mauvais', 'horrible', 'difficile', 'erreur', 'problème', 'lent', 'échec'];

    let sentimentScore = 0;
    positiveWords.forEach(word => {
        if (text.includes(word)) sentimentScore++;
    });
    negativeWords.forEach(word => {
        if (text.includes(word)) sentimentScore--;
    });

    if (sentimentScore > 0) return "positif";
    if (sentimentScore < 0) return "négatif";
    return "neutre";
}

/**
 * Simule la valorisation de termes spécifiques dans un texte.
 * Utile pour identifier la valeur d'informations ou de concepts clés.
 * @param {string} text - Le texte à analyser.
 * @returns {number} La valeur agrégée des termes.
 */
function analyzeTextForTermValuation(text) {
    text = text.toLowerCase();
    let value = 0;
    const valuableTerms = {
        "blockchain": 5, "intelligence artificielle": 5, "quantum computing": 7,
        "développement durable": 4, "biotechnologie": 6, "cybersécurité": 5,
        "machine learning": 5, "big data": 4, "robotique": 4,
        "économie circulaire": 3, "énergies renouvelables": 3,
        // NOUVEAU: Termes liés à l'employabilité et à la monétisation des compétences
        "monétisation": 6, "compétences": 4, "employabilité": 5, "carrière": 3,
        "freelance": 4, "entrepreneuriat": 5, "up-skilling": 6, "re-skilling": 6,
    };

    for (const term in valuableTerms) {
        if (text.includes(term)) {
            value += valuableTerms[term];
        }
    }
    return value;
}

/**
 * Convertit une valeur UTMi ou une valeur monétaire dans une devise spécifique vers l'EUR.
 * Pour les UTMi, c'est une conversion conceptuelle.
 * @param {number} value - La valeur à convertir.
 * @param {string} fromCurrency - La devise d'origine (e.g., 'USD', 'UTMI').
 * @returns {number} La valeur convertie en EUR.
 */
function convertValueToEUR(value, fromCurrency) {
    if (fromCurrency === 'EUR') {
        return value;
    }
    if (fromCurrency === 'USD') {
        return value / COEFFICIENTS.EXCHANGE_RATES.USD;
    }
    if (fromCurrency === 'GBP') {
        return value / COEFFICIENTS.EXCHANGE_RATES.GBP;
    }
    if (fromCurrency === 'JPY') {
        return value / (COEFFICIENTS.EXCHANGE_RATES.JPY / 100); // Pour 100 JPY
    }
    // Si c'est un UTMi, c'est une valorisation monétaire à définir
    // Pour l'exemple, nous pourrions définir une conversion de base UTMi vers EUR.
    if (fromCurrency === 'UTMI') {
        return value * COEFFICIENTS.INCOME_MODEL.BASE_INCOME_PER_UTMI_EUR;
    }
    return value; // Retourne la valeur telle quelle si la devise n'est pas gérée
}

/**
 * Calcule les UTMi (Unités Temporelles Monétisables) pour une interaction donnée.
 * Cette fonction est le cœur de la valorisation granulaire.
 * @param {object} interaction - L'objet interaction contenant prompt, response, duration, etc.
 * @param {object} cvAttributes - Les attributs du CV de l'utilisateur.
 * @returns {number} Les UTMi calculés pour cette interaction.
 */
function calculateUtmi(interaction, cvAttributes = {}) {
    let utmi = 0;
    const { prompt, response, durationSeconds = 0, model, type, wordCount = 0, responseWordCount = 0 } = interaction;

    // Valorisation temporelle (base)
    utmi += durationSeconds * COEFFICIENTS.TIME_PER_SECOND_UTMI;

    // Valorisation du prompt
    utmi += wordCount * COEFFICIENTS.PROMPT.BASE_UTMI_PER_WORD;
    if (type && type.includes('generation')) utmi *= COEFFICIENTS.PROMPT.COMPLEXITY_MULTIPLIER;
    if (prompt.includes('stratégie') || prompt.includes('impact')) utmi *= COEFFICIENTS.PROMPT.IMPACT_MULTIPLIER;
    utmi += analyzeTextForTermValuation(prompt) * COEFFICIENTS.PROMPT.UNIQUE_CONCEPT_BONUS; // Bonus pour concepts uniques

    // Bonus thématiques pour le prompt
    const promptTheme = determineThematicFocus(prompt);
    if (promptTheme === 'fiscal_economic') utmi += COEFFICIENTS.PROMPT.FISCAL_ECONOMIC_TOPIC_BONUS;
    if (cvAttributes.metierRelated) utmi += COEFFICIENTS.PROMPT.METIER_RELATED_PROMPT_BONUS;
    // NOUVEAU: Bonus pour les prompts liés à l'apprentissage ou la professionnalisation
    if (promptTheme === 'learning_professionalization' || promptTheme === 'education_training' || promptTheme === 'professional_development') {
        utmi += COEFFICIENTS.PROMPT.LEARNING_PROFESSIONALIZATION_PROMPT_BONUS;
    }


    // Valorisation de la réponse
    utmi += responseWordCount * COEFFICIENTS.RESPONSE.BASE_UTMI_PER_WORD;
    const modelQuality = MODEL_QUALITY_SCORES[model] || 1; // Obtenir le score de qualité du modèle
    utmi *= modelQuality * COEFFICIENTS.RESPONSE.QUALITY_MULTIPLIER;
    // Bonus de pertinence et de détail (simplifié)
    if (responseWordCount > 100) utmi += COEFFICIENTS.RESPONSE.DETAIL_BONUS;
    if (response.length < 500 && responseWordCount > 50) utmi += COEFFICIENTS.RESPONSE.SYNTHESIS_BONUS; // Réponse concise et pertinente
    if (type === "structured_data_output" || response.trim().startsWith('{') || response.trim().startsWith('[')) {
        utmi += COEFFICIENTS.RESPONSE.STRUCTURED_RESPONSE_BONUS;
    }

    // Impact des attributs CV (simplifié, à affiner avec un vrai CV parsing)
    if (cvAttributes.seniority === 'senior') utmi *= 1.2;
    if (cvAttributes.expertiseAreas && cvAttributes.expertiseAreas.includes(promptTheme)) utmi *= 1.1;

    // Assurer que les UTMi ne sont pas négatifs
    return parseFloat(Math.max(0, utmi).toFixed(2));
}

/**
 * Met à jour les UTMi d'une conversation ou d'un log d'interaction.
 * @param {string} logId - L'ID du log à mettre à jour.
 * @param {number} newUtmiValue - La nouvelle valeur UTMi.
 */
function updateUtmi(logId, newUtmiValue) {
    const logIndex = interactionLogs.findIndex(log => log.id === logId);
    if (logIndex !== -1) {
        interactionLogs[logIndex].utmi = newUtmiValue;
        console.log(`UTMi for log ${logId} updated to ${newUtmiValue}`);
    } else {
        console.warn(`Log with ID ${logId} not found.`);
    }
}

/**
 * Calcule la récompense Cityzen, une récompense UTMI additionnelle basée sur l'engagement.
 * @param {object} userData - Données de l'utilisateur (fréquence d'utilisation, ancienneté).
 * @returns {number} La récompense Cityzen en UTMi.
 */
function calculateCityzenReward(userData) {
    let reward = 0;
    // Exemple simple: récompense basée sur la fréquence et l'ancienneté
    if (userData.weeklyInteractions > 10) reward += 5;
    if (userData.accountAgeDays > 365) reward += 10;
    return reward;
}

/**
 * Calcule un score pour une activité spécifique.
 * @param {string} activityType - Le type d'activité (e.g., 'CHAT_MESSAGE', 'CV_GENERATION').
 * @param {object} details - Détails de l'activité.
 * @returns {number} Le score d'activité en UTMi.
 */
function calculateActivityScore(activityType, details = {}) {
    let score = 0;
    const coeff = COEFFICIENTS.ACTIVITY_SCORES[activityType];
    if (coeff) {
        score = coeff; // Base score

        if (activityType === 'CHAT_MESSAGE' && details.wordCount) {
            score += details.wordCount * 0.05; // Bonus par mot dans le message de chat
        }
        if (activityType === 'CV_GENERATION' && details.cvCompleteness) {
            score *= (1 + details.cvCompleteness / 100); // Bonus si CV plus complet
        }
    }
    return parseFloat(score.toFixed(2));
}

/**
 * Calcule les points UTM et PI (Productivité/Innovation) actuels de l'utilisateur.
 * @param {Array<object>} logs - Les logs d'interaction de l'utilisateur.
 * @returns {object} Un objet contenant totalUtmi et totalPIPoints.
 */
function calculateCurrentUTMAndPIPoints(logs) {
    let totalUtmi = 0;
    let totalPIPoints = 0; // Points de Productivité/Innovation

    logs.forEach(log => {
        totalUtmi += log.utmi || 0;

        // Exemple simplifié de calcul de PI Points
        if (log.type === 'code_generation' || log.type === 'data_analysis') {
            totalPIPoints += log.utmi * 0.1; // 10% des UTMi pour ces types
        }
    });

    return { totalUtmi: parseFloat(totalUtmi.toFixed(2)), totalPIPoints: parseFloat(totalPIPoints.toFixed(2)) };
}


/**
 * Calcule la valeur initiale du CV d'un utilisateur, convertie en capital de départ.
 * Cette fonction est une estimation simplifiée.
 * @param {object} structuredCvData - Les données structurées du CV.
 * @returns {object} { cvValueScore, initialCapitalEUR, cvLevelData }.
 */
function calculateInitialCvValue(structuredCvData) {
    let cvValueScore = 0;
    const { experiences = [], skills = [], certifications = [], education = [], languages = [], projects = [] } = structuredCvData;

    // Expérience
    let totalYearsExperience = experiences.reduce((sum, exp) => sum + (exp.years || 0), 0);
    cvValueScore += totalYearsExperience * COEFFICIENTS.CV_VALUATION.EXPERIENCE_MULTIPLIER_YEAR;

    // Compétences
    skills.forEach(skill => {
        cvValueScore += COEFFICIENTS.CV_VALUATION.BASE_CV_POINT_PER_WORD; // Base pour chaque compétence
        if (skill.isHighDemand) cvValueScore += COEFFICIENTS.CV_VALUATION.SKILL_BONUS_HIGH_DEMAND;
    });

    // Certifications
    cvValueScore += certifications.length * COEFFICIENTS.CV_VALUATION.CERTIFICATION_BONUS;

    // Éducation
    education.forEach(edu => {
        if (edu.degree === 'Bachelor') cvValueScore += COEFFICIENTS.CV_VALUATION.EDUCATION_LEVEL_BONUS.BACHELOR;
        if (edu.degree === 'Master') cvValueScore += COEFFICIENTS.CV_VALUATION.EDUCATION_LEVEL_BONUS.MASTER;
        if (edu.degree === 'PhD') cvValueScore += COEFFICIENTS.CV_VALUATION.EDUCATION_LEVEL_BONUS.PHD;
    });

    // Langues
    languages.forEach(lang => {
        cvValueScore += lang.level * COEFFICIENTS.CV_VALUATION.LANGUAGE_BONUS_PER_LEVEL;
    });

    // Projets (simplifié par leur nombre et un impact fictif)
    cvValueScore += projects.length * COEFFICIENTS.CV_VALUATION.PROJECT_IMPACT_MULTIPLIER * 5;

    // Déterminer le niveau du CV
    const cvLevelData = getCvLevel(cvValueScore);

    const initialCapitalEUR = cvValueScore * COEFFICIENTS.TREASURY.INITIAL_CV_VALUE_TO_CAPITAL_RATIO;

    return {
        cvValueScore: parseFloat(cvValueScore.toFixed(2)),
        initialCapitalEUR: parseFloat(initialCapitalEUR.toFixed(2)),
        cvLevelData: cvLevelData
    };
}

/**
 * Détermine le niveau du CV (Junior, Middle, Senior) basé sur le score.
 * @param {number} cvValueScore - Le score calculé du CV.
 * @returns {object} Un objet indiquant le niveau.
 */
function getCvLevel(cvValueScore) {
    if (cvValueScore >= 100) return { level: "Senior", senior: true, middle: false, junior: false };
    if (cvValueScore >= 50) return { level: "Middle", senior: false, middle: true, junior: false };
    return { level: "Junior", senior: false, middle: false, junior: true };
}


/**
 * Calcule la valeur monétaire du CV en EUR.
 * @param {object} structuredCvData - Les données structurées du CV.
 * @returns {object} { cvValueScore, cvLevel, monthlyUniversalIncomeEUR }
 */
function calculateUtmiValueInEUR(structuredCvData) {
    const { cvValueScore, cvLevelData } = calculateInitialCvValue(structuredCvData); // Réutilise le calcul de base

    // Calcul du revenu universel mensuel basé sur le score du CV
    const monthlyUniversalIncomeEUR = calculateMonthlyUniversalIncome(cvValueScore, 0, cvLevelData);

    return {
        cvValueScore: cvValueScore,
        cvLevel: cvLevelData.level,
        monthlyUniversalIncomeEUR: monthlyUniversalIncomeEUR
    };
}

/**
 * Calcule le revenu universel mensuel basé sur la valeur du CV et les UTMi cumulés.
 * @param {number} cvValueScore - Le score de valorisation du CV.
 * @param {number} totalUtmi - Le total des UTMi cumulés.
 * @param {object} cvLevelData - L'objet du niveau du CV (junior, middle, senior).
 * @returns {number} Le revenu universel mensuel estimé en EUR.
 */
function calculateMonthlyUniversalIncome(cvValueScore, totalUtmi, cvLevelData) {
    const incomeCoeff = COEFFICIENTS.INCOME_MODEL;
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

/**
 * Calcule et agrège toutes les données pour le tableau de bord.
 * @param {Array<object>} allLogs - Tous les logs d'interaction disponibles.
 * @param {object} structuredCvData - Les dernières données structurées du CV.
 * @returns {object} Les insights complets du tableau de bord.
 */
function calculateDashboardInsights(allLogs, structuredCvData = {}) {
    let totalUtmi = 0;
    let totalInteractionCount = allLogs.length;
    let totalResponseCostUSD = 0; // Coût total des réponses IA en USD
    let totalResponseCostEUR = 0; // Coût total des réponses IA en EUR
    let totalConversationLengthTokens = 0; // Longueur totale des conversations en tokens (estimation)

    const utmiByType = {};
    const utmiByModel = {};
    const utmiPerCostRatioByModel = {}; // Ratio UTMi généré par rapport au coût par modèle
    const totalUtmiByCognitiveAxis = {};
    const commonTopicsUtmi = {}; // UTMi par thème
    const commonActivities = {}; // Compteur d'activités

    // Initialisation des totaux thématiques
    const thematicUtmi = {
        marketing: 0,
        affiliation: 0,
        fiscalEconomic: 0,
        educationTraining: 0,
        professionalDevelopment: 0,
    };

    allLogs.forEach(log => {
        totalUtmi += log.utmi || 0;
        totalResponseCostUSD += log.estimatedCostUSD || 0;
        totalResponseCostEUR += log.estimatedCostEUR || 0;
        totalConversationLengthTokens += log.responseLengthTokens || 0;

        // Agrégation par type d'interaction
        const type = log.type || 'unknown';
        utmiByType[type] = (utmiByType[type] || 0) + (log.utmi || 0);

        // Agrégation par modèle IA
        const model = log.model || 'unknown';
        utmiByModel[model] = (utmiByModel[model] || 0) + (log.utmi || 0);
        // Calcul pour le ratio UTMi/Coût par modèle
        if (log.estimatedCostUSD > 0) {
            utmiPerCostRatioByModel[model] = (utmiPerCostRatioByModel[model] || { utmi: 0, cost: 0 });
            utmiPerCostRatioByModel[model].utmi += (log.utmi || 0);
            utmiPerCostRatioByModel[model].cost += log.estimatedCostUSD;
        }

        // Agrégation par axe cognitif
        const cognitiveAxis = detectCognitiveAxis(log.prompt + " " + log.response);
        totalUtmiByCognitiveAxis[cognitiveAxis] = (totalUtmiByCognitiveAxis[cognitiveAxis] || 0) + (log.utmi || 0);

        // Agrégation par focus thématique
        const theme = determineThematicFocus(log.prompt + " " + log.response);
        if (thematicUtmi.hasOwnProperty(theme)) {
            thematicUtmi[theme] += (log.utmi || 0);
        } else {
            // Pour les thèmes non spécifiquement suivis, les regrouper sous 'general' ou les ignorer
            // Pour le dashboard, nous nous concentrons sur les thèmes prédéfinis
        }

        // Top activités les plus courantes (compteur)
        const activity = log.activityType || 'other'; // Supposons que chaque log a un activityType
        commonActivities[activity] = (commonActivities[activity] || 0) + 1;

        // Top 5 thèmes les plus valorisés (simplifié par un agrégat sur les prompts)
        const promptTopics = analyzeTextForTermValuation(log.prompt);
        // Ceci est une simplification; en réalité, il faudrait analyser le contenu pour les thèmes.
        // Ici, nous utilisons juste une agrégation d'UTMi par les "termes valorisés" pour l'exemple.
        if (promptTopics > 0) { // Si des termes valorisés sont trouvés
            // Utiliser le thème détecté pour le prompt
            const primaryTopic = determineThematicFocus(log.prompt);
            commonTopicsUtmi[primaryTopic] = (commonTopicsUtmi[primaryTopic] || 0) + (log.utmi || 0);
        }
    });

    // Calcul des moyennes
    const averageUtmiPerInteraction = totalInteractionCount > 0 ? totalUtmi / totalInteractionCount : 0;
    const averageCostPerInteraction = totalInteractionCount > 0 ? totalResponseCostUSD / totalInteractionCount : 0; // En USD

    // Finalisation du ratio UTMi/Coût par modèle
    for (const model in utmiPerCostRatioByModel) {
        if (utmiPerCostRatioByModel[model].cost > 0) {
            utmiPerCostRatioByModel[model].ratio = utmiPerCostRatioByModel[model].utmi / utmiPerCostRatioByModel[model].cost;
        } else {
            utmiPerCostRatioByModel[model].ratio = 0; // Coût nul, ratio infini ou 0
        }
        utmiPerCostRatioByModel[model].utmi = parseFloat(utmiPerCostRatioByModel[model].utmi.toFixed(2));
        utmiPerCostRatioByModel[model].cost = parseFloat(utmiPerCostRatioByModel[model].cost.toFixed(6));
        utmiPerCostRatioByModel[model].ratio = parseFloat(utmiPerCostRatioByModel[model].ratio.toFixed(2));
    }


    // Calcul du ratio global UTMi / Coût Total
    const totalUtmiPerCostRatio = totalResponseCostUSD > 0 ? totalUtmi / totalResponseCostUSD : 0;

    // Initialisation du capital de départ et du niveau de CV
    let initialCvData = calculateInitialCvValue(structuredCvData);
    let initialCapitalEUR = initialCvData.initialCapitalEUR;
    let cvLevelData = initialCvData.cvLevelData;

    // Calcul du Revenu Universel Mensuel
    let monthlyUniversalIncomeEUR = calculateMonthlyUniversalIncome(initialCvData.cvValueScore, totalUtmi, cvLevelData);

    // Calcul du solde de trésorerie (exemple simplifié : capital de départ + UTMi convertis - Taxe IA)
    let treasuryBalanceEUR = initialCapitalEUR + (totalUtmi * COEFFICIENTS.TREASURY.UTMI_TO_TREASURY_CONVERSION_RATE);
    // Appliquer une "Taxe IA" fictive sur la valeur générée par les UTMi
    const iaTax = totalUtmi * COEFFICIENTS.TREASURY.TAX_IA_RATE;
    treasuryBalanceEUR = treasuryBalanceEUR - iaTax;


    // Fonctions utilitaires pour trier les objets en tableaux pour l'affichage
    const getSortedUtmiByValue = (obj) =>
        Object.entries(obj)
              .map(([key, value]) => ({ label: key, value: parseFloat(value.toFixed(2)) }))
              .sort((a, b) => b.value - a.value);

    const getSortedActivitiesByCount = (obj) =>
        Object.entries(obj)
              .map(([key, count]) => ({ activity: key, count: count }))
              .sort((a, b) => b.count - a.count);

    // Sentiment global (simplifié)
    const allText = allLogs.map(log => log.prompt + " " + log.response).join(" ");
    const sentimentSummary = analyzeTextForSentiment(allText);


    return {
        totalUtmi: parseFloat(totalUtmi.toFixed(2)),
        initialCapitalEUR: parseFloat(initialCapitalEUR.toFixed(2)),
        monthlyUniversalIncomeEUR: parseFloat(monthlyUniversalIncomeEUR.toFixed(2)),
        treasuryBalanceEUR: parseFloat(treasuryBalanceEUR.toFixed(2)),
        totalInteractionCount: totalInteractionCount,
        totalEstimatedCostUSD: parseFloat(totalResponseCostUSD.toFixed(6)), // Maintenu pour la cohérence de l'API si d'autres parties l'utilisent
        totalEstimatedCostEUR: parseFloat(totalResponseCostEUR.toFixed(6)), // Maintenu pour la cohérence de l'API
        totalConversationLengthTokens: parseFloat(totalConversationLengthTokens.toFixed(2)),
        averageUtmiPerInteraction: parseFloat(averageUtmiPerInteraction.toFixed(2)),
        averageCostPerInteraction: parseFloat(averageCostPerInteraction.toFixed(6)),
        sentimentSummary: sentimentSummary,
        utmiByCognitiveAxis: getSortedUtmiByValue(totalUtmiByCognitiveAxis),
        utmiByType: getSortedUtmiByValue(utmiByType),
        utmiByModel: getSortedUtmiByValue(utmiByModel),
        thematicUtmi: {
            marketing: parseFloat(thematicUtmi.marketing.toFixed(2)),
            affiliation: parseFloat(thematicUtmi.affiliation.toFixed(2)),
            fiscalEconomic: parseFloat(thematicUtmi.fiscalEconomic.toFixed(2)),
            educationTraining: parseFloat(thematicUtmi.educationTraining.toFixed(2)),
            professionalDevelopment: parseFloat(thematicUtmi.professionalDevelopment.toFixed(2)),
        },
        utmiPerCostRatioByModel: utmiPerCostRatioByModel,
        totalUtmiPerCostRatio: parseFloat(totalUtmiPerCostRatio.toFixed(2)),
        mostValuableTopics: getSortedUtmiByValue(commonTopicsUtmi).slice(0, 5),
        mostCommonActivities: getSortedActivitiesByCount(commonActivities).slice(0, 5),
        exchangeRates: COEFFICIENTS.EXCHANGE_RATES,
    };
}


function determineInteractionType(log) {
    // Cette fonction déduit le type d'interaction à partir d'un objet log complet.
    // Elle est appelée par calculateDashboardInsights pour les logs existants.
    // Pour les nouvelles interactions, le type sera défini directement dans serveur.js.
    if (log && log.interactionType) return log.interactionType;
    if (log && log.conversationId && log.chatMessage) return 'chat_message';
    if (log && log.cvInput && log.structuredCvData) return 'cv_generation';
    return 'one_time_prompt'; // Fallback
}

function detectCognitiveAxis(text) {
    text = text || ''; // S'assure que 'text' est une chaîne vide si undefined/null
    let axes = {
        logic: 0, creativity: 0, analysis: 0, synthesis: 0
    };
    const lowerText = text.toLowerCase();
    if (lowerText.includes("logique") || lowerText.includes("raisonnement") || lowerText.includes("déduction") || lowerText.includes("algorithme")) axes.logic = 1;
    if (lowerText.includes("créatif") || lowerText.includes("imagination") || lowerText.includes("conception") || lowerText.includes("originalité")) axes.creativity = 1;
    if (lowerText.includes("analyser") || lowerText.includes("analyse") || lowerText.includes("décortiquer") || lowerText.includes("diagnostic")) axes.analysis = 1;
    if (lowerText.includes("synthétiser") || lowerText.includes("résumer") || lowerText.includes("consolider") || lowerText.includes("vue d'ensemble")) axes.synthesis = 1;
    return axes;
}

function determineThematicFocus(text) {
    text = text || ''; // S'assure que 'text' est une chaîne vide si undefined/null
    const lowerText = text.toLowerCase();
    const themes = {
        marketing: 0,
        affiliation: 0,
        fiscalEconomic: 0,
        metierRelated: 0,
        codeRelated: 0,
        mediaRelated: 0
    };

    if (lowerText.includes("marketing") || lowerText.includes("publicité") || lowerText.includes("campagne") || lowerText.includes("seo") || lowerText.includes("produit") || lowerText.includes("stratégie commerciale")) themes.marketing = 1;
    if (lowerText.includes("affiliation") || lowerText.includes("partenariat") || lowerText.includes("commission") || lowerText.includes("lien affilié") || lowerText.includes("influenceur")) themes.affiliation = 1;
    if (lowerText.includes("fiscal") || lowerText.includes("économie") || lowerText.includes("finance") || lowerText.includes("impôt") || lowerText.includes("investissement") || lowerText.includes("budget") || lowerText.includes("déclaration")) themes.fiscalEconomic = 1;
    if (lowerText.includes("développeur") || lowerText.includes("devops") || lowerText.includes("sysadmin") || lowerText.includes("data scientist") || lowerText.includes("chef de projet") || lowerText.includes("ressources humaines")) themes.metierRelated = 1;
    if (lowerText.includes("code") || lowerText.includes("fonction") || lowerText.includes("script") || lowerText.includes("bug") || lowerText.includes("framework") || lowerText.includes("syntaxe") || lowerText.includes("algorithme")) themes.codeRelated = 1;
    if (lowerText.includes("image") || lowerText.includes("vidéo") || lowerText.includes("audio") || lowerText.includes("design") || lowerText.includes("rendu") || lowerText.includes("montage") || lowerText.includes("graphique")) themes.mediaRelated = 1;

    return themes;
}

function analyzeTextForSentiment(text) {
    text = text || ''; // S'assure que 'text' est une chaîne vide si undefined/null
    const lowerText = text.toLowerCase();
    if (lowerText.includes("excellent") || lowerText.includes("bon") || lowerText.includes("positif") || lowerText.includes("génial") || lowerText.includes("super")) return "positive";
    if (lowerText.includes("mauvais") || lowerText.includes("négatif") || lowerText.includes("problème") || lowerText.includes("erreur") || lowerText.includes("incorrect")) return "negative";
    return "neutral";
}

function analyzeTextForTermValuation(text) {
    text = text || ''; // S'assure que 'text' est une chaîne vide si undefined/null
    const lowerText = text.toLowerCase();
    let valuation = 0;
    if (lowerText.includes("innovation") || lowerText.includes("stratégie") || lowerText.includes("valeur ajoutée") || lowerText.includes("croissance") || lowerText.includes("développement")) valuation += 1;
    if (lowerText.includes("gains") || lowerText.includes("profit") || lowerText.includes("optimisation") || lowerText.includes("revenu") || lowerText.includes("monétisation")) valuation += 1;
    return valuation;
}

// ... (Gardez le reste du fichier inchangé) ...

module.exports = {
    calculateUtmi,
    updateUtmi,
    calculateCityzenReward,
    calculateActivityScore,
    calculateCurrentUTMAndPIPoints,
    calculateUtmiValueInEUR,
    COEFFICIENTS,
    convertValueToEUR,
    determineInteractionType, // Maintenez cette fonction pour la lecture des logs
    detectCognitiveAxis,
    determineThematicFocus,
    analyzeTextForSentiment,
    analyzeTextForTermValuation,
    calculateDashboardInsights,
    calculateInitialCvValue,
    getCvLevel,
    calculateMonthlyUniversalIncome,
    MODEL_QUALITY_SCORES,
};