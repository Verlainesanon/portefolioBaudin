/* --------------------------------------------------
   PORTFOLIO GREGORY BAUDIN — MODULE PARTAGÉ
   Thème (clair/sombre), toast et visionneuse Lightbox
   utilisés par portfolio.js et project-detail.js
   -------------------------------------------------- */

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

// Configure les boutons de bascule du mode clair / sombre (desktop + mobile)
function setupThemeToggle() {
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
        icon.className = isDark ? "fa-solid fa-sun" : "fa-solid fa-moon";
    });
}

// Affiche une notification toast rapide (styles dans css/style.css)
function showToast(message) {
    let toast = document.getElementById("toast-notification");
    if (!toast) {
        toast = document.createElement("div");
        toast.id = "toast-notification";
        toast.className = "toast-notification";
        toast.innerHTML = `<i class="fa-solid fa-circle-check"></i> <span id="toast-message"></span>`;
        document.body.appendChild(toast);
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

// Visionneuse photo Lightbox partagée.
// images : tableau d'objets image ; itemSelector : sélecteur des vignettes cliquables ;
// renderCaption(imgData) : retourne le HTML de la légende.
function setupSharedLightbox(images, itemSelector, renderCaption) {
    const lightbox = document.getElementById("lightbox");
    const lightboxImg = document.getElementById("lightbox-img");
    const lightboxCaption = document.getElementById("lightbox-caption-text");
    const closeBtn = document.getElementById("lightbox-close-btn");
    const prevBtn = document.getElementById("lightbox-prev-btn");
    const nextBtn = document.getElementById("lightbox-next-btn");
    const items = document.querySelectorAll(itemSelector);

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
            lightboxCaption.innerHTML = renderCaption(imgData);
            loadCommentsPanel(imgData.url);
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

    /* Affectations directes (onclick / handler global) : la fonction peut être
       rappelée après un re-rendu de la grille (filtres) sans empiler les listeners */
    closeBtn.onclick = closeLightbox;
    prevBtn.onclick = showPrev;
    nextBtn.onclick = showNext;

    lightbox.onclick = (e) => {
        if (e.target === lightbox || e.target === lightbox.querySelector('.lightbox-content')) {
            closeLightbox();
        }
    };

    if (window.__lightboxKeyHandler) {
        document.removeEventListener("keydown", window.__lightboxKeyHandler);
    }
    window.__lightboxKeyHandler = (e) => {
        if (!lightbox.classList.contains("open")) return;
        if (e.key === "Escape") closeLightbox();
        else if (e.key === "ArrowLeft") showPrev();
        else if (e.key === "ArrowRight") showNext();
    };
    document.addEventListener("keydown", window.__lightboxKeyHandler);
}

/* --------------------------------------------------
   Commentaires sous chaque photo (lightbox)
   -------------------------------------------------- */
function escapeHtml(str) {
    return String(str || "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function getCommentsPanel() {
    const content = document.querySelector(".lightbox-content");
    if (!content) return null;
    let panel = document.getElementById("lightbox-comments");
    if (!panel) {
        panel = document.createElement("div");
        panel.id = "lightbox-comments";
        panel.className = "lightbox-comments";
        content.appendChild(panel);
    }
    return panel;
}

async function loadCommentsPanel(photoUrl) {
    const panel = getCommentsPanel();
    if (!panel) return;
    panel.dataset.photoUrl = photoUrl;
    panel.innerHTML = `<p class="lightbox-comments-loading">Chargement des commentaires…</p>`;

    let comments = [];
    try {
        const res = await fetch(`/api/comments?photoUrl=${encodeURIComponent(photoUrl)}`);
        comments = res.ok ? await res.json() : [];
    } catch {
        comments = [];
    }

    // Ignore la réponse si l'utilisateur a déjà changé de photo entre-temps
    if (panel.dataset.photoUrl !== photoUrl) return;

    const listHtml = comments.length
        ? comments.map(c => `
            <div class="comment-item">
                <span class="comment-author">${escapeHtml(c.anonyme || !c.nom ? "Anonyme" : c.nom)}</span>
                <p class="comment-message">${escapeHtml(c.message)}</p>
            </div>
        `).join("")
        : `<p class="lightbox-comments-empty">Aucun commentaire pour le moment.</p>`;

    panel.innerHTML = `
        <div class="lightbox-comments-list">${listHtml}</div>
        <form class="lightbox-comment-form">
            <label class="comment-anon-toggle">
                <input type="checkbox" class="comment-anon-checkbox" checked> Publier anonymement
            </label>
            <input type="text" class="comment-nom-input" placeholder="Votre nom" style="display:none;" maxlength="100">
            <textarea class="comment-message-input" placeholder="Votre commentaire…" rows="2" required maxlength="1000"></textarea>
            <button type="submit" class="admin-btn accent-btn btn-sm">Envoyer</button>
        </form>
    `;

    const form = panel.querySelector(".lightbox-comment-form");
    const anonCheckbox = panel.querySelector(".comment-anon-checkbox");
    const nomInput = panel.querySelector(".comment-nom-input");

    anonCheckbox.addEventListener("change", () => {
        nomInput.style.display = anonCheckbox.checked ? "none" : "block";
    });

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const messageInput = panel.querySelector(".comment-message-input");
        const message = messageInput.value.trim();
        if (!message) return;
        const anonyme = anonCheckbox.checked;
        const nom = anonyme ? "" : nomInput.value.trim();

        try {
            const res = await fetch("/api/comments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ photoUrl, anonyme, nom, message })
            });
            if (!res.ok) throw new Error();
            showToast("Commentaire envoyé — visible après validation par l'administrateur.");
            messageInput.value = "";
        } catch {
            showToast("Erreur lors de l'envoi du commentaire.");
        }
    });
}
