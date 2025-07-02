// server_modules/services/cv_service.js

const fs = require('fs').promises;
const path = require('path');
const groqService = require('./groq_service'); // Pour l'intégration IA
const dbService = require('./db_service'); // Pour sauvegarder/lire les données structurées du CV
const { logApiCall } = require('../utils/api_logger');

const LAST_CV_DATA_FILE = path.join(__dirname, '../../data/last_cv_data.json');
const CONVERSATIONS_FILE = path.join(__dirname, '../../data/conversations.json');

/**
 * Simule le parsing et la structuration d'un fichier de CV.
 * Dans un vrai cas, cela impliquerait de la logique OCR, NLP avancée, etc.
 * Pour ce prototype, cela peut simplement retourner des données mockées ou utiliser l'IA pour extraire.
 * @param {string} fileName - Le nom du fichier CV.
 * @param {Buffer} fileBuffer - Le buffer du fichier CV.
 * @returns {Promise<object>} Les données structurées du CV.
 */
async function parseAndStructureCv(fileName, fileBuffer) {
    logApiCall('cv_service.js', 'parseAndStructureCv', 'info', `Processing CV file: ${fileName}`);

    let extractedText = fileBuffer.toString('utf8'); // Simple conversion pour l'exemple

    // Simuler l'extraction de données clés ou utiliser l'IA
    let structuredData = {
        name: "John Doe",
        email: "john.doe@example.com",
        phone: "0612345678",
        summary: "Développeur passionné avec 5 ans d'expérience.",
        experience: [
            { title: "Développeur Senior", company: "Tech Solutions", years: "2020-Présent" }
        ],
        education: [
            { degree: "Master en Informatique", institution: "Université de Paris", years: "2015-2020" }
        ],
        skills: ["JavaScript", "Node.js", "React", "Docker", "IA"],
        // Pour une approche plus avancée, on pourrait appeler Groq ici
        // const prompt = `Extrait et structure les informations clés de ce CV en JSON: ${extractedText}`;
        // const iaResponse = await groqService.getGroqChatCompletion(prompt);
        // structuredData = JSON.parse(iaResponse.response); // Assurez-vous que l'IA retourne du JSON valide
    };

    // Sauvegarder les dernières données structurées du CV
    await dbService.writeJsonToFile(LAST_CV_DATA_FILE, structuredData);
    logApiCall('cv_service.js', 'parseAndStructureCv', 'success', 'CV data structured and saved.');
    return structuredData;
}

/**
 * Rend les données structurées d'un CV en HTML.
 * @param {object} structuredData - Les données structurées du CV.
 * @returns {Promise<string>} Le contenu HTML du CV.
 */
async function renderCvToHtml(structuredData) {
    logApiCall('cv_service.js', 'renderCvToHtml', 'info', 'Rendering CV to HTML...');
    // Ceci est une version très simplifiée. Un système réel utiliserait des templates (Handlebars, Pug, EJS, etc.)
    // ou un framework frontend pour un rendu dynamique.
    const html = `
        <div class="cv-render-container">
            <h2>${structuredData.name || 'Nom Inconnu'}</h2>
            <p><strong>Email:</strong> ${structuredData.email || 'N/A'}</p>
            <p><strong>Téléphone:</strong> ${structuredData.phone || 'N/A'}</p>
            <h3>Résumé Professionnel</h3>
            <p>${structuredData.summary || 'Aucun résumé fourni.'}</p>
            <h3>Expérience</h3>
            <ul>
                ${(structuredData.experience || []).map(exp => `
                    <li><strong>${exp.title}</strong> chez ${exp.company} (${exp.years})</li>
                `).join('')}
            </ul>
            <h3>Éducation</h3>
            <ul>
                ${(structuredData.education || []).map(edu => `
                    <li><strong>${edu.degree}</strong> de ${edu.institution} (${edu.years})</li>
                `).join('')}
            </ul>
            <h3>Compétences</h3>
            <p>${(structuredData.skills || []).join(', ')}</p>
        </div>
    `;
    logApiCall('cv_service.js', 'renderCvToHtml', 'success', 'CV HTML rendered.');
    return html;
}

/**
 * Récupère les dernières données structurées du CV sauvegardées.
 * @returns {Promise<object|null>} Les dernières données structurées ou null si non trouvées.
 */
async function getLastStructuredCvData() {
    logApiCall('cv_service.js', 'getLastStructuredCvData', 'info', 'Fetching last structured CV data...');
    try {
        const data = await dbService.readJsonFromFile(LAST_CV_DATA_FILE);
        logApiCall('cv_service.js', 'getLastStructuredCvData', 'success', 'Last structured CV data fetched.');
        return data;
    } catch (error) {
        if (error.code === 'ENOENT') {
            logApiCall('cv_service.js', 'getLastStructuredCvData', 'info', 'No last structured CV data file found.');
            return null; // Fichier non trouvé
        }
        logApiCall('cv_service.js', 'getLastStructuredCvData', 'error', { message: error.message, stack: error.stack });
        throw error;
    }
}

/**
 * Calcule la valeur et la monétisation potentielle d'un CV.
 * Utilise l'IA pour évaluer et fournir des insights.
 * @param {object} structuredData - Les données structurées du CV.
 * @returns {Promise<object>} Une estimation de valeur et des insights.
 */
async function calculateCvValue(structuredData) {
    logApiCall('cv_service.js', 'calculateCvValue', 'info', 'Calculating CV value...');
    const prompt = `Évalue la valeur monétaire potentielle et les opportunités de monétisation pour un profil avec les compétences et l'expérience suivantes (réponse en JSON): ${JSON.stringify(structuredData)}. Inclure une estimation de 'valueEstimate' (nombre) et des 'insights' (texte).`;

    const iaResponse = await groqService.getGroqChatCompletion(prompt, "llama3-8b-8192");
    let result;
    try {
        // Tente de parser la réponse JSON de l'IA
        result = JSON.parse(iaResponse.response);
        // Assurez-vous que les champs attendus existent
        if (typeof result.valueEstimate !== 'number' || typeof result.insights !== 'string') {
            throw new Error('IA response did not contain expected fields (valueEstimate, insights)');
        }
    } catch (parseError) {
        logApiCall('cv_service.js', 'calculateCvValue', 'error', `Failed to parse AI response: ${iaResponse.response}. Error: ${parseError.message}`);
        // Fallback si la réponse IA n'est pas un JSON valide ou ne contient pas les champs attendus
        result = {
            valueEstimate: 0,
            insights: "Impossible d'obtenir une estimation précise de l'IA pour le moment. Veuillez réessayer."
        };
    }

    logApiCall('cv_service.js', 'calculateCvValue', 'success', 'CV value calculated.');
    return result;
}

/**
 * Génère un résumé professionnel pour un CV à partir du contexte d'une conversation.
 * @param {string} conversationId - L'ID de la conversation.
 * @returns {Promise<string>} Le résumé professionnel généré.
 */
async function generateProfessionalSummaryFromConversation(conversationId) {
    logApiCall('cv_service.js', 'generateProfessionalSummaryFromConversation', 'info', `Generating professional summary for conversation ID: ${conversationId}`);

    const conversations = await dbService.readJsonFromFile(CONVERSATIONS_FILE);
    const conversation = conversations.find(c => c.id === conversationId);

    if (!conversation) {
        logApiCall('cv_service.js', 'generateProfessionalSummaryFromConversation', 'error', `Conversation ${conversationId} not found.`);
        throw new Error(`Conversation avec l'ID ${conversationId} non trouvée.`);
    }

    const chatHistory = conversation.messages.map(msg => `${msg.sender}: ${msg.text}`).join('\n');
    const prompt = `À partir de l'historique de chat suivant, génère un résumé professionnel concis et percutant pour un CV. Le résumé doit être au maximum de 100 mots et mettre en avant les compétences et expériences pertinentes: \n\n${chatHistory}\n\nRésumé professionnel:`;

    const iaResponse = await groqService.getGroqChatCompletion(prompt, "llama3-8b-8192");
    const summary = iaResponse.response.trim();

    logApiCall('cv_service.js', 'generateProfessionalSummaryFromConversation', 'success', 'Professional summary generated.');
    return summary;
}

module.exports = {
    parseAndStructureCv,
    renderCvToHtml,
    getLastStructuredCvData,
    calculateCvValue,
    generateProfessionalSummaryFromConversation
};