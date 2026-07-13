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
    await api("/api/content", { method: "PUT", body: currentData });
}

document.addEventListener("DOMContentLoaded", () => {
    checkSession();
    setupLogin();
    setupTabs();
    setupIdentityForm();
    setupAboutForm();
    setupProjectsCRUD();
    setupContactForm();
    setupMessagesTab();
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
    initDashboardData();
    refreshMessages();
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
            if (tab.getAttribute("data-target") === "tab-messages") refreshMessages();
        });
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

    document.getElementById("preview-hero-bg").src = currentData.identity?.heroImage || "";
    document.getElementById("preview-profile-img").src = currentData.identity?.profileImage || "";

    // Tab 2 : À Propos & Timeline
    document.getElementById("bio-histoire").value = currentData.apropos?.histoire || "";
    document.getElementById("bio-approche").value = currentData.apropos?.approche || "";
    document.getElementById("bio-citation").value = currentData.apropos?.citation || "";
    renderExperiencesList();

    // Tab 3 : Projets
    renderProjectsList();

    // Tab 4 : Contact
    document.getElementById("contact-email-input").value = currentData.contact?.email || "";
    document.getElementById("contact-phone-input").value = currentData.contact?.telephone || "";
    document.getElementById("contact-address-input").value = currentData.contact?.adresse || "";
    document.getElementById("contact-pitch-input").value = currentData.apropos?.approche || "";
    renderSocialsList();
}

/* ==================================================
   3. UPLOAD D'IMAGES SÉCURISÉ (serveur)
   ================================================== */
async function uploadImages(files) {
    const formData = new FormData();
    Array.from(files).forEach(f => formData.append("images", f));
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

            try {
                await saveContent();
                showToast("Identité et thème sauvegardés !");
            } catch (err) { alert(err.message); }
        });
    }
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
                const caption = card.querySelector(".photo-caption-input").value;
                const img = project.images.find(i => i.url === imgUrl);
                if (img) img.caption = caption;
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
                uploaded.forEach(f => project.images.push({ url: f.url, caption: "" }));
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
            <input type="text" class="photo-caption-input" placeholder="Légende de l'image">
            <button type="button" class="delete-photo-btn" title="Supprimer la photo"><i class="fa-solid fa-trash"></i></button>
        `;
        card.querySelector("img").src = img.url;
        card.querySelector(".photo-caption-input").value = img.caption || "";

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
