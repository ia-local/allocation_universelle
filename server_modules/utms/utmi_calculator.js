// server_modules/utms/utmi_calculator.js
const { COEFFICIENTS } = require('./constants');
const { logApiCall } = require('../utils/api_logger'); // Assurez-vous du chemin correct

/**
 * Calcule le montant d'UTMi pour une interaction donnée.
 * @param {object} interactionDetails - Détails de l'interaction (complexité, qualité, pertinence, model, etc.).
 * @returns {number} Le montant d'UTMi généré.
 */
function calculateUtmi(interactionDetails) {
    const { complexity = 1, quality = 1, relevance = 1, model = 'gemma2-9b-it', isRepeated = false } = interactionDetails;

    let utmi = COEFFICIENTS.BASE_UTMI_PER_INTERACTION;

    utmi += complexity * COEFFICIENTS.COMPLEXITY_FACTOR;
    utmi += quality * COEFFICIENTS.QUALITY_FACTOR;
    utmi += relevance * COEFFICIENTS.RELEVANCE_FACTOR;

    // Appliquer le score d'efficacité du modèle
    const modelEfficiency = COEFFICIENTS.MODEL_EFFICIENCY_SCORE[model] || 1.0;
    utmi *= modelEfficiency;

    // Appliquer une pénalité pour la répétition
    if (isRepeated) {
        utmi *= (1 - COEFFICIENTS.REPETITION_PENALTY);
    }

    logApiCall('UTMi Calculation', 'N/A', 'info', { interactionDetails, calculatedUtmi: utmi.toFixed(4) });
    return parseFloat(utmi.toFixed(4)); // Arrondir pour éviter les nombres flottants très longs
}

/**
 * Calcule la valeur UTMi en EUR.
 * @param {number} utmiAmount - Montant en UTMi.
 * @returns {number} Valeur équivalente en EUR.
 */
function calculateUtmiValueInEUR(utmiAmount) {
    return parseFloat((utmiAmount * COEFFICIENTS.UTMI_EUR_EXCHANGE_RATE).toFixed(4));
}

/**
 * Convertit une valeur en EUR en UTMi.
 * @param {number} eurAmount - Montant en EUR.
 * @returns {number} Valeur équivalente en UTMi.
 */
function convertValueToEUR(utmiAmount) { // Renommée pour clarté
    return parseFloat((utmiAmount * COEFFICIENTS.UTMI_EUR_EXCHANGE_RATE).toFixed(4));
}


/**
 * Détermine le type d'interaction. (Simulé)
 * @param {string} text - Texte de l'interaction.
 * @returns {string} Type d'interaction (e.g., 'code_gen', 'text_gen', 'data_analysis').
 */
function determineInteractionType(text) {
    if (text.includes('code') || text.includes('fonction') || text.includes('script')) return 'code_gen';
    if (text.includes('analyse') || text.includes('données') || text.includes('statistiques')) return 'data_analysis';
    if (text.includes('résumé') || text.includes('rédige') || text.includes('explique')) return 'text_gen';
    return 'general';
}

/**
 * Détecte l'axe cognitif principal de l'interaction. (Simulé)
 * @param {string} text - Texte de l'interaction.
 * @returns {string} Axe cognitif (e.g., 'analyse', 'synthèse', 'créativité').
 */
function detectCognitiveAxis(text) {
    if (text.includes('analyse') || text.includes('détail') || text.includes('décomposer')) return 'analyse';
    if (text.includes('synthèse') || text.includes('résumé') || text.includes('vue d\'ensemble')) return 'synthèse';
    if (text.includes('idée') || text.includes('nouveau') || text.includes('invente')) return 'créativité';
    if (text.includes('problème') || text.includes('solution') || text.includes('résoudre')) return 'résolution de problèmes';
    if (text.includes('communique') || text.includes('présente') || text.includes('explique')) return 'communication';
    return 'général';
}

/**
 * Détermine le focus thématique de l'interaction. (Simulé)
 * @param {string} text - Texte de l'interaction.
 * @returns {string} Focus thématique (e.g., 'marketing', 'affiliation', 'fiscal-economique').
 */
function determineThematicFocus(text) {
    if (text.includes('marketing') || text.includes('publicité') || text.includes('campagne')) return 'marketing';
    if (text.includes('affiliation') || text.includes('partenariat') || text.includes('commission')) return 'affiliation';
    if (text.includes('fiscal') || text.includes('impôt') || text.includes('économie') || text.includes('finance')) return 'fiscal-economique';
    return 'général';
}

/**
 * Analyse le sentiment d'un texte. (Simulé)
 * @param {string} text - Le texte à analyser.
 * @returns {string} Sentiment ('positif', 'neutre', 'négatif').
 */
function analyzeTextForSentiment(text) {
    text = text.toLowerCase();
    if (text.includes('bien') || text.includes('excellent') || text.includes('merci') || text.includes('super')) return 'positif';
    if (text.includes('mauvais') || text.includes('erreur') || text.includes('pas bien') || text.includes('problème')) return 'négatif';
    return 'neutre';
}

/**
 * Analyse le texte pour la valorisation des termes clés. (Simulé)
 * @param {string} text - Le texte à analyser.
 * @returns {number} Un score de valorisation.
 */
function analyzeTextForTermValuation(text) {
    let score = 0;
    const valuableTerms = ['innovation', 'stratégie', 'croissance', 'optimisation', 'solution', 'valeur ajoutée'];
    text = text.toLowerCase();
    valuableTerms.forEach(term => {
        if (text.includes(term)) {
            score += 1;
        }
    });
    return score;
}

/**
 * Calcule la valeur initiale du CV basée sur une structure simplifiée.
 * @param {object} structuredCv - Données structurées du CV.
 * @returns {number} La valeur calculée du CV.
 */
function calculateInitialCvValue(structuredCv) {
    if (!structuredCv) return 0;

    let value = COEFFICIENTS.BASE_CV_VALUE;

    // Expérience
    if (structuredCv.experience && Array.isArray(structuredCv.experience)) {
        let totalYears = 0;
        structuredCv.experience.forEach(exp => {
            if (exp.years) totalYears += exp.years;
        });
        value *= (1 + totalYears * COEFFICIENTS.EXPERIENCE_FACTOR);
    }

    // Éducation (simple: compte les diplômes)
    if (structuredCv.education && Array.isArray(structuredCv.education)) {
        value *= (1 + structuredCv.education.length * COEFFICIENTS.EDUCATION_FACTOR);
    }

    // Compétences
    if (structuredCv.skills && Array.isArray(structuredCv.skills)) {
        value *= (1 + structuredCv.skills.length * COEFFICIENTS.SKILL_FACTOR);
    }

    // Certifications
    if (structuredCv.certifications && Array.isArray(structuredCv.certifications)) {
        value *= (1 + structuredCv.certifications.length * COEFFICIENTS.CERTIFICATION_FACTOR);
    }

    // Réalisations (qualitatif, peut être basé sur le nombre de réalisations mentionnées)
    if (structuredCv.achievements && Array.isArray(structuredCv.achievements)) {
        value *= (1 + structuredCv.achievements.length * COEFFICIENTS.ACHIEVEMENT_FACTOR);
    }

    // Arrondir à 2 décimales pour la valeur CVNU
    return parseFloat(value.toFixed(2));
}

/**
 * Détermine le niveau du CV basé sur sa valeur.
 * @param {number} cvValue - La valeur calculée du CV.
 * @returns {string} Le niveau du CV (e.g., "Débutant", "Confirmé", "Expert").
 */
function getCvLevel(cvValue) {
    if (cvValue >= 50000) return "Grand Maître";
    if (cvValue >= 25000) return "Maître";
    if (cvValue >= 10000) return "Expert";
    if (cvValue >= 5000) return "Confirmé";
    return "Débutant";
}

/**
 * Calcule le Revenu Universel Mensuel (RUM) basé sur la valeur du CVNU.
 * @param {number} cvnuValue - La valeur calculée du CVNU de l'utilisateur.
 * @returns {number} Le montant du RUM en EUR par mois.
 */
function calculateMonthlyUniversalIncome(cvnuValue) {
    if (cvnuValue < 0) cvnuValue = 0; // S'assurer que la valeur est non-négative
    const rum = Math.max(COEFFICIENTS.MIN_RUM_EUR, cvnuValue * COEFFICIENTS.CVNU_RUM_MULTIPLIER);
    return parseFloat(rum.toFixed(4));
}

/**
 * Calcul les insights du tableau de bord. (Simulé)
 * @param {Array<Object>} interactions - Liste des interactions.
 * @returns {Object} Les insights agrégés.
 */
function calculateDashboardInsights(interactions) {
    let totalUtmi = 0;
    let totalInteractionCount = interactions.length;
    let utmiByType = {};
    let utmiByModel = {};
    let utmiPerCostRatioByModel = {}; // À implémenter si un coût est calculé
    let utmiByCognitiveAxis = {};
    let thematicUtmi = {};
    let mostValuableTopics = {}; // Déterminer les thèmes les plus valorisants
    let mostCommonActivities = {}; // Déterminer les activités les plus courantes

    interactions.forEach(interaction => {
        totalUtmi += interaction.utmiEarned || 0;

        // Agrégation par type d'interaction
        const type = interaction.type || 'unknown';
        utmiByType[type] = (utmiByType[type] || 0) + (interaction.utmiEarned || 0);

        // Agrégation par modèle
        const model = interaction.model || 'unknown';
        utmiByModel[model] = (utmiByModel[model] || 0) + (interaction.utmiEarned || 0);

        // Agrégation par axe cognitif
        const axis = interaction.cognitiveAxis || 'unknown';
        utmiByCognitiveAxis[axis] = (utmiByCognitiveAxis[axis] || 0) + (interaction.utmiEarned || 0);

        // Agrégation par thème thématique
        const theme = interaction.thematicFocus || 'unknown';
        thematicUtmi[theme] = (thematicUtmi[theme] || 0) + (interaction.utmiEarned || 0);

        // Compter les activités les plus courantes (simplifié ici à partir du type)
        mostCommonActivities[type] = (mostCommonActivities[type] || 0) + 1;
        // Pour les sujets les plus valorisants, il faudrait analyser le contenu de l'interaction
        // ou des tags associés. Pour l'instant, c'est une agrégation simple.
    });

    const averageUtmiPerInteraction = totalInteractionCount > 0 ? totalUtmi / totalInteractionCount : 0;

    return {
        totalUtmi: parseFloat(totalUtmi.toFixed(4)),
        totalInteractionCount,
        averageUtmiPerInteraction: parseFloat(averageUtmiPerInteraction.toFixed(4)),
        utmiByType,
        utmiByModel,
        utmiPerCostRatioByModel, // Sera vide pour l'instant
        utmiByCognitiveAxis,
        thematicUtmiMarketing: thematicUtmi['marketing'] || 0,
        thematicUtmiAffiliation: thematicUtmi['affiliation'] || 0,
        thematicUtmiFiscalEconomic: thematicUtmi['fiscal-economique'] || 0,
        mostValuableTopics: Object.keys(thematicUtmi).sort((a, b) => thematicUtmi[b] - thematicUtmi[a]).slice(0, 3), // Top 3 des thèmes par UTMi
        mostCommonActivities: Object.keys(mostCommonActivities).sort((a, b) => mostCommonActivities[b] - mostCommonActivities[a]).slice(0, 3), // Top 3 des activités
        exchangeRates: {
            utmiToEur: COEFFICIENTS.UTMI_EUR_EXCHANGE_RATE,
            eurToUtmi: COEFFICIENTS.EUR_UTMI_EXCHANGE_RATE
        }
    };
}


module.exports = {
    calculateUtmi,
    calculateUtmiValueInEUR,
    convertValueToEUR,
    determineInteractionType,
    detectCognitiveAxis,
    determineThematicFocus,
    analyzeTextForSentiment,
    analyzeTextForTermValuation,
    calculateInitialCvValue,
    getCvLevel,
    calculateMonthlyUniversalIncome,
    calculateDashboardInsights,
};