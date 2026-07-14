/* ============================================================
   PORTFOLIO GREGORY BAUDIN — SERVEUR SÉCURISÉ (Express)
   Sécurité : Helmet (CSP), JWT httpOnly-style, bcrypt,
   rate-limiting, verrouillage de compte, validation stricte.
   ============================================================ */

const express = require("express");
const helmet = require("helmet");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const sharp = require("sharp");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

/* ---------- Secrets & chemins ---------- */
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(48).toString("hex");
const DATA_DIR = path.join(__dirname, "data");
const DB_FILE = path.join(DATA_DIR, "db.json");
const AUTH_FILE = path.join(DATA_DIR, "auth.json");
const UPLOAD_DIR = path.join(__dirname, "uploads");
const SEED_FILE = path.join(DATA_DIR, "seed.json");

if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

/* ---------- Base de données (fichier JSON atomique) ---------- */
function readJSON(file, fallback) {
    try {
        return JSON.parse(fs.readFileSync(file, "utf8"));
    } catch {
        return fallback;
    }
}
function writeJSON(file, data) {
    const tmp = file + ".tmp";
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2), "utf8");
    fs.renameSync(tmp, file);
}

/* Seed initial de la base de contenu (+ rétro-remplissage des nouvelles clés) */
function initDB() {
    const seed = readJSON(SEED_FILE, null);
    if (!fs.existsSync(DB_FILE)) {
        writeJSON(DB_FILE, seed || {});
        console.log("[DB] Base de contenu initialisée depuis le seed.");
        return;
    }
    // Si le seed contient de nouvelles clés (ex: seo, settings), les ajouter sans écraser
    if (seed) {
        const db = readJSON(DB_FILE, {});
        let changed = false;
        for (const key of Object.keys(seed)) {
            if (!(key in db)) { db[key] = seed[key]; changed = true; }
        }
        if (changed) {
            writeJSON(DB_FILE, db);
            console.log("[DB] Nouvelles clés du seed ajoutées à la base existante.");
        }
    }
}

/* Seed initial de l'authentification */
function initAuth() {
    if (!fs.existsSync(AUTH_FILE)) {
        const defaultPassword = process.env.ADMIN_PASSWORD || "GregoryBaudin@2026";
        const hash = bcrypt.hashSync(defaultPassword, 12);
        writeJSON(AUTH_FILE, {
            passwordHash: hash,
            failedAttempts: 0,
            lockedUntil: 0,
            tokenVersion: 1
        });
        console.log("[AUTH] Compte admin initialisé.");
    }
}
initDB();
initAuth();

/* ---------- Middlewares de sécurité ---------- */
app.disable("x-powered-by");
app.set("trust proxy", 1);

app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
            imgSrc: ["'self'", "data:", "blob:"],
            connectSrc: ["'self'"],
            objectSrc: ["'none'"],
            frameAncestors: ["'none'"],
            baseUri: ["'self'"],
            formAction: ["'self'"]
        }
    },
    crossOriginEmbedderPolicy: false,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" }
}));
app.use(compression());
app.use(express.json({ limit: "25mb" }));

/* Rate limiting global API */
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 400,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Trop de requêtes. Réessayez plus tard." }
});
app.use("/api/", apiLimiter);

/* Rate limiting strict sur le login (anti brute-force) */
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Trop de tentatives de connexion. Patientez 15 minutes." }
});

/* ---------- Authentification JWT ---------- */
function signToken() {
    const auth = readJSON(AUTH_FILE, {});
    return jwt.sign(
        { role: "admin", v: auth.tokenVersion || 1 },
        JWT_SECRET,
        { expiresIn: "4h", issuer: "gb-portfolio" }
    );
}

function requireAuth(req, res, next) {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: "Authentification requise." });
    try {
        const payload = jwt.verify(token, JWT_SECRET, { issuer: "gb-portfolio" });
        const auth = readJSON(AUTH_FILE, {});
        if (payload.v !== (auth.tokenVersion || 1)) {
            return res.status(401).json({ error: "Session expirée. Reconnectez-vous." });
        }
        req.admin = payload;
        next();
    } catch {
        return res.status(401).json({ error: "Session invalide ou expirée." });
    }
}

/* ---------- ROUTES AUTH ---------- */
const MAX_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

app.post("/api/auth/login", loginLimiter, (req, res) => {
    const { password } = req.body || {};
    if (typeof password !== "string" || password.length < 1 || password.length > 200) {
        return res.status(400).json({ error: "Mot de passe requis." });
    }

    const auth = readJSON(AUTH_FILE, {});
    const now = Date.now();

    if (auth.lockedUntil && now < auth.lockedUntil) {
        const mins = Math.ceil((auth.lockedUntil - now) / 60000);
        return res.status(423).json({ error: `Compte verrouillé. Réessayez dans ${mins} min.` });
    }

    const ok = bcrypt.compareSync(password, auth.passwordHash || "");
    if (!ok) {
        auth.failedAttempts = (auth.failedAttempts || 0) + 1;
        if (auth.failedAttempts >= MAX_ATTEMPTS) {
            auth.lockedUntil = now + LOCK_MINUTES * 60000;
            auth.failedAttempts = 0;
            writeJSON(AUTH_FILE, auth);
            return res.status(423).json({ error: `Trop d'échecs. Compte verrouillé ${LOCK_MINUTES} min.` });
        }
        writeJSON(AUTH_FILE, auth);
        const remaining = MAX_ATTEMPTS - auth.failedAttempts;
        return res.status(401).json({ error: `Mot de passe incorrect. ${remaining} tentative(s) restante(s).` });
    }

    auth.failedAttempts = 0;
    auth.lockedUntil = 0;
    writeJSON(AUTH_FILE, auth);
    res.json({ token: signToken(), expiresIn: 4 * 3600 });
});

app.post("/api/auth/change-password", requireAuth, (req, res) => {
    const { currentPassword, newPassword } = req.body || {};
    if (typeof currentPassword !== "string" || typeof newPassword !== "string") {
        return res.status(400).json({ error: "Champs requis manquants." });
    }
    if (newPassword.length < 8) {
        return res.status(400).json({ error: "Le nouveau mot de passe doit contenir au moins 8 caractères." });
    }
    if (!/[A-Za-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
        return res.status(400).json({ error: "Le mot de passe doit contenir des lettres et des chiffres." });
    }

    const auth = readJSON(AUTH_FILE, {});
    if (!bcrypt.compareSync(currentPassword, auth.passwordHash || "")) {
        return res.status(401).json({ error: "Mot de passe actuel incorrect." });
    }

    auth.passwordHash = bcrypt.hashSync(newPassword, 12);
    auth.tokenVersion = (auth.tokenVersion || 1) + 1; // invalide toutes les sessions
    writeJSON(AUTH_FILE, auth);
    res.json({ success: true, token: signToken(), message: "Mot de passe modifié. Sessions précédentes révoquées." });
});

app.get("/api/auth/verify", requireAuth, (req, res) => {
    res.json({ valid: true });
});

/* ---------- ROUTES CONTENU ---------- */
/* Lecture publique (le portfolio se charge depuis l'API) */
app.get("/api/content", (req, res) => {
    const data = readJSON(DB_FILE, {});
    res.set("Cache-Control", "no-store");
    res.json(data);
});

/* Structure autorisée (whitelist anti-injection de clés) */
const ALLOWED_KEYS = ["theme", "identity", "apropos", "experiences", "projets", "contact", "seo", "settings"];

function sanitizeContent(input) {
    if (typeof input !== "object" || input === null || Array.isArray(input)) return null;
    const out = {};
    for (const key of ALLOWED_KEYS) {
        if (key in input) out[key] = input[key];
    }
    // Validations minimales de structure
    if (out.experiences && !Array.isArray(out.experiences)) return null;
    if (out.projets && !Array.isArray(out.projets)) return null;
    return out;
}

/* Mise à jour complète (admin) */
app.put("/api/content", requireAuth, (req, res) => {
    const clean = sanitizeContent(req.body);
    if (!clean) return res.status(400).json({ error: "Structure de données invalide." });
    const current = readJSON(DB_FILE, {});
    const merged = { ...current, ...clean, updatedAt: new Date().toISOString() };
    writeJSON(DB_FILE, merged);
    res.json({ success: true, updatedAt: merged.updatedAt });
});

/* Réinitialisation aux données d'origine (admin) */
app.post("/api/content/reset", requireAuth, (req, res) => {
    const seed = readJSON(SEED_FILE, null);
    if (!seed) return res.status(500).json({ error: "Seed introuvable." });
    writeJSON(DB_FILE, seed);
    res.json({ success: true, data: seed });
});

/* ---------- UPLOAD D'IMAGES SÉCURISÉ ---------- */
const ALLOWED_MIME = { "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp", "image/gif": ".gif", "image/avif": ".avif" };
const MAX_DIMENSION = 2000;

const storage = multer.memoryStorage();

const upload = multer({
    storage,
    limits: { fileSize: 8 * 1024 * 1024, files: 12 },
    fileFilter: (req, file, cb) => {
        if (ALLOWED_MIME[file.mimetype]) cb(null, true);
        else cb(new Error("Type de fichier non autorisé (JPEG, PNG, WEBP, GIF, AVIF uniquement)."));
    }
});

/* Recompresse/redimensionne une image côté serveur (garantit une taille finale raisonnable) */
async function reencodeImage(buffer, mimetype) {
    if (mimetype === "image/gif") return { buffer, mimetype }; // évite de casser l'animation
    let pipeline = sharp(buffer)
        .rotate() // corrige l'orientation EXIF
        .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: "inside", withoutEnlargement: true });

    switch (mimetype) {
        case "image/png": pipeline = pipeline.png({ compressionLevel: 9 }); break;
        case "image/webp": pipeline = pipeline.webp({ quality: 82 }); break;
        case "image/avif": pipeline = pipeline.avif({ quality: 60 }); break;
        default: pipeline = pipeline.jpeg({ quality: 82, mozjpeg: true }); mimetype = "image/jpeg";
    }
    return { buffer: await pipeline.toBuffer(), mimetype };
}

app.post("/api/upload", requireAuth, (req, res) => {
    upload.array("images", 12)(req, res, async (err) => {
        if (err) return res.status(400).json({ error: err.message });
        try {
            const files = [];
            for (const f of (req.files || [])) {
                const { buffer, mimetype } = await reencodeImage(f.buffer, f.mimetype);
                const ext = ALLOWED_MIME[mimetype] || ".bin";
                const filename = `img_${Date.now()}_${crypto.randomBytes(6).toString("hex")}${ext}`;
                fs.writeFileSync(path.join(UPLOAD_DIR, filename), buffer);
                files.push({ url: `/uploads/${filename}`, size: buffer.length, name: f.originalname });
            }
            res.json({ success: true, files });
        } catch (e) {
            console.error("[UPLOAD]", e.message);
            res.status(500).json({ error: "Erreur lors du traitement des images." });
        }
    });
});

/* ---------- FORMULAIRE DE CONTACT (stocke les messages) ---------- */
const MESSAGES_FILE = path.join(DATA_DIR, "messages.json");
const contactLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 8, message: { error: "Trop de messages envoyés. Réessayez plus tard." } });

app.post("/api/contact", contactLimiter, (req, res) => {
    const { name, email, message } = req.body || {};
    if (typeof name !== "string" || typeof email !== "string" || typeof message !== "string") {
        return res.status(400).json({ error: "Champs manquants." });
    }
    if (name.length > 120 || email.length > 200 || message.length > 4000 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
        return res.status(400).json({ error: "Données invalides." });
    }
    const messages = readJSON(MESSAGES_FILE, []);
    messages.unshift({
        id: crypto.randomUUID(),
        name: name.trim().slice(0, 120),
        email: email.trim().slice(0, 200),
        message: message.trim().slice(0, 4000),
        read: false,
        date: new Date().toISOString()
    });
    writeJSON(MESSAGES_FILE, messages.slice(0, 500));
    res.json({ success: true });
});

app.get("/api/messages", requireAuth, (req, res) => {
    res.json(readJSON(MESSAGES_FILE, []));
});

app.patch("/api/messages/:id/read", requireAuth, (req, res) => {
    const messages = readJSON(MESSAGES_FILE, []);
    const msg = messages.find(m => m.id === req.params.id);
    if (!msg) return res.status(404).json({ error: "Message introuvable." });
    msg.read = true;
    writeJSON(MESSAGES_FILE, messages);
    res.json({ success: true });
});

app.delete("/api/messages/:id", requireAuth, (req, res) => {
    let messages = readJSON(MESSAGES_FILE, []);
    messages = messages.filter(m => m.id !== req.params.id);
    writeJSON(MESSAGES_FILE, messages);
    res.json({ success: true });
});

/* ---------- MÉDIATHÈQUE ---------- */
app.get("/api/media", requireAuth, (req, res) => {
    try {
        const files = fs.readdirSync(UPLOAD_DIR)
            .filter(f => /\.(jpe?g|png|webp|gif|avif)$/i.test(f))
            .map(f => {
                const stat = fs.statSync(path.join(UPLOAD_DIR, f));
                return { url: `/uploads/${f}`, name: f, size: stat.size, date: stat.mtime.toISOString() };
            })
            .sort((a, b) => b.date.localeCompare(a.date));
        res.json(files);
    } catch {
        res.json([]);
    }
});

app.delete("/api/media/:name", requireAuth, (req, res) => {
    const name = path.basename(req.params.name); // anti path-traversal
    if (!/^img_[a-z0-9_]+\.(jpe?g|png|webp|gif|avif)$/i.test(name)) {
        return res.status(400).json({ error: "Nom de fichier invalide." });
    }
    const filePath = path.join(UPLOAD_DIR, name);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: "Fichier introuvable." });
    fs.unlinkSync(filePath);
    res.json({ success: true });
});

/* ---------- STATISTIQUES DE VISITES ---------- */
const STATS_FILE = path.join(DATA_DIR, "stats.json");
const statsLimiter = rateLimit({ windowMs: 60 * 1000, max: 30 });

app.post("/api/stats/hit", statsLimiter, (req, res) => {
    const { page } = req.body || {};
    const validPages = ["home", "project"];
    const p = validPages.includes(page) ? page : "other";
    const stats = readJSON(STATS_FILE, { total: 0, pages: {}, daily: {} });
    const day = new Date().toISOString().slice(0, 10);
    stats.total = (stats.total || 0) + 1;
    stats.pages[p] = (stats.pages[p] || 0) + 1;
    stats.daily[day] = (stats.daily[day] || 0) + 1;
    // Conserver 60 jours max
    const days = Object.keys(stats.daily).sort();
    while (days.length > 60) delete stats.daily[days.shift()];
    writeJSON(STATS_FILE, stats);
    res.json({ ok: true });
});

app.get("/api/stats", requireAuth, (req, res) => {
    const stats = readJSON(STATS_FILE, { total: 0, pages: {}, daily: {} });
    const db = readJSON(DB_FILE, {});
    const messages = readJSON(MESSAGES_FILE, []);
    let imageCount = 0;
    (db.projets || []).forEach(p => { imageCount += (p.images || []).length; });
    res.json({
        visits: stats,
        counts: {
            projets: (db.projets || []).length,
            images: imageCount,
            experiences: (db.experiences || []).length,
            messages: messages.length,
            unread: messages.filter(m => !m.read).length
        },
        updatedAt: db.updatedAt || null
    });
});

/* ---------- FICHIERS STATIQUES ---------- */
app.use("/uploads", express.static(UPLOAD_DIR, { maxAge: "7d", immutable: true }));
app.use(express.static(__dirname, {
    extensions: ["html"],
    setHeaders: (res, filePath) => {
        if (filePath.endsWith(".html") || filePath.endsWith(".js") || filePath.endsWith(".css")) {
            res.set("Cache-Control", "no-cache");
        } else {
            res.set("Cache-Control", "public, max-age=86400");
        }
    }
}));

/* Route explicite admin */
app.get("/admin", (req, res) => res.sendFile(path.join(__dirname, "admin.html")));

/* Santé (pour Render) */
app.get("/healthz", (req, res) => res.json({ status: "ok" }));

/* 404 API */
app.use("/api", (req, res) => res.status(404).json({ error: "Endpoint introuvable." }));

/* Gestion d'erreurs globale (aucune fuite de stack) */
app.use((err, req, res, next) => {
    console.error("[ERROR]", err.message);
    res.status(500).json({ error: "Erreur interne du serveur." });
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(`✅ Portfolio Gregory Baudin — serveur sécurisé sur le port ${PORT}`);
});
