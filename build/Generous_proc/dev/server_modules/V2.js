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
    TIME_PER_SECOND_UTMI: 0.1, // Valeur de base d'une seconde en UTMi (pour le calcul d'UTMi par heure)

    // Coefficients pour différents types d'interaction
    PROMPT: {
        BASE_UTMI_PER_WORD: 0.5, // Valorisation à la base (lettre/mot/phrase)
        COMPLEXITY_MULTIPLIER: 1.2, // Bonus pour la complexité du prompt
        IMPACT_MULTIPLIER: 1.5,     // Bonus si le prompt est très impactant
        UNIQUE_CONCEPT_BONUS: 5,    // Bonus pour un concept unique introduit
        FISCAL_ECONOMIC_TOPIC_BONUS: 3, // Bonus si le prompt est lié à un concept fiscal/économique
        METIER_RELATED_PROMPT_BONUS: 2, // Bonus si le prompt est lié à un métier spécifique
    },

    AI_RESPONSE: {
        BASE_UTMI_PER_TOKEN: 0.1, // Valorisation à la base (lettre/mot/phrase de la réponse)
        RELEVANCE_MULTIPLIER: 1.3,  // Bonus pour la pertinence de la réponse
        COHERENCE_MULTIPLIER: 1.1,  // Bonus pour la cohérence
        PROBLEM_SOLVING_MULTIPLIER: 1.4, // Bonus si la réponse aide à résoudre un problème
        CREATIVITY_BONUS: 2,        // Bonus pour une réponse créative
        DETAIL_BONUS: 1.5,          // Bonus pour le niveau de détail
        // --- NOUVEAUX COEFFICIENTS POUR LA GÉNÉRATION SPÉCIFIQUE (Code, Média) ---
        CODE_GENERATION_BONUS_PER_TOKEN: 0.2, // Bonus UTMi si la réponse est du code (en plus du BASE_UTMI_PER_TOKEN)
        MEDIA_GENERATION_BONUS_PER_TOKEN: 0.3, // Bonus UTMi si la réponse est un média (en plus du BASE_UTMI_PER_TOKEN)
        // Note: Pour une vraie génération de média, il faudrait évaluer la complexité/taille du média.
        // Ici, on simule par token pour l'exemple.
    },

    PROCESSING: {
        CPU_USAGE_UTMI_PER_MS: 0.0001, // Coût interne pour le système, n'impacte plus directement les UTMi de l'utilisateur
        MEMORY_USAGE_UTMI_PER_MB: 0.001,
    },

    COST_PER_TOKEN_USD: {
        "gemma2-9b-it": 0.00000018,
        "llama3-8b-8192": 0.0000002,
        "llama3-70b-8192": 0.000001,
        "deepseek-r1-distill-llama-70b": 0.0000008,
    },

    EXCHANGE_RATES: {
        USD_TO_EUR: 0.93,
    },

    // --- NOUVEAUX COEFFICIENTS POUR LA VALORISATION DU CV (Capital de départ) ---
    CV_VALORIZATION: {
        // Scores de base par élément de CV (à ajuster par vous !)
        BASE_SCORE_PER_EXPERIENCE_YEAR: 10, // Points par année d'expérience
        BASE_SCORE_PER_EDUCATION_LEVEL: { // Points par niveau d'éducation
            "Baccalauréat": 20,
            "Licence": 40,
            "Master": 60,
            "Doctorat": 80,
            "Certification": 15, // Pour chaque certification reconnue
            "Diplôme d'ingénieur": 70,
            "Autre": 10
        },
        SCORE_PER_SKILL: 5, // Points par compétence listée (peut être ajusté par niveau de compétence)
        BONUS_PER_MASTERY_LEVEL: 15, // Bonus pour chaque "maîtrise" ou niveau avancé (si détectable)
        BONUS_PER_LANGUAGE: 10, // Points par langue maîtrisée
        BONUS_PER_LICENSE: 25, // Points par licence spécifique
        BONUS_PROJECT_CONTRIBUTION: 20, // Bonus par projet significatif ou contribution
        IMPACT_STATEMENT_BONUS: 5, // Bonus si la description d'expérience contient des mots clés d'impact

        // Seuils pour définir les niveaux Junior/Moyen/Senior (à ajuster en fonction des scores obtenus)
        SENIOR_THRESHOLD: 200,
        MIDDLE_THRESHOLD: 100,
    },
    // --- FIN DES COEFFICIENTS CV ---

    // --- NOUVEAUX COEFFICIENTS POUR LE REVENU UNIVERSEL MENSUEL ---
    MONTHLY_UNIVERSAL_INCOME: {
        // Coefficient de base par point de score CV
        BASE_INCOME_PER_CV_POINT_EUR: 0.05, // 0.05 EUR par point de score CV par mois
        // Coefficient de base par UTMi cumulé
        BASE_INCOME_PER_UTMI_EUR: 0.001,    // 0.001 EUR par UTMi cumulé par mois
        // Bonus par niveau de CV
        JUNIOR_BONUS_EUR: 5,
        MIDDLE_BONUS_EUR: 10,
        SENIOR_BONUS_EUR: 20,
        // Plafond du revenu mensuel (optionnel)
        MAX_MONTHLY_INCOME_EUR: 1000, // Plafond mensuel, à adapter
    },
    // --- FIN DES COEFFICIENTS RUM ---

    // --- COEFFICIENTS POUR LA RÉCOMPENSE CITIZEN (à maintenir ou ajuster) ---
    CITIZEN_REWARD: {
        UTMI_MULTIPLIER: 0.02,
        ACTIVITY_MULTIPLIER: 0.05,
        PROFESSIONAL_BONUS: 10,
        EXPERIENCE_BONUS: 20,
        HIGH_INTERACTION_THRESHOLD: 50,
        HIGH_INTERACTION_BONUS: 15,
    },
    // --- COEFFICIENTS POUR LE SCORE D'ACTIVITÉ (à maintenir ou ajuster) ---
    ACTIVITY_SCORE: {
        DAILY_ACTIVITY_BONUS: 5,
        CONVERSATION_BONUS: 2,
        PROMPT_WORD_VALUE: 0.01,
        RESPONSE_TOKEN_VALUE: 0.005,
    },
    // --- CONTEXTE ÉCONOMIQUE (à maintenir ou ajuster) ---
    ECONOMIC_CONTEXT: {
        GDP_GROWTH_THRESHOLD: 0.02,
        GDP_GROWTH_BONUS_MULTIPLIER: 0.1,
        INFLATION_THRESHOLD: 0.03,
        INFLATION_BONUS_MULTIPLIER: 0.05,
    },
    // --- CONVERSION UTMi vers Monnaie (à maintenir ou ajuster) ---
    UTMI_TO_CURRENCY_VALUE: {
        UTMI_TO_EUR_BASE: 0.001, // Valeur de base d'1 UTMi en EUR (indépendamment du RUM)
    },
    // --- TAXE IA (à maintenir ou ajuster si nécessaire) ---
    TAX_IA: {
        RATE: 0.05, // 5% de taxe sur la récompense Citizen
    },
};


// Helper pour filtrer les objets de logs par type
const filterLogsByType = (logs, type) => logs.filter(log => log.type === type);
const filterLogsByInteractionCategory = (logs, category) => logs.filter(log => log.interactionCategory === category);
const getLatestLogByConversationId = (logs, conversationId) => {
    const convoLogs = logs.filter(log => log.conversationId === conversationId);
    if (convoLogs.length === 0) return null;
    return convoLogs.reduce((latest, current) =>
        new Date(current.timestamp) > new Date(latest.timestamp) ? current : latest
    );
};

// Fonctions utilitaires
function convertValueToEUR(amount, fromCurrency, exchangeRates) {
    if (fromCurrency === 'EUR') return amount;
    const rateKey = `${fromCurrency}_TO_EUR`;
    const rate = exchangeRates[rateKey];
    if (rate) {
        return amount * rate;
    }
    console.warn(`Taux de change non trouvé pour ${fromCurrency} vers EUR.`);
    return amount; // Retourne la valeur originale si le taux n'est pas trouvé
}

function determineInteractionType(log) {
    if (log.interactionType) return log.interactionType;
    if (log.conversationId && log.chatMessage) return 'chat_message';
    if (log.cvInput && log.structuredCvData) return 'cv_generation';
    return 'one_time_prompt';
}

function detectCognitiveAxis(text) {
    // Ensure text is a string to prevent errors
    text = text || '';
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
    // Ensure text is a string to prevent errors
    text = text || '';
    const lowerText = text.toLowerCase();
    const themes = {
        marketing: 0,
        affiliation: 0,
        fiscalEconomic: 0,
        metierRelated: 0,
        codeRelated: 0,    // NOUVEAU: Thème pour le code
        mediaRelated: 0    // NOUVEAU: Thème pour les médias
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
    // Ensure text is a string to prevent errors
    text = text || '';
    const lowerText = text.toLowerCase();
    if (lowerText.includes("excellent") || lowerText.includes("bon") || lowerText.includes("positif") || lowerText.includes("génial") || lowerText.includes("super")) return "positive";
    if (lowerText.includes("mauvais") || lowerText.includes("négatif") || lowerText.includes("problème") || lowerText.includes("erreur") || lowerText.includes("incorrect")) return "negative";
    return "neutral";
}

function analyzeTextForTermValuation(text) {
    // Ensure text is a string to prevent errors
    text = text || '';
    const lowerText = text.toLowerCase();
    let valuation = 0;
    if (lowerText.includes("innovation") || lowerText.includes("stratégie") || lowerText.includes("valeur ajoutée") || lowerText.includes("croissance") || lowerText.includes("développement")) valuation += 1;
    if (lowerText.includes("gains") || lowerText.includes("profit") || lowerText.includes("optimisation") || lowerText.includes("revenu") || lowerText.includes("monétisation")) valuation += 1;
    return valuation;
}


/**
 * Calcule les Unités Temporelles Monétisables (UTMi) et les coûts associés pour une interaction.
 * IMPORTANT : Les coûts sont calculés pour le suivi interne mais ne sont plus déduits des UTMi de l'utilisateur.
 * @param {object} log - L'objet log représentant l'interaction.
 * @param {object} modelQualityScores - Les scores de qualité des modèles.
 * @param {object} currentExchangeRates - Les taux de change actuels.
 * @returns {object} Un objet contenant les UTMi générés, le coût estimé en USD et en EUR.
 */
function calculateUtmi(log, modelQualityScores, currentExchangeRates) {
    if (!log || !log.model || !log.processingTimeMs) {
        // console.warn("Missing critical data for UTMi calculation:", log);
        return { utmi: 0, estimatedCostUSD: 0, estimatedCostEUR: 0 };
    }

    // Ensure prompt and aiResponse are strings, even if empty or null/undefined
    log.prompt = String(log.prompt || '');
    log.aiResponse = String(log.aiResponse || '');

    const promptWords = log.prompt.split(/\s+/).filter(word => word.length > 0).length;
    const aiResponseTokens = log.aiResponse.split(/\s+/).filter(word => word.length > 0).length; // Simple token count for now

    // Valorisation du prompt (à la lettre/mot/phrase, etc.)
    let utmi = (promptWords * COEFFICIENTS.PROMPT.BASE_UTMI_PER_WORD);

    // Valorisation de la réponse (à la lettre/mot/phrase, etc.)
    utmi += (aiResponseTokens * COEFFICIENTS.AI_RESPONSE.BASE_UTMI_PER_TOKEN);

    // Appliquer les multiplicateurs et bonus basés sur les détails de l'interaction
    utmi *= log.promptComplexityMultiplier || COEFFICIENTS.PROMPT.COMPLEXITY_MULTIPLIER;
    utmi *= log.impactMultiplier || COEFFICIENTS.PROMPT.IMPACT_MULTIPLIER;
    utmi *= log.relevanceMultiplier || COEFFICIENTS.AI_RESPONSE.RELEVANCE_MULTIPLIER;
    utmi *= log.coherenceMultiplier || COEFFICIENTS.AI_RESPONSE.COHERENCE_MULTIPLIER;
    utmi *= log.problemSolvingMultiplier || COEFFICIENTS.AI_RESPONSE.PROBLEM_SOLVING_MULTIPLIER;

    // Appliquer les bonus thématiques et créatifs
    if (log.uniqueConcept) utmi += COEFFICIENTS.PROMPT.UNIQUE_CONCEPT_BONUS;
    if (log.creativity) utmi += COEFFICIENTS.AI_RESPONSE.CREATIVITY_BONUS;
    if (log.detail) utmi += COEFFICIENTS.AI_RESPONSE.DETAIL_BONUS;

    const thematicFocus = determineThematicFocus(log.prompt + " " + log.aiResponse);
    if (thematicFocus.fiscalEconomic) utmi += COEFFICIENTS.PROMPT.FISCAL_ECONOMIC_TOPIC_BONUS;
    if (thematicFocus.metierRelated) utmi += COEFFICIENTS.PROMPT.METIER_RELATED_PROMPT_BONUS;

    // --- NOUVEAU: Valorisation spécifique pour la génération de CODE et de MÉDIA ---
    // Il est crucial que l'objet `log` inclue `log.generatedContentType` pour activer ces bonus.
    // Par exemple: `log.generatedContentType = 'code'` ou `log.generatedContentType = 'media'`
    if (log.generatedContentType === 'code') {
        utmi += aiResponseTokens * COEFFICIENTS.AI_RESPONSE.CODE_GENERATION_BONUS_PER_TOKEN;
    } else if (log.generatedContentType === 'media') {
        utmi += aiResponseTokens * COEFFICIENTS.AI_RESPONSE.MEDIA_GENERATION_BONUS_PER_TOKEN;
    }
    // Fin NOUVEAU

    // Application du score de qualité du modèle
    const modelQuality = modelQualityScores[log.model] ? modelQualityScores[log.model].quality_multiplier || 1 : 1;
    utmi *= modelQuality;

    // Coût de traitement (coût interne du système, NE RÉDUIT PAS LES UTMi DE L'UTILISATEUR)
    const processingUtmiCostInternal = (log.processingTimeMs * COEFFICIENTS.PROCESSING.CPU_USAGE_UTMI_PER_MS);
    // utmi -= processingUtmiCost; // Cette ligne est DÉSORMAIS COMMENTÉE pour ne pas impacter le gain utilisateur.

    // Calcul du coût financier (toujours pour le suivi interne)
    const costPerToken = COEFFICIENTS.COST_PER_TOKEN_USD[log.model] || 0;
    const estimatedCostUSD = (promptWords + aiResponseTokens) * costPerToken;
    const estimatedCostEUR = convertValueToEUR(estimatedCostUSD, 'USD', currentExchangeRates || COEFFICIENTS.EXCHANGE_RATES);

    return {
        utmi: parseFloat(utmi.toFixed(2)),
        estimatedCostUSD: parseFloat(estimatedCostUSD.toFixed(6)),
        estimatedCostEUR: parseFloat(estimatedCostEUR.toFixed(6))
    };
}


// Cette fonction est un placeholder et nécessitera une implémentation DB pour stocker les logs de manière persistante
function updateUtmi(newLog) {
    // console.log("Updating UTMi for log:", newLog);
    // Dans une application réelle, cela persisterait le log dans une base de données.
    // Pour l'instant, on se base sur les logs en mémoire ou un fichier simple.
}

function calculateCityzenReward(cityzenData) {
    if (!cityzenData) {
        return 0;
    }

    const { totalUtmi, activityScore, developerExperienceContext, interactionCount } = cityzenData;
    const { CITIZEN_REWARD } = COEFFICIENTS;

    let reward = totalUtmi * CITIZEN_REWARD.UTMI_MULTIPLIER;
    reward += activityScore * CITIZEN_REWARD.ACTIVITY_MULTIPLIER;

    if (developerExperienceContext && developerExperienceContext.isProfessional) {
        reward += CITIZEN_REWARD.PROFESSIONAL_BONUS;
        if (developerExperienceContext.yearsOfExperience >= 5) {
            reward += CITIZEN_REWARD.EXPERIENCE_BONUS;
        }
    }

    if (interactionCount && interactionCount > CITIZEN_REWARD.HIGH_INTERACTION_THRESHOLD) {
        reward += CITIZEN_REWARD.HIGH_INTERACTION_BONUS;
    }

    // Application de la taxe IA si définie
    if (COEFFICIENTS.TAX_IA && COEFFICIENTS.TAX_IA.RATE > 0) {
        const taxAmount = reward * COEFFICIENTS.TAX_IA.RATE;
        reward -= taxAmount;
    }

    return parseFloat(reward.toFixed(2));
}

function calculateActivityScore(logs) {
    if (!logs || !Array.isArray(logs) || logs.length === 0) return 0;

    let score = 0;
    const uniqueDays = new Set();
    const uniqueConversations = new Set();
    let totalPromptWords = 0;
    let totalResponseTokens = 0;

    logs.forEach(log => {
        const date = new Date(log.timestamp).toISOString().split('T')[0];
        uniqueDays.add(date);
        if (log.conversationId) {
            uniqueConversations.add(log.conversationId);
        }
        totalPromptWords += log.prompt ? String(log.prompt).split(/\s+/).filter(word => word.length > 0).length : 0;
        totalResponseTokens += log.aiResponse ? String(log.aiResponse).split(/\s+/).filter(word => word.length > 0).length : 0;
    });

    score += uniqueDays.size * COEFFICIENTS.ACTIVITY_SCORE.DAILY_ACTIVITY_BONUS;
    score += uniqueConversations.size * COEFFICIENTS.ACTIVITY_SCORE.CONVERSATION_BONUS;
    score += (totalPromptWords / 100) * COEFFICIENTS.ACTIVITY_SCORE.PROMPT_WORD_VALUE;
    score += (totalResponseTokens / 100) * COEFFICIENTS.ACTIVITY_SCORE.RESPONSE_TOKEN_VALUE;

    return parseFloat(score.toFixed(2));
}


// Cette fonction calcule les UTM et PI points à partir des logs fournis
function calculateCurrentUTMAndPIPoints(logs) {
    let totalUtmPoints = 0; // Renommé pour correspondre à la terminologie plus globale si nécessaire
    let totalPiPoints = 0; // Points d'Impact
    let totalCost = 0; // Coût cumulé en EUR pour la trésorerie

    if (logs && Array.isArray(logs)) {
        logs.forEach(log => {
            if (log.utmiResult && typeof log.utmiResult.utmi === 'number') {
                totalUtmPoints += log.utmiResult.utmi;
            }
            if (log.utmiResult && typeof log.utmiResult.estimatedCostEUR === 'number') {
                totalCost += log.utmiResult.estimatedCostEUR;
            }
            // Exemple simple de calcul de PI Points: un PI Point par UTMi généré
            totalPiPoints += log.utmiResult ? log.utmiResult.utmi : 0; // PI Points sont un reflet des UTMi dans ce modèle
        });
    }
    return {
        totalUtmPoints: parseFloat(totalUtmPoints.toFixed(2)),
        totalPiPoints: parseFloat(totalPiPoints.toFixed(2)),
        totalCost: parseFloat(totalCost.toFixed(6))
    };
}


function calculateUtmiValueInEUR(totalUtmPoints, totalCost) {
    // Calcul de la trésorerie nette: Total UTMs convertis en EUR moins les coûts cumulés.
    // Cette fonction reflète la trésorerie générée par la plateforme (pas le revenu universel de l'utilisateur)
    const utmToEurRate = COEFFICIENTS.UTMI_TO_CURRENCY_VALUE.UTMI_TO_EUR_BASE;
    const valueFromUtms = totalUtmPoints * utmToEurRate;
    const netTreasury = valueFromUtms - totalCost;

    return parseFloat(netTreasury.toFixed(2));
}

function calculateDashboardInsights(logs, targetCurrency = 'EUR', economicContext = null, cvStructuredData = null) {
    if (!logs || logs.length === 0) {
        return {
            totalUtmi: 0,
            totalEstimatedCostUSD: 0,
            totalEstimatedCostEUR: 0,
            totalInteractionCount: 0,
            averageUtmiPerInteraction: 0,
            averageCostPerInteraction: 0,
            sentimentSummary: { positive: 0, neutral: 0, negative: 0 },
            utmiByCognitiveAxis: [],
            utmiByType: [],
            utmiByModel: [],
            utmiPerCostRatioByModel: [],
            totalUtmiPerCostRatio: 0,
            thematicUtmi: { marketing: 0, affiliation: 0, fiscalEconomic: 0, metierRelated: 0, codeRelated: 0, mediaRelated: 0 },
            mostValuableTopics: [],
            mostCommonActivities: [],
            estimatedRevenueEUR: { fromUSD: 0 },
            currentExchangeRates: COEFFICIENTS.EXCHANGE_RATES,
            mostCommonSectors: [],
            mostCommonTopics: [],
            utmiValuePerHour: 0,
            projectedValue2030: 0,
            developerExperienceContext: { isProfessional: false, yearsOfExperience: 0 },
            // NOUVEAU: Données du CV et revenu universel
            initialCvValue: 0,
            cvLevel: 'Junior',
            monthlyUniversalIncomeEUR: 0,
            // NOUVEAU: Trésorerie
            treasuryBalanceEUR: 0,
        };
    }

    let totalUtmi = 0;
    let totalEstimatedCostUSD = 0;
    let totalEstimatedCostEUR = 0;
    let totalInteractionCount = logs.length;
    let sentimentCounts = { positive: 0, neutral: 0, negative: 0 };
    let utmiByCognitiveAxis = {};
    let utmiByType = {};
    let utmiByModel = {};
    let utmiPerCostByModel = {};
    let thematicUtmi = { marketing: 0, affiliation: 0, fiscalEconomic: 0, metierRelated: 0, codeRelated: 0, mediaRelated: 0 }; // Initialisation complète
    let commonTopicsUtmi = {};
    let commonActivities = {};

    let totalProcessingTime = 0;
    let totalConversationLengthTokens = 0;
    let totalPromptWords = 0;
    let totalResponseTokens = 0;

    const ratesForTarget = COEFFICIENTS.EXCHANGE_RATES;

    logs.forEach(log => {
        // Assurez-vous que log.utmiResult existe et contient les propriétés nécessaires
        const utmi = log.utmiResult && typeof log.utmiResult.utmi === 'number' ? log.utmiResult.utmi : 0;
        const estimatedCostUSD = log.utmiResult && typeof log.utmiResult.estimatedCostUSD === 'number' ? log.utmiResult.estimatedCostUSD : 0;
        const estimatedCostEUR = log.utmiResult && typeof log.utmiResult.estimatedCostEUR === 'number' ? log.utmiResult.estimatedCostEUR : 0;
        
        totalUtmi += utmi;
        totalEstimatedCostUSD += estimatedCostUSD;
        totalEstimatedCostEUR += estimatedCostEUR;

        const sentiment = analyzeTextForSentiment(log.response); // Utilisez log.response pour l'IA
        sentimentCounts[sentiment]++;

        const combinedText = (log.prompt || '') + " " + (log.response || '');
        const cognitiveAxes = detectCognitiveAxis(combinedText);
        for (const axis in cognitiveAxes) {
            if (cognitiveAxes[axis]) {
                utmiByCognitiveAxis[axis] = (utmiByCognitiveAxis[axis] || 0) + utmi;
            }
        }

        const interactionType = determineInteractionType(log);
        utmiByType[interactionType] = (utmiByType[interactionType] || 0) + utmi;

        utmiByModel[log.model] = (utmiByModel[log.model] || 0) + utmi;
        if (!utmiPerCostByModel[log.model]) {
            utmiPerCostByModel[log.model] = { utmi: 0, cost: 0 };
        }
        utmiPerCostByModel[log.model].utmi += utmi;
        utmiPerCostByModel[log.model].cost += estimatedCostEUR;

        const thematicFocus = determineThematicFocus(combinedText);
        for (const theme in thematicFocus) {
            if (thematicFocus[theme]) {
                thematicUtmi[theme] = (thematicUtmi[theme] || 0) + utmi;
            }
        }

        if (log.prompt) {
            const promptWords = String(log.prompt).toLowerCase().split(/\s+/);
            promptWords.forEach(word => {
                if (word.length > 3) {
                    commonTopicsUtmi[word] = (commonTopicsUtmi[word] || 0) + utmi / promptWords.length;
                }
            });
        }
        if (log.interactionCategory) { // Assurez-vous que log.interactionCategory est bien défini dans les logs
            commonActivities[log.interactionCategory] = (commonActivities[log.interactionCategory] || 0) + 1;
        }

        totalProcessingTime += log.processingTimeMs || 0;
        if (interactionType === 'chat_message' && log.response) { // Utilisez log.response
            totalConversationLengthTokens += String(log.response).split(/\s+/).length;
        }
        totalPromptWords += log.prompt ? String(log.prompt).split(/\s+/).filter(word => word.length > 0).length : 0;
        totalResponseTokens += log.response ? String(log.response).split(/\s+/).filter(word => word.length > 0).length : 0; // Utilisez log.response
    });

    const averageUtmiPerInteraction = totalInteractionCount > 0 ? totalUtmi / totalInteractionCount : 0;
    const averageCostPerInteraction = totalInteractionCount > 0 ? totalEstimatedCostEUR / totalInteractionCount : 0;

    let utmiPerCostRatioByModel = {};
    for (const model in utmiPerCostByModel) {
        if (utmiPerCostByModel[model].cost > 0) {
            utmiPerCostRatioByModel[model] = parseFloat((utmiPerCostByModel[model].utmi / utmiPerCostByModel[model].cost).toFixed(2));
        } else {
            utmiPerCostRatioByModel[model] = utmiPerCostByModel[model].utmi > 0 ? Infinity : 0;
        }
    }
    const totalUtmiPerCostRatio = totalEstimatedCostEUR > 0 ? parseFloat((totalUtmi / totalEstimatedCostEUR).toFixed(2)) : (totalUtmi > 0 ? Infinity : 0);

    const getSortedUtmiByValue = (obj) => Object.entries(obj).sort(([, a], [, b]) => b - a).map(([key, value]) => ({ [key]: parseFloat(value.toFixed(2)) }));
    const getSortedActivitiesByCount = (obj) => Object.entries(obj).sort(([, a], [, b]) => b - a).map(([key, value]) => ({ [key]: value }));

    const developerExperienceContext = {
        isProfessional: true,
        yearsOfExperience: 5
    };

    const utmiValuePerHour = COEFFICIENTS.UTMI_TO_CURRENCY_VALUE ?
                             (COEFFICIENTS.UTMI_TO_CURRENCY_VALUE.UTMI_TO_EUR_BASE * COEFFICIENTS.TIME_PER_SECOND_UTMI * 3600) : 0;

    const projectedValue2030 = totalUtmi * 1.5;

    // --- NOUVEAU: Calcul du score initial du CV et du niveau ---
    let initialCvValue = 0;
    let cvLevelData = { level: 'Junior' };
    if (cvStructuredData) {
        initialCvValue = calculateInitialCvValue(cvStructuredData);
        cvLevelData = getCvLevel(initialCvValue);
    }

    // --- NOUVEAU: Calcul du Revenu Universel Mensuel ---
    let monthlyUniversalIncomeEUR = calculateMonthlyUniversalIncome(
        totalUtmi, // totalUtmPoints dans le context de RUM
        initialCvValue,
        cvLevelData
    );

    // --- NOUVEAU: Gestion de la Trésorerie (simple cumul) ---
    const { totalUtmPoints: currentTotalUtmPoints, totalCost: currentTotalCost } = calculateCurrentUTMAndPIPoints(logs);
    let treasuryBalanceEUR = calculateUtmiValueInEUR(currentTotalUtmPoints, currentTotalCost);


    const sentimentSummary = {
        positive: parseFloat(sentimentCounts.positive.toFixed(2)),
        neutral: parseFloat(sentimentCounts.neutral.toFixed(2)),
        negative: parseFloat(sentimentCounts.negative.toFixed(2))
    };

    return {
        totalUtmi: parseFloat(totalUtmi.toFixed(2)),
        totalEstimatedCostUSD: parseFloat(totalEstimatedCostUSD.toFixed(6)),
        totalEstimatedCostEUR: parseFloat(totalEstimatedCostEUR.toFixed(6)),
        totalInteractionCount: totalInteractionCount,
        totalProcessingTime: parseFloat(totalProcessingTime.toFixed(2)),
        totalConversationLengthTokens: parseFloat(totalConversationLengthTokens.toFixed(2)),
        averageUtmiPerInteraction: parseFloat(averageUtmiPerInteraction.toFixed(2)),
        averageCostPerInteraction: parseFloat(averageCostPerInteraction.toFixed(6)),
        sentimentSummary: sentimentSummary,
        utmiByCognitiveAxis: getSortedUtmiByValue(utmiByCognitiveAxis),
        utmiByType: getSortedUtmiByValue(utmiByType),
        utmiByModel: getSortedUtmiByValue(utmiByModel),
        thematicUtmi: {
            marketing: parseFloat(thematicUtmi.marketing.toFixed(2)),
            affiliation: parseFloat(thematicUtmi.affiliation.toFixed(2)),
            fiscalEconomic: parseFloat(thematicUtmi.fiscalEconomic.toFixed(2)),
            metierRelated: parseFloat(thematicUtmi.metierRelated.toFixed(2)),
            codeRelated: parseFloat(thematicUtmi.codeRelated.toFixed(2)), // NOUVEAU
            mediaRelated: parseFloat(thematicUtmi.mediaRelated.toFixed(2)), // NOUVEAU
        },
        utmiPerCostRatioByModel: utmiPerCostRatioByModel,
        totalUtmiPerCostRatio: parseFloat(totalUtmiPerCostRatio.toFixed(2)),
        mostValuableTopics: getSortedUtmiByValue(commonTopicsUtmi).slice(0, 5),
        mostCommonActivities: getSortedActivitiesByCount(commonActivities).slice(0, 5),
        exchangeRates: ratesForTarget,

        estimatedRevenueEUR: {
            fromUSD: parseFloat(calculateUtmiValueInEUR(totalUtmi, null).toFixed(2)), // Utilise calculateUtmiValueInEUR pour la valeur UTMI brute
        },
        currentExchangeRates: ratesForTarget,
        mostCommonSectors: [],
        mostCommonTopics: getSortedUtmiByValue(commonTopicsUtmi).slice(0, 5),
        utmiValuePerHour: parseFloat(utmiValuePerHour.toFixed(2)),
        projectedValue2030: parseFloat(projectedValue2030.toFixed(2)),
        developerExperienceContext: developerExperienceContext,

        // NOUVEAU: Données de valorisation du CV et RUM
        initialCvValue: parseFloat(initialCvValue.toFixed(2)),
        cvLevel: cvLevelData.level,
        monthlyUniversalIncomeEUR: parseFloat(monthlyUniversalIncomeEUR.toFixed(2)),
        treasuryBalanceEUR: parseFloat(treasuryBalanceEUR.toFixed(2)),
    };
}


// --- Fonctions de calcul du CV et du Revenu Universel Mensuel (NOUVEAU) ---

/**
 * Calcule le score de qualité initial d'un CV basé sur ses données structurées.
 * Ce score reflète le "capital de départ" du CV.
 * @param {object} structuredCvData - Les données structurées du CV (produit de parse-and-structure).
 * @returns {number} Le score initial calculé pour le CV.
 */
function calculateInitialCvValue(structuredCvData) {
    let score = 0;
    const cvCoeff = COEFFICIENTS.CV_VALORIZATION;

    if (!structuredCvData) {
        return 0;
    }

    // 1. Valorisation des expériences professionnelles
    if (structuredCvData.experiences && Array.isArray(structuredCvData.experiences)) {
        structuredCvData.experiences.forEach(exp => {
            if (exp.startDate && exp.endDate) {
                const start = new Date(exp.startDate);
                const end = new Date(exp.endDate);
                const years = (end - start) / (1000 * 60 * 60 * 24 * 365); // Années d'expérience
                score += years * cvCoeff.BASE_SCORE_PER_EXPERIENCE_YEAR;
            }
            if (exp.description && (String(exp.description).includes("augmenté") || String(exp.description).includes("réduit") || String(exp.description).includes("optimisé") || String(exp.description).includes("amélioré"))) {
                score += cvCoeff.IMPACT_STATEMENT_BONUS;
            }
            if (exp.projects && Array.isArray(exp.projects)) {
                score += exp.projects.length * cvCoeff.BONUS_PROJECT_CONTRIBUTION;
            }
        });
    }

    // 2. Valorisation de l'éducation
    if (structuredCvData.educations && Array.isArray(structuredCvData.educations)) {
        structuredCvData.educations.forEach(edu => {
            const degree = edu.degree || "Autre";
            const levelScore = cvCoeff.BASE_SCORE_PER_EDUCATION_LEVEL[degree] || cvCoeff.BASE_SCORE_PER_EDUCATION_LEVEL["Autre"];
            score += levelScore;
        });
    }

    // 3. Valorisation des compétences
    if (structuredCvData.skills && Array.isArray(structuredCvData.skills)) {
        structuredCvData.skills.forEach(skill => {
            score += cvCoeff.SCORE_PER_SKILL;
        });
    }

    // 4. Valorisation des langues
    if (structuredCvData.languages && Array.isArray(structuredCvData.languages)) {
        score += structuredCvData.languages.length * cvCoeff.BONUS_PER_LANGUAGE;
    }

    // 5. Valorisation des certifications et licences
    if (structuredCvData.certifications && Array.isArray(structuredCvData.certifications)) {
        structuredCvData.certifications.forEach(cert => {
            score += cvCoeff.BONUS_PER_LICENSE;
        });
    }

    // 6. Valorisation des projets (si non déjà inclus dans les expériences)
    if (structuredCvData.projects && Array.isArray(structuredCvData.projects)) {
        // Double vérification pour éviter de compter deux fois si déjà inclus dans expériences
        const projectsInExperiences = structuredCvData.experiences ? structuredCvData.experiences.flatMap(exp => exp.projects || []) : [];
        const uniqueProjects = new Set(structuredCvData.projects.filter(p => !projectsInExperiences.includes(p)));
        score += uniqueProjects.size * cvCoeff.BONUS_PROJECT_CONTRIBUTION;
    }

    return parseFloat(score.toFixed(2));
}

/**
 * Détermine le niveau du CV (Junior, Moyen, Senior) basé sur un score.
 * @param {number} cvScore - Le score calculé du CV.
 * @returns {object} Un objet contenant le niveau du CV (Junior, Moyen, Senior) et des drapeaux.
 */
function getCvLevel(cvScore) {
    const cvCoeff = COEFFICIENTS.CV_VALORIZATION;
    if (cvScore >= cvCoeff.SENIOR_THRESHOLD) {
        return { level: "Senior", senior: true, middle: false, junior: false };
    } else if (cvScore >= cvCoeff.MIDDLE_THRESHOLD) {
        return { level: "Moyen", senior: false, middle: true, junior: false };
    } else {
        return { level: "Junior", senior: false, middle: false, junior: true };
    }
}

/**
 * Calcule le revenu universel mensuel progressif.
 * Ce calcul doit idéalement être fait mensuellement et stocké pour chaque utilisateur.
 * Pour cet exemple, il est basé sur les données cumulées actuelles.
 * @param {number} totalUtmPoints - Le total des UTMi cumulés par l'utilisateur (renommé pour clarté).
 * @param {number} cvValueScore - Le score initial du CV.
 * @param {object} cvLevelData - Objet indiquant le niveau du CV (ex: { junior: true }).
 * @returns {number} Le montant du revenu universel mensuel en EUR.
 */
function calculateMonthlyUniversalIncome(totalUtmPoints, cvValueScore, cvLevelData) {
    const incomeCoeff = COEFFICIENTS.MONTHLY_UNIVERSAL_INCOME;
    let income = 0;

    // Revenu basé sur la valeur du CV
    income += cvValueScore * incomeCoeff.BASE_INCOME_PER_CV_POINT_EUR;

    // Revenu basé sur les UTMi cumulés (revalorisation des interactions)
    income += totalUtmPoints * incomeCoeff.BASE_INCOME_PER_UTMI_EUR;

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
    updateUtmi, // Fonction placeholder
    calculateCityzenReward,
    calculateActivityScore,
    calculateCurrentUTMAndPIPoints,
    calculateUtmiValueInEUR,
    COEFFICIENTS,
    convertValueToEUR,
    determineInteractionType,
    detectCognitiveAxis,
    determineThematicFocus,
    analyzeTextForSentiment,
    analyzeTextForTermValuation,
    calculateDashboardInsights,
    calculateInitialCvValue,      // NOUVEAU : Exportation de la fonction de calcul du CV
    getCvLevel,                  // NOUVEAU : Exportation de la fonction de niveau du CV
    calculateMonthlyUniversalIncome, // NOUVEAU : Exportation de la fonction de RUM
};