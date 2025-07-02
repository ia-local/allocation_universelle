require('dotenv').config();
const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');
const Groq = require('groq-sdk');
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const sharp = require('sharp'); // Importez le module sharp ici
const app = express();
const port = 5007;
const generositeProgrammeePiliers = require('./public/generositeProgrammee');
const presentationCVNU = require('./public/presentationCVNU');

// Déclaration de la variable contenant le code Solidity du smart contract
const fairPaySmartContract = `
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

contract FairPayWithRU is ERC20 {
    using SafeMath for uint256;

    address public owner;
    uint256 public MinVP;
    uint256 public MaxVP;
    uint256 public RUAmount;
    uint256 public euroValue;
    uint256 public cvunRate;
    uint256 public cvunCap;
    uint256 public utmRate; // Taux de conversion temps en UTM (1 seconde = utmRate UTM)
    mapping(address => uint256) public userVP;
    mapping(address => uint256) public userRU;
    mapping(address => uint256) public userUTM; // Stockage des UTM
    mapping(address => uint256) public startTime; // Stockage du temps de début

    constructor() ERC20("FairPayToken", "FPT") {
        owner = msg.sender;
        MinVP = 314 * 10 ** decimals();
        MaxVP = 5314 * 10 ** decimals();
        RUAmount = 100 * 10 ** decimals();
        euroValue = 1 * 10 ** decimals();
        cvunRate = 10 * 10 ** decimals();
        cvunCap = 10000 * 10 ** decimals();
        utmRate = 1; // 1 seconde = 1 UTM par défaut
        _mint(msg.sender, 10000 * 10 ** decimals()); // Création de 10000 jetons pour le propriétaire
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    function seteuroValue(uint256 _euroValue) external onlyOwner {
        euroValue = _euroValue * 10 ** decimals();
    }

    function setCvunRate(uint256 _cvunRate) external onlyOwner {
        cvunRate = _cvunRate * 10 ** decimals();
    }

    function setCvunCap(uint256 _cvunCap) external onlyOwner {
        cvunCap = _cvunCap * 10 ** decimals();
    }

    function setUtmRate(uint256 _utmRate) external onlyOwner {
        utmRate = _utmRate;
    }

    function updateCvun(address account, uint256 value) external onlyOwner {
        uint256 cvun = userVP[account] * cvunRate;
        if (cvun > cvunCap) {
            cvun = cvunCap;
        }
        userVP[account] += cvun;
    }

    function getCvunRate() public view returns (uint256) {
        return cvunRate;
    }

    function geteuroValue() public view returns (uint256) {
        return euroValue;
    }

    function distributeRU() public {
        // Supposons que vous ayez une manière de suivre les utilisateurs.
        // Ici je simule une list d'adresse.
        address [] memory userList = new address[](2);
        userList[0] = owner;
        userList[1] = msg.sender;

        for (uint256 i = 0; i < userList.length; i++) {
            if (userVP[userList[i]] >= MinVP) {
                userRU[userList[i]] += RUAmount;
            }
        }
    }

    function claimRU() public {
        uint256 amount = userRU[msg.sender];
        require(amount > 0, "No RU to claim");
        userRU[msg.sender] = 0;
        payable(msg.sender).transfer(amount);
    }

    function getUserLevel(address account) public view returns (uint256) {
        if (userVP[account] >= MinVP && userVP[account] < MaxVP) {
            return 1;
        } else if (userVP[account] >= MaxVP) {
            return 5;
        } else {
            return 0;
        }
    }

    function mint(address account, uint256 amount) external onlyOwner {
        _mint(account, amount);
    }

    function burn(address account, uint256 amount) external onlyOwner {
        _burn(account, amount);
    }

    function transferFrom(address sender, address recipient, uint256 amount) external onlyOwner {
        _transfer(sender, recipient, amount);
    }

    // Fonctions UTM
    function startTrackingTime() external {
        startTime[msg.sender] = block.timestamp;
    }

    function stopTrackingTime() external {
        require(startTime[msg.sender] != 0, "Tracking not started");
        uint256 elapsedTime = block.timestamp - startTime[msg.sender];
        uint256 utmEarned = elapsedTime * utmRate;
        userUTM[msg.sender] += utmEarned;
        delete startTime[msg.sender];
    }

    function claimUTM() external {
        uint256 utmToClaim = userUTM[msg.sender];
        require(utmToClaim > 0, "No UTM to claim");
        userUTM[msg.sender] = 0;
        _mint(msg.sender, utmToClaim); // Exemple : 1 UTM = 1 FPT
    }
}
`;
// Nouvelle route pour la présentation de la réforme
const reforme = `
## Projet de réforme du code du travail pour la mise en place de la monétisation de la valeur travail cvnu PVT
* Objectifs de la réforme : Améliorer la valorisation des compétences, favoriser la formation et la professionnalisation, et encourager l'innovation et la création d'emplois qualifiés.

# Modification de la définition du travail :
- Article L3121-1 : Inclure la monétisation des compétences basée sur le curriculum vitae numérique universel (CVNU).

# Smart contracts pour la sécurité et la transparence :
- Article L4331-1 (nouvel article) : Dispositions relatives au Smart contract.
pour la sécurisation et la transparence des transactions liées à la monétisation des compétences.

# Redéfinition de la durée légale de travail et de sa monétisation :
- Article L3222-1 : Adapter la durée légale de travail et sa monétisation en fonction des dispositions de la réforme.

# Utilisation de la TVA pour financer la formation et l'emploi :
- Article L4334-1 : Redistribution des recettes de la TVA en faveur de la formation et de l'emploi en fonction des compétences validées sur le CVNU.
- Article L4333-1 (nouvel article) : Suivi régulier de la répartition des recettes de la TVA et de son impact sur la formation et l'emploi.
`;

const Generous = {
    "conceptTitle": "Générosité Programmée",
    "tagline": "Quand la Technologie Sert la Solidarité",
    "introduction": "Imaginez un futur où la solidarité n'est pas seulement un élan du cœur, mais une opportunité intégrée, fluide et transparente dans notre quotidien. Un futur où les surplus budgétaires individuels peuvent se transformer en un soutien concret pour ceux qui en ont le plus besoin, en quelques clics et avec une visibilité totale. Ce futur, c'est la promesse de la Générosité Programmée.",
    "context": {
      "problemStatement": "Les mécanismes de redistribution existants peuvent parfois sembler complexes, distants ou manquer de clarté quant à leur impact direct. Parallèlement, des surplus budgétaires individuels représentent un potentiel considérable pour amplifier la solidarité.",
      "opportunity": "Connecter les surplus budgétaires individuels aux besoins sociaux urgents de manière innovante et efficace."
    },
    "coreIdea": {
      "title": "L'État comme Facilitateur de la Solidarité",
      "description": "L'État joue un rôle proactif en créant un canal direct et transparent entre les citoyens et les causes sociales vérifiées, en s'appuyant sur les outils numériques et les données fiscales existantes."
    },
    "operation": {
      "title": "Fonctionnement en Quatre Étapes Clés",
      "steps": [
        {
          "stepNumber": 1,
          "title": "Notification Personnalisée",
          "description": "Un citoyen reçoit une notification claire et sécurisée l'informant d'un surplus budgétaire potentiel, présentée comme une opportunité d'agir.",
          "example": "Claire reçoit un message concernant un trop-perçu fiscal."
        },
        {
          "stepNumber": 2,
          "title": "Choix Éclairé via une Interface Intuitive (GÉNÉROS)",
          "description": "Le système intelligent GÉNÉROS propose des options de redistribution claires et contextualisées, avec des informations sur les causes, leur urgence et l'impact potentiel d'un don.",
          "systemName": "GÉNÉROS"
        },
        {
          "stepNumber": 3,
          "title": "Action Simple et Maîtrisée",
          "description": "Le citoyen choisit le montant à redistribuer et la cause à soutenir, conservant un contrôle total sur sa décision. L'interface est simple et inspire confiance.",
          "userControl": true
        },
        {
          "stepNumber": 4,
          "title": "Feedback Transparent et Valorisation",
          "description": "Le citoyen reçoit un retour d'information précis sur l'impact concret de son don, potentiellement avec des témoignages et des données quantifiables. Une reconnaissance fiscale peut valoriser cet acte de solidarité.",
          "feedbackMechanism": true,
          "potentialBenefit": "Reconnaissance fiscale"
        }
      ]
    },
    "technologyIntegration": {
      "title": "L'Apport Potentiel de la Technologie Blockchain (Smart Contracts)",
      "description": "L'utilisation de la blockchain et des Smart Contracts (comme `cvnu.sol` adapté) pourrait automatiser et enregistrer de manière immuable chaque étape du processus, offrant une traçabilité totale et une vérification par tous.",
      "technologies": ["Blockchain", "Smart Contracts"],
      "exampleContract": "cvnu.sol (adapté)",
      "benefits": ["Transparence Totale", "Traçabilité Complète", "Vérification par Tous"]
    },
    "keyBenefits": [
      "Efficacité Accrue : Canalisation rapide des fonds vers les besoins urgents.",
      "Transparence Totale : Information claire sur les causes, l'impact et potentiellement la traçabilité via la blockchain.",
      "Responsabilisation Citoyenne : Offre une manière simple et directe de contribuer au bien commun.",
      "Sans Surcoût pour l'État (potentiel) : Utilisation de fonds déjà disponibles (surplus budgétaires).",
      "Valorisation de la Solidarité : Reconnaissance de l'engagement citoyen."
    ],
    "ethicalAndDiscussionPoints": {
      "title": "Les Questions Éthiques et les Points de Discussion",
      "points": [
        "Volontariat vs. Incitation Morale : Le système doit-il rester purement volontaire ou peut-on envisager des mécanismes d'incitation plus forts ?",
        "Utilisation des Données Fiscales : Quelles sont les limites éthiques de l'utilisation de ces données à des fins de redistribution ?",
        "Neutralité et Fiabilité de l'IA (GÉNÉROS) : Comment garantir l'objectivité de l'IA dans l'identification des besoins et la sélection des causes ?",
        "Rôle de l'État : Ce système doit-il être un complément ou une alternative aux dispositifs sociaux existants ?",
        "Confiance et Adhésion : Comment assurer l'adhésion des citoyens et répondre à leurs éventuelles craintes ?"
      ]
    },
    "conclusion": "La Générosité Programmée représente une vision audacieuse et innovante de la solidarité au 21ème siècle. En exploitant la puissance de la technologie, elle offre un potentiel unique pour rendre l'acte de donner plus simple, plus transparent et plus impactant. En ouvrant la discussion sur ses implications éthiques et pratiques, nous pouvons collectivement façonner un avenir où la technologie sert véritablement l'humain et renforce les liens de notre société."
  };

app.use(express.static('public/'));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
app.get('/piliers', (req, res) => {
  res.json(generositeProgrammeePiliers); // Envoie les informations des piliers au format JSON
});
// Nouvelle route pour récupérer l'objet Generous
app.get('/generous-data', (req, res) => {
    res.json(Generous); // Envoie l'objet Generous au format JSON
});
// Nouvelle route pour récupérer le code du smart contract
app.get('/smart-contract', (req, res) => {
    res.json({ smartContract: fairPaySmartContract });
});
app.get('/presentation-cvnu', (req, res) => {
  res.json(presentationCVNU);
});
async function generateImageDescription(topic) {
    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { role: 'assistant', content: `** **<br/> | in box |.`, },
                {
                    role: 'user',
                    content: `** Décris une image qui illustre le thème suivant : ${topic}. La description doit être suffisamment détaillée pour générer une image pertinente.`,
                },
            ],
            model: 'gemma2-9b-it',
        });

        return chatCompletion.choices[0].message.content;
    } catch (error) {
        console.error('Erreur lors de la génération de la description de l\'image :', error);
        return 'Image abstraite liée à l\'intelligence artificielle.'; // Description par défaut en cas d'erreur
    }
}
app.get('/image', async (req, res) => {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const topic = req.query.topic; // Récupère la thématique à partir des paramètres de la requête

    try {
        // Génération de la description de l'image en fonction de la thématique
        const imageDescription = await generateImageDescription(topic);

        const model = genAI.getGenerativeModel({
            model: 'gemini-2.0-flash-exp',
            generationConfig: {
                responseModalities: ['Text', 'Image'],
            },
        });

        const response = await model.generateContent(imageDescription);
        for (const part of response.response.candidates[0].content.parts) {
            if (part.inlineData) {
                const imageData = part.inlineData.data;
                res.json({ image: imageData });
                return;
            }
        }
        res.status(500).send('Image non trouvée');
    } catch (error) {
        console.error('Erreur :', error);
        res.status(500).send('Erreur lors de la génération de l\'image');
    }
});

app.get('/conversation_agi', async (req, res) => {
  try {
    const chatCompletion = await groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'Vous êtes un assistant IA spécialisé dans la Générosité Programmée et ses aspects techniques. Expliquez les concepts en tenant compte des trois piliers : Transparence et Confiance, Impact et Mesurabilité, et Intégration et Accessibilité.',
        },
        {
            role: 'user',
            content: 'Expliquez brièvement le rôle des Smart Contracts dans la Générosité Programmée.',
        },
        {
            role: 'assistant',
            content: 'Les Smart Contracts 📜 automatisent et sécurisent les transactions de dons, assurant la **transparence** et la **confiance** en enregistrant chaque étape de manière immuable sur la blockchain. Ils peuvent également être programmés pour distribuer les fonds en fonction de critères précis, contribuant à la **mesurabilité** de l\'**impact**.',
        },
        {
            role: 'user',
            content: 'Comment le Curriculum Vitae Numérique Universel (CVNU) pourrait-il être intégré ?',
        },
        {
            role: 'assistant',
            content: 'Le CVNU 💼 pourrait servir de passeport numérique pour les organisations bénéficiaires, centralisant des informations vérifiées sur leur **impact** social, leur gouvernance et leur **transparence**. Intégré au système, il permettrait aux donateurs de faire des choix éclairés et de suivre la **mesurabilité** des actions soutenues.',
        },
        {
            role: 'user',
            content: 'Quel serait le rôle de l\'Économie Circulaire dans ce contexte ?',
        },
        {
            role: 'assistant',
            content: 'L\'Économie Circulaire ♻️ offre un cadre pour l\'**intégration** de la générosité Programmer en connectant les flux (emploi et réemploi, Ressources et Recette fiscale) à des actions solidaires. Des mécanismes automatisés via l\'AGI et des smart contracts pourraient diriger une partie de la valeur générée par l\'économie circulaire vers des initiatives sociales ou environnementales, rendant la générosité plus **accessible** et intrinsèquement liée à nos activités économiques.',
        },
        {
          role: 'user',
          content: `Imaginons une plateforme où les dons sont générés non seulement par des contributions directes, mais aussi par utilisation des surplus et recyclés; les ventes second-hand, la location d objets, etc. Cette approche créerait une boucle vertueuse, où l emploi de ressources partagées financerait des initiatives sociales et environnementales de manière durable. ✨,Ta réponse doit être rédigé au format HTML Intégrant La présentation de la générosité programmées du concept d'économies, circulaire et les 'curriculum vitae numérique universel', respectant les normes du Web sémantique W3C intégrant des emoji intélligent associer`,
        }
        ],
        model: 'gemma2-9b-it',
    });

    res.status(200).send(chatCompletion.choices[0].message.content);
} catch (error) {
    res.status(500).send('Une erreur est survenue');
}
});

app.get('/conversation_instance', async (req, res) => {
  try {
      const chatCompletion = await groq.chat.completions.create({
          messages: [
              {
                  role: 'system',
                  content: 'Vous êtes un assistant serviable qui explique des concepts complexes simplement.',
              },
              {
                  role: 'user',
                  content: 'Expliquez la Générosité Programmée en une phrase.',
              },
              {
                  role: 'assistant',
                  content: 'La Générosité Programmée est un système où la technologie facilite les dons directs et transparents à partir de surplus budgétaires individuels vers des causes sociales vérifiées.',
              },
              {
                  role: 'user',
                  content: 'Quels sont les principaux avantages de ce système ?  Ta réponse doit être rédigée au format liste en HTML, respectant les normes du Web sémantique W3C intégrant des emoji intelligents associés aux concepts clés.',
              },
          ],
          model: 'gemma2-9b-it',
      });

      res.status(200).send(chatCompletion.choices[0].message.content);
  } catch (error) {
      res.status(500).send('Une erreur est survenue');
  }
});
app.get('/AGI_et_Generosite_Programmee', async (req, res) => {
  try {
      const chatCompletion = await groq.chat.completions.create({
          messages: [
            {role:'system',content:`
              La Générosité Programmée : Quand la Technologie Sert la Solidarité

${Generous.introduction}

**Les Trois Piliers de la Générosité Programmée :**
- **${generositeProgrammeePiliers.transparenceEtConfiance.nom}**: ${generositeProgrammeePiliers.transparenceEtConfiance.description} (Technologies associées: ${generositeProgrammeePiliers.transparenceEtConfiance.technologiesAssociees.join(', ')})
- **${generositeProgrammeePiliers.impactEtMesurabilite.nom}**: ${generositeProgrammeePiliers.impactEtMesurabilite.description} (Outils associés: ${generositeProgrammeePiliers.impactEtMesurabilite.outilsAssocies.join(', ')})
- **${generositeProgrammeePiliers.integrationEtAccessibilite.nom}**: ${generositeProgrammeePiliers.integrationEtAccessibilite.description} (Domaines d'application: ${generositeProgrammeePiliers.integrationEtAccessibilite.domainesApplication.join(', ')})

En tenant compte de ces piliers, réfléchissez à la relation entre l'**Intelligence Artificielle Générative (AGI)** et le concept de la **Générosité Programmée**.
            `},
              {
                  role: 'user',
                  content: `** Rédige un article de blog sur l'AGI, le concept de Générosité Programmée et ses applications. Ta réponse doit être rédigée au format liste en HTML, respectant les normes du Web sémantique W3C intégrant des emoji intelligents associés aux concepts clés.`,
              },
          ],
          model: 'gemma2-9b-it',
      });

      res.status(200).send(chatCompletion.choices[0].message.content);
  } catch (error) {
      res.status(500).send('Une erreur est survenue');
  }
});
app.get('/AGI_et_Generosite_Programmee_cvnu', async (req, res) => {
    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [
              {role:'system',content:`{
    "title": "Présentation de la Blockchain 'Curriculum Vitae Numérique Universel'",
    "introduction": "Imaginez un monde où votre parcours professionnel et vos compétences sont enregistrés de manière **sécurisée**, **transparente** et **vérifiable** par tous. Un monde où la fraude sur les CV est pratiquement impossible et où la reconnaissance de vos acquis est instantanée et universelle. C'est la promesse d'un Curriculum Vitae Numérique Universel (CVNU) basé sur la technologie **blockchain**.",
    "whatIsBlockchain": {
      "title": "Qu'est-ce que la Blockchain ? Un Registre Décentralisé et Immuable",
      "points": [
        "**Décentralisée :** Contrairement aux bases de données traditionnelles stockées sur un serveur unique, la blockchain est distribuée sur un réseau d'ordinateurs (les 'nœuds'). Aucune entité unique ne contrôle l'ensemble des informations.",
        "**Immuable :** Une fois qu'une information (un 'bloc') est ajoutée à la blockchain, elle est cryptographiquement liée aux blocs précédents et ne peut plus être modifiée ou supprimée sans l'accord de la majorité du réseau. Cela garantit l'intégrité des données.",
        "**Transparente (Pseudonyme) :** Toutes les transactions et les données enregistrées sur la blockchain sont généralement visibles par tous les participants du réseau. Cependant, les identités réelles des utilisateurs sont souvent pseudonymisées (associées à des adresses cryptographiques).",
        "**Sécurisée :** La cryptographie avancée (notamment le hachage et les signatures numériques) assure la sécurité des données et l'authentification des transactions.",
        "**Consensuelle :** L'ajout de nouvelles informations à la blockchain nécessite un accord (un 'consensus') entre les participants du réseau, ce qui empêche les manipulations frauduleuses."
      ]
    },
    "howBlockchainRevolutionizesCVNU": {
      "title": "Comment la Blockchain Révolutionne le CVNU :",
      "advantages": [
        {
          "id": 1,
          "title": "Vérification et Authenticité Inégalées :",
          "points": [
            "Les diplômes, certifications, expériences professionnelles et compétences validées pourraient être enregistrés sur la blockchain par les institutions ou les employeurs émetteurs.",
            "Chaque ajout serait horodaté et cryptographiquement signé, garantissant son authenticité et empêchant toute falsification.",
            "Les recruteurs pourraient vérifier instantanément la validité des informations en consultant la blockchain, éliminant ainsi la nécessité de longues et coûteuses vérifications manuelles."
          ]
        },
        {
          "id": 2,
          "title": "Contrôle et Propriété des Données par l'Individu :",
          "points": [
            "L'individu serait le propriétaire de son CV numérique stocké sur la blockchain. Il déciderait quelles informations partager et avec qui.",
            "Cela renforce la protection des données personnelles et donne aux individus un contrôle accru sur leur identité professionnelle numérique."
          ]
        },
        {
          "id": 3,
          "title": "Portabilité et Universalité :",
          "points": [
            "Un CVNU basé sur une blockchain standardisée serait portable et reconnaissable partout dans le monde.",
            "Plus besoin de multiplier les formats de CV ou de s'adapter aux exigences spécifiques de chaque plateforme."
          ]
        },
        {
          "id": 4,
          "title": "Transparence et Confiance Accrues :",
          "points": [
            "La transparence de la blockchain renforcerait la confiance entre les candidats et les employeurs.",
            "Les parcours professionnels seraient plus clairs et les compétences validées de manière objective."
          ]
        },
        {
          "id": 5,
          "title": "Réduction de la Fraude :",
          "points": [
            "L'immuabilité de la blockchain rendrait extrêmement difficile la falsification d'informations sur un CV.",
            "Les tentatives de fraude seraient facilement détectables lors des vérifications."
          ]
        },
        {
          "id": 6,
          "title": "Valorisation des Compétences et du Parcours :",
          "points": [
            "La blockchain pourrait intégrer des systèmes de réputation et de validation par des pairs, enrichissant le CVNU avec des preuves sociales de compétences.",
            "Les contributions à des projets open source, les réalisations professionnelles et les formations suivies pourraient être valorisées de manière transparente."
          ]
        }
      ]
    },
    "potentialUseCases": {
      "title": "Cas d'Usage Potentiels :",
      "cases": [
        "Recrutement : Vérification rapide des antécédents, identification des talents correspondant aux besoins.",
        "Formation Continue : Enregistrement des acquis de formation et reconnaissance des compétences tout au long de la vie.",
        "Mobilité Professionnelle : Faciliter la transition entre différents emplois et secteurs.",
        "Freelancing : Établir une réputation vérifiable pour attirer des clients.",
        "Éducation : Délivrance et vérification sécurisée des diplômes et certifications."
      ]
    },
    "challengesAndConsiderations": {
      "title": "Défis et Considérations :",
      "challenges": [
        "Standardisation : La création d'un standard universel pour le CVNU sur blockchain est essentielle pour son adoption à grande échelle.",
        "Interopérabilité : Différentes blockchains pourraient émerger, nécessitant des mécanismes d'interopérabilité.",
        "Confidentialité : Des mécanismes de gestion de la confidentialité sophistiqués seraient nécessaires pour protéger les informations sensibles.",
        "Adoption : L'adoption par les individus, les institutions éducatives et les employeurs est cruciale pour le succès du CVNU sur blockchain.",
        "Coût et Scalabilité : Les coûts de transaction et la scalabilité de la blockchain choisie doivent être pris en compte."
      ]
    },
    "conclusion": "La blockchain offre un potentiel immense pour transformer la manière dont nous gérons et reconnaissons les parcours professionnels et les compétences. Un Curriculum Vitae Numérique Universel basé sur cette technologie pourrait apporter plus de sécurité, de transparence, de confiance et de portabilité au monde du travail et de l'éducation, ouvrant la voie à une reconnaissance plus juste et efficace des talents. C'est une évolution qui pourrait véritablement responsabiliser les individus et moderniser les processus d'embauche et de développement des compétences."
  };
              `},
              {
                role: 'assistant',
                content: `** Rédige une presentation complète du cvnu "Curriculum Vitae Numérique Universel" et associer au conceprte de Générosité Programmée et toutes les applications concernée. Ta réponse doit être rédigée au format liste en HTML, respectant les normes du Web sémantique W3C intégrant des emoji intelligents associés aux concepts clés.`,
            },
            ],
            model: 'gemma2-9b-it',
        });
  
        res.status(200).send(chatCompletion.choices[0].message.content);
    } catch (error) {
        res.status(500).send('Une erreur est survenue');
    }
  });
app.get('/AGI_et_Generosite_Programmee_plan', async (req, res) => {
  try {
      const chatCompletion = await groq.chat.completions.create({
          messages: [
              {role:'system',content:`
                La Générosité Programmée : Quand la Technologie Sert la Solidarité

Imagine un avenir où la solidarité ne se limite pas à un élan spontané, mais devient une opportunité intégrée, fluide et transparente dans notre vie quotidienne. Un futur où les excédents budgétaires individuels peuvent se transformer en un soutien concret pour ceux qui en ont le plus besoin, en quelques clics et avec une visibilité totale. Ce futur, c'est la promesse de la Générosité Programmée.

Le Contexte : Un Potentiel Inexploité

Aujourd'hui, les mécanismes de redistribution existants peuvent parfois sembler complexes, distants ou manquer de clarté quant à leur impact direct. Parallèlement, nous constatons que les surplus budgétaires individuels représentent un potentiel considérable pour amplifier la solidarité au sein de notre société.

L'Idée Centrale : L'État comme Facilitateur de la Solidarité

La Générosité Programmée repose sur une idée simple mais puissante : l'État joue un rôle proactif en créant un canal direct et transparent entre les citoyens et des causes sociales vérifiées. En s'appuyant sur les outils numériques et les données fiscales existantes, l'État peut devenir un facilitateur clé de la solidarité.

Le Fonctionnement en Quatre Étapes Clés (via le système "GÉNÉROS") :

Notification Personnalisée : Un citoyen reçoit une notification claire et sécurisée l'informant d'un surplus budgétaire potentiel, présenté comme une opportunité d'agir concrètement. Exemple : Claire reçoit un message concernant un trop-perçu fiscal.
Choix Éclairé via une Interface Intuitive (GÉNÉROS) : Le système intelligent GÉNÉROS propose des options de redistribution claires et contextualisées. Les citoyens reçoivent des informations pertinentes sur les causes, leur urgence et l'impact potentiel de leur don.
Action Simple et Maîtrisée : Le citoyen choisit le montant qu'il souhaite redistribuer et la cause qu'il désire soutenir, conservant un contrôle total sur sa décision. L'interface est conçue pour être simple et inspirer confiance.
Feedback Transparent et Valorisation : Après son action, le citoyen reçoit un retour d'information précis sur l'impact concret de son don, potentiellement enrichi de témoignages et de données quantifiables. Une reconnaissance fiscale pourrait venir valoriser cet acte de solidarité.
L'Apport Potentiel de la Technologie Blockchain (Smart Contracts) :

L'intégration de la technologie blockchain et des Smart Contracts (comme une version adaptée de cvnu.sol) pourrait automatiser et enregistrer de manière immuable chaque étape du processus. Cela offrirait une transparence totale, une traçabilité complète et une vérification par tous les acteurs.

Les Bénéfices Clés Attendus :

Efficacité Accrue : Les fonds sont canalisés rapidement vers les besoins les plus urgents.
Transparence Totale : Les informations sur les causes, l'impact et potentiellement la traçabilité via la blockchain sont claires.
Responsabilisation Citoyenne : Offre une manière simple et directe de contribuer au bien commun.
Sans Surcoût pour l'État (potentiel) : Utilisation de fonds déjà disponibles (surplus budgétaires).
Valorisation de la Solidarité : Reconnaissance de l'engagement citoyen.
Points de Discussion Éthiques et Pratiques :

Le concept soulève des questions importantes qui nécessitent une discussion approfondie :

Volontariat vs. Incitation Morale
Utilisation des Données Fiscales et limites éthiques
Neutralité et Fiabilité de l'IA (GÉNÉROS)
Rôle de l'État (complément ou alternative aux dispositifs existants)
Confiance et Adhésion des citoyens
En Conclusion : Une Vision Audacieuse pour la Solidarité du 21ème Siècle

La Générosité Programmée représente une vision novatrice de la solidarité, exploitant la puissance de la technologie pour rendre l'acte de donner plus simple, plus transparent et plus impactant. En ouvrant la discussion sur ses implications éthiques et pratiques, nous pouvons collectivement façonner un avenir où la technologie sert véritablement l'humain et renforce les liens de notre société.


                `},
              {
                  role: 'user',
                  content: `** Rédige un Un plan d'action pour le développement et AGI le concepte de ${Generous} Tresors et ses domaine applications. Ta réponse doit être rédigé au format liste en HTML Intégrant les différentes phases de développement du plan d'action, respectant les normes du Web sémantique W3C intégrant des emoji intélligent associer`,
              },
          ],
          model: 'gemma2-9b-it',
      });

      res.status(200).send(chatCompletion.choices[0].message.content);
  } catch (error) {
      res.status(500).send('Une erreur est survenue');
  }
});
app.get('/AGI_et_Generosite_Programmee_plan_reforme', async (req, res) => {
    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {role:'system',content:`
                ## Projet de réforme du code du travail pour la mise en place de la monétisation de la valeur travail cvnu PVT
* Objectifs de la réforme : Améliorer la valorisation des compétences, favoriser la formation et la professionnalisation, et encourager l'innovation et la création d'emplois qualifiés.

# Modification de la définition du travail :
- Article L3121-1 : Inclure la monétisation des compétences basée sur le curriculum vitae numérique universel (CVNU).

# Smart contracts pour la sécurité et la transparence :
- Article L4331-1 (nouvel article) : Dispositions relatives au Smart contract.
pour la sécurisation et la transparence des transactions liées à la monétisation des compétences.

# Redéfinition de la durée légale de travail et de sa monétisation :
- Article L3222-1 : Adapter la durée légale de travail et sa monétisation en fonction des dispositions de la réforme.

# Utilisation de la TVA pour financer la formation et l'emploi :
- Article L4334-1 : Redistribution des recettes de la TVA en faveur de la formation et de l'emploi en fonction des compétences validées sur le CVNU.
- Article L4333-1 (nouvel article) : Suivi régulier de la répartition des recettes de la TVA et de son impact sur la formation et l'emploi.
                  `},
                {role:'assistant',name:'MandatoryAi',content:reforme},
                {
                    role: 'user',
                    content: `** Rédige Une présentation simplifiée accessible à tout public du projet de réforme et AGI le concepte de Générosité programmer aux Tresors Public et tout les domaines applications. Ta réponse doit être rédigé au format liste en HTML Intégrant les différentes phases de développement du plan d'action, respectant les normes du Web sémantique W3C intégrant des emoji intélligent associer`,
                },
            ],
            model: 'gemma2-9b-it',
        });
  
        res.status(200).send(chatCompletion.choices[0].message.content);
    } catch (error) {
        res.status(500).send('Une erreur est survenue');
    }
  });
  app.get('/analyse_contrat', async (req, res) => {
    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content: `Vous êtes un expert en smart contracts Solidity et en économie du travail. Analysez le contrat suivant en tenant compte des concepts de CVNU et de valorisation du temps de travail : \n\n${fairPaySmartContract}`,
                },
                {
                    role: 'user',
                    content: 'Quels sont les mécanismes principaux de ce contrat liés à la valorisation des compétences (CVNU) et du temps de travail (UTM) ?',
                },
                {
                    role: 'assistant',
                    content: `** Rédige une analyse complète Sur ce smart contrat ${fairPaySmartContract} et le concept de Générosité Programmée et toutes les applications concernée. Ta réponse doit être rédigée au format liste en HTML, respectant les normes du Web sémantique W3C intégrant des emoji intelligents associés aux concepts clés.`,
                },
            ],
            model: 'gemma2-9b-it',
        });

        res.status(200).send(chatCompletion.choices[0].message.content);
    } catch (error) {
        console.error('Erreur lors de l\'analyse du contrat :', error);
        res.status(500).send('Erreur lors de l\'analyse du contrat');
    }
});
// ... code précédent ...
app.listen(port, () => console.log(`TRESOR _cache_ : http://localhost:${port}`));