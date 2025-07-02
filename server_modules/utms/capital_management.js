// server_modules/utms/capital_management.js

const { COEFFICIENTS } = require('./constants');
const { calculateUtmi } = require('./utmi_calculator'); // Pour un calcul potentiel d'UTMi pour certaines actions de trésorerie

/**
 * Calcule la valeur initiale du CV basée sur le contenu structuré.
 * @param {object} cvStructuredData - Les données structurées du CV (JSON).
 * @returns {number} La valeur initiale du CVNU en points.
 */
function calculateInitialCvValue(cvStructuredData) {
    let cvValue = 0;
    const coeff = COEFFICIENTS.CV_VALUE_COEFF;

    if (!cvStructuredData) return 0;

    // Calcul basé sur les mots du résumé/profil
    if (cvStructuredData.profile && cvStructuredData.profile.summary) {
        const wordCount = cvStructuredData.profile.summary.split(/\s+/).filter(w => w.length > 0).length;
        cvValue += wordCount * coeff.BASE_VALUE_PER_WORD;
    }

    // Ajout de valeur par années d'expérience
    if (cvStructuredData.experiences && Array.isArray(cvStructuredData.experiences)) {
        let totalYearsOfExperience = 0;
        cvStructuredData.experiences.forEach(exp => {
            if (exp.startDate && exp.endDate) {
                const start = new Date(exp.startDate);
                const end = new Date(exp.endDate);
                totalYearsOfExperience += (end.getFullYear() - start.getFullYear());
            }
        });
        cvValue += totalYearsOfExperience * coeff.EXPERIENCE_YEAR_MULTIPLIER;
    }

    // Ajout de valeur par compétences (simplifié, pourrait être plus détaillé avec des niveaux)
    if (cvStructuredData.skills && Array.isArray(cvStructuredData.skills)) {
        cvValue += cvStructuredData.skills.length * coeff.SKILL_POINT_MULTIPLIER; // Chaque compétence = X points
    }

    // Ajout de valeur par projets
    if (cvStructuredData.projects && Array.isArray(cvStructuredData.projects)) {
        cvValue += cvStructuredData.projects.length * coeff.PROJECT_BONUS;
    }

    // Ajout de valeur par certifications
    if (cvStructuredData.certifications && Array.isArray(cvStructuredData.certifications)) {
        cvValue += cvStructuredData.certifications.length * coeff.CERTIFICATION_BONUS;
    }

    return parseFloat(cvValue.toFixed(2));
}

/**
 * Détermine le niveau du CV (Junior, Middle, Senior) basé sur la valeur du CV et l'expérience.
 * @param {number} cvValueScore - Le score de valeur calculé du CV.
 * @param {number} totalYearsOfExperience - Le nombre total d'années d'expérience.
 * @returns {object} Un objet indiquant le niveau du CV.
 */
function getCvLevel(cvValueScore, totalYearsOfExperience) {
    let level = { junior: false, middle: false, senior: false };

    if (totalYearsOfExperience >= 7 || cvValueScore >= 3000) { // Exemple de seuils
        level.senior = true;
    } else if (totalYearsOfExperience >= 3 || cvValueScore >= 1000) {
        level.middle = true;
    } else {
        level.junior = true;
    }
    return level;
}

/**
 * Calcule le Revenu Universel Mensuel (RUM) basé sur la valeur du CV et les UTMi cumulés.
 * @param {number} cvValueScore - La valeur calculée du CV.
 * @param {number} totalUtmi - Le total des UTMi cumulés par l'utilisateur.
 * @param {object} cvLevelData - L'objet du niveau du CV (retourné par getCvLevel).
 * @returns {number} Le RUM calculé en EUR.
 */
function calculateMonthlyUniversalIncome(cvValueScore, totalUtmi, cvLevelData) {
    let income = 0;
    const incomeCoeff = COEFFICIENTS.RUM_COEFF;

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
 * Calcule la récompense citoyenne / contribution à la trésorerie.
 * @param {object} interactionData - Données de l'interaction qui génère la récompense.
 * @param {number} generatedUtmi - Les UTMi générés par cette interaction.
 * @returns {number} La quantité d'UTMi allouée à la trésorerie/récompense citoyenne.
 */
function calculateCityzenReward(interactionData, generatedUtmi) {
    // Exemple simple: une petite partie des UTMi générés ou un montant fixe par interaction
    return generatedUtmi * COEFFICIENTS.TAX_IA_PERCENTAGE + COEFFICIENTS.CITIZEN_REWARD_UTMI_PER_INTERACTION;
}


module.exports = {
    calculateInitialCvValue,
    getCvLevel,
    calculateMonthlyUniversalIncome,
    calculateCityzenReward
};