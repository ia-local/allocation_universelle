// server_modules/utms_calculator.js

/**
 * Moteur de calcul des Unités Temporelles Monétisables (UTMi) et d'analyse des insights.
 * Cette version intègre :
 * - La valorisation des interactions et activités.
 * - L'analyse des données historiques (logs) pour générer des rapports d'insights détaillés.
 * - La prise en compte des attributs CVNU et du contexte économique.
 * - La consolidation des logs et la détection des thématiques (marketing, affiliation, fiscale/économique).
 * - **Nouveau :** Prise en compte de la qualité des modèles d'IA.
 */

// --- Coefficients de Valorisation (ajustables) ---
const COEFFICIENTS = {
    TIME_PER_SECOND_UTMI: 0.1,

    PROMPT: {
        BASE_UTMI_PER_WORD: 0.5,
        COMPLEXITY_MULTIPLIER: 1.2,
        IMPACT_MULTIPLIER: 1.5,
        UNIQUE_CONCEPT_BONUS: 5,
        FISCAL_ECONOMIC_TOPIC_BONUS: 3,
        METIER_RELATED_PROMPT_BONUS: 2,
    },

    AI_RESPONSE: {
        BASE_UTMI_PER_TOKEN: 0.1,
        RELEVANCE_MULTIPLIER: 1.3,
        COHERENCE_MULTIPLIER: 1.1,
        COMPLETENESS_MULTIPLIER: 1.2,
        PROBLEM_SOLVED_MICRO_BONUS: 0.5,
        FISCAL_ECONOMIC_INSIGHT_BONUS: 7,
        METIER_SPECIFIC_SOLUTION_BONUS: 5,
        // NOUVEAU: Base pour le multiplicateur de qualité du modèle, ajusté par MODEL_QUALITY_SCORES
        MODEL_QUALITY_MULTIPLIER_DEFAULT: 1.0
    },

    CODE_GENERATION: {
        BASE_UTMI_PER_LINE: 0.8,
        COMPLEXITY_MULTIPLIER: 1.5,
        REUSABILITY_BONUS: 10,
        TEST_COVERAGE_BONUS: 7,
        SECURITY_FIX_BONUS: 15,
        PERFORMANCE_IMPROVEMENT_BONUS: 12,
    },

    DOCUMENT_GENERATION: {
        BASE_UTMI_PER_PAGE: 1.5,
        DETAIL_LEVEL_MULTIPLIER: 1.1,
        ACCURACY_BONUS: 8,
        LEGAL_COMPLIANCE_BONUS: 12,
        CUSTOMIZATION_BONUS: 6,
    },

    MEDIA_GENERATION: {
        BASE_UTMI_PER_ITEM: 3,
        CREATIVITY_MULTIPLIER: 1.3,
        USAGE_BONUS_PER_VIEW: 0.05,
        BRAND_ALIGNMENT_BONUS: 4,
    },

    USER_INTERACTION: {
        FEEDBACK_SUBMISSION_UTMI: 2,
        CORRECTION_UTMI: 3,
        VALIDATION_UTMI: 1.5,
        SHARING_UTMI: 2.5,
        TRAINING_DATA_CONTRIBUTION_UTMI: 4,
    },

    CVNU: { // Contexte, Valeur, Connaissance, Unicité
        CVNU_VALUE_MULTIPLIER: 0.2, // Multiplicateur appliqué à la valeur CVNU de l'utilisateur
    },

    ECONOMIC_IMPACT: {
        REVENUE_GENERATION_MULTIPLIER: 0.0001, // Par USD/EUR généré
        COST_SAVING_MULTIPLIER: 0.00008,     // Par USD/EUR économisé
        EFFICIENCY_GAIN_MULTIPLIER: 0.00015, // Par pourcentage d'efficacité gagné
        BUDGET_SURPLUS_BONUS: 0.05, // Bonus pour un budget positif
    },

    TAX_AI_SPECIFIC: {
        TAX_ADVICE_ACCURACY_BONUS: 10,
        COMPLIANCE_RISK_REDUCTION_UTMI: 15,
        OPTIMIZATION_OPPORTUNITY_UTMI: 20,
    },

    COGNITIVE_AXES: { // Utmi par axe cognitif
        CONCENTRATION: 0.1, // Attention soutenue
        ADAPTATION: 0.15,   // Capacité à gérer l'incertitude
        IMAGINATION: 0.2,   // Génération d'idées nouvelles
        STRATEGY: 0.25,     // Planification et prise de décision
        ANALYSIS: 0.18,     // Décomposition et compréhension
        SYNTHESIS: 0.22,    // Combinaison d'éléments
        COMMUNICATION: 0.12 // Expression claire
    },

    LOG_TYPES: {
        PROMPT: 'prompt',
        AI_RESPONSE: 'ai_response',
        CODE_GENERATION: 'code_generation',
        DOCUMENT_GENERATION: 'document_generation',
        MEDIA_GENERATION: 'media_generation',
        USER_INTERACTION: 'user_interaction',
        SYSTEM_PROCESS: 'system_process' // Pour des processus internes non directement interactifs
    },

    THEMATIC_MULTIPLIERS: {
        MARKETING: 1.2,
        AFFILIATION: 1.1,
        FISCAL_ECONOMIC: 1.5,
        OTHER: 1.0 // Multiplicateur par défaut
    },

    // Définition des termes clés pour la détection thématique
    THEMATIC_KEYWORDS: {
        MARKETING: ['marketing', 'publicité', 'campagne', 'vente', 'promotion', 'client', 'produit', 'marque', 'seo', 'sem', 'social media'],
        AFFILIATION: ['affiliation', 'partenaire', 'commission', 'lien affilié', 'affilié', 'revenu passif'],
        FISCAL_ECONOMIC: ['impôt', 'fiscalité', 'économie', 'finance', 'investissement', 'budget', 'déclaration', 'crédit', 'défiscalisation', 'amortissement', 'tva', 'bilan', 'comptabilité', 'audit'],
    },

    // Activités courantes et leurs coefficients (nouvelle section)
    COMMON_ACTIVITIES: {
        DATA_ANALYSIS: { utmi_bonus: 5, keywords: ['analyse données', 'rapport', 'statistiques', 'tendances', 'modèle prédictif'] },
        REPORT_GENERATION: { utmi_bonus: 7, keywords: ['rapport', 'compte-rendu', 'synthèse', 'document', 'bilan'] },
        CUSTOMER_SUPPORT: { utmi_bonus: 4, keywords: ['support client', 'aide', 'faq', 'problème', 'assistance'] },
        CONTENT_CREATION: { utmi_bonus: 6, keywords: ['contenu', 'article', 'blog', 'rédaction', 'écriture', 'création'] },
        CODE_DEBUGGING: { utmi_bonus: 8, keywords: ['bug', 'erreur', 'débug', 'fix', 'correction code'] },
        LEGAL_RESEARCH: { utmi_bonus: 9, keywords: ['légal', 'loi', 'réglementation', 'jurisprudence', 'contrat'] },
        FINANCIAL_FORECASTING: { utmi_bonus: 10, keywords: ['prévision financière', 'budget', 'projection', 'cash flow', 'planification'] },
        // Ajoutez d'autres activités avec leurs mots-clés et bonus
    },

    // Définition des fourchettes pour le score d'activité
    ACTIVITY_SCORE_THRESHOLDS: {
        LOW: 0.1,    // Score < 0.1
        MEDIUM: 0.5, // Score entre 0.1 et 0.5
        HIGH: 1.0    // Score > 0.5
    },

    // Bonus par niveau de score d'activité
    ACTIVITY_SCORE_BONUS: {
        LOW: 0.5,
        MEDIUM: 2,
        HIGH: 5
    }
};

// Fonctions utilitaires pour le dashboard
function getSortedUtmiByValue(obj) {
    return Object.entries(obj)
        .filter(([, value]) => value > 0)
        .sort((a, b) => b[1] - a[1])
        .map(([key, value]) => ({ name: key, utmi: parseFloat(value.toFixed(2)) }));
}

function getSortedActivitiesByCount(obj) {
    return Object.entries(obj)
        .filter(([, value]) => value > 0)
        .sort((a, b) => b[1] - a[1])
        .map(([key, value]) => ({ name: key, count: value }));
}

function convertValueToEUR(value, currency, rates) {
    if (!rates || !rates.USD || !rates.GBP) {
        console.warn("Exchange rates not available for conversion.");
        return value; // Retourne la valeur originale si les taux ne sont pas disponibles
    }
    switch (currency.toUpperCase()) {
        case 'USD':
            return value * rates.USD;
        case 'GBP':
            return value * rates.GBP;
        case 'EUR':
        default:
            return value;
    }
}

function detectCognitiveAxis(text) {
    const axesDetected = {};
    for (const axis in COEFFICIENTS.COGNITIVE_AXES) {
        // Ceci est une simplification. Une vraie détection requerrait du NLP avancé.
        // Ici, nous faisons une détection basée sur des mots-clés imaginaires ou une logique simplifiée.
        // Par exemple, si le texte contient "analyse de données", cela pourrait indiquer "ANALYSIS".
        // Pour cet algorithme, nous allons juste prendre un exemple simple.
        if (text.includes(axis.toLowerCase())) { // Très basique pour l'exemple
            axesDetected[axis] = 1; // Présence de l'axe
        }
    }
    // Pour l'exemple, si aucun axe n'est détecté, on attribue à "ANALYSIS" par défaut.
    if (Object.keys(axesDetected).length === 0) {
        axesDetected.ANALYSIS = 1;
    }
    return axesDetected;
}

function analyzeTextForThemes(text) {
    const detectedThemes = {};
    const lowerText = text.toLowerCase();

    for (const theme in COEFFICIENTS.THEMATIC_KEYWORDS) {
        const keywords = COEFFICIENTS.THEMATIC_KEYWORDS[theme];
        for (const keyword of keywords) {
            if (lowerText.includes(keyword)) {
                detectedThemes[theme] = (detectedThemes[theme] || 0) + 1;
                break; // Un seul mot-clé suffit pour détecter la thématique
            }
        }
    }
    return detectedThemes;
}

function calculateActivityScore(text) {
    let score = 0;
    const detectedActivities = {};
    const lowerText = text.toLowerCase();

    for (const activityName in COEFFICIENTS.COMMON_ACTIVITIES) {
        const activity = COEFFICIENTS.COMMON_ACTIVITIES[activityName];
        let activityMatchCount = 0;
        for (const keyword of activity.keywords) {
            if (lowerText.includes(keyword)) {
                activityMatchCount++;
            }
        }
        if (activityMatchCount > 0) {
            // Un score d'activité pourrait être basé sur le nombre de mots-clés ou leur poids
            detectedActivities[activityName] = activityMatchCount;
            score += activity.utmi_bonus * activityMatchCount; // Accumule un score brut
        }
    }

    // Normalisation du score si nécessaire, ou utilisation directe du score brut
    // Pour cet exemple, nous allons utiliser une simple classification par seuils
    let bonus = 0;
    if (score > 0) {
        if (score >= COEFFICIENTS.ACTIVITY_SCORE_THRESHOLDS.HIGH) {
            bonus = COEFFICIENTS.ACTIVITY_SCORE_BONUS.HIGH;
        } else if (score >= COEFFICIENTS.ACTIVITY_SCORE_THRESHOLDS.MEDIUM) {
            bonus = COEFFICIENTS.ACTIVITY_SCORE_BONUS.MEDIUM;
        } else {
            bonus = COEFFICIENTS.ACTIVITY_SCORE_BONUS.LOW;
        }
    }
    return { score, detectedActivities, bonus };
}

/**
 * Calcule les Unités Temporelles Monétisables (UTMi) pour une interaction donnée.
 * @param {object} interaction - L'objet interaction (type, data).
 * @param {number} userCvnuValue - La valeur CVNU de l'utilisateur (0 à 1).
 * @param {object} economicContext - Le contexte économique.
 * @param {object} modelQualityScores - Les scores de qualité des modèles d'IA (ex: { "llama3-8b": { quality_multiplier: 1.2 } }).
 * @returns {number} La valeur UTMi calculée.
 */
function calculateUtmi(interaction, userCvnuValue, economicContext, modelQualityScores = {}) {
    let utmi = 0;
    const type = interaction.type;
    const data = interaction.data || {}; // S'assurer que data est un objet

    // Récupérer les scores de qualité spécifiques au modèle si c'est une réponse AI
    const modelId = data.modelId;
    const modelScores = modelQualityScores[modelId] || modelQualityScores.default || {};
    const aiModelQualityMultiplier = modelScores.quality_multiplier || COEFFICIENTS.AI_RESPONSE.MODEL_QUALITY_MULTIPLIER_DEFAULT;

    switch (type) {
        case COEFFICIENTS.LOG_TYPES.PROMPT:
            // Assurez-vous que data.wordCount est un nombre
            const wordCount = typeof data.wordCount === 'number' ? data.wordCount : 0;
            utmi += wordCount * COEFFICIENTS.PROMPT.BASE_UTMI_PER_WORD;
            if (data.complexityMultiplier) utmi *= data.complexityMultiplier;
            if (data.impactMultiplier) utmi *= data.impactMultiplier;
            if (data.isUniqueConcept) utmi += COEFFICIENTS.PROMPT.UNIQUE_CONCEPT_BONUS;
            if (data.isFiscalEconomicTopic) utmi += COEFFICIENTS.PROMPT.FISCAL_ECONOMIC_TOPIC_BONUS;
            if (data.isMetierRelated) utmi += COEFFICIENTS.PROMPT.METIER_RELATED_PROMPT_BONUS;
            break;

        case COEFFICIENTS.LOG_TYPES.AI_RESPONSE:
            const tokenCount = typeof data.tokenCount === 'number' ? data.tokenCount : 0;
            let baseAiUtmi = tokenCount * COEFFICIENTS.AI_RESPONSE.BASE_UTMI_PER_TOKEN;

            if (data.relevance) baseAiUtmi *= COEFFICIENTS.AI_RESPONSE.RELEVANCE_MULTIPLIER;
            if (data.coherence) baseAiUtmi *= COEFFICIENTS.AI_RESPONSE.COHERENCE_MULTIPLIER;
            if (data.completeness) baseAiUtmi *= COEFFICIENTS.AI_RESPONSE.COMPLETENESS_MULTIPLIER;
            if (data.problemSolved) baseAiUtmi += COEFFICIENTS.AI_RESPONSE.PROBLEM_SOLVED_MICRO_BONUS;
            if (data.isFiscalEconomicInsight) baseAiUtmi += COEFFICIENTS.AI_RESPONSE.FISCAL_ECONOMIC_INSIGHT_BONUS;
            if (data.isMetierSpecificSolution) baseAiUtmi += COEFFICIENTS.AI_RESPONSE.METIER_SPECIFIC_SOLUTION_BONUS;

            // Appliquer les bonus de qualité spécifiques au modèle
            if (modelScores.response_relevance_bonus && data.relevance) {
                baseAiUtmi += COEFFICIENTS.AI_RESPONSE.BASE_UTMI_PER_TOKEN * tokenCount * modelScores.response_relevance_bonus;
            }
            if (modelScores.coherence_bonus && data.coherence) {
                baseAiUtmi += COEFFICIENTS.AI_RESPONSE.BASE_UTMI_PER_TOKEN * tokenCount * modelScores.coherence_bonus;
            }
            if (modelScores.problem_solving_capability && data.problemSolved) {
                baseAiUtmi += COEFFICIENTS.AI_RESPONSE.PROBLEM_SOLVED_MICRO_BONUS * modelScores.problem_solving_capability;
            }

            utmi = baseAiUtmi * aiModelQualityMultiplier; // Appliquer le multiplicateur global du modèle
            break;

        case COEFFICIENTS.LOG_TYPES.CODE_GENERATION:
            const lineCount = typeof data.lineCount === 'number' ? data.lineCount : 0;
            utmi += lineCount * COEFFICIENTS.CODE_GENERATION.BASE_UTMI_PER_LINE;
            if (data.complexityMultiplier) utmi *= data.complexityMultiplier;
            if (data.reusability) utmi += COEFFICIENTS.CODE_GENERATION.REUSABILITY_BONUS;
            if (data.testCoverage) utmi += COEFFICIENTS.CODE_GENERATION.TEST_COVERAGE_BONUS;
            if (data.securityFix) utmi += COEFFICIENTS.CODE_GENERATION.SECURITY_FIX_BONUS;
            if (data.performanceImprovement) utmi += COEFFICIENTS.CODE_GENERATION.PERFORMANCE_IMPROVEMENT_BONUS;
            break;

        case COEFFICIENTS.LOG_TYPES.DOCUMENT_GENERATION:
            const pageCount = typeof data.pageCount === 'number' ? data.pageCount : 0;
            utmi += pageCount * COEFFICIENTS.DOCUMENT_GENERATION.BASE_UTMI_PER_PAGE;
            if (data.detailLevelMultiplier) utmi *= data.detailLevelMultiplier;
            if (data.accuracy) utmi += COEFFICIENTS.DOCUMENT_GENERATION.ACCURACY_BONUS;
            if (data.legalCompliance) utmi += COEFFICIENTS.DOCUMENT_GENERATION.LEGAL_COMPLIANCE_BONUS;
            if (data.customization) utmi += COEFFICIENTS.DOCUMENT_GENERATION.CUSTOMIZATION_BONUS;
            break;

        case COEFFICIENTS.LOG_TYPES.MEDIA_GENERATION:
            const itemCount = typeof data.itemCount === 'number' ? data.itemCount : 0;
            utmi += itemCount * COEFFICIENTS.MEDIA_GENERATION.BASE_UTMI_PER_ITEM;
            if (data.creativityMultiplier) utmi *= data.creativityMultiplier;
            if (data.usageViews && data.usageViews > 0) {
                utmi += data.usageViews * COEFFICIENTS.MEDIA_GENERATION.USAGE_BONUS_PER_VIEW;
            }
            if (data.brandAlignment) utmi += COEFFICIENTS.MEDIA_GENERATION.BRAND_ALIGNMENT_BONUS;
            break;

        case COEFFICIENTS.LOG_TYPES.USER_INTERACTION:
            if (data.feedbackSubmitted) utmi += COEFFICIENTS.USER_INTERACTION.FEEDBACK_SUBMISSION_UTMI;
            if (data.correctionProvided) utmi += COEFFICIENTS.USER_INTERACTION.CORRECTION_UTMI;
            if (data.validationPerformed) utmi += COEFFICIENTS.USER_INTERACTION.VALIDATION_UTMI;
            if (data.sharedContent) utmi += COEFFICIENTS.USER_INTERACTION.SHARING_UTMI;
            if (data.trainingDataContributed) utmi += COEFFICIENTS.USER_INTERACTION.TRAINING_DATA_CONTRIBUTION_UTMI;
            break;

        case COEFFICIENTS.LOG_TYPES.SYSTEM_PROCESS:
            // Exemple de calcul pour un processus système, si applicable
            // utmi += data.computeTimeSeconds * COEFFICIENTS.TIME_PER_SECOND_UTMI;
            // if (data.criticality) utmi *= data.criticalityMultiplier;
            break;

        default:
            console.warn(`Unknown interaction type: ${type}`);
            return 0; // Retourne 0 pour les types d'interaction non reconnus
    }

    // Appliquer les multiplicateurs CVNU (si l'utilisateur a une valeur CVNU)
    if (typeof userCvnuValue === 'number' && userCvnuValue > 0) {
        utmi *= (1 + userCvnuValue * COEFFICIENTS.CVNU.CVNU_VALUE_MULTIPLIER);
    }

    // Appliquer l'impact économique
    if (economicContext) {
        if (typeof economicContext.revenueGeneratedEUR === 'number' && economicContext.revenueGeneratedEUR > 0) {
            utmi += economicContext.revenueGeneratedEUR * COEFFICIENTS.ECONOMIC_IMPACT.REVENUE_GENERATION_MULTIPLIER;
        }
        if (typeof economicContext.costSavedEUR === 'number' && economicContext.costSavedEUR > 0) {
            utmi += economicContext.costSavedEUR * COEFFICIENTS.ECONOMIC_IMPACT.COST_SAVING_MULTIPLIER;
        }
        if (typeof economicContext.efficiencyGainPercentage === 'number' && economicContext.efficiencyGainPercentage > 0) {
            utmi += economicContext.efficiencyGainPercentage * COEFFICIENTS.ECONOMIC_IMPACT.EFFICIENCY_GAIN_MULTIPLIER;
        }
        if (typeof economicContext.currentBudgetSurplus === 'number' && economicContext.currentBudgetSurplus > 0) {
            utmi *= (1 + economicContext.currentBudgetSurplus / 1000000 * COEFFICIENTS.ECONOMIC_IMPACT.BUDGET_SURPLUS_BONUS);
        }
    }

    // Détection thématique et application du multiplicateur
    const interactionText = data.text || ''; // Supposons que l'interaction a une propriété 'text'
    const detectedThemes = analyzeTextForThemes(interactionText);
    let thematicMultiplier = COEFFICIENTS.THEMATIC_MULTIPLIERS.OTHER;
    if (detectedThemes.MARKETING) thematicMultiplier = Math.max(thematicMultiplier, COEFFICIENTS.THEMATIC_MULTIPLIERS.MARKETING);
    if (detectedThemes.AFFILIATION) thematicMultiplier = Math.max(thematicMultiplier, COEFFICIENTS.THEMATIC_MULTIPLIERS.AFFILIATION);
    if (detectedThemes.FISCAL_ECONOMIC) thematicMultiplier = Math.max(thematicMultiplier, COEFFICIENTS.THEMATIC_MULTIPLIERS.FISCAL_ECONOMIC);
    utmi *= thematicMultiplier;

    // Calcul et bonus du score d'activité
    const activityResult = calculateActivityScore(interactionText);
    utmi += activityResult.bonus;

    return parseFloat(utmi.toFixed(2));
}

/**
 * Met à jour le total UTMi et les insights basés sur un log d'interaction.
 * (Cette fonction est simplifiée pour ne pas dépendre d'un stockage persistant pour l'instant)
 * @param {object} log - Le log d'interaction complet incluant type, data, userCvnuValue, economicContext.
 * @param {object} modelQualityScores - Les scores de qualité des modèles d'IA.
 * @returns {number} L'UTMi calculé pour ce log.
 */
function updateUtmi(log, modelQualityScores) {
    // Dans une application réelle, cette fonction mettrait à jour une base de données
    // ou un état global agrégé des UTMi.
    // Pour cet exemple, elle calcule juste l'UTMi du log donné.
    const utmiForLog = calculateUtmi(log.interaction, log.userCvnuValue, log.economicContext, modelQualityScores);
    return utmiForLog;
}

/**
 * Calcule les insights agrégés à partir d'une liste de logs d'interactions.
 * @param {Array<object>} logs - Tableau des logs d'interactions. Chaque log doit contenir { interaction, userCvnuValue, economicContext, timestamp, ...autres_données }
 * @param {object} currentExchangeRates - Taux de change actuels (ex: { USD: 0.92, GBP: 1.18 }).
 * @param {object} modelQualityScores - Les scores de qualité des modèles d'IA.
 * @returns {object} Un objet contenant divers insights.
 */
function calculateDashboardInsights(logs, currentExchangeRates, modelQualityScores) {
    let totalUtmi = 0;
    let totalInteractionCount = logs.length;
    let totalProcessingTime = 0; // À remplir si les logs contiennent le temps de traitement
    let totalConversationLength = 0; // Somme des longueurs de conversation (par exemple, total des tokens/mots)

    const totalUtmiByCognitiveAxis = {};
    const totalUtmiByType = {};
    const commonTopicsUtmi = {}; // UTMi agrégé par topic
    const commonActivities = {}; // Compteur d'occurrences par activité
    let totalMarketingUtmi = 0;
    let totalAffiliationUtmi = 0;
    let totalFiscalEconomicUtmi = 0;

    // Initialiser les axes cognitifs à 0
    for (const axis in COEFFICIENTS.COGNITIVE_AXES) {
        totalUtmiByCognitiveAxis[axis] = 0;
    }

    logs.forEach(log => {
        // Calculer l'UTMi pour chaque log en utilisant la fonction calculateUtmi
        const utmiForLog = calculateUtmi(log.interaction, log.userCvnuValue, log.economicContext, modelQualityScores);
        totalUtmi += utmiForLog;

        // Agrégation par type d'interaction
        const interactionType = log.interaction.type;
        totalUtmiByType[interactionType] = (totalUtmiByType[interactionType] || 0) + utmiForLog;

        // Détection et agrégation des thématiques
        const interactionText = log.interaction.data.text || '';
        const detectedThemes = analyzeTextForThemes(interactionText);
        if (detectedThemes.MARKETING) totalMarketingUtmi += utmiForLog;
        if (detectedThemes.AFFILIATION) totalAffiliationUtmi += utmiForLog;
        if (detectedThemes.FISCAL_ECONOMIC) totalFiscalEconomicUtmi += utmiForLog;

        // Agrégation des axes cognitifs
        const detectedAxes = detectCognitiveAxis(interactionText);
        for (const axis in detectedAxes) {
            totalUtmiByCognitiveAxis[axis] += utmiForLog * (COEFFICIENTS.COGNITIVE_AXES[axis] || 0);
        }

        // Agrégation des activités
        const activityResult = calculateActivityScore(interactionText);
        for (const activity in activityResult.detectedActivities) {
            commonActivities[activity] = (commonActivities[activity] || 0) + 1;
            // Vous pouvez aussi agréger l'UTMi par activité si vous le souhaitez
            commonTopicsUtmi[activity] = (commonTopicsUtmi[activity] || 0) + utmiForLog;
        }


        // Calcul de la longueur totale de conversation (exemple simple)
        if (log.interaction.data.tokenCount) {
            totalConversationLength += log.interaction.data.tokenCount;
        } else if (log.interaction.data.wordCount) {
            totalConversationLength += log.interaction.data.wordCount;
        }

        // Ajouter d'autres agrégations ici (temps de traitement, sentiment, etc.)
        if (log.processingTimeSeconds) {
            totalProcessingTime += log.processingTimeSeconds;
        }
    });

    const averageConversationLength = totalInteractionCount > 0 ? totalConversationLength / totalInteractionCount : 0;

    // Simulation d'une détection de sentiment très basique
    const sentimentSummary = { positive: 0.7, neutral: 0.2, negative: 0.1 }; // Placeholder

    // Calcul de la valeur monétisable estimée
    const estimatedRevenueEUR_from_USD = convertValueToEUR(totalUtmi * 0.05, 'USD', currentExchangeRates); // Exemple: 1 UTMi = 0.05 USD
    const estimatedRevenueEUR_from_GBP = convertValueToEUR(totalUtmi * 0.04, 'GBP', currentExchangeRates); // Exemple: 1 UTMi = 0.04 GBP

    return {
        totalUtmi: parseFloat(totalUtmi.toFixed(2)),
        totalInteractionCount: totalInteractionCount,
        totalProcessingTime: parseFloat(totalProcessingTime.toFixed(2)),
        averageConversationLength: parseFloat(averageConversationLength.toFixed(2)),
        sentimentSummary: sentimentSummary, // À développer avec une vraie analyse de sentiment
        utmiByCognitiveAxis: getSortedUtmiByValue(totalUtmiByCognitiveAxis),
        utmiByType: getSortedUtmiByValue(totalUtmiByType),
        thematicUtmi: {
            marketing: parseFloat(totalMarketingUtmi.toFixed(2)),
            affiliation: parseFloat(totalAffiliationUtmi.toFixed(2)),
            fiscalEconomic: parseFloat(totalFiscalEconomicUtmi.toFixed(2))
        },
        estimatedRevenueEUR: {
            fromUSD: parseFloat(estimatedRevenueEUR_from_USD.toFixed(2)),
            fromGBP: parseFloat(estimatedRevenueEUR_from_GBP.toFixed(2))
        },
        mostValuableTopics: getSortedUtmiByValue(commonTopicsUtmi).slice(0, 5), // Top 5 par UTMi
        mostCommonActivities: getSortedActivitiesByCount(commonActivities).slice(0, 5), // Top 5 par nombre
        currentExchangeRates: currentExchangeRates,
    };
}

// Exportation des fonctions et coefficients
module.exports = {
    calculateUtmi,
    updateUtmi, // Exporter si vous voulez l'utiliser directement pour un seul log
    calculateActivityScore,
    calculateDashboardInsights,
    COEFFICIENTS,
    convertValueToEUR,
    detectCognitiveAxis,
    analyzeTextForThemes // Exporter si vous voulez l'utiliser séparément
};