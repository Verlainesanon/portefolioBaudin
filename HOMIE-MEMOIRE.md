# Mémoire Homie — Fix vidéo + commentaires vidéo + presse
**Dernière mise à jour** : 2026-08-07
**Statut global** : terminé — voir CV-Projet-Fix-Video-Commentaires.md

## Objectif
Corriger 3 bugs signalés dans l'admin : (1) upload vidéo qui n'arrive pas en ligne, (2) commentaires manquants sous les vidéos (déjà présents sous les photos) + choix de visibilité admin format IG, (3) section article presse qui ne fonctionne pas.

## Plan validé
| # | Étape | Skill | Statut | Résultat |
|---|-------|-------|--------|----------|
| 1 | Diagnostic live (API + navigateur Playwright) | webapp-testing | ✅ fait | Vidéo/presse marchent techniquement en local ; vrai bug vidéo = bouton "Enregistrer" séparé hors écran, facile à oublier. Commentaires: système complet existe pour photos, absent pour vidéos. |
| 2 | Vidéo : auto-save après upload | standard | ✅ fait | saveContent() appelé automatiquement après upload fichier ou ajout lien, plus de bouton à ne pas oublier. |
| 3 | Commentaires sous vidéos | standard | ✅ fait | Panneau réutilisé (loadCommentsPanel généralisé avec targetPanel), branché sous chaque vidéo publique, CSS adapté (fond clair). |
| 4 | Presse : diagnostic | standard | ✅ fait (aucun bug trouvé) | Testé en direct API + navigateur : sauvegarde et affichage de l'article complet fonctionnent. Pas de code touché. |
| 5 | Test navigateur + commit + push | webapp-testing | ✅ fait | Cycle complet testé (upload sans clic manuel, commentaire posté sous vidéo visible), data de test nettoyée, commit 52ac176 poussé sur main → redeploy Render auto. |

## Notes de reprise
- Stack: Node/Express, DB JSON fichier (data/db.json), admin JWT (/gestion en local, ADMIN_PATH en prod), hébergé sur Render (plan gratuit — render.yaml).
- Commentaires: data/comments.json, clé = photoUrl (générique, marche aussi pour url vidéo). Panneau UI dans js/theme-lightbox.js (photos only, pas branché sur js/portfolio.js renderVideos()).
- Vidéos admin: js/admin.js setupVideosTab() ~ligne 1181, bouton save id="save-videos-btn" (admin.html ligne 490).
- Presse: champ "contenu" optionnel, admin.js VITRINE_LISTS ligne ~552, affichage js/portfolio.js renderPresse() ligne ~399 (details/summary repliable).

## Projets précédents
- Commentaires + Vidéos + À la une — 2026-08-03 — terminé — voir CV-Projet-Commentaires-Videos-Vedette.md
