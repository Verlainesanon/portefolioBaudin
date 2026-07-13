# Portfolio Gregory Baudin — Site Ultra-Personnalisable avec Admin

## Contexte & Objectif

Le PDF analysé est le portfolio de **Gregory Baudin**, photographe documentaire haïtien. Il contient **15 pages** couvrant : présentation, à-propos, expériences, 3 projets photo, galeries, et contact.

L'objectif est de créer un **site web portfolio professionnel + un panneau admin** permettant de modifier **absolument tout** via une interface graphique : textes, photos, couleurs, sections, projets, coordonnées — sans toucher au code.

---

## Structure du PDF analysé (15 pages)

| Page | Section | Contenu clé |
|------|---------|-------------|
| 1 | **Hero / Couverture** | Nom, titre "Photographe documentaire", accroche |
| 2 | **Sommaire** | Navigation : À propos, Expériences, Projets, Photos, Contact |
| 3 | **À Propos — Histoire** | Texte biographie, quote "Du regard à l'image" |
| 4 | **À Propos — Parcours/Expériences** | Stages (Fondation Digicel, UEH, Sol et Sén...), Perspectives d'avenir |
| 5 | **À Propos — Approche** | Citation forte : "Captivé par l'authenticité du quotidien" |
| 6 | **Projet 01** | Série rue — Port-au-Prince, fiches technique (Type, Post-prod, Matériel) |
| 7-8 | **Photos — Rue** | Port-au-Prince / Cayes |
| 9 | **Projet 02** | Série Patrimoine — Petit-Goâve/Camp-Perrin |
| 10-11 | **Photos — Patrimoine & Touristique** | Petit-Goâve, Camp-Perrin |
| 12 | **Projet 03** | Série Bord de mer — Cayes (mode de vie / vulnérabilité) |
| 13-14 | **Photos — Bord de mer** | Cayes |
| 15 | **Contact** | Tel: +509 4716-4541, Email, Adresse Pétion-ville, "Travaillons ensemble" |

---

## Architecture Technique

### Stack choisi
- **Frontend** : HTML5 + CSS3 Vanilla (glassmorphism, animations GSAP)
- **Backend/Admin** : JavaScript + LocalStorage (pas de serveur requis — 100% local)
- **Stockage images** : Upload local → Base64 ou URL relative
- **Pas de framework** : Simplicité, zéro dépendance serveur

### Structure des fichiers

```
portfolio-baudin/
├── index.html              ← Site public (portfolio)
├── admin.html              ← Panneau admin protégé
├── css/
│   ├── style.css           ← Styles du portfolio
│   └── admin.css           ← Styles du panneau admin
├── js/
│   ├── portfolio.js        ← Logique du site (lit localStorage)
│   ├── admin.js            ← Logique admin (écrit dans localStorage)
│   └── animations.js       ← Animations GSAP/CSS
├── assets/
│   ├── images/             ← Photos uploadées via admin
│   └── icons/              ← Icônes SVG
└── data/
    └── content.js          ← Données initiales (seed depuis le PDF)
```

---

## Pages du Portfolio (Site Public)

### 1. Page Hero (Accueil)
- Photo de fond plein écran (remplaçable admin)
- Nom : **GREGORY BAUDIN** (éditable)
- Titre : **Photographe documentaire** (éditable)
- Accroche courte (éditable)
- Bouton CTA → section Projets

### 2. Page À Propos
- **Bloc Histoire** : texte biographie long (éditeur WYSIWYG admin)
- **Bloc Parcours** : timeline expériences (ajouter/modifier/supprimer items)
- **Bloc Approche** : grande citation (éditable)
- Photo portrait (uploadable admin)

### 3. Page Projets
- Cards dynamiques — **nombre illimité** de projets
- Chaque projet : titre, description, fiche technique (type, post-prod, matériel, direction artistique)
- Galerie d'images par projet (upload multiple)
- Ordre drag-and-drop dans admin

### 4. Page Galerie Globale
- Toutes les photos par catégorie (tags gérés en admin)
- Lightbox en clic
- Filtres par projet/tag

### 5. Page Contact
- Titre "Travaillons ensemble" (éditable)
- Texte pitch "Pourquoi me choisir" (éditable)
- Coordonnées : téléphone, email, adresse (tous éditables)
- Réseaux sociaux (ajoutables)
- Formulaire de contact (optionnel)

---

## Panneau Admin — Fonctionnalités complètes

> [!IMPORTANT]
> L'admin est accessible via `/admin.html` et protégé par mot de passe simple (localStorage hash). Toutes les modifications sont **instantanément répercutées** sur le site public.

### Dashboard Admin — Sections éditables

#### 🎨 Identité Visuelle
- Couleurs primaire / secondaire / accent (color picker)
- Police de titre / corps (sélecteur Google Fonts)
- Mode sombre / clair toggle
- Logo/favicon upload

#### 👤 Hero & Profil
- Photo de couverture hero (upload + recadrage)
- Nom complet
- Titre professionnel
- Texte accroche
- Photo portrait

#### 📖 À Propos
- Éditeur de texte riche (histoire)
- Timeline expériences : ajouter / modifier / supprimer / réordonner
  - Chaque entrée : titre, période, description, icône
- Grande citation centrale
- Photo de section

#### 📁 Projets (CRUD complet)
- **Créer** nouveau projet : titre, numéro, description
- **Fiche technique** : champs libres (label + valeur)
- **Galerie projet** : upload multiple photos, légendes, ordre drag
- **Modifier** n'importe quel champ
- **Supprimer** / Archiver
- **Réordonner** les projets

#### 🖼️ Photos & Galeries
- Upload groupé d'images
- Assigner à un projet / créer nouvelles catégories
- Modifier légendes, titres, tags
- Supprimer photos
- Ordre de tri (drag & drop)

#### 📞 Contact
- Tous les champs coordonnées
- Texte pitch personnalisé
- Ajouter/supprimer réseaux sociaux (avec icône)
- Activer/désactiver formulaire contact

#### ⚙️ Paramètres généraux
- Titre du site (SEO)
- Meta description
- Mot de passe admin (changeable)
- Export/Import des données (JSON backup)
- Reset aux valeurs par défaut

---

## Données initiales (pré-remplies depuis le PDF)

```json
{
  "identity": {
    "nom": "Gregory Baudin",
    "titre": "Photographe documentaire",
    "accroche": "Je capture des instants bruts, des visages et des paysages qui questionnent l'existence et la condition humaine.",
    "email": "baudingregory003@gmail.com",
    "telephone": "+509 4716-4541",
    "adresse": "#1, Du plan, HT 6140 Pétion-ville, Haiti"
  },
  "apropos": {
    "histoire": "Passionné par l'image depuis l'école classique...",
    "citation": "Captivé par l'authenticité du quotidien à travers le mouvement, je saisis tous ses instants bruts et spontanés.",
    "approche": "Je développe une approche de la photographie centrée sur l'authenticité..."
  },
  "experiences": [
    { "titre": "Premières expériences", "desc": "Découverte de la photographie à l'école classique, apprentissage autodidacte des bases techniques et créatives" },
    { "titre": "Développement", "desc": "Formation Centre d'Art + Master class Frederick ALEXIS (portrait)" },
    { "titre": "Terrain", "desc": "Fondation Digicel, ENS UEH, Aux Cayes Marathon, compagnie Sol et Sén, etc." },
    { "titre": "Atelier", "desc": "Premier atelier photographie — octobre 2025, Petit-Goâve" },
    { "titre": "Perspectives", "desc": "Doctorat photo/littérature, publications, résidences et ateliers dans milieux reculés" }
  ],
  "projets": [
    {
      "id": 1,
      "titre": "Projet N°01",
      "sousTitre": "Graphique",
      "description": "Série de photos capturant l'énergie brute des marchants dans les rues...",
      "fichetech": {
        "Type": "Photographie rue / exploration quotidienne",
        "Post-production": "Retouches légères, filtre vintage",
        "Direction Artistique": "Spontané, brut, naturel",
        "Matériel": "Appareil Photo + Objectif fixe 10-18mm / Google Pixel 7"
      },
      "lieu": "Port-au-Prince / Cayes"
    },
    {
      "id": 2,
      "titre": "Projet N°02",
      "sousTitre": "Graphique",
      "description": "Série de photos capturant monuments et lieux d'une valeur inestimable...",
      "fichetech": {
        "Type": "Photographie touristique / exploration",
        "Post-production": "Retouches légères, filtre vintage, saturation",
        "Direction Artistique": "Spontané, brut, naturel",
        "Matériel": "Appareil Photo + Objectif fixe 10-18mm / Google Pixel 7"
      },
      "lieu": "Petit-Goâve / Camp-Perrin"
    },
    {
      "id": 3,
      "titre": "Projet N°03",
      "sousTitre": "Graphique",
      "description": "Série de photos montrant le mode de vie des gens de bord de mer des Cayes...",
      "fichetech": {
        "Type": "Photographie documentaire",
        "Post-production": "Retouches légères, filtre vintage, saturation",
        "Direction Artistique": "Spontané, brut, naturel",
        "Matériel": "Appareil Photo + Objectif fixe 10-18mm / Google Pixel 7"
      },
      "lieu": "Cayes"
    }
  ]
}
```

---

## Design & Esthétique

- **Palette** : Noir profond `#0a0a0a` + Blanc cassé `#f5f0e8` + Or `#c9a84c`
- **Style** : Éditorial photographique — minimaliste, typographie forte, espaces
- **Animations** : Fade-in au scroll, parallax hero, hover sur photos (zoom léger)
- **Police** : `Playfair Display` (titres) + `Inter` (corps)
- **Galeries** : Grid masonry responsive, lightbox plein écran

---

## Plan d'Exécution

### Phase 1 — Fondations (Données + Structure)
- [ ] Créer `data/content.js` avec toutes les données du PDF
- [ ] Structure HTML `index.html` et `admin.html`

### Phase 2 — CSS Design System
- [ ] `css/style.css` — variables, typographie, layout
- [ ] `css/admin.css` — interface admin dark theme

### Phase 3 — Portfolio Public
- [ ] Section Hero animée
- [ ] Section À Propos avec timeline
- [ ] Section Projets + Galeries
- [ ] Section Contact
- [ ] Navigation smooth-scroll

### Phase 4 — Panneau Admin
- [ ] Login simple (mot de passe)
- [ ] Dashboard avec navigation sections
- [ ] Formulaires édition : Identité, À propos, Expériences
- [ ] CRUD Projets complet
- [ ] Upload et gestion photos
- [ ] Paramètres + Export/Import

### Phase 5 — Synchronisation
- [ ] `portfolio.js` → lit localStorage et met à jour le DOM
- [ ] `admin.js` → écrit dans localStorage + preview temps réel
- [ ] Animations et polish final

---

## Questions Ouvertes

> [!NOTE]
> Ces points peuvent être définis maintenant ou ajustés après approbation :

1. **Hébergement** : Le site sera-t-il hébergé localement ou en ligne (GitHub Pages, Netlify) ? Cela impacte la stratégie de stockage des images.
2. **Mot de passe admin** : Mot de passe initial souhaité ?
3. **Images** : Le PDF contient des photos — veux-tu que j'extraie les images du PDF pour les intégrer directement dans le site ?
4. **Langue** : Site uniquement en français ou bilingue (FR/EN) ?
5. **Formulaire contact** : Simple affichage email/tel, ou vrai formulaire qui envoie un message ?
