# Pegass Dashboard

Dashboard web pour visualiser les statistiques des bénévoles extraites depuis [Pegass](https://pegass.croix-rouge.fr) (Croix-Rouge française). 

Ce dashboard vous permet d'analyser et de visualiser facilement les heures de bénévolat de votre Unité Locale.

## 🌟 Fonctionnalités

- **Vue d'ensemble** : Statistiques globales (total des heures, répartition par type d'activité, évolution mensuelle).
- **Palmarès** : Top des bénévoles par volume d'heures.
- **Détails par bénévole** : Profil individuel avec historique des missions, co-équipiers fréquents et répartition des heures.
- **Exports complets** : Exportez vos données en Excel ou CSV pour des traitements poussés.
- **Filtres** : Filtrez les exports par secteur d'activité (Urgence, Action Sociale, etc.).

## 🚀 Comment l'utiliser ?

### 1. Obtenir vos données depuis Pegass
Le dashboard ne se connecte pas directement à Pegass. Vous devez d'abord extraire vos données :
1. Installez l'extension [Pegass Extractor](https://github.com/gustou/pegass-extractor) (disponible pour Firefox).
2. Utilisez l'extension sur le site Pegass pour générer un fichier contenant vos statistiques (au format `.json`).

### 2. Ouvrir le dashboard
Vous avez deux possibilités pour utiliser le dashboard, sans aucune installation requise sur votre ordinateur :

#### Option A : En ligne (le plus simple)
Rendez-vous sur : **[https://gustou.github.io/pegass-dashboard/](https://gustou.github.io/pegass-dashboard/)**
*Fonctionne sur macOS, Linux, Windows. Aucune donnée n'est envoyée sur internet, tout reste dans votre navigateur.*

#### Option B : Hors ligne (idéal sans connexion)
1. Téléchargez le fichier `pegass-dashboard-offline-vX.Y.Z.html` depuis la page des [Releases](../../releases).
2. Double-cliquez sur le fichier pour l'ouvrir dans votre navigateur.
*Aucune connexion réseau n'est requise. Pratique si vous avez des restrictions de sécurité ou des difficultés d'accès.*

### 3. Analyser vos données
Une fois le dashboard ouvert, glissez simplement le fichier `.json` (obtenu à l'étape 1) dans la zone prévue à cet effet et consultez vos statistiques !

## 🔒 Confidentialité & Sécurité (RGPD)

Vos données sont sensibles. Le dashboard a été conçu pour garantir une confidentialité totale :
- **100% local** : Toutes les données restent et sont traitées directement dans votre navigateur. Absolument rien n'est envoyé sur Internet ou sur nos serveurs.
- **Stockage temporaire** : Une copie est gardée dans votre navigateur (`localStorage`) pour vous éviter de devoir re-glisser le fichier si vous fermez et rouvrez la page.
- **Nettoyage facile** : Le bouton « Nouveau fichier » ou « Effacer les données » vide complètement la mémoire de votre navigateur.
- **Transparence** : L'application est hébergée sur GitHub Pages de manière statique. Elle ne fait aucune requête externe vers nos serveurs une fois chargée.

---

## 🛠 Pour les développeurs

Si vous souhaitez contribuer, comprendre le fonctionnement interne ou adapter ce dashboard à vos besoins :

### Stack Technique
- **Vite 8** + **Svelte 5** (runes) + **TypeScript**
- **TailwindCSS 4** (via `@tailwindcss/vite`)
- **Chart.js 4** pour les graphiques
- **ExcelJS 4** pour l'export Excel stylé
- **Vitest** pour les tests unitaires
- **vite-plugin-singlefile** pour la build offline

### Deux modes de build
Une seule base de code produit deux artefacts :
- `npm run build` : Génère le site multi-fichiers dans `dist/` pour le déploiement en ligne (déployé automatiquement via `.github/workflows/deploy.yml`).
- `npm run build:offline` : Génère un fichier HTML unique dans `dist-offline/` qui contient tout (HTML, JS, CSS).

### Installation et développement
```bash
npm install
npm run dev            # Lance le serveur de développement : http://localhost:5173/pegass-dashboard/
npm run check          # Vérification des types (TypeScript + Svelte)
npm test               # Lancement des tests (Vitest)
npm run build          # Build pour le web (GitHub Pages)
npm run build:offline  # Build pour la version hors-ligne
```

*Note : Par défaut, le build pour GitHub Pages utilise le base path `/pegass-dashboard/`. Si tu forkes et changes le nom du repo, surcharge via variable d'environnement : `VITE_BASE_PATH=/mon-repo/ npm run build`*

### Format JSON attendu
Généré par [Pegass Extractor](https://github.com/gustou/pegass-extractor), le fichier doit suivre cette structure (voir l'extension pour le schéma complet) :
```json
{
  "metadata": {
    "unite_locale": "UNITE LOCALE DE CLAMART",
    "periode": { "debut": "2024-01-01", "fin": "2024-12-31" }
  },
  "benevoles": [
    {
      "id": "...",
      "nom": "...",
      "prenom": "...",
      "heures": { "total": 156, "par_mois": {}, "par_type": {} },
      "missions": [{ "date": "2024-04-14", "heures": 8 }]
    }
  ],
  "evenements": [
    {
      "id": "...",
      "nom": "...",
      "statut": "Validée",
      "groupeAction": "Urgence et Secourisme",
      "date": "2024-04-14"
    }
  ]
}
```

Voir [`exemple_extraction.json`](https://github.com/gustou/pegass-extractor/blob/main/exemple_extraction.json) dans Pegass Extractor pour le schéma complet.

## 📄 Licence

[MIT](LICENSE). Initialement développé pour l'Unité Locale de Clamart, Croix-Rouge française. Toute UL peut réutiliser et adapter librement cet outil.
