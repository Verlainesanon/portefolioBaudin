/* ==================================================================
   ADMINISTRATION GREGORY BAUDIN — CONNECTÉE À L'API SÉCURISÉE
   Auth JWT • Uploads serveur • Messagerie • Sauvegarde distante
   ================================================================== */

let currentData = {};
let selectedProjectId = null;

/* ---------- Gestion du token JWT (sessionStorage) ---------- */
const TOKEN_KEY = "gb_admin_token";
function getToken() { return sessionStorage.getItem(TOKEN_KEY); }
function setToken(t) { sessionStorage.setItem(TOKEN_KEY, t); }
function clearToken() { sessionStorage.removeItem(TOKEN_KEY); }

/* ---------- Client API ---------- */
async function api(path, options = {}) {
    const headers = { ...(options.headers || {}) };
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
    if (options.body && !(options.body instanceof FormData)) {
        headers["Content-Type"] = "application/json";
        options.body = JSON.stringify(options.body);
    }
    const res = await fetch(path, { ...options, headers });
    if (res.status === 401) {
        clearToken();
        showLoginScreen();
        throw new Error("Session expirée. Veuillez vous reconnecter.");
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Erreur serveur (${res.status})`);
    return data;
}

/* Sauvegarde le contenu complet sur le serveur */
async function saveContent() {
    setSaveStatus("saving");
    try {
        await api("/api/content", { method: "PUT", body: currentData });
        setSaveStatus("saved");
    } catch (err) {
        setSaveStatus("error");
        throw err;
    }
}

/* Indicateur d'état de synchronisation dans l'en-tête */
function setSaveStatus(state) {
    const el = document.getElementById("save-status");
    if (!el) return;
    if (state === "saving") {
        el.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Enregistrement...`;
        el.className = "save-status saving";
    } else if (state === "saved") {
        el.innerHTML = `<i class="fa-solid fa-circle-check"></i> Synchronisé`;
        el.className = "save-status";
    } else {
        el.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> Erreur de sauvegarde`;
        el.className = "save-status error";
    }
}

document.addEventListener("DOMContentLoaded", () => {
    checkSession();
    setupLogin();
    setupTabs();
    setupDashboard();
    setupIdentityForm();
    setupThemePresets();
    setupAboutForm();
    setupProjectsCRUD();
    setupVitrineForm();
    setupMediaLibrary();
    setupVideosTab();
    setupVedetteTab();
    setupContactForm();
    setupMessagesTab();
    setupCommentsTab();
    setupSeoForm();
    setupSystemTools();
});

/* ==================================================
   1. SÉCURITÉ ET ACCÈS (LOGIN / DÉCONNEXION)
   ================================================== */
function showLoginScreen() {
    document.getElementById("admin-login-screen").style.display = "flex";
    document.getElementById("admin-dashboard").style.display = "none";
}
function showDashboard() {
    document.getElementById("admin-login-screen").style.display = "none";
    document.getElementById("admin-dashboard").style.display = "flex";
}

async function checkSession() {
    if (!getToken()) { showLoginScreen(); return; }
    try {
        await api("/api/auth/verify");
        showDashboard();
        await loadContentAndInit();
    } catch {
        showLoginScreen();
    }
}

async function loadContentAndInit() {
    currentData = await api("/api/content");
    if (!currentData.settings) currentData.settings = { sections: { apropos: true, projets: true, galerie: true, contact: true }, galerieIntro: "", footerText: "", showAdminLink: true };
    if (!currentData.seo) currentData.seo = { metaTitle: "", metaDescription: "", keywords: "" };
    initDashboardData();
    refreshMessages();
    refreshComments();
    refreshStats();
}

function setupLogin() {
    const form = document.getElementById("login-form");
    const errorMsg = document.getElementById("login-error-msg");

    if (form) {
        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            const btn = form.querySelector("button[type=submit]");
            btn.disabled = true;
            try {
                const password = document.getElementById("admin-password").value;
                const result = await api("/api/auth/login", { method: "POST", body: { password } });
                setToken(result.token);
                errorMsg.style.display = "none";
                document.getElementById("admin-password").value = "";
                showDashboard();
                await loadContentAndInit();
                showToast("Connexion réussie !");
            } catch (err) {
                errorMsg.textContent = err.message;
                errorMsg.style.display = "block";
            } finally {
                btn.disabled = false;
            }
        });
    }

    const logoutBtn = document.getElementById("admin-logout-btn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            clearToken();
            showLoginScreen();
            showToast("Déconnexion effectuée");
        });
    }
}

/* ==================================================
   2. ONGLETS ET AFFICHAGE
   ================================================== */
function setupTabs() {
    const tabs = document.querySelectorAll(".nav-tab");
    const panels = document.querySelectorAll(".tab-panel");
    const titleEl = document.getElementById("tab-title");

    tabs.forEach(tab => {
        tab.addEventListener("click", () => {
            tabs.forEach(t => t.classList.remove("active"));
            panels.forEach(p => p.classList.remove("active"));
            tab.classList.add("active");
            document.getElementById(tab.getAttribute("data-target")).classList.add("active");
            titleEl.textContent = tab.textContent.trim();
            const target = tab.getAttribute("data-target");
            if (target === "tab-messages") refreshMessages();
            if (target === "tab-comments") refreshComments();
            if (target === "tab-dashboard") refreshStats();
            if (target === "tab-media") refreshMediaLibrary();
        });
    });
}

/* Navigation programmatique vers un onglet */
function gotoTab(targetId) {
    const tab = document.querySelector(`.nav-tab[data-target="${targetId}"]`);
    if (tab) tab.click();
}

/* ==================================================
   2bis. TABLEAU DE BORD & STATISTIQUES
   ================================================== */
function setupDashboard() {
    document.querySelectorAll(".quick-action-btn[data-goto]").forEach(btn => {
        btn.addEventListener("click", () => gotoTab(btn.getAttribute("data-goto")));
    });
    const viewSiteBtn = document.getElementById("qa-view-site");
    if (viewSiteBtn) viewSiteBtn.addEventListener("click", () => window.open("index.html", "_blank"));
}

async function refreshStats() {
    if (!getToken()) return;
    try {
        const s = await api("/api/stats");
        const today = new Date().toISOString().slice(0, 10);
        document.getElementById("stat-visits").textContent = s.visits.total || 0;
        document.getElementById("stat-today").textContent = s.visits.daily[today] || 0;
        document.getElementById("stat-projects").textContent = s.counts.projets;
        document.getElementById("stat-images").textContent = s.counts.images;
        document.getElementById("stat-messages").textContent = s.counts.messages;
        document.getElementById("stat-unread").textContent = s.counts.unread;
        document.getElementById("stat-updated").textContent = s.updatedAt
            ? new Date(s.updatedAt).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })
            : "Jamais";

        renderVisitsChart(s.visits.daily || {});
    } catch (err) {
        console.warn("Stats indisponibles:", err.message);
    }
}

function renderVisitsChart(daily) {
    const container = document.getElementById("visits-chart");
    if (!container) return;
    container.innerHTML = "";

    const days = [];
    for (let i = 13; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        days.push(d.toISOString().slice(0, 10));
    }
    const max = Math.max(1, ...days.map(d => daily[d] || 0));

    days.forEach(day => {
        const count = daily[day] || 0;
        const col = document.createElement("div");
        col.className = "chart-col";
        const bar = document.createElement("div");
        bar.className = "chart-bar";
        bar.style.height = Math.max(4, Math.round((count / max) * 100)) + "%";
        bar.title = `${day} : ${count} visite(s)`;
        const label = document.createElement("span");
        label.className = "chart-label";
        label.textContent = day.slice(8, 10) + "/" + day.slice(5, 7);
        const value = document.createElement("span");
        value.className = "chart-value";
        value.textContent = count;
        col.appendChild(value);
        col.appendChild(bar);
        col.appendChild(label);
        container.appendChild(col);
    });
}

function initDashboardData() {
    // Tab 1 : Identité
    document.getElementById("id-name").value = currentData.identity?.name || "";
    document.getElementById("id-title").value = currentData.identity?.title || "";
    document.getElementById("id-accroche").value = currentData.identity?.accroche || "";

    document.getElementById("theme-primary").value = currentData.theme?.primaryColor || "#F5F2ED";
    document.getElementById("theme-secondary").value = currentData.theme?.secondaryColor || "#111111";
    document.getElementById("theme-accent").value = currentData.theme?.accentColor || "#B8860B";
    document.getElementById("theme-darkmode").checked = currentData.theme?.darkMode === true;
    const fontTitleSel = document.getElementById("theme-font-title");
    const fontBodySel = document.getElementById("theme-font-body");
    if (fontTitleSel) fontTitleSel.value = currentData.theme?.fontTitle || "Cormorant Garamond";
    if (fontBodySel) fontBodySel.value = currentData.theme?.fontBody || "Inter";

    document.getElementById("preview-hero-bg").src = currentData.identity?.heroImage || "";
    document.getElementById("preview-profile-img").src = currentData.identity?.profileImage || "";

    // Tab 2 : À Propos & Timeline
    document.getElementById("bio-histoire").value = currentData.apropos?.histoire || "";
    document.getElementById("bio-approche").value = currentData.apropos?.approche || "";
    document.getElementById("bio-citation").value = currentData.apropos?.citation || "";
    renderExperiencesList();

    // Tab 3 : Projets
    renderProjectsList();

    // Tab 3bis : Presse, Témoignages & Services
    VITRINE_LISTS.forEach(renderVitrineList);

    // Tab 4bis : Vidéos
    if (!currentData.videos) currentData.videos = [];
    renderVideosList();

    // Tab 4ter : À la une
    renderVedetteStatus();
    populateVedetteItemSelect();

    // Tab 4 : Contact
    document.getElementById("contact-email-input").value = currentData.contact?.email || "";
    document.getElementById("contact-phone-input").value = currentData.contact?.telephone || "";
    document.getElementById("contact-address-input").value = currentData.contact?.adresse || "";
    document.getElementById("contact-pitch-input").value = currentData.apropos?.approche || "";
    renderSocialsList();

    // Tab SEO & Réglages
    initSeoForm();
}

/* ==================================================
   3. UPLOAD D'IMAGES SÉCURISÉ (serveur)
   ================================================== */

/* Compresse/redimensionne une image côté navigateur avant envoi (accélère l'upload) */
async function compressImage(file, { maxDimension = 2000, quality = 0.8, mimeType = "image/jpeg" } = {}) {
    if (!file.type.startsWith("image/") || file.type === "image/gif") return file;
    if (file.size < 150 * 1024) return file; // déjà léger, inutile de compresser

    try {
        const bitmap = await createImageBitmap(file);
        const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
        const width = Math.round(bitmap.width * scale);
        const height = Math.round(bitmap.height * scale);

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d").drawImage(bitmap, 0, 0, width, height);
        bitmap.close?.();

        const blob = await new Promise(resolve => canvas.toBlob(resolve, mimeType, quality));
        if (!blob) return file;

        const newName = file.name.replace(/\.\w+$/, "") + (mimeType === "image/jpeg" ? ".jpg" : ".webp");
        return new File([blob], newName, { type: mimeType });
    } catch {
        return file; // en cas d'échec, on envoie l'original plutôt que de bloquer l'upload
    }
}

async function uploadImages(files) {
    const compressed = await Promise.all(Array.from(files).map(f => compressImage(f)));
    const formData = new FormData();
    compressed.forEach(f => formData.append("images", f));
    const result = await api("/api/upload", { method: "POST", body: formData });
    return result.files; // [{ url, size, name }]
}

function setupImageUpload(inputId, previewId, callback) {
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);

    if (input && preview) {
        input.addEventListener("change", async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            try {
                showToast("Téléversement en cours...");
                const uploaded = await uploadImages([file]);
                if (uploaded.length > 0) {
                    preview.src = uploaded[0].url;
                    callback(uploaded[0].url);
                    showToast("Image téléversée ! N'oubliez pas d'enregistrer.");
                }
            } catch (err) {
                alert("Erreur d'upload : " + err.message);
            }
        });
    }
}

/* ==================================================
   4. FORMULAIRE : IDENTITÉ & THÈME
   ================================================== */
function setupIdentityForm() {
    const form = document.getElementById("form-identity");

    setupImageUpload("upload-hero-bg", "preview-hero-bg", (url) => {
        currentData.identity.heroImage = url;
    });
    setupImageUpload("upload-profile", "preview-profile-img", (url) => {
        currentData.identity.profileImage = url;
    });

    if (form) {
        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            currentData.identity.name = document.getElementById("id-name").value;
            currentData.identity.title = document.getElementById("id-title").value;
            currentData.identity.accroche = document.getElementById("id-accroche").value;

            currentData.theme.primaryColor = document.getElementById("theme-primary").value;
            currentData.theme.secondaryColor = document.getElementById("theme-secondary").value;
            currentData.theme.accentColor = document.getElementById("theme-accent").value;
            currentData.theme.darkMode = document.getElementById("theme-darkmode").checked;
            const ft = document.getElementById("theme-font-title");
            const fb = document.getElementById("theme-font-body");
            if (ft) currentData.theme.fontTitle = ft.value;
            if (fb) currentData.theme.fontBody = fb.value;

            try {
                await saveContent();
                showToast("Identité et thème sauvegardés !");
            } catch (err) { alert(err.message); }
        });
    }
}

/* ---------- Préréglages de thème (1 clic) ---------- */
const THEME_PRESETS = {
    editorial: { primaryColor: "#F5F2ED", secondaryColor: "#111111", accentColor: "#B8860B", darkMode: false },
    noir:      { primaryColor: "#0D0D0D", secondaryColor: "#F5F0E8", accentColor: "#C9A84C", darkMode: true },
    ivoire:    { primaryColor: "#FBF8F3", secondaryColor: "#1A1A1A", accentColor: "#A0522D", darkMode: false },
    ardoise:   { primaryColor: "#EEF0F2", secondaryColor: "#1C2530", accentColor: "#B87333", darkMode: false },
    foret:     { primaryColor: "#F4F1EA", secondaryColor: "#1E2A23", accentColor: "#7A8B5E", darkMode: false }
};

function setupThemePresets() {
    document.querySelectorAll(".theme-preset").forEach(btn => {
        btn.addEventListener("click", () => {
            const preset = THEME_PRESETS[btn.getAttribute("data-preset")];
            if (!preset) return;
            document.getElementById("theme-primary").value = preset.primaryColor;
            document.getElementById("theme-secondary").value = preset.secondaryColor;
            document.getElementById("theme-accent").value = preset.accentColor;
            document.getElementById("theme-darkmode").checked = preset.darkMode;
            showToast("Préréglage appliqué — cliquez sur Enregistrer pour le publier.");
        });
    });
}

/* ==================================================
   5. À PROPOS & TIMELINE EXPÉRIENCES
   ================================================== */
function setupAboutForm() {
    const form = document.getElementById("form-apropos");
    const addExpBtn = document.getElementById("add-exp-btn");

    if (form) {
        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            currentData.apropos.histoire = document.getElementById("bio-histoire").value;
            currentData.apropos.approche = document.getElementById("bio-approche").value;
            currentData.apropos.citation = document.getElementById("bio-citation").value;

            const newExperiences = [];
            document.querySelectorAll(".exp-item-card").forEach(card => {
                newExperiences.push({
                    id: card.getAttribute("data-id"),
                    periode: card.querySelector(".exp-period").value,
                    titre: card.querySelector(".exp-title").value,
                    desc: card.querySelector(".exp-desc").value
                });
            });
            currentData.experiences = newExperiences;

            try {
                await saveContent();
                showToast("À Propos et timeline sauvegardés !");
            } catch (err) { alert(err.message); }
        });
    }

    if (addExpBtn) {
        addExpBtn.addEventListener("click", () => {
            currentData.experiences.push({
                id: "exp_" + Date.now(),
                periode: "Nouvelle date",
                titre: "Nouveau titre",
                desc: "Description de l'expérience"
            });
            renderExperiencesList();
        });
    }
}

function renderExperiencesList() {
    const container = document.getElementById("exp-items-container");
    if (!container) return;
    container.innerHTML = "";

    (currentData.experiences || []).forEach((exp, idx) => {
        const item = document.createElement("div");
        item.className = "exp-item-card";
        item.setAttribute("data-id", exp.id);
        item.innerHTML = `
            <div class="exp-card-header">
                <span class="exp-number">Expérience N°${idx + 1}</span>
                <div class="exp-actions">
                    <button type="button" class="admin-btn secondary-btn btn-sm move-up-btn" title="Monter"><i class="fa-solid fa-arrow-up"></i></button>
                    <button type="button" class="admin-btn secondary-btn btn-sm move-down-btn" title="Descendre"><i class="fa-solid fa-arrow-down"></i></button>
                    <button type="button" class="admin-btn danger-btn btn-sm delete-exp-btn" title="Supprimer"><i class="fa-solid fa-trash-can"></i></button>
                </div>
            </div>
            <div class="exp-fields">
                <div class="form-group">
                    <label>Période / Date</label>
                    <input type="text" class="exp-period" required>
                </div>
                <div class="form-group">
                    <label>Titre de l'expérience</label>
                    <input type="text" class="exp-title" required>
                </div>
                <div class="form-group full-field">
                    <label>Description des réalisations</label>
                    <textarea class="exp-desc" rows="3" required></textarea>
                </div>
            </div>
        `;
        item.querySelector(".exp-period").value = exp.periode || "";
        item.querySelector(".exp-title").value = exp.titre || "";
        item.querySelector(".exp-desc").value = exp.desc || "";
        container.appendChild(item);
    });

    setupExperiencesListEvents();
}

function setupExperiencesListEvents() {
    const container = document.getElementById("exp-items-container");

    container.querySelectorAll(".delete-exp-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const id = e.target.closest(".exp-item-card").getAttribute("data-id");
            currentData.experiences = currentData.experiences.filter(exp => exp.id !== id);
            renderExperiencesList();
        });
    });

    container.querySelectorAll(".move-up-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const id = e.target.closest(".exp-item-card").getAttribute("data-id");
            const i = currentData.experiences.findIndex(exp => exp.id === id);
            if (i > 0) {
                [currentData.experiences[i - 1], currentData.experiences[i]] = [currentData.experiences[i], currentData.experiences[i - 1]];
                renderExperiencesList();
            }
        });
    });

    container.querySelectorAll(".move-down-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const id = e.target.closest(".exp-item-card").getAttribute("data-id");
            const i = currentData.experiences.findIndex(exp => exp.id === id);
            if (i < currentData.experiences.length - 1) {
                [currentData.experiences[i + 1], currentData.experiences[i]] = [currentData.experiences[i], currentData.experiences[i + 1]];
                renderExperiencesList();
            }
        });
    });
}

/* ==================================================
   5bis. PRESSE, TÉMOIGNAGES & SERVICES (listes génériques)
   ================================================== */
const VITRINE_LISTS = [
    {
        key: "presse", containerId: "presse-items-container", addBtnId: "add-presse-btn", label: "Presse",
        newItem: () => ({ id: "presse_" + Date.now(), media: "Nouveau média", titre: "Titre de l'article ou de la distinction", lien: "#", annee: String(new Date().getFullYear()) }),
        fields: [
            { cls: "vit-media", key: "media", label: "Média / Institution", type: "text" },
            { cls: "vit-titre", key: "titre", label: "Titre de l'article ou de la distinction", type: "text" },
            { cls: "vit-lien", key: "lien", label: "Lien (URL, optionnel)", type: "text", optional: true },
            { cls: "vit-contenu", key: "contenu", label: "Article complet (optionnel — publié directement sur le site)", type: "textarea", optional: true },
            { cls: "vit-annee", key: "annee", label: "Année", type: "text" }
        ]
    },
    {
        key: "temoignages", containerId: "temoignages-items-container", addBtnId: "add-temoignage-btn", label: "Témoignage",
        newItem: () => ({ id: "temoin_" + Date.now(), nom: "Nom du client", role: "Rôle / Organisation", citation: "Citation du témoignage" }),
        fields: [
            { cls: "vit-nom", key: "nom", label: "Nom", type: "text" },
            { cls: "vit-role", key: "role", label: "Rôle / Organisation", type: "text" },
            { cls: "vit-citation", key: "citation", label: "Citation", type: "textarea" }
        ]
    },
    {
        key: "services", containerId: "services-items-container", addBtnId: "add-service-btn", label: "Service",
        newItem: () => ({ id: "service_" + Date.now(), titre: "Nom de la prestation", description: "Description de la prestation", prix: "Sur devis" }),
        fields: [
            { cls: "vit-titre", key: "titre", label: "Titre de la prestation", type: "text" },
            { cls: "vit-description", key: "description", label: "Description", type: "textarea" },
            { cls: "vit-prix", key: "prix", label: "Prix / Tarif", type: "text" }
        ]
    }
];

function setupVitrineForm() {
    const form = document.getElementById("form-vitrine");

    VITRINE_LISTS.forEach(list => {
        renderVitrineList(list);
        const addBtn = document.getElementById(list.addBtnId);
        if (addBtn) {
            addBtn.addEventListener("click", () => {
                currentData[list.key] = currentData[list.key] || [];
                currentData[list.key].push(list.newItem());
                renderVitrineList(list);
            });
        }
    });

    if (form) {
        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            VITRINE_LISTS.forEach(list => {
                const container = document.getElementById(list.containerId);
                const items = [];
                container.querySelectorAll(".exp-item-card").forEach(card => {
                    const item = { id: card.getAttribute("data-id") };
                    list.fields.forEach(f => {
                        item[f.key] = card.querySelector("." + f.cls).value;
                    });
                    items.push(item);
                });
                currentData[list.key] = items;
            });

            try {
                await saveContent();
                showToast("Presse, témoignages et services sauvegardés !");
            } catch (err) { alert(err.message); }
        });
    }
}

function renderVitrineList(list) {
    const container = document.getElementById(list.containerId);
    if (!container) return;
    container.innerHTML = "";

    (currentData[list.key] || []).forEach((item, idx) => {
        const card = document.createElement("div");
        card.className = "exp-item-card";
        card.setAttribute("data-id", item.id);

        const fieldsHtml = list.fields.map(f => {
            const req = f.optional ? "" : "required";
            const control = f.type === "textarea"
                ? `<textarea class="${f.cls}" rows="3" ${req}></textarea>`
                : `<input type="text" class="${f.cls}" ${req}>`;
            const wide = f.type === "textarea" ? " full-field" : "";
            return `<div class="form-group${wide}"><label>${f.label}</label>${control}</div>`;
        }).join("");

        card.innerHTML = `
            <div class="exp-card-header">
                <span class="exp-number">${list.label} N°${idx + 1}</span>
                <div class="exp-actions">
                    <button type="button" class="admin-btn secondary-btn btn-sm move-up-btn" title="Monter"><i class="fa-solid fa-arrow-up"></i></button>
                    <button type="button" class="admin-btn secondary-btn btn-sm move-down-btn" title="Descendre"><i class="fa-solid fa-arrow-down"></i></button>
                    <button type="button" class="admin-btn danger-btn btn-sm delete-btn" title="Supprimer"><i class="fa-solid fa-trash-can"></i></button>
                </div>
            </div>
            <div class="exp-fields">${fieldsHtml}</div>
        `;
        list.fields.forEach(f => {
            card.querySelector("." + f.cls).value = item[f.key] || "";
        });
        container.appendChild(card);
    });

    setupVitrineListEvents(list);
}

function setupVitrineListEvents(list) {
    const container = document.getElementById(list.containerId);

    container.querySelectorAll(".delete-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const id = e.target.closest(".exp-item-card").getAttribute("data-id");
            currentData[list.key] = currentData[list.key].filter(item => item.id !== id);
            renderVitrineList(list);
        });
    });

    container.querySelectorAll(".move-up-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const id = e.target.closest(".exp-item-card").getAttribute("data-id");
            const items = currentData[list.key];
            const i = items.findIndex(item => item.id === id);
            if (i > 0) {
                [items[i - 1], items[i]] = [items[i], items[i - 1]];
                renderVitrineList(list);
            }
        });
    });

    container.querySelectorAll(".move-down-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const id = e.target.closest(".exp-item-card").getAttribute("data-id");
            const items = currentData[list.key];
            const i = items.findIndex(item => item.id === id);
            if (i < items.length - 1) {
                [items[i + 1], items[i]] = [items[i], items[i + 1]];
                renderVitrineList(list);
            }
        });
    });
}

/* ==================================================
   6. CRUD PROJETS
   ================================================== */
function setupProjectsCRUD() {
    const createBtn = document.getElementById("create-new-project-btn");
    const editForm = document.getElementById("form-project-edit");
    const deleteBtn = document.getElementById("delete-current-project-btn");
    const addSpecBtn = document.getElementById("add-spec-field-btn");
    const photoUploadInput = document.getElementById("add-project-photos-input");

    if (createBtn) {
        createBtn.addEventListener("click", async () => {
            const newProjId = "proj_" + Date.now();
            currentData.projets.push({
                id: newProjId,
                titre: "Nouveau Projet",
                sousTitre: "Catégorie",
                lieu: "Lieu",
                description: "Description de la démarche artistique.",
                fichetech: [{ label: "Type de projet", value: "Photographie" }],
                images: []
            });
            try {
                await saveContent();
                renderProjectsList();
                selectProject(newProjId);
                showToast("Nouveau projet créé !");
            } catch (err) { alert(err.message); }
        });
    }

    if (editForm) {
        editForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const id = document.getElementById("edit-project-id").value;
            const project = currentData.projets.find(p => p.id === id);
            if (!project) return;

            project.titre = document.getElementById("project-name-edit").value;
            project.sousTitre = document.getElementById("project-subtitle-edit").value;
            project.lieu = document.getElementById("project-location-edit").value;
            project.description = document.getElementById("project-desc-edit").value;

            const specs = [];
            document.querySelectorAll(".spec-editor-row").forEach(row => {
                const label = row.querySelector(".spec-label-input").value;
                const value = row.querySelector(".spec-val-input").value;
                if (label && value) specs.push({ label, value });
            });
            project.fichetech = specs;

            document.querySelectorAll(".gallery-thumb-card").forEach(card => {
                const imgUrl = card.getAttribute("data-url");
                const img = project.images.find(i => i.url === imgUrl);
                if (img) {
                    img.titre = card.querySelector(".photo-titre-input").value;
                    img.sousTitre = card.querySelector(".photo-soustitre-input").value;
                    img.caption = card.querySelector(".photo-caption-input").value;
                    img.date = card.querySelector(".photo-date-input").value;
                    img.type = card.querySelector(".photo-type-input").value;
                    img.lieu = card.querySelector(".photo-lieu-input").value;
                    img.description = card.querySelector(".photo-desc-input").value;
                }
            });

            try {
                await saveContent();
                renderProjectsList();
                showToast("Projet sauvegardé !");
            } catch (err) { alert(err.message); }
        });
    }

    if (deleteBtn) {
        deleteBtn.addEventListener("click", async () => {
            if (!confirm("Êtes-vous sûr de vouloir supprimer ce projet ? Cette action est irréversible.")) return;
            currentData.projets = currentData.projets.filter(p => p.id !== selectedProjectId);
            try {
                await saveContent();
                selectedProjectId = null;
                renderProjectsList();
                document.getElementById("project-editor-container").style.display = "none";
                document.getElementById("project-editor-placeholder").style.display = "flex";
                showToast("Projet supprimé !");
            } catch (err) { alert(err.message); }
        });
    }

    if (addSpecBtn) {
        addSpecBtn.addEventListener("click", () => {
            const container = document.getElementById("project-specs-editor-container");
            const row = document.createElement("div");
            row.className = "spec-editor-row";
            row.innerHTML = `
                <input type="text" class="spec-label-input" placeholder="Caractéristique (ex: Matériel)" required>
                <input type="text" class="spec-val-input" placeholder="Détail" required>
                <button type="button" class="admin-btn danger-btn btn-sm delete-spec-btn"><i class="fa-solid fa-trash"></i></button>
            `;
            container.appendChild(row);
            row.querySelector(".delete-spec-btn").addEventListener("click", () => row.remove());
        });
    }

    if (photoUploadInput) {
        photoUploadInput.addEventListener("change", async (e) => {
            const files = Array.from(e.target.files);
            const project = currentData.projets.find(p => p.id === selectedProjectId);
            if (!project || files.length === 0) return;

            try {
                showToast("Téléversement des photos...");
                const uploaded = await uploadImages(files);
                uploaded.forEach(f => project.images.push({ url: f.url, caption: "", titre: "", sousTitre: "", date: "", type: "", lieu: "", description: "" }));
                await saveContent();
                renderProjectGalleryEditor(project.images);
                showToast(`${uploaded.length} photo(s) ajoutée(s) !`);
            } catch (err) {
                alert("Erreur d'upload : " + err.message);
            } finally {
                photoUploadInput.value = "";
            }
        });
    }
}

function renderProjectsList() {
    const container = document.getElementById("projects-list-container");
    if (!container) return;
    container.innerHTML = "";

    (currentData.projets || []).forEach(proj => {
        const item = document.createElement("li");
        item.className = `project-item-row ${selectedProjectId === proj.id ? 'active' : ''}`;
        const info = document.createElement("div");
        info.className = "project-row-info";
        const h4 = document.createElement("h4");
        h4.textContent = proj.titre;
        const p = document.createElement("p");
        p.textContent = `${proj.sousTitre} • ${proj.lieu}`;
        info.appendChild(h4);
        info.appendChild(p);
        item.appendChild(info);
        item.insertAdjacentHTML("beforeend", `<i class="fa-solid fa-chevron-right"></i>`);
        item.addEventListener("click", () => selectProject(proj.id));
        container.appendChild(item);
    });
}

function selectProject(id) {
    selectedProjectId = id;
    document.getElementById("project-editor-placeholder").style.display = "none";
    document.getElementById("project-editor-container").style.display = "block";

    const items = document.querySelectorAll(".project-item-row");
    const projets = currentData.projets || [];
    const index = projets.findIndex(p => p.id === id);

    items.forEach((item, idx) => {
        item.classList.toggle("active", projets[idx] && projets[idx].id === id);
    });

    const project = projets[index];
    if (!project) return;

    document.getElementById("edit-project-id").value = project.id;
    document.getElementById("project-name-edit").value = project.titre || "";
    document.getElementById("project-subtitle-edit").value = project.sousTitre || "";
    document.getElementById("project-location-edit").value = project.lieu || "";
    document.getElementById("project-desc-edit").value = project.description || "";

    renderProjectSpecsEditor(project.fichetech);
    renderProjectGalleryEditor(project.images);
}

function renderProjectSpecsEditor(specs) {
    const container = document.getElementById("project-specs-editor-container");
    if (!container) return;
    container.innerHTML = "";

    (specs || []).forEach(spec => {
        const row = document.createElement("div");
        row.className = "spec-editor-row";
        row.innerHTML = `
            <input type="text" class="spec-label-input" placeholder="Caractéristique" required>
            <input type="text" class="spec-val-input" placeholder="Détail" required>
            <button type="button" class="admin-btn danger-btn btn-sm delete-spec-btn"><i class="fa-solid fa-trash"></i></button>
        `;
        row.querySelector(".spec-label-input").value = spec.label || "";
        row.querySelector(".spec-val-input").value = spec.value || "";
        row.querySelector(".delete-spec-btn").addEventListener("click", () => row.remove());
        container.appendChild(row);
    });
}

function renderProjectGalleryEditor(images) {
    const container = document.getElementById("project-gallery-editor-container");
    if (!container) return;
    container.innerHTML = "";

    (images || []).forEach(img => {
        const card = document.createElement("div");
        card.className = "gallery-thumb-card";
        card.setAttribute("data-url", img.url);
        card.innerHTML = `
            <div class="thumb-image-wrapper">
                <img alt="Miniature">
            </div>
            <input type="text" class="photo-titre-input" placeholder="Titre de la photo">
            <input type="text" class="photo-soustitre-input" placeholder="Sous-titre">
            <input type="text" class="photo-caption-input" placeholder="Légende de l'image">
            <div class="photo-meta-row">
                <input type="date" class="photo-date-input" title="Date de prise de vue">
                <input type="text" class="photo-type-input" placeholder="Type (ex: portrait, rue)">
            </div>
            <input type="text" class="photo-lieu-input" placeholder="Lieu (ex: Port-au-Prince)">
            <textarea class="photo-desc-input" placeholder="Description" rows="2"></textarea>
            <button type="button" class="delete-photo-btn" title="Supprimer la photo"><i class="fa-solid fa-trash"></i></button>
        `;
        card.querySelector("img").src = img.url;
        card.querySelector(".photo-titre-input").value = img.titre || "";
        card.querySelector(".photo-soustitre-input").value = img.sousTitre || "";
        card.querySelector(".photo-caption-input").value = img.caption || "";
        card.querySelector(".photo-date-input").value = img.date || "";
        card.querySelector(".photo-type-input").value = img.type || "";
        card.querySelector(".photo-lieu-input").value = img.lieu || "";
        card.querySelector(".photo-desc-input").value = img.description || "";

        card.querySelector(".delete-photo-btn").addEventListener("click", async () => {
            const project = currentData.projets.find(p => p.id === selectedProjectId);
            if (!project) return;
            project.images = project.images.filter(i => i.url !== img.url);
            try {
                await saveContent();
                renderProjectGalleryEditor(project.images);
                showToast("Photo retirée !");
            } catch (err) { alert(err.message); }
        });

        container.appendChild(card);
    });
}

/* ==================================================
   7. CONTACT ET RÉSEAUX SOCIAUX
   ================================================== */
function setupContactForm() {
    const form = document.getElementById("form-contact");
    const addSocialBtn = document.getElementById("add-social-btn");

    if (form) {
        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            currentData.contact.email = document.getElementById("contact-email-input").value;
            currentData.contact.telephone = document.getElementById("contact-phone-input").value;
            currentData.contact.adresse = document.getElementById("contact-address-input").value;
            currentData.apropos.approche = document.getElementById("contact-pitch-input").value;

            const newSocials = [];
            document.querySelectorAll(".social-item-row").forEach(row => {
                const name = row.querySelector(".social-name-select").value;
                const url = row.querySelector(".social-url-input").value;
                if (name && url) newSocials.push({ name, url });
            });
            currentData.contact.socials = newSocials;

            try {
                await saveContent();
                showToast("Contacts sauvegardés !");
            } catch (err) { alert(err.message); }
        });
    }

    if (addSocialBtn) {
        addSocialBtn.addEventListener("click", () => {
            currentData.contact.socials.push({ name: "Instagram", url: "https://" });
            renderSocialsList();
        });
    }
}

function renderSocialsList() {
    const container = document.getElementById("social-items-container");
    if (!container) return;
    container.innerHTML = "";

    (currentData.contact?.socials || []).forEach((social, idx) => {
        const row = document.createElement("div");
        row.className = "social-item-row";
        row.innerHTML = `
            <select class="social-name-select">
                <option value="Instagram">Instagram</option>
                <option value="Facebook">Facebook</option>
                <option value="Twitter / X">Twitter / X</option>
                <option value="LinkedIn">LinkedIn</option>
                <option value="Flickr">Flickr</option>
            </select>
            <input type="text" class="social-url-input" placeholder="Lien du profil (ex: https://instagram.com/pseudo)" required>
            <button type="button" class="admin-btn danger-btn btn-sm delete-social-btn" title="Supprimer"><i class="fa-solid fa-trash-can"></i></button>
        `;
        row.querySelector(".social-name-select").value = social.name || "Instagram";
        row.querySelector(".social-url-input").value = social.url || "";
        row.querySelector(".delete-social-btn").addEventListener("click", () => {
            currentData.contact.socials.splice(idx, 1);
            renderSocialsList();
        });
        container.appendChild(row);
    });
}

/* ==================================================
   8. MESSAGES REÇUS (Boîte de réception)
   ================================================== */
function setupMessagesTab() {
    const refreshBtn = document.getElementById("refresh-messages-btn");
    if (refreshBtn) refreshBtn.addEventListener("click", refreshMessages);
}

async function refreshMessages() {
    const container = document.getElementById("messages-list-container");
    if (!container || !getToken()) return;

    try {
        const messages = await api("/api/messages");
        const unread = messages.filter(m => !m.read).length;
        const badge = document.getElementById("unread-badge");
        if (badge) {
            badge.textContent = unread;
            badge.style.display = unread > 0 ? "inline-flex" : "none";
        }

        container.innerHTML = "";
        if (messages.length === 0) {
            container.innerHTML = `<p class="no-messages" style="color: var(--admin-text-muted, #888); padding: 1rem;">Aucun message reçu pour le moment.</p>`;
            return;
        }

        messages.forEach(msg => {
            const card = document.createElement("div");
            card.className = "message-card" + (msg.read ? " read" : "");
            card.style.cssText = `border: 1px solid #e2e2e2; border-left: 4px solid ${msg.read ? '#ccc' : '#B8860B'}; border-radius: 6px; padding: 1rem 1.2rem; margin-bottom: 1rem; background: ${msg.read ? '#fafafa' : '#fff'};`;

            const header = document.createElement("div");
            header.style.cssText = "display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem; margin-bottom:0.6rem;";

            const who = document.createElement("div");
            const nameEl = document.createElement("strong");
            nameEl.textContent = msg.name;
            const emailEl = document.createElement("a");
            emailEl.href = `mailto:${msg.email}`;
            emailEl.textContent = ` <${msg.email}>`;
            emailEl.style.cssText = "color:#B8860B; text-decoration:none; margin-left:0.4rem; font-size:0.85rem;";
            who.appendChild(nameEl);
            who.appendChild(emailEl);

            const meta = document.createElement("div");
            meta.style.cssText = "display:flex; gap:0.5rem; align-items:center;";
            const dateEl = document.createElement("span");
            dateEl.textContent = new Date(msg.date).toLocaleString("fr-FR");
            dateEl.style.cssText = "font-size:0.8rem; color:#888;";
            meta.appendChild(dateEl);

            if (!msg.read) {
                const readBtn = document.createElement("button");
                readBtn.className = "admin-btn secondary-btn btn-sm";
                readBtn.innerHTML = `<i class="fa-solid fa-check"></i> Lu`;
                readBtn.addEventListener("click", async () => {
                    await api(`/api/messages/${msg.id}/read`, { method: "PATCH" });
                    refreshMessages();
                });
                meta.appendChild(readBtn);
            }

            const delBtn = document.createElement("button");
            delBtn.className = "admin-btn danger-btn btn-sm";
            delBtn.innerHTML = `<i class="fa-solid fa-trash-can"></i>`;
            delBtn.title = "Supprimer";
            delBtn.addEventListener("click", async () => {
                if (!confirm("Supprimer ce message ?")) return;
                await api(`/api/messages/${msg.id}`, { method: "DELETE" });
                refreshMessages();
                showToast("Message supprimé");
            });
            meta.appendChild(delBtn);

            header.appendChild(who);
            header.appendChild(meta);

            const body = document.createElement("p");
            body.textContent = msg.message;
            body.style.cssText = "margin:0; white-space:pre-wrap; line-height:1.5; font-size:0.92rem;";

            card.appendChild(header);
            card.appendChild(body);
            container.appendChild(card);
        });
    } catch (err) {
        console.warn("Erreur chargement messages:", err.message);
    }
}

/* ==================================================
   8ter. COMMENTAIRES SUR PHOTOS (modération)
   ================================================== */
function setupCommentsTab() {
    const refreshBtn = document.getElementById("refresh-comments-btn");
    if (refreshBtn) refreshBtn.addEventListener("click", refreshComments);
}

async function refreshComments() {
    const container = document.getElementById("comments-list-container");
    if (!container || !getToken()) return;

    try {
        const comments = await api("/api/comments/all");
        const pending = comments.filter(c => !c.visible).length;
        const badge = document.getElementById("pending-comments-badge");
        if (badge) {
            badge.textContent = pending;
            badge.style.display = pending > 0 ? "inline-flex" : "none";
        }

        container.innerHTML = "";
        if (comments.length === 0) {
            container.innerHTML = `<p class="no-messages" style="color: var(--admin-text-muted, #888); padding: 1rem;">Aucun commentaire pour le moment.</p>`;
            return;
        }

        comments.forEach(c => {
            const card = document.createElement("div");
            card.className = "message-card" + (c.visible ? " read" : "");
            card.style.cssText = `border: 1px solid #e2e2e2; border-left: 4px solid ${c.visible ? '#4caf50' : '#B8860B'}; border-radius: 6px; padding: 1rem 1.2rem; margin-bottom: 1rem; background: ${c.visible ? '#fafafa' : '#fff'};`;

            const header = document.createElement("div");
            header.style.cssText = "display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem; margin-bottom:0.6rem;";

            const who = document.createElement("div");
            const nameEl = document.createElement("strong");
            nameEl.textContent = c.anonyme || !c.nom ? "Anonyme" : c.nom;
            const photoEl = document.createElement("span");
            photoEl.textContent = ` — ${c.photoUrl}`;
            photoEl.style.cssText = "color:#888; font-size:0.8rem; margin-left:0.4rem;";
            who.appendChild(nameEl);
            who.appendChild(photoEl);

            const meta = document.createElement("div");
            meta.style.cssText = "display:flex; gap:0.5rem; align-items:center;";
            const dateEl = document.createElement("span");
            dateEl.textContent = new Date(c.date).toLocaleString("fr-FR");
            dateEl.style.cssText = "font-size:0.8rem; color:#888;";
            meta.appendChild(dateEl);

            const toggleBtn = document.createElement("button");
            toggleBtn.className = "admin-btn secondary-btn btn-sm";
            toggleBtn.innerHTML = c.visible ? `<i class="fa-solid fa-eye-slash"></i> Masquer` : `<i class="fa-solid fa-check"></i> Approuver`;
            toggleBtn.addEventListener("click", async () => {
                await api(`/api/comments/${c.id}`, { method: "PATCH", body: { visible: !c.visible } });
                refreshComments();
            });
            meta.appendChild(toggleBtn);

            const delBtn = document.createElement("button");
            delBtn.className = "admin-btn danger-btn btn-sm";
            delBtn.innerHTML = `<i class="fa-solid fa-trash-can"></i>`;
            delBtn.title = "Supprimer";
            delBtn.addEventListener("click", async () => {
                if (!confirm("Supprimer ce commentaire ?")) return;
                await api(`/api/comments/${c.id}`, { method: "DELETE" });
                refreshComments();
                showToast("Commentaire supprimé");
            });
            meta.appendChild(delBtn);

            header.appendChild(who);
            header.appendChild(meta);

            const body = document.createElement("p");
            body.textContent = c.message;
            body.style.cssText = "margin:0; white-space:pre-wrap; line-height:1.5; font-size:0.92rem;";

            card.appendChild(header);
            card.appendChild(body);
            container.appendChild(card);
        });
    } catch (err) {
        console.warn("Erreur chargement commentaires:", err.message);
    }
}

/* ==================================================
   8quater. VIDÉOS
   ================================================== */
function setupVideosTab() {
    if (!currentData.videos) currentData.videos = [];

    const uploadInput = document.getElementById("video-upload-input");
    const linkBtn = document.getElementById("add-video-link-btn");
    const saveBtn = document.getElementById("save-videos-btn");

    if (uploadInput) {
        uploadInput.addEventListener("change", async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const formData = new FormData();
            formData.append("video", file);
            try {
                showToast("Envoi de la vidéo en cours…");
                const data = await api("/api/upload-video", { method: "POST", body: formData });
                currentData.videos.push({ id: "video_" + Date.now(), titre: file.name.replace(/\.[^.]+$/, ""), type: "upload", url: data.url });
                renderVideosList();
                showToast("Vidéo téléversée !");
            } catch (err) {
                alert(err.message);
            }
            uploadInput.value = "";
        });
    }

    if (linkBtn) {
        linkBtn.addEventListener("click", () => {
            const url = prompt("Collez l'URL YouTube ou Vimeo :");
            if (!url || !url.trim()) return;
            const titre = prompt("Titre de la vidéo :", "Nouvelle vidéo") || "Nouvelle vidéo";
            currentData.videos.push({ id: "video_" + Date.now(), titre, type: "embed", url: url.trim() });
            renderVideosList();
        });
    }

    if (saveBtn) {
        saveBtn.addEventListener("click", async () => {
            document.querySelectorAll(".video-titre-input").forEach(input => {
                const item = currentData.videos.find(v => v.id === input.getAttribute("data-id"));
                if (item) item.titre = input.value;
            });
            try {
                await saveContent();
                showToast("Vidéos sauvegardées !");
            } catch (err) { alert(err.message); }
        });
    }

    renderVideosList();
}

function toEmbedUrl(url) {
    const yt = url.match(/(?:youtu\.be\/|youtube\.com\/watch\?v=|youtube\.com\/embed\/)([\w-]+)/);
    if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
    const vimeo = url.match(/vimeo\.com\/(\d+)/);
    if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
    return url;
}

function renderVideosList() {
    const container = document.getElementById("videos-list-container");
    if (!container) return;
    container.innerHTML = "";

    (currentData.videos || []).forEach((video, idx) => {
        const card = document.createElement("div");
        card.className = "exp-item-card";
        card.setAttribute("data-id", video.id);

        const preview = video.type === "upload"
            ? `<video src="${video.url}" controls style="max-width:220px; border-radius:6px;"></video>`
            : `<iframe src="${toEmbedUrl(video.url)}" style="width:220px; height:124px; border:0; border-radius:6px;" allowfullscreen></iframe>`;

        card.innerHTML = `
            <div class="exp-card-header">
                <span class="exp-number">Vidéo N°${idx + 1} (${video.type === "upload" ? "fichier" : "lien"})</span>
                <div class="exp-actions">
                    <button type="button" class="admin-btn danger-btn btn-sm delete-video-btn" title="Supprimer"><i class="fa-solid fa-trash-can"></i></button>
                </div>
            </div>
            <div class="exp-fields">
                <div class="form-group full-field">
                    <label>Titre</label>
                    <input type="text" class="video-titre-input" data-id="${video.id}" value="${(video.titre || "").replace(/"/g, "&quot;")}">
                </div>
                <div class="form-group full-field">${preview}</div>
            </div>
        `;
        card.querySelector(".delete-video-btn").addEventListener("click", () => {
            currentData.videos = currentData.videos.filter(v => v.id !== video.id);
            renderVideosList();
        });
        container.appendChild(card);
    });
}

/* ==================================================
   8quinquies. À LA UNE (vedette)
   ================================================== */
function flattenGalleryImages() {
    const images = [];
    (currentData.projets || []).forEach(proj => {
        (proj.images || []).forEach(img => {
            images.push({ url: img.url, label: (img.titre || img.caption || proj.titre) + " — " + proj.titre });
        });
    });
    return images;
}

async function populateVedetteItemSelect() {
    const typeSelect = document.getElementById("vedette-type-select");
    const itemSelect = document.getElementById("vedette-item-select");
    if (!typeSelect || !itemSelect) return;

    itemSelect.innerHTML = "";
    const type = typeSelect.value;

    if (type === "photo") {
        flattenGalleryImages().forEach(img => {
            const opt = document.createElement("option");
            opt.value = img.url;
            opt.textContent = img.label;
            itemSelect.appendChild(opt);
        });
        if (itemSelect.options.length === 0) itemSelect.innerHTML = `<option value="">Aucune photo disponible</option>`;
    } else if (type === "video") {
        (currentData.videos || []).forEach(v => {
            const opt = document.createElement("option");
            opt.value = v.id;
            opt.textContent = v.titre;
            itemSelect.appendChild(opt);
        });
        if (itemSelect.options.length === 0) itemSelect.innerHTML = `<option value="">Aucune vidéo disponible</option>`;
    } else if (type === "commentaire") {
        try {
            const comments = (await api("/api/comments/all")).filter(c => c.visible);
            comments.forEach(c => {
                const opt = document.createElement("option");
                opt.value = c.id;
                opt.textContent = `${c.anonyme || !c.nom ? "Anonyme" : c.nom} — ${c.message.slice(0, 60)}`;
                itemSelect.appendChild(opt);
            });
            if (itemSelect.options.length === 0) itemSelect.innerHTML = `<option value="">Aucun commentaire approuvé disponible</option>`;
        } catch {
            itemSelect.innerHTML = `<option value="">Erreur de chargement</option>`;
        }
    }
}

function renderVedetteStatus() {
    const statusEl = document.getElementById("vedette-status");
    const removeBtn = document.getElementById("vedette-remove-btn");
    if (!statusEl) return;

    const v = currentData.vedette;
    const isExpired = v && v.expiresAt && new Date(v.expiresAt).getTime() <= Date.now();
    if (!v || isExpired) {
        statusEl.textContent = "Rien à la une actuellement.";
        if (removeBtn) removeBtn.style.display = "none";
        return;
    }

    const remainingMs = new Date(v.expiresAt).getTime() - Date.now();
    const remainingH = Math.max(0, Math.round(remainingMs / 3600000));
    const labelMap = { photo: "Photo", video: "Vidéo", commentaire: "Commentaire" };
    statusEl.innerHTML = `<strong>${labelMap[v.type] || v.type}</strong> — ${v.titre || v.message || ""} <br>Expire dans environ ${remainingH} h.`;
    if (removeBtn) removeBtn.style.display = "inline-flex";
}

function setupVedetteTab() {
    const typeSelect = document.getElementById("vedette-type-select");
    const publishBtn = document.getElementById("vedette-publish-btn");
    const removeBtn = document.getElementById("vedette-remove-btn");

    if (typeSelect) {
        typeSelect.addEventListener("change", populateVedetteItemSelect);
        populateVedetteItemSelect();
    }

    if (publishBtn) {
        publishBtn.addEventListener("click", async () => {
            const type = document.getElementById("vedette-type-select").value;
            const itemSelect = document.getElementById("vedette-item-select");
            const value = itemSelect.value;
            const hours = parseFloat(document.getElementById("vedette-duree-input").value) || 24;
            if (!value) { alert("Aucun contenu disponible pour ce type."); return; }

            let vedette = { type, expiresAt: new Date(Date.now() + hours * 3600000).toISOString() };

            if (type === "photo") {
                const img = flattenGalleryImages().find(i => i.url === value);
                vedette.url = value;
                vedette.titre = img ? img.label : "";
            } else if (type === "video") {
                const video = (currentData.videos || []).find(v => v.id === value);
                if (!video) { alert("Vidéo introuvable."); return; }
                vedette.videoType = video.type;
                vedette.url = video.url;
                vedette.titre = video.titre;
            } else if (type === "commentaire") {
                try {
                    const comment = (await api("/api/comments/all")).find(c => c.id === value);
                    if (!comment) { alert("Commentaire introuvable."); return; }
                    vedette.message = comment.message;
                    vedette.nom = comment.anonyme || !comment.nom ? "Anonyme" : comment.nom;
                    vedette.photoUrl = comment.photoUrl;
                } catch { alert("Erreur lors de la récupération du commentaire."); return; }
            }

            currentData.vedette = vedette;
            try {
                await saveContent();
                renderVedetteStatus();
                showToast("Contenu publié à la une !");
            } catch (err) { alert(err.message); }
        });
    }

    if (removeBtn) {
        removeBtn.addEventListener("click", async () => {
            currentData.vedette = null;
            try {
                await saveContent();
                renderVedetteStatus();
                showToast("Retiré de la une.");
            } catch (err) { alert(err.message); }
        });
    }
}

/* ==================================================
   8bis. MÉDIATHÈQUE
   ================================================== */
function setupMediaLibrary() {
    const uploadInput = document.getElementById("media-upload-input");
    const refreshBtn = document.getElementById("refresh-media-btn");

    if (refreshBtn) refreshBtn.addEventListener("click", refreshMediaLibrary);

    if (uploadInput) {
        uploadInput.addEventListener("change", async (e) => {
            const files = Array.from(e.target.files);
            if (files.length === 0) return;
            try {
                showToast("Téléversement en cours...");
                await uploadImages(files);
                await refreshMediaLibrary();
                showToast(`${files.length} image(s) ajoutée(s) à la médiathèque !`);
            } catch (err) {
                alert("Erreur d'upload : " + err.message);
            } finally {
                uploadInput.value = "";
            }
        });
    }
}

async function refreshMediaLibrary() {
    const container = document.getElementById("media-grid-container");
    if (!container || !getToken()) return;

    try {
        const files = await api("/api/media");
        container.innerHTML = "";

        if (files.length === 0) {
            container.innerHTML = `<p class="form-tip" style="grid-column: 1/-1; text-align:center; padding: 2rem;">Aucune image téléversée pour le moment. Utilisez le bouton « Téléverser » ci-dessus.</p>`;
            return;
        }

        files.forEach(f => {
            const card = document.createElement("div");
            card.className = "media-card";

            const img = document.createElement("img");
            img.src = f.url;
            img.alt = f.name;
            img.loading = "lazy";
            img.title = "Cliquer pour copier l'adresse de l'image";
            img.addEventListener("click", async () => {
                try {
                    await navigator.clipboard.writeText(f.url);
                    showToast("Adresse de l'image copiée !");
                } catch {
                    prompt("Adresse de l'image :", f.url);
                }
            });

            const meta = document.createElement("div");
            meta.className = "media-meta";
            const sizeKb = (f.size / 1024).toFixed(0);
            meta.innerHTML = `<span>${sizeKb} Ko</span>`;

            const delBtn = document.createElement("button");
            delBtn.className = "media-delete-btn";
            delBtn.innerHTML = `<i class="fa-solid fa-trash-can"></i>`;
            delBtn.title = "Supprimer définitivement";
            delBtn.addEventListener("click", async () => {
                if (!confirm("Supprimer définitivement cette image du serveur ?\nAssurez-vous qu'elle n'est plus utilisée dans vos projets.")) return;
                try {
                    await api(`/api/media/${encodeURIComponent(f.name)}`, { method: "DELETE" });
                    refreshMediaLibrary();
                    showToast("Image supprimée.");
                } catch (err) { alert(err.message); }
            });
            meta.appendChild(delBtn);

            card.appendChild(img);
            card.appendChild(meta);
            container.appendChild(card);
        });
    } catch (err) {
        console.warn("Médiathèque indisponible:", err.message);
    }
}

/* ==================================================
   8ter. SEO & RÉGLAGES DU SITE
   ================================================== */
function initSeoForm() {
    const seo = currentData.seo || {};
    const settings = currentData.settings || {};
    const sections = settings.sections || {};

    const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val ?? ""; };
    const check = (id, val) => { const el = document.getElementById(id); if (el) el.checked = val !== false; };

    set("seo-title", seo.metaTitle);
    set("seo-description", seo.metaDescription);
    set("seo-keywords", seo.keywords);
    check("section-apropos", sections.apropos);
    check("section-projets", sections.projets);
    check("section-galerie", sections.galerie);
    check("section-presse", sections.presse);
    check("section-temoignages", sections.temoignages);
    check("section-services", sections.services);
    check("section-contact", sections.contact);
    set("setting-galerie-intro", settings.galerieIntro);
    set("setting-footer-text", settings.footerText);
    set("setting-galerie-sort", settings.galerieSort || "defaut");

    updateSeoPreview();
}

function updateSeoPreview() {
    const title = document.getElementById("seo-title")?.value || "Gregory Baudin — Photographe Documentaire";
    const desc = document.getElementById("seo-description")?.value || "";
    const pTitle = document.getElementById("seo-preview-title");
    const pDesc = document.getElementById("seo-preview-desc");
    const tCount = document.getElementById("seo-title-count");
    const dCount = document.getElementById("seo-desc-count");
    if (pTitle) pTitle.textContent = title;
    if (pDesc) pDesc.textContent = desc || "Ajoutez une description pour améliorer votre référencement.";
    if (tCount) tCount.textContent = title.length;
    if (dCount) dCount.textContent = desc.length;
}

function setupSeoForm() {
    const form = document.getElementById("form-seo");
    if (!form) return;

    ["seo-title", "seo-description"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener("input", updateSeoPreview);
    });

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        currentData.seo = {
            metaTitle: document.getElementById("seo-title").value,
            metaDescription: document.getElementById("seo-description").value,
            keywords: document.getElementById("seo-keywords").value
        };
        currentData.settings = {
            sections: {
                apropos: document.getElementById("section-apropos").checked,
                projets: document.getElementById("section-projets").checked,
                galerie: document.getElementById("section-galerie").checked,
                presse: document.getElementById("section-presse").checked,
                temoignages: document.getElementById("section-temoignages").checked,
                services: document.getElementById("section-services").checked,
                contact: document.getElementById("section-contact").checked
            },
            galerieIntro: document.getElementById("setting-galerie-intro").value,
            footerText: document.getElementById("setting-footer-text").value,
            galerieSort: document.getElementById("setting-galerie-sort").value
        };

        try {
            await saveContent();
            showToast("SEO et réglages du site sauvegardés !");
        } catch (err) { alert(err.message); }
    });
}

/* ==================================================
   9. OUTILS SYSTÈME (MOT DE PASSE, BACKUP, RESET)
   ================================================== */
function setupSystemTools() {
    const securityForm = document.getElementById("form-security");
    const exportBtn = document.getElementById("btn-export-backup");
    const importInput = document.getElementById("import-backup-file");
    const resetBtn = document.getElementById("btn-reset-system");

    if (securityForm) {
        securityForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const currentPass = document.getElementById("admin-current-password").value;
            const newPass = document.getElementById("admin-new-password").value;
            const confirmPass = document.getElementById("admin-confirm-password").value;

            if (newPass !== confirmPass) {
                alert("Les mots de passe ne correspondent pas.");
                return;
            }

            try {
                const result = await api("/api/auth/change-password", {
                    method: "POST",
                    body: { currentPassword: currentPass, newPassword: newPass }
                });
                if (result.token) setToken(result.token);
                securityForm.reset();
                showToast("Mot de passe modifié avec succès !");
            } catch (err) {
                alert(err.message);
            }
        });
    }

    if (exportBtn) {
        exportBtn.addEventListener("click", () => {
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(currentData, null, 2));
            const a = document.createElement("a");
            a.setAttribute("href", dataStr);
            a.setAttribute("download", `portfolio_gregorybaudin_${Date.now()}.json`);
            document.body.appendChild(a);
            a.click();
            a.remove();
            showToast("Sauvegarde exportée avec succès !");
        });
    }

    if (importInput) {
        importInput.addEventListener("change", (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = async (event) => {
                try {
                    const importedData = JSON.parse(event.target.result);
                    if (importedData.identity && importedData.apropos && importedData.projets) {
                        currentData = importedData;
                        await saveContent();
                        initDashboardData();
                        showToast("Sauvegarde importée et appliquée !");
                    } else {
                        alert("Le format du fichier JSON importé est invalide.");
                    }
                } catch (err) {
                    alert("Erreur lors de la lecture du fichier : " + err.message);
                }
            };
            reader.readAsText(file);
        });
    }

    if (resetBtn) {
        resetBtn.addEventListener("click", async () => {
            if (!confirm("Voulez-vous réinitialiser le site ? Toutes les modifications seront remplacées par les données d'origine.")) return;
            try {
                const result = await api("/api/content/reset", { method: "POST" });
                currentData = result.data;
                initDashboardData();
                showToast("Données réinitialisées avec succès !");
            } catch (err) { alert(err.message); }
        });
    }
}

/* ==================================================
   UTILITAIRES
   ================================================== */
function showToast(message) {
    const toast = document.getElementById("toast-notification");
    const msgEl = document.getElementById("toast-message");
    if (toast && msgEl) {
        msgEl.textContent = message;
        toast.classList.add("show");
        setTimeout(() => toast.classList.remove("show"), 3000);
    }
}
