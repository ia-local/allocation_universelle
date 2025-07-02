document.addEventListener('DOMContentLoaded', () => {
    console.log("Application client chargée.");

    // Fonction pour charger et afficher les données de TVA
    async function loadTVAData() {
        const tvaDashboard = document.getElementById('tva-dashboard');
        try {
            const response = await fetch('/api/tva-data');
            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }
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

    // Fonction pour charger et afficher les ordres de mission (depuis mission.json)
    async function loadMissions() {
        const missionContentDiv = document.getElementById('mission-content');
        try {
            const response = await fetch('/api/missions'); // Utilisez la route API du serveur
            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }
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

    // Appels des fonctions au chargement initial
    loadTVAData();

    // Gestionnaire d'événement pour le bouton de chargement des missions
    const loadMissionsBtn = document.getElementById('loadMissionsBtn');
    if (loadMissionsBtn) {
        loadMissionsBtn.addEventListener('click', loadMissions);
    }


    // --- Fonctions à ajouter pour une optimisation liée aux ordres de mission ---

    // Exemple : Fonction pour soumettre un formulaire de déclaration de TVA
    // (si vous ajoutez un formulaire dans index.html)
    // async function submitTVADeclaration(declarationData) {
    //     try {
    //         const response = await fetch('/api/declare-tva', {
    //             method: 'POST',
    //             headers: {
    //                 'Content-Type': 'application/json'
    //             },
    //             body: JSON.stringify(declarationData)
    //         });
    //         if (!response.ok) {
    //             throw new Error(`Erreur HTTP: ${response.status}`);
    //         }
    //         const result = await response.json();
    //         console.log('Déclaration soumise avec succès:', result.message);
    //         // Afficher un message de succès à l'utilisateur
    //     } catch (error) {
    //         console.error("Erreur lors de la soumission de la déclaration:", error);
    //         // Afficher un message d'erreur
    //     }
    // }

    // Exemple : Fonction pour interagir avec un smart contract via une API serveur
    // (si le smart contract est géré par le backend ou directement par un wallet frontend comme MetaMask)
    // async function interactWithSmartContract(contractMethod, args) {
    //     // Si via le backend:
    //     // const response = await fetch('/api/smart-contract-action', { /* ... */ });
    //     // Si via MetaMask/Web3:
    //     // const accounts = await web3.eth.getAccounts();
    //     // const contract = new web3.eth.Contract(abi_smartContract_cvnu.json, contractAddress);
    //     // await contract.methods[contractMethod](...args).send({ from: accounts[0] });
    // }

    // Pour optimiser:
    // - Utilisation d'un framework frontend (React, Vue, Angular) pour des applications plus complexes.
    // - Routage côté client pour une expérience utilisateur fluide (SPA).
    // - Gestion d'état centralisée (Redux, Vuex) si l'application devient grande.
    // - Tests unitaires et d'intégration.
});