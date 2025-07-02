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
// ... code précédent ...
app.listen(port, () => console.log(`Server running on port http://localhost:${port}`));