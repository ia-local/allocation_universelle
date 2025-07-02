// server_modules/utms/constants.js
const COEFFICIENTS = {
    // Taux de conversion
    UTMI_EUR_EXCHANGE_RATE: 0.005, // 1 UTMi = 0.005 EUR (exemple)
    EUR_UTMI_EXCHANGE_RATE: 1 / 0.005, // 1 EUR = 200 UTMi

    // Coeffs pour calcul UTMi par interaction
    BASE_UTMI_PER_INTERACTION: 0.1,
    COMPLEXITY_FACTOR: 0.05, // Chaque point de complexité ajoute 5% de UTMi
    QUALITY_FACTOR: 0.08,    // Chaque point de qualité ajoute 8% de UTMi
    RELEVANCE_FACTOR: 0.03,  // Chaque point de pertinence ajoute 3% de UTMi
    REPETITION_PENALTY: 0.5, // Réduction de 50% pour les interactions répétées (ou par seuil)
    MODEL_EFFICIENCY_SCORE: {
        'mixtral-8x7b-32768': 1.0,
        'llama2-70b': 0.9,
        'gemma-7b': 0.8,
        // Ajoutez d'autres modèles ici
    },

    // Coeffs pour le Revenu Universel Mensuel (RUM) basé sur le CVNU
    CVNU_RUM_MULTIPLIER: 0.000005, // Ex: 10,000 CVNU -> 10,000 * 0.000005 = 0.05 EUR/mois
    MIN_RUM_EUR: 0.01, // RUM minimum par mois (pour éviter 0)

    // Coeffs pour la trésorerie commune
    TREASURY_CONTRIBUTION_RATE: 0.01, // 1% des RUM ou UTMi générés vont à la trésorerie

    // Coeffs pour le calcul de la valeur du CVNU
    BASE_CV_VALUE: 1000, // Valeur de base pour un CV standard
    EXPERIENCE_FACTOR: 1.15, // Chaque année d'expérience
    EDUCATION_FACTOR: 1.20, // Chaque niveau d'éducation (diplôme supérieur)
    SKILL_FACTOR: 1.10, // Chaque compétence clé
    CERTIFICATION_FACTOR: 1.08, // Chaque certification
    ACHIEVEMENT_FACTOR: 1.30, // Chaque réalisation significative

    // Coefficients pour l'analyse des axes cognitifs
    AXIS_COEFFICIENTS: {
        'analyse': 1.2,
        'synthèse': 1.3,
        'créativité': 1.5,
        'résolution de problèmes': 1.4,
        'communication': 1.1,
    },

    // Coefficients pour l'analyse des thèmes thématiques
    THEMATIC_COEFFICIENTS: {
        'marketing': 1.05,
        'affiliation': 1.10,
        'fiscal-economique': 1.15,
        // ... autres thèmes
    },

    // Limites et seuils
    MAX_DAILY_UTMI_CLAIM: 10, // Limite journalière de UTMi "gratuits" (si applicable)

    // Termes clés pour la valorisation (utilisés par dashboard_aggregator)
    VALUABLE_TERMS: {
        'innovation': 1, 'stratégie': 1, 'croissance': 1, 'optimisation': 1,
        'solution': 1, 'valeur ajoutée': 1, 'développement': 1, 'performance': 1,
        'scalabilité': 1, 'efficacité': 1, 'automatisation': 1, 'analyse': 1,
        'design': 1, 'intégration': 1, 'sécurité': 1, 'qualité': 1,
        'leadership': 1, 'gestion': 1, 'communication': 1, 'projet': 1
    },
};

module.exports = {
    COEFFICIENTS,
};