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

    // 3bis. Comptage anonyme des visites
    try {
        const key = "gb_visit_project_" + new Date().toISOString().slice(0, 10);
        if (!sessionStorage.getItem(key)) {
            sessionStorage.setItem(key, "1");
            fetch("/api/stats/hit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ page: "project" })
            }).catch(() => {});
        }
    } catch { /* ignore */ }

    // 4. Remplissage des métadonnées SEO et Loader
    document.title = `${currentProject.titre} — ${data.identity.name}`;
    const loaderTitle = document.getElementById("loader-project-title");
    if (loaderTitle) {
        loaderTitle.textContent = currentProject.titre.toUpperCase();
    }

    // 5. Rendu du contenu textuel du projet
    renderProjectTexts(currentProject);

    // 5bis. Photo de couverture en arrière-plan du hero
    const heroBg = document.getElementById("project-hero-bg");
    if (heroBg && currentProject.images && currentProject.images.length > 0) {
        heroBg.style.backgroundImage = `url('${currentProject.images[0].url}')`;
    }

    // 6. Rendu de la fiche technique
    renderProjectSpecs(currentProject.fichetech);

    // 7. Rendu de la galerie photos (Masonry)
    renderProjectGallery(currentProject.images);

    // 8. Configuration de la Lightbox (module partagé js/theme-lightbox.js)
    setupSharedLightbox(currentProject.images, ".gallery-item", (imgData) => imgData.caption || "");

    // 9. Configuration des boutons Précédent / Suivant
    setupProjectNavigation(projets, projectIndex);
});

// (Thème et toggle : voir js/theme-lightbox.js)

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
            .map(para => `<p class="project-desc-para">${para.replace(/\n/g, "<br>")}</p>`)
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
            <div class="gallery-item-plate">
                <span class="plate-index">№ ${String(idx + 1).padStart(2, "0")}</span>
                <span class="plate-caption">${img.caption || ""}</span>
            </div>
        `;
        container.appendChild(item);
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
