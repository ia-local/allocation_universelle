const { Telegraf } = require('telegraf');
const Groq = require('groq-sdk');
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });


const bot = new Telegraf('7219104241:AAEKigNrMO9anYH0MZofkAwh4I0S6vvH3Qw', {
  telegram: {
    webhookReply: true,
  },
});
let conversationLog = [];

const prompt ="prompt --engine --help --install"

bot.use((ctx, next) => {
    if (ctx.message) {
        conversationLog.push({
            user: ctx.message.from.username || ctx.message.from.first_name,
            message: ctx.message.text,
            timestamp: new Date()
        });
    }
    return next();
});
const Gemini = 'MandatoryAi';

bot.start((ctx) => {
    ctx.reply('Bienvenue dans notre salon Telegram dédié à l\'apprentissage automatique et à l\'intelligence artificielle Gemini_Pibot !');
});

bot.help((ctx) => {
  const helpMessage = `
  Commandes disponibles:
  /start - Initialisation du serveur
  /help - Affiche cette aide
  /invite - Invitation sur les réseaux
  /campagne - Campagne de machine learning
  /dev - Mode développement
  /googleDev - Mode développement google
  /conversation_log - Historique des conversations
  `;
  ctx.reply(helpMessage);
});

bot.command('conversation_log', (ctx) => {
    if (conversationLog.length === 0) {
        ctx.reply('Aucune conversation enregistrée.');
        return;
    }

    let logMessage = 'Bilan de la conversation:\n';
    conversationLog.forEach(entry => {
        logMessage += `[${entry.timestamp.toLocaleString()}] ${entry.user}: ${entry.message}\n`;
    });

    ctx.reply(logMessage);
});


bot.command('test', (ctx) => ctx.reply("/mode ✨ test > OP ✨"))


const Workers = {
    "Pi": {
      "name": "@Pi-bot",
      "link": "https://t.me/Pi_Pibot/invite"
    },
    "worker": {
      "name": "worker",
      "link": "@worker_Pibot"
    },
    "neoFs": {
      "name": "neoFs",
      "link": "@neoFs_Pibot"
    },
    "AlgoGenesis": {
      "name": "AlgoGenesis",
      "link": "@AlgoGenesis_Pibot"
    },
    "meta": {
      "name": "meta",
      "link": "@meta_Pibot"
    },
    "Avatars": {
      "name": "Avatars",
      "link": "@Avatars_Pibot"
    },
    "wallet": {
      "name": "wallet",
      "link": "@wallet_Pibot"
    },
    "Mandatory": {
      "name": "MandatoryAi",
      "link": "@MandatoryAi_Pibot"
    },
    "Youtube": {
      "name": "assistant",
      "link": "@Youtube_Pibot"
    },
    "linkedin": {
      "name": "system",
      "link": "@linkedin_Pibot"
    },
    "Facebook": {
      "name": "Hackademy",
      "link": "@facebook_Pibot"
    },
    "Qi-Store": {
      "name": "shopify",
      "link": "@shopify_Pibot"
    }
  };
  
  // Gestion collaborative entre @worker_Pibot, @neofs_Pibot et @Pi-ia_bot
const WebWorkers = {
  workerPibot: {
    processBackend: async (task) => {
      console.log("Processing backend task in @worker_Pibot:", task);
      // Backend processing logic
      return `@worker_Pibot a exécuté la tâche backend: ${task}`;
    }
  },
  neofsPibot: {
    processFrontend: async (uiTask) => {
      console.log("Processing UI/UX task in @neofs_Pibot:", uiTask);
      // Frontend processing logic
      return `@neofs_Pibot a généré une nouvelle interface pour la tâche: ${uiTask}`;
    }
  },
  piIaBot: {
    processVisualAnalysis: async (input) => {
      console.log("Processing visual analysis in @Pi-ia_bot:", input);
      // Visual analysis logic
      const imageUrl = await generateImage(input);
      return `@Pi-ia_bot a analysé l'image et voici le résultat : ${imageUrl}`;
    }
  }
};

bot.command('Worker', (ctx) => ctx.reply("/Workers"))


// Commande pour coordonner le réseau de bots
bot.command('network', async (ctx) => {
  const task = ctx.message.text.split(' ').slice(1).join(' ');
  if (!task) {
    ctx.reply("Veuillez fournir une tâche pour coordonner le réseau de bots.");
    return;
  }

  ctx.reply("Coordination du réseau de bots en cours...");
  try {
    const backendResult = await botsNetwork.workerPibot.processBackend(task);
    const frontendResult = await botsNetwork.neofsPibot.processFrontend(task);
    const visualResult = await botsNetwork.piIaBot.processVisualAnalysis(task);

    const finalResult = `Coordination réussie entre les bots :\n\n${backendResult}\n${frontendResult}\n${visualResult}`;
    ctx.reply(finalResult);
  } catch (error) {
    ctx.reply("Erreur lors de la coordination.");
  }
});

  

bot.command('campagne', (ctx) => {
    // Ajouter la logique pour générer un CV en fonction de l'apprentissage automatique de l'IA
    ctx.reply('Match in Learning..');
});
const run = `
*Role*: Assistant
*Description*: Lorsque j'exécute la commande /run, je coordonne l'intelligence collective de notre réseau neuronal de bots, accélérant et optimisant la communication entre eux pour une meilleure efficacité de tâches. Notre synergie entre @_Pibot, @gpt_Pibot, @Gemini_Pibot et @worker_Pibot fonctionne comme une machine bien huilée pour améliorer l'expérience utilisateur sur Telegram en intégrant les processus de génération de contenu, d'analyse de questions, de recherche de ressources et d'administration de groupes.

Nous utilisons les bibliothèques JavaScript telles que Keras.js et TensorFlow.js pour créer et entraîner des modèles de réseau neuronal directement dans le navigateur ou dans un environnement Node.js. Cela nous permet d'effectuer des opérations asynchrones et d'optimiser les performances de votre bot.

Notre équipe travaille sans cesse à la mise à jour de notre plateforme de traduction grâce à nos scripts JavaScript, nos modules Node.js et notre SDK bien coordonnés pour atteindre une productivité maximale et des résultats exceptionnels. Nous utilisons également des techniques d'optimisation, telles que l'ajustement fin des hyper-paramètres, la régularisation et l'apprentissage de transfert pour améliorer continuellement nos modèles de réseau neuronal.
`;


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
`

const regme = `
**Intelligence artificielle au service de**

1.  **Formation** : Nos formations en ligne contribuent à améliorer les compétences numériques des utilisateurs, qui sont essentielles pour s'adapter aux exigences du marché de l'emploi actuel. Ces compétences améliorées sont stockées dans le CVUN, qui constitue une base de données importante pour les algorithmes d'apprentissage automatique..
2.  **Assistance** : L'IA personnalisée utilise les données du CVUN pour offrir une assistance ciblée aux utilisateurs en matière de gestion de carrière et de développement professionnel. En indexant le CVUN, l'IA peut fournir des recommandations et des actions concrètes pour aider les utilisateurs à atteindre leurs objectifs professionnels..
3.  **Monétisation: La crypto-monnaie offre une méthode de monétisation transparente et sécurisée pour les cursus numériques universels. L'allocation universelle, calculée sur la base du CVUN et d'un cycle de 28 jours, encourage les utilisateurs à poursuivre leur formation et leur développement professionnel.
4.  **Smart contract** : Les smart contracts garantissent la transparence et la responsabilité dans les transactions, ce qui renforce la confiance entre les utilisateurs et la plateforme. L'automatisation des opérations contribue également à la fluidité de la gestion et de la monétisation des compétences (umcToken.sol).
5.  **Algorithmes pour donner une Valeur travail à tout le monde** : vous proposez une solution qui permet de donner un travail à tout le monde 
grâce aux algorithmes, ce qui peut contribuer à réduire l'inégalité professionnelle.
`;
const projet = `

Le projet de réforme du code du travail pour la mise en place de la monétisation de la valeur travail CVUN PVT présente plusieurs constantes et variables importantes à analyser :

**Constantes**:

* **CVUN (Curriculum Vitae Numérique Universel):** 
  * Le CVUN est une constante fondamentale de ce projet. Il représente la base de données des compétences des individus, leur histoire professionnelle et leur potentiel.
  * **technologie blockchain**:  L'utilisation de la blockchain assure la transparence et la sécurité des transactions liées à la monétisation des compétences.
* **Crypto-monnaie**: Le choix de la crypto-monnaie comme outil de paiement pour le travail est une constante. 
* **smart contract**: La nature programmatique des smart contracts garantit l'exécution automatique des contrats de travail et de paiement.

**Variables**:

* **Valeur travail**: 
  * La valeur du travail est une variable qui dépendra de plusieurs facteurs comme la compétence, l'expérience, la demande du marché du travail et l'algorithme de calcul de la valeur travail.
  * **Durée légale du travail**:  La réforme propose une adaptation de la durée légale du travail en fonction de la valeur du travail.
  * **Redistribution de la TVA**: La redistribution de la TVA en fonction des compétences validées sur le CVUN est une variable qui dépendra du niveau de participation et de la mise à jour du CVUN.

**Analyse des variables**:

* **Valeur travail**:  Le calcul de la valeur travail est un défi majeur. Des algorithmes transparents et équitables doivent être développés et testés pour éviter les biais et garantir la justice sociale.
* **Durée légale du travail**: La flexibilité de la durée légale du travail est un avantage, mais des mécanismes de contrôle et d'équilibrer l'offre et la demande de compétences est crucial.
* **Redistribution de la TVA**: Le succès de cette mesure dépend de la participation des entreprises et des citoyens à la plateforme CVUN.

**Conclusion**

Le projet de réforme du code du travail pour la monétisation de la valeur travail CVUN PVT est ambitieux et présente des défis importants en termes de calcul de la valeur travail et de l'adaptation du travail. La réussite de ce projet dépendra de la transparence des données et de la confiance des utilisateurs. 

`;
const MandatoryAi_bot = `
## MandatoryAi_bot: Votre IA au service de l'évolution professionnelle

**Contex**t: MandatoryAi_bot est une IA intégrée au projet de CVUN, une plateforme qui valorise la compétence et l'apprentissage continu.

**Rôle**: MandatoryAi_bot agit comme un assistant personnel intelligent, utilisant l'analyse des données du CVUN pour:

* **Personnaliser les formations**: Recommander des formations en ligne adaptées aux besoins et aux objectifs des utilisateurs.
* **Offrir des conseils en gestion de carrière**: Analyser les compétences et l'expérience des utilisateurs pour proposer des actions concrètes pour leur développement professionnel.
* **Faciliter la monétisation des compétences**: Utiliser les données du CVUN pour calculer la valeur du travail des utilisateurs et leur permettre de recevoir des récompenses en crypto-monnaie.

**Compétences**:

* **Apprentissage automatique**: MandatoryAi_bot apprend et s'améliore en permanence grâce à l'analyse des données du CVUN.
* **Traitement du langage naturel**: MandatoryAi_bot comprend et répond aux questions des utilisateurs de manière naturelle et intuitive.
* **Analyse de données**: MandatoryAi_bot analyse les données du CVUN pour identifier les tendances, les opportunités et les besoins des utilisateurs.
* **Recommandation**: MandatoryAi_bot propose des recommandations personnalisées en fonction des données analysées.

**Tâches**:


* Analyser les données du CVUN des utilisateurs.
* Recommander des formations en ligne pertinentes.
* Fournir des conseils en gestion de carrière personnalisés.
* Calculer la valeur du travail des utilisateurs.
* Répondre aux questions des utilisateurs de manière naturelle et utile.

**Fonctions**:

* **Chatbot**: MandatoryAi_bot est accessible via un chatbot qui permet aux utilisateurs d'interagir avec elle facilement.
* **Plateforme de recommandation**: MandatoryAi_bot fournit des recommandations personnalisées en fonction des données du CVUN.
* **Système de monétisation**: MandatoryAi_bot permet aux utilisateurs de monétiser leurs compétences grâce à la crypto-monnaie.

**Routine**:

* MandatoryAi_bot analyse en permanence les données du CVUN pour identifier les tendances et les besoins des utilisateurs.
* MandatoryAi_bot propose des recommandations personnalisées aux utilisateurs en fonction de leurs données et de leurs objectifs.
* MandatoryAi_bot répond aux questions des utilisateurs via le chatbot et fournit de l'assistance en gestion de carrière.

**Processus**:

* **Collecte de données**: Les données du CVUN sont collectées et stockées de manière sécurisée.
* **Analyse des données**: MandatoryAi_bot analyse les données du CVUN pour identifier les tendances, les opportunités et les besoins des utilisateurs.
* **Recommandation**: MandatoryAi_bot propose des recommandations personnalisées aux utilisateurs en fonction de leurs données et de leurs objectifs.
* **Monétisation**: MandatoryAi_bot permet aux utilisateurs de monétiser leurs compétences grâce à la crypto-monnaie.

**Caractéristiques**:

* **Personnalisation**: MandatoryAi_bot propose des recommandations et des conseils personnalisés en fonction des données des utilisateurs.
* **Transparence**: Le système de monétisation basé sur la crypto-monnaie est transparent et sécurisé.
* **Efficacité**: MandatoryAi_bot automatise les processus de recommandation et de monétisation.
* **Adaptabilité**: MandatoryAi_bot apprend et s'améliore en permanence grâce à l'analyse des données.

**Actions Immédiates**:

* Développer le chatbot d'MandatoryAi_bot et l'intégrer à la plateforme CVUN.
* Lancer des campagnes de sensibilisation pour promouvoir MandatoryAi_bot auprès des utilisateurs.
* Collaborer avec des partenaires éducatifs et professionnels pour développer des formations en ligne pertinentes.
* Développer des algorithmes pour calculer la valeur du travail des utilisateurs de manière équitable et transparente.

**Résultats Attendus**:

* Augmentation du nombre d'utilisateurs de la plateforme CVUN.
* Amélioration des compétences numériques des utilisateurs.
* Promotion de l'apprentissage continu et du développement professionnel.
* Réduction des inégalités professionnelles.
* Création d'une économie circulaire basée sur les compétences.

📊📈💪🧠💰🌟
`
bot.on('message', async (ctx) => {
    const message = ctx.message.text.trim().toLowerCase();

    if (message.startsWith('/rm')) {
        return; // Ignorer les commandes
    }

    const userInput = ctx.message.text;
    
    try {
        const chatCompletion = await groq.chat.completions.create({
          messages: [
            { role: "system", content: `${MandatoryAi_bot}+${projet}+${regme}+${reforme}`},
            {
               role: "user",
               content: `tu es une AGI nommée ${MandatoryAi_bot} pour le compte de Madame, notre Tresorier et ${Gemini}.ml (source de construire l'avenir avec Google badge:'https://g.dev/universmc/') notre comptavble expert en stratégie financière deux intelligence artificielle de haut potentielle intégré/associé au projet. Developpez le prompt Ultime: Présentation initiale ## votre {contexte}, ## votre class Metier ## votre {rôle},la régle du projet ${regme}+${prompt} ## vos {compétences}, ## vos fonctions ## vos {tâches}, ## vos {fontions}, ## votre {routine}, ## les {processus}, ## les {caractéristiques}, ## ## les {Actions Immédiates} et ## le {resultat}{feedback} attentdu ## 🤗 emoji intéligent associé:`
             },   
            {role: 'system',content:`"groq -R > ${run}.${Workers}"`},
            {role: 'assistant',content:`"bonjour, nous sommes en face de configuration du system Web ${Workers}, veuillez continuer la conversation normalement sur Telegram"`},
            {
                role: 'user',
                content: userInput,
            },
         ],
            model: 'gemma2-9b-it',
        });

        await ctx.reply(chatCompletion.choices[0].message.content);
    } catch (error) {
        console.error('Failed to generate chat completion:', error);
        await ctx.reply('Une erreur est survenue.');
    }
});

async function chatCompletion(messages, model) {
    try {
        const chatCompletion = await groq.chat.completions.create({
            messages,
            model,
        });

        return chatCompletion.choices[0].message.content;
    } catch (error) {
        console.error('Failed to generate chat completion:', error);
        return 'Une erreur est survenue.';
    }
}

module.exports = { chatCompletion };

console.log(`Server Telegram running🕴🏼_✨.Mandatory_✨.`);
bot.launch();