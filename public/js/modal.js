// public/js/modal.js
// Ce module gère l'affichage et la fermeture des modales.

let currentModalElement = null;

/**
 * @function showModal
 * @description Affiche une modale spécifique.
 * @param {string} modalId - L'ID de la modale à afficher (par exemple, 'my-modal').
 */
export function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        currentModalElement = modal;
        modal.classList.add('active');
        document.body.classList.add('modal-open'); // Pour empêcher le défilement du corps
        console.log(`[modal] Modale '${modalId}' affichée.`);
        attachModalCloseListeners(modal);
    } else {
        console.error(`[modal] Modale avec l'ID '${modalId}' non trouvée.`);
    }
}

/**
 * @function hideModal
 * @description Cache la modale actuellement affichée.
 */
export function hideModal() {
    if (currentModalElement) {
        currentModalElement.classList.remove('active');
        document.body.classList.remove('modal-open');
        console.log(`[modal] Modale '${currentModalElement.id}' cachée.`);
        detachModalCloseListeners(currentModalElement);
        currentModalElement = null;
    }
}

/**
 * @function attachModalCloseListeners
 * @description Attache les écouteurs d'événements pour fermer la modale.
 * @param {HTMLElement} modal - L'élément de la modale.
 */
function attachModalCloseListeners(modal) {
    // Fermer avec le bouton de fermeture (classe .close-btn)
    const closeButton = modal.querySelector('.close-btn');
    if (closeButton) {
        closeButton.addEventListener('click', hideModal);
    }

    // Fermer en cliquant en dehors de la modale (sur l'overlay)
    modal.addEventListener('click', (event) => {
        if (event.target === modal) {
            hideModal();
        }
    });

    // Fermer avec la touche Échap
    document.addEventListener('keydown', handleEscapeKey);
    console.log('[modal] Écouteurs pour les boutons de fermeture de modale attachés.');
}

/**
 * @function detachModalCloseListeners
 * @description Détache les écouteurs d'événements pour fermer la modale.
 * @param {HTMLElement} modal - L'élément de la modale.
 */
function detachModalCloseListeners(modal) {
    const closeButton = modal.querySelector('.close-btn');
    if (closeButton) {
        closeButton.removeEventListener('click', hideModal);
    }
    modal.removeEventListener('click', (event) => {
        if (event.target === modal) {
            hideModal();
        }
    });
    document.removeEventListener('keydown', handleEscapeKey);
    console.log('[modal] Écouteurs pour les boutons de fermeture de modale détachés.');
}

/**
 * @function handleEscapeKey
 * @description Gère la fermeture de la modale si la touche Échap est pressée.
 * @param {KeyboardEvent} event - L'événement clavier.
 */
function handleEscapeKey(event) {
    if (event.key === 'Escape') {
        hideModal();
    }
}