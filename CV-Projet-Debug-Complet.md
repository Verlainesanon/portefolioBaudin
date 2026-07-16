# CV de Projet — Debug complet & audit noté du portfolio

**Date** : 16 juillet 2026

## Objectif initial
Auditer le portfolio (note sur 100), lister tout ce qui est à modifier, puis corriger les bugs signalés : menu mobile qui ne défile pas, texte visible sous les onglets, site pas adapté à tous les appareils, plus un audit général code/sécurité/déploiement.

## Note d'audit : 68/100 (avant corrections)

| Domaine | Note | Constat |
|---|---|---|
| Sécurité backend | 15/20 | Bon socle (Helmet, CSP, bcrypt, JWT, rate-limit, sharp) mais mot de passe admin par défaut en dur |
| Fiabilité prod Render | 6/20 | Plan free = disque éphémère : uploads, contenu admin, mot de passe, messages perdus à chaque redeploy |
| Navigation / UX mobile | 12/20 | Menu mobile non scrollable, project.html sans navigation |
| Responsive | 14/20 | Viewport et media queries OK, mais overlay non défilable et pas de garde-fou images |
| Qualité JS/CSS | 13/20 | Code thème/lightbox dupliqué, styles inline, pas de cache-busting |
| Bonus structure | +8 | HTML propre, aucun lien cassé, écritures atomiques |

## Skills et outils utilisés
| Ordre | Skill / outil | Rôle |
|-------|---------------|------|
| 1 | Agents Explore (×2) | Audit frontend et backend avec références file:line |
| 2 | Mode plan | Plan de correction validé avant exécution |
| 3 | Edit / Write / sed | Corrections chirurgicales sur 15 fichiers |
| 4 | npm | Migration multer 1.x → 2.2.0 (0 vulnérabilité) |
| 5 | Playwright | Vérification réelle : 360/1440 px, burger, scroll, thème, console |

## Résultats par étape

### Étape 1 — Sécurité (server.js)
Mot de passe admin par défaut `GregoryBaudin@2026` supprimé du code. En production, le serveur refuse désormais de démarrer si `ADMIN_PASSWORD` n'est pas défini.

### Étape 2 — Menu mobile qui ne défilait pas (bug signalé)
Cause : `.mobile-nav-overlay` sans `overflow-y` avec 9 liens (~955 px) sur des écrans de 640 px. Corrigé (`overflow-y: auto` + `margin: auto`). Vérifié : le lien Administration est atteignable au scroll sur écran 360×640.

### Étape 3 — Texte visible sous les onglets (bug signalé)
Cause racine trouvée par mesure Playwright : en mode sombre, la règle `body.dark-theme .main-header` (plus spécifique) écrasait le fond opaque de `.main-header.scrolled` — le header restait transparent en scrollant. Fond opaque redéclaré pour le mode sombre + fallback navigateurs anciens.

### Étape 4 — Responsive
Règle globale `img { max-width: 100%; height: auto; }`, `100vw` remplacé par `100%` (loader + overlay). Vérifié : aucune page ne déborde horizontalement à 360 px ni à 1440 px.

### Étape 5 — Navigation project.html
La page reportage n'avait ni menu ni burger. Header standard complet ajouté (nav desktop + burger + overlay mobile), lien retour conservé. Vérifié : burger fonctionnel, thème mobile OK.

### Étape 6 — Qualité JS
- Module partagé `js/theme-lightbox.js` créé : thème, toast et lightbox dédupliqués entre `portfolio.js` et `project-detail.js` (~180 lignes de doublon supprimées).
- Garde ajoutée sur `contact.telephone`/`contact.email` (TypeError possible si champ vide dans l'admin).
- Styles inline JS déplacés dans `css/style.css`.
- Cache-busting `?v=2` sur CSS/JS des 10 pages (fini les versions périmées en cache).
- Numérotation des sections alignée sur l'ordre du menu (Presse 04 … Contact 07).

### Étape 7 — Dépendances & déploiement
- multer migré 1.x → 2.2.0 (branche 1.x en fin de vie), `npm audit` : 0 vulnérabilité.
- README : `ADMIN_PASSWORD` documenté comme obligatoire en production.

### Étape 8 — Vérification finale (Playwright)
Toutes les pages testées à 360 px et 1440 px : pas d'overflow horizontal, menu mobile scrollable, burger OK sur project.html, toggle thème + toast fonctionnels, contenu dynamique rendu (galerie 9 photos, 3 projets, contact), 0 erreur console.

## Fichiers produits / modifiés
- `js/theme-lightbox.js` — **nouveau** module partagé (thème, toast, lightbox)
- `server.js` — fail-fast ADMIN_PASSWORD en production
- `css/style.css` — overlay scrollable, header sombre scrollé opaque, img max-width, styles toast/légendes
- `project.html` — navigation complète ajoutée
- `js/portfolio.js`, `js/project-detail.js` — dédupliqués, gardes contact
- 10 pages `.html` — cache-busting `?v=2`, renumérotation sections
- `package.json` / `package-lock.json` — multer 2.2.0
- `README.md` — ADMIN_PASSWORD obligatoire

## Points restants (non corrigés volontairement)
- **Persistance Render (critique)** : sur le plan gratuit, images uploadées, contenu admin, messages et mot de passe sont perdus à chaque redeploy/redémarrage. Solutions : disque persistant Render (payant) ou stockage externe (Cloudinary/S3 + base). En attendant : Export JSON régulier depuis l'admin.
- Écritures JSON concurrentes non verrouillées (risque faible, atténué par le rate-limiting).
- `data/content.js` inutilisé côté serveur (non supprimé sans accord).

## Prochaines étapes recommandées
1. Définir `ADMIN_PASSWORD` sur Render avant le prochain deploy (sinon le serveur refusera de démarrer — voulu).
2. Décider de la solution de persistance (disque Render ou Cloudinary).
3. Commit + push des corrections, puis redeploy.
4. Note projetée après corrections : ~82/100 (le point persistance bloque le reste).
