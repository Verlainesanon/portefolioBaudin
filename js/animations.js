/* --------------------------------------------------
   PORTFOLIO GREGORY BAUDIN — ANIMATIONS & INTERACTION
   -------------------------------------------------- */

document.addEventListener("DOMContentLoaded", () => {
    // 1. Écran de Chargement / Loader Transition
    const loader = document.getElementById("loader");
    if (loader) {
        window.addEventListener("load", () => {
            hideLoader();
        });

        // Sécurité si l'événement 'load' met trop de temps
        setTimeout(() => {
            hideLoader();
        }, 1500);
    }

    // 2. Menu Hamburger Mobile
    const burgerBtn = document.getElementById("burger-btn");
    const mobileMenu = document.getElementById("mobile-menu");
    const mobileLinks = document.querySelectorAll(".mobile-link");

    if (burgerBtn && mobileMenu) {
        burgerBtn.addEventListener("click", () => {
            burgerBtn.classList.toggle("open");
            mobileMenu.classList.toggle("open");
            document.body.classList.toggle("no-scroll");
        });

        // Fermer le menu lors du clic sur un lien
        mobileLinks.forEach(link => {
            link.addEventListener("click", () => {
                burgerBtn.classList.remove("open");
                mobileMenu.classList.remove("open");
                document.body.classList.remove("no-scroll");
            });
        });
    }

    // 3. Changement d'apparence du Header au Scroll
    const header = document.querySelector(".main-header");
    if (header) {
        window.addEventListener("scroll", () => {
            if (window.scrollY > 40) {
                header.classList.add("scrolled");
            } else {
                header.classList.remove("scrolled");
            }
        });
    }

    // 6. Animation d'apparition des sections au défilement (Observer API)
    setupScrollAnimations();

    // 7. Marque le lien de navigation de la page courante comme actif
    markActiveNavLink();
});

// Marque comme actif le lien correspondant au fichier HTML courant
function markActiveNavLink() {
    let current = window.location.pathname.split("/").pop();
    if (current === "") current = "index.html";
    document.querySelectorAll(".desktop-nav a:not(.admin-link-btn), .mobile-link:not(.admin-link-btn)").forEach(link => {
        const href = link.getAttribute("href");
        if (href === current) {
            link.classList.add("active");
        }
    });
}

// Cache le loader en fondu
function hideLoader() {
    const loader = document.getElementById("loader");
    if (loader && !loader.classList.contains("fade-out")) {
        loader.classList.add("fade-out");
        document.body.classList.remove("loading");
    }
}

// Micro-animations d'apparition (Observer API)
function setupScrollAnimations() {
    const animationOptions = {
        threshold: 0.1,
        rootMargin: "0px 0px -80px 0px"
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("animated");
                observer.unobserve(entry.target);
            }
        });
    }, animationOptions);

    const animElements = document.querySelectorAll(
        ".section-header, .apropos-editorial-layout, .timeline-clean-item, .project-editorial-row, .galerie-masonry-wrapper, .contact-split-grid"
    );

    animElements.forEach(el => {
        el.classList.add("reveal-on-scroll");
        observer.observe(el);
    });
}
