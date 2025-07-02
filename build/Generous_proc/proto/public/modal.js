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

    // Gestion de la fermeture par échap
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && genericAppModal && genericAppModal.classList.contains('active')) {
            handleCloseModalClick();
        }
    });
});

/**
 * Affiche la modale générique.
 * @param {string} title - Le titre du modal.
 * @param {string} bodyHtml - Le contenu HTML du corps du modal.
 * @param {'alert'|'confirm'|'info'} type - Le type de modal (détermine les boutons affichés).
 * @param {string} [maxWidth='500px'] - La largeur maximale du modal.
 * @returns {Promise<boolean|undefined>} Une promesse qui se résout au résultat de l'interaction de l'utilisateur.
 */
export function showModal(title, bodyHtml, type = 'alert', maxWidth = '500px') {
    return new Promise((resolve) => {
        resolveModalPromise = resolve; // Stocke la fonction resolve pour la fermeture

        if (genericModalTitle) genericModalTitle.textContent = title;
        if (genericModalBody) genericModalBody.innerHTML = bodyHtml;
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