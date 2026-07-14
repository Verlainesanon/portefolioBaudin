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
    setupThemeToggle(data.theme);
    applySeoSettings(data.seo);
    applySiteSettings(data.settings);
    trackVisit("home");

    // 3. Rendu de l'identité et du Hero
    renderIdentity(data.identity);

    // 4. Rendu de la section À Propos (Bio, Citation et Timeline)
    renderAbout(data.apropos, data.experiences, data.identity.profileImage);

    // 5. Rendu de la liste des projets (Asymétrique)
    renderProjects(data.projets);

    // 6. Rendu de la Galerie Masonry Globale
    renderMasonryGallery(data.projets);

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

    // Lien admin dans le menu
    if (settings.showAdminLink === false) {
        document.querySelectorAll(".admin-link-btn").forEach(a => { a.style.display = "none"; });
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

// Charge dynamiquement une police Google si elle n'est pas déjà présente
function ensureGoogleFont(fontName) {
    if (!fontName || ["Cormorant Garamond", "Inter"].includes(fontName)) return;
    const id = "gfont-" + fontName.replace(/\s+/g, "-").toLowerCase();
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontName).replace(/%20/g, "+")}:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap`;
    document.head.appendChild(link);
}

// Applique les couleurs et polices définies dans les données
function applyThemeSettings(theme) {
    if (!theme) return;
    const root = document.documentElement;
    if (theme.primaryColor) root.style.setProperty("--primary-color", theme.primaryColor);
    if (theme.secondaryColor) root.style.setProperty("--secondary-color", theme.secondaryColor);
    if (theme.accentColor) root.style.setProperty("--accent-color", theme.accentColor);
    if (theme.fontTitle) { ensureGoogleFont(theme.fontTitle); root.style.setProperty("--font-title", `'${theme.fontTitle}', serif`); }
    if (theme.fontBody) { ensureGoogleFont(theme.fontBody); root.style.setProperty("--font-body", `'${theme.fontBody}', sans-serif`); }

    // Gère la classe de thème sur le body
    const savedTheme = localStorage.getItem("portfolio_theme_mode");
    if (savedTheme === "dark" || (savedTheme === null && theme.darkMode === true)) {
        document.body.classList.add("dark-theme");
        updateThemeToggleIcons(true);
    } else {
        document.body.classList.remove("dark-theme");
        updateThemeToggleIcons(false);
    }
}

// Configure le bouton de bascule du mode clair / sombre
function setupThemeToggle(theme) {
    const toggleBtn = document.getElementById("theme-toggle-btn");
    const toggleBtnMobile = document.getElementById("theme-toggle-btn-mobile");

    const toggleFunction = () => {
        const isDark = document.body.classList.toggle("dark-theme");
        localStorage.setItem("portfolio_theme_mode", isDark ? "dark" : "light");
        updateThemeToggleIcons(isDark);
        showToast(isDark ? "Mode sombre activé" : "Mode clair activé");
    };

    if (toggleBtn) toggleBtn.addEventListener("click", toggleFunction);
    if (toggleBtnMobile) toggleBtnMobile.addEventListener("click", toggleFunction);
}

function updateThemeToggleIcons(isDark) {
    const icons = document.querySelectorAll(".theme-toggle-btn i");
    icons.forEach(icon => {
        if (isDark) {
            icon.className = "fa-solid fa-sun";
        } else {
            icon.className = "fa-solid fa-moon";
        }
    });
}

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
function renderMasonryGallery(projets) {
    const container = document.getElementById("galerie-masonry-container");
    if (!container) return;
    
    container.innerHTML = "";
    
    const allImages = [];
    
    projets.forEach(proj => {
        if (proj.images) {
            proj.images.forEach(img => {
                allImages.push({
                    url: img.url,
                    caption: img.caption || "",
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

    // Mélanger un peu les images pour l'esthétique ou les trier par projet
    allImages.forEach((img, idx) => {
        const item = document.createElement("div");
        item.className = "masonry-item";
        item.setAttribute("data-index", idx);
        
        item.innerHTML = `
            <img src="${img.url}" alt="${img.caption}" loading="lazy">
            <div class="masonry-caption-overlay">
                <h4 class="masonry-caption-title">${img.caption || img.projectTitle}</h4>
                <p class="masonry-caption-project" style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--accent-color); margin-top: 0.3rem;">${img.projectTitle}</p>
            </div>
        `;
        
        container.appendChild(item);
    });

    // Configuration de la Lightbox globale pour l'index
    setupGlobalLightbox(allImages);
}

// Visionneuse photo Lightbox sur la galerie globale
function setupGlobalLightbox(images) {
    const lightbox = document.getElementById("lightbox");
    const lightboxImg = document.getElementById("lightbox-img");
    const lightboxCaption = document.getElementById("lightbox-caption-text");
    const closeBtn = document.getElementById("lightbox-close-btn");
    const prevBtn = document.getElementById("lightbox-prev-btn");
    const nextBtn = document.getElementById("lightbox-next-btn");
    const items = document.querySelectorAll(".masonry-item");
    
    let currentIndex = 0;

    if (!lightbox || images.length === 0) return;

    const openLightbox = (index) => {
        currentIndex = parseInt(index);
        updateLightboxContent();
        lightbox.classList.add("open");
        lightbox.setAttribute("aria-hidden", "false");
        document.body.style.overflow = "hidden";
    };

    const closeLightbox = () => {
        lightbox.classList.remove("open");
        lightbox.setAttribute("aria-hidden", "true");
        document.body.style.overflow = "";
    };

    const updateLightboxContent = () => {
        const imgData = images[currentIndex];
        if (imgData) {
            lightboxImg.src = imgData.url;
            lightboxCaption.innerHTML = `<strong>${imgData.caption || imgData.projectTitle}</strong> <span style="margin: 0 0.5rem; color: var(--accent-color);">|</span> ${imgData.projectTitle}`;
        }
    };

    const showPrev = () => {
        currentIndex = (currentIndex - 1 + images.length) % images.length;
        updateLightboxContent();
    };

    const showNext = () => {
        currentIndex = (currentIndex + 1) % images.length;
        updateLightboxContent();
    };

    items.forEach(item => {
        item.addEventListener("click", () => {
            openLightbox(item.getAttribute("data-index"));
        });
    });

    closeBtn.addEventListener("click", closeLightbox);
    prevBtn.addEventListener("click", showPrev);
    nextBtn.addEventListener("click", showNext);

    lightbox.addEventListener("click", (e) => {
        if (e.target === lightbox || e.target === lightbox.querySelector('.lightbox-content')) {
            closeLightbox();
        }
    });

    document.addEventListener("keydown", (e) => {
        if (!lightbox.classList.contains("open")) return;
        if (e.key === "Escape") closeLightbox();
        else if (e.key === "ArrowLeft") showPrev();
        else if (e.key === "ArrowRight") showNext();
    });
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
    if (emailEl) {
        emailEl.href = `mailto:${contact.email}`;
        emailEl.textContent = contact.email;
    }
    if (phoneEl) {
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

// Affiche une notification toast rapide
function showToast(message) {
    // Crée le toast s'il n'existe pas (utile si importé sur index)
    let toast = document.getElementById("toast-notification");
    if (!toast) {
        toast = document.createElement("div");
        toast.id = "toast-notification";
        toast.className = "toast-notification";
        toast.innerHTML = `<i class="fa-solid fa-circle-check"></i> <span id="toast-message"></span>`;
        document.body.appendChild(toast);
        
        // CSS injecté dynamiquement si absent
        const style = document.createElement("style");
        style.textContent = `
            .toast-notification {
                position: fixed; bottom: 2rem; right: 2rem; background-color: var(--secondary-color);
                color: var(--primary-color); padding: 1rem 2rem; border-radius: 4px;
                display: flex; align-items: center; gap: 1rem; box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                z-index: 10000; transform: translateY(150%); transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                font-size: 0.9rem; font-family: var(--font-body); border-left: 3px solid var(--accent-color);
            }
            .toast-notification.show { transform: translateY(0); }
            .toast-notification i { color: var(--accent-color); font-size: 1.2rem; }
        `;
        document.head.appendChild(style);
    }
    
    const msgEl = document.getElementById("toast-message");
    if (msgEl) {
        msgEl.textContent = message;
        toast.classList.add("show");
        setTimeout(() => {
            toast.classList.remove("show");
        }, 3000);
    }
}
