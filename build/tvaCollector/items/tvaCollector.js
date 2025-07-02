import { ethers } from "ethers";
import abi from "./abi_smartContract_cvnu.json" assert { type: "json" };

// CONFIGURATION
const CONTRACT_ADDRESS = "0xYourDeployedContractAddress";
const PROVIDER_URL = "https://mainnet.infura.io/v3/your-infura-key";
const PRIVATE_KEY = "0xYourPrivateKey"; // du wallet propriétaire

// INITIALISATION
const provider = new ethers.JsonRpcProvider(PROVIDER_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, wallet);

// 📤 Fonction de transfert avec collecte de TVA
async function sendTaxedTokens(to, amount) {
  try {
    const decimals = await contract.decimals();
    const amountInWei = ethers.parseUnits(amount.toString(), decimals);
    const tx = await contract.transfer(to, amountInWei);
    console.log("📦 Transaction envoyée :", tx.hash);
    await tx.wait();
    console.log("✅ Transaction confirmée !");
  } catch (error) {
    console.error("❌ Erreur lors du transfert :", error);
  }
}

// 🧾 Afficher l'adresse de collecte TVA + taux
async function showTaxInfo() {
  const taxAddress = await contract.taxCollector();
  const rate = await contract.taxRate();
  console.log("🧾 Taxe envoyée à :", taxAddress);
  console.log("📊 Taux de taxe :", rate / 100, "%");
}

// 🧪 Exemple d'exécution
(async () => {
  await showTaxInfo();
  await sendTaxedTokens("0xRecipientAddressHere", 100);
})();
