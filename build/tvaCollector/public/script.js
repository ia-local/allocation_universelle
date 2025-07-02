// public/scripts.js

document.addEventListener('DOMContentLoaded', () => {
    console.log("Application client chargée.");

    // --- Fonctions existantes (inchangées) ---
    async function loadTVAData() {
        const tvaDashboard = document.getElementById('tva-dashboard');
        try {
            const response = await fetch('/api/tva-data');
            if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
            const data = await response.json();
            tvaDashboard.innerHTML = `
                <p><strong>Total collecté :</strong> ${data.totalCollected.toLocaleString('fr-FR')} €</p>
                <h3>Fonds alloués :</h3>
                <ul>
                    <li>Formation : ${data.allocatedFunds.training.toLocaleString('fr-FR')} €</li>
                    <li>Emploi : ${data.allocatedFunds.employment.toLocaleString('fr-FR')} €</li>
                    <li>Autres : ${data.allocatedFunds.other.toLocaleString('fr-FR')} €</li>
                </ul>
                <p>Dernière mise à jour : ${new Date(data.lastUpdate).toLocaleString('fr-FR')}</p>
            `;
        } catch (error) {
            console.error("Erreur lors du chargement des données de TVA:", error);
            tvaDashboard.innerHTML = `<p style="color: red;">Impossible de charger les données de TVA. Veuillez réessayer plus tard.</p>`;
        }
    }

    async function loadMissions() {
        const missionContentDiv = document.getElementById('mission-content');
        try {
            const response = await fetch('/api/missions');
            if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
            const missions = await response.json();
            
            let htmlContent = '<h3>Ordres de Mission Détaillés :</h3>';
            missions.forEach(mission => {
                htmlContent += `
                    <div class="mission-card">
                        <h4>${mission.title}</h4>
                        <p><strong>Direction :</strong> ${mission.direction}</p>
                        <p><strong>Service :</strong> ${mission.service}</p>
                        <h5>Objectifs :</h5>
                        <ul>${mission.objectives.map(obj => `<li>${obj}</li>`).join('')}</ul>
                        <h5>Tâches Principales :</h5>
                        <ul>${mission.mainTasks.map(task => `<li>${task}</li>`).join('')}</ul>
                        <h5>Compétences Requises :</h5>
                        <ul>${mission.requiredSkills.map(skill => `<li>${skill}</li>`).join('')}</ul>
                        <p><strong>Lieu :</strong> ${mission.location}</p>
                    </div>
                `;
            });
            missionContentDiv.innerHTML = htmlContent;

        } catch (error) {
            console.error("Erreur lors du chargement des missions:", error);
            missionContentDiv.innerHTML = `<p style="color: red;">Impossible de charger les ordres de mission.</p>`;
        }
    }

    // --- Fonctions pour l'intégration Utilisateur IA / Fonds IA (remplaçant Pi Network) ---
    let currentIaUserId = null; // Remplacé currentPiUserId par currentIaUserId

    async function getIaUserInfo() { // Remplacé getPiUserInfo par getIaUserInfo
        const iaUserIdInput = document.getElementById('iaUserIdInput'); // Remplacé piUserIdInput
        const iaUsernameSpan = document.getElementById('iaUsername'); // Remplacé piUsername
        const iaUserBalanceSpan = document.getElementById('iaUserBalance'); // Remplacé piUserBalance
        const iaUserCVNUScoreSpan = document.getElementById('iaUserCVNUScore'); // Remplacé piUserCVNUScore

        const iaUserId = iaUserIdInput.value.trim(); // Remplacé piUserId
        if (!iaUserId) {
            alert("Veuillez entrer un ID IA simulé.");
            return;
        }

        try {
            const response = await fetch('/api/ia/user-info', { // Remplacé /api/pi/user-info par /api/ia/user-info
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ia_user_id: iaUserId }) // Remplacé pi_user_id par ia_user_id
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Erreur HTTP: ${response.status}`);
            }

            const data = await response.json();
            currentIaUserId = data.iaUserId; // Remplacé currentPiUserId et piUserId
            iaUsernameSpan.textContent = data.username; // Remplacé piUsername
            iaUserBalanceSpan.textContent = `${data.iaFundsBalance} Fonds IA`; // Remplacé piUserBalance et Pi
            iaUserCVNUScoreSpan.textContent = data.cvnuScore; // Remplacé piUserCVNUScore
            // Mettre à jour l'ID IA dans le champ de log UTMi
            document.getElementById('logIaUserId').value = data.iaUserId; // Remplacé logPiUserId et piUserId
            alert(`Connecté comme ${data.username} !`);
        } catch (error) {
            console.error("Erreur lors de la récupération des infos utilisateur IA:", error); // Remplacé Pi par IA
            iaUsernameSpan.textContent = "Erreur"; // Remplacé piUsername
            iaUserBalanceSpan.textContent = "Erreur"; // Remplacé piUserBalance
            iaUserCVNUScoreSpan.textContent = "Erreur"; // Remplacé piUserCVNUScore
            currentIaUserId = null; // Remplacé currentPiUserId
            alert(`Échec de la connexion: ${error.message}`);
        }
    }

    async function startIaTransfer() { // Remplacé startPiPayment par startIaTransfer
        if (!currentIaUserId) { // Remplacé currentPiUserId
            alert("Veuillez d'abord simuler une connexion utilisateur IA."); // Remplacé Pi par IA
            return;
        }

        const recipientInput = document.getElementById('iaTransferRecipient'); // Remplacé piPaymentRecipient
        const amountInput = document.getElementById('iaTransferAmount'); // Remplacé piPaymentAmount
        const statusParagraph = document.getElementById('iaTransferStatus'); // Remplacé piPaymentStatus

        const recipient = recipientInput.value.trim();
        const amount = parseFloat(amountInput.value);

        if (!recipient || isNaN(amount) || amount <= 0) {
            statusParagraph.textContent = "Veuillez remplir le destinataire et un montant valide.";
            statusParagraph.style.color = "red";
            return;
        }

        statusParagraph.textContent = "Initiation du transfert de fonds IA (simulé)..."; // Remplacé paiement Pi par transfert de fonds IA
        statusParagraph.style.color = "orange";

        try {
            const response = await fetch('/api/ia/start-transfer', { // Remplacé /api/pi/start-payment par /api/ia/start-transfer
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sender_ia_id: currentIaUserId, // Remplacé sender_pi_id et currentPiUserId
                    recipient_ia_id: recipient, // Remplacé recipient_pi_id
                    amount: amount
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Erreur HTTP: ${response.status}`);
            }

            const data = await response.json();
            statusParagraph.textContent = `Transfert initié ! ID: ${data.transferId}. Taxe: ${data.taxCollected} Fonds IA. Net: ${data.netAmountSent} Fonds IA.`; // Remplacé Paiement initié, ID, Taxe et Pi
            statusParagraph.style.color = "green";
            
            setTimeout(async () => {
                await fetch('/api/ia/complete-transfer', { // Remplacé /api/pi/complete-payment par /api/ia/complete-transfer
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ transferId: data.transferId }) // Remplacé paymentId par transferId
                });
                console.log(`Transfert ${data.transferId} complété (simulation).`); // Remplacé Paiement et paymentId
                getIaUserInfo(); // Remplacé getPiUserInfo
            }, 1000);

            recipientInput.value = '';
            amountInput.value = '';
        } catch (error) {
            console.error("Erreur lors du transfert de fonds IA:", error); // Remplacé paiement Pi par transfert de fonds IA
            statusParagraph.textContent = `Échec du transfert: ${error.message}`; // Remplacé paiement par transfert
            statusParagraph.style.color = "red";
        }
    }

    async function checkIaUserBalance() { // Remplacé checkPiUserBalance par checkIaUserBalance
        const checkIaBalanceIdInput = document.getElementById('checkIaBalanceId'); // Remplacé checkPiBalanceId
        const checkedIaBalanceSpan = document.getElementById('checkedIaBalance'); // Remplacé checkedPiBalance
        const checkedIaCVNUScoreSpan = document.getElementById('checkedIaCVNUScore'); // Remplacé checkedPiCVNUScore

        const iaUserId = checkIaBalanceIdInput.value.trim(); // Remplacé piUserId
        if (!iaUserId) {
            checkedIaBalanceSpan.textContent = "Veuillez entrer un ID IA."; // Remplacé Pi par IA
            checkedIaCVNUScoreSpan.textContent = "";
            return;
        }

        checkedIaBalanceSpan.textContent = "Vérification...";
        checkedIaCVNUScoreSpan.textContent = "";
        try {
            const response = await fetch(`/api/ia/balance/${iaUserId}`); // Remplacé /api/pi/balance/ par /api/ia/balance/
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Erreur HTTP: ${response.status}`);
            }
            const data = await response.json();
            checkedIaBalanceSpan.textContent = `${data.iaFundsBalance} Fonds IA`; // Remplacé piBalance par iaFundsBalance et Pi par Fonds IA
            checkedIaCVNUScoreSpan.textContent = data.cvnuScore; // Remplacé piCVNUScore par iaCVNUScore
        } catch (error) {
            console.error("Erreur lors de la vérification du solde Fonds IA:", error); // Remplacé solde Pi par solde Fonds IA
            checkedIaBalanceSpan.textContent = `Erreur: ${error.message}`;
            checkedIaCVNUScoreSpan.textContent = "";
        }
    }

    // --- Fonctions pour l'intégration UTMi (inchangées car déjà cohérentes avec "IA") ---

    async function logInteraction() {
        const interactionType = document.getElementById('interactionType').value;
        const interactionText = document.getElementById('interactionText').value;
        const interactionDataRaw = document.getElementById('interactionData').value;
        const logIaUserId = document.getElementById('logIaUserId').value.trim(); // Remplacé logPiUserId
        const statusParagraph = document.getElementById('utmiCalculationStatus');

        if (!logIaUserId) { // Remplacé logPiUserId
            statusParagraph.textContent = "Veuillez spécifier l'ID IA de l'utilisateur pour l'enregistrement du log."; // Remplacé Pi par IA
            statusParagraph.style.color = "red";
            return;
        }

        let interactionData = {};
        try {
            if (interactionDataRaw) {
                interactionData = JSON.parse(interactionDataRaw);
            }
        } catch (e) {
            statusParagraph.textContent = "Erreur: Les données d'interaction (JSON) sont mal formatées.";
            statusParagraph.style.color = "red";
            return;
        }

        interactionData.text = interactionText;

        const logEntry = {
            interaction: {
                type: interactionType,
                data: interactionData
            },
            iaUserId: logIaUserId, // Remplacé piUserId
            economicContext: {
                revenueGeneratedEUR: 0,
                costSavedEUR: 0,
                efficiencyGainPercentage: 0,
                currentBudgetSurplus: 0
            }
        };

        statusParagraph.textContent = "Envoi de l'interaction pour calcul UTMi...";
        statusParagraph.style.color = "orange";

        try {
            const response = await fetch('/api/utmi/log-interaction', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(logEntry)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Erreur HTTP: ${response.status}`);
            }

            const data = await response.json();
            statusParagraph.textContent = `Interaction enregistrée ! UTMi calculé: ${data.utmi.toFixed(2)}. Logs totaux: ${data.logCount}.`;
            statusParagraph.style.color = "green";
            loadUtmiInsights();
        } catch (error) {
            console.error("Erreur lors de l'enregistrement de l'interaction UTMi:", error);
            statusParagraph.textContent = `Échec: ${error.message}`;
            statusParagraph.style.color = "red";
        }
    }

    async function loadUtmiInsights() {
        const utmiDashboardContent = document.getElementById('utmi-dashboard-content');
        utmiDashboardContent.innerHTML = '<p>Chargement des insights...</p>';

        try {
            const response = await fetch('/api/utmi/insights');
            if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
            const insights = await response.json();

            let htmlContent = `
                <p><strong>UTMi Total Généré :</strong> ${insights.totalUtmi.toFixed(2)}</p>
                <p><strong>Nombre total d'interactions :</strong> ${insights.totalInteractionCount}</p>
                <p><strong>Temps de traitement total (simulé) :</strong> ${insights.totalProcessingTime.toFixed(2)} secondes</p>
                <p><strong>Longueur moyenne des conversations :</strong> ${insights.averageConversationLength.toFixed(2)} (tokens/mots)</p>
                
                <h4>Répartition UTMi par Type d'Interaction :</h4>
                <ul>
                    ${insights.utmiByType.map(item => `<li>${item.name.replace(/_/g, ' ')}: ${item.utmi.toFixed(2)} UTMi</li>`).join('')}
                </ul>

                <h4>Répartition UTMi par Axe Cognitif :</h4>
                <ul>
                    ${insights.utmiByCognitiveAxis.map(item => `<li>${item.name}: ${item.utmi.toFixed(2)} UTMi</li>`).join('')}
                </ul>

                <h4>UTMi par Thématique :</h4>
                <ul>
                    <li>Marketing: ${insights.thematicUtmi.marketing.toFixed(2)} UTMi</li>
                    <li>Affiliation: ${insights.thematicUtmi.affiliation.toFixed(2)} UTMi</li>
                    <li>Fiscale/Économique: ${insights.thematicUtmi.fiscalEconomic.toFixed(2)} UTMi</li>
                </ul>

                <h4>Top 5 Activités Courantes :</h4>
                <ul>
                    ${insights.mostCommonActivities.map(item => `<li>${item.name.replace(/_/g, ' ')}: ${item.count} occurrences</li>`).join('')}
                </ul>

                <h4>Top 5 Sujets les Plus Valorisé (par UTMi) :</h4>
                <ul>
                    ${insights.mostValuableTopics.map(item => `<li>${item.name.replace(/_/g, ' ')}: ${item.utmi.toFixed(2)} UTMi</li>`).join('')}
                </ul>

                <h4>Valeur Monétisable Estimée :</h4>
                <ul>
                    <li>(Basé sur USD) : ${insights.estimatedRevenueEUR.fromUSD.toFixed(2)} EUR</li>
                    <li>(Basé sur GBP) : ${insights.estimatedRevenueEUR.fromGBP.toFixed(2)} EUR</li>
                </ul>
                <p class="note">Taux de change actuels (simulés): 1 USD = ${insights.currentExchangeRates.USD} EUR, 1 GBP = ${insights.currentExchangeRates.GBP} EUR</p>
            `;
            utmiDashboardContent.innerHTML = htmlContent;

        } catch (error) {
            console.error("Erreur lors du chargement des insights UTMi:", error);
            utmiDashboardContent.innerHTML = `<p style="color: red;">Impossible de charger les insights UTMi. ${error.message}</p>`;
        }
    }


    // --- Initialisation des événements au chargement de la page ---
    loadTVAData();
    loadUtmiInsights();

    const loadMissionsBtn = document.getElementById('loadMissionsBtn');
    if (loadMissionsBtn) {
        loadMissionsBtn.addEventListener('click', loadMissions);
    }

    const getIaUserInfoBtn = document.getElementById('getIaUserInfoBtn'); // Remplacé getPiUserInfoBtn
    if (getIaUserInfoBtn) {
        getIaUserInfoBtn.addEventListener('click', getIaUserInfo); // Remplacé getPiUserInfo
    }

    const startIaTransferBtn = document.getElementById('startIaTransferBtn'); // Remplacé startPiPaymentBtn
    if (startIaTransferBtn) {
        startIaTransferBtn.addEventListener('click', startIaTransfer); // Remplacé startPiPayment
    }

    const checkIaBalanceBtn = document.getElementById('checkIaBalanceBtn'); // Remplacé checkPiBalanceBtn
    if (checkIaBalanceBtn) {
        checkIaBalanceBtn.addEventListener('click', checkIaUserBalance); // Remplacé checkPiUserBalance
    }

    const logInteractionBtn = document.getElementById('logInteractionBtn');
    if (logInteractionBtn) {
        logInteractionBtn.addEventListener('click', logInteraction);
    }

    const refreshUtmiInsightsBtn = document.getElementById('refreshUtmiInsightsBtn');
    if (refreshUtmiInsightsBtn) {
        refreshUtmiInsightsBtn.addEventListener('click', loadUtmiInsights);
    }
});