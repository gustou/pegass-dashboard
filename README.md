# Pegass Dashboard

Dashboard web pour visualiser les statistiques des bénévoles extraites depuis [Pegass](https://pegass.croix-rouge.fr) (Croix-Rouge française). SPA statique 100 % côté navigateur — aucune installation pour les utilisateurs finaux.

## Pour les utilisateurs

Trois manières d'utiliser le dashboard, du plus simple au plus avancé.

### 1. En ligne (zéro install)

→ https://gustou.github.io/pegass-dashboard/

Aucune installation, marche partout (macOS, Linux, Windows). Toutes les données restent dans votre navigateur.

### 2. Fichier HTML offline (un seul double-clic)

1. Téléchargez `pegass-dashboard-offline-vX.Y.Z.html` depuis la page [Releases](../../releases)
2. Double-cliquez le fichier — il s'ouvre dans votre navigateur
3. Glissez votre JSON Pegass dedans

Aucune connexion réseau requise. Pas d'install, pas d'avertissement de sécurité Apple/Microsoft (puisque c'est un simple fichier HTML).

### Workflow complet

1. Installez l'extension Firefox [Pegass Extractor](https://github.com/gustou/pegass-extractor) qui produit un fichier JSON depuis Pegass
2. Ouvrez ce dashboard (en ligne ou offline)
3. Glissez votre fichier JSON dans la zone d'import
4. Consultez les statistiques, exportez en Excel/CSV

## Confidentialité (RGPD)

- Toutes les données restent dans le navigateur (rien n'est envoyé sur Internet)
- Une copie est gardée dans `localStorage` pour éviter de re-uploader entre visites
- Le bouton « Nouveau fichier » vide complètement la mémoire et `localStorage`
- L'application est servie via GitHub Pages mais ne fait aucune requête vers GitHub ni ailleurs après chargement

## Deux modes de build

Une seule base de code produit deux artefacts.

| Mode | Commande | Sortie | Usage |
|------|----------|--------|-------|
| **En ligne** | `npm run build` | `dist/` | Hébergé sur GitHub Pages (déployé automatiquement par `.github/workflows/deploy.yml`) |
| **Offline** | `npm run build:offline` | `dist-offline/index.html` | Un fichier HTML unique. Double-clic = ça marche, sans connexion |

## Stack

- **Vite 8** + **Svelte 5** (runes) + **TypeScript**
- **TailwindCSS 4** (via `@tailwindcss/vite`)
- **Chart.js 4** pour les graphiques
- **ExcelJS 4** pour l'export Excel stylé (lazy-loaded)
- **Vitest** pour les tests unitaires du data pipeline
- **vite-plugin-singlefile** pour la build offline

## Développement

```bash
npm install
npm run dev       # http://localhost:5173/pegass-dashboard/
npm run check     # svelte-check (TypeScript + Svelte)
npm test          # Vitest
npm run build     # Build multi-fichiers pour GitHub Pages
npm run build:offline  # Build single-file HTML
```

## Structure

```
.
├── .github/workflows/
│   ├── ci.yml          # tests + builds sur PR
│   ├── deploy.yml      # déploiement GitHub Pages sur push main
│   └── release.yml     # release HTML offline sur tag v*
├── src/
│   ├── lib/
│   │   ├── types.ts            # types Pegass partagés
│   │   ├── process-data.ts     # déduplication, agrégats globaux, top 10
│   │   ├── derived.ts          # co-équipiers, structure/activité detail
│   │   ├── csv-export.ts       # export CSV avec filtres UL/secteur
│   │   ├── excel-export.ts     # export Excel stylé (5 onglets, ExcelJS)
│   │   ├── format.ts           # helpers de formatage (heures, mois)
│   │   ├── download.ts         # déclenchement download navigateur
│   │   └── router.svelte.ts    # routeur hash minimal
│   ├── stores/
│   │   └── data.svelte.ts      # store réactif + persistance localStorage
│   ├── components/
│   │   ├── Layout.svelte
│   │   ├── Chart.svelte
│   │   └── StatusBadge.svelte
│   ├── routes/
│   │   ├── Home.svelte         # upload drag&drop
│   │   ├── Dashboard.svelte
│   │   ├── Benevoles.svelte
│   │   ├── BenevoleDetail.svelte
│   │   ├── StructureDetail.svelte
│   │   ├── ActiviteDetail.svelte
│   │   ├── ExportBenevoles.svelte
│   │   └── NotFound.svelte
│   ├── App.svelte
│   ├── main.ts
│   └── app.css
├── tests/
│   ├── process-data.test.ts
│   ├── derived.test.ts
│   ├── csv-export.test.ts
│   └── excel-export.test.ts
├── index.html
├── vite.config.ts
├── svelte.config.js
├── tsconfig.json
└── package.json
```

## Configuration du base path

Par défaut, le build pour GitHub Pages utilise le base path `/pegass-dashboard/`. Si tu forkes et changes le nom du repo, surcharge via variable d'environnement :

```bash
VITE_BASE_PATH=/mon-repo/ npm run build
```

Ou modifie la valeur par défaut dans `vite.config.ts`.

## Format JSON attendu

Voir la doc de l'extension [Pegass Extractor](https://github.com/gustou/pegass-extractor) pour le schéma. En résumé :

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
      "missions": [{ "date": "2024-04-14", "heures": 8, "...": "..." }]
    }
  ]
}
```

## Licence

[MIT](LICENSE). Initialement développé pour l'Unité Locale de Clamart, Croix-Rouge française. Toute UL peut réutiliser et adapter librement.
