/* --------------------------------------------------
   PORTFOLIO GREGORY BAUDIN — LOGIQUE D'ACCUEIL (JS)
   -------------------------------------------------- */

document.addEventListener("DOMContentLoaded", async () => {
    // 1. Initialisation des données depuis l'API sécurisée
    let data;
    try {
        data = await fetchPortfolioData();
    } catch (err) {
        console.error(err);
        document.body.classList.remove("loading");
        return;
    }

    // 2. Application du thème, du SEO et des réglages du site
    applyThemeSettings(data.theme);
    setupThemeToggle();
    applySeoSettings(data.seo);
    applySiteSettings(data.settings);
    trackVisit("home");

    // 3. Rendu de l'identité et du Hero
    renderIdentity(data.identity);

    // 4. Rendu de la section À Propos (Bio, Citation et Timeline)
    renderAbout(data.apropos, data.experiences, data.identity.profileImage);

    // 5. Rendu de la liste des projets (Asymétrique)
    renderProjects(data.projets);

    // 6. Rendu de la Galerie Masonry Globale (avec filtres/tri sur la page galerie)
    renderMasonryGallery(data.projets, data.settings);

    // 6bis. Rendu Presse, Témoignages & Services
    renderPresse(data.presse);
    renderTemoignages(data.temoignages);
    renderServices(data.services);

    // 7. Rendu des coordonnées de Contact & Réseaux
    renderContact(data.contact);

    // 8. Gestion du formulaire de contact
    setupContactForm();
});

// Applique les métadonnées SEO définies dans l'admin
function applySeoSettings(seo) {
    if (!seo) return;
    if (seo.metaTitle) document.title = seo.metaTitle;
    if (seo.metaDescription) {
        let meta = document.querySelector('meta[name="description"]');
        if (!meta) {
            meta = document.createElement("meta");
            meta.name = "description";
            document.head.appendChild(meta);
        }
        meta.content = seo.metaDescription;
    }
    if (seo.keywords) {
        let meta = document.querySelector('meta[name="keywords"]');
        if (!meta) {
            meta = document.createElement("meta");
            meta.name = "keywords";
            document.head.appendChild(meta);
        }
        meta.content = seo.keywords;
    }
}

// Applique les réglages du site (visibilité des sections, textes)
function applySiteSettings(settings) {
    if (!settings) return;
    const sections = settings.sections || {};
    const map = { apropos: "apropos.html", projets: "projets.html", galerie: "galerie.html", presse: "presse.html", temoignages: "temoignages.html", services: "services.html", contact: "contact.html" };

    Object.entries(map).forEach(([key, page]) => {
        if (sections[key] === false) {
            const section = document.getElementById(key);
            if (section) section.style.display = "none";
            document.querySelectorAll(`a[href="${page}"]`).forEach(a => { a.style.display = "none"; });
        }
    });

    // Texte d'intro de la galerie
    if (settings.galerieIntro) {
        const intro = document.querySelector(".galerie-intro");
        if (intro) intro.textContent = settings.galerieIntro;
    }

    // Texte du footer
    if (settings.footerText) {
        const footerSub = document.querySelector(".footer-sub");
        if (footerSub) footerSub.textContent = settings.footerText;
    }
}

// Comptage anonyme des visites (aucune donnée personnelle)
function trackVisit(page) {
    try {
        const key = "gb_visit_" + page + "_" + new Date().toISOString().slice(0, 10);
        if (sessionStorage.getItem(key)) return; // 1 hit par session/jour
        sessionStorage.setItem(key, "1");
        fetch("/api/stats/hit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ page })
        }).catch(() => {});
    } catch { /* ignore */ }
}

// (Thème, polices et toast : voir js/theme-lightbox.js)

// Remplissage du Hero avec l'effet cinématique
function renderIdentity(identity) {
    if (!identity) return;

    const nameEl = document.getElementById("hero-name-text");
    const titleEl = document.getElementById("hero-title-text");
    const accrocheEl = document.getElementById("hero-accroche-text");
    if (nameEl) nameEl.textContent = identity.name || "Gregory Baudin";
    if (titleEl) titleEl.textContent = identity.title || "Photographe Documentaire";
    if (accrocheEl) accrocheEl.textContent = identity.accroche ? `"${identity.accroche}"` : "";

    const heroBg = document.getElementById("hero-bg-img");
    if (heroBg && identity.heroImage) {
        heroBg.style.backgroundImage = `url('${identity.heroImage}')`;
    }
}

// Remplit la section À Propos
function renderAbout(apropos, experiences, profileImage) {
    if (!apropos) return;

    // Histoire (paragraphes)
    const bioContainer = document.getElementById("bio-text-content");
    if (bioContainer && apropos.histoire) {
        bioContainer.innerHTML = apropos.histoire
            .split("\n\n")
            .map(para => `<p>${para.replace(/\n/g, "<br>")}</p>`)
            .join("");
    }

    // Photo de profil
    const profileImg = document.getElementById("profile-img");
    if (profileImg && profileImage) {
        profileImg.src = profileImage;
    }

    // Timeline des expériences (épurée)
    const timelineContainer = document.getElementById("timeline-container");
    if (timelineContainer && experiences) {
        timelineContainer.innerHTML = "";
        
        experiences.forEach(exp => {
            const timelineItem = document.createElement("div");
            timelineItem.className = "timeline-clean-item";
            timelineItem.innerHTML = `
                <div class="timeline-clean-date">${exp.periode || ""}</div>
                <h4 class="timeline-clean-title">${exp.titre || ""}</h4>
                <p class="timeline-clean-desc">${exp.desc || ""}</p>
            `;
            timelineContainer.appendChild(timelineItem);
        });
    }
}

// Remplit la section projets au format asymétrique type reportage
function renderProjects(projets) {
    const projectsContainer = document.getElementById("projets-container");
    if (!projectsContainer) return;
    
    projectsContainer.innerHTML = "";
    
    if (!projets || projets.length === 0) {
        projectsContainer.innerHTML = `<p class="no-projects">Aucun reportage disponible pour le moment.</p>`;
        return;
    }

    projets.forEach((proj, index) => {
        const coverImage = (proj.images && proj.images.length > 0) ? proj.images[0].url : "assets/images/hero_bg.jpg";
        
        const row = document.createElement("article");
        row.className = "project-editorial-row";
        
        row.innerHTML = `
            <div class="project-editorial-visual-wrapper">
                <a href="project.html?id=${proj.id}" class="project-image-link">
                    <div class="project-editorial-image-container">
                        <img src="${coverImage}" alt="${proj.titre}" loading="lazy">
                    </div>
                </a>
            </div>
            <div class="project-editorial-info">
                <span class="project-editorial-meta">${proj.sousTitre || ""}</span>
                <h3 class="project-editorial-title">${proj.titre || ""}</h3>
                <p class="project-editorial-location"><i class="fa-solid fa-location-dot"></i> ${proj.lieu || ""}</p>
                <p class="project-editorial-desc">${proj.description ? proj.description.substring(0, 220) + '...' : ""}</p>
                <a href="project.html?id=${proj.id}" class="project-editorial-cta">Consulter le reportage <i class="fa-solid fa-arrow-right"></i></a>
            </div>
        `;
        
        projectsContainer.appendChild(row);
    });
}

// Récupère toutes les photos de tous les projets et les affiche dans la galerie globale Masonry
function renderMasonryGallery(projets, settings) {
    const container = document.getElementById("galerie-masonry-container");
    if (!container) return;

    const allImages = [];

    (projets || []).forEach(proj => {
        if (proj.images) {
            proj.images.forEach(img => {
                allImages.push({
                    url: img.url,
                    caption: img.caption || "",
                    titre: img.titre || "",
                    sousTitre: img.sousTitre || "",
                    date: img.date || "",
                    type: img.type || "",
                    lieu: img.lieu || "",
                    description: img.description || "",
                    projectTitle: proj.titre,
                    projectId: proj.id
                });
            });
        }
    });

    if (allImages.length === 0) {
        container.innerHTML = `<p class="no-images">Aucune photographie disponible.</p>`;
        return;
    }

    const displayName = (img) => img.titre || img.caption || img.projectTitle || "";

    const sorters = {
        defaut: (list) => list,
        date: (list) => [...list].sort((a, b) => {
            if (!a.date && !b.date) return 0;
            if (!a.date) return 1;
            if (!b.date) return -1;
            return b.date.localeCompare(a.date);
        }),
        nom: (list) => [...list].sort((a, b) => displayName(a).localeCompare(displayName(b), "fr")),
        type: (list) => [...list].sort((a, b) =>
            (a.type || "zzz").localeCompare(b.type || "zzz", "fr") || displayName(a).localeCompare(displayName(b), "fr"))
    };

    let currentType = "tous";
    let currentSort = (settings && settings.galerieSort) || "defaut";
    if (!sorters[currentSort]) currentSort = "defaut";

    const renderGrid = () => {
        const filtered = currentType === "tous" ? allImages : allImages.filter(i => i.type === currentType);
        const list = sorters[currentSort](filtered);

        container.innerHTML = "";
        if (list.length === 0) {
            container.innerHTML = `<p class="no-images">Aucune photographie pour ce filtre.</p>`;
            return;
        }

        list.forEach((img, idx) => {
            const item = document.createElement("div");
            item.className = "masonry-item";
            item.setAttribute("data-index", idx);

            const metaParts = [img.sousTitre, img.lieu, img.date ? new Date(img.date + "T00:00:00").toLocaleDateString("fr-FR", { year: "numeric", month: "long" }) : ""].filter(Boolean);
            item.innerHTML = `
                <img src="${img.url}" alt="${displayName(img)}" loading="lazy">
                <div class="masonry-caption-overlay">
                    <h4 class="masonry-caption-title">${displayName(img)}</h4>
                    <p class="masonry-caption-project">${metaParts.join(" — ") || img.projectTitle}</p>
                </div>
            `;
            container.appendChild(item);
        });

        // Lightbox recâblée sur la liste affichée (module partagé js/theme-lightbox.js)
        setupSharedLightbox(list, ".masonry-item", (imgData) => {
            const extra = [imgData.sousTitre, imgData.lieu, imgData.description].filter(Boolean).join(" — ");
            return `<strong>${displayName(imgData)}</strong>${extra ? ` <span class="lightbox-caption-sep">|</span> ${extra}` : ` <span class="lightbox-caption-sep">|</span> ${imgData.projectTitle}`}`;
        });
    };

    // Barre de filtres/tri (présente uniquement sur galerie.html)
    const typeFilters = document.getElementById("galerie-type-filters");
    const sortSelect = document.getElementById("galerie-sort-select");

    if (typeFilters) {
        const types = [...new Set(allImages.map(i => i.type).filter(Boolean))].sort((a, b) => a.localeCompare(b, "fr"));
        typeFilters.innerHTML = "";
        ["tous", ...types].forEach(t => {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "galerie-filter-btn" + (t === currentType ? " active" : "");
            btn.textContent = t === "tous" ? "Toutes" : t;
            btn.addEventListener("click", () => {
                currentType = t;
                typeFilters.querySelectorAll(".galerie-filter-btn").forEach(b => b.classList.toggle("active", b === btn));
                renderGrid();
            });
            typeFilters.appendChild(btn);
        });
        // Pas de types renseignés : filtres inutiles, on cache la rangée
        if (types.length === 0) typeFilters.style.display = "none";
    }

    if (sortSelect) {
        sortSelect.value = currentSort;
        sortSelect.addEventListener("change", () => {
            currentSort = sortSelect.value;
            renderGrid();
        });
    }

    renderGrid();
}

// Remplit la section Presse & Distinctions
function renderPresse(presse) {
    const container = document.getElementById("presse-container");
    if (!container) return;
    container.innerHTML = "";

    if (!presse || presse.length === 0) {
        container.innerHTML = `<p class="no-projects">Aucune mention presse pour le moment.</p>`;
        return;
    }

    presse.forEach(p => {
        const row = document.createElement("article");
        row.className = "presse-item";
        row.innerHTML = `
            <span class="presse-annee">${p.annee || ""}</span>
            <div class="presse-info">
                <span class="presse-media">${p.media || ""}</span>
                <h3 class="presse-titre">${p.lien && p.lien !== "#" ? `<a href="${p.lien}" target="_blank" rel="noopener noreferrer">${p.titre || ""}</a>` : (p.titre || "")}</h3>
            </div>
        `;
        container.appendChild(row);
    });
}

// Remplit la section Témoignages
function renderTemoignages(temoignages) {
    const container = document.getElementById("temoignages-container");
    if (!container) return;
    container.innerHTML = "";

    if (!temoignages || temoignages.length === 0) {
        container.innerHTML = `<p class="no-projects">Aucun témoignage pour le moment.</p>`;
        return;
    }

    temoignages.forEach(t => {
        const card = document.createElement("article");
        card.className = "temoignage-card";
        card.innerHTML = `
            <p class="temoignage-citation">"${t.citation || ""}"</p>
            <p class="temoignage-auteur"><strong>${t.nom || ""}</strong> — ${t.role || ""}</p>
        `;
        container.appendChild(card);
    });
}

// Remplit la section Services & Tarifs
function renderServices(services) {
    const container = document.getElementById("services-container");
    if (!container) return;
    container.innerHTML = "";

    if (!services || services.length === 0) {
        container.innerHTML = `<p class="no-projects">Aucun service renseigné pour le moment.</p>`;
        return;
    }

    services.forEach(s => {
        const card = document.createElement("article");
        card.className = "service-card";
        card.innerHTML = `
            <h3 class="service-titre">${s.titre || ""}</h3>
            <p class="service-desc">${s.description || ""}</p>
            <span class="service-prix">${s.prix || ""}</span>
        `;
        container.appendChild(card);
    });
}

// Remplit les coordonnées et les icônes de contact minimalistes
function renderContact(contact) {
    if (!contact) return;

    const emailEl = document.getElementById("contact-email");
    const phoneEl = document.getElementById("contact-phone");
    const addressEl = document.getElementById("contact-address");
    if (emailEl && contact.email) {
        emailEl.href = `mailto:${contact.email}`;
        emailEl.textContent = contact.email;
    }
    if (phoneEl && contact.telephone) {
        phoneEl.href = `tel:${contact.telephone.replace(/\s+/g, '')}`;
        phoneEl.textContent = contact.telephone;
    }
    if (addressEl) addressEl.textContent = contact.adresse;

    // Réseaux sociaux minimalistes
    const socialsContainer = document.getElementById("socials-container");
    if (socialsContainer && contact.socials) {
        socialsContainer.innerHTML = "";
        
        contact.socials.forEach(social => {
            if (!social.url || social.url === "#") return;
            
            const link = document.createElement("a");
            link.href = social.url;
            link.target = "_blank";
            link.rel = "noopener noreferrer";
            link.title = social.name;
            
            let iconClass = "fa-brands fa-link";
            const nameLower = social.name.toLowerCase();
            if (nameLower.includes("instagram")) iconClass = "fa-brands fa-instagram";
            else if (nameLower.includes("facebook")) iconClass = "fa-brands fa-facebook-f";
            else if (nameLower.includes("twitter") || nameLower.includes("x")) iconClass = "fa-brands fa-x-twitter";
            else if (nameLower.includes("linkedin")) iconClass = "fa-brands fa-linkedin-in";
            
            link.innerHTML = `<i class="${iconClass}"></i>`;
            socialsContainer.appendChild(link);
        });
    }
}

// Formulaire de contact — envoi réel vers l'API (messages consultables dans l'admin)
function setupContactForm() {
    const form = document.getElementById("portfolio-contact-form");
    const feedback = document.getElementById("form-success");
    
    if (form && feedback) {
        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            const submitBtn = form.querySelector(".submit-btn-editorial");
            const originalText = submitBtn.innerHTML;
            
            submitBtn.innerHTML = `Envoi en cours... <i class="fa-solid fa-circle-notch fa-spin"></i>`;
            submitBtn.disabled = true;
            
            try {
                const res = await fetch("/api/contact", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        name: document.getElementById("name").value,
                        email: document.getElementById("email-field").value,
                        message: document.getElementById("message").value
                    })
                });
                if (!res.ok) {
                    const errData = await res.json().catch(() => ({}));
                    throw new Error(errData.error || "Erreur lors de l'envoi.");
                }
                feedback.style.display = "block";
                feedback.textContent = "Message envoyé avec succès !";
                form.reset();
                setTimeout(() => { feedback.style.display = "none"; }, 5000);
            } catch (err) {
                feedback.style.display = "block";
                feedback.textContent = err.message;
                setTimeout(() => { feedback.style.display = "none"; }, 5000);
            } finally {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        });
    }
}
