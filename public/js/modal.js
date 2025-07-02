// public/js/modal.js

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
    if (genericModalConfirmBtn) {
        genericModalConfirmBtn.addEventListener('click', handleConfirmBtnClick);
    }
    if (genericModalCancelBtn) {
        genericModalCancelBtn.addEventListener('click', handleCancelBtnClick);
    }
    if (genericModalOkBtn) {
        genericModalOkBtn.addEventListener('click', handleOkBtnClick);
    }
});

/**
 * Affiche une modale générique avec un contenu et un type spécifiques.
 * @param {string} type - Le type de modale ('alert', 'confirm', 'prompt').
 * @param {string} title - Le titre de la modale.
 * @param {string} message - Le message principal de la modale.
 * @param {string} [inputType='text'] - Pour les modales 'prompt', type d'input ('text', 'number', 'password').
 * @param {string} [maxWidth='500px'] - Largeur maximale optionnelle pour le contenu du modal.
 * @returns {Promise<boolean|string|undefined>} Résout avec true/false pour 'confirm', la valeur pour 'prompt', undefined pour 'alert'.
 */
export function showModal(type, title, message, inputType = 'text', maxWidth = '500px') {
    return new Promise(resolve => {
        resolveModalPromise = resolve;
        currentModalType = type;

        if (genericModalTitle) genericModalTitle.textContent = title;
        if (genericModalBody) genericModalBody.innerHTML = ''; // Nettoyer le corps

        if (type === 'prompt') {
            const input = document.createElement('input');
            input.type = inputType;
            input.className = 'modal-input';
            input.placeholder = message; // Utiliser le message comme placeholder pour le prompt
            genericModalBody.appendChild(input);
            input.focus();

            // Ajouter un événement "Enter" pour valider le prompt
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault(); // Empêche le comportement par défaut d'Enter
                    hideModal(input.value);
                }
            });

            // Bouton OK pour le prompt
            if (genericModalOkBtn) {
                genericModalOkBtn.style.display = 'inline-block';
                genericModalOkBtn.onclick = () => hideModal(input.value); // Résoudre avec la valeur de l'input
            }

        } else {
            const p = document.createElement('p');
            p.textContent = message;
            genericModalBody.appendChild(p);
            // Si c'est un alert/confirm et qu'il n'y a pas d'input, on peut attacher le enter sur le document
            // pour fermer la modale, mais soyez prudent pour ne pas interférer avec d'autres inputs.
            // Pour ce cas simple, on se base sur les clics de bouton.
        }


        if (genericAppModal && genericAppModal.querySelector('.modal-content')) {
            genericAppModal.querySelector('.modal-content').style.maxWidth = maxWidth;
        }

        // Réinitialiser la visibilité des boutons
        if (genericModalConfirmBtn) genericModalConfirmBtn.style.display = 'none';
        if (genericModalCancelBtn) genericModalCancelBtn.style.display = 'none';
        // if (genericModalOkBtn) genericModalOkBtn.style.display = 'none'; // Garder pour prompt

        // Configurer la visibilité des boutons en fonction du type
        if (type === 'confirm') {
            if (genericModalConfirmBtn) genericModalConfirmBtn.style.display = 'inline-block';
            if (genericModalCancelBtn) genericModalCancelBtn.style.display = 'inline-block';
            if (genericModalOkBtn) genericModalOkBtn.style.display = 'none'; // S'assurer qu'il est caché pour confirm
        } else if (type === 'alert') { // 'alert' ou 'info'
            if (genericModalOkBtn) genericModalOkBtn.style.display = 'inline-block';
            if (genericModalConfirmBtn) genericModalConfirmBtn.style.display = 'none';
            if (genericModalCancelBtn) genericModalCancelBtn.style.display = 'none';
        } else if (type === 'prompt') {
            // Already handled above to show genericModalOkBtn
            if (genericModalConfirmBtn) genericModalConfirmBtn.style.display = 'none';
            if (genericModalCancelBtn) genericModalCancelBtn.style.display = 'none';
        }


        // Afficher le modal
        if (genericAppModal) genericAppModal.classList.add('active');
    });
}

/**
 * Cache la modale générique et résout la promesse.
 * @param {boolean|string|undefined} result - La valeur avec laquelle résoudre la promesse du modal.
 */
export function hideModal(result) {
    if (genericAppModal) genericAppModal.classList.remove('active');
    if (resolveModalPromise) {
        resolveModalPromise(result);
        resolveModalPromise = null; // Effacer la fonction resolve stockée
        currentModalType = null; // Effacer le type de modal
    }
    // Réinitialiser les handlers temporaires si vous en avez
    if (genericModalOkBtn) genericModalOkBtn.onclick = handleOkBtnClick; // Réaffecter le handler par défaut
}