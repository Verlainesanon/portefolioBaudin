/* --------------------------------------------------
   PORTFOLIO GREGORY BAUDIN — PAGE DE PROJET (JS)
   -------------------------------------------------- */

document.addEventListener("DOMContentLoaded", async () => {
    // 1. Extraction de l'ID du projet depuis l'URL
    const params = new URLSearchParams(window.location.search);
    const projectId = params.get("id");

    if (!projectId) {
        window.location.href = "index.html";
        return;
    }

    // 2. Récupération de la base de données via l'API sécurisée
    let data;
    try {
        data = await fetchPortfolioData();
    } catch (err) {
        console.error(err);
        window.location.href = "index.html";
        return;
    }
    const projets = data.projets || [];
    
    // Recherche du projet actuel
    const projectIndex = projets.findIndex(p => p.id === projectId);
    if (projectIndex === -1) {
        window.location.href = "index.html";
        return;
    }
    
    const currentProject = projets[projectIndex];

    // 3. Application du thème graphique & Toggle Thème
    applyThemeSettings(data.theme);
    setupThemeToggle();

    // 4. Remplissage des métadonnées SEO et Loader
    document.title = `${currentProject.titre} — ${data.identity.name}`;
    const loaderTitle = document.getElementById("loader-project-title");
    if (loaderTitle) {
        loaderTitle.textContent = currentProject.titre.toUpperCase();
    }

    // 5. Rendu du contenu textuel du projet
    renderProjectTexts(currentProject);

    // 6. Rendu de la fiche technique
    renderProjectSpecs(currentProject.fichetech);

    // 7. Rendu de la galerie photos (Masonry)
    renderProjectGallery(currentProject.images);

    // 8. Configuration de la Lightbox
    setupLightbox(currentProject.images);

    // 9. Configuration des boutons Précédent / Suivant
    setupProjectNavigation(projets, projectIndex);
});

// Applique le thème à la page projet
function applyThemeSettings(theme) {
    if (!theme) return;
    const root = document.documentElement;
    if (theme.primaryColor) root.style.setProperty("--primary-color", theme.primaryColor);
    if (theme.secondaryColor) root.style.setProperty("--secondary-color", theme.secondaryColor);
    if (theme.accentColor) root.style.setProperty("--accent-color", theme.accentColor);
    if (theme.fontTitle) root.style.setProperty("--font-title", `'${theme.fontTitle}', serif`);
    if (theme.fontBody) root.style.setProperty("--font-body", `'${theme.fontBody}', sans-serif`);

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

// Bouton de toggle mode nuit sur la page projet
function setupThemeToggle() {
    const toggleBtn = document.getElementById("theme-toggle-btn");
    if (toggleBtn) {
        toggleBtn.addEventListener("click", () => {
            const isDark = document.body.classList.toggle("dark-theme");
            localStorage.setItem("portfolio_theme_mode", isDark ? "dark" : "light");
            updateThemeToggleIcons(isDark);
        });
    }
}

function updateThemeToggleIcons(isDark) {
    const icon = document.querySelector(".theme-toggle-btn i");
    if (icon) {
        icon.className = isDark ? "fa-solid fa-sun" : "fa-solid fa-moon";
    }
}

// Remplit les textes de description
function renderProjectTexts(project) {
    document.getElementById("project-category-text").textContent = project.sousTitre || "";
    document.getElementById("project-location-text").innerHTML = `<i class="fa-solid fa-location-dot"></i> ${project.lieu || ""}`;
    document.getElementById("project-title-text").textContent = project.titre || "";
    
    // Description en paragraphes
    const descTextContainer = document.getElementById("project-desc-text");
    if (descTextContainer && project.description) {
        descTextContainer.innerHTML = project.description
            .split("\n\n")
            .map(para => `<p style="margin-bottom: 1.5rem;">${para.replace(/\n/g, "<br>")}</p>`)
            .join("");
    }

    // Citation de reportage
    const quoteContainer = document.getElementById("project-quote-container");
    const quoteText = document.getElementById("project-quote-text-element");
    
    // Utilise une citation par défaut ou une légende s'il n'y a pas de citation enregistrée
    if (quoteText) {
        if (project.citation) {
            quoteText.textContent = `"${project.citation}"`;
        } else if (project.images && project.images.length > 0) {
            quoteText.textContent = `"${project.images[0].caption || 'Témoignage en image par Gregory Baudin.'}"`;
        } else {
            quoteContainer.style.display = "none";
        }
    }
}

// Génère les spécifications techniques
function renderProjectSpecs(fichetech) {
    const table = document.getElementById("project-specs-table");
    if (!table) return;
    
    table.innerHTML = "";
    
    if (!fichetech || fichetech.length === 0) {
        const row = document.createElement("tr");
        row.innerHTML = `<td colspan="2" class="spec-val">Aucune information technique renseignée.</td>`;
        table.appendChild(row);
        return;
    }

    fichetech.forEach(spec => {
        if (!spec.label || !spec.value) return;
        const row = document.createElement("tr");
        row.innerHTML = `
            <td class="spec-label">${spec.label}</td>
            <td class="spec-val">${spec.value}</td>
        `;
        table.appendChild(row);
    });
}

// Rendu des photos du projet dans la grille Masonry
function renderProjectGallery(images) {
    const container = document.getElementById("project-gallery-container");
    if (!container) return;
    
    container.innerHTML = "";
    
    if (!images || images.length === 0) {
        container.innerHTML = `<p class="no-images">Aucune photo dans cette série.</p>`;
        return;
    }

    images.forEach((img, idx) => {
        const item = document.createElement("div");
        item.className = "gallery-item";
        item.setAttribute("data-index", idx);
        item.innerHTML = `
            <img src="${img.url}" alt="${img.caption || ''}" loading="lazy">
        `;
        container.appendChild(item);
    });
}

// Visionneuse photo Lightbox (avec navigation de la série)
function setupLightbox(images) {
    const lightbox = document.getElementById("lightbox");
    const lightboxImg = document.getElementById("lightbox-img");
    const lightboxCaption = document.getElementById("lightbox-caption-text");
    const closeBtn = document.getElementById("lightbox-close-btn");
    const prevBtn = document.getElementById("lightbox-prev-btn");
    const nextBtn = document.getElementById("lightbox-next-btn");
    const items = document.querySelectorAll(".gallery-item");
    
    let currentIndex = 0;

    if (!lightbox || !images || images.length === 0) return;

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
            lightboxCaption.textContent = imgData.caption || "";
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

// Navigation entre projets
function setupProjectNavigation(projets, currentIndex) {
    const prevBtn = document.getElementById("prev-project-btn");
    const nextBtn = document.getElementById("next-project-btn");
    
    if (projets.length <= 1) {
        if (prevBtn) prevBtn.style.display = "none";
        if (nextBtn) nextBtn.style.display = "none";
        return;
    }

    const prevIdx = (currentIndex - 1 + projets.length) % projets.length;
    const nextIdx = (currentIndex + 1) % projets.length;

    const prevProject = projets[prevIdx];
    const nextProject = projets[nextIdx];

    if (prevBtn && prevProject) {
        prevBtn.href = `project.html?id=${prevProject.id}`;
        document.getElementById("prev-project-title").textContent = prevProject.titre;
    }

    if (nextBtn && nextProject) {
        nextBtn.href = `project.html?id=${nextProject.id}`;
        document.getElementById("next-project-title").textContent = nextProject.titre;
    }
}
