# Portfolio Gregory Baudin — Photographe Documentaire

Portfolio éditorial haut de gamme avec **administration complète sécurisée** (aucun code à toucher pour gérer le site).

## 🔗 Liens

| Page | URL |
|---|---|
| 🌍 Portfolio public | `/` |
| 🔐 Administration | `/admin` |

**Mot de passe admin par défaut** : `GregoryBaudin@2026` *(à changer immédiatement dans l'onglet Système & Sécurité)*

## ✨ Fonctionnalités

### Portfolio public
- Design éditorial magazine (Cormorant Garamond + Inter, palette beige/sépia)
- Hero cinématique, timeline de parcours, galerie Masonry, lightbox, mode sombre
- Pages reportage détaillées avec fiche technique
- Formulaire de contact **fonctionnel** (les messages arrivent dans l'admin)

### Administration (zéro code)
- **Identité & Thème** : nom, titre, accroche, couleurs, mode sombre, images hero/profil
- **À Propos & Parcours** : biographie, citation, timeline réordonnable
- **Projets (CRUD)** : création/édition/suppression, fiche technique dynamique, upload multiple de photos avec légendes
- **Contacts & Réseaux** : coordonnées + réseaux sociaux
- **Messages reçus** : boîte de réception du formulaire de contact (lu/non-lu, suppression)
- **Système** : changement de mot de passe, export/import JSON, réinitialisation

## 🛡️ Sécurité (niveau production)

- **Bcrypt** (12 rounds) pour le hachage du mot de passe — jamais stocké en clair
- **JWT signé** (expiration 4h, révocation de session au changement de mot de passe)
- **Anti brute-force** : verrouillage de compte après 5 échecs (15 min) + rate limiting IP
- **Helmet** : CSP stricte, X-Frame-Options, HSTS, Referrer-Policy
- **Uploads sécurisés** : whitelist MIME (JPEG/PNG/WEBP/GIF/AVIF), 8 Mo max, noms de fichiers aléatoires
- **Validation stricte** des entrées (whitelist de clés, limites de tailles)
- **Rate limiting** sur le formulaire de contact (anti-spam)
- Aucune fuite de stack trace, `x-powered-by` désactivé

## 🚀 Déploiement sur Render (gratuit)

1. Pousser ce dépôt sur GitHub
2. Sur [render.com](https://render.com) → **New → Web Service** → connecter le repo
3. Render détecte `render.yaml` automatiquement (ou : Build `npm install`, Start `node server.js`)
4. Dans **Environment**, définir :
   - `ADMIN_PASSWORD` : mot de passe admin initial — **obligatoire** : en production, le serveur refuse de démarrer sans cette variable (plus aucun mot de passe par défaut dans le code)
   - `JWT_SECRET` : généré automatiquement via render.yaml
5. Déployer — le site est en ligne ✅

> ⚠️ Plan gratuit Render : le disque est éphémère (les uploads et modifications sont réinitialisés à chaque redéploiement). Utilisez **Export JSON** dans l'admin pour sauvegarder, puis **Import** pour restaurer. Pour une persistance totale, ajouter un disque Render (payant) ou brancher une base externe.

## 💻 Développement local

```bash
npm install
npm start
# Portfolio : http://localhost:3000
# Admin     : http://localhost:3000/admin
```

## 🧱 Stack

- **Backend** : Node.js / Express, helmet, express-rate-limit, bcryptjs, jsonwebtoken, multer
- **Frontend** : HTML/CSS/JS vanilla (aucune dépendance lourde, performance maximale)
- **Données** : JSON persisté côté serveur (écriture atomique)
