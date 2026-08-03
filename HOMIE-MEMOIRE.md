# Mémoire Homie — Commentaires + Vidéos + À la une
**Dernière mise à jour** : 2026-08-03
**Statut global** : terminé — voir CV-Projet-Commentaires-Videos-Vedette.md

## Objectif
Ajouter système de commentaires modérés sous chaque photo galerie (visiteur choisit anonyme ou pas, admin approuve/masque). Ajouter vidéos (upload fichier + lien YouTube/Vimeo). Ajouter espace "à la une" (photo/vidéo/commentaire choisi par admin, durée en heures, expiration auto, message si vide). Fixer bug presse existant + permettre article complet en plus du lien.

## Plan validé
| # | Étape | Skill | Statut | Résultat |
|---|-------|-------|--------|----------|
| 1 | Diagnostiquer bug presse | systematic-debugging | ✅ fait | Root cause: server.js ALLOWED_KEYS whitelist manquait presse/temoignages/services — save silencieusement ignoré. Corrigé + vérifié. |
| 2 | Étendre presse (lien ou article complet) + fix | standard | ✅ fait | Champ "contenu" optionnel ajouté (admin + affichage détails/résumé), testé en navigateur. |
| 3 | Backend commentaires (modèle + routes) | standard | ✅ fait | data/comments.json + 5 routes (POST public, GET public filtré visible, GET/PATCH/DELETE admin). Testé cycle complet post→pending→approve→visible. Clé photo = photoUrl (url image, unique). |
| 4 | UI galerie commentaires | standard | ✅ fait | Panneau injecté dans lightbox (js/theme-lightbox.js), formulaire anonyme/nom, testé UI→API→pending. Fonctionne sur galerie.html et project.html (lightbox partagée). |
| 5 | UI admin modération commentaires | standard | ✅ fait | Nouvel onglet "Commentaires" (badge en attente, approuver/masquer/supprimer). Testé cycle complet via UI réelle (Playwright). |
| 6 | Vidéos (upload + embed URL) | standard | ✅ fait | Nouvel onglet admin "Vidéos" (upload fichier MP4/WEBM/OGG 100Mo max, ou lien YouTube/Vimeo). Section galerie.html publique. CSP Helmet ajustée (frameSrc) pour autoriser embeds. Testé upload API + rendu public + admin UI. |
| 7 | "À la une" (choix + durée + expiration) | standard | ✅ fait | Nouvel onglet admin "À la une" (photo/vidéo/commentaire, durée en heures). Nouvelle section sur index.html. Expiration auto vérifiée côté serveur à chaque lecture (GET /api/content). Testé publier/retirer/expiration via UI réelle. |
| 8 | Test navigateur complet | run + webapp-testing | ✅ fait (fait au fil de l'eau à chaque étape) | |
| 9 | CV de projet | standard | ⬜ à faire | |

## Notes de reprise
- Stack: Node/Express, DB JSON fichier (data/db.json), admin JWT (admin.html), presse lit data.presse via js/portfolio.js renderPresse().
- Presse déjà a UI admin (add-presse-btn) mais utilisateur dit que ça marche pas — à diagnostiquer étape 1.
