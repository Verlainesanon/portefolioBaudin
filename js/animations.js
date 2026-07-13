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

    // 4. Parallax / Fondu Cinématique sur la section Hero
    const heroBg = document.getElementById("hero-bg-img");
    const heroContainer = document.querySelector(".hero-container");
    if (heroBg && heroContainer) {
        window.addEventListener("scroll", () => {
            const scrollPos = window.scrollY;
            const heroHeight = window.innerHeight;

            if (scrollPos <= heroHeight) {
                // Effet de zoom lent et de déplacement
                heroBg.style.transform = `scale(${1.02 + (scrollPos / heroHeight) * 0.08}) translateY(${scrollPos * 0.15}px)`;
                
                // Effet de fondu en noir
                heroBg.style.opacity = 1 - (scrollPos / heroHeight) * 0.85;

                // Fondu et déplacement léger du texte du Hero
                heroContainer.style.transform = `translateY(${scrollPos * 0.3}px)`;
                heroContainer.style.opacity = 1 - (scrollPos / heroHeight) * 1.5;
            }
        });
    }

    // 5. Détecteur de défilement pour la Navigation Active (uniquement sur l'index)
    if (document.querySelector(".hero-section")) {
        setupActiveNavOnScroll();
    }

    // 6. Animation d'apparition des sections au défilement (Observer API)
    setupScrollAnimations();
});

// Cache le loader en fondu
function hideLoader() {
    const loader = document.getElementById("loader");
    if (loader && !loader.classList.contains("fade-out")) {
        loader.classList.add("fade-out");
        document.body.classList.remove("loading");
    }
}

// Détecte quelle section est visible et active le lien de menu correspondant
function setupActiveNavOnScroll() {
    const sections = document.querySelectorAll("section[id]");
    const navLinks = document.querySelectorAll(".desktop-nav a:not(.admin-link-btn)");

    window.addEventListener("scroll", () => {
        let currentSectionId = "";
        const scrollPosition = window.scrollY + 250; // Offset

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                currentSectionId = section.getAttribute("id");
            }
        });

        navLinks.forEach(link => {
            link.classList.remove("active");
            if (link.getAttribute("href") === `#${currentSectionId}`) {
                link.classList.add("active");
            }
        });
    });
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
