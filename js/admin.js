/* --------------------------------------------------
   ADMINISTRATION GREGORY BAUDIN — LOGIQUE DU TABLEAU DE BORD
   -------------------------------------------------- */

// Données en cours d'édition dans l'admin
let currentData = {};
let selectedProjectId = null;

// Mot de passe par défaut
const DEFAULT_ADMIN_PASSWORD = "admin";

document.addEventListener("DOMContentLoaded", () => {
    // 1. Initialisation de la base locale
    currentData = getPortfolioData();
    if (!localStorage.getItem("portfolio_admin_password")) {
        localStorage.setItem("portfolio_admin_password", DEFAULT_ADMIN_PASSWORD);
    }

    // 2. Gestion de la connexion
    checkSession();
    setupLogin();

    // 3. Navigation par Onglets
    setupTabs();

    // 4. Formulaire 1 : Identité & Thème
    setupIdentityForm();

    // 5. Formulaire 2 : À Propos & Timeline
    setupAboutForm();

    // 6. Gestionnaire de Projets (CRUD)
    setupProjectsCRUD();

    // 7. Formulaire 4 : Contacts & Réseaux
    setupContactForm();

    // 8. Outils Systèmes (Backup, Mot de passe, Reset)
    setupSystemTools();
});

/* ==================================================
   1. SÉCURITÉ ET ACCÈS (LOGIN / DECO)
   ================================================== */
function checkSession() {
    const isConnected = sessionStorage.getItem("admin_logged_in") === "true";
    const loginScreen = document.getElementById("admin-login-screen");
    const dashboard = document.getElementById("admin-dashboard");

    if (isConnected) {
        loginScreen.style.display = "none";
        dashboard.style.display = "flex";
        initDashboardData();
    } else {
        loginScreen.style.display = "flex";
        dashboard.style.display = "none";
    }
}

function setupLogin() {
    const form = document.getElementById("login-form");
    const errorMsg = document.getElementById("login-error-msg");

    if (form) {
        form.addEventListener("submit", (e) => {
            e.preventDefault();
            const inputPass = document.getElementById("admin-password").value;
            const actualPass = localStorage.getItem("portfolio_admin_password");

            if (inputPass === actualPass) {
                sessionStorage.setItem("admin_logged_in", "true");
                errorMsg.style.display = "none";
                document.getElementById("admin-password").value = "";
                checkSession();
                showToast("Connexion réussie !");
            } else {
                errorMsg.style.display = "block";
            }
        });
    }

    // Déconnexion
    const logoutBtn = document.getElementById("admin-logout-btn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            sessionStorage.removeItem("admin_logged_in");
            checkSession();
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
            const target = tab.getAttribute("data-target");
            document.getElementById(target).classList.add("active");
            
            // Met à jour le titre de l'en-tête
            titleEl.textContent = tab.textContent.trim();
        });
    });
}

// Initialise les formulaires avec les données actuelles
function initDashboardData() {
    // Tab 1 : Identité
    document.getElementById("id-name").value = currentData.identity.name || "";
    document.getElementById("id-title").value = currentData.identity.title || "";
    document.getElementById("id-accroche").value = currentData.identity.accroche || "";
    
    document.getElementById("theme-primary").value = currentData.theme.primaryColor || "#0a0a0a";
    document.getElementById("theme-secondary").value = currentData.theme.secondaryColor || "#f5f0e8";
    document.getElementById("theme-accent").value = currentData.theme.accentColor || "#c9a84c";
    document.getElementById("theme-darkmode").checked = currentData.theme.darkMode !== false;

    document.getElementById("preview-hero-bg").src = currentData.identity.heroImage || "";
    document.getElementById("preview-profile-img").src = currentData.identity.profileImage || "";

    // Tab 2 : À Propos & Timeline
    document.getElementById("bio-histoire").value = currentData.apropos.histoire || "";
    document.getElementById("bio-approche").value = currentData.apropos.approche || "";
    document.getElementById("bio-citation").value = currentData.apropos.citation || "";
    renderExperiencesList();

    // Tab 3 : Projets
    renderProjectsList();

    // Tab 4 : Contact
    document.getElementById("contact-email-input").value = currentData.contact.email || "";
    document.getElementById("contact-phone-input").value = currentData.contact.telephone || "";
    document.getElementById("contact-address-input").value = currentData.contact.adresse || "";
    document.getElementById("contact-pitch-input").value = currentData.apropos.approche || "";
    renderSocialsList();
}

/* ==================================================
   3. FORMULAIRE : IDENTITÉ & THÈME
   ================================================== */
function setupIdentityForm() {
    const form = document.getElementById("form-identity");
    
    // Uploads images en Base64
    setupImageUpload("upload-hero-bg", "preview-hero-bg", (base64) => {
        currentData.identity.heroImage = base64;
    });

    setupImageUpload("upload-profile", "preview-profile-img", (base64) => {
        currentData.identity.profileImage = base64;
    });

    if (form) {
        form.addEventListener("submit", (e) => {
            e.preventDefault();
            
            // Textes
            currentData.identity.name = document.getElementById("id-name").value;
            currentData.identity.title = document.getElementById("id-title").value;
            currentData.identity.accroche = document.getElementById("id-accroche").value;

            // Thème
            currentData.theme.primaryColor = document.getElementById("theme-primary").value;
            currentData.theme.secondaryColor = document.getElementById("theme-secondary").value;
            currentData.theme.accentColor = document.getElementById("theme-accent").value;
            currentData.theme.darkMode = document.getElementById("theme-darkmode").checked;

            savePortfolioData(currentData);
            showToast("Identité et thème sauvegardés !");
        });
    }
}

// Convertit un fichier sélectionné en base64 pour affichage et sauvegarde locale
function setupImageUpload(inputId, previewId, callback) {
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);

    if (input && preview) {
        input.addEventListener("change", (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    preview.src = event.target.result;
                    callback(event.target.result);
                };
                reader.readAsDataURL(file);
            }
        });
    }
}

/* ==================================================
   4. À PROPOS & TIMELINE EXPÉRIENCES
   ================================================== */
function setupAboutForm() {
    const form = document.getElementById("form-apropos");
    const addExpBtn = document.getElementById("add-exp-btn");

    if (form) {
        form.addEventListener("submit", (e) => {
            e.preventDefault();
            
            // Sauvegarde des textes
            currentData.apropos.histoire = document.getElementById("bio-histoire").value;
            currentData.apropos.approche = document.getElementById("bio-approche").value;
            currentData.apropos.citation = document.getElementById("bio-citation").value;

            // Sauvegarde des expériences
            const expCards = document.querySelectorAll(".exp-item-card");
            const newExperiences = [];

            expCards.forEach(card => {
                const id = card.getAttribute("data-id");
                const periode = card.querySelector(".exp-period").value;
                const titre = card.querySelector(".exp-title").value;
                const desc = card.querySelector(".exp-desc").value;

                newExperiences.push({ id, periode, titre, desc });
            });

            currentData.experiences = newExperiences;
            savePortfolioData(currentData);
            showToast("À Propos et timeline sauvegardés !");
        });
    }

    if (addExpBtn) {
        addExpBtn.addEventListener("click", () => {
            const newId = "exp_" + Date.now();
            const exp = { id: newId, periode: "Nouvelle date", titre: "Nouveau titre", desc: "Description de l'expérience" };
            currentData.experiences.push(exp);
            renderExperiencesList();
        });
    }
}

// Rendu interactif de la liste des expériences
function renderExperiencesList() {
    const container = document.getElementById("exp-items-container");
    if (!container) return;

    container.innerHTML = "";

    currentData.experiences.forEach((exp, idx) => {
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
                    <input type="text" class="exp-period" value="${exp.periode || ''}" required>
                </div>
                <div class="form-group">
                    <label>Titre de l'expérience</label>
                    <input type="text" class="exp-title" value="${exp.titre || ''}" required>
                </div>
                <div class="form-group full-field">
                    <label>Description des réalisations</label>
                    <textarea class="exp-desc" rows="3" required>${exp.desc || ''}</textarea>
                </div>
            </div>
        `;
        container.appendChild(item);
    });

    setupExperiencesListEvents();
}

// Relie les boutons monter/descendre/supprimer de la timeline
function setupExperiencesListEvents() {
    const container = document.getElementById("exp-items-container");
    
    // Supprimer
    container.querySelectorAll(".delete-exp-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const card = e.target.closest(".exp-item-card");
            const id = card.getAttribute("data-id");
            currentData.experiences = currentData.experiences.filter(exp => exp.id !== id);
            renderExperiencesList();
        });
    });

    // Monter
    container.querySelectorAll(".move-up-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const card = e.target.closest(".exp-item-card");
            const id = card.getAttribute("data-id");
            const index = currentData.experiences.findIndex(exp => exp.id === id);
            if (index > 0) {
                const temp = currentData.experiences[index];
                currentData.experiences[index] = currentData.experiences[index - 1];
                currentData.experiences[index - 1] = temp;
                renderExperiencesList();
            }
        });
    });

    // Descendre
    container.querySelectorAll(".move-down-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const card = e.target.closest(".exp-item-card");
            const id = card.getAttribute("data-id");
            const index = currentData.experiences.findIndex(exp => exp.id === id);
            if (index < currentData.experiences.length - 1) {
                const temp = currentData.experiences[index];
                currentData.experiences[index] = currentData.experiences[index + 1];
                currentData.experiences[index + 1] = temp;
                renderExperiencesList();
            }
        });
    });
}

/* ==================================================
   5. CRUD PROJETS (CRÉATION, MODIF, SUPPRESSION)
   ================================================== */
function setupProjectsCRUD() {
    const createBtn = document.getElementById("create-new-project-btn");
    const editForm = document.getElementById("form-project-edit");
    const deleteBtn = document.getElementById("delete-current-project-btn");
    const addSpecBtn = document.getElementById("add-spec-field-btn");
    const photoUploadInput = document.getElementById("add-project-photos-input");

    // Créer un nouveau projet
    if (createBtn) {
        createBtn.addEventListener("click", () => {
            const newProjId = "proj_" + Date.now();
            const newProj = {
                id: newProjId,
                titre: "Nouveau Projet",
                sousTitre: "Catégorie",
                lieu: "Lieu",
                description: "Description de la démarche artistique.",
                fichetech: [
                    { label: "Type de projet", value: "Photographie" }
                ],
                images: []
            };
            currentData.projets.push(newProj);
            savePortfolioData(currentData);
            renderProjectsList();
            selectProject(newProjId);
            showToast("Nouveau projet créé !");
        });
    }

    // Sauvegarder les modifications du projet actuel
    if (editForm) {
        editForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const id = document.getElementById("edit-project-id").value;
            const project = currentData.projets.find(p => p.id === id);

            if (project) {
                project.titre = document.getElementById("project-name-edit").value;
                project.sousTitre = document.getElementById("project-subtitle-edit").value;
                project.lieu = document.getElementById("project-location-edit").value;
                project.description = document.getElementById("project-desc-edit").value;

                // Fiche technique
                const specs = [];
                document.querySelectorAll(".spec-editor-row").forEach(row => {
                    const label = row.querySelector(".spec-label-input").value;
                    const value = row.querySelector(".spec-val-input").value;
                    if (label && value) {
                        specs.push({ label, value });
                    }
                });
                project.fichetech = specs;

                // Légendes des photos de la galerie
                document.querySelectorAll(".gallery-thumb-card").forEach(card => {
                    const imgUrl = card.getAttribute("data-url");
                    const caption = card.querySelector(".photo-caption-input").value;
                    const img = project.images.find(i => i.url === imgUrl);
                    if (img) {
                        img.caption = caption;
                    }
                });

                savePortfolioData(currentData);
                renderProjectsList();
                showToast("Projet sauvegardé !");
            }
        });
    }

    // Supprimer le projet sélectionné
    if (deleteBtn) {
        deleteBtn.addEventListener("click", () => {
            if (confirm("Êtes-vous sûr de vouloir supprimer ce projet ? Cette action est irréversible.")) {
                currentData.projets = currentData.projets.filter(p => p.id !== selectedProjectId);
                savePortfolioData(currentData);
                selectedProjectId = null;
                renderProjectsList();
                
                // Hide editor
                document.getElementById("project-editor-container").style.display = "none";
                document.getElementById("project-editor-placeholder").style.display = "flex";
                showToast("Projet supprimé !");
            }
        });
    }

    // Ajouter un champ personnalisé à la fiche technique
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
            
            // Relier le bouton de suppression sur le nouveau champ
            row.querySelector(".delete-spec-btn").addEventListener("click", () => {
                row.remove();
            });
        });
    }

    // Ajout de photos de projet (Base64 multiples)
    if (photoUploadInput) {
        photoUploadInput.addEventListener("change", (e) => {
            const files = Array.from(e.target.files);
            const project = currentData.projets.find(p => p.id === selectedProjectId);
            
            if (!project) return;
            
            let loadedCount = 0;
            files.forEach(file => {
                const reader = new FileReader();
                reader.onload = (event) => {
                    project.images.push({
                        url: event.target.result,
                        caption: ""
                    });
                    
                    loadedCount++;
                    if (loadedCount === files.length) {
                        savePortfolioData(currentData);
                        renderProjectGalleryEditor(project.images);
                        showToast(`${files.length} photo(s) ajoutée(s) !`);
                    }
                };
                reader.readAsDataURL(file);
            });
        });
    }
}

// Rendu de la barre latérale des projets
function renderProjectsList() {
    const container = document.getElementById("projects-list-container");
    if (!container) return;

    container.innerHTML = "";

    currentData.projets.forEach(proj => {
        const item = document.createElement("li");
        item.className = `project-item-row ${selectedProjectId === proj.id ? 'active' : ''}`;
        item.innerHTML = `
            <div class="project-row-info">
                <h4>${proj.titre}</h4>
                <p>${proj.sousTitre} • ${proj.lieu}</p>
            </div>
            <i class="fa-solid fa-chevron-right"></i>
        `;
        
        item.addEventListener("click", () => {
            selectProject(proj.id);
        });

        container.appendChild(item);
    });
}

// Sélectionne et charge un projet dans le formulaire d'édition
function selectProject(id) {
    selectedProjectId = id;
    
    // Activer l'affichage du formulaire
    document.getElementById("project-editor-placeholder").style.display = "none";
    document.getElementById("project-editor-container").style.display = "block";
    
    // Mettre à jour la classe active sur la liste
    const items = document.querySelectorAll(".project-item-row");
    const projets = currentData.projets || [];
    const index = projets.findIndex(p => p.id === id);
    
    items.forEach((item, idx) => {
        item.classList.remove("active");
        if (projets[idx] && projets[idx].id === id) {
            item.classList.add("active");
        }
    });

    const project = projets[index];
    
    // Remplir le formulaire
    document.getElementById("edit-project-id").value = project.id;
    document.getElementById("project-name-edit").value = project.titre || "";
    document.getElementById("project-subtitle-edit").value = project.sousTitre || "";
    document.getElementById("project-location-edit").value = project.lieu || "";
    document.getElementById("project-desc-edit").value = project.description || "";

    // Fiche technique
    renderProjectSpecsEditor(project.fichetech);

    // Galerie photos
    renderProjectGalleryEditor(project.images);
}

// Construit l'éditeur de fiche technique pour le projet sélectionné
function renderProjectSpecsEditor(specs) {
    const container = document.getElementById("project-specs-editor-container");
    if (!container) return;

    container.innerHTML = "";

    if (specs) {
        specs.forEach(spec => {
            const row = document.createElement("div");
            row.className = "spec-editor-row";
            row.innerHTML = `
                <input type="text" class="spec-label-input" value="${spec.label}" placeholder="Caractéristique" required>
                <input type="text" class="spec-val-input" value="${spec.value}" placeholder="Détail" required>
                <button type="button" class="admin-btn danger-btn btn-sm delete-spec-btn"><i class="fa-solid fa-trash"></i></button>
            `;
            
            row.querySelector(".delete-spec-btn").addEventListener("click", () => {
                row.remove();
            });

            container.appendChild(row);
        });
    }
}

// Construit la liste d'images avec légendes et boutons de suppression
function renderProjectGalleryEditor(images) {
    const container = document.getElementById("project-gallery-editor-container");
    if (!container) return;

    container.innerHTML = "";

    if (images) {
        images.forEach(img => {
            const card = document.createElement("div");
            card.className = "gallery-thumb-card";
            card.setAttribute("data-url", img.url);
            card.innerHTML = `
                <div class="thumb-image-wrapper">
                    <img src="${img.url}" alt="Miniature">
                </div>
                <input type="text" class="photo-caption-input" value="${img.caption || ''}" placeholder="Légende de l'image">
                <button type="button" class="delete-photo-btn" title="Supprimer la photo"><i class="fa-solid fa-trash"></i></button>
            `;

            // Bouton de suppression de l'image
            card.querySelector(".delete-photo-btn").addEventListener("click", () => {
                const project = currentData.projets.find(p => p.id === selectedProjectId);
                if (project) {
                    project.images = project.images.filter(i => i.url !== img.url);
                    savePortfolioData(currentData);
                    renderProjectGalleryEditor(project.images);
                    showToast("Photo retirée !");
                }
            });

            container.appendChild(card);
        });
    }
}

/* ==================================================
   6. CONTACT ET RÉSEAUX SOCIAUX
   ================================================== */
function setupContactForm() {
    const form = document.getElementById("form-contact");
    const addSocialBtn = document.getElementById("add-social-btn");

    if (form) {
        form.addEventListener("submit", (e) => {
            e.preventDefault();
            
            // Sauvegarde coordonnées
            currentData.contact.email = document.getElementById("contact-email-input").value;
            currentData.contact.telephone = document.getElementById("contact-phone-input").value;
            currentData.contact.adresse = document.getElementById("contact-address-input").value;

            // Sauvegarde de l'approche (liée aussi au texte de contact)
            currentData.apropos.approche = document.getElementById("contact-pitch-input").value;

            // Sauvegarde réseaux
            const socialRows = document.querySelectorAll(".social-item-row");
            const newSocials = [];

            socialRows.forEach(row => {
                const name = row.querySelector(".social-name-select").value;
                const url = row.querySelector(".social-url-input").value;
                if (name && url) {
                    newSocials.push({ name, url });
                }
            });

            currentData.contact.socials = newSocials;
            savePortfolioData(currentData);
            showToast("Contacts sauvegardés !");
        });
    }

    if (addSocialBtn) {
        addSocialBtn.addEventListener("click", () => {
            currentData.contact.socials.push({ name: "Instagram", url: "https://" });
            renderSocialsList();
        });
    }
}

// Rendu de l'éditeur des réseaux sociaux
function renderSocialsList() {
    const container = document.getElementById("social-items-container");
    if (!container) return;

    container.innerHTML = "";

    currentData.contact.socials.forEach((social, idx) => {
        const row = document.createElement("div");
        row.className = "social-item-row";
        row.innerHTML = `
            <select class="social-name-select">
                <option value="Instagram" ${social.name === 'Instagram' ? 'selected' : ''}>Instagram</option>
                <option value="Facebook" ${social.name === 'Facebook' ? 'selected' : ''}>Facebook</option>
                <option value="Twitter / X" ${social.name === 'Twitter / X' ? 'selected' : ''}>Twitter / X</option>
                <option value="LinkedIn" ${social.name === 'LinkedIn' ? 'selected' : ''}>LinkedIn</option>
                <option value="Flickr" ${social.name === 'Flickr' ? 'selected' : ''}>Flickr</option>
            </select>
            <input type="text" class="social-url-input" value="${social.url || ''}" placeholder="Lien du profil (ex: https://instagram.com/pseudo)" required>
            <button type="button" class="admin-btn danger-btn btn-sm delete-social-btn" title="Supprimer"><i class="fa-solid fa-trash-can"></i></button>
        `;

        row.querySelector(".delete-social-btn").addEventListener("click", () => {
            currentData.contact.socials.splice(idx, 1);
            renderSocialsList();
        });

        container.appendChild(row);
    });
}

/* ==================================================
   7. OUTILS COMPLÉMENTAIRES (MOT DE PASSE, BACKUP, RESET)
   ================================================== */
function setupSystemTools() {
    const securityForm = document.getElementById("form-security");
    const exportBtn = document.getElementById("btn-export-backup");
    const importInput = document.getElementById("import-backup-file");
    const resetBtn = document.getElementById("btn-reset-system");

    // Modifier le mot de passe
    if (securityForm) {
        securityForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const newPass = document.getElementById("admin-new-password").value;
            const confirmPass = document.getElementById("admin-confirm-password").value;

            if (newPass === confirmPass) {
                localStorage.setItem("portfolio_admin_password", newPass);
                document.getElementById("admin-new-password").value = "";
                document.getElementById("admin-confirm-password").value = "";
                showToast("Mot de passe modifié !");
            } else {
                alert("Les mots de passe ne correspondent pas.");
            }
        });
    }

    // Exporter la base locale en JSON
    if (exportBtn) {
        exportBtn.addEventListener("click", () => {
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(currentData, null, 2));
            const downloadAnchor = document.createElement('a');
            downloadAnchor.setAttribute("href", dataStr);
            downloadAnchor.setAttribute("download", `portfolio_gregorybaudin_${Date.now()}.json`);
            document.body.appendChild(downloadAnchor);
            downloadAnchor.click();
            downloadAnchor.remove();
            showToast("Sauvegarde exportée avec succès !");
        });
    }

    // Importer une sauvegarde JSON
    if (importInput) {
        importInput.addEventListener("change", (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    try {
                        const importedData = JSON.parse(event.target.result);
                        
                        // Validation simple de la structure
                        if (importedData.identity && importedData.apropos && importedData.projets) {
                            savePortfolioData(importedData);
                            currentData = importedData;
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
            }
        });
    }

    // Réinitialiser le système aux données du PDF
    if (resetBtn) {
        resetBtn.addEventListener("click", () => {
            if (confirm("Voulez-vous réinitialiser le site ? Toutes les modifications apportées depuis l'admin seront remplacées par les textes et images initiaux du PDF.")) {
                localStorage.removeItem("portfolio_baudin_data");
                localStorage.setItem("portfolio_admin_password", DEFAULT_ADMIN_PASSWORD);
                currentData = getPortfolioData();
                initDashboardData();
                showToast("Données réinitialisées avec succès !");
            }
        });
    }
}

/* ==================================================
   UTILITAIRES GENERAUX
   ================================================== */
function showToast(message) {
    const toast = document.getElementById("toast-notification");
    const msgEl = document.getElementById("toast-message");

    if (toast && msgEl) {
        msgEl.textContent = message;
        toast.classList.add("show");

        setTimeout(() => {
            toast.classList.remove("show");
        }, 3000);
    }
}
