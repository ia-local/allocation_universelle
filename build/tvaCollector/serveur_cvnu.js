// serveur.js

// Import des modules nécessaires
const express = require('express');
const path = require('path');
const { ethers } = require('ethers'); // Import d'ethers
require('dotenv').config(); // Pour charger les variables d'environnement depuis un fichier .env

const app = express();
const port = process.env.PORT || 3000;

// --- Configuration et Initialisation Ethers.js pour le Smart Contract ---
const CVNU_CONTRACT_ADDRESS = process.env.CVNU_CONTRACT_ADDRESS;
const INFURA_API_KEY = process.env.INFURA_API_KEY; // Ou votre clé Alchemy, etc.
const WALLET_PRIVATE_KEY = process.env.WALLET_PRIVATE_KEY; // Clé privée du wallet OWNER

// ABI du contrat CVNU
const CVNU_ABI = [
  {
    "inputs": [
      { "internalType": "uint256", "name": "initialSupply", "type": "uint256" },
      { "internalType": "address", "name": "initialTaxCollector", "type": "address" },
      { "internalType": "uint256", "name": "initialTaxRate", "type": "uint256" }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "from", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }
    ],
    "name": "TaxCollected",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "taxCollector",
    "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "taxRate",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "recipient", "type": "address" },
      { "internalType": "uint256", "name": "amount", "type": "uint256" }
    ],
    "name": "transfer",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "newRate", "type": "uint256" }
    ],
    "name": "setTaxRate",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "newCollector", "type": "address" }
    ],
    "name": "setTaxCollector",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
]; // Collez l'ABI ici ou importez-le si vous le gardez dans un fichier séparé

let provider, wallet, cvnuContract;

// Vérifier que les variables d'environnement sont définies
if (!CVNU_CONTRACT_ADDRESS || !INFURA_API_KEY || !WALLET_PRIVATE_KEY) {
    console.error("ERREUR: Les variables d'environnement CVNU_CONTRACT_ADDRESS, INFURA_API_KEY et WALLET_PRIVATE_KEY doivent être définies.");
    process.exit(1);
} else {
    try {
        provider = new ethers.JsonRpcProvider(`https://mainnet.infura.io/v3/${INFURA_API_KEY}`);
        wallet = new ethers.Wallet(WALLET_PRIVATE_KEY, provider);
        cvnuContract = new ethers.Contract(CVNU_CONTRACT_ADDRESS, CVNU_ABI, wallet);
        console.log("Connecté au contrat CVNU sur l'adresse:", CVNU_CONTRACT_ADDRESS);
    } catch (err) {
        console.error("Erreur lors de l'initialisation d'Ethers.js:", err);
        process.exit(1);
    }
}


// Middleware pour servir les fichiers statiques du dossier 'public'
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json()); // Pour parser le JSON dans les requêtes

// --- Routes API existantes (inchangées) ---

app.get('/api/missions', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'mission.json'));
});

app.get('/api/tva-data', (req, res) => {
    const tvaData = {
        totalCollected: 123456789,
        allocatedFunds: {
            training: 5000000,
            employment: 7000000,
            other: 10000000
        },
        lastUpdate: new Date().toISOString()
    };
    res.json(tvaData);
});

app.post('/api/declare-tva', (req, res) => {
    const declaration = req.body;
    console.log('Déclaration TVA reçue:', declaration);
    res.status(200).json({ message: 'Déclaration reçue avec succès', data: declaration });
});

// --- NOUVELLES ROUTES API pour le Smart Contract CVNU ---

/**
 * @route GET /api/cvnu/info
 * @desc Récupère l'adresse du collecteur de taxe et le taux de taxe du contrat CVNU.
 */
app.get('/api/cvnu/info', async (req, res) => {
    try {
        const taxAddress = await cvnuContract.taxCollector();
        const rate = await cvnuContract.taxRate();
        res.json({ taxCollector: taxAddress, taxRate: rate.toString() });
    } catch (error) {
        console.error("Erreur lors de la récupération des infos CVNU:", error);
        res.status(500).json({ error: "Impossible de récupérer les informations du contrat CVNU." });
    }
});

/**
 * @route GET /api/cvnu/balance/:address
 * @desc Récupère le solde CVNU d'une adresse donnée.
 */
app.get('/api/cvnu/balance/:address', async (req, res) => {
    const { address } = req.params;
    if (!ethers.isAddress(address)) {
        return res.status(400).json({ error: "Adresse Ethereum invalide." });
    }
    try {
        const balance = await cvnuContract.balanceOf(address);
        const decimals = await cvnuContract.decimals();
        res.json({ address: address, balance: ethers.formatUnits(balance, decimals) });
    } catch (error) {
        console.error(`Erreur lors de la récupération du solde CVNU pour ${address}:`, error);
        res.status(500).json({ error: `Impossible de récupérer le solde CVNU pour ${address}.` });
    }
});

/**
 * @route POST /api/cvnu/transfer
 * @desc Déclenche un transfert de tokens CVNU (avec taxe) depuis le wallet du propriétaire du contrat.
 * @body {string} recipient - L'adresse du destinataire.
 * @body {string} amount - Le montant à transférer (en unités CVNU, pas en Wei).
 */
app.post('/api/cvnu/transfer', async (req, res) => {
    const { recipient, amount } = req.body;

    if (!ethers.isAddress(recipient)) {
        return res.status(400).json({ error: "Adresse du destinataire invalide." });
    }
    if (isNaN(amount) || parseFloat(amount) <= 0) {
        return res.status(400).json({ error: "Montant invalide." });
    }

    try {
        const decimals = await cvnuContract.decimals();
        const amountInWei = ethers.parseUnits(amount.toString(), decimals);

        console.log(`Tentative de transfert de ${amount} CVNU à ${recipient}...`);
        const tx = await cvnuContract.transfer(recipient, amountInWei);
        console.log("Transaction envoyée, hash :", tx.hash);

        // Attendre la confirmation de la transaction
        await tx.wait();
        console.log("Transaction confirmée !");

        res.status(200).json({
            message: `Transfert de ${amount} CVNU vers ${recipient} réussi.`,
            transactionHash: tx.hash
        });
    } catch (error) {
        console.error("Erreur lors du transfert de CVNU:", error);
        res.status(500).json({ error: "Échec du transfert de CVNU.", details: error.message });
    }
});

// Route par défaut pour toutes les autres requêtes (SPA)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Démarrage du serveur
app.listen(port, () => {
    console.log(`Serveur démarré sur http://localhost:${port}`);
    console.log('Fichiers statiques servis depuis le dossier public.');
});