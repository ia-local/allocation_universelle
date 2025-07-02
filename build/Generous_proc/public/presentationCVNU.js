const presentationCVNU = {
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
  
  // Pour intégrer ceci dans ton serveur.js, tu peux simplement déclarer cette constante
  // et créer une route pour la servir en JSON, comme tu l'as fait pour d'autres données.
  
  // Exemple d'ajout de route dans server.js :
  // app.get('/presentation-cvnu', (req, res) => {
  //   res.json(presentationCVNU);
  // });
  
  module.exports = presentationCVNU;