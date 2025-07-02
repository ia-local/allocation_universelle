```

/
├── server_modules/                 # Logique métier et API du serveur
│   ├── utms/                       # Modules de calcul des Unités Temporelles Monétisables (UTMi)
│   │   ├── utmi_calculator.js      # Calcul de base UTMi, valorisation par interaction (remplace une partie de l'ancien utms_calculator.js)
│   │   ├── capital_management.js   # Gestion RUM, Trésorerie, Valeur CV (nouvelles fonctions extraites de utms_calculator.js)
│   │   ├── dashboard_aggregator.js # Agrégation des logs pour le tableau de bord (nouvelles fonctions extraites de utms_calculator.js)
│   │   └── constants.js            # Coefficients, scores de qualité modèles, etc. (extrait de utms_calculator.js)
│   ├── routes/                     # Définition des routes API par fonctionnalité
│   │   ├── auth_routes.js          # (Si authentification ajoutée - pour l'avenir)
│   │   ├── home_routes.js          # Routes pour l'interaction ponctuelle (ex: /api/generate)
│   │   ├── chat_routes.js          # Routes pour le chatbot (ex: /api/conversations/*)
│   │   ├── cv_routes.js            # Routes pour le générateur de CV (ex: /api/cv/*)
│   │   ├── dashboard_routes.js     # Routes pour le tableau de bord (ex: /api/dashboard-insights)
│   │   └── wallet_routes.js        # Routes pour la gestion du portefeuille/trésorerie (ex: /api/wallet-data - à implémenter)
│   ├── services/                   # Interfaces avec services externes ou la BDD
│   │   ├── groq_service.js         # Interface avec l'API Groq (ou autres LLM)
│   │   ├── db_service.js           # Interface avec la base de données (logs, conversations, CVs)
│   │   └── smart_contract_service.js # NOUVEAU: Interaction avec les contrats intelligents (à développer)
│   └── utils/                      # Fonctions utilitaires génériques
│       └── helpers.js              # Fonctions utilitaires génériques (ex: logging, validation)
├── public/                         # Répertoire des fichiers statiques (servis par Express)
│   ├── js/                         # Scripts JavaScript côté client
│   │   ├── app.js                  # Nouveau contrôleur principal client (orchestre les modules UI, remplace le grand cv.js)
│   │   ├── home_ui.js              # Logique DOM et events pour la page d'accueil (extraite de cv.js)
│   │   ├── chat_ui.js              # Logique DOM et events pour le chat (extraite de cv.js)
│   │   ├── cv_ui.js                # Logique DOM et events pour le générateur de CV (extraite de cv.js, et inclura la génération HTML/CSS)
│   │   ├── dashboard_ui.js         # Logique DOM et events pour le tableau de bord (extraite de cv.js)
│   │   ├── modal_ui.js             # Logique des modales (ex-modal.js, renommé)
│   │   └── pagination_ui.js        # Logique de pagination (ex-pagination.js, renommé)
│   ├── css/                        # Fichiers CSS
│   │   ├── style.css               # Styles globaux (issus de SCSS compilé)
│   ├── assets/                     # Images, icônes, etc.
│   └── index.html                  # Point d'entrée de l'application
├── contracts/                      # NOUVEAU: Contrats intelligents
│   ├── cvnu.sol                    # Fichier Solidity du contrat intelligent CVNU
│   └── abi_smartContract_cvnu.json # ABI du contrat intelligent (interface JSON)
├── .env                            # Variables d'environnement sensibles
├── package.json                    # Dépendances du projet
└── serveur.js                      # Point d'entrée du serveur (importe les modules de routes, configuration Express)

``