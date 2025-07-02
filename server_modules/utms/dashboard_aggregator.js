// server_modules/utms/dashboard_aggregator.js

const { COEFFICIENTS } = require('./constants');
const { determineInteractionType, detectCognitiveAxis, determineThematicFocus } = require('./utmi_calculator'); // Réutilise les fonctions de détection

/**
 * Calcule les insights du tableau de bord à partir d'un ensemble de logs d'interactions.
 * Simule l'agrégation de données pour les besoins du prototype.
 * Dans une application réelle, cela interagirait avec une base de données de logs.
 *
 * @param {Array<object>} interactionLogs - Un tableau d'objets de log d'interactions. Chaque log doit contenir:
 * - utmiEarned: nombre d'UTMi générés par l'interaction.
 * - content: contenu textuel de l'interaction (pour analyse thématique, cognitive, etc.).
 * - modelUsed: nom du modèle d'IA utilisé.
 * - timestamp: horodatage de l'interaction.
 * - [cost]: coût si applicable (non utilisé directement pour UTMi utilisateur mais pour des métriques internes).
 * @returns {object} Un objet contenant diverses métriques agrégées pour le tableau de bord.
 */
function calculateDashboardInsights(interactionLogs = []) {
    let totalUtmi = 0;
    let totalInteractionCount = interactionLogs.length;
    let utmiByType = {}; // Exemple: { 'prompt': 150, 'code': 300 }
    let utmiByModel = {}; // Exemple: { 'groq-llama3-8b': 200, 'groq-llama3-70b': 250 }
    let utmiByCognitiveAxis = {}; // Exemple: { 'analytical': 100, 'creative': 200 }
    let utmiByThematicFocus = {}; // Exemple: { 'marketing': 50, 'fiscal_economic': 300 }
    let topicFrequency = {}; // Fréquence des termes clés (pour 'mostValuableTopics')
    let activityFrequency = {}; // Fréquence des types d'interactions (pour 'mostCommonActivities')
    let totalCostUSD = 0;

    interactionLogs.forEach(log => {
        const utmi = log.utmiEarned || 0; // Utiliser utmiEarned comme dans vos logs
        const content = log.content || '';
        const modelUsed = log.modelUsed || 'default';
        const cost = log.cost || 0; // Si le log contient un coût d'opération

        totalUtmi += utmi;
        totalCostUSD += cost;

        // Agrégation par type d'interaction
        // Note: determineInteractionType ne prend que 'text'. Si log.contentType existe, il faudra l'adapter.
        const type = determineInteractionType(content);
        utmiByType[type] = (utmiByType[type] || 0) + utmi;
        activityFrequency[type] = (activityFrequency[type] || 0) + 1;

        // Agrégation par modèle
        utmiByModel[modelUsed] = (utmiByModel[modelUsed] || 0) + utmi;

        // Agrégation par axe cognitif
        const cognitiveAxis = detectCognitiveAxis(content);
        utmiByCognitiveAxis[cognitiveAxis] = (utmiByCognitiveAxis[cognitiveAxis] || 0) + utmi;

        // Agrégation par focus thématique
        const thematicFocus = determineThematicFocus(content);
        utmiByThematicFocus[thematicFocus] = (utmiByThematicFocus[thematicFocus] || 0) + utmi;

        // Fréquence des termes clés (très simple, peut être amélioré avec NLP)
        content.toLowerCase().split(/\s+/).forEach(word => {
            // Utilise la constante VALUABLE_TERMS du module constants.js
            if (COEFFICIENTS.VALUABLE_TERMS && COEFFICIENTS.VALUABLE_TERMS[word]) {
                topicFrequency[word] = (topicFrequency[word] || 0) + 1;
            }
        });
    });

    const averageUtmiPerInteraction = totalInteractionCount > 0 ? totalUtmi / totalInteractionCount : 0;
    const totalUtmiPerCostRatio = totalCostUSD > 0 ? totalUtmi / totalCostUSD : 0; // Ratio UTMi/coût

    // Convertir les agrégations en tableaux triés pour le rapport
    const getSortedArray = (obj) => Object.entries(obj).sort(([, a], [, b]) => b - a);

    const mostValuableTopics = getSortedArray(topicFrequency).slice(0, 5); // Top 5
    const mostCommonActivities = getSortedArray(activityFrequency).slice(0, 5); // Top 5

    return {
        totalUtmi: parseFloat(totalUtmi.toFixed(4)),
        totalInteractionCount,
        averageUtmiPerInteraction: parseFloat(averageUtmiPerInteraction.toFixed(4)),
        totalUtmiPerCostRatio: parseFloat(totalUtmiPerCostRatio.toFixed(4)),
        utmiByType: utmiByType,
        utmiByModel: utmiByModel,
        utmiByCognitiveAxis: utmiByCognitiveAxis,
        utmiByThematicFocus: utmiByThematicFocus,
        mostValuableTopics: mostValuableTopics.map(([topic, count]) => ({ topic, count })),
        mostCommonActivities: mostCommonActivities.map(([activity, count]) => ({ activity, count })),
        lastUpdateTime: new Date().toISOString(), // Quand les insights ont été calculés
    };
}

module.exports = {
    calculateDashboardInsights
};