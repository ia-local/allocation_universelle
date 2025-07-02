// public/modal.js

const genericAppModal = document.getElementById('genericAppModal');
const genericModalTitle = document.getElementById('genericModalTitle');
const genericModalBody = document.getElementById('genericModalBody');
const genericModalFooter = document.getElementById('genericModalFooter');

let genericCloseModalBtn, genericModalConfirmBtn, genericModalCancelBtn, genericModalOkBtn;

let resolveModalPromise; // Fonction pour résoudre la promesse quand le modal est fermé
let currentModalType; // Pour suivre le type de modal actif pour une résolution correcte à la fermeture

// Gestionnaires d'événements qui seront attachés une seule fois
function handleCloseModalClick() {
    hideModal(currentModalType === 'confirm' ? false : undefined);
}

function handleOkBtnClick() {
    hideModal(undefined);
}

function handleConfirmBtnClick() {
    hideModal(true);
}

function handleCancelBtnClick() {
    hideModal(false);
}

// Initialisation des éléments DOM de la modale et attachement des listeners une seule fois
document.addEventListener('DOMContentLoaded', () => {
    genericCloseModalBtn = document.getElementById('genericCloseModalBtn');
    genericModalConfirmBtn = document.getElementById('genericModalConfirmBtn');
    genericModalCancelBtn = document.getElementById('genericModalCancelBtn');
    genericModalOkBtn = document.getElementById('genericModalOkBtn');

    // Attacher les écouteurs d'événements de manière permanente
    if (genericCloseModalBtn) {
        genericCloseModalBtn.addEventListener('click', handleCloseModalClick);
    }
    if (genericModalOkBtn) {
        genericModalOkBtn.addEventListener('click', handleOkBtnClick);
    }
    if (genericModalConfirmBtn) {
        genericModalConfirmBtn.addEventListener('click', handleConfirmBtnClick);
    }
    if (genericModalCancelBtn) {
        genericModalCancelBtn.addEventListener('click', handleCancelBtnClick);
    }
    // Permettre la fermeture via la touche Échap
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && genericAppModal && genericAppModal.classList.contains('active')) {
            hideModal(currentModalType === 'confirm' ? false : undefined);
        }
    });

    // Fermeture du modal si on clique en dehors
    if (genericAppModal) {
        genericAppModal.addEventListener('click', (event) => {
            if (event.target === genericAppModal) {
                hideModal(currentModalType === 'confirm' ? false : undefined);
            }
        });
    }
});


/**
 * Affiche une modale générique avec titre, corps et boutons configurables.
 * Retourne une promesse qui se résout lorsque le modal est fermé.
 * @param {string} title - Le titre de la modale.
 * @param {string} body - Le contenu HTML ou texte de la modale.
 * @param {'alert'|'confirm'|'info'} [type='alert'] - Le type de modale ('alert', 'confirm', 'info').
 * @param {string} [okBtnText='OK'] - Texte du bouton OK (pour 'alert'/'info').
 * @param {string} [confirmBtnText='Confirmer'] - Texte du bouton Confirmer (pour 'confirm').
 * @param {string} [cancelBtnText='Annuler'] - Texte du bouton Annuler (pour 'confirm').
 * @param {string} [maxWidth='500px'] - Largeur maximale du contenu du modal.
 * @returns {Promise<boolean|undefined>} Résout à `true` pour confirmer, `false` pour annuler (confirm), `undefined` pour OK/info.
 */
function showModal(title, body, type = 'alert', okBtnText = 'OK', confirmBtnText = 'Confirmer', cancelBtnText = 'Annuler', maxWidth = '500px') {
    return new Promise(resolve => {
        if (!genericAppModal) {
            console.error("Modal element 'genericAppModal' not found.");
            resolve(false); // Résoudre immédiatement si le modal n'est pas là
            return;
        }

        resolveModalPromise = resolve;
        currentModalType = type;

        if (genericModalTitle) genericModalTitle.innerHTML = title;
        if (genericModalBody) genericModalBody.innerHTML = body;
        if (genericModalConfirmBtn) genericModalConfirmBtn.textContent = confirmBtnText;
        if (genericModalCancelBtn) genericModalCancelBtn.textContent = cancelBtnText;
        if (genericModalOkBtn) genericModalOkBtn.textContent = okBtnText;

        if (genericAppModal && genericAppModal.querySelector('.modal-content')) {
            genericAppModal.querySelector('.modal-content').style.maxWidth = maxWidth;
        }

        // Réinitialiser la visibilité des boutons
        if (genericModalConfirmBtn) genericModalConfirmBtn.style.display = 'none';
        if (genericModalCancelBtn) genericModalCancelBtn.style.display = 'none';
        if (genericModalOkBtn) genericModalOkBtn.style.display = 'none';

        // Configurer la visibilité des boutons en fonction du type
        if (type === 'confirm') {
            if (genericModalConfirmBtn) genericModalConfirmBtn.style.display = 'inline-block';
            if (genericModalCancelBtn) genericModalCancelBtn.style.display = 'inline-block';
        } else { // 'alert' ou 'info'
            if (genericModalOkBtn) genericModalOkBtn.style.display = 'inline-block';
        }

        // Afficher le modal
        if (genericAppModal) genericAppModal.classList.add('active');
    });
}

/**
 * Cache la modale générique et résout la promesse.
 * @param {boolean|undefined} result - La valeur avec laquelle résoudre la promesse du modal.
 */
function hideModal(result) {
    if (genericAppModal) genericAppModal.classList.remove('active');
    if (resolveModalPromise) {
        resolveModalPromise(result);
        resolveModalPromise = null; // Effacer la fonction resolve stockée
        currentModalType = null; // Effacer le type de modal
    }
}

// Pas besoin d'exporter hideModal car elle est interne