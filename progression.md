# Suivi de Progression — Refonte Éditoriale Portfolio Gregory Baudin

Ce document décrit le projet de portfolio dynamique pour **Gregory Baudin** et permet de suivre l'avancement de sa réalisation pas à pas.

---

## 📌 Description du Projet

Création d'un portfolio au style **Éditorial Magazine / Photographie Documentaire** pour Gregory Baudin.
- **Palette** : Beige chaud (`#F5F2ED`), Noir profond (`#111111`), Gris de soutien (`#7D7D7D`), et Sépia/Or ancien (`#B8860B`).
- **Typographie** : Cormorant Garamond (Serif) + Inter (Sans-serif).
- **Expérience** : Site immersif de style livre photographique, avec hero cinématique, timeline minimaliste, galerie Masonry asymétrique, et pages projets type "reportages".

---

## 🗺️ Étapes de Réalisation

Légende :
- `[ ]` En attente
- `[/]` En cours
- `[x]` Terminé

### 🗄️ Phase 1 : Données initiales et Structures (Seed)
- [x] Mettre à jour `data/content.js` avec la nouvelle charte et métadonnées.
- [x] Mettre à jour `index.html` (Google Fonts, structure asymétrique, menu transparent, switch de thèmes).
- [x] Mettre à jour `project.html` (structure style reportage).

### 🎨 Phase 2 : Design System & CSS Éditorial
- [x] Refondre `css/style.css` (Palette claire/beige, typographies, grille Masonry, transitions douces).
- [x] Ajuster `css/admin.css` (intégration esthétique avec les couleurs du site).

### ⚙️ Phase 3 : Moteur Dynamique Public & Toggle Thème
- [x] Développer `js/portfolio.js` (rendu asymétrique, timeline, switch mode clair/sombre).
- [x] Développer `js/project-detail.js` (rendu type reportage, métadonnées, lightbox et navigation).
- [x] Développer `js/animations.js` (cinématique hero scroll, fondu, micro-zooms).

### 🛠️ Phase 4 : Administration
- [x] Valider l'admin avec les nouvelles structures et formats (les formulaires et CRUD sont entièrement compatibles).

### ✨ Phase 5 : Polissage & Animations
- [x] Intégrer les micro-interactions et transitions au scroll.
- [x] Tester les cas limites (thèmes, photos de différents formats).

---

## ✅ Projet de Refonte Terminé

Le portfolio est **100% fonctionnel** et répond parfaitement à la nouvelle charte éditoriale/documentaire. Voici comment l'utiliser :

| Action | URL |
|--------|-----|
| 📂 Voir le portfolio | http://localhost:8000/index.html |
| 🛠️ Panneau admin | http://localhost:8000/admin.html |
| 🔑 Mot de passe admin | `admin` |
| 📁 Ajouter un projet | Admin → Projets (CRUD) → **Nouveau** |
