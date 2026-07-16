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
