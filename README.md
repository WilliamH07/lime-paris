# 🚲 Lime Paris GBFS Tracker

Application web mobile-first développée avec **React 19**, **TypeScript**, **Tailwind CSS v4** et **Mapbox GL JS v3**, permettant de suivre en temps réel la disponibilité, la localisation et le niveau de batterie des vélos et trottinettes Lime à Paris via le flux public GBFS.

---

## ✨ Fonctionnalités

- 📍 **Géolocalisation précise & dynamique** : Détection de la position de l'utilisateur avec fallback élégant sur le centre de Paris (Châtelet / Hôtel de Ville) en cas de refus.
- 🗺️ **Carte Mapbox GL JS 60 FPS** :
  - Rendu vectoriel ultra fluide (style *Light v11*).
  - **Clusterisation matérielle native** avec GeoJSON : gère sans ralentissement les 6 000+ vélos parisiens.
  - Marqueur utilisateur avec pulsation radar animée.
  - Dégradé de couleurs sur les marqueurs selon la batterie (> 50% vert, 20-50% ambre, < 20% rouge).
  - Popups interactives riches avec calcul de distance et estimation de marche.
- 📱 **UX Mobile-First** :
  - *Bottom sheet* rétractable et fluide sur smartphone.
  - *Sidebar flottante* moderne façon Citymapper / Google Maps sur tablette et ordinateur.
  - Filtres instantanés par rayon (< 300 m, < 500 m, < 1 km) et par autonomie.
- ⚡ **Calculs métier précis** :
  - Distance calculée à la volée avec la formule de **Haversine**.
  - Pourcentage de batterie calculé à partir du `current_range_meters` et du `max_range_meters` de chaque modèle (`vehicle_types`).
  - Estimation réaliste du temps de marche (~75 m/min).
- 🔄 **Données en temps réel** :
  - Rafraîchissement automatique toutes les 45 secondes.
  - Compteur dynamique ("Mis à jour il y a X s").
  - Proxy de développement Vite pour éliminer les blocages CORS.

---

## 🚀 Installation & Démarrage

### 1. Prérequis
- **Node.js** >= 18.x
- **npm** >= 9.x

### 2. Cloner et installer les dépendances
```bash
cd Documents/lime
npm install
```

### 3. Configuration du token Mapbox
Un fichier `.env.local` a déjà été configuré avec votre token. Si vous souhaitez le modifier ou tester un autre token :
```env
# .env.local
VITE_MAPBOX_TOKEN=votre_token_mapbox_ici
```

> 💡 **Obtenir un token Mapbox** :
> 1. Rendez-vous sur [account.mapbox.com](https://account.mapbox.com).
> 2. Créez un compte gratuit (aucun paiement requis, quota généreux de 50 000 chargements de carte/mois).
> 3. Copiez votre clé publique `Default public token` (commençant par `pk.eyJ...`).

### 4. Lancer le serveur de développement
```bash
npm run dev
```
Ouvrez votre navigateur à l'adresse indiquée (par défaut : `http://localhost:5173`).

### 5. Compiler pour la production
```bash
npm run build
```
Les fichiers statiques optimisés seront générés dans le dossier `dist/`.

---

## 📁 Architecture du projet

```
Documents/lime/
├── .env.example              # Modèle des variables d'environnement
├── .env.local                # Jeton Mapbox (non versionné)
├── index.html                # Balises mobiles, viewport et polices
├── package.json              # Dépendances et scripts npm
├── vite.config.ts            # Proxy GBFS et plugins Vite
├── README.md                 # Guide complet
└── src/
    ├── main.tsx              # Point d'entrée React & styles Mapbox
    ├── App.tsx               # Orchestration globale et layout
    ├── index.css             # Tailwind v4, animations & glassmorphism
    ├── types/
    │   └── gbfs.ts           # Interfaces TypeScript (GBFS 2.2, Véhicules, Filtres)
    ├── utils/
    │   └── distance.ts       # Formule de Haversine & formateurs
    ├── services/
    │   └── limeApi.ts        # Client GBFS (free_bike_status, vehicle_types, cache)
    ├── hooks/
    │   ├── useGeoLocation.ts # Géolocalisation navigateur & fallback Paris
    │   └── useBikes.ts       # Enrichissement, tri par proximité & polling 45s
    └── components/
        ├── Header.tsx        # Barre supérieure, live status, actions
        ├── FilterBar.tsx     # Filtres rapides (rayon & batterie)
        ├── BikeCard.tsx      # Carte individuelle de vélo
        ├── BikeList.tsx      # Liste scrollable optimisée
        ├── BottomSheet.tsx   # Panneau mobile / sidebar desktop
        └── MapView.tsx       # Carte Mapbox GL JS, GeoJSON & clusters
```

---

## 📡 Endpoints GBFS utilisés

- **Feed Discovery** : `https://data.lime.bike/api/partners/v2/gbfs/paris/gbfs.json`
- **Vélos libres** : `https://data.lime.bike/api/partners/v2/gbfs/paris/free_bike_status`
- **Types de véhicules** : `https://data.lime.bike/api/partners/v2/gbfs/paris/vehicle_types`
