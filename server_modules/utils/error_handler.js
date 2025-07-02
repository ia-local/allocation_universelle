// server_modules/utils/error_handler.js
const { logApiCall } = require('./api_logger'); // Assurez-vous du chemin correct

/**
 * Middleware de gestion d'erreurs centralisé pour Express.
 * Capture les erreurs passées avec next(error) et renvoie une réponse standardisée.
 * @param {Error} err - L'objet erreur.
 * @param {Object} req - L'objet requête Express.
 * @param {Object} res - L'objet réponse Express.
 * @param {function} next - La fonction next pour passer au middleware suivant (non utilisée ici car c'est le gestionnaire final).
 */
function errorHandler(err, req, res, next) {
    console.error(`[Global Error Handler] Une erreur s'est produite: ${err.message}`);
    // console.error(err.stack); // Décommenter pour voir la stack trace complète en dev

    // Log l'erreur API
    logApiCall(req.path, req.method, 'error_handled', {
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? 'Production Stack Trace Hidden' : err.stack,
        statusCode: err.statusCode || 500
    });

    // Déterminer le statut HTTP de la réponse
    const statusCode = err.statusCode || 500; // Utilise le statut défini par l'erreur ou 500 par défaut
    const message = err.message || 'Une erreur inattendue est survenue.';

    res.status(statusCode).json({
        status: 'error',
        message: message,
        // En mode développement, vous pourriez inclure plus de détails sur l'erreur
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    });
}

module.exports = errorHandler;